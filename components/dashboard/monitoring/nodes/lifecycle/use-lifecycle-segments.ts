import { useMemo } from 'react'
import type {
  LifecycleState,
  LifecycleTransition,
  TransitionEvent
} from '@/store/lifecycle-nodes-store'
export type { LifecycleState } from '@/store/lifecycle-nodes-store'


// Primary state colors (like Foxglove's Start State row)
export const PRIMARY_STATE_COLORS: Record<LifecycleState, {
  bg: string
  text: string
  label: string
}> = {
  unknown: {
    bg: 'bg-gray-400',
    text: 'text-white',
    label: 'UNKNOWN'
  },
  unconfigured: {
    bg: 'bg-cyan-500',
    text: 'text-white',
    label: 'UNCONFIGURED'
  },
  inactive: {
    bg: 'bg-yellow-400',
    text: 'text-gray-900',
    label: 'INACTIVE'
  },
  active: {
    bg: 'bg-green-500',
    text: 'text-white',
    label: 'ACTIVE'
  },
  finalized: {
    bg: 'bg-pink-500',
    text: 'text-white',
    label: 'FINALIZED'
  }
}

// Transition state colors (like Foxglove's Goal State row)
export type TransitionState = 'configuring' | 'cleaningup' | 'activating' | 'deactivating' | 'shuttingdown' | 'errorprocessing' | 'idle'

export const TRANSITION_STATE_COLORS: Record<TransitionState, {
  bg: string
  text: string
  label: string
}> = {
  idle: {
    bg: 'bg-gray-200',
    text: 'text-gray-600',
    label: 'IDLE'
  },
  configuring: {
    bg: 'bg-orange-400',
    text: 'text-white',
    label: 'CONFIGURING'
  },
  cleaningup: {
    bg: 'bg-gray-500',
    text: 'text-white',
    label: 'CLEANING UP'
  },
  activating: {
    bg: 'bg-lime-500',
    text: 'text-white',
    label: 'ACTIVATING'
  },
  deactivating: {
    bg: 'bg-purple-500',
    text: 'text-white',
    label: 'DEACTIVATING'
  },
  shuttingdown: {
    bg: 'bg-red-500',
    text: 'text-white',
    label: 'SHUTTING DOWN'
  },
  errorprocessing: {
    bg: 'bg-red-600',
    text: 'text-white',
    label: 'ERROR PROCESSING'
  }
}

// Map lifecycle transitions to transition states
export const TRANSITION_TO_STATE: Record<LifecycleTransition | string, TransitionState> = {
  configure: 'configuring',
  cleanup: 'cleaningup',
  activate: 'activating',
  deactivate: 'deactivating',
  shutdown: 'shuttingdown',
  state_change: 'idle'
}

export interface PrimaryStateSegment {
  id: string
  state: LifecycleState
  startTime: number
  endTime: number | null
  duration: number | null
  widthPercent: number
  leftPercent: number
}

export interface TransitionStateSegment {
  id: string
  transitionState: TransitionState
  startTime: number
  endTime: number | null
  duration: number | null
  widthPercent: number
  leftPercent: number
  transition?: LifecycleTransition | string
}

export interface UseLifecycleSegmentsProps {
  transitionHistory: TransitionEvent[]
  currentState: LifecycleState
  globalTimeRange?: { start: number; end: number }
}

