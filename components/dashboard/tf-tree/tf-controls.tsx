"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  RefreshCw,
  Maximize2,
  Search,
  Settings,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { useTFStore } from "@/store/tf-store";
import { useRosStore } from "@/store/ros-store";

interface TFControlsProps {
  frameCount: number;
  onRefresh: () => void;
  onFitView: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TFControls({
  frameCount,
  onRefresh,
  onFitView,
  searchQuery,
  onSearchChange,
}: TFControlsProps) {
  const { status } = useRosStore();
  const { isSubscribed, staleTimeout, setStaleTimeout } = useTFStore();
  const [showSettings, setShowSettings] = React.useState(false);
  const [timeoutInput, setTimeoutInput] = React.useState(
    String(staleTimeout / 1000)
  );

  const getStatusBadge = () => {
    if (status === "connected" && isSubscribed) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <Activity className="h-3 w-3" />
            Active
          </div>
        </Badge>
      );
    }
    if (status === "connected") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Ready
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
        Disconnected
      </Badge>
    );
  };

  const handleTimeoutSubmit = () => {
    const timeout = Number.parseFloat(timeoutInput);
    if (!Number.isNaN(timeout) && timeout > 0) {
      setStaleTimeout(timeout * 1000);
      setShowSettings(false);
    }
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-indigo-200 mb-4">
      <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
        <div className="flex items-start gap-3">
          <SlidersHorizontal className="h-5 w-5 mt-0.5 text-indigo-600" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base text-indigo-900 font-semibold">
              Transform Tree Controls
            </h2>
            <p className="mt-1 text-xs text-indigo-800">
              Manage visualization settings and search for frames
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Frame Count */}
          <Badge variant="outline" className="text-sm">
            {frameCount} {frameCount === 1 ? "frame" : "frames"}
          </Badge>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search frames..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              title="Refresh Layout"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onFitView}
              title="Fit View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <label
                  htmlFor="stale-timeout"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Stale Timeout (seconds)
                </label>
                <Input
                  id="stale-timeout"
                  type="number"
                  min="1"
                  step="1"
                  value={timeoutInput}
                  onChange={(e) => setTimeoutInput(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button size="sm" onClick={handleTimeoutSubmit}>
                Apply
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Frames that haven't been updated in this time will be removed
              (static frames are never removed)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
