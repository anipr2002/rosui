"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { use3DVisStore } from "@/store/3d-vis-store";
import { useRosStore } from "@/store/ros-store";
import { toast } from "sonner";

export function DetailsPanel3D() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newPointCloudTopic, setNewPointCloudTopic] = useState("/points");
  const [newMarkerTopic, setNewMarkerTopic] = useState("/visualization_marker");

  const { status } = useRosStore();
  const {
    urdfInfo,
    tfFrames,
    tfEnabled,
    pointCloudSubscriptions,
    markerSubscriptions,
    fps,
    objectCount,
    polygonCount,
    addPointCloudSubscription,
    removePointCloudSubscription,
    togglePointCloudEnabled,
    addMarkerSubscription,
    removeMarkerSubscription,
    toggleMarkerEnabled,
  } = use3DVisStore();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleAddPointCloud = () => {
    if (newPointCloudTopic.trim()) {
      addPointCloudSubscription(
        newPointCloudTopic.trim(),
        "sensor_msgs/PointCloud2"
      );
      setNewPointCloudTopic("/points");
    }
  };

  const handleAddMarker = () => {
    if (newMarkerTopic.trim()) {
      addMarkerSubscription(
        newMarkerTopic.trim(),
        "visualization_msgs/MarkerArray"
      );
      setNewMarkerTopic("/visualization_marker");
    }
  };

  const tfFramesList = Array.from(tfFrames.values());

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-200">
      <CardHeader
        className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 mt-0.5 text-purple-600" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-purple-900 font-semibold">
                Visualization Details
              </h3>
              <p className="mt-1 text-xs text-purple-800">
                URDF info, TF frames, subscriptions, and scene statistics
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-purple-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 py-4 space-y-6">
          {/* URDF Info */}
          {urdfInfo && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-500">
                URDF Information
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Root Frame
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right">
                    {urdfInfo.rootFrame}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-3">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Links
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right">
                    {urdfInfo.linkCount}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-3">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Joints
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right">
                    {urdfInfo.jointCount}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = JSON.stringify(urdfInfo, null, 2);
                  copyToClipboard(data, "URDF info");
                }}
                className="w-full"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy URDF Info
              </Button>
            </div>
          )}

          {urdfInfo && <Separator />}

          {/* TF Frames */}
          {tfEnabled && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-500">
                TF Frames ({tfFramesList.length})
              </div>
              {tfFramesList.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {tfFramesList.map((frame) => (
                    <div
                      key={frame.name}
                      className="p-2 rounded border bg-white text-xs"
                    >
                      <div className="font-mono font-semibold text-gray-900">
                        {frame.name}
                      </div>
                      <div className="text-gray-500 mt-1">
                        Parent: {frame.parent || "root"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-gray-500">
                  No TF frames received yet
                </div>
              )}
            </div>
          )}

          {tfEnabled && <Separator />}

          {/* Point Cloud Subscriptions */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500">
              Point Cloud Topics
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="/points"
                value={newPointCloudTopic}
                onChange={(e) => setNewPointCloudTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddPointCloud();
                  }
                }}
                className="h-9 bg-white flex-1"
                disabled={status !== "connected"}
              />
              <Button
                size="sm"
                onClick={handleAddPointCloud}
                disabled={status !== "connected" || !newPointCloudTopic.trim()}
                className="bg-purple-200 border-purple-500 text-purple-700 hover:bg-purple-500 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {Array.from(pointCloudSubscriptions.values()).length > 0 ? (
              <div className="space-y-2">
                {Array.from(pointCloudSubscriptions.values()).map((sub) => (
                  <div
                    key={sub.topic}
                    className="flex items-center justify-between p-2 rounded border bg-white"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePointCloudEnabled(sub.topic)}
                        className="h-6 w-6 p-0"
                      >
                        {sub.enabled ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="text-xs font-mono truncate">
                        {sub.topic}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePointCloudSubscription(sub.topic)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border-2 border-dashed rounded-lg text-center text-xs text-gray-500">
                No point cloud subscriptions
              </div>
            )}
          </div>

          <Separator />

          {/* Marker Subscriptions */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500">
              Marker Topics
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="/visualization_marker"
                value={newMarkerTopic}
                onChange={(e) => setNewMarkerTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMarker();
                  }
                }}
                className="h-9 bg-white flex-1"
                disabled={status !== "connected"}
              />
              <Button
                size="sm"
                onClick={handleAddMarker}
                disabled={status !== "connected" || !newMarkerTopic.trim()}
                className="bg-purple-200 border-purple-500 text-purple-700 hover:bg-purple-500 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {Array.from(markerSubscriptions.values()).length > 0 ? (
              <div className="space-y-2">
                {Array.from(markerSubscriptions.values()).map((sub) => (
                  <div
                    key={sub.topic}
                    className="flex items-center justify-between p-2 rounded border bg-white"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMarkerEnabled(sub.topic)}
                        className="h-6 w-6 p-0"
                      >
                        {sub.enabled ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="text-xs font-mono truncate">
                        {sub.topic}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMarkerSubscription(sub.topic)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border-2 border-dashed rounded-lg text-center text-xs text-gray-500">
                No marker subscriptions
              </div>
            )}
          </div>

          <Separator />

          {/* Scene Stats */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500">
              Scene Statistics
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-white text-center">
                <div className="text-xs text-gray-500">FPS</div>
                <div className="text-lg font-semibold text-gray-900">{fps}</div>
              </div>
              <div className="p-3 rounded-lg border bg-white text-center">
                <div className="text-xs text-gray-500">Objects</div>
                <div className="text-lg font-semibold text-gray-900">
                  {objectCount}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-white text-center">
                <div className="text-xs text-gray-500">Polygons</div>
                <div className="text-lg font-semibold text-gray-900">
                  {polygonCount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
