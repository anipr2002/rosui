"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useDiagnosticsStore } from "@/store/diagnostics-store";
import {
  DiagnosticsOverview,
  TopicManager,
  NodeStatusCard,
  DiagnosticsAggregatorView,
} from "@/components/dashboard/diagnostics";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DiagnosticsPage() {
  const { status: connectionStatus, ros } = useRosStore();
  const {
    subscribeAllDiagnostics,
    unsubscribeAllDiagnostics,
    nodes,
    isLoading,
    getAllNodeNames,
  } = useDiagnosticsStore();

  const nodeNames = getAllNodeNames();

  // Subscribe to diagnostics when ROS is connected
  useEffect(() => {
    if (connectionStatus === "connected" && ros) {
      subscribeAllDiagnostics().catch((error) => {
        console.error("Failed to subscribe to diagnostics:", error);
      });
    }

    return () => {
      // Cleanup on unmount
      unsubscribeAllDiagnostics();
    };
  }, [
    connectionStatus,
    ros,
    subscribeAllDiagnostics,
    unsubscribeAllDiagnostics,
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Diagnostics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health, node status, and diagnostics from ROS
          diagnostic topics
        </p>
      </div>

      {/* Overview Card */}
      <div className="mb-6">
        <DiagnosticsOverview />
      </div>

      {/* Topic Manager Card */}
      <div className="mb-6">
        <TopicManager />
      </div>

      {/* Aggregator View */}
      <div className="mb-6">
        <DiagnosticsAggregatorView />
      </div>

      {/* Node Status Cards */}
      {isLoading && nodeNames.length === 0 ? (
        <Card className="shadow-none pt-0 rounded-xl border-gray-200">
          <CardContent className="px-6 py-8">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading diagnostics...</span>
            </div>
          </CardContent>
        </Card>
      ) : nodeNames.length === 0 ? (
        <Card className="shadow-none pt-0 rounded-xl border-gray-200">
          <CardContent className="px-6 py-8">
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md mx-auto text-center">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                No Diagnostics Available
              </div>
              <div className="text-sm text-gray-500">
                {connectionStatus === "connected"
                  ? "No diagnostic messages received yet. Make sure diagnostic topics are active."
                  : "Connect to ROS to start receiving diagnostics."}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodeNames.map((nodeName) => (
            <NodeStatusCard key={nodeName} nodeName={nodeName} />
          ))}
        </div>
      )}
    </div>
  );
}
