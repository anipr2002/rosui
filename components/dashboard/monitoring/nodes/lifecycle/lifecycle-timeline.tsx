'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type {
  LifecycleState,
  TransitionEvent
} from '@/store/lifecycle-nodes-store'
import {
  useLifecycleSegments,
  PRIMARY_STATE_COLORS,
  TRANSITION_STATE_COLORS,
  type TransitionState
} from './use-lifecycle-segments'

interface LifecycleTimelineProps {
  transitionHistory: TransitionEvent[]
  currentState: LifecycleState
  rowHeight?: number
}

export function LifecycleTimeline({
  transitionHistory,
  currentState,
  rowHeight = 28
}: LifecycleTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Generate both timeline rows using the hook
  const { primarySegments, transitionSegments, timeRange } = useLifecycleSegments({
    transitionHistory,
    currentState
  })

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'Ongoing'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
  }

  if (primarySegments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500">No timeline data available</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Primary State Row (Start State in Foxglove) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-20">Primary State</span>
          </div>
          <div
            ref={containerRef}
            className="relative w-full rounded overflow-hidden border border-gray-300 bg-gray-100"
            style={{ height: rowHeight }}
          >
            <div className="absolute inset-0 flex">
              {primarySegments.map((segment, index) => {
                const colors = PRIMARY_STATE_COLORS[segment.state]
                const isOngoing = segment.endTime === null
                const minWidth = Math.max(segment.widthPercent, 1)

                return (
                  <Tooltip key={segment.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`relative h-full ${colors.bg} ${
                          index > 0 ? 'border-l border-white/40' : ''
                        } cursor-pointer transition-opacity hover:opacity-90`}
                        style={{
                          width: `${minWidth}%`,
                          minWidth: '2px'
                        }}
                      >
                        {/* State label */}
                        {containerWidth > 0 && (segment.widthPercent / 100) * containerWidth > 80 && (
                          <div className={`absolute inset-0 flex items-center justify-center ${colors.text} text-[10px] font-semibold tracking-wide`}>
                            {colors.label}
                          </div>
                        )}
                        {/* Ongoing indicator */}
                        {isOngoing && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{colors.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(segment.startTime)} → {segment.endTime ? formatTime(segment.endTime) : 'Now'}
                        </p>
                        <p className="text-xs">Duration: {formatDuration(segment.duration)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transition State Row (Goal State in Foxglove) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-20">Transition</span>
          </div>
          <div
            className="relative w-full rounded overflow-hidden border border-gray-300 bg-gray-100"
            style={{ height: rowHeight }}
          >
            <div className="absolute inset-0 flex">
              {transitionSegments.map((segment, index) => {
                const colors = TRANSITION_STATE_COLORS[segment.transitionState]
                const isOngoing = segment.endTime === null
                const minWidth = Math.max(segment.widthPercent, 1)

                return (
                  <Tooltip key={segment.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`relative h-full ${colors.bg} ${
                          index > 0 ? 'border-l border-white/40' : ''
                        } cursor-pointer transition-opacity hover:opacity-90`}
                        style={{
                          width: `${minWidth}%`,
                          minWidth: '2px'
                        }}
                      >
                        {/* Transition label */}
                        {containerWidth > 0 && (segment.widthPercent / 100) * containerWidth > 80 && (
                          <div className={`absolute inset-0 flex items-center justify-center ${colors.text} text-[10px] font-semibold tracking-wide`}>
                            {colors.label}
                          </div>
                        )}
                        {/* Ongoing indicator */}
                        {isOngoing && segment.transitionState !== 'idle' && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{colors.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(segment.startTime)} → {segment.endTime ? formatTime(segment.endTime) : 'Now'}
                        </p>
                        <p className="text-xs">Duration: {formatDuration(segment.duration)}</p>
                        {segment.transition && (
                          <p className="text-xs text-muted-foreground">
                            Triggered by: {segment.transition}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </div>

        {/* Time axis */}
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          <span>{formatTime(timeRange.start)}</span>
          <span>Now</span>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-gray-200">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Primary States</p>
            <div className="flex flex-wrap gap-2">
              {(['unconfigured', 'inactive', 'active', 'finalized'] as LifecycleState[]).map((state) => {
                const colors = PRIMARY_STATE_COLORS[state]
                return (
                  <div key={state} className="flex items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-sm ${colors.bg}`} />
                    <span className="text-[10px] text-gray-600">{colors.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Transitions</p>
            <div className="flex flex-wrap gap-2">
              {(['configuring', 'activating', 'deactivating', 'cleaningup'] as TransitionState[]).map((state) => {
                const colors = TRANSITION_STATE_COLORS[state]
                return (
                  <div key={state} className="flex items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-sm ${colors.bg}`} />
                    <span className="text-[10px] text-gray-600">{colors.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
