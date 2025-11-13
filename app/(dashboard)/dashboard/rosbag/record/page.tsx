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
import { AlertCircle, ArrowRight, Radio } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpinnerCustom } from "@/components/ui/spinner";

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
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Record Rosbag</h1>
          <p className="text-muted-foreground mt-2">
            Record ROS2 topics to MCAP format for later playback and analysis
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-900">
                    ROS Connection Required
                  </h3>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Please connect to ROS bridge from the Settings page to record
                  rosbags.
                </p>
                <SpinnerCustom />
                <Link href="/dashboard/settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingTopics) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Record Rosbag</h1>
          <p className="text-muted-foreground mt-2">
            Record ROS2 topics to MCAP format for later playback and analysis
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-900">
                    Loading ROS Topics...
                  </h3>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Please wait while we load the ROS topics...
                </p>
                <SpinnerCustom />
                <Link href="/dashboard/settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
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
