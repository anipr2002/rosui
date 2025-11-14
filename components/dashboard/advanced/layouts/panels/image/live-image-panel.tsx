"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useTopicsStore } from "@/store/topic-store";
import { ImageSettings } from "./image-settings";
import { ImageRenderer } from "./image-renderer";
import {
  decodeRawImage,
  decodeCompressedImage,
  transformImage,
} from "./image-decoder";
import type { Panel } from "../../core/types";
import type {
  ImagePanelConfig,
  RawImageMessage,
  CompressedImageMessage,
  ImageMarkerMessage,
  DecodedImage,
} from "./types";

interface LiveImagePanelProps {
  panel: Panel;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  onDelete?: (id: string) => void;
}

export function LiveImagePanel({
  panel,
  onUpdatePanel,
  onDelete,
}: LiveImagePanelProps) {
  const { topics, subscribers, createSubscriber } = useTopicsStore();
  const config = (panel.config as ImagePanelConfig) || {};

  // Get topic types
  const imageTopicType = useMemo(() => {
    if (!config.imageTopic) return null;
    const topic = topics.find((t) => t.name === config.imageTopic);
    return topic?.type || null;
  }, [topics, config.imageTopic]);

  const calibrationTopicType = useMemo(() => {
    if (!config.calibrationTopic) return null;
    const topic = topics.find((t) => t.name === config.calibrationTopic);
    return topic?.type || null;
  }, [topics, config.calibrationTopic]);

  // Subscribe to image topic
  useEffect(() => {
    if (!config.imageTopic || !imageTopicType) return;

    const existingSubscriber = subscribers.get(config.imageTopic);
    if (!existingSubscriber) {
      try {
        createSubscriber(config.imageTopic, imageTopicType);
      } catch (error) {
        console.error("Failed to subscribe to image topic:", error);
      }
    }
  }, [config.imageTopic, imageTopicType, createSubscriber, subscribers]);

  // Subscribe to calibration topic
  useEffect(() => {
    if (!config.calibrationTopic || !calibrationTopicType) return;

    const existingSubscriber = subscribers.get(config.calibrationTopic);
    if (!existingSubscriber) {
      try {
        createSubscriber(config.calibrationTopic, calibrationTopicType);
      } catch (error) {
        console.error("Failed to subscribe to calibration topic:", error);
      }
    }
  }, [
    config.calibrationTopic,
    calibrationTopicType,
    createSubscriber,
    subscribers,
  ]);

  // Subscribe to annotation topics
  useEffect(() => {
    if (!config.annotationTopics || config.annotationTopics.length === 0)
      return;

    config.annotationTopics.forEach((topicName) => {
      const topic = topics.find((t) => t.name === topicName);
      if (!topic) return;

      const existingSubscriber = subscribers.get(topicName);
      if (!existingSubscriber) {
        try {
          createSubscriber(topicName, topic.type);
        } catch (error) {
          console.error("Failed to subscribe to annotation topic:", error);
        }
      }
    });
  }, [config.annotationTopics, topics, createSubscriber, subscribers]);

  // Decode and process image
  const processedImage = useMemo<DecodedImage | null>(() => {
    if (!config.imageTopic) return null;

    const subscriber = subscribers.get(config.imageTopic);
    if (!subscriber?.latestMessage) return null;

    const message = subscriber.latestMessage;

    try {
      let decoded: DecodedImage | null = null;

      // Check if it's a raw or compressed image
      if (imageTopicType === "sensor_msgs/Image") {
        // Raw image
        decoded = decodeRawImage(
          message as RawImageMessage,
          config.colorMode || "raw",
          config.colorMap || "turbo",
          config.gradientColors,
          config.valueMin ?? 0,
          config.valueMax ?? 10000
        );
      } else if (imageTopicType === "sensor_msgs/CompressedImage") {
        // Compressed image - this is async, so we need to handle it differently
        // For now, return null and handle async decoding separately
        return null;
      }

      if (!decoded) return null;

      // Apply transformations
      const transformed = transformImage(
        decoded,
        config.flipHorizontal || false,
        config.flipVertical || false,
        config.rotation || 0
      );

      return transformed;
    } catch (error) {
      console.error("Error processing image:", error);
      return null;
    }
  }, [
    config.imageTopic,
    config.colorMode,
    config.colorMap,
    config.gradientColors,
    config.valueMin,
    config.valueMax,
    config.flipHorizontal,
    config.flipVertical,
    config.rotation,
    subscribers,
    imageTopicType,
  ]);

  // Handle compressed images separately (async)
  const [compressedImage, setCompressedImage] =
    React.useState<DecodedImage | null>(null);

  useEffect(() => {
    if (
      !config.imageTopic ||
      imageTopicType !== "sensor_msgs/CompressedImage"
    ) {
      setCompressedImage(null);
      return;
    }

    const subscriber = subscribers.get(config.imageTopic);
    if (!subscriber?.latestMessage) {
      setCompressedImage(null);
      return;
    }

    const message = subscriber.latestMessage as CompressedImageMessage;

    decodeCompressedImage(message)
      .then((decoded) => {
        if (decoded) {
          const transformed = transformImage(
            decoded,
            config.flipHorizontal || false,
            config.flipVertical || false,
            config.rotation || 0
          );
          setCompressedImage(transformed);
        } else {
          setCompressedImage(null);
        }
      })
      .catch((error) => {
        console.error("Error decoding compressed image:", error);
        setCompressedImage(null);
      });
  }, [
    config.imageTopic,
    config.flipHorizontal,
    config.flipVertical,
    config.rotation,
    subscribers,
    imageTopicType,
  ]);

  // Get final image (compressed or raw)
  const finalImage =
    imageTopicType === "sensor_msgs/CompressedImage"
      ? compressedImage
      : processedImage;

  // Get annotations
  const annotations = useMemo<ImageMarkerMessage[]>(() => {
    if (!config.annotationTopics || config.annotationTopics.length === 0) {
      return [];
    }

    const allAnnotations: ImageMarkerMessage[] = [];

    config.annotationTopics.forEach((topicName) => {
      const subscriber = subscribers.get(topicName);
      if (subscriber?.latestMessage) {
        allAnnotations.push(subscriber.latestMessage as ImageMarkerMessage);
      }
    });

    return allAnnotations;
  }, [config.annotationTopics, subscribers]);

  const handleConfigChange = useCallback(
    (newConfig: ImagePanelConfig) => {
      onUpdatePanel(panel.id, { config: newConfig });
    },
    [panel.id, onUpdatePanel]
  );

  const handleTransformChange = useCallback(
    (scale: number, offsetX: number, offsetY: number) => {
      // Optionally persist transform state
      const newConfig: ImagePanelConfig = {
        ...config,
        transform: { scale, offsetX, offsetY },
      };
      onUpdatePanel(panel.id, { config: newConfig });
    },
    [config, panel.id, onUpdatePanel]
  );

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id);
    }
  }, [onDelete, panel.id]);

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
    );
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
    );
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
  );
}
