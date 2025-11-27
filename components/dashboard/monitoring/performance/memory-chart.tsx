'use client'

import React, { useMemo } from 'react'
import { MemoryStick } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePerformanceStore } from '@/store/performance-store'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface ChartDataPoint {
  time: string
  timestamp: number
  value: number
}

export function MemoryChart() {
  const memoryHistory = usePerformanceStore((state) => state.memoryHistory)
  const memoryStats = usePerformanceStore((state) => state.memoryStats)

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (memoryHistory.length === 0) return []

    const startTime = memoryHistory[0]?.timestamp || 0

    return memoryHistory.map((point) => ({
      time: ((point.timestamp - startTime) / 1000).toFixed(1),
      timestamp: point.timestamp,
      value: point.value
    }))
  }, [memoryHistory])

  const getStatusColor = (value: number | undefined): { fill: string; stroke: string } => {
    if (value === undefined) return { fill: '#e5e7eb', stroke: '#9ca3af' }
    if (value < 70) return { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' }
    if (value < 90) return { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' }
    return { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' }
  }

  const colors = getStatusColor(memoryStats?.current)

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-green-50 border-green-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MemoryStick className="h-5 w-5 text-green-900" />
            <div>
              <CardTitle className="text-base text-green-900">Memory Usage</CardTitle>
              <CardDescription className="text-xs text-green-700">
                RAM utilization over time
              </CardDescription>
            </div>
          </div>
          {memoryStats && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs font-mono">
              {memoryStats.current.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.stroke} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{
                    value: 'Time (s)',
                    position: 'insideBottom',
                    offset: -2,
                    style: { fontSize: 10, fill: '#6b7280' }
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  width={40}
                  label={{
                    value: 'Memory %',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: '#6b7280' }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Memory']}
                  labelFormatter={(label) => `Time: ${label}s`}
                />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill="url(#memoryGradient)"
                  isAnimationActive={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <MemoryStick className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No memory data available</div>
              <div className="text-xs text-gray-400 mt-1">
                Waiting for diagnostic messages with memory metrics
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

