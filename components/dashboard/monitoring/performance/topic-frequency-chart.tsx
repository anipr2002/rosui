'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { Radio, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePerformanceStore } from '@/store/performance-store'
import { useTopicsStore } from '@/store/topic-store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface FrequencyDataPoint {
  name: string
  shortName: string
  frequency: number
  messageCount: number
}

// Generate colors for bars based on frequency
function getBarColor(frequency: number): string {
  if (frequency < 1) return '#9ca3af'
  if (frequency < 10) return '#3b82f6'
  if (frequency < 50) return '#22c55e'
  if (frequency < 100) return '#f59e0b'
  return '#ef4444'
}

export function TopicFrequencyChart() {
  const getTopicFrequencyList = usePerformanceStore((state) => state.getTopicFrequencyList)
  const topicFrequencies = usePerformanceStore((state) => state.topicFrequencies)
  const subscribers = useTopicsStore((state) => state.subscribers)

  // Force re-render for real-time frequency updates
  const [, setRefreshTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((tick) => tick + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const chartData = useMemo<FrequencyDataPoint[]>(() => {
    const frequencies = getTopicFrequencyList()

    // Also include frequencies from topic store subscribers
    const subscriberFrequencies: FrequencyDataPoint[] = []

    subscribers.forEach((sub, topicName) => {
      // Calculate frequency from message timestamps
      const messages = sub.messages || []
      if (messages.length < 2) {
        subscriberFrequencies.push({
          name: topicName,
          shortName: topicName.split('/').pop() || topicName,
          frequency: 0,
          messageCount: messages.length
        })
        return
      }

      // Calculate frequency from last 5 seconds of messages
      const now = Date.now()
      const windowMs = 5000
      const recentMessages = messages.filter((m) => m.timestamp > now - windowMs)

      if (recentMessages.length < 2) {
        subscriberFrequencies.push({
          name: topicName,
          shortName: topicName.split('/').pop() || topicName,
          frequency: 0,
          messageCount: messages.length
        })
        return
      }

      const windowDuration = (now - recentMessages[recentMessages.length - 1].timestamp) / 1000
      const frequency = windowDuration > 0 ? recentMessages.length / windowDuration : 0

      subscriberFrequencies.push({
        name: topicName,
        shortName: topicName.split('/').pop() || topicName,
        frequency,
        messageCount: messages.length
      })
    })

    // Merge performance store frequencies
    const allFrequencies = new Map<string, FrequencyDataPoint>()

    for (const freq of frequencies) {
      allFrequencies.set(freq.topicName, {
        name: freq.topicName,
        shortName: freq.topicName.split('/').pop() || freq.topicName,
        frequency: freq.frequency,
        messageCount: freq.messageCount
      })
    }

    for (const freq of subscriberFrequencies) {
      if (!allFrequencies.has(freq.name)) {
        allFrequencies.set(freq.name, freq)
      }
    }

    return Array.from(allFrequencies.values()).sort((a, b) => b.frequency - a.frequency)
  }, [getTopicFrequencyList, subscribers, topicFrequencies])

  const totalMessages = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.messageCount, 0)
  }, [chartData])

  const avgFrequency = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, item) => sum + item.frequency, 0) / chartData.length
  }, [chartData])

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-amber-50 border-amber-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-amber-900" />
            <div>
              <CardTitle className="text-base text-amber-900">Topic Frequencies</CardTitle>
              <CardDescription className="text-xs text-amber-700">
                Message rates for subscribed topics (Hz)
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
              {chartData.length} topics
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs font-mono">
              ~{avgFrequency.toFixed(1)} Hz avg
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{
                    value: 'Frequency (Hz)',
                    position: 'insideBottom',
                    offset: -2,
                    style: { fontSize: 10, fill: '#6b7280' }
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(2)} Hz`,
                    'Frequency'
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item?.name || label
                  }}
                />
                <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.frequency)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Radio className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No subscribed topics</div>
              <div className="text-xs text-gray-400 mt-1">
                Subscribe to topics to see their message frequencies
              </div>
            </div>
          </div>
        )}

        {/* Stats footer */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-gray-500">Total Messages</div>
                <div className="font-mono font-medium text-gray-700">{totalMessages.toLocaleString()}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-gray-500">Active Topics</div>
                <div className="font-mono font-medium text-gray-700">{chartData.filter((d) => d.frequency > 0).length}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-gray-500">Peak Rate</div>
                <div className="font-mono font-medium text-gray-700">
                  {chartData.length > 0 ? Math.max(...chartData.map((d) => d.frequency)).toFixed(1) : 0} Hz
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

