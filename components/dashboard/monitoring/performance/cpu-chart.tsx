'use client'

import React, { useMemo } from 'react'
import { Cpu } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePerformanceStore } from '@/store/performance-store'
import {
  LineChart,
  Line,
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

export function CpuChart() {
  const cpuHistory = usePerformanceStore((state) => state.cpuHistory)
  const cpuStats = usePerformanceStore((state) => state.cpuStats)

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (cpuHistory.length === 0) return []

    const startTime = cpuHistory[0]?.timestamp || 0

    return cpuHistory.map((point) => ({
      time: ((point.timestamp - startTime) / 1000).toFixed(1),
      timestamp: point.timestamp,
      value: point.value
    }))
  }, [cpuHistory])

  const getStatusColor = (value: number | undefined): string => {
    if (value === undefined) return '#9ca3af'
    if (value < 70) return '#22c55e'
    if (value < 90) return '#f59e0b'
    return '#ef4444'
  }

  const lineColor = getStatusColor(cpuStats?.current)

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-blue-900" />
            <div>
              <CardTitle className="text-base text-blue-900">CPU Usage</CardTitle>
              <CardDescription className="text-xs text-blue-700">
                Processor utilization over time
              </CardDescription>
            </div>
          </div>
          {cpuStats && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-mono">
              {cpuStats.current.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
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
                    value: 'CPU %',
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
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'CPU']}
                  labelFormatter={(label) => `Time: ${label}s`}
                />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Cpu className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No CPU data available</div>
              <div className="text-xs text-gray-400 mt-1">
                Waiting for diagnostic messages with CPU metrics
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

