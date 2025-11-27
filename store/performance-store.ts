import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'
import { enableMapSet } from 'immer'

enableMapSet()

// Types
export interface MetricDataPoint {
  timestamp: number
  value: number
}

export interface MetricStats {
  current: number
  min: number
  max: number
  avg: number
}

export interface TopicFrequency {
  topicName: string
  messageCount: number
  frequency: number // messages per second
  lastMessageTime: number
  timestamps: number[] // rolling window for frequency calculation
}

export interface PerformanceTopicConfig {
  name: string
  messageType: string
}

interface PerformanceState {
  // Time-series data (rolling window)
  cpuHistory: MetricDataPoint[]
  memoryHistory: MetricDataPoint[]
  networkTxHistory: MetricDataPoint[]
  networkRxHistory: MetricDataPoint[]

  // Current stats
  cpuStats: MetricStats | null
  memoryStats: MetricStats | null
  networkTxStats: MetricStats | null
  networkRxStats: MetricStats | null

  // Topic frequency tracking
  topicFrequencies: Map<string, TopicFrequency>

  // Configuration
  sourceTopicConfig: PerformanceTopicConfig
  maxHistoryLength: number
  frequencyWindowMs: number // Time window for frequency calculation

  // Subscription state
  subscribedTopic: ROSLIB.Topic | null
  isSubscribed: boolean
  isLoading: boolean
  lastUpdate: number | null

  // Actions
  setSourceTopicConfig: (config: PerformanceTopicConfig) => void
  subscribe: () => Promise<void>
  unsubscribe: () => void
  processMessage: (message: any) => void
  trackTopicMessage: (topicName: string) => void
  clearHistory: () => void
  getTopicFrequencyList: () => TopicFrequency[]
}

const DEFAULT_TOPIC_CONFIG: PerformanceTopicConfig = {
  name: '/diagnostics',
  messageType: 'diagnostic_msgs/msg/DiagnosticArray'
}

const MAX_HISTORY_LENGTH = 100
const FREQUENCY_WINDOW_MS = 5000 // 5 second window for frequency calculation

