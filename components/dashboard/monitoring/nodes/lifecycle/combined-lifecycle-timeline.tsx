'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { LifecycleNodeInfo } from '@/store/lifecycle-nodes-store'
import {
  useLifecycleSegments,
  PRIMARY_STATE_COLORS,
  TRANSITION_STATE_COLORS,
  type LifecycleState as HookLifecycleState,
  type TransitionState
} from './use-lifecycle-segments'

interface CombinedLifecycleTimelineProps {
  nodes: LifecycleNodeInfo[]
}

// Sub-component for a single node row to properly use the hook
const NodeTimelineRow = ({
  node,
  globalTimeRange,
  rowHeight = 24
}: {
  node: LifecycleNodeInfo
  globalTimeRange: { start: number; end: number }
  rowHeight?: number
}) => {
  const { primarySegments, transitionSegments } = useLifecycleSegments({
    transitionHistory: node.transitionHistory,
    currentState: node.currentState,
    globalTimeRange
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

  return (
    <div className="group flex border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Node Name Column */}
      <div className="w-64 flex-shrink-0 p-2 border-r border-gray-100 bg-white group-hover:bg-gray-50 sticky left-0 z-10 flex flex-col justify-center">
        <div className="font-medium text-sm truncate" title={node.name}>
          {node.name}
        </div>
        <div className="text-xs text-muted-foreground truncate" title={node.namespace}>
          {node.namespace}
        </div>
      </div>

      {/* Timeline Column */}
      <div className="flex-1 min-w-0 p-2 relative">
        <div className="flex flex-col gap-1">
          {/* Primary State Row */}
          <div className="relative w-full h-5 bg-gray-100 rounded overflow-hidden">
            {primarySegments.map((segment) => {
              const colors = PRIMARY_STATE_COLORS[segment.state]
              const isOngoing = segment.endTime === null
              
              if (segment.widthPercent <= 0) return null

              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute top-0 h-full ${colors.bg} cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        left: `${segment.leftPercent}%`,
                        width: `${Math.max(segment.widthPercent, 0.2)}%`
                      }}
                    >
                      {/* Ongoing indicator */}
                      {isOngoing && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{node.name}: {colors.label}</p>
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

          {/* Transition State Row */}
          <div className="relative w-full h-3 bg-gray-100 rounded overflow-hidden">
            {transitionSegments.map((segment) => {
              const colors = TRANSITION_STATE_COLORS[segment.transitionState]
              
              if (segment.widthPercent <= 0) return null

              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute top-0 h-full ${colors.bg} cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        left: `${segment.leftPercent}%`,
                        width: `${Math.max(segment.widthPercent, 0.2)}%`
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{node.name}: {colors.label}</p>
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
    </div>
  )
}

export function CombinedLifecycleTimeline({ nodes }: CombinedLifecycleTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate global time range
  const globalTimeRange = useMemo(() => {
    const now = Date.now()
    let minTime = now - 60000 // Default to last minute if no data

    nodes.forEach(node => {
      if (node.transitionHistory.length > 0) {
        // Find earliest timestamp
        const nodeStart = Math.min(...node.transitionHistory.map(t => t.timestamp))
        if (nodeStart < minTime) minTime = nodeStart
      }
    })

    // Add some padding (5s) before the earliest event
    minTime -= 5000
    
    return { start: minTime, end: now }
  }, [nodes])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Generate time markers (approx every 10-20% of width)
  const timeMarkers = useMemo(() => {
    const duration = globalTimeRange.end - globalTimeRange.start
    const count = 5
    const markers = []
    
    for (let i = 0; i <= count; i++) {
      const percent = (i / count) * 100
      const time = globalTimeRange.start + (duration * (i / count))
      markers.push({ percent, time })
    }
    
    return markers
  }, [globalTimeRange])

  if (nodes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-500">No nodes to display</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-900">Combined Lifecycle Timeline</h3>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Range:</span>
            <span>{formatTime(globalTimeRange.start)} - {formatTime(globalTimeRange.end)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[800px]">
          {/* Header Row with Time Axis */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
            <div className="w-64 flex-shrink-0 p-2 border-r border-gray-200 font-medium text-xs text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30">
              Node
            </div>
            <div className="flex-1 relative h-8">
              {timeMarkers.map((marker, i) => (
                <div 
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-gray-300 text-[10px] text-gray-500 pl-1 pt-1 whitespace-nowrap"
                  style={{ left: `${marker.percent}%` }}
                >
                  {formatTime(marker.time)}
                </div>
              ))}
            </div>
          </div>

          {/* Node Rows */}
          <TooltipProvider>
            <div className="divide-y divide-gray-100">
              {nodes.map(node => (
                <NodeTimelineRow 
                  key={node.fullPath} 
                  node={node} 
                  globalTimeRange={globalTimeRange} 
                />
              ))}
            </div>
          </TooltipProvider>

          {/* Vertical Grid Lines (Background) */}
          <div className="absolute top-8 bottom-0 left-64 right-0 pointer-events-none z-0">
            {timeMarkers.map((marker, i) => (
              <div 
                key={i}
                className="absolute top-0 bottom-0 border-l border-gray-100"
                style={{ left: `${marker.percent}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-500">States:</span>
            {(['unconfigured', 'inactive', 'active', 'finalized'] as HookLifecycleState[]).map((state) => {
              const colors = PRIMARY_STATE_COLORS[state]
              return (
                <div key={state} className="flex items-center gap-1">
                  <div className={`h-2.5 w-2.5 rounded-sm ${colors.bg}`} />
                  <span className="text-gray-600">{colors.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-500">Transitions:</span>
            {(['configuring', 'activating', 'deactivating', 'cleaningup'] as TransitionState[]).map((state) => {
              const colors = TRANSITION_STATE_COLORS[state]
              return (
                <div key={state} className="flex items-center gap-1">
                  <div className={`h-2.5 w-2.5 rounded-sm ${colors.bg}`} />
                  <span className="text-gray-600">{colors.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
