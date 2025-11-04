'use client'

import { useState, useMemo } from 'react'
import { LineChart, BarChart3, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useBagPlayerStore } from '@/store/bag-player-store'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Helper function to extract numeric fields from message data
function extractNumericFields(data: any, prefix = ''): Map<string, number> {
  const fields = new Map<string, number>()

  if (data === null || data === undefined) {
    return fields
  }

  if (typeof data === 'number') {
    fields.set(prefix, data)
    return fields
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'number') {
        fields.set(newPrefix, value)
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nested = extractNumericFields(value, newPrefix)
        nested.forEach((v, k) => fields.set(k, v))
      }
    }
  }

  return fields
}

// Helper function to prepare data for Recharts
function prepareChartData(messages: Map<string, any>, availableTopics: any[]) {
  const data: any[] = []
  const allFields = new Set<string>()

  messages.forEach((message, topicName) => {
    const topic = availableTopics.find(t => t.topicName === topicName)
    if (!topic) return

    const numericFields = extractNumericFields(message.data)
    
    numericFields.forEach((value, fieldPath) => {
      // Create a unique key for this topic + field combination
      const key = `${topicName}::${fieldPath}`
      allFields.add(key)
      
      // Add to data array
      const existingEntry = data.find(d => d.time === message.timestamp)
      if (existingEntry) {
        existingEntry[key] = value
      } else {
        data.push({
          time: message.timestamp,
          [key]: value
        })
      }
    })
  })

  // Sort by time
  data.sort((a, b) => a.time - b.time)

  return { data, fields: Array.from(allFields) }
}

export function MessageVisualizer() {
  const [activeTab, setActiveTab] = useState('charts')
  const {
    currentRecording,
    currentMessages,
    selectedTopics,
    availableTopics
  } = useBagPlayerStore()

  const hasRecording = currentRecording !== null
  const hasMessages = currentMessages.size > 0

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!hasMessages) return { data: [], fields: [] }
    return prepareChartData(currentMessages, availableTopics)
  }, [currentMessages, availableTopics, hasMessages])

  // Group fields by topic for better organization
  const fieldsByTopic = useMemo(() => {
    const grouped = new Map<string, string[]>()
    
    chartData.fields.forEach(field => {
      const [topicName, fieldPath] = field.split('::')
      if (!grouped.has(topicName)) {
        grouped.set(topicName, [])
      }
      grouped.get(topicName)?.push(field)
    })

    return grouped
  }, [chartData.fields])

  // Get color for a topic
  const getTopicColor = (topicName: string) => {
    const topic = availableTopics.find(t => t.topicName === topicName)
    return topic?.color || '#000000'
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border-gray-200">
      <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <BarChart3 className="h-5 w-5 mt-0.5 text-gray-900" />
          <div>
            <CardTitle className="text-base text-gray-900">
              Message Visualizer
            </CardTitle>
            <CardDescription className="text-xs text-gray-900 opacity-80">
              {hasMessages
                ? `Displaying ${currentMessages.size} topic${currentMessages.size !== 1 ? 's' : ''}`
                : 'Select topics and play to visualize data'}
            </CardDescription>
          </div>
          {hasMessages && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              {chartData.fields.length} fields
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {!hasRecording ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900 mb-2">
              No Recording Loaded
            </p>
            <p className="text-sm text-gray-500">
              Load a recording and start playback to visualize data
            </p>
          </div>
        ) : selectedTopics.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
            <LineChart className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-amber-900 mb-2">
              No Topics Selected
            </p>
            <p className="text-sm text-amber-700">
              Select topics from the Topic Selection panel to visualize their data
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="charts" className="text-xs">
                <LineChart className="h-3 w-3 mr-1" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                JSON
              </TabsTrigger>
            </TabsList>

            {/* Charts Tab */}
            <TabsContent value="charts" className="mt-4">
              {!hasMessages ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-blue-900">
                    Press play to start visualization
                  </p>
                </div>
              ) : chartData.fields.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-amber-900 mb-2">
                    No numeric fields found
                  </p>
                  <p className="text-xs text-amber-700">
                    The selected topics don't contain plottable numeric data. Try the JSON view instead.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Render a chart for each topic */}
                  {Array.from(fieldsByTopic.entries()).map(([topicName, fields]) => {
                    const topic = availableTopics.find(t => t.topicName === topicName)
                    if (!topic) return null

                    return (
                      <div key={topicName} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <p className="text-sm font-semibold text-gray-900">
                            {topicName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {topic.topicType}
                          </Badge>
                        </div>

                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsLineChart data={chartData.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="time"
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                              fontSize={11}
                              stroke="#6b7280"
                            />
                            <YAxis fontSize={11} stroke="#6b7280" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: '11px' }}
                              formatter={(value: string) => {
                                const fieldPath = value.split('::')[1]
                                return fieldPath
                              }}
                            />
                            {fields.map((field, idx) => (
                              <Line
                                key={field}
                                type="monotone"
                                dataKey={field}
                                stroke={topic.color}
                                strokeWidth={2}
                                dot={false}
                                name={field}
                                connectNulls
                              />
                            ))}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* JSON Tab */}
            <TabsContent value="json" className="mt-4">
              {!hasMessages ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-blue-900">
                    Press play to view message data
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.from(currentMessages.entries()).map(([topicName, message]) => {
                    const topic = availableTopics.find(t => t.topicName === topicName)
                    if (!topic) return null

                    return (
                      <div key={topicName} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <p className="text-sm font-semibold text-gray-900">
                            {topicName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {topic.topicType}
                          </Badge>
                        </div>
                        <div className="bg-gray-50 p-3">
                          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

