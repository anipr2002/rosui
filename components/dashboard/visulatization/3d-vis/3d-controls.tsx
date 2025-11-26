"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  RefreshCw,
  Loader2,
  Grid3x3,
  Lightbulb,
  Box,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useRosStore } from "@/store/ros-store";
import { use3DVisStore } from "@/store/3d-vis-store";

export function Controls3D() {
  const [isOpen, setIsOpen] = useState(true);
  const { status } = useRosStore();
  const {
    urdfSourceMode,
    urdfParameterName,
    urdfTopicName,
    urdfFileUrl,
    urdfInfo,
    isLoadingURDF,
    tfEnabled,
    jointStatesEnabled,
    jointStateTopic,
    currentJointStates,
    lastJointStateUpdate,
    sceneSettings,
    setURDFSourceMode,
    setURDFParameterName,
    setURDFTopicName,
    setURDFFileUrl,
    loadURDFFromParameter,
    loadURDFFromTopic,
    loadURDFFromFile,
    clearURDF,
    toggleTF,
    toggleJointStates,
    setJointStateTopic,
    updateSceneSettings,
  } = use3DVisStore();

  const handleLoadURDF = () => {
    if (urdfSourceMode === "ros-parameter") {
      loadURDFFromParameter();
    } else if (urdfSourceMode === "ros-topic") {
      loadURDFFromTopic();
    } else {
      loadURDFFromFile();
    }
  };

  const getStatusBadge = () => {
    if (status === "connected") {
      if (isLoadingURDF) {
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-2 w-2 animate-spin" />
              Loading URDF
            </div>
          </Badge>
        );
      }
      if (urdfInfo) {
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              URDF Loaded
            </div>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            Ready
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

  const getTFBadge = () => {
    if (tfEnabled) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            TF Active
          </div>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-sm">
        TF Disabled
      </Badge>
    );
  };

  const getJointStatesBadge = () => {
    if (jointStatesEnabled) {
      const timeSinceUpdate = Date.now() - lastJointStateUpdate;
      const isRecent = timeSinceUpdate < 1000; // Consider recent if < 1 second
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full bg-green-500 ${
                isRecent ? "animate-pulse" : ""
              }`}
            />
            Joint States ({currentJointStates.size})
          </div>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-sm">
        Joint States Disabled
      </Badge>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-none pt-0 rounded-xl border-teal-200">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6 cursor-pointer hover:bg-teal-100 transition-colors">
            <div className="flex items-start gap-3">
              <Box className="h-5 w-5 mt-0.5 text-teal-600" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base text-teal-900 font-semibold">
                  3D Visualization Controls
                </h2>
                <p className="mt-1 text-xs text-teal-800">
                  Configure URDF model, TF transforms, and scene settings
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 mt-0.5 text-teal-600 transition-transform ${
                  isOpen ? "" : "-rotate-90"
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-6 py-4 space-y-6">
            {/* Status Row */}
            <div className="flex flex-wrap items-center gap-3">
              {getStatusBadge()}
              {getTFBadge()}
              {getJointStatesBadge()}
              {urdfInfo && (
                <Badge variant="outline" className="text-sm">
                  {urdfInfo.linkCount} links, {urdfInfo.jointCount} joints
                </Badge>
              )}
            </div>

            <Separator />

            {/* URDF Source Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">URDF Source</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={
                    urdfSourceMode === "ros-topic" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setURDFSourceMode("ros-topic")}
                  className={
                    urdfSourceMode === "ros-topic"
                      ? "bg-teal-200 border-teal-500 text-teal-700 hover:bg-teal-300"
                      : ""
                  }
                >
                  <Box className="h-3 w-3 mr-1" />
                  ROS Topic
                </Button>
                <Button
                  variant={
                    urdfSourceMode === "static-file" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setURDFSourceMode("static-file")}
                  className={
                    urdfSourceMode === "static-file"
                      ? "bg-teal-200 border-teal-500 text-teal-700 hover:bg-teal-300"
                      : ""
                  }
                >
                  <Box className="h-3 w-3 mr-1" />
                  Static File
                </Button>
                <Button
                  variant={
                    urdfSourceMode === "ros-parameter" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setURDFSourceMode("ros-parameter")}
                  className={
                    urdfSourceMode === "ros-parameter"
                      ? "bg-teal-200 border-teal-500 text-teal-700 hover:bg-teal-300"
                      : ""
                  }
                >
                  <Box className="h-3 w-3 mr-1" />
                  ROS Parameter
                </Button>
              </div>
            </div>

            {/* URDF Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urdfSourceMode === "ros-parameter" ? (
                <div className="space-y-2">
                  <Label htmlFor="urdf-param" className="text-sm font-medium">
                    Parameter Name
                  </Label>
                  <Input
                    id="urdf-param"
                    type="text"
                    placeholder="/robot_description"
                    value={urdfParameterName}
                    onChange={(e) => setURDFParameterName(e.target.value)}
                    className="h-9 bg-white"
                    disabled={status !== "connected" || isLoadingURDF}
                  />
                </div>
              ) : urdfSourceMode === "ros-topic" ? (
                <div className="space-y-2">
                  <Label htmlFor="urdf-topic" className="text-sm font-medium">
                    Topic Name
                  </Label>
                  <Input
                    id="urdf-topic"
                    type="text"
                    placeholder="/robot_description"
                    value={urdfTopicName}
                    onChange={(e) => setURDFTopicName(e.target.value)}
                    className="h-9 bg-white"
                    disabled={status !== "connected" || isLoadingURDF}
                  />
                </div>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="urdf-file" className="text-sm font-medium">
                    File URL
                  </Label>
                  <Input
                    id="urdf-file"
                    type="text"
                    placeholder="https://example.com/robot.urdf"
                    value={urdfFileUrl}
                    onChange={(e) => setURDFFileUrl(e.target.value)}
                    className="h-9 bg-white"
                    disabled={status !== "connected" || isLoadingURDF}
                  />
                </div>
              )}

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleLoadURDF}
                  disabled={
                    isLoadingURDF ||
                    status !== "connected" ||
                    (urdfSourceMode === "ros-parameter" &&
                      !urdfParameterName) ||
                    (urdfSourceMode === "ros-topic" && !urdfTopicName) ||
                    (urdfSourceMode === "static-file" && !urdfFileUrl)
                  }
                  className="bg-teal-200 border-teal-500 text-teal-700 hover:bg-teal-500 hover:text-white"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoadingURDF ? "animate-spin" : ""
                    }`}
                  />
                  {isLoadingURDF ? "Loading..." : "Load URDF"}
                </Button>
                {urdfInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearURDF}
                    disabled={isLoadingURDF}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* TF Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Transform (TF) Settings
              </Label>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                <div className="flex-1">
                  <p className="text-sm font-medium">Enable Live TF Updates</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Subscribe to TF transforms for real-time robot state
                  </p>
                </div>
                <Switch
                  checked={tfEnabled}
                  onCheckedChange={toggleTF}
                  disabled={status !== "connected"}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
            </div>

            <Separator />

            {/* Joint States Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Joint States Settings
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium">Enable Joint States</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Subscribe to joint positions for robot animation
                    </p>
                  </div>
                  <Switch
                    checked={jointStatesEnabled}
                    onCheckedChange={toggleJointStates}
                    disabled={status !== "connected"}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="joint-topic"
                    className="text-xs text-gray-600"
                  >
                    Joint States Topic
                  </Label>
                  <Input
                    id="joint-topic"
                    type="text"
                    placeholder="/joint_states"
                    value={jointStateTopic}
                    onChange={(e) => setJointStateTopic(e.target.value)}
                    className="h-9 bg-white text-sm"
                    disabled={jointStatesEnabled}
                  />
                  <p className="text-xs text-gray-500">
                    {jointStatesEnabled
                      ? "Disable to change topic name"
                      : "Topic for sensor_msgs/JointState messages"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Scene Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Scene Options</Label>

              {/* Mesh Server URL */}
              <div className="space-y-2">
                <Label htmlFor="mesh-server" className="text-xs text-gray-600">
                  Mesh Server URL (for loading 3D models from Docker)
                </Label>
                <Input
                  id="mesh-server"
                  type="text"
                  placeholder="http://localhost:8080"
                  value={sceneSettings.meshServerUrl}
                  onChange={(e) =>
                    updateSceneSettings({ meshServerUrl: e.target.value })
                  }
                  className="h-9 bg-white text-sm"
                />
                <p className="text-xs text-gray-500">
                  Set up an HTTP server in your Docker container to serve mesh
                  files
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Show Grid</span>
                  </div>
                  <Switch
                    checked={sceneSettings.showGrid}
                    onCheckedChange={(checked) =>
                      updateSceneSettings({ showGrid: checked })
                    }
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Show Axes</span>
                  </div>
                  <Switch
                    checked={sceneSettings.showAxes}
                    onCheckedChange={(checked) =>
                      updateSceneSettings({ showAxes: checked })
                    }
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