export function useLifecycleSegments({
  transitionHistory,
  currentState,
  globalTimeRange
}: UseLifecycleSegmentsProps) {
  return useMemo(() => {
    const now = Date.now()
    
    // Determine the effective time range for this specific node
    let startTime: number
    let endTime: number = now

    if (transitionHistory.length === 0) {
      startTime = now - 60000
    } else {
      const sorted = [...transitionHistory].sort((a, b) => a.timestamp - b.timestamp)
      startTime = sorted[0].timestamp - 5000 // 5s before first transition
    }

    // If global range is provided, use it for the coordinate system (0-100%)
    // but keep the node's actual start/end for segment creation
    const rangeStart = globalTimeRange ? globalTimeRange.start : startTime
    const rangeEnd = globalTimeRange ? globalTimeRange.end : endTime
    const totalDuration = rangeEnd - rangeStart

    // Helper to calculate position and width
    const calcMetrics = (start: number, end: number | null) => {
      const effectiveEnd = end || rangeEnd
      // Clamp to visible range
      const clampedStart = Math.max(start, rangeStart)
      const clampedEnd = Math.min(effectiveEnd, rangeEnd)
      
      if (clampedStart >= clampedEnd) return { widthPercent: 0, leftPercent: 0 }

      const duration = clampedEnd - clampedStart
      const widthPercent = (duration / totalDuration) * 100
      const leftPercent = ((clampedStart - rangeStart) / totalDuration) * 100
      
      return { widthPercent, leftPercent }
    }

    if (transitionHistory.length === 0) {
      // Single segment for current state
      const { widthPercent, leftPercent } = calcMetrics(startTime, null)
      
      return {
        primarySegments: [{
          id: 'current',
          state: currentState,
          startTime,
          endTime: null,
          duration: now - startTime,
          widthPercent,
          leftPercent
        }] as PrimaryStateSegment[],
        transitionSegments: [{
          id: 'idle',
          transitionState: 'idle' as TransitionState,
          startTime,
          endTime: null,
          duration: now - startTime,
          widthPercent,
          leftPercent
        }] as TransitionStateSegment[],
        timeRange: { start: startTime, end: endTime }
      }
    }

    // Sort by timestamp
    const sorted = [...transitionHistory].sort((a, b) => a.timestamp - b.timestamp)
    
    const primary: PrimaryStateSegment[] = []
    const transitions: TransitionStateSegment[] = []

    // First primary segment (initial state before any transitions)
    if (sorted[0].fromState !== 'unknown') {
      const segStart = startTime
      const segEnd = sorted[0].timestamp
      const duration = segEnd - segStart
      const { widthPercent, leftPercent } = calcMetrics(segStart, segEnd)
      
      if (widthPercent > 0) {
        primary.push({
          id: `primary-initial`,
          state: sorted[0].fromState,
          startTime: segStart,
          endTime: segEnd,
          duration,
          widthPercent,
          leftPercent
        })
        // Idle transition state before first transition
        transitions.push({
          id: `transition-initial`,
          transitionState: 'idle',
          startTime: segStart,
          endTime: segEnd,
          duration,
          widthPercent,
          leftPercent
        })
      }
    }

    // Process each transition event
    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i]
      const nextEvent = sorted[i + 1]
      
      const segStart = event.timestamp
      const segEnd = nextEvent ? nextEvent.timestamp : null
      const duration = segEnd ? segEnd - segStart : now - segStart
      
      const { widthPercent, leftPercent } = calcMetrics(segStart, segEnd)

      if (widthPercent > 0) {
        // Primary state segment
        primary.push({
          id: `primary-${i}`,
          state: event.toState,
          startTime: segStart,
          endTime: segEnd,
          duration,
          widthPercent,
          leftPercent
        })

        // Transition state segment
        const transitionDuration = Math.min(duration, 2000) // Transition shown for max 2s
        const transitionState = TRANSITION_TO_STATE[event.transition] || 'idle'
        
        if (transitionState !== 'idle' && duration > 100) {
          // Brief transition state
          const activeMetrics = calcMetrics(segStart, segStart + transitionDuration)
          
          if (activeMetrics.widthPercent > 0) {
            transitions.push({
              id: `transition-${i}-active`,
              transitionState,
              startTime: segStart,
              endTime: segStart + transitionDuration,
              duration: transitionDuration,
              widthPercent: activeMetrics.widthPercent,
              leftPercent: activeMetrics.leftPercent,
              transition: event.transition
            })
          }
          
          // Then idle for the rest
          if (duration > transitionDuration) {
            const idleMetrics = calcMetrics(segStart + transitionDuration, segEnd)
            if (idleMetrics.widthPercent > 0) {
              transitions.push({
                id: `transition-${i}-idle`,
                transitionState: 'idle',
                startTime: segStart + transitionDuration,
                endTime: segEnd,
                duration: duration - transitionDuration,
                widthPercent: idleMetrics.widthPercent,
                leftPercent: idleMetrics.leftPercent
              })
            }
          }
        } else {
          // Just idle
          transitions.push({
            id: `transition-${i}`,
            transitionState: 'idle',
            startTime: segStart,
            endTime: segEnd,
            duration,
            widthPercent,
            leftPercent
          })
        }
      }
    }

    return {
      primarySegments: primary,
      transitionSegments: transitions,
      timeRange: { start: startTime, end: endTime }
    }
  }, [transitionHistory, currentState, globalTimeRange])
}
