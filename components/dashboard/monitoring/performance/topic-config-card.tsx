'use client'

import React, { useState } from 'react'
import { Settings, Radio, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePerformanceStore } from '@/store/performance-store'
import { useRosStore } from '@/store/ros-store'

export function TopicConfigCard() {
  const sourceTopicConfig = usePerformanceStore((state) => state.sourceTopicConfig)
  const setSourceTopicConfig = usePerformanceStore((state) => state.setSourceTopicConfig)
  const subscribe = usePerformanceStore((state) => state.subscribe)
  const unsubscribe = usePerformanceStore((state) => state.unsubscribe)
  const clearHistory = usePerformanceStore((state) => state.clearHistory)
  const isSubscribed = usePerformanceStore((state) => state.isSubscribed)
  const isLoading = usePerformanceStore((state) => state.isLoading)
  const connectionStatus = useRosStore((state) => state.status)

  const [topicName, setTopicName] = useState(sourceTopicConfig.name)
  const [messageType, setMessageType] = useState(sourceTopicConfig.messageType)
  const [isEditing, setIsEditing] = useState(false)

  const isConnected = connectionStatus === 'connected'

  const handleSave = () => {
    if (topicName.trim() && messageType.trim()) {
      setSourceTopicConfig({
        name: topicName.trim(),
        messageType: messageType.trim()
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setTopicName(sourceTopicConfig.name)
    setMessageType(sourceTopicConfig.messageType)
    setIsEditing(false)
  }

  const handleSubscribeToggle = async () => {
    if (isSubscribed) {
      unsubscribe()
    } else {
      await subscribe()
    }
  }

  const handleClearData = () => {
    clearHistory()
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-indigo-900" />
            <div>
              <CardTitle className="text-base text-indigo-900">Topic Configuration</CardTitle>
              <CardDescription className="text-xs text-indigo-700">
                Configure the source topic for performance metrics
              </CardDescription>
            </div>
          </div>
          {isSubscribed ? (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
              Subscribed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
              Not Subscribed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {/* Topic Name */}
          <div className="space-y-2">
            <Label htmlFor="topic-name" className="text-sm font-medium">
              Topic Name
            </Label>
            {isEditing ? (
              <Input
                id="topic-name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="/diagnostics"
                className="bg-white font-mono text-sm"
              />
            ) : (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                <code className="text-sm text-gray-800">{sourceTopicConfig.name}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 px-2 text-xs"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label htmlFor="message-type" className="text-sm font-medium">
              Message Type
            </Label>
            {isEditing ? (
              <Input
                id="message-type"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                placeholder="diagnostic_msgs/msg/DiagnosticArray"
                className="bg-white font-mono text-sm"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-lg border">
                <code className="text-sm text-gray-800">{sourceTopicConfig.messageType}</code>
              </div>
            )}
          </div>

          {/* Edit mode buttons */}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} size="sm">
                Cancel
              </Button>
            </div>
          )}

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Button
                onClick={handleSubscribeToggle}
                disabled={!isConnected || isLoading}
                size="sm"
                variant={isSubscribed ? 'outline' : 'default'}
                className={
                  isSubscribed
                    ? 'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                  </>
                ) : (
                  <>
                    <Radio className="h-3 w-3 mr-1.5" />
                    {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Clear Data
              </Button>

              {isSubscribed && (
                <Button
                  onClick={() => {
                    unsubscribe()
                    setTimeout(() => subscribe(), 100)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Reconnect
                </Button>
              )}
            </div>
          )}

          {/* Connection status hint */}
          {!isConnected && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                ROS connection required to subscribe to topics.
                Please connect to ROS first.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

