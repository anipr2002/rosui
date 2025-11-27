"use client";

import React, { useState, useEffect } from "react";
import { useTopicsStore } from "@/store/topic-store";
import { messageTypeParser } from "@/lib/ros/messageTypeParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Play, CirclePause, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TopicPublishTabProps {
  topicName: string;
  topicType: string;
}

export function TopicPublishTab({
  topicName,
  topicType,
}: TopicPublishTabProps) {
  const {
    publishers,
    createPublisher,
    publish,
    startPeriodicPublish,
    stopPeriodicPublish,
    removePublisher,
    isLoadingTopics,
  } = useTopicsStore();

  const publisher = publishers.get(topicName);
  const [messageJson, setMessageJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [publishRate, setPublishRate] = useState(1);

  useEffect(() => {
    // Initialize publisher if not exists
    if (!publisher) {
      try {
        createPublisher(topicName, topicType);
      } catch (error) {
        console.error("Failed to create publisher:", error);
        toast.error(`Failed to create publisher for ${topicName}`);
      }
    }

    // Initialize with default message structure
    // Only initialize after types are loaded to avoid parser errors
    if (messageJson === "" && !isLoadingTopics) {
      try {
        const defaultMessage =
          messageTypeParser.createDefaultMessage(topicType);
        if (defaultMessage && Object.keys(defaultMessage).length > 0) {
          setMessageJson(JSON.stringify(defaultMessage, null, 2));
        } else {
          // Fallback to empty object if parser can't create default
          setMessageJson("{}");
        }
      } catch (error) {
        console.error("Failed to create default message:", error);
        setMessageJson("{}");
      }
    }
  }, [
    publisher,
    topicName,
    topicType,
    createPublisher,
    messageJson,
    isLoadingTopics,
  ]);

  const validateJson = (jsonStr: string): any | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      return null;
    }
  };

  const handlePublishOnce = () => {
    const message = validateJson(messageJson);
    if (!message) {
      toast.error("Invalid JSON format");
      return;
    }

    try {
      publish(topicName, message);
      toast.success("Message published successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to publish message";
      toast.error(errorMessage);
      console.error("Publish error:", error);
    }
  };

  const handleStartPeriodic = () => {
    const message = validateJson(messageJson);
    if (!message) {
      toast.error("Invalid JSON format");
      return;
    }

    if (publishRate <= 0 || publishRate > 100) {
      toast.error("Publish rate must be between 0 and 100 Hz");
      return;
    }

    try {
      startPeriodicPublish(topicName, message, publishRate);
      toast.success(`Started publishing at ${publishRate} Hz`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start periodic publishing";
      toast.error(errorMessage);
      console.error("Periodic publish error:", error);
    }
  };

  const handleStopPeriodic = () => {
    try {
      stopPeriodicPublish(topicName);
      toast.info("Stopped periodic publishing");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to stop periodic publishing";
      toast.error(errorMessage);
      console.error("Stop periodic publish error:", error);
    }
  };

  const handleMessageChange = (value: string) => {
    setMessageJson(value);
    // Clear error when user starts typing
    if (jsonError) {
      setJsonError(null);
    }
  };

  const isPublishing = publisher?.isPublishing || false;

  return (
    <div className="space-y-4">
      {/* JSON Editor */}
      <div className="space-y-2">
        <Label htmlFor="message-json" className="text-sm font-medium">
          Message (JSON)
        </Label>
        <textarea
          id="message-json"
          value={messageJson}
          onChange={(e) => handleMessageChange(e.target.value)}
          className="w-full min-h-[200px] p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          placeholder="Enter message JSON..."
          disabled={isPublishing}
        />
        {jsonError && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}
      </div>

      {/* Publish Once Button */}
      <Button
        onClick={handlePublishOnce}
        disabled={isPublishing || !!jsonError}
        className="w-full bg-purple-200 border-1 border-purple-500 hover:bg-purple-500 hover:text-white text-purple-500"
      >
        <Send className="mr-2 h-4 w-4" />
        Publish Once
      </Button>

      {/* Periodic Publishing */}
      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-semibold text-gray-700">
          Periodic Publishing
        </Label>

        <div className="space-y-2">
          <Label htmlFor="publish-rate" className="text-sm font-medium">
            Rate (Hz)
          </Label>
          <Input
            id="publish-rate"
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={publishRate}
            onChange={(e) => setPublishRate(parseFloat(e.target.value))}
            disabled={isPublishing}
            className="bg-white"
          />
          <p className="text-xs text-gray-500">
            Publish rate between 0.1 and 100 Hz
          </p>
        </div>

        {!isPublishing ? (
          <Button
            onClick={handleStartPeriodic}
            disabled={!!jsonError}
            variant="outline"
            className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Periodic Publishing
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700 font-medium">
                Publishing at {publisher?.publishRate} Hz
              </p>
            </div>
            <Button
              onClick={handleStopPeriodic}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <CirclePause className="mr-2 h-4 w-4" />
              Stop Publishing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
