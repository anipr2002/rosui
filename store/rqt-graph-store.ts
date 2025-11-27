import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'

export interface NodeInfo {
  name: string
}

export interface TopicInfo {
  name: string
  type: string
}

export interface ConnectionInfo {
  node: string
  topic: string
  direction: 'publish' | 'subscribe'
}

interface RQTGraphState {
  // Graph data
  nodes: NodeInfo[]
  topics: TopicInfo[]
  connections: ConnectionInfo[]
  isLoading: boolean
  lastUpdate: number

  // Actions
  fetchGraphData: () => Promise<void>
  cleanup: () => void
}

export const useRQTGraphStore = create<RQTGraphState>((set, get) => ({
  nodes: [],
  topics: [],
  connections: [],
  isLoading: false,
  lastUpdate: 0,

  fetchGraphData: async () => {
    const { isLoading } = get()
    if (isLoading) return

    const ros = useRosStore.getState().ros
    if (!ros) {
      toast.error('ROS connection not available')
      console.error('ROS connection not available')
      return
    }

    set({ isLoading: true })

    try {
      // Fetch nodes and topics in parallel
      const [nodesData, topicsData] = await Promise.all([
        // Get nodes
        new Promise<string[]>((resolve, reject) => {
          ros.getNodes(
            (nodes) => resolve(nodes),
            (error) => reject(error)
          )
        }),
        // Get topics and types
        new Promise<{ topics: string[]; types: string[] }>((resolve, reject) => {
          ros.getTopicsAndRawTypes(
            (result: { types: string[]; topics: string[]; typedefs_full_text: string[] }) => {
              resolve({
                topics: result.topics,
                types: result.types
              })
            },
            (error) => reject(error)
          )
        })
      ])

      // Build node info array
      const nodeInfos: NodeInfo[] = nodesData.map(name => ({ name }))

      // Build topic info array
      const topicInfos: TopicInfo[] = topicsData.topics.map((topic, index) => ({
        name: topic,
        type: topicsData.types[index]
      }))

      // Get system state to determine publishers and subscribers
      const systemStateService = new ROSLIB.Service({
        ros,
        name: '/rosapi/topics_and_raw_types',
        serviceType: 'rosapi/TopicsAndRawTypes'
      })

      // We need to call getTopicType for each topic to get publisher/subscriber info
      // This is done by examining the topic connections
      const connectionPromises = topicsData.topics.map(async (topicName) => {
        return new Promise<{ publishers: string[]; subscribers: string[] }>((resolve) => {
          // Use Service to get topic details
          const detailService = new ROSLIB.Service({
            ros,
            name: '/rosapi/topic_type',
            serviceType: 'rosapi/TopicType'
          })

          // Create a topic object to get connection info
          const topic = new ROSLIB.Topic({
            ros,
            name: topicName,
            messageType: topicsData.types[topicsData.topics.indexOf(topicName)]
          })

          // Get connections - we'll use a workaround since roslibjs doesn't expose this directly
          // We'll need to track this through system state
          // For now, return empty arrays and we'll populate via a different method
          resolve({ publishers: [], subscribers: [] })
        })
      })

      // Alternative approach: Use rosapi service to get node details
      const nodeConnectionPromises = nodesData.map(async (nodeName) => {
        return new Promise<{
          node: string
          publications: string[]
          subscriptions: string[]
        }>((resolve) => {
          const nodeService = new ROSLIB.Service({
            ros,
            name: '/rosapi/node_details',
            serviceType: 'rosapi/NodeDetails'
          })

          const request = new ROSLIB.ServiceRequest({
            node: nodeName
          })

          nodeService.callService(
            request,
            (result: any) => {
              resolve({
                node: nodeName,
                publications: result.publishing || [],
                subscriptions: result.subscribing || []
              })
            },
            () => {
              // If service call fails, return empty
              resolve({
                node: nodeName,
                publications: [],
                subscriptions: []
              })
            }
          )
        })
      })

      const nodeConnections = await Promise.all(nodeConnectionPromises)

      // Build connections array
      const connections: ConnectionInfo[] = []
      nodeConnections.forEach(({ node, publications, subscriptions }) => {
        publications.forEach((topic: string) => {
          connections.push({
            node,
            topic,
            direction: 'publish'
          })
        })
        subscriptions.forEach((topic: string) => {
          connections.push({
            node,
            topic,
            direction: 'subscribe'
          })
        })
      })

      set({
        nodes: nodeInfos,
        topics: topicInfos,
        connections,
        isLoading: false,
        lastUpdate: Date.now()
      })

      console.log(`Loaded ${nodeInfos.length} nodes, ${topicInfos.length} topics, ${connections.length} connections`)
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
      toast.error('Failed to fetch graph data')
      set({ isLoading: false })
    }
  },

  cleanup: () => {
    set({
      nodes: [],
      topics: [],
      connections: [],
      isLoading: false,
      lastUpdate: 0
    })
  }
}))

