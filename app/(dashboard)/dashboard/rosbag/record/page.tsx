"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useTopicsStore } from "@/store/topic-store";
import {
  RecordControls,
  TopicSelector,
  RecordingStatus,
  TopicStructureViewer,
} from "@/components/dashboard/rosbag/record";
import { Radio } from "lucide-react";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

export default function RecordPage() {
  const rosStatus = useRosStore((state) => state.status);
  const { topics, isLoadingTopics, getTopicsList } = useTopicsStore();

  // Load topics when component mounts and ROS is connected
  useEffect(() => {
    if (rosStatus === "connected" && topics.length === 0) {
      getTopicsList();
    }
  }, [rosStatus, topics.length, getTopicsList]);

  // Not connected state
  if (rosStatus !== "connected") {
    return (
      <RosConnectionRequired
        title="Record Rosbag"
        description="Please connect to ROS bridge from the Settings page to record rosbags."
      />
    );
  }

  // Loading state
  if (isLoadingTopics) {
    return (
      <RosConnectionRequired
        title="Record Rosbag"
        description="Please wait while we load the ROS topics..."
      />
    );
  }


  // Empty state
  if (topics.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Record Rosbag</h1>
          <p className="text-muted-foreground mt-2">
            Record ROS2 topics to MCAP format for later playback and analysis
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              No Topics Available
            </h3>
            <p className="text-sm text-gray-500">
              No ROS topics were found. Make sure your ROS system is running and
              publishing topics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main recording interface
  return (
    <div className="w-full max-w-7xl mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Record Rosbag</h1>
        <p className="text-muted-foreground mt-2">
          Record ROS2 topics to MCAP format for later playback and analysis
        </p>
      </div>

      {/* Recording Status - Shows during and after recording */}
      <RecordingStatus />

      {/* Main Recording Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Topic Selection */}
        <TopicSelector />

        {/* Right Column - Recording Controls & Topic Structure */}
        <div className="space-y-6">
          <RecordControls />
          <TopicStructureViewer />
        </div>
      </div>
    </div>
  );
}
