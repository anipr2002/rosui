"use client";

import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { Trash2, FileText } from "lucide-react";
import { useTopicsStore } from "@/store/topic-store";
import { RawTopicSettings } from "./raw-topic-settings";
import type { Panel } from "../../core/types";
import type { RawTopicViewerConfig } from "./types";

interface LiveRawTopicViewerProps {
  panel: Panel;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  onDelete?: (id: string) => void;
}

export function LiveRawTopicViewer({
  panel,
  onUpdatePanel,
  onDelete,
}: LiveRawTopicViewerProps) {
  const { topics, subscribers, createSubscriber } = useTopicsStore();
  const config = (panel.config as RawTopicViewerConfig) || {};
  const startTimeRef = useRef<number | null>(null);

  // Get topic type
  const topicType = useMemo(() => {
    if (!config.topic) return null;
    const topic = topics.find((t) => t.name === config.topic);
    return topic?.type || null;
  }, [topics, config.topic]);

  // Subscribe to topic
  useEffect(() => {
    if (!config.topic || !topicType) return;

    const existingSubscriber = subscribers.get(config.topic);
    if (!existingSubscriber) {
      try {
        createSubscriber(config.topic, topicType);
      } catch (error) {
        console.error("Failed to subscribe:", error);
      }
    }
  }, [config.topic, topicType, createSubscriber, subscribers]);

  // Get latest message
  const latestMessage = useMemo(() => {
    if (!config.topic) return null;

    const subscriber = subscribers.get(config.topic);
    if (!subscriber) return null;

    // Prefer messages array which has MessageRecord with timestamp
    // If messages array is empty, fall back to latestMessage
    if (subscriber.messages && subscriber.messages.length > 0) {
      return subscriber.messages[0]; // First item is most recent
    }

    // Fallback: latestMessage is raw message data, wrap it
    if (subscriber.latestMessage) {
      return {
        data: subscriber.latestMessage,
        timestamp: Date.now(),
      };
    }

    return null;
  }, [config.topic, subscribers]);

  // Format the message for display
  const formattedMessage = useMemo(() => {
    if (!latestMessage) return null;

    try {
      // Safety check for undefined or null data
      if (latestMessage.data === undefined || latestMessage.data === null) {
        return "No message data available";
      }

      const prettyPrint = config.prettyPrint ?? true;
      const maxLength = config.maxMessageLength || 10000;

      let jsonString = JSON.stringify(
        latestMessage.data,
        null,
        prettyPrint ? 2 : 0
      );

      // Apply max length truncation
      if (jsonString && jsonString.length > maxLength) {
        jsonString = jsonString.slice(0, maxLength) + "\n... (truncated)";
      }

      return jsonString;
    } catch (error) {
      return (
        "Error formatting message: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }, [latestMessage, config.prettyPrint, config.maxMessageLength]);

  // Format timestamp (relative to first message)
  const formattedTimestamp = useMemo(() => {
    if (!latestMessage) return null;

    // Initialize start time on first message
    if (startTimeRef.current === null) {
      startTimeRef.current = latestMessage.timestamp;
    }

    const relativeTime =
      (latestMessage.timestamp - (startTimeRef.current ?? latestMessage.timestamp)) / 1000;
    return `${relativeTime.toFixed(3)}s`;
  }, [latestMessage]);

  const handleConfigChange = useCallback(
    (newConfig: RawTopicViewerConfig) => {
      // Reset start time if topic changed
      if (newConfig.topic !== config.topic) {
        startTimeRef.current = null;
      }
      onUpdatePanel(panel.id, { config: newConfig });
    },
    [panel.id, config.topic, onUpdatePanel]
  );

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id);
    }
  }, [onDelete, panel.id]);

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
    );
  }

  // Empty state when waiting for data
  if (!latestMessage) {
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
    );
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
  );
}
