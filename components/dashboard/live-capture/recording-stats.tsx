"use client";

import { useEffect, useState } from "react";
import { BarChart3, Radio, TrendingUp, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLiveCaptureStore } from "@/store/live-capture-store";
import {
  liveCaptureDB,
  formatBytes,
  type TopicStats,
} from "@/lib/db/live-capture-db";

export function RecordingStats() {
  const { currentRecordingId, stats, status } = useLiveCaptureStore();
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isRecording = status === "recording";

  // Load topic statistics
  useEffect(() => {
    if (!currentRecordingId) {
      setTopicStats([]);
      return;
    }

    const loadStats = async () => {
      setIsLoading(true);
      try {
        const stats = await liveCaptureDB.getTopicStats(currentRecordingId);
        setTopicStats(stats);
      } catch (error) {
        console.error("Failed to load topic stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load immediately
    loadStats();

    // Refresh stats every 2 seconds while recording
    if (isRecording) {
      const interval = setInterval(loadStats, 2000);
      return () => clearInterval(interval);
    }
  }, [currentRecordingId, isRecording]);

  // Calculate total messages per second
  const totalMessagesPerSecond = Array.from(
    stats.messagesPerSecond.values()
  ).reduce((sum, rate) => sum + rate, 0);

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <BarChart3 className="h-5 w-5 mt-0.5 text-teal-900" />
          <div>
            <CardTitle className="text-base text-teal-900">
              Recording Statistics
            </CardTitle>
            <CardDescription className="text-xs text-teal-700">
              Real-time message and topic stats
            </CardDescription>
          </div>
          {isRecording && (
            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs">Live</span>
              </div>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">
                  Total Messages
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {stats.totalMessages.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">
                  Rate (msg/s)
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {totalMessagesPerSecond.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Topic Breakdown */}
          {topicStats.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Topic Breakdown
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="topics" className="border rounded-lg">
                  <AccordionTrigger className="px-4 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-gray-600" />
                      <span>{topicStats.length} Topics</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {topicStats.map((topicStat) => (
                        <div
                          key={topicStat.topicName}
                          className="bg-gray-50 border rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-gray-900 truncate flex-1">
                              {topicStat.topicName}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {topicStat.messageCount.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500">Messages</p>
                              <p className="font-medium text-gray-900">
                                {topicStat.messageCount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Size</p>
                              <p className="font-medium text-gray-900">
                                {formatBytes(topicStat.totalSize)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                First:{" "}
                                {new Date(
                                  topicStat.firstMessage
                                ).toLocaleTimeString()}
                              </span>
                              <span>
                                Last:{" "}
                                {new Date(
                                  topicStat.lastMessage
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed rounded-lg p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-2">
                No statistics available
              </p>
              <p className="text-sm text-gray-500">
                {isRecording
                  ? "Statistics will appear once messages are recorded"
                  : "Start recording to see topic statistics"}
              </p>
            </div>
          )}

          {/* Message Rate by Topic */}
          {isRecording && stats.messagesPerSecond.size > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Message Rates</p>
              <div className="space-y-2">
                {Array.from(stats.messagesPerSecond.entries()).map(
                  ([topic, rate]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between gap-2"
                    >
                      <p className="text-xs text-gray-600 truncate flex-1 font-mono">
                        {topic}
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-teal-50 text-teal-700 border-teal-200 text-xs"
                      >
                        {rate.toFixed(1)} msg/s
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && topicStats.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-sm text-amber-900">Loading statistics...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
