'use client'

import React, { useEffect, useState } from 'react'
import { useRosbagRecordStore } from '@/store/rosbag-record-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, Clock, Database, Hash } from 'lucide-react'

export function RecordingStatus () {
  const { status, metadata, recordingTopics } = useRosbagRecordStore()
  const [elapsedTime, setElapsedTime] = useState(0)

  const isRecording = status === 'recording'

  // Update elapsed time while recording
  useEffect(() => {
    if (!isRecording || !metadata) {
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - metadata.startTime
      setElapsedTime(elapsed)
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [isRecording, metadata])

  // Calculate total messages from recording topics
  const totalMessages = Array.from(recordingTopics.values())
    .reduce((sum, topic) => sum + topic.messageCount, 0)

  // Format time as HH:MM:SS.mmm
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 100)

    const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${milliseconds}`
  }

  // Calculate message rate (messages per second)
  const messageRate = elapsedTime > 0 
    ? (totalMessages / (elapsedTime / 1000)).toFixed(1)
    : '0.0'

  if (!isRecording && totalMessages === 0) {
    return null
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-green-300">
      <CardHeader className="bg-green-50 border-green-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <Activity className="h-5 w-5 mt-0.5 text-green-600" />
          
          <div className="min-w-0">
            <CardTitle className="text-base text-green-900">
              Live Recording Status
            </CardTitle>
            <CardDescription className="text-xs text-green-800 mt-1">
              Real-time recording statistics
            </CardDescription>
          </div>

          {isRecording && (
            <Badge 
              className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs flex items-center gap-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Elapsed Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {isRecording ? formatTime(elapsedTime) : formatTime(metadata?.duration || 0)}
            </p>
          </div>

          {/* Total Messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-medium">Messages</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {totalMessages.toLocaleString()}
            </p>
          </div>

          {/* Message Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Rate</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {messageRate}
              <span className="text-sm text-gray-500 ml-1">msg/s</span>
            </p>
          </div>

          {/* Topic Count */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium">Topics</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {recordingTopics.size}
            </p>
          </div>
        </div>

        {/* Topics List */}
        {recordingTopics.size > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-3">Recording Topics</p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Array.from(recordingTopics.values()).map((topic) => (
                <div
                  key={topic.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium text-gray-900 truncate cursor-help">
                            {topic.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{topic.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-gray-500 font-mono truncate cursor-help">
                            {topic.type}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-mono">{topic.type}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">
                      {topic.messageCount.toLocaleString()} msgs
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

