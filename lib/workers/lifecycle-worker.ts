/**
 * Web Worker for processing lifecycle node data
 * Handles timeline segment generation, filtering, and sorting
 */

import type { 
  LifecycleState, 
  LifecycleNodeInfo, 
  TransitionEvent 
} from '@/store/lifecycle-nodes-store'

// Timeline segment for visualization
export interface TimelineSegment {
  id: string
  state: LifecycleState
  startTime: number
  endTime: number | null // null means ongoing
  duration: number | null
  transitionEvent?: TransitionEvent
}

export interface ProcessedNode {
  fullPath: string
  name: string
  namespace: string
  currentState: LifecycleState
  isHealthy: boolean
  lastSeen: number
  timelineSegments: TimelineSegment[]
  stateHistory: LifecycleState[]
}

// Input message types
export type LifecycleWorkerInput = 
  | {
      type: 'PROCESS_NODES'
      payload: {
        nodes: Array<{
          name: string
          namespace: string
          fullPath: string
          currentState: LifecycleState
          transitionHistory: TransitionEvent[]
          lastSeen: number
          isHealthy: boolean
        }>
        sortBy: 'name' | 'state' | 'lastSeen'
        sortOrder: 'asc' | 'desc'
        filterState: LifecycleState | 'all'
        searchQuery: string
      }
    }
  | {
      type: 'GENERATE_TIMELINE'
      payload: {
        nodeName: string
        transitionHistory: TransitionEvent[]
        currentState: LifecycleState
        createdAt?: number
      }
    }

// Output message types
export type LifecycleWorkerOutput = 
  | {
      type: 'NODES_PROCESSED'
      payload: {
        nodes: ProcessedNode[]
        totalCount: number
        filteredCount: number
        stateCounts: Record<LifecycleState, number>
      }
    }
  | {
      type: 'TIMELINE_GENERATED'
      payload: {
        nodeName: string
        segments: TimelineSegment[]
        totalDuration: number
      }
    }
  | {
      type: 'ERROR'
      payload: {
        message: string
      }
    }

/**
 * Generate timeline segments from transition history
 */
function generateTimelineSegments(
  transitionHistory: TransitionEvent[],
  currentState: LifecycleState,
  createdAt?: number
): TimelineSegment[] {
  const segments: TimelineSegment[] = []
  
  if (transitionHistory.length === 0) {
    // No history, create single segment for current state
    const now = Date.now()
    const startTime = createdAt || now - 60000 // Default to 1 minute ago
    segments.push({
      id: `segment-${currentState}-${startTime}`,
      state: currentState,
      startTime,
      endTime: null,
      duration: null
    })
    return segments
  }

  // Sort history by timestamp
  const sortedHistory = [...transitionHistory].sort((a, b) => a.timestamp - b.timestamp)

  // Create segments from transition history
  for (let i = 0; i < sortedHistory.length; i++) {
    const event = sortedHistory[i]
    const nextEvent = sortedHistory[i + 1]
    
    // Segment for the state before this transition
    if (i === 0 && event.fromState !== 'unknown') {
      const startTime = createdAt || event.timestamp - 60000
      segments.push({
        id: `segment-${event.fromState}-${startTime}`,
        state: event.fromState,
        startTime,
        endTime: event.timestamp,
        duration: event.timestamp - startTime,
        transitionEvent: event
      })
    }
    
    // Segment for the state after this transition
    const segmentStartTime = event.timestamp
    const segmentEndTime = nextEvent ? nextEvent.timestamp : null
    const duration = segmentEndTime ? segmentEndTime - segmentStartTime : null
    
    segments.push({
      id: `segment-${event.toState}-${segmentStartTime}`,
      state: event.toState,
      startTime: segmentStartTime,
      endTime: segmentEndTime,
      duration,
      transitionEvent: nextEvent
    })
  }

  return segments
}

/**
 * Process nodes with filtering, sorting, and timeline generation
 */
function processNodes(
  nodes: Array<{
    name: string
    namespace: string
    fullPath: string
    currentState: LifecycleState
    transitionHistory: TransitionEvent[]
    lastSeen: number
    isHealthy: boolean
  }>,
  sortBy: 'name' | 'state' | 'lastSeen',
  sortOrder: 'asc' | 'desc',
  filterState: LifecycleState | 'all',
  searchQuery: string
): {
  nodes: ProcessedNode[]
  totalCount: number
  filteredCount: number
  stateCounts: Record<LifecycleState, number>
} {
  // Count states before filtering
  const stateCounts: Record<LifecycleState, number> = {
    unknown: 0,
    unconfigured: 0,
    inactive: 0,
    active: 0,
    finalized: 0
  }
  
  nodes.forEach(node => {
    stateCounts[node.currentState]++
  })

  // Filter nodes
  let filtered = nodes
  
  if (filterState !== 'all') {
    filtered = filtered.filter(node => node.currentState === filterState)
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    filtered = filtered.filter(node => 
      node.name.toLowerCase().includes(query) ||
      node.fullPath.toLowerCase().includes(query) ||
      node.namespace.toLowerCase().includes(query)
    )
  }

  // Sort nodes
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'state':
        const stateOrder: Record<LifecycleState, number> = {
          active: 0,
          inactive: 1,
          unconfigured: 2,
          finalized: 3,
          unknown: 4
        }
        comparison = stateOrder[a.currentState] - stateOrder[b.currentState]
        break
      case 'lastSeen':
        comparison = b.lastSeen - a.lastSeen
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Generate processed nodes with timelines
  const processedNodes: ProcessedNode[] = sorted.map(node => {
    const timelineSegments = generateTimelineSegments(
      node.transitionHistory,
      node.currentState
    )
    
    const stateHistory = node.transitionHistory.map(e => e.toState)
    if (node.transitionHistory.length > 0) {
      stateHistory.unshift(node.transitionHistory[0].fromState)
    }
    
    return {
      fullPath: node.fullPath,
      name: node.name,
      namespace: node.namespace,
      currentState: node.currentState,
      isHealthy: node.isHealthy,
      lastSeen: node.lastSeen,
      timelineSegments,
      stateHistory
    }
  })

  return {
    nodes: processedNodes,
    totalCount: nodes.length,
    filteredCount: processedNodes.length,
    stateCounts
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent<LifecycleWorkerInput>) => {
  const { type, payload } = event.data

  try {
    if (type === 'PROCESS_NODES') {
      const result = processNodes(
        payload.nodes,
        payload.sortBy,
        payload.sortOrder,
        payload.filterState,
        payload.searchQuery
      )

      const response: LifecycleWorkerOutput = {
        type: 'NODES_PROCESSED',
        payload: result
      }

      self.postMessage(response)
    } else if (type === 'GENERATE_TIMELINE') {
      const segments = generateTimelineSegments(
        payload.transitionHistory,
        payload.currentState,
        payload.createdAt
      )

      // Calculate total duration
      const totalDuration = segments.reduce((acc, seg) => {
        return acc + (seg.duration || 0)
      }, 0)

      const response: LifecycleWorkerOutput = {
        type: 'TIMELINE_GENERATED',
        payload: {
          nodeName: payload.nodeName,
          segments,
          totalDuration
        }
      }

      self.postMessage(response)
    }
  } catch (error) {
    console.error('Lifecycle worker error:', error)
    const response: LifecycleWorkerOutput = {
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    self.postMessage(response)
  }
}

