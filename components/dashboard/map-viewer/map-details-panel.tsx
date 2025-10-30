"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  Map as MapIcon,
} from "lucide-react";
import { useMapStore } from "@/store/map-store";
import { toast } from "sonner";

export function MapDetailsPanel() {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { mapMetadata, mapTopic } = useMapStore();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (!mapMetadata) {
    return (
      <Card className="shadow-none rounded-xl border-gray-200">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No map metadata available. Connect to ROS and subscribe to a map
            topic.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number, decimals: number = 3) => {
    return num.toFixed(decimals);
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const mapWidthMeters = mapMetadata.width * mapMetadata.resolution;
  const mapHeightMeters = mapMetadata.height * mapMetadata.resolution;

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200">
      <CardHeader
        className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <MapIcon className="h-5 w-5 mt-0.5 text-teal-600" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-teal-900 font-semibold">
                Map Details
              </h3>
              <p className="mt-1 text-xs text-teal-800 font-mono">
                Topic: {mapTopic}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-teal-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 py-4 space-y-4">
          {/* Basic Map Info */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">
              Resolution
            </div>
            <div className="flex justify-between items-start gap-3 py-2 border-b">
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                Resolution
              </span>
              <span className="text-sm font-mono text-gray-900 text-right break-all">
                {formatNumber(mapMetadata.resolution)} m/pixel
              </span>
            </div>
            <div className="flex justify-between items-start gap-3 py-2 border-b">
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                Pixel Dimensions
              </span>
              <span className="text-sm font-mono text-gray-900 text-right break-all">
                {mapMetadata.width} × {mapMetadata.height} pixels
              </span>
            </div>
            <div className="flex justify-between items-start gap-3 py-2 border-b">
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                Physical Dimensions
              </span>
              <span className="text-sm font-mono text-gray-900 text-right break-all">
                {formatNumber(mapWidthMeters, 2)} ×{" "}
                {formatNumber(mapHeightMeters, 2)} m
              </span>
            </div>
          </div>

          {/* Origin */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Origin</div>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                  X
                </span>
                <span className="text-sm font-mono text-gray-900 text-right">
                  {formatNumber(mapMetadata.origin.x)} m
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                  Y
                </span>
                <span className="text-sm font-mono text-gray-900 text-right">
                  {formatNumber(mapMetadata.origin.y)} m
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                  Z
                </span>
                <span className="text-sm font-mono text-gray-900 text-right">
                  {formatNumber(mapMetadata.origin.z)} m
                </span>
              </div>
            </div>
          </div>

          {/* Frame and Timestamp */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">
              Metadata
            </div>
            <div className="flex justify-between items-start gap-3 py-2 border-b">
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                Frame ID
              </span>
              <span className="text-sm font-mono text-gray-900 text-right break-all">
                {mapMetadata.frameId}
              </span>
            </div>
            <div className="flex justify-between items-start gap-3 py-2">
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                Last Update
              </span>
              <span className="text-sm font-mono text-gray-900 text-right break-all">
                {formatTimestamp(mapMetadata.lastUpdate)}
              </span>
            </div>
          </div>

          {/* Copy Actions */}
          <div className="pt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = JSON.stringify(mapMetadata, null, 2);
                copyToClipboard(data, "Map metadata");
              }}
              className="w-full"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy All Metadata
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(mapTopic, "Map topic")}
              className="w-full"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy Topic Name
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
