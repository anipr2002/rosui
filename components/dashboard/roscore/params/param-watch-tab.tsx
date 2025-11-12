"use client";

import React, { useState } from "react";
import { useParamsStore } from "@/store/param-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Play, Square, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ParamWatchTabProps {
  paramName: string;
}

export function ParamWatchTab({ paramName }: ParamWatchTabProps) {
  const { watchedParams, startWatching, stopWatching, clearWatchHistory } =
    useParamsStore();
  const [pollRate, setPollRate] = useState(1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const watched = watchedParams.get(paramName);
  const isWatching = watched?.isWatching || false;

  const handleStartWatching = () => {
    if (pollRate <= 0 || pollRate > 10) {
      toast.error("Poll rate must be between 0.1 and 10 Hz");
      return;
    }

    try {
      startWatching(paramName, pollRate);
      toast.success(`Started watching ${paramName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start watching";
      toast.error(errorMessage);
      console.error("Watch error:", error);
    }
  };

  const handleStopWatching = () => {
    try {
      stopWatching(paramName);
      toast.info("Stopped watching parameter");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop watching";
      toast.error(errorMessage);
      console.error("Stop watch error:", error);
    }
  };

  const handleClearHistory = () => {
    try {
      clearWatchHistory(paramName);
      toast.info("Watch history cleared");
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

  const formatValue = (value: any): string => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  };

  if (!isWatching) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poll-rate" className="text-sm font-medium">
            Poll Rate (Hz)
          </Label>
          <Input
            id="poll-rate"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={pollRate}
            onChange={(e) => setPollRate(parseFloat(e.target.value))}
            className="bg-white"
          />
          <p className="text-xs text-gray-500">
            Poll rate between 0.1 and 10 Hz
          </p>
        </div>

        <Button
          onClick={handleStartWatching}
          className="w-full bg-blue-200 border-1 border-blue-500 hover:bg-blue-500 hover:text-white text-blue-500"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Watching
        </Button>

        <div className="p-8 text-center border-2 border-dashed rounded-lg">
          <p className="text-sm text-gray-500">
            Click Start Watching to monitor parameter changes over time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleStopWatching}
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Square className="mr-2 h-4 w-4" />
          Stop Watching
        </Button>

        {watched && watched.history.length > 1 && (
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

      {/* Poll Rate Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 font-medium">
          Watching at {watched?.pollRate} Hz
        </p>
      </div>

      {watched && watched.history.length > 0 ? (
        <div className="space-y-4">
          {/* Latest Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Latest Value
              </h4>
              <span className="text-xs text-gray-500">
                {formatTimestamp(watched.history[0]?.timestamp || Date.now())}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                {formatValue(watched.value)}
              </pre>
            </div>
          </div>

          {/* Value History */}
          {watched.history.length > 1 && (
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="text-sm font-medium">
                    Value History ({watched.history.length - 1} older)
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
                  {watched.history.slice(1, 21).map((record, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Value #{index + 2}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(record.timestamp)}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {formatValue(record.value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
          <p className="text-sm text-blue-700">
            Watching parameter - waiting for data...
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          The parameter is being polled at {watched?.pollRate} Hz. Only changed
          values are recorded in history.
        </p>
      </div>
    </div>
  );
}
