'use client'

import React from 'react'
import { NodeMetrics } from '@/store/diagnostics-store'

interface CpuMemoryDisplayProps {
  nodeMetrics: NodeMetrics
  compact?: boolean
}

export function CpuMemoryDisplay({ nodeMetrics, compact = false }: CpuMemoryDisplayProps) {
  const { cpuUsage, memoryUsage } = nodeMetrics

  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'gray'
    if (value < 70) return 'green'
    if (value < 90) return 'amber'
    return 'red'
  }

  const getMetricClass = (value: number | undefined) => {
    const color = getMetricColor(value)
    return `text-${color}-600`
  }

  const getProgressColor = (value: number | undefined) => {
    const color = getMetricColor(value)
    return `bg-${color}-500`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        {cpuUsage !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">CPU:</span>
            <span className={`font-mono font-medium ${getMetricClass(cpuUsage)}`}>
              {cpuUsage.toFixed(1)}%
            </span>
          </div>
        )}
        {memoryUsage !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Mem:</span>
            <span className={`font-mono font-medium ${getMetricClass(memoryUsage)}`}>
              {memoryUsage.toFixed(1)}%
            </span>
          </div>
        )}
        {cpuUsage === undefined && memoryUsage === undefined && (
          <span className="text-gray-400 text-xs">No metrics available</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cpuUsage !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">CPU Usage</span>
            <span className={`font-mono font-semibold ${getMetricClass(cpuUsage)}`}>
              {cpuUsage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(cpuUsage)}`}
              style={{ width: `${Math.min(cpuUsage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {memoryUsage !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">Memory Usage</span>
            <span className={`font-mono font-semibold ${getMetricClass(memoryUsage)}`}>
              {memoryUsage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(memoryUsage)}`}
              style={{ width: `${Math.min(memoryUsage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {cpuUsage === undefined && memoryUsage === undefined && (
        <div className="text-center py-4 text-sm text-gray-400">
          No CPU or memory metrics available
        </div>
      )}
    </div>
  )
}

