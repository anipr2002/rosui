import Dexie, { Table } from "dexie";

// Recording session metadata
export interface RecordingSession {
  id?: number;
  name: string;
  description: string;
  startTime: number;
  endTime: number | null;
  status: "recording" | "stopped";
  topics: RecordingTopic[];
  messageCount: number;
  sizeBytes: number;
  settings: RecordingSettings;
}

export interface RecordingTopic {
  name: string;
  type: string;
}

export interface RecordingSettings {
  sizeLimitBytes: number;
  exportFormats: ExportFormat[];
  throttleMs?: number;
}

export type ExportFormat = "mcap" | "ros2-json" | "simple-json";

// Message record
export interface MessageRecord {
  id?: number;
  recordingId: number;
  topicName: string;
  topicType: string;
  timestamp: number; // browser timestamp
  rosTimestamp: { sec: number; nanosec: number };
  data: any; // message payload
  sizeBytes: number;
}

// Topic statistics
export interface TopicStats {
  topicName: string;
  messageCount: number;
  totalSize: number;
  firstMessage: number;
  lastMessage: number;
}

class LiveCaptureDatabase extends Dexie {
  recordings!: Table<RecordingSession, number>;
  messages!: Table<MessageRecord, number>;

  constructor() {
    super("LiveCaptureDB");

    this.version(1).stores({
      recordings: "++id, status, startTime, endTime",
      messages:
        "++id, recordingId, topicName, timestamp, [recordingId+topicName]",
    });
  }

  // Get current storage usage estimate
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      return { usage, quota, percentage };
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }

  // Calculate size of a message
  calculateMessageSize(message: any): number {
    try {
      // UTF-16 encoding: 2 bytes per character
      return JSON.stringify(message).length * 2;
    } catch (error) {
      console.error("Error calculating message size:", error);
      return 0;
    }
  }

  // Add message to recording
  async addMessage(
    recordingId: number,
    topicName: string,
    topicType: string,
    data: any,
    rosTimestamp: { sec: number; nanosec: number }
  ): Promise<void> {
    const timestamp = Date.now();
    const sizeBytes = this.calculateMessageSize(data);

    const message: MessageRecord = {
      recordingId,
      topicName,
      topicType,
      timestamp,
      rosTimestamp,
      data,
      sizeBytes,
    };

    await this.messages.add(message);

    // Update recording stats
    const recording = await this.recordings.get(recordingId);
    if (recording) {
      await this.recordings.update(recordingId, {
        messageCount: recording.messageCount + 1,
        sizeBytes: recording.sizeBytes + sizeBytes,
      });
    }
  }

  // Batch add messages (more efficient)
  async addMessagesBatch(messages: Omit<MessageRecord, "id">[]): Promise<void> {
    if (messages.length === 0) return;

    const recordingId = messages[0].recordingId;

    // Add all messages
    await this.messages.bulkAdd(messages);

    // Calculate total size and count
    const totalSize = messages.reduce((sum, msg) => sum + msg.sizeBytes, 0);
    const count = messages.length;

    // Update recording stats
    const recording = await this.recordings.get(recordingId);
    if (recording) {
      await this.recordings.update(recordingId, {
        messageCount: recording.messageCount + count,
        sizeBytes: recording.sizeBytes + totalSize,
      });
    }
  }

  // Get messages for a recording
  async getMessages(
    recordingId: number,
    limit?: number
  ): Promise<MessageRecord[]> {
    let query = this.messages.where("recordingId").equals(recordingId);
    if (limit) {
      query = query.limit(limit);
    }
    return query.toArray();
  }

  // Get messages by topic
  async getMessagesByTopic(
    recordingId: number,
    topicName: string
  ): Promise<MessageRecord[]> {
    return this.messages
      .where("[recordingId+topicName]")
      .equals([recordingId, topicName])
      .toArray();
  }

  // Get topic statistics for a recording
  async getTopicStats(recordingId: number): Promise<TopicStats[]> {
    const messages = await this.getMessages(recordingId);

    const statsMap = new Map<string, TopicStats>();

    messages.forEach((msg) => {
      const existing = statsMap.get(msg.topicName);

      if (existing) {
        existing.messageCount += 1;
        existing.totalSize += msg.sizeBytes;
        existing.lastMessage = msg.timestamp;
      } else {
        statsMap.set(msg.topicName, {
          topicName: msg.topicName,
          messageCount: 1,
          totalSize: msg.sizeBytes,
          firstMessage: msg.timestamp,
          lastMessage: msg.timestamp,
        });
      }
    });

    return Array.from(statsMap.values());
  }

  // Delete recording and all its messages
  async deleteRecording(recordingId: number): Promise<void> {
    await this.transaction("rw", this.messages, this.recordings, async () => {
      await this.messages.where("recordingId").equals(recordingId).delete();
      await this.recordings.delete(recordingId);
    });
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.transaction("rw", this.messages, this.recordings, async () => {
      await this.messages.clear();
      await this.recordings.clear();
    });
  }

  // Get recording size
  async getRecordingSize(recordingId: number): Promise<number> {
    const recording = await this.recordings.get(recordingId);
    return recording?.sizeBytes || 0;
  }

  // Check if recording exceeds size limit
  async checkSizeLimit(
    recordingId: number
  ): Promise<{
    exceeded: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    const recording = await this.recordings.get(recordingId);
    if (!recording) {
      return { exceeded: false, current: 0, limit: 0, percentage: 0 };
    }

    const current = recording.sizeBytes;
    const limit = recording.settings.sizeLimitBytes;
    const percentage = (current / limit) * 100;
    const exceeded = current >= limit;

    return { exceeded, current, limit, percentage };
  }
}

// Export singleton instance
export const liveCaptureDB = new LiveCaptureDatabase();

// Helper functions for size formatting
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function parseSizeToBytes(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return value * (units[unit] || 0);
}

// Preset size limits
export const SIZE_PRESETS = {
  "100MB": 100 * 1024 * 1024,
  "500MB": 500 * 1024 * 1024,
  "1GB": 1024 * 1024 * 1024,
  "2GB": 2 * 1024 * 1024 * 1024,
  "5GB": 5 * 1024 * 1024 * 1024,
};
