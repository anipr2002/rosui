"use client";

import React from "react";
import { LogViewer } from "@/components/dashboard/logs";

function LogsPage() {
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
