import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'

export type DiagnosticLevel = 0 | 1 | 2 | 3 // OK | WARN | ERROR | STALE

export interface DiagnosticStatus {
  level: DiagnosticLevel
  name: string
  message: string
  hardware_id: string
  values: Array<{ key: string; value: string }>
}

export interface DiagnosticArray {
  header: {
    stamp: { sec: number; nanosec: number }
    frame_id: string
  }
  status: DiagnosticStatus[]
}

export interface ProcessedDiagnosticStatus extends DiagnosticStatus {
  sourceTopic: string
  timestamp: number
  cpuUsage?: number
  memoryUsage?: number
}

export interface NodeMetrics {
  name: string
  cpuUsage?: number
  memoryUsage?: number
  level: DiagnosticLevel
  message: string
  hardware_id: string
  sourceTopic: string
  lastUpdate: number
}

interface DiagnosticsState {
  // Diagnostic messages (merged from all topics by device name)
  diagnosticMessages: Map<string, ProcessedDiagnosticStatus>
  // Aggregated diagnostics from /diagnostics_agg
  aggregatedStatus: Map<string, ProcessedDiagnosticStatus>
  // Processed nodes with metrics
  nodes: Map<string, NodeMetrics>
  // Topic subscriptions
  subscribedTopics: Map<string, ROSLIB.Topic>
  // Default topics
  defaultTopics: string[]
  // Custom user-added topics
  customTopics: string[]
  // Subscription state
  isSubscribed: boolean
  isLoading: boolean
  // Last update timestamp per topic
  lastUpdate: Map<string, number>
  
  // Actions
  getActiveTopics: () => string[]
  validateTopic: (topicName: string) => Promise<boolean>
  processDiagnosticArray: (topicName: string, array: DiagnosticArray) => void
  subscribeToTopic: (topicName: string) => Promise<void>
  unsubscribeFromTopic: (topicName: string) => void
  subscribeAllDiagnostics: () => Promise<void>
  unsubscribeAllDiagnostics: () => void
  addCustomTopic: (topicName: string) => Promise<void>
  removeCustomTopic: (topicName: string) => void
  getNodeMetrics: (nodeName: string) => NodeMetrics | undefined
  getAllNodeNames: () => string[]
  verifyTopics: () => Promise<{ topicName: string; exists: boolean; subscribed: boolean; error?: string }[]>
}

const DIAGNOSTIC_MESSAGE_TYPE = 'diagnostic_msgs/DiagnosticArray'

