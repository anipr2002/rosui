"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  Maximize2,
  Search,
  Network,
  Filter,
  Maximize,
  Minimize,
} from "lucide-react";
import { useRosStore } from "@/store/ros-store";

interface RQTGraphControlsProps {
  nodeCount: number;
  topicCount: number;
  onRefresh: () => void;
  onFitView: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterSystemNodes: boolean;
  onFilterSystemNodesChange: (value: boolean) => void;
  showTopics: boolean;
  onShowTopicsChange: (value: boolean) => void;
  layoutDirection: "TB" | "LR";
  onLayoutDirectionChange: (direction: "TB" | "LR") => void;
  isLoading: boolean;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function RQTGraphControls({
  nodeCount,
  topicCount,
  onRefresh,
  onFitView,
  searchQuery,
  onSearchChange,
  filterSystemNodes,
  onFilterSystemNodesChange,
  showTopics,
  onShowTopicsChange,
  layoutDirection,
  onLayoutDirectionChange,
  isLoading,
  onFullscreen,
  isFullscreen = false,
}: RQTGraphControlsProps) {
  const { status } = useRosStore();
  const [showFilters, setShowFilters] = React.useState(false);

  const getStatusBadge = () => {
    if (status === "connected") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </div>
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200 mb-4">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <div className="flex items-start gap-3">
          <Network className="h-5 w-5 mt-0.5 text-teal-600" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base text-teal-900 font-semibold">
              RQT Graph Controls
            </h2>
            <p className="mt-1 text-xs text-teal-800">
              Manage visualization settings and search for nodes or topics
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Counts */}
          <Badge variant="outline" className="text-sm">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {topicCount} {topicCount === 1 ? "topic" : "topics"}
          </Badge>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search nodes or topics..."
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
              onClick={() => setShowFilters(!showFilters)}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Graph"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onFitView}
              title="Fit View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            {onFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="filter-system"
                    className="text-sm font-medium"
                  >
                    Hide System Nodes
                  </Label>
                  <p className="text-xs text-gray-500">
                    Filter out /rosout, /rosapi, and other system nodes
                  </p>
                </div>
                <Switch
                  id="filter-system"
                  checked={filterSystemNodes}
                  onCheckedChange={onFilterSystemNodesChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="show-topics" className="text-sm font-medium">
                    Show Topics
                  </Label>
                  <p className="text-xs text-gray-500">
                    Display topics between nodes or show only node connections
                  </p>
                </div>
                <Switch
                  id="show-topics"
                  checked={showTopics}
                  onCheckedChange={onShowTopicsChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">
                    Layout Direction
                  </Label>
                  <p className="text-xs text-gray-500">
                    Choose graph layout orientation
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={layoutDirection === "LR" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onLayoutDirectionChange("LR")}
                  >
                    Left-Right
                  </Button>
                  <Button
                    variant={layoutDirection === "TB" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onLayoutDirectionChange("TB")}
                  >
                    Top-Bottom
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
