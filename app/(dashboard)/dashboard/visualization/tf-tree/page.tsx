"use client";

import React from "react";
import { useRosStore } from "@/store/ros-store";
import { TFTree } from "@/components/dashboard/visulatization/tf-tree";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

function TFTreePage() {
  const { status } = useRosStore();

  // Not connected state
  if (status !== "connected") {
    return (
      <RosConnectionRequired
        title="TF Tree"
        description="Please connect to ROS bridge from the Settings page to view TF tree."
      />
    );
  }

  // TF Tree visualization
  // Note: TFTree component now includes its own ReactFlowProvider
  return (
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">TF Tree</h1>
        <p className="text-muted-foreground mt-2">
          Visualize your ROS TF transformations in real-time
        </p>
      </div>

      <TFTree />
    </div>
  );
}

export default TFTreePage;
