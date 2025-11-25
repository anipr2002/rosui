"use client"

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react"
import { Trash2, FileText } from "lucide-react"
import { useTopicsStore } from "@/store/topic-store"
import { RawTopicSettings } from "./raw-topic-settings"
import { getPanelWorkerManager } from "@/lib/workers/panels/panel-worker-manager"
import type { Panel } from "../../core/types"
import type { RawTopicViewerConfig } from "./types"

interface LiveRawTopicViewerProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
  onDelete?: (id: string) => void
}

export function LiveRawTopicViewer({
  panel,
  onUpdatePanel,
  onDelete,
}: LiveRawTopicViewerProps) {
  // Use targeted selectors to prevent unnecessary re-renders
  const topics = useTopicsStore((state) => state.topics)
  const subscribers = useTopicsStore((state) => state.subscribers)
  const createSubscriber = useTopicsStore((state) => state.createSubscriber)

  const config = (panel.config as RawTopicViewerConfig) || {}
  const startTimeRef = useRef<number | null>(null)
  
  // Worker-processed data state
  const [formattedMessage, setFormattedMessage] = useState<string | null>(null)
  const [messageTimestamp, setMessageTimestamp] = useState<number | null>(null)

  // Track if we've configured the worker and last processed message
  const workerConfiguredRef = useRef(false)
  const lastMessageTimestampRef = useRef<number>(0)

  // Get topic type
  const topicType = useMemo(() => {
    if (!config.topic) return null
    const topic = topics.find((t) => t.name === config.topic)
    return topic?.type || null
  }, [topics, config.topic])

  // Configure worker when panel or config changes
  useEffect(() => {
    if (!config.topic) return

    const workerManager = getPanelWorkerManager()

    workerManager.configureRawTopicPanel(
      {
        panelId: panel.id,
        maxMessageLength: config.maxMessageLength || 10000,
        prettyPrint: config.prettyPrint ?? true,
      },
      (panelId, formatted, timestamp) => {
        if (panelId === panel.id) {
          setFormattedMessage(formatted)
          setMessageTimestamp(timestamp)
        }
      },
      (panelId, error) => {
        console.error(`[LiveRawTopicViewer] Worker error for ${panelId}:`, error)
      }
    )

    workerConfiguredRef.current = true

    return () => {
      // Clean up worker state on unmount
      workerManager.removeRawTopicPanel(panel.id)
      workerConfiguredRef.current = false
    }
  }, [panel.id, config.topic, config.maxMessageLength, config.prettyPrint])

  // Subscribe to topic
  useEffect(() => {
    if (!config.topic || !topicType) return

    const existingSubscriber = subscribers.get(config.topic)
    if (!existingSubscriber) {
      try {
        createSubscriber(config.topic, topicType)
      } catch (error) {
        console.error("Failed to subscribe:", error)
      }
    }
  }, [config.topic, topicType, createSubscriber, subscribers])

  // Forward messages to worker when they arrive
  useEffect(() => {
    if (!workerConfiguredRef.current || !config.topic) return

    const subscriber = subscribers.get(config.topic)
    if (!subscriber) return

    // Get the latest message
    let latestMessage = null
    let timestamp = 0

    if (subscriber.messages && subscriber.messages.length > 0) {
      latestMessage = subscriber.messages[0]
      timestamp = latestMessage.timestamp
    } else if (subscriber.latestMessage) {
      latestMessage = {
        data: subscriber.latestMessage,
        timestamp: Date.now(),
      }
      timestamp = latestMessage.timestamp
    }

    if (!latestMessage) return

    // Check if we've already processed this message
    if (timestamp <= lastMessageTimestampRef.current) return

    // Update last processed timestamp
    lastMessageTimestampRef.current = timestamp

    // Forward to worker for processing
    const workerManager = getPanelWorkerManager()
    workerManager.formatRawTopicMessage(panel.id, latestMessage.data, timestamp)
  }, [panel.id, config.topic, subscribers])

  // Format timestamp (relative to first message)
  const formattedTimestamp = useMemo(() => {
    if (messageTimestamp === null) return null

    // Initialize start time on first message
    if (startTimeRef.current === null) {
      startTimeRef.current = messageTimestamp
    }

    const relativeTime = (messageTimestamp - (startTimeRef.current ?? messageTimestamp)) / 1000
    return `${relativeTime.toFixed(3)}s`
  }, [messageTimestamp])

  const handleConfigChange = useCallback(
    (newConfig: RawTopicViewerConfig) => {
      // Reset start time if topic changed
      if (newConfig.topic !== config.topic) {
        startTimeRef.current = null
        lastMessageTimestampRef.current = 0
        setFormattedMessage(null)
        setMessageTimestamp(null)
      }
      onUpdatePanel(panel.id, { config: newConfig })
    },
    [panel.id, config.topic, onUpdatePanel]
  )

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id)
    }
  }, [onDelete, panel.id])

  // Empty state when no topic selected
  if (!config.topic) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-100 flex gap-2">
          <RawTopicSettings
            config={config}
            onConfigChange={handleConfigChange}
          />
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
              title="Delete Panel"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mb-3" />
          <div className="text-sm font-medium text-gray-600 mb-2">
            Raw Topic Viewer
          </div>
          <div className="text-xs text-gray-500">
            Click settings to select a topic
          </div>
        </div>
      </div>
    )
  }

  // Empty state when waiting for data
  if (!formattedMessage) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <RawTopicSettings
            config={config}
            onConfigChange={handleConfigChange}
          />
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
              title="Delete Panel"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mb-3" />
          <div className="text-sm font-medium text-gray-600 mb-2">
            Waiting for data...
          </div>
          <div className="text-xs text-gray-500 font-mono">{config.topic}</div>
        </div>
      </div>
    )
  }

  // Main view with message data
  return (
    <div className="relative h-full w-full group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <RawTopicSettings config={config} onConfigChange={handleConfigChange} />
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
            title="Delete Panel"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header with topic name and timestamp */}
        <div className="flex-shrink-0 px-3 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-xs font-mono text-gray-700 truncate">
                {config.topic}
              </span>
            </div>
            {config.showTimestamp !== false && formattedTimestamp && (
              <span className="text-xs font-mono text-gray-500 flex-shrink-0">
                {formattedTimestamp}
              </span>
            )}
          </div>
        </div>

        {/* Message content */}
        <div className="flex-1 overflow-auto p-3">
          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
            {formattedMessage}
          </pre>
        </div>
      </div>
    </div>
  )
}
