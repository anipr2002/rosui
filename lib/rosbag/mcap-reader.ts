import { McapIndexedReader } from '@mcap/core'
import { BlobReadable } from '@mcap/browser'

export interface McapTopic {
  name: string
  type: string
  schemaId: number
  messageCount: number
}

export interface McapMessage {
  topic: string
  timestamp: bigint
  logTime: bigint
  data: any
  schemaName: string
}

export interface McapMetadata {
  startTime: bigint
  endTime: bigint
  duration: number
  topics: McapTopic[]
  totalMessages: number
  profile: string
  library: string
}

export interface ParsedMcapFile {
  metadata: McapMetadata
  messages: McapMessage[]
}

/**
 * Parse an MCAP file and extract all messages and metadata
 * @param file - The MCAP file to parse
 * @param onProgress - Optional callback for progress updates
 * @returns Parsed MCAP data with messages and metadata
 */
export async function parseMcapFile(
  file: File,
  onProgress?: (progress: { status: string; messagesRead?: number }) => void
): Promise<ParsedMcapFile> {
  try {
    onProgress?.({ status: 'Reading MCAP file...' })

    // Create a BlobReadable from the browser File
    const readable = new BlobReadable(file)
    
    onProgress?.({ status: 'Parsing MCAP structure...' })

    // Create indexed reader
    const reader = await McapIndexedReader.Initialize({ readable })
    
    // Storage for parsed data
    const schemas = new Map<number, { name: string; encoding: string; data: Uint8Array }>()
    const channels = new Map<number, { topic: string; schemaId: number; messageEncoding: string }>()
    const topicMessageCounts = new Map<string, number>()
    const messages: McapMessage[] = []
    
    let startTime: bigint | undefined
    let endTime: bigint | undefined
    let profile = reader.header?.profile || 'unknown'
    let library = reader.header?.library || 'unknown'

    // Read schemas
    for (const [id, schema] of reader.schemasById) {
      schemas.set(id, {
        name: schema.name,
        encoding: schema.encoding,
        data: schema.data
      })
    }

    // Read channels
    for (const [id, channel] of reader.channelsById) {
      channels.set(id, {
        topic: channel.topic,
        schemaId: channel.schemaId,
        messageEncoding: channel.messageEncoding
      })
    }

    onProgress?.({ status: 'Reading messages...' })

    // Read all messages
    for await (const message of reader.readMessages()) {
      const channel = channels.get(message.channelId)
      if (!channel) {
        console.warn(`Message for unknown channel: ${message.channelId}`)
        continue
      }

      const schema = schemas.get(channel.schemaId)
      if (!schema) {
        console.warn(`Channel references unknown schema: ${channel.schemaId}`)
        continue
      }

      // Track timing
      if (startTime === undefined || message.logTime < startTime) {
        startTime = message.logTime
      }
      if (endTime === undefined || message.logTime > endTime) {
        endTime = message.logTime
      }

      // Count messages per topic
      topicMessageCounts.set(
        channel.topic,
        (topicMessageCounts.get(channel.topic) || 0) + 1
      )

      // Deserialize message data
      let messageData: any
      try {
        // For ROS2 messages, we need to deserialize the CDR data
        if (channel.messageEncoding === 'cdr') {
          // For now, store raw data - we'll deserialize on demand
          messageData = message.data
        } else if (channel.messageEncoding === 'json') {
          const decoder = new TextDecoder()
          messageData = JSON.parse(decoder.decode(message.data))
        } else {
          messageData = message.data
        }
      } catch (error) {
        console.warn(`Failed to deserialize message for ${channel.topic}:`, error)
        messageData = message.data
      }

      messages.push({
        topic: channel.topic,
        timestamp: message.publishTime || message.logTime,
        logTime: message.logTime,
        data: messageData,
        schemaName: schema.name
      })

      // Progress updates every 100 messages
      if (messages.length % 100 === 0) {
        onProgress?.({
          status: 'Reading messages...',
          messagesRead: messages.length
        })
      }
    }

    // Build topics metadata
    const topics: McapTopic[] = Array.from(topicMessageCounts.entries()).map(
      ([topic, messageCount]) => {
        // Find the channel for this topic
        const channel = Array.from(channels.values()).find(c => c.topic === topic)
        const schema = channel ? schemas.get(channel.schemaId) : undefined

        return {
          name: topic,
          type: schema?.name || 'unknown',
          schemaId: channel?.schemaId || 0,
          messageCount
        }
      }
    )

    const metadata: McapMetadata = {
      startTime: startTime || 0n,
      endTime: endTime || 0n,
      duration: Number((endTime || 0n) - (startTime || 0n)) / 1e9, // Convert to seconds
      topics,
      totalMessages: messages.length,
      profile,
      library
    }

    onProgress?.({ status: 'Complete!', messagesRead: messages.length })

    return { metadata, messages }
  } catch (error) {
    console.error('Error parsing MCAP file:', error)
    throw new Error(
      `Failed to parse MCAP file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Deserialize a CDR-encoded ROS2 message
 * This is a simplified deserializer for common message types
 */
export function deserializeCdrMessage(data: Uint8Array, schemaName: string): any {
  // For basic numeric types (like std_msgs/Float64)
  if (schemaName.includes('Float64')) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    // Skip CDR header (4 bytes)
    const value = view.getFloat64(4, true) // true for little-endian
    return { data: value }
  }

  if (schemaName.includes('Float32')) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const value = view.getFloat32(4, true)
    return { data: value }
  }

  if (schemaName.includes('Int32')) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const value = view.getInt32(4, true)
    return { data: value }
  }

  if (schemaName.includes('Int64')) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const value = view.getBigInt64(4, true)
    return { data: Number(value) }
  }

  // For other types, return raw data for now
  return { _raw: data }
}

/**
 * Convert bigint timestamp to milliseconds
 */
export function timestampToMs(timestamp: bigint): number {
  return Number(timestamp / 1000000n)
}

/**
 * Convert bigint timestamp to seconds
 */
export function timestampToSeconds(timestamp: bigint): number {
  return Number(timestamp) / 1e9
}

/**
 * Format timestamp as HH:MM:SS.mmm
 */
export function formatTimestamp(timestamp: bigint, startTime: bigint): string {
  const relativeNs = Number(timestamp - startTime)
  const seconds = Math.floor(relativeNs / 1e9)
  const milliseconds = Math.floor((relativeNs % 1e9) / 1e6)
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const hh = hours.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  const ss = secs.toString().padStart(2, '0')
  const mmm = milliseconds.toString().padStart(3, '0')

  return `${hh}:${mm}:${ss}.${mmm}`
}

/**
 * Get messages for a specific topic
 */
export function getMessagesForTopic(
  messages: McapMessage[],
  topic: string
): McapMessage[] {
  return messages.filter(msg => msg.topic === topic)
}

/**
 * Get messages within a time range
 */
export function getMessagesInTimeRange(
  messages: McapMessage[],
  startTime: bigint,
  endTime: bigint
): McapMessage[] {
  return messages.filter(
    msg => msg.logTime >= startTime && msg.logTime <= endTime
  )
}

/**
 * Get messages for a topic within a time range
 */
export function getTopicMessagesInTimeRange(
  messages: McapMessage[],
  topic: string,
  startTime: bigint,
  endTime: bigint
): McapMessage[] {
  return messages.filter(
    msg =>
      msg.topic === topic &&
      msg.logTime >= startTime &&
      msg.logTime <= endTime
  )
}

