"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useLifecycleNodesStore } from "@/store/lifecycle-nodes-store";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";
import {
  NodesHeader,
  NodesTabs,
} from "@/components/dashboard/monitoring/nodes";

function NodesPage() {
  const { status } = useRosStore();
  const { startPolling, stopPolling, cleanup } = useLifecycleNodesStore();

  // Start polling when connected, cleanup on unmount
  useEffect(() => {
    if (status === "connected") {
      startPolling(5000);
    }

    return () => {
      stopPolling();
    };
  }, [status, startPolling, stopPolling]);

  // Cleanup on page unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Not connected state
  if (status !== "connected") {
    return (
      <RosConnectionRequired
        title="Lifecycle Nodes"
        description="Connect to ROS to monitor and control lifecycle node states."
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header with stats */}
      <NodesHeader />

      {/* Tabs: Lifecycle Nodes | Graph View */}
      <NodesTabs defaultTab="lifecycle" />
    </div>
  );
}

export default NodesPage;
