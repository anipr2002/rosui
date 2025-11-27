"use client";

import React from "react";
import { useRosStore } from "@/store/ros-store";
import {
  RQTGraph,
  RQTGraphLoading,
} from "@/components/dashboard/visulatization/rqt-graph";
import { ReactFlowProvider } from "reactflow";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

function RQTGraphPage() {
  const { status } = useRosStore();

  // Not connected state
  if (status !== "connected") {
    return (
      <RosConnectionRequired
        title="RQT Graph"
        description="Please connect to ROS bridge from the Settings page to view the computation graph."
      />
    );
  }



  // RQT Graph visualization
  return (
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">RQT Graph</h1>
        <p className="text-muted-foreground mt-2">
          Visualize your ROS computation graph in real-time
        </p>
      </div>

      <ReactFlowProvider>
        <RQTGraph />
      </ReactFlowProvider>
    </div>
  );
}

export default RQTGraphPage;
