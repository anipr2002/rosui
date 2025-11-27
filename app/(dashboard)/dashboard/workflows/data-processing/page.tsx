"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import { useRosStore } from "@/store/ros-store";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";
import { PipelineBuilder } from "@/components/dashboard/workflows/pipeline-builder";

function DataProcessingPage() {
  const { status } = useRosStore();
  const isConnected = status === "connected";

  if (!isConnected) {
    return (
      <RosConnectionRequired
        title="ROS Workflows"
        description="Connect to your rosbridge server from Settings to use the workflow builder."
      />
    );
  }

  return (
    <div className="w-full px-4 mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ROS Workflows</h1>
        <p className="text-muted-foreground mt-2">
          Compose data-processing graphs with live ROS topics, processors, and
          outputs backed by React Flow.
        </p>
      </div>

      <ReactFlowProvider>
        <PipelineBuilder />
      </ReactFlowProvider>
    </div>
  );
}

export default DataProcessingPage;
