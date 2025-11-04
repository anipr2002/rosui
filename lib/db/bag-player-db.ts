import Dexie, { Table } from 'dexie'
import { liveCaptureDB, type RecordingSession, type MessageRecord } from './live-capture-db'

// Uploaded bag file metadata
export interface UploadedBag {
  id?: number
  name: string
  fileName: string
  uploadTime: number
  startTime: number
  endTime: number
  duration: number
  topics: BagTopic[]
  messageCount: number
  sizeBytes: number
  source: 'upload' | 'indexeddb'
  // For uploaded files, we store the file reference
  fileData?: ArrayBuffer
}

export interface BagTopic {
  name: string
  type: string
  messageCount: number
  messageDefinition?: string
}

// Unified recording interface for both sources
export interface UnifiedRecording {
  id: number
  name: string
  startTime: number
  endTime: number | null
  duration: number
  topics: Array<{ name: string; type: string }>
  messageCount: number
  sizeBytes: number
  source: 'indexeddb' | 'upload'
  description?: string
}

class BagPlayerDatabase extends Dexie {
  uploadedBags!: Table<UploadedBag, number>

  constructor() {
    super('BagPlayerDB')

    this.version(1).stores({
      uploadedBags: '++id, name, uploadTime, startTime'
    })
  }

  // Get all recordings (both IndexedDB and uploaded)
  async getAllRecordings(): Promise<UnifiedRecording[]> {
    const indexedDBRecordings = await liveCaptureDB.recordings.toArray()
    const uploadedBags = await this.uploadedBags.toArray()

    const unified: UnifiedRecording[] = []

    // Convert IndexedDB recordings
    for (const rec of indexedDBRecordings) {
      unified.push({
        id: rec.id!,
        name: rec.name,
        startTime: rec.startTime,
        endTime: rec.endTime,
        duration: rec.endTime ? rec.endTime - rec.startTime : 0,
        topics: rec.topics,
        messageCount: rec.messageCount,
        sizeBytes: rec.sizeBytes,
        source: 'indexeddb',
        description: rec.description
      })
    }

    // Convert uploaded bags
    for (const bag of uploadedBags) {
      unified.push({
        id: bag.id!,
        name: bag.name,
        startTime: bag.startTime,
        endTime: bag.endTime,
        duration: bag.duration,
        topics: bag.topics.map(t => ({ name: t.name, type: t.type })),
        messageCount: bag.messageCount,
        sizeBytes: bag.sizeBytes,
        source: 'upload'
      })
    }

    // Sort by start time descending (most recent first)
    return unified.sort((a, b) => b.startTime - a.startTime)
  }

  // Get messages for a recording (works for both sources)
  async getRecordingMessages(recording: UnifiedRecording): Promise<MessageRecord[]> {
    if (recording.source === 'indexeddb') {
      return liveCaptureDB.getMessages(recording.id)
    } else {
      // For uploaded bags, we need to parse from the stored file
      const bag = await this.uploadedBags.get(recording.id)
      if (!bag || !bag.fileData) {
        throw new Error('Bag file data not found')
      }
      // This will be populated when we parse the bag file
      // For now, return empty array - actual parsing will happen in store
      return []
    }
  }

  // Store uploaded bag file
  async storeUploadedBag(
    name: string,
    fileName: string,
    fileData: ArrayBuffer,
    metadata: {
      startTime: number
      endTime: number
      topics: BagTopic[]
      messageCount: number
    }
  ): Promise<number> {
    const bag: UploadedBag = {
      name,
      fileName,
      uploadTime: Date.now(),
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      duration: metadata.endTime - metadata.startTime,
      topics: metadata.topics,
      messageCount: metadata.messageCount,
      sizeBytes: fileData.byteLength,
      source: 'upload',
      fileData
    }

    return this.uploadedBags.add(bag)
  }

  // Delete a recording (works for both sources)
  async deleteRecording(recording: UnifiedRecording): Promise<void> {
    if (recording.source === 'indexeddb') {
      await liveCaptureDB.deleteRecording(recording.id)
    } else {
      await this.uploadedBags.delete(recording.id)
    }
  }

  // Get uploaded bag by ID
  async getUploadedBag(id: number): Promise<UploadedBag | undefined> {
    return this.uploadedBags.get(id)
  }

  // Search recordings by name
  async searchRecordings(query: string): Promise<UnifiedRecording[]> {
    const allRecordings = await this.getAllRecordings()
    const lowerQuery = query.toLowerCase()
    
    return allRecordings.filter(rec => 
      rec.name.toLowerCase().includes(lowerQuery) ||
      rec.topics.some(t => t.name.toLowerCase().includes(lowerQuery))
    )
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalRecordings: number
    indexedDBCount: number
    uploadedCount: number
    totalSize: number
    usage: number
    quota: number
  }> {
    const allRecordings = await this.getAllRecordings()
    const indexedDBCount = allRecordings.filter(r => r.source === 'indexeddb').length
    const uploadedCount = allRecordings.filter(r => r.source === 'upload').length
    const totalSize = allRecordings.reduce((sum, r) => sum + r.sizeBytes, 0)

    let usage = 0
    let quota = 0

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      usage = estimate.usage || 0
      quota = estimate.quota || 0
    }

    return {
      totalRecordings: allRecordings.length,
      indexedDBCount,
      uploadedCount,
      totalSize,
      usage,
      quota
    }
  }
}

// Export singleton instance
export const bagPlayerDB = new BagPlayerDatabase()

// Helper function to convert ROS timestamp to milliseconds
export function rosTimeToMs(rosTime: { sec: number; nanosec: number }): number {
  return rosTime.sec * 1000 + rosTime.nanosec / 1000000
}

// Helper function to convert milliseconds to ROS timestamp
export function msToRosTime(ms: number): { sec: number; nanosec: number } {
  const sec = Math.floor(ms / 1000)
  const nanosec = (ms % 1000) * 1000000
  return { sec, nanosec }
}

// Helper to format timestamp for display
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

// Helper to calculate message frequency
export function calculateFrequency(messageCount: number, durationMs: number): number {
  if (durationMs === 0) return 0
  return messageCount / (durationMs / 1000)
}

