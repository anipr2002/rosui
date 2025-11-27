import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'

// ROS2 Lifecycle States
export type LifecycleState = 
  | 'unknown'
  | 'unconfigured'
  | 'inactive'
  | 'active'
  | 'finalized'

// ROS2 Lifecycle Transitions
export type LifecycleTransition = 
  | 'configure'
  | 'cleanup'
  | 'activate'
  | 'deactivate'
  | 'shutdown'

// Transition IDs as per ROS2 lifecycle
export const TRANSITION_IDS: Record<LifecycleTransition, number> = {
  configure: 1,
  cleanup: 2,
  activate: 3,
  deactivate: 4,
  shutdown: 5
}

// State IDs as per ROS2 lifecycle
export const STATE_IDS: Record<number, LifecycleState> = {
  0: 'unknown',
  1: 'unconfigured',
  2: 'inactive',
  3: 'active',
  4: 'finalized'
}

// Available transitions from each state
export const AVAILABLE_TRANSITIONS: Record<LifecycleState, LifecycleTransition[]> = {
  unknown: [],
  unconfigured: ['configure', 'shutdown'],
  inactive: ['cleanup', 'activate', 'shutdown'],
  active: ['deactivate', 'shutdown'],
  finalized: []
}

export interface TransitionEvent {
  id: string
  fromState: LifecycleState
  toState: LifecycleState
  transition: LifecycleTransition | string
  timestamp: number
  success: boolean
  errorMessage?: string
}

export interface NodeDetails {
  publications: Array<{ name: string; type: string }>
  subscriptions: Array<{ name: string; type: string }>
  services: Array<{ name: string; type: string }>
  actions: Array<{ name: string; type: string }>
}

export interface LifecycleNodeInfo {
  name: string
  namespace: string
  fullPath: string
  isLifecycleNode: boolean
  currentState: LifecycleState
  availableTransitions: LifecycleTransition[]
  transitionHistory: TransitionEvent[]
  lastSeen: number
  isHealthy: boolean
  details: NodeDetails | null
  isLoadingState: boolean
  isTransitioning: boolean
}

interface LifecycleNodesState {
  // Node data
  nodes: Map<string, LifecycleNodeInfo>
  lifecycleNodes: Map<string, LifecycleNodeInfo>
  
  // Loading states
  isLoading: boolean
  isPolling: boolean
  pollingInterval: NodeJS.Timeout | null
  
  // Selected node for details
  selectedNodeName: string | null
  
  // Stats
  lastUpdate: number
  nodeCount: number
  lifecycleNodeCount: number
  
  // Actions
  fetchAllNodes: () => Promise<void>
  fetchNodeDetails: (nodeName: string) => Promise<NodeDetails | null>
  fetchLifecycleState: (nodeName: string) => Promise<LifecycleState | null>
  triggerTransition: (nodeName: string, transition: LifecycleTransition) => Promise<boolean>
  startPolling: (intervalMs?: number) => void
  stopPolling: () => void
  selectNode: (nodeName: string | null) => void
  cleanup: () => void
}

