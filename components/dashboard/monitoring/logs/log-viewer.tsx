"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLogStore } from "@/store/log-store";
import { useRosStore } from "@/store/ros-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Terminal, Wifi, Play, Pause, Loader2, RefreshCw } from "lucide-react";
import { LogEntryRow } from "./log-entry-row";
import { LogFilters } from "./log-filters";
import { LogControls } from "./log-controls";

export function LogViewer() {
  const ros = useRosStore((state) => state.ros);
  const rosStatus = useRosStore((state) => state.status);

  const {
    filteredLogs,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    isAutoScrollEnabled,
    setAutoScroll,
    markAsRead,
    unreadCount,
    selectedTopic,
    availableTopics,
    setSelectedTopic,
    scanTopics,
  } = useLogStore();

  const logContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const isAutoScrolling = useRef(false);

  // Scan topics when ROS connects
  useEffect(() => {
    if (ros && rosStatus === "connected") {
      scanTopics();
    }
  }, [ros, rosStatus, scanTopics]);

  // Subscribe to logs when ROS is connected
  useEffect(() => {
    if (ros && rosStatus === "connected" && !isSubscribed && !isLoading) {
      subscribe().catch((error) => {
        console.error("Failed to subscribe to logs:", error);
      });
    }

    return () => {
      if (isSubscribed) {
        unsubscribe();
      }
    };
  }, [ros, rosStatus, isSubscribed, isLoading, subscribe, unsubscribe, selectedTopic]);

  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScrollEnabled && logContainerRef.current && !userHasScrolled) {
      isAutoScrolling.current = true;
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      // Reset flag after a short delay
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 100);
    }
  }, [filteredLogs, isAutoScrollEnabled, userHasScrolled]);

  // Handle scroll events
  const handleScroll = () => {
    if (!logContainerRef.current || isAutoScrolling.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isAtBottom) {
      // User scrolled back to bottom
      if (!isAutoScrollEnabled) {
        setAutoScroll(true);
        setUserHasScrolled(false);
      }
    } else {
      // User scrolled up
      if (isAutoScrollEnabled) {
        setAutoScroll(false);
        setUserHasScrolled(true);
      }
    }
  };

  const handleJumpToLatest = () => {
    setAutoScroll(true);
    setUserHasScrolled(false);
    markAsRead();
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  const handleTogglePause = () => {
    if (isAutoScrollEnabled) {
      setAutoScroll(false);
      setUserHasScrolled(true);
    } else {
      handleJumpToLatest();
    }
  };

  // Connection status
  const isConnected = ros && rosStatus === "connected";

  return (
    <Card className="shadow-none pt-0 rounded-xl border-indigo-200 gap-0">
      <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Terminal className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0 overflow-hidden space-y-1">
              <CardTitle className="text-sm sm:text-base text-indigo-900">
                ROS Logs Monitor
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedTopic}
                  onValueChange={setSelectedTopic}
                  disabled={!isConnected}
                >
                  <SelectTrigger className="h-7 w-[200px] text-xs bg-white border-indigo-200 text-indigo-900">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map((topic) => (
                      <SelectItem key={topic} value={topic} className="text-xs">
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                  onClick={() => scanTopics()}
                  disabled={!isConnected}
                  title="Refresh topics"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {isLoading ? (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting
                </Badge>
              ) : isSubscribed ? (
                <Badge
                  className={`text-xs cursor-pointer ${
                    isAutoScrollEnabled
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }`}
                  onClick={handleTogglePause}
                >
                  {isAutoScrollEnabled ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
                      Live
                    </>
                  ) : (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                      {unreadCount > 0 && (
                        <span className="ml-1 bg-amber-200 px-1.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                  Disconnected
                </Badge>
              )}
              <div className="text-xs text-gray-500 font-mono">
                {filteredLogs.length}{" "}
                {filteredLogs.length === 1 ? "entry" : "entries"}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {/* Filters and Controls */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-3 bg-gray-50">
          <LogFilters />
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {isAutoScrollEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
            <LogControls onJumpToLatest={handleJumpToLatest} />
          </div>
        </div>

        {/* Log Entries */}
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className="h-[600px] overflow-y-auto bg-white font-mono"
          style={{
            scrollBehavior: isAutoScrollEnabled ? "smooth" : "auto",
          }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  {isSubscribed
                    ? "Waiting for log messages..."
                    : "No logs available"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {filteredLogs.map((log) => (
                <LogEntryRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
