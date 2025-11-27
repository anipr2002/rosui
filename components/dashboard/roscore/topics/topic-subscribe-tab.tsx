"use client";

import React, { useState } from "react";
import { useTopicsStore } from "@/store/topic-store";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Play, CirclePause, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TopicSubscribeTabProps {
  topicName: string;
  topicType: string;
}

export function TopicSubscribeTab({
  topicName,
  topicType,
}: TopicSubscribeTabProps) {
  const {
    subscribers,
    createSubscriber,
    removeSubscriber,
    clearMessageHistory,
  } = useTopicsStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const subscriber = subscribers.get(topicName);
  const isSubscribed = !!subscriber;

  const handleSubscribe = () => {
    try {
      createSubscriber(topicName, topicType);
      toast.success(`Subscribed to ${topicName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to subscribe";
      toast.error(errorMessage);
      console.error("Subscription error:", error);
    }
  };

  const handleUnsubscribe = () => {
    try {
      removeSubscriber(topicName);
      toast.info(`Unsubscribed from ${topicName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unsubscribe";
      toast.error(errorMessage);
      console.error("Unsubscribe error:", error);
    }
  };

  const handleClearHistory = () => {
    try {
      clearMessageHistory(topicName);
      toast.info("Message history cleared");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clear history";
      toast.error(errorMessage);
      console.error("Clear history error:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString() +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  if (!isSubscribed) {
    return (
      <div className="space-y-4">
        <Button
          onClick={handleSubscribe}
          className="w-full bg-green-200 border-1 border-green-500 hover:bg-green-500 hover:text-white text-green-500"
        >
          <Play className="mr-2 h-4 w-4" />
          Subscribe
        </Button>

        <div className="p-8 text-center border-2 border-dashed rounded-lg">
          <p className="text-sm text-gray-500">
            Click Subscribe to start receiving messages from this topic
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleUnsubscribe}
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <CirclePause className="mr-2 h-4 w-4" />
          Unsubscribe
        </Button>

        {subscriber.messages.length > 0 && (
          <Button
            onClick={handleClearHistory}
            variant="outline"
            size="icon"
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {subscriber.latestMessage ? (
        <div className="space-y-4">
          {/* Latest Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Latest Message
              </h4>
              <span className="text-xs text-gray-500">
                {formatTimestamp(
                  subscriber.messages[0]?.timestamp || Date.now()
                )}
              </span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                {JSON.stringify(subscriber.latestMessage, null, 2)}
              </pre>
            </div>
          </div>

          {/* Message History */}
          {subscriber.messages.length > 1 && (
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="text-sm font-medium">
                    Message History ({subscriber.messages.length - 1} older)
                  </span>
                  {isHistoryOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-2">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {subscriber.messages.slice(1, 21).map((msg, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Message #{index + 2}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-lg bg-green-50">
          <p className="text-sm text-green-700">
            Subscribed - waiting for messages...
          </p>
        </div>
      )}
    </div>
  );
}
