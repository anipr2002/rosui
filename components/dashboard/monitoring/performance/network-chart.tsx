'use client'

import React, { useMemo } from 'react'
import { Wifi, ArrowUp, ArrowDown } from 'lucide-react'
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
  Legend
} from 'recharts'

interface ChartDataPoint {
  time: string
  timestamp: number
  tx: number | null
  rx: number | null
}

export function NetworkChart() {
  const networkTxHistory = usePerformanceStore((state) => state.networkTxHistory)
  const networkRxHistory = usePerformanceStore((state) => state.networkRxHistory)
  const networkTxStats = usePerformanceStore((state) => state.networkTxStats)
  const networkRxStats = usePerformanceStore((state) => state.networkRxStats)

  const chartData = useMemo<ChartDataPoint[]>(() => {
    // Combine TX and RX data by timestamp
    const dataMap = new Map<number, ChartDataPoint>()

    // Determine start time from earliest data
    const allTimestamps = [
      ...networkTxHistory.map((p) => p.timestamp),
      ...networkRxHistory.map((p) => p.timestamp)
    ]

    if (allTimestamps.length === 0) return []

    const startTime = Math.min(...allTimestamps)

    // Add TX data
    for (const point of networkTxHistory) {
      const time = ((point.timestamp - startTime) / 1000).toFixed(1)
      dataMap.set(point.timestamp, {
        time,
        timestamp: point.timestamp,
        tx: point.value,
        rx: null
      })
    }

    // Add/merge RX data
    for (const point of networkRxHistory) {
      const time = ((point.timestamp - startTime) / 1000).toFixed(1)
      const existing = dataMap.get(point.timestamp)
      if (existing) {
        existing.rx = point.value
      } else {
        dataMap.set(point.timestamp, {
          time,
          timestamp: point.timestamp,
          tx: null,
          rx: point.value
        })
      }
    }

    // Sort by timestamp
    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  }, [networkTxHistory, networkRxHistory])

  const hasData = networkTxHistory.length > 0 || networkRxHistory.length > 0

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-purple-900" />
            <div>
              <CardTitle className="text-base text-purple-900">Network I/O</CardTitle>
              <CardDescription className="text-xs text-purple-700">
                Transmit and receive bandwidth
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {networkTxStats && (
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-mono">
                <ArrowUp className="h-3 w-3 mr-1" />
                {networkTxStats.current.toFixed(1)}
              </Badge>
            )}
            {networkRxStats && (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs font-mono">
                <ArrowDown className="h-3 w-3 mr-1" />
                {networkRxStats.current.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {hasData ? (
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
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  width={50}
                  label={{
                    value: 'KB/s',
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
                  formatter={(value: number, name: string) => [
                    value !== null ? `${value.toFixed(2)} KB/s` : 'N/A',
                    name === 'tx' ? 'Upload' : 'Download'
                  ]}
                  labelFormatter={(label) => `Time: ${label}s`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => (value === 'tx' ? 'Upload (TX)' : 'Download (RX)')}
                />
                <Line
                  type="monotone"
                  dataKey="tx"
                  name="tx"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="rx"
                  name="rx"
                  stroke="#f97316"
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
              <Wifi className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No network data available</div>
              <div className="text-xs text-gray-400 mt-1">
                Waiting for diagnostic messages with network metrics
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