// Helper to calculate stats from history
function calculateStats(history: MetricDataPoint[]): MetricStats | null {
  if (history.length === 0) return null

  const values = history.map(d => d.value)
  const current = values[values.length - 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length

  return { current, min, max, avg }
}

// Helper to extract metric value from diagnostic values
function extractMetricValue(
  values: Array<{ key: string; value: string }>,
  keywords: string[]
): number | null {
  for (const v of values) {
    const key = v.key.toLowerCase()
    if (keywords.some(kw => key.includes(kw))) {
      const parsed = parseFloat(v.value)
      if (!isNaN(parsed)) return parsed
    }
  }
  return null
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      cpuHistory: [],
      memoryHistory: [],
      networkTxHistory: [],
      networkRxHistory: [],

      cpuStats: null,
      memoryStats: null,
      networkTxStats: null,
      networkRxStats: null,

      topicFrequencies: new Map(),

      sourceTopicConfig: DEFAULT_TOPIC_CONFIG,
      maxHistoryLength: MAX_HISTORY_LENGTH,
      frequencyWindowMs: FREQUENCY_WINDOW_MS,

      subscribedTopic: null,
      isSubscribed: false,
      isLoading: false,
      lastUpdate: null,

      // Set source topic configuration
      setSourceTopicConfig: (config: PerformanceTopicConfig) => {
        const { isSubscribed } = get()

        // If currently subscribed, unsubscribe first
        if (isSubscribed) {
          get().unsubscribe()
        }

        set({ sourceTopicConfig: config })

        // Re-subscribe with new config
        const ros = useRosStore.getState().ros
        if (ros && ros.isConnected) {
          get().subscribe()
        }
      },

      // Subscribe to performance topic
      subscribe: async () => {
        const ros = useRosStore.getState().ros
        if (!ros || !ros.isConnected) {
          console.warn('ROS not connected, cannot subscribe to performance topic')
          return
        }

        const { sourceTopicConfig, subscribedTopic } = get()

        // Already subscribed to this topic
        if (subscribedTopic) {
          console.warn(`Already subscribed to performance topic: ${sourceTopicConfig.name}`)
          return
        }

        set({ isLoading: true })

        try {
          const topic = new ROSLIB.Topic({
            ros,
            name: sourceTopicConfig.name,
            messageType: sourceTopicConfig.messageType
          })

          topic.subscribe((message: any) => {
            get().processMessage(message)
          })

          set({
            subscribedTopic: topic,
            isSubscribed: true,
            isLoading: false
          })

          console.log(`Subscribed to performance topic: ${sourceTopicConfig.name}`)
          toast.success(`Subscribed to ${sourceTopicConfig.name}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to subscribe'
          console.error(`Failed to subscribe to performance topic:`, error)
          toast.error(`Failed to subscribe: ${message}`)
          set({ isLoading: false })
        }
      },

      // Unsubscribe from performance topic
      unsubscribe: () => {
        const { subscribedTopic, sourceTopicConfig } = get()

        if (subscribedTopic) {
          try {
            subscribedTopic.unsubscribe()
            set({
              subscribedTopic: null,
              isSubscribed: false
            })
            console.log(`Unsubscribed from performance topic: ${sourceTopicConfig.name}`)
            toast.info(`Unsubscribed from ${sourceTopicConfig.name}`)
          } catch (error) {
            console.error('Failed to unsubscribe from performance topic:', error)
          }
        }
      },

      // Process incoming diagnostic message
      processMessage: (message: any) => {
        const timestamp = Date.now()
        const { maxHistoryLength, sourceTopicConfig } = get()

        // Track frequency for this topic
        get().trackTopicMessage(sourceTopicConfig.name)

        // Process DiagnosticArray message
        if (message.status && Array.isArray(message.status)) {
          let cpuValue: number | null = null
          let memoryValue: number | null = null
          let networkTxValue: number | null = null
          let networkRxValue: number | null = null

          // Extract metrics from all status entries
          for (const status of message.status) {
            if (!status.values || !Array.isArray(status.values)) continue

            // CPU usage
            if (cpuValue === null) {
              cpuValue = extractMetricValue(status.values, ['cpu', 'processor'])
            }

            // Memory usage
            if (memoryValue === null) {
              memoryValue = extractMetricValue(status.values, ['memory', 'mem', 'ram'])
            }

            // Network TX
            if (networkTxValue === null) {
              networkTxValue = extractMetricValue(status.values, ['tx', 'transmit', 'send', 'upload'])
            }

            // Network RX
            if (networkRxValue === null) {
              networkRxValue = extractMetricValue(status.values, ['rx', 'receive', 'download'])
            }
          }

          set((state) => {
            // Update CPU history
            if (cpuValue !== null) {
              state.cpuHistory.push({ timestamp, value: cpuValue })
              if (state.cpuHistory.length > maxHistoryLength) {
                state.cpuHistory.shift()
              }
              state.cpuStats = calculateStats(state.cpuHistory)
            }

            // Update memory history
            if (memoryValue !== null) {
              state.memoryHistory.push({ timestamp, value: memoryValue })
              if (state.memoryHistory.length > maxHistoryLength) {
                state.memoryHistory.shift()
              }
              state.memoryStats = calculateStats(state.memoryHistory)
            }

            // Update network TX history
            if (networkTxValue !== null) {
              state.networkTxHistory.push({ timestamp, value: networkTxValue })
              if (state.networkTxHistory.length > maxHistoryLength) {
                state.networkTxHistory.shift()
              }
              state.networkTxStats = calculateStats(state.networkTxHistory)
            }

            // Update network RX history
            if (networkRxValue !== null) {
              state.networkRxHistory.push({ timestamp, value: networkRxValue })
              if (state.networkRxHistory.length > maxHistoryLength) {
                state.networkRxHistory.shift()
              }
              state.networkRxStats = calculateStats(state.networkRxHistory)
            }

            state.lastUpdate = timestamp
          })
        }
      },

      // Track message for frequency calculation
      trackTopicMessage: (topicName: string) => {
        const now = Date.now()
        const { frequencyWindowMs, topicFrequencies } = get()

        set((state) => {
          const existing = state.topicFrequencies.get(topicName)

          if (existing) {
            // Filter timestamps within the window
            const windowStart = now - frequencyWindowMs
            const filteredTimestamps = existing.timestamps.filter(t => t > windowStart)
            filteredTimestamps.push(now)

            // Calculate frequency (messages per second)
            const windowDuration = Math.min(
              now - (filteredTimestamps[0] || now),
              frequencyWindowMs
            ) / 1000
            const frequency = windowDuration > 0
              ? filteredTimestamps.length / windowDuration
              : 0

            state.topicFrequencies.set(topicName, {
              topicName,
              messageCount: existing.messageCount + 1,
              frequency,
              lastMessageTime: now,
              timestamps: filteredTimestamps
            })
          } else {
            state.topicFrequencies.set(topicName, {
              topicName,
              messageCount: 1,
              frequency: 0,
              lastMessageTime: now,
              timestamps: [now]
            })
          }
        })
      },

      // Clear all history
      clearHistory: () => {
        set({
          cpuHistory: [],
          memoryHistory: [],
          networkTxHistory: [],
          networkRxHistory: [],
          cpuStats: null,
          memoryStats: null,
          networkTxStats: null,
          networkRxStats: null,
          topicFrequencies: new Map(),
          lastUpdate: null
        })
      },

      // Get topic frequencies as array
      getTopicFrequencyList: () => {
        return Array.from(get().topicFrequencies.values())
      }
    })),
    {
      name: 'performance-storage',
      partialize: (state) => ({
        sourceTopicConfig: state.sourceTopicConfig,
        maxHistoryLength: state.maxHistoryLength
      })
    }
  )
)

