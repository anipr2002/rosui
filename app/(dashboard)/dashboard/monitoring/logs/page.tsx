"use client";

import React from "react";
import { useRosStore } from "@/store/ros-store";
import { LogViewer } from "@/components/dashboard/monitoring/logs";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

function LogsPage() {
  const { status } = useRosStore();

  // Not connected state
  if (status !== "connected") {
    return (
      <RosConnectionRequired
        title="System Logs"
        description="Connect to ROS to view live log messages from all nodes."
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground">
          Monitor real-time ROS log messages from all nodes
        </p>
      </div>

      {/* Log Viewer */}
      <LogViewer />
    </div>
  );
}

export default LogsPage;
