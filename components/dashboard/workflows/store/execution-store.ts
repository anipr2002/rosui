import { create } from 'zustand'
import { Edge } from 'reactflow'
import { WorkflowNode, WorkflowNodeData } from './workflow-store'

export type ExecutionState = 'idle' | 'running' | 'paused' | 'stopped'
export type NodeExecutionStatus = 'idle' | 'queued' | 'running' | 'success' | 'failure' | 'skipped'

export interface NodeExecutionResult {
  nodeId: string
  status: NodeExecutionStatus
  output?: any
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface ExecutionContext {
  // Variables passed between nodes
  variables: Record<string, any>
  // Last message received from trigger
  triggerData?: any
  // Execution run ID
  runId: string
  // Start time
  startedAt: number
}

export interface TriggerSubscription {
  nodeId: string
  type: 'topic' | 'interval' | 'manual'
  config: {
    topicName?: string
    messageType?: string
    interval?: number
  }
  active: boolean
  intervalId?: NodeJS.Timeout
  unsubscribe?: () => void
}

interface ExecutionStore {
  // Execution state
  executionState: ExecutionState
  currentContext: ExecutionContext | null
  
  // Node execution tracking
  nodeResults: Map<string, NodeExecutionResult>
  executionQueue: string[]
  currentNodeId: string | null
  
  // Trigger management
  triggers: Map<string, TriggerSubscription>
  triggersArmed: boolean
  
  // Execution history
  executionHistory: Array<{
    runId: string
    startedAt: number
    completedAt?: number
    status: 'success' | 'failure' | 'cancelled'
    nodeResults: Map<string, NodeExecutionResult>
  }>
  
  // Actions
  startExecution: (nodes: WorkflowNode[], edges: Edge[]) => void
  pauseExecution: () => void
  resumeExecution: () => void
  stopExecution: () => void
  
  // Node status updates
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus, output?: any, error?: string) => void
  getNodeStatus: (nodeId: string) => NodeExecutionStatus
  
  // Queue management
  getNextNode: () => string | null
  advanceQueue: () => void
  
  // Context management
  setVariable: (key: string, value: any) => void
  getVariable: (key: string) => any
  setTriggerData: (data: any) => void
  
  // Trigger management
  registerTrigger: (subscription: TriggerSubscription) => void
  unregisterTrigger: (nodeId: string) => void
  armTriggers: () => void
  disarmTriggers: () => void
  fireTrigger: (nodeId: string, data: any) => void
  
  // Reset
  reset: () => void
}

// Topological sort to determine execution order
function topologicalSort(nodes: WorkflowNode[], edges: Edge[]): string[] {
  const graph = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  // Build adjacency list
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || []
    neighbors.push(edge.target)
    graph.set(edge.source, neighbors)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // Find nodes with no incoming edges (triggers/start nodes)
  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })
  
  const sorted: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)
    
    const neighbors = graph.get(current) || []
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    })
  }
  
  return sorted
}

