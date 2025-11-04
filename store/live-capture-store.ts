import { create } from "zustand";
import ROSLIB from "roslib";
import { toast } from "sonner";
import { useRosStore } from "./ros-store";
import { useTopicsStore } from "./topic-store";
import {
  liveCaptureDB,
  type RecordingSession,
  type RecordingTopic,
  type RecordingSettings,
  type MessageRecord,
  type ExportFormat,
  formatBytes,
} from "@/lib/db/live-capture-db";

export type RecordingStatus = "idle" | "recording" | "stopped";

interface TopicSubscription {
  topic: ROSLIB.Topic;
  name: string;
  type: string;
}

interface LiveCaptureState {
  // Recording state
  status: RecordingStatus;
  currentRecording: RecordingSession | null;
  currentRecordingId: number | null;

  // Topic selection
  selectedTopics: RecordingTopic[];

  // Subscriptions
  subscriptions: Map<string, TopicSubscription>;

  // Message buffer (batch writes)
  messageBuffer: Omit<MessageRecord, "id">[];
  bufferSize: number;
  maxBufferSize: number;

  // Settings
  settings: RecordingSettings;

  // Statistics
  stats: {
    messagesPerSecond: Map<string, number>;
    totalMessages: number;
    currentSize: number;
    duration: number;
  };

  // Timer
  startTime: number | null;
  timerInterval: NodeJS.Timeout | null;
  statsInterval: NodeJS.Timeout | null;

