"use client";

import React, { useState } from "react";
import { useRosbagRecordStore } from "@/store/rosbag-record-store";
import { useRosStore } from "@/store/ros-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Circle,
  Square,
  Download,
  Trash2,
  Settings,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function RecordControls() {
  const rosStatus = useRosStore((state) => state.status);
  const {
    status,
    selectedTopics,
    metadata,
    mcapData,
    maxDuration,
    maxSize,
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording,
    setMaxDuration,
    setMaxSize,
  } = useRosbagRecordStore();

  const [filename, setFilename] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [durationInput, setDurationInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");

  const isRecording = status === "recording";
  const canRecord =
    rosStatus === "connected" && selectedTopics.size > 0 && !isRecording;
  const hasRecordedData = mcapData !== null;

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.success("Recording started successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start recording";
      toast.error(message);
      console.error("Recording error:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      toast.success("Recording stopped successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop recording";
      toast.error(message);
      console.error("Stop recording error:", error);
    }
  };

  const handleDownload = () => {
    try {
      const trimmedFilename = filename.trim();
      let finalFilename: string | undefined;

      if (trimmedFilename) {
        // Ensure .mcap extension is added if not already present
        finalFilename = trimmedFilename.toLowerCase().endsWith(".mcap")
          ? trimmedFilename
          : `${trimmedFilename}.mcap`;
      } else {
        finalFilename = undefined;
      }

      downloadRecording(finalFilename);
      toast.success("Recording downloaded successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download recording";
      toast.error(message);
      console.error("Download error:", error);
    }
  };

  const handleClear = () => {
    try {
      clearRecording();
      setFilename("");
      toast.success("Recording cleared");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to clear recording";
      toast.error(message);
      console.error("Clear error:", error);
    }
  };

  const handleDurationChange = () => {
    const duration = parseInt(durationInput);
    if (isNaN(duration) || duration <= 0) {
      setMaxDuration(null);
      setDurationInput("");
    } else {
      setMaxDuration(duration * 1000); // Convert to milliseconds
    }
  };

  const handleSizeChange = () => {
    const size = parseInt(sizeInput);
    if (isNaN(size) || size <= 0) {
      setMaxSize(null);
      setSizeInput("");
    } else {
      setMaxSize(size * 1024 * 1024); // Convert MB to bytes
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "recording":
        return "red";
      case "paused":
        return "amber";
      case "stopping":
        return "gray";
      default:
        return "gray";
    }
  };

  const statusColor = getStatusColor();

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-red-300">
      <CardHeader className="bg-red-50 border-red-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <Circle className="h-5 w-5 mt-0.5 text-red-600" />

          <div className="min-w-0">
            <CardTitle className="text-base text-red-900">
              Recording Controls
            </CardTitle>
            <CardDescription className="text-xs text-red-800 mt-1">
              Start, stop, and manage your rosbag recordings
            </CardDescription>
          </div>

          <Badge
            className={`bg-${statusColor}-100 text-${statusColor}-700 hover:bg-${statusColor}-100 border-${statusColor}-200 text-xs flex items-center gap-1.5`}
          >
            {isRecording && (
              <span
                className={`h-2 w-2 rounded-full bg-${statusColor}-500 animate-pulse`}
              />
            )}
            {status === "recording"
              ? "Recording"
              : status === "stopping"
                ? "Stopping"
                : "Ready"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Connection Warning */}
        {rosStatus !== "connected" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                ROS Not Connected
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Connect to ROS before starting a recording
              </p>
            </div>
          </div>
        )}

        {/* Selection Warning */}
        {rosStatus === "connected" && selectedTopics.size === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                No Topics Selected
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Select at least one topic to record
              </p>
            </div>
          </div>
        )}

        {/* Record/Stop Buttons */}
        <div className="flex items-center gap-2">
          {status !== "recording" && status !== "stopping" ? (
            <Button
              onClick={handleStartRecording}
              disabled={!canRecord}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              <Circle className="h-4 w-4 mr-2 fill-current" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              disabled={status === "stopping"}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white border-0"
            >
              {status === "stopping" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              )}
            </Button>
          )}
        </div>

        {metadata && (
          <>
            <Separator />

            {/* Recording Stats */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 mb-3">
                Recording Statistics
              </p>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-mono text-gray-900">
                  {(metadata.duration / 1000).toFixed(2)}s
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="text-sm font-mono text-gray-900">
                  {metadata.messageCount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Topics</span>
                <span className="text-sm font-mono text-gray-900">
                  {metadata.topics.length}
                </span>
              </div>

              {mcapData && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">File Size</span>
                  <span className="text-sm font-mono text-gray-900">
                    {(mcapData.length / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {hasRecordedData && (
          <>
            <Separator />

            {/* Download Section */}
            <div className="space-y-3">
              <Label
                htmlFor="filename"
                className="text-sm font-medium flex items-center gap-2"
              >
                Filename
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Optional custom filename for the download. Will
                        auto-generate if left empty.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <Input
                id="filename"
                type="text"
                placeholder="rosbag_2024-11-12.mcap"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-white"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MCAP
                </Button>

                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Advanced Options */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-start text-sm text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>

          {showAdvanced && (
            <div className="p-4 rounded-lg border space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="max-duration"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Max Duration (seconds)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Automatically stop recording after this duration.
                          Leave empty for unlimited.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>

                <div className="flex items-center gap-2">
                  <Input
                    id="max-duration"
                    type="number"
                    placeholder="Unlimited"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    onBlur={handleDurationChange}
                    disabled={isRecording}
                    className="bg-white"
                  />
                </div>

                {maxDuration && (
                  <p className="text-xs text-gray-500">
                    Current: {maxDuration / 1000}s
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="max-size"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Max Size (MB)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Automatically stop recording when file size reaches
                          this limit. Leave empty for unlimited.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>

                <div className="flex items-center gap-2">
                  <Input
                    id="max-size"
                    type="number"
                    placeholder="Unlimited"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onBlur={handleSizeChange}
                    disabled={isRecording}
                    className="bg-white"
                  />
                </div>

                {maxSize && (
                  <p className="text-xs text-gray-500">
                    Current: {(maxSize / 1024 / 1024).toFixed(0)} MB
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