export const useLifecycleNodesStore = create<LifecycleNodesState>((set, get) => ({
  nodes: new Map(),
  lifecycleNodes: new Map(),
  isLoading: false,
  isPolling: false,
  pollingInterval: null,
  selectedNodeName: null,
  lastUpdate: 0,
  nodeCount: 0,
  lifecycleNodeCount: 0,

  fetchAllNodes: async () => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      console.error('ROS connection not available')
      return
    }

    set({ isLoading: true })

    try {
      // Get all nodes
      const nodeNames = await new Promise<string[]>((resolve, reject) => {
        ros.getNodes(
          (nodes) => resolve(nodes),
          (error) => reject(error)
        )
      })

      const now = Date.now()
      const newNodes = new Map<string, LifecycleNodeInfo>()
      const newLifecycleNodes = new Map<string, LifecycleNodeInfo>()

      // Process each node
      const nodePromises = nodeNames.map(async (fullPath) => {
        // Parse namespace and name
        const parts = fullPath.split('/')
        const name = parts[parts.length - 1]
        const namespace = parts.slice(0, -1).join('/') || '/'

        // Check if this is a lifecycle node by trying to get its state
        const existingNode = get().nodes.get(fullPath)
        
        const nodeInfo: LifecycleNodeInfo = {
          name,
          namespace,
          fullPath,
          isLifecycleNode: existingNode?.isLifecycleNode ?? false,
          currentState: existingNode?.currentState ?? 'unknown',
          availableTransitions: existingNode?.availableTransitions ?? [],
          transitionHistory: existingNode?.transitionHistory ?? [],
          lastSeen: now,
          isHealthy: true,
          details: existingNode?.details ?? null,
          isLoadingState: false,
          isTransitioning: false
        }

        // Try to fetch lifecycle state
        const state = await get().fetchLifecycleState(fullPath)
        if (state && state !== 'unknown') {
          nodeInfo.isLifecycleNode = true
          nodeInfo.currentState = state
          nodeInfo.availableTransitions = AVAILABLE_TRANSITIONS[state]
          
          // Add transition event if state changed
          if (existingNode && existingNode.currentState !== state) {
            const transitionEvent: TransitionEvent = {
              id: `${fullPath}-${now}`,
              fromState: existingNode.currentState,
              toState: state,
              transition: 'state_change',
              timestamp: now,
              success: true
            }
            nodeInfo.transitionHistory = [...nodeInfo.transitionHistory, transitionEvent]
          }
        }

        return nodeInfo
      })

      const processedNodes = await Promise.all(nodePromises)

      processedNodes.forEach((nodeInfo) => {
        newNodes.set(nodeInfo.fullPath, nodeInfo)
        if (nodeInfo.isLifecycleNode) {
          newLifecycleNodes.set(nodeInfo.fullPath, nodeInfo)
        }
      })

      set({
        nodes: newNodes,
        lifecycleNodes: newLifecycleNodes,
        isLoading: false,
        lastUpdate: now,
        nodeCount: newNodes.size,
        lifecycleNodeCount: newLifecycleNodes.size
      })

    } catch (error) {
      console.error('Failed to fetch nodes:', error)
      set({ isLoading: false })
    }
  },

  fetchNodeDetails: async (nodeName: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) return null

    try {
      const nodeService = new ROSLIB.Service({
        ros,
        name: '/rosapi/node_details',
        serviceType: 'rosapi/NodeDetails'
      })

      const result = await new Promise<any>((resolve, reject) => {
        const request = new ROSLIB.ServiceRequest({ node: nodeName })
        nodeService.callService(
          request,
          (response) => resolve(response),
          (error) => reject(error)
        )
      })

      const details: NodeDetails = {
        publications: (result.publishing || []).map((name: string) => ({ name, type: '' })),
        subscriptions: (result.subscribing || []).map((name: string) => ({ name, type: '' })),
        services: (result.services || []).map((name: string) => ({ name, type: '' })),
        actions: []
      }

      // Update the node with details
      const { nodes, lifecycleNodes } = get()
      const node = nodes.get(nodeName)
      if (node) {
        const updatedNode = { ...node, details }
        const newNodes = new Map(nodes)
        newNodes.set(nodeName, updatedNode)
        
        if (node.isLifecycleNode) {
          const newLifecycleNodes = new Map(lifecycleNodes)
          newLifecycleNodes.set(nodeName, updatedNode)
          set({ nodes: newNodes, lifecycleNodes: newLifecycleNodes })
        } else {
          set({ nodes: newNodes })
        }
      }

      return details
    } catch (error) {
      console.error(`Failed to fetch details for ${nodeName}:`, error)
      return null
    }
  },

  fetchLifecycleState: async (nodeName: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) return null

    try {
      // ROS2 lifecycle nodes expose a get_state service
      const getStateService = new ROSLIB.Service({
        ros,
        name: `${nodeName}/get_state`,
        serviceType: 'lifecycle_msgs/srv/GetState'
      })

      const result = await new Promise<any>((resolve, reject) => {
        const request = new ROSLIB.ServiceRequest({})
        
        // Set a timeout for the service call
        const timeout = setTimeout(() => {
          reject(new Error('Service call timeout'))
        }, 2000)

        getStateService.callService(
          request,
          (response) => {
            clearTimeout(timeout)
            resolve(response)
          },
          (error) => {
            clearTimeout(timeout)
            reject(error)
          }
        )
      })

      // ROS2 lifecycle state response has current_state.id and current_state.label
      const stateId = result.current_state?.id
      return STATE_IDS[stateId] || 'unknown'
    } catch {
      // Not a lifecycle node or service not available
      return null
    }
  },

  triggerTransition: async (nodeName: string, transition: LifecycleTransition) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      toast.error('ROS connection not available')
      return false
    }

    const { nodes, lifecycleNodes } = get()
    const node = nodes.get(nodeName)
    if (!node) {
      toast.error(`Node ${nodeName} not found`)
      return false
    }

    // Update node to show transitioning state
    const updateNode = (updates: Partial<LifecycleNodeInfo>) => {
      const newNodes = new Map(get().nodes)
      const newLifecycleNodes = new Map(get().lifecycleNodes)
      const currentNode = newNodes.get(nodeName)
      if (currentNode) {
        const updatedNode = { ...currentNode, ...updates }
        newNodes.set(nodeName, updatedNode)
        if (currentNode.isLifecycleNode) {
          newLifecycleNodes.set(nodeName, updatedNode)
        }
        set({ nodes: newNodes, lifecycleNodes: newLifecycleNodes })
      }
    }

    updateNode({ isTransitioning: true })
    const previousState = node.currentState

    try {
      const changeStateService = new ROSLIB.Service({
        ros,
        name: `${nodeName}/change_state`,
        serviceType: 'lifecycle_msgs/srv/ChangeState'
      })

      const transitionId = TRANSITION_IDS[transition]
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = new ROSLIB.ServiceRequest({
          transition: { id: transitionId, label: transition }
        })

        changeStateService.callService(
          request,
          (response) => resolve(response),
          (error) => reject(error)
        )
      })

      const success = result.success
      const now = Date.now()

      if (success) {
        // Fetch the new state
        const newState = await get().fetchLifecycleState(nodeName)
        
        const transitionEvent: TransitionEvent = {
          id: `${nodeName}-${now}`,
          fromState: previousState,
          toState: newState || 'unknown',
          transition,
          timestamp: now,
          success: true
        }

        updateNode({
          isTransitioning: false,
          currentState: newState || previousState,
          availableTransitions: AVAILABLE_TRANSITIONS[newState || previousState],
          transitionHistory: [...node.transitionHistory, transitionEvent]
        })

        toast.success(`${transition} completed for ${node.name}`)
        return true
      } else {
        const transitionEvent: TransitionEvent = {
          id: `${nodeName}-${now}`,
          fromState: previousState,
          toState: previousState,
          transition,
          timestamp: now,
          success: false,
          errorMessage: 'Transition failed'
        }

        updateNode({
          isTransitioning: false,
          transitionHistory: [...node.transitionHistory, transitionEvent]
        })

        toast.error(`${transition} failed for ${node.name}`)
        return false
      }
    } catch (error) {
      const now = Date.now()
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      const transitionEvent: TransitionEvent = {
        id: `${nodeName}-${now}`,
        fromState: previousState,
        toState: previousState,
        transition,
        timestamp: now,
        success: false,
        errorMessage
      }

      updateNode({
        isTransitioning: false,
        transitionHistory: [...node.transitionHistory, transitionEvent]
      })

      toast.error(`Failed to ${transition} ${node.name}: ${errorMessage}`)
      return false
    }
  },

  startPolling: (intervalMs = 5000) => {
    const { isPolling, pollingInterval } = get()
    
    if (isPolling && pollingInterval) {
      return
    }

    // Initial fetch
    get().fetchAllNodes()

    // Start polling
    const interval = setInterval(() => {
      get().fetchAllNodes()
    }, intervalMs)

    set({ isPolling: true, pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    set({ isPolling: false, pollingInterval: null })
  },

  selectNode: (nodeName: string | null) => {
    set({ selectedNodeName: nodeName })
    
    if (nodeName) {
      get().fetchNodeDetails(nodeName)
    }
  },

  cleanup: () => {
    get().stopPolling()
    set({
      nodes: new Map(),
      lifecycleNodes: new Map(),
      isLoading: false,
      selectedNodeName: null,
      lastUpdate: 0,
      nodeCount: 0,
      lifecycleNodeCount: 0
    })
  }
}))

