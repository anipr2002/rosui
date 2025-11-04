"use client";

import { useState, useEffect } from "react";
import {
  Circle,
  Square,
  Download,
  Loader2,
  Clock,
  Database,
  Radio as RadioIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLiveCaptureStore,
  formatDuration,
} from "@/store/live-capture-store";
import { formatBytes } from "@/lib/db/live-capture-db";

interface RecordingControlCardProps {
  onExport: () => void;
}

export function RecordingControlCard({ onExport }: RecordingControlCardProps) {
  const {
    status,
    currentRecording,
    selectedTopics,
    stats,
    settings,
    startRecording,
    stopRecording,
    reset,
  } = useLiveCaptureStore();

  const [recordingName, setRecordingName] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const isRecording = status === "recording";
  const isStopped = status === "stopped";
  const canStart =
    selectedTopics.length > 0 &&
    recordingName.trim().length > 0 &&
    !isRecording;

  // Calculate progress percentage
  const progressPercentage =
    (stats.currentSize / settings.sizeLimitBytes) * 100;
  const isWarning = progressPercentage >= 80;

  // Get theme colors based on status
  const getThemeColors = () => {
    if (isRecording) {
      return {
        border: "border-red-300",
        bg: "bg-red-50",
        text: "text-red-900",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        badgeBorder: "border-red-200",
        buttonBg: "bg-red-200",
        buttonBorder: "border-red-500",
        buttonText: "text-red-500",
        buttonHoverBg: "hover:bg-red-500",
        buttonHoverText: "hover:text-white",
      };
    } else if (isStopped) {
      return {
        border: "border-green-300",
        bg: "bg-green-50",
        text: "text-green-900",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        badgeBorder: "border-green-200",
        buttonBg: "bg-green-200",
        buttonBorder: "border-green-500",
        buttonText: "text-green-500",
        buttonHoverBg: "hover:bg-green-500",
        buttonHoverText: "hover:text-white",
      };
    } else if (isWarning && stats.currentSize > 0) {
      return {
        border: "border-amber-300",
        bg: "bg-amber-50",
        text: "text-amber-900",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        badgeBorder: "border-amber-200",
        buttonBg: "bg-amber-200",
        buttonBorder: "border-amber-500",
        buttonText: "text-amber-500",
        buttonHoverBg: "hover:bg-amber-500",
        buttonHoverText: "hover:text-white",
      };
    } else {
      return {
        border: "border-gray-200",
        bg: "bg-gray-50",
        text: "text-gray-900",
        badgeBg: "bg-gray-100",
        badgeText: "text-gray-700",
        badgeBorder: "border-gray-200",
        buttonBg: "bg-gray-200",
        buttonBorder: "border-gray-500",
        buttonText: "text-gray-500",
        buttonHoverBg: "hover:bg-gray-300",
        buttonHoverText: "hover:text-gray-700",
      };
    }
  };

  const theme = getThemeColors();

  const handleStart = async () => {
    if (!canStart) return;

    setIsStarting(true);
    try {
      await startRecording(recordingName.trim());
    } catch (error) {
      console.error("Failed to start recording:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopRecording();
      // Add a small delay to ensure the recording is fully processed
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to stop recording:", error);
    } finally {
      setIsStopping(false);
    }
  };

  // Generate default recording name
  useEffect(() => {
    if (!recordingName && !isRecording) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      setRecordingName(`recording-${timestamp}`);
    }
  }, [recordingName, isRecording]);

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${theme.border}`}>
      <CardHeader
        className={`${theme.bg} ${theme.border} border-b rounded-t-xl pt-6`}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Circle
            className={`h-5 w-5 mt-0.5 ${theme.text} ${
              isRecording ? "animate-pulse fill-current" : ""
            }`}
          />
          <div>
            <CardTitle className={`text-base ${theme.text}`}>
              Recording Control
            </CardTitle>
            <CardDescription className={`text-xs ${theme.text} opacity-80`}>
              {isRecording
                ? "Recording in progress..."
                : isStopped
                ? "Recording completed"
                : "Configure and start recording"}
            </CardDescription>
          </div>
          <Badge
            className={`${theme.badgeBg} ${theme.badgeText} hover:${theme.badgeBg} ${theme.badgeBorder}`}
          >
            <div className="flex items-center gap-1.5">
              {isRecording && (
                <div
                  className={`h-2 w-2 rounded-full bg-red-500 animate-pulse`}
                />
              )}
              <span className="text-xs">
                {isRecording ? "Recording" : isStopped ? "Stopped" : "Idle"}
              </span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {/* Recording Name Input */}
          {!isRecording && !isStopped && (
            <div className="space-y-2">
              <Label htmlFor="recording-name" className="text-sm font-medium">
                Recording Name
              </Label>
              <Input
                id="recording-name"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                placeholder="Enter recording name..."
                className="bg-white"
                disabled={isRecording}
              />
            </div>
          )}

          {/* Current Recording Name */}
          {(isRecording || isStopped) && currentRecording && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Recording Name
              </p>
              <p className="text-sm font-mono text-gray-900">
                {currentRecording.name}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Duration</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatDuration(stats.duration)}
              </p>
            </div>

            {/* Topics */}
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <RadioIcon className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Topics</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {isRecording || isStopped
                  ? currentRecording?.topics.length || 0
                  : selectedTopics.length}
              </p>
            </div>

            {/* Messages */}
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Messages</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalMessages.toLocaleString()}
              </p>
            </div>

            {/* Size */}
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Size</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatBytes(stats.currentSize)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-gray-600">Storage Usage</p>
              <p className="text-xs text-gray-500">
                {formatBytes(stats.currentSize)} /{" "}
                {formatBytes(settings.sizeLimitBytes)}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isWarning ? "bg-amber-500" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {progressPercentage.toFixed(1)}% used
              {isWarning && " - Warning: approaching limit"}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isRecording && !isStopped && (
              <Button
                onClick={handleStart}
                disabled={!canStart || isStarting}
                className={`flex-1 ${theme.buttonBg} ${theme.buttonBorder} border-1 ${theme.buttonText} ${theme.buttonHoverBg} ${theme.buttonHoverText}`}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2 fill-current" />
                    Start Recording
                  </>
                )}
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={handleStop}
                disabled={isStopping}
                variant="outline"
                className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                {isStopping ? (
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

            {isStopping && (
              <Button disabled className="flex-1 bg-gray-200 text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Recording...
              </Button>
            )}

            {isStopped && !isStopping && (
              <>
                <Button
                  onClick={onExport}
                  className="flex-1 bg-green-200 border-green-500 border-1 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Recording
                </Button>
                <Button
                  onClick={() => {
                    // Reset to start a new recording
                    reset();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Start New Recording
                </Button>
              </>
            )}
          </div>

          {/* Warning Message */}
          {!canStart && !isRecording && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                {selectedTopics.length === 0
                  ? "Please select at least one topic to start recording"
                  : "Please enter a recording name to start"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