export const useDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    (set, get) => ({
      diagnosticMessages: new Map(),
      aggregatedStatus: new Map(),
      nodes: new Map(),
      subscribedTopics: new Map(),
      defaultTopics: ['/diagnostics', '/diagnostics_agg'],
      customTopics: [],
      isSubscribed: false,
      isLoading: false,
      lastUpdate: new Map(),

      // Helper: Get all active topics
      getActiveTopics: () => {
        const { defaultTopics, customTopics } = get()
        return [...defaultTopics, ...customTopics]
      },

      // Helper: Validate topic exists and has correct message type
      validateTopic: async (topicName: string): Promise<boolean> => {
        const ros = useRosStore.getState().ros
        if (!ros) {
          throw new Error('ROS connection not available')
        }

        return new Promise((resolve, reject) => {
          ros.getTopicsAndRawTypes(
            (result: { types: string[]; topics: string[] }) => {
              const topicIndex = result.topics.indexOf(topicName)
              if (topicIndex === -1) {
                reject(new Error(`Topic ${topicName} does not exist`))
                return
              }

              const topicType = result.types[topicIndex]
              if (topicType !== DIAGNOSTIC_MESSAGE_TYPE) {
                reject(new Error(`Topic ${topicName} has incorrect message type. Expected ${DIAGNOSTIC_MESSAGE_TYPE}, got ${topicType}`))
                return
              }

              resolve(true)
            },
            (error: any) => {
              reject(new Error(`Failed to validate topic: ${error?.message || 'Unknown error'}`))
            }
          )
        })
      },

      // Process DiagnosticArray message
      processDiagnosticArray: (topicName: string, array: DiagnosticArray) => {
        const { diagnosticMessages, aggregatedStatus, nodes } = get()
        const timestamp = Date.now()
        const isAggregated = topicName === '/diagnostics_agg'

        const newDiagnosticMessages = new Map(diagnosticMessages)
        const newAggregatedStatus = new Map(aggregatedStatus)
        const newNodes = new Map(nodes)
        const newLastUpdate = new Map(get().lastUpdate)

        // Process each status in the array
        array.status.forEach((status) => {
          const processedStatus: ProcessedDiagnosticStatus = {
            ...status,
            sourceTopic: topicName,
            timestamp
          }

          // Extract CPU and memory metrics
          let cpuUsage: number | undefined
          let memoryUsage: number | undefined

          status.values.forEach((value) => {
            const key = value.key.toLowerCase()
            const val = parseFloat(value.value)

            if (!isNaN(val)) {
              if (key.includes('cpu') && (key.includes('usage') || key.includes('%'))) {
                cpuUsage = val
              }
              if (key.includes('memory') || (key.includes('mem') && (key.includes('usage') || key.includes('%')))) {
                memoryUsage = val
              }
            }
          })

          processedStatus.cpuUsage = cpuUsage
          processedStatus.memoryUsage = memoryUsage

          // Store in appropriate map
          if (isAggregated) {
            newAggregatedStatus.set(status.name, processedStatus)
          }
          
          // Always store in main diagnostic messages (latest wins)
          newDiagnosticMessages.set(status.name, processedStatus)

          // Update node metrics
          const nodeMetrics: NodeMetrics = {
            name: status.name,
            cpuUsage,
            memoryUsage,
            level: status.level,
            message: status.message,
            hardware_id: status.hardware_id,
            sourceTopic: topicName,
            lastUpdate: timestamp
          }
          newNodes.set(status.name, nodeMetrics)
        })

        newLastUpdate.set(topicName, timestamp)

        set({
          diagnosticMessages: newDiagnosticMessages,
          aggregatedStatus: isAggregated ? newAggregatedStatus : get().aggregatedStatus,
          nodes: newNodes,
          lastUpdate: newLastUpdate
        })
      },

      // Subscribe to a specific topic
      subscribeToTopic: async (topicName: string) => {
        const ros = useRosStore.getState().ros
        if (!ros) {
          throw new Error('ROS connection not available')
        }

        const { subscribedTopics } = get()
        
        // Already subscribed
        if (subscribedTopics.has(topicName)) {
          console.warn(`Already subscribed to topic: ${topicName}`)
          return
        }

        try {
          // Validate topic first
          await get().validateTopic(topicName)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Topic validation failed'
          toast.error(`Failed to validate topic ${topicName}: ${message}`)
          throw error
        }

        set({ isLoading: true })

        try {
          const topic = new ROSLIB.Topic({
            ros,
            name: topicName,
            messageType: DIAGNOSTIC_MESSAGE_TYPE
          })

          topic.subscribe((message: any) => {
            try {
              get().processDiagnosticArray(topicName, message as DiagnosticArray)
            } catch (error) {
              console.error(`Error processing diagnostic message from ${topicName}:`, error)
            }
          })

          const newSubscribedTopics = new Map(subscribedTopics)
          newSubscribedTopics.set(topicName, topic)

          set({
            subscribedTopics: newSubscribedTopics,
            isSubscribed: true,
            isLoading: false
          })

          console.log(`Successfully subscribed to diagnostic topic: ${topicName}`)
          toast.success(`Subscribed to ${topicName}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to subscribe'
          console.error(`Failed to subscribe to ${topicName}:`, error)
          toast.error(`Failed to subscribe to ${topicName}: ${message}`)
          set({ isLoading: false })
          throw error
        }
      },

      // Unsubscribe from a specific topic
      unsubscribeFromTopic: (topicName: string) => {
        const { subscribedTopics } = get()
        const topic = subscribedTopics.get(topicName)

        if (topic) {
          try {
            topic.unsubscribe()
            const newSubscribedTopics = new Map(subscribedTopics)
            newSubscribedTopics.delete(topicName)
            
            const newLastUpdate = new Map(get().lastUpdate)
            newLastUpdate.delete(topicName)

            set({
              subscribedTopics: newSubscribedTopics,
              lastUpdate: newLastUpdate,
              isSubscribed: newSubscribedTopics.size > 0
            })

            console.log(`Successfully unsubscribed from ${topicName}`)
            toast.info(`Unsubscribed from ${topicName}`)
          } catch (error) {
            console.error(`Failed to unsubscribe from ${topicName}:`, error)
          }
        }
      },

      // Subscribe to all active topics
      subscribeAllDiagnostics: async () => {
        const ros = useRosStore.getState().ros
        if (!ros || !ros.isConnected) {
          console.warn('ROS not connected, cannot subscribe to diagnostics')
          return
        }

        const { defaultTopics, customTopics } = get()
        const allTopics = [...defaultTopics, ...customTopics]

        set({ isLoading: true })

        try {
          // Subscribe to each topic
          const subscriptionPromises = allTopics.map((topicName) => {
            return get()
              .subscribeToTopic(topicName)
              .catch((error) => {
                console.error(`Failed to subscribe to ${topicName}:`, error)
                // Continue with other topics even if one fails
                return null
              })
          })

          await Promise.all(subscriptionPromises)
          set({ isLoading: false })
        } catch (error) {
          console.error('Error subscribing to diagnostics:', error)
          set({ isLoading: false })
        }
      },

      // Unsubscribe from all topics
      unsubscribeAllDiagnostics: () => {
        const { subscribedTopics } = get()

        subscribedTopics.forEach((topic, topicName) => {
          try {
            topic.unsubscribe()
          } catch (error) {
            console.error(`Error unsubscribing from ${topicName}:`, error)
          }
        })

        set({
          subscribedTopics: new Map(),
          isSubscribed: false,
          isLoading: false
        })

        console.log('Unsubscribed from all diagnostic topics')
      },

      // Add custom topic
      addCustomTopic: async (topicName: string) => {
        const { customTopics, subscribedTopics } = get()

        // Normalize topic name
        const normalizedName = topicName.trim()

        if (!normalizedName) {
          toast.error('Topic name cannot be empty')
          throw new Error('Topic name cannot be empty')
        }

        // Check if already exists
        if (customTopics.includes(normalizedName)) {
          toast.error(`Topic ${normalizedName} already in custom topics`)
          throw new Error('Topic already exists')
        }

        // Check if it's a default topic
        if (get().defaultTopics.includes(normalizedName)) {
          toast.error(`${normalizedName} is already a default topic`)
          throw new Error('Topic is already a default topic')
        }

        try {
          // Validate topic
          await get().validateTopic(normalizedName)

          // Add to custom topics
          const newCustomTopics = [...customTopics, normalizedName]
          set({ customTopics: newCustomTopics })

          // Auto-subscribe if ROS is connected
          const ros = useRosStore.getState().ros
          if (ros && ros.isConnected && !subscribedTopics.has(normalizedName)) {
            await get().subscribeToTopic(normalizedName)
          }

          toast.success(`Added topic ${normalizedName}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add topic'
          toast.error(`Failed to add topic: ${message}`)
          throw error
        }
      },

      // Remove custom topic
      removeCustomTopic: (topicName: string) => {
        const { customTopics } = get()
        
        if (!customTopics.includes(topicName)) {
          toast.error(`Topic ${topicName} not found in custom topics`)
          return
        }

        // Unsubscribe if currently subscribed
        get().unsubscribeFromTopic(topicName)

        // Remove from custom topics
        const newCustomTopics = customTopics.filter((t) => t !== topicName)
        set({ customTopics: newCustomTopics })

        toast.success(`Removed topic ${topicName}`)
      },

      // Get node metrics
      getNodeMetrics: (nodeName: string): NodeMetrics | undefined => {
        return get().nodes.get(nodeName)
      },

      // Get all node names
      getAllNodeNames: (): string[] => {
        return Array.from(get().nodes.keys())
      },

      // Verify topics - check if they exist and are subscribed
      verifyTopics: async (): Promise<{ topicName: string; exists: boolean; subscribed: boolean; error?: string }[]> => {
        const ros = useRosStore.getState().ros
        if (!ros || !ros.isConnected) {
          throw new Error('ROS connection not available')
        }

        const { defaultTopics, customTopics, subscribedTopics } = get()
        const allTopics = [...defaultTopics, ...customTopics]

        return new Promise((resolve) => {
          ros.getTopicsAndRawTypes(
            (result: { types: string[]; topics: string[] }) => {
              const verificationResults = allTopics.map((topicName) => {
                const exists = result.topics.includes(topicName)
                const subscribed = subscribedTopics.has(topicName)
                const topicIndex = result.topics.indexOf(topicName)
                
                let error: string | undefined
                if (!exists) {
                  error = 'Topic does not exist'
                } else if (topicIndex >= 0) {
                  const topicType = result.types[topicIndex]
                  if (topicType !== DIAGNOSTIC_MESSAGE_TYPE) {
                    error = `Wrong message type: ${topicType}`
                  }
                }

                return {
                  topicName,
                  exists,
                  subscribed,
                  error
                }
              })

              resolve(verificationResults)
            },
            (error: any) => {
              // If getTopics fails, return all topics as non-existent
              const verificationResults = allTopics.map((topicName) => ({
                topicName,
                exists: false,
                subscribed: subscribedTopics.has(topicName),
                error: `Failed to verify: ${error?.message || 'Unknown error'}`
              }))
              resolve(verificationResults)
            }
          )
        })
      }
    }),
    {
      name: 'diagnostics-storage',
      partialize: (state) => ({
        customTopics: state.customTopics
      })
    }
  )
)