  // Actions
  setSelectedTopics: (topics: RecordingTopic[]) => void;
  setSettings: (settings: Partial<RecordingSettings>) => void;
  startRecording: (name: string, description?: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;

  // Internal actions
  subscribeToTopics: () => Promise<void>;
  unsubscribeFromTopics: () => void;
  handleMessage: (topicName: string, topicType: string, message: any) => void;
  flushBuffer: () => Promise<void>;
  updateStats: () => void;

  // Export
  exportRecording: (
    recordingId: number,
    formats: ExportFormat[]
  ) => Promise<void>;

  // Cleanup
  reset: () => void;
}

export const useLiveCaptureStore = create<LiveCaptureState>((set, get) => ({
  status: "idle",
  currentRecording: null,
  currentRecordingId: null,
  selectedTopics: [],
  subscriptions: new Map(),
  messageBuffer: [],
  bufferSize: 0,
  maxBufferSize: 100,
  settings: {
    sizeLimitBytes: 500 * 1024 * 1024, // 500MB default
    exportFormats: ["simple-json"],
    throttleMs: 0,
  },
  stats: {
    messagesPerSecond: new Map(),
    totalMessages: 0,
    currentSize: 0,
    duration: 0,
  },
  startTime: null,
  timerInterval: null,
  statsInterval: null,

  setSelectedTopics: (topics: RecordingTopic[]) => {
    set({ selectedTopics: topics });
  },

  setSettings: (settings: Partial<RecordingSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...settings },
    }));
  },

  startRecording: async (name: string, description = "") => {
    const { selectedTopics, settings, subscribeToTopics } = get();

    console.log("[LiveCapture] Starting recording...", {
      name,
      selectedTopics: selectedTopics.length,
    });

    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic to record");
      return;
    }

    const rosState = useRosStore.getState();
    const ros = rosState.ros;
    const isConnected = rosState.status === "connected";

    if (!ros || !isConnected) {
      toast.error("ROS connection not available");
      return;
    }

    try {
      // Create recording session
      const recording: RecordingSession = {
        name,
        description,
        startTime: Date.now(),
        endTime: null,
        status: "recording",
        topics: selectedTopics,
        messageCount: 0,
        sizeBytes: 0,
        settings,
      };

      console.log("[LiveCapture] Creating recording in DB...");
      const recordingId = await liveCaptureDB.recordings.add(recording);
      console.log("[LiveCapture] Recording created with ID:", recordingId);

      const savedRecording = await liveCaptureDB.recordings.get(recordingId);
      console.log("[LiveCapture] Recording retrieved:", savedRecording);

      set({
        currentRecording: savedRecording || null,
        currentRecordingId: recordingId,
        status: "recording",
        startTime: Date.now(),
        stats: {
          messagesPerSecond: new Map(),
          totalMessages: 0,
          currentSize: 0,
          duration: 0,
        },
      });

      // Subscribe to topics
      console.log("[LiveCapture] Subscribing to topics...");
      await subscribeToTopics();
      console.log("[LiveCapture] Subscribed to topics");

      // Start timer for duration
      const timerInterval = setInterval(() => {
        const { startTime } = get();
        if (startTime) {
          set((state) => ({
            stats: {
              ...state.stats,
              duration: Date.now() - startTime,
            },
          }));
        }
      }, 1000);

      // Start stats calculation interval
      const statsInterval = setInterval(() => {
        get().updateStats();
      }, 1000);

      set({ timerInterval, statsInterval });

      toast.success(`Recording started: ${name}`);
      console.log("[LiveCapture] Recording started successfully");
    } catch (error) {
      console.error("[LiveCapture] Failed to start recording:", error);
      toast.error("Failed to start recording");
      throw error;
    }
  },

  stopRecording: async () => {
    const {
      currentRecordingId,
      timerInterval,
      statsInterval,
      flushBuffer,
      unsubscribeFromTopics,
    } = get();

    console.log("[LiveCapture] Stopping recording...", { currentRecordingId });

    if (!currentRecordingId) {
      console.warn("[LiveCapture] No active recording to stop");
      toast.warning("No active recording");
      return;
    }

    try {
      // First, update UI state immediately for better UX
      set({ status: "idle" });

      // Unsubscribe from topics to stop receiving messages
      unsubscribeFromTopics();
      console.log("[LiveCapture] Unsubscribed from topics");

      // Clear timers
      if (timerInterval) {
        clearInterval(timerInterval);
        console.log("[LiveCapture] Cleared timer interval");
      }
      if (statsInterval) {
        clearInterval(statsInterval);
        console.log("[LiveCapture] Cleared stats interval");
      }

      // Flush remaining messages
      console.log("[LiveCapture] Flushing buffer...");
      await flushBuffer();
      console.log("[LiveCapture] Buffer flushed");

      // Update recording in database
      const endTime = Date.now();
      console.log("[LiveCapture] Updating recording in DB...", { endTime });

      const recording = await liveCaptureDB.recordings.get(currentRecordingId);
      if (recording) {
        await liveCaptureDB.recordings.put({
          ...recording,
          status: "stopped",
          endTime: endTime,
        });
        console.log("[LiveCapture] Recording updated successfully");
      } else {
        console.error(
          "[LiveCapture] Recording not found in DB:",
          currentRecordingId
        );
      }

      // Update final state
      set({
        status: "stopped",
        timerInterval: null,
        statsInterval: null,
      });

      toast.success("Recording stopped successfully");
      console.log("[LiveCapture] Recording stopped successfully");
    } catch (error) {
      console.error("[LiveCapture] Failed to stop recording:", error);
      toast.error(
        `Failed to stop recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Even if there's an error, try to clean up
      set({
        status: "stopped",
        timerInterval: null,
        statsInterval: null,
      });
    }
  },

  pauseRecording: () => {
    const { unsubscribeFromTopics } = get();
    unsubscribeFromTopics();
    set({ status: "idle" });
    toast.info("Recording paused");
  },

  resumeRecording: () => {
    const { subscribeToTopics } = get();
    subscribeToTopics();
    set({ status: "recording" });
    toast.info("Recording resumed");
  },

  subscribeToTopics: async () => {
    const { selectedTopics, handleMessage } = get();
    const ros = useRosStore.getState().ros;

    if (!ros) {
      throw new Error("ROS connection not available");
    }

    const newSubscriptions = new Map<string, TopicSubscription>();

    for (const topicInfo of selectedTopics) {
      const topic = new ROSLIB.Topic({
        ros,
        name: topicInfo.name,
        messageType: topicInfo.type,
      });

      topic.subscribe((message: any) => {
        handleMessage(topicInfo.name, topicInfo.type, message);
      });

      newSubscriptions.set(topicInfo.name, {
        topic,
        name: topicInfo.name,
        type: topicInfo.type,
      });
    }

    set({ subscriptions: newSubscriptions });
  },

  unsubscribeFromTopics: () => {
    const { subscriptions } = get();

    subscriptions.forEach((sub) => {
      sub.topic.unsubscribe();
    });

    set({ subscriptions: new Map() });
  },

  handleMessage: (topicName: string, topicType: string, message: any) => {
    const {
      currentRecordingId,
      messageBuffer,
      maxBufferSize,
      flushBuffer,
      settings,
    } = get();

    if (!currentRecordingId) return;

    // Extract ROS timestamp if available
    let rosTimestamp = { sec: 0, nanosec: 0 };
    if (message.header && message.header.stamp) {
      rosTimestamp = {
        sec: message.header.stamp.sec || message.header.stamp.secs || 0,
        nanosec:
          message.header.stamp.nanosec || message.header.stamp.nsecs || 0,
      };
    }

    const timestamp = Date.now();
    const sizeBytes = liveCaptureDB.calculateMessageSize(message);

    const messageRecord: Omit<MessageRecord, "id"> = {
      recordingId: currentRecordingId,
      topicName,
      topicType,
      timestamp,
      rosTimestamp,
      data: message,
      sizeBytes,
    };

    const newBuffer = [...messageBuffer, messageRecord];
    const newBufferSize = messageBuffer.length + 1;

    set({
      messageBuffer: newBuffer,
      bufferSize: newBufferSize,
      stats: {
        ...get().stats,
        totalMessages: get().stats.totalMessages + 1,
        currentSize: get().stats.currentSize + sizeBytes,
      },
    });

    // Flush buffer if it reaches max size
    if (newBufferSize >= maxBufferSize) {
      flushBuffer();
    }

    // Check size limit
    const { currentSize } = get().stats;
    if (currentSize >= settings.sizeLimitBytes) {
      toast.warning("Size limit reached. Stopping recording.");
      get().stopRecording();
    }
  },

  flushBuffer: async () => {
    const { messageBuffer } = get();

    if (messageBuffer.length === 0) return;

    try {
      await liveCaptureDB.addMessagesBatch(messageBuffer);
      set({ messageBuffer: [], bufferSize: 0 });
    } catch (error) {
      console.error("Failed to flush message buffer:", error);
      toast.error("Failed to save messages");
    }
  },

  updateStats: () => {
    const { stats } = get();

    // Calculate messages per second per topic
    // This is a simplified version - in production you'd track message counts over time
    const messagesPerSecond = new Map<string, number>();

    // For now, just reset to 0 - this would be calculated from recent message timestamps
    stats.messagesPerSecond.forEach((value, key) => {
      messagesPerSecond.set(key, 0);
    });

    set((state) => ({
      stats: {
        ...state.stats,
        messagesPerSecond,
      },
    }));
  },

  exportRecording: async (recordingId: number, formats: ExportFormat[]) => {
    try {
      const recording = await liveCaptureDB.recordings.get(recordingId);
      if (!recording) {
        toast.error("Recording not found");
        return;
      }

      const messages = await liveCaptureDB.getMessages(recordingId);

      for (const format of formats) {
        switch (format) {
          case "simple-json":
            await exportSimpleJSON(recording, messages);
            break;
          case "ros2-json":
            await exportROS2JSON(recording, messages);
            break;
          case "mcap":
            await exportMCAP(recording, messages);
            break;
        }
      }

      toast.success("Export completed");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  },

  reset: () => {
    const { unsubscribeFromTopics, timerInterval, statsInterval } = get();

    unsubscribeFromTopics();

    if (timerInterval) clearInterval(timerInterval);
    if (statsInterval) clearInterval(statsInterval);

    set({
      status: "idle",
      currentRecording: null,
      currentRecordingId: null,
      selectedTopics: [],
      subscriptions: new Map(),
      messageBuffer: [],
      bufferSize: 0,
      stats: {
        messagesPerSecond: new Map(),
        totalMessages: 0,
        currentSize: 0,
        duration: 0,
      },
      startTime: null,
      timerInterval: null,
      statsInterval: null,
    });
  },
}));

// Export helper functions

async function exportSimpleJSON(
  recording: RecordingSession,
  messages: MessageRecord[]
) {
  const exportData = messages.map((msg) => ({
    topic: msg.topicName,
    type: msg.topicType,
    timestamp: msg.timestamp,
    rosTimestamp: msg.rosTimestamp,
    data: msg.data,
  }));

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${recording.name}-simple-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportROS2JSON(
  recording: RecordingSession,
  messages: MessageRecord[]
) {
  // Get type definitions from topic store
  const typeDefinitions = useTopicsStore.getState().typeDefinitions;

  const topicTypes = new Map<string, string>();
  recording.topics.forEach((t) => {
    topicTypes.set(t.name, t.type);
  });

  const exportData = {
    version: "1.0",
    metadata: {
      name: recording.name,
      description: recording.description,
      startTime: recording.startTime,
      endTime: recording.endTime,
      duration: recording.endTime ? recording.endTime - recording.startTime : 0,
      messageCount: recording.messageCount,
      sizeBytes: recording.sizeBytes,
    },
    topics: recording.topics.map((t) => ({
      name: t.name,
      type: t.type,
      messageDefinition: typeDefinitions.get(t.type) || "",
    })),
    messages: messages.map((msg) => ({
      topic: msg.topicName,
      timestamp: msg.timestamp,
      rosTimestamp: msg.rosTimestamp,
      data: msg.data,
    })),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${recording.name}-ros2-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportMCAP(
  recording: RecordingSession,
  messages: MessageRecord[]
) {
  // MCAP export would require the @foxglove/mcap library
  // For now, we'll create a placeholder that exports as JSON with MCAP-like structure
  toast.info(
    "MCAP export is not yet fully implemented. Exporting as ROS2 JSON instead."
  );
  await exportROS2JSON(recording, messages);
}

// Helper to format duration
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
