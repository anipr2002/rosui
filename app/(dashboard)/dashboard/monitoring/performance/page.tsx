"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { usePerformanceStore } from "@/store/performance-store";
import {
  PerformanceOverview,
  CpuChart,
  MemoryChart,
  NetworkChart,
  TopicFrequencyChart,
  TopicConfigCard,
} from "@/components/dashboard/monitoring/performance";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

export default function PerformancePage() {
  const { status: connectionStatus, ros } = useRosStore();
  const { subscribe, unsubscribe, isSubscribed } = usePerformanceStore();

  // Auto-subscribe when connected
  useEffect(() => {
    if (connectionStatus === "connected" && ros && !isSubscribed) {
      subscribe().catch((error) => {
        console.error("Failed to subscribe to performance topic:", error);
      });
    }

    return () => {
      // Cleanup on unmount
      if (isSubscribed) {
        unsubscribe();
      }
    };
  }, [connectionStatus, ros, isSubscribed, subscribe, unsubscribe]);

  // Not connected state
  if (connectionStatus !== "connected") {
    return (
      <RosConnectionRequired
        title="Performance"
        description="Connect to ROS to monitor system performance metrics like CPU, memory, and network usage."
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance metrics and topic frequencies in real-time
        </p>
      </div>

      {/* Overview Card */}
      <div className="mb-6">
        <PerformanceOverview />
      </div>

      {/* Topic Configuration */}
      <div className="mb-6">
        <TopicConfigCard />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CpuChart />
        <MemoryChart />
      </div>

      {/* Network Chart - Full Width */}
      <div className="mb-6">
        <NetworkChart />
      </div>

      {/* Topic Frequency Chart */}
      <div className="mb-6">
        <TopicFrequencyChart />
      </div>
    </div>
  );
}