// Get downstream nodes from a specific node
function getDownstreamNodes(startNodeId: string, nodes: WorkflowNode[], edges: Edge[]): string[] {
  const visited = new Set<string>()
  const result: string[] = []
  const queue: string[] = [startNodeId]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    
    // Find all edges from this node
    edges.forEach(edge => {
      if (edge.source === current && !visited.has(edge.target)) {
        result.push(edge.target)
        queue.push(edge.target)
      }
    })
  }
  
  // Sort by topological order
  const fullOrder = topologicalSort(nodes, edges)
  return result.sort((a, b) => fullOrder.indexOf(a) - fullOrder.indexOf(b))
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  executionState: 'idle',
  currentContext: null,
  nodeResults: new Map(),
  executionQueue: [],
  currentNodeId: null,
  triggers: new Map(),
  triggersArmed: false,
  executionHistory: [],
  
  startExecution: (nodes: WorkflowNode[], edges: Edge[]) => {
    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const executionOrder = topologicalSort(nodes, edges)
    
    // Initialize all nodes as queued
    const nodeResults = new Map<string, NodeExecutionResult>()
    executionOrder.forEach(nodeId => {
      nodeResults.set(nodeId, {
        nodeId,
        status: 'queued'
      })
    })
    
    set({
      executionState: 'running',
      currentContext: {
        variables: {},
        runId,
        startedAt: Date.now()
      },
      nodeResults,
      executionQueue: executionOrder,
      currentNodeId: null
    })
  },
  
  pauseExecution: () => {
    set({ executionState: 'paused' })
  },
  
  resumeExecution: () => {
    const { executionState } = get()
    if (executionState === 'paused') {
      set({ executionState: 'running' })
    }
  },
  
  stopExecution: () => {
    const { currentContext, nodeResults, executionHistory } = get()
    
    // Save to history if we have a context
    if (currentContext) {
      const historyEntry = {
        runId: currentContext.runId,
        startedAt: currentContext.startedAt,
        completedAt: Date.now(),
        status: 'cancelled' as const,
        nodeResults: new Map(nodeResults)
      }
      
      set({
        executionHistory: [...executionHistory, historyEntry]
      })
    }
    
    set({
      executionState: 'stopped',
      executionQueue: [],
      currentNodeId: null
    })
  },
  
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus, output?: any, error?: string) => {
    const { nodeResults } = get()
    const existing = nodeResults.get(nodeId) || { nodeId, status: 'idle' }
    
    const updated: NodeExecutionResult = {
      ...existing,
      status,
      output,
      error,
      startedAt: status === 'running' ? Date.now() : existing.startedAt,
      completedAt: ['success', 'failure', 'skipped'].includes(status) ? Date.now() : undefined
    }
    
    const newResults = new Map(nodeResults)
    newResults.set(nodeId, updated)
    
    set({ nodeResults: newResults })
  },
  
  getNodeStatus: (nodeId: string) => {
    const { nodeResults } = get()
    return nodeResults.get(nodeId)?.status || 'idle'
  },
  
  getNextNode: () => {
    const { executionQueue } = get()
    return executionQueue[0] || null
  },
  
  advanceQueue: () => {
    const { executionQueue } = get()
    const [, ...remaining] = executionQueue
    set({
      executionQueue: remaining,
      currentNodeId: remaining[0] || null
    })
  },
  
  setVariable: (key: string, value: any) => {
    const { currentContext } = get()
    if (currentContext) {
      set({
        currentContext: {
          ...currentContext,
          variables: {
            ...currentContext.variables,
            [key]: value
          }
        }
      })
    }
  },
  
  getVariable: (key: string) => {
    const { currentContext } = get()
    return currentContext?.variables[key]
  },
  
  setTriggerData: (data: any) => {
    const { currentContext } = get()
    if (currentContext) {
      set({
        currentContext: {
          ...currentContext,
          triggerData: data
        }
      })
    }
  },
  
  registerTrigger: (subscription: TriggerSubscription) => {
    const { triggers } = get()
    const newTriggers = new Map(triggers)
    newTriggers.set(subscription.nodeId, subscription)
    set({ triggers: newTriggers })
  },
  
  unregisterTrigger: (nodeId: string) => {
    const { triggers } = get()
    const trigger = triggers.get(nodeId)
    
    // Clean up
    if (trigger) {
      if (trigger.intervalId) clearInterval(trigger.intervalId)
      if (trigger.unsubscribe) trigger.unsubscribe()
    }
    
    const newTriggers = new Map(triggers)
    newTriggers.delete(nodeId)
    set({ triggers: newTriggers })
  },
  
  armTriggers: () => {
    set({ triggersArmed: true })
  },
  
  disarmTriggers: () => {
    const { triggers } = get()
    
    // Clean up all active triggers
    triggers.forEach(trigger => {
      if (trigger.intervalId) clearInterval(trigger.intervalId)
      if (trigger.unsubscribe) trigger.unsubscribe()
    })
    
    // Mark all as inactive
    const newTriggers = new Map<string, TriggerSubscription>()
    triggers.forEach((trigger, nodeId) => {
      newTriggers.set(nodeId, {
        ...trigger,
        active: false,
        intervalId: undefined,
        unsubscribe: undefined
      })
    })
    
    set({ triggers: newTriggers, triggersArmed: false })
  },
  
  fireTrigger: (nodeId: string, data: any) => {
    const { triggersArmed, executionState } = get()
    
    if (!triggersArmed || executionState === 'running') {
      console.log('Trigger ignored - not armed or already running')
      return
    }
    
    // Set trigger data for the execution context
    set({
      currentContext: {
        variables: {},
        triggerData: data,
        runId: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startedAt: Date.now()
      }
    })
  },
  
  reset: () => {
    const { triggers } = get()
    
    // Clean up triggers
    triggers.forEach(trigger => {
      if (trigger.intervalId) clearInterval(trigger.intervalId)
      if (trigger.unsubscribe) trigger.unsubscribe()
    })
    
    set({
      executionState: 'idle',
      currentContext: null,
      nodeResults: new Map(),
      executionQueue: [],
      currentNodeId: null,
      triggers: new Map(),
      triggersArmed: false
    })
  }
}))

// Helper to get downstream nodes - exported for use in executor
export { getDownstreamNodes, topologicalSort }

