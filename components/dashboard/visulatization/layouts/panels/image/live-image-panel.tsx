"use client"

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { useTopicsStore } from "@/store/topic-store"
import { ImageSettings } from "./image-settings"
import { ImageRenderer } from "./image-renderer"
import { decodeCompressedImage } from "./image-decoder"
import { getPanelWorkerManager } from "@/lib/workers/panels/panel-worker-manager"
import type { Panel } from "../../core/types"
import type {
  ImagePanelConfig,
  RawImageMessage,
  CompressedImageMessage,
  ImageMarkerMessage,
  DecodedImage,
} from "./types"

interface LiveImagePanelProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
  onDelete?: (id: string) => void
}

export function LiveImagePanel({
  panel,
  onUpdatePanel,
  onDelete,
}: LiveImagePanelProps) {
  // Use targeted selectors to prevent unnecessary re-renders
  const topics = useTopicsStore((state) => state.topics)
  const subscribers = useTopicsStore((state) => state.subscribers)
  const createSubscriber = useTopicsStore((state) => state.createSubscriber)

  const config = (panel.config as ImagePanelConfig) || {}

  // Worker-decoded image state (for raw images)
  const [workerDecodedImage, setWorkerDecodedImage] = useState<DecodedImage | null>(null)
  
  // Main thread decoded image (for compressed images)
  const [compressedImage, setCompressedImage] = useState<DecodedImage | null>(null)

  // Track worker configuration and last processed message
  const workerConfiguredRef = useRef(false)
  const lastMessageTimestampRef = useRef<number>(0)

  // Get topic types
  const imageTopicType = useMemo(() => {
    if (!config.imageTopic) return null
    const topic = topics.find((t) => t.name === config.imageTopic)
    return topic?.type || null
  }, [topics, config.imageTopic])

  const calibrationTopicType = useMemo(() => {
    if (!config.calibrationTopic) return null
    const topic = topics.find((t) => t.name === config.calibrationTopic)
    return topic?.type || null
  }, [topics, config.calibrationTopic])

  // Configure image worker when panel or config changes
  useEffect(() => {
    if (!config.imageTopic) return

    const workerManager = getPanelWorkerManager()

    workerManager.configureImagePanel(
      {
        panelId: panel.id,
        colorMode: config.colorMode || 'raw',
        colorMap: config.colorMap || 'turbo',
        gradientColors: config.gradientColors,
        valueMin: config.valueMin ?? 0,
        valueMax: config.valueMax ?? 10000,
        flipHorizontal: config.flipHorizontal || false,
        flipVertical: config.flipVertical || false,
        rotation: config.rotation || 0,
      },
      (panelId, image, timestamp) => {
        if (panelId === panel.id) {
          // Convert ArrayBuffer back to Uint8ClampedArray for DecodedImage
          const decoded: DecodedImage = {
            width: image.width,
            height: image.height,
            data: new Uint8ClampedArray(image.data),
            encoding: image.encoding,
          }
          setWorkerDecodedImage(decoded)
        }
      },
      (panelId, error) => {
        console.error(`[LiveImagePanel] Worker error for ${panelId}:`, error)
      }
    )

    workerConfiguredRef.current = true

    return () => {
      // Clean up worker state on unmount
      workerManager.removeImagePanel(panel.id)
      workerConfiguredRef.current = false
    }
  }, [
    panel.id,
    config.imageTopic,
    config.colorMode,
    config.colorMap,
    config.gradientColors,
    config.valueMin,
    config.valueMax,
    config.flipHorizontal,
    config.flipVertical,
    config.rotation,
  ])

  // Subscribe to image topic
  useEffect(() => {
    if (!config.imageTopic || !imageTopicType) return

    const existingSubscriber = subscribers.get(config.imageTopic)
    if (!existingSubscriber) {
      try {
        createSubscriber(config.imageTopic, imageTopicType)
      } catch (error) {
        console.error("Failed to subscribe to image topic:", error)
      }
    }
  }, [config.imageTopic, imageTopicType, createSubscriber, subscribers])

  // Subscribe to calibration topic
  useEffect(() => {
    if (!config.calibrationTopic || !calibrationTopicType) return

    const existingSubscriber = subscribers.get(config.calibrationTopic)
    if (!existingSubscriber) {
      try {
        createSubscriber(config.calibrationTopic, calibrationTopicType)
      } catch (error) {
        console.error("Failed to subscribe to calibration topic:", error)
      }
    }
  }, [config.calibrationTopic, calibrationTopicType, createSubscriber, subscribers])

  // Subscribe to annotation topics
  useEffect(() => {
    if (!config.annotationTopics || config.annotationTopics.length === 0) return

    config.annotationTopics.forEach((topicName) => {
      const topic = topics.find((t) => t.name === topicName)
      if (!topic) return

      const existingSubscriber = subscribers.get(topicName)
      if (!existingSubscriber) {
        try {
          createSubscriber(topicName, topic.type)
        } catch (error) {
          console.error("Failed to subscribe to annotation topic:", error)
        }
      }
    })
  }, [config.annotationTopics, topics, createSubscriber, subscribers])

  // Forward raw images to worker for processing
  useEffect(() => {
    if (!workerConfiguredRef.current || !config.imageTopic) return
    if (imageTopicType !== "sensor_msgs/Image") return

    const subscriber = subscribers.get(config.imageTopic)
    if (!subscriber?.latestMessage) return

    const message = subscriber.latestMessage as RawImageMessage
    const timestamp = Date.now()

    // Check if we've already processed this message (use a simple check)
    // We use the message header timestamp if available
    const messageTimestamp = message.header?.stamp 
      ? message.header.stamp.secs * 1000 + message.header.stamp.nsecs / 1000000
      : timestamp

    if (messageTimestamp <= lastMessageTimestampRef.current) return
    lastMessageTimestampRef.current = messageTimestamp

    // Convert image data to ArrayBuffer for transfer
    const dataArray = message.data instanceof Uint8Array 
      ? message.data 
      : new Uint8Array(message.data)
    
    // Create a copy of the buffer for transfer
    const buffer = dataArray.buffer.slice(
      dataArray.byteOffset,
      dataArray.byteOffset + dataArray.byteLength
    ) as ArrayBuffer

    const workerManager = getPanelWorkerManager()
    workerManager.decodeRawImage(
      panel.id,
      message.width,
      message.height,
      message.encoding,
      buffer,
      timestamp
    )
  }, [panel.id, config.imageTopic, imageTopicType, subscribers])

  // Handle compressed images on main thread (requires DOM APIs)
  useEffect(() => {
    if (!config.imageTopic || imageTopicType !== "sensor_msgs/CompressedImage") {
      setCompressedImage(null)
      return
    }

    const subscriber = subscribers.get(config.imageTopic)
    if (!subscriber?.latestMessage) {
      setCompressedImage(null)
      return
    }

    const message = subscriber.latestMessage as CompressedImageMessage

    decodeCompressedImage(message)
      .then((decoded) => {
        if (decoded) {
          // Note: Transformations for compressed images still happen on main thread
          // because we need the decoded image first
          setCompressedImage(decoded)
        } else {
          setCompressedImage(null)
        }
      })
      .catch((error) => {
        console.error("Error decoding compressed image:", error)
        setCompressedImage(null)
      })
  }, [config.imageTopic, imageTopicType, subscribers])

  // Get final image (prefer worker-decoded raw image, fall back to compressed)
  const finalImage = useMemo(() => {
    if (imageTopicType === "sensor_msgs/CompressedImage") {
      return compressedImage
    }
    return workerDecodedImage
  }, [imageTopicType, workerDecodedImage, compressedImage])

  // Get annotations
  const annotations = useMemo<ImageMarkerMessage[]>(() => {
    if (!config.annotationTopics || config.annotationTopics.length === 0) {
      return []
    }

    const allAnnotations: ImageMarkerMessage[] = []

    config.annotationTopics.forEach((topicName) => {
      const subscriber = subscribers.get(topicName)
      if (subscriber?.latestMessage) {
        allAnnotations.push(subscriber.latestMessage as ImageMarkerMessage)
      }
    })

    return allAnnotations
  }, [config.annotationTopics, subscribers])

  const handleConfigChange = useCallback(
    (newConfig: ImagePanelConfig) => {
      // Reset if topic changed
      if (newConfig.imageTopic !== config.imageTopic) {
        setWorkerDecodedImage(null)
        setCompressedImage(null)
        lastMessageTimestampRef.current = 0
      }
      onUpdatePanel(panel.id, { config: newConfig })
    },
    [panel.id, config.imageTopic, onUpdatePanel]
  )

  const handleTransformChange = useCallback(
    (scale: number, offsetX: number, offsetY: number) => {
      const newConfig: ImagePanelConfig = {
        ...config,
        transform: { scale, offsetX, offsetY },
      }
      onUpdatePanel(panel.id, { config: newConfig })
    },
    [config, panel.id, onUpdatePanel]
  )

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id)
    }
  }, [onDelete, panel.id])

  // Empty state when no configuration
  if (!config.imageTopic) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-100 flex gap-2">
          <ImageSettings config={config} onConfigChange={handleConfigChange} />
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
          <div className="text-sm font-medium text-gray-600 mb-2">
            Image Panel
          </div>
          <div className="text-xs text-gray-500">
            Click settings icon to select an image topic
          </div>
        </div>
      </div>
    )
  }

  // Empty state when no data
  if (!finalImage) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <ImageSettings config={config} onConfigChange={handleConfigChange} />
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
          <div className="text-sm font-medium text-gray-600 mb-2">
            Waiting for image data...
          </div>
          <div className="text-xs text-gray-500">
            Topic: {config.imageTopic}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <ImageSettings config={config} onConfigChange={handleConfigChange} />
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
      <ImageRenderer
        image={finalImage}
        annotations={annotations}
        onTransformChange={handleTransformChange}
        initialScale={config.transform?.scale}
        initialOffsetX={config.transform?.offsetX}
        initialOffsetY={config.transform?.offsetY}
      />
    </div>
  )
}
