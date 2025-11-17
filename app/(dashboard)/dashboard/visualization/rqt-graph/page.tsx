"use client";

import React from "react";
import { useRosStore } from "@/store/ros-store";
import { useRQTGraphStore } from "@/store/rqt-graph-store";
import {
  RQTGraph,
  RQTGraphLoading,
} from "@/components/dashboard/visulatization/rqt-graph";
import { ReactFlowProvider } from "reactflow";
import { AlertCircle, ArrowRight } from "lucide-react";
import { SpinnerCustom } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function RQTGraphPage() {
  const { status } = useRosStore();
  const { isLoading } = useRQTGraphStore();

  // Not connected state
  if (status !== "connected") {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">RQT Graph</h1>
          <p className="text-muted-foreground mt-2">
            Visualize your ROS computation graph
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
                  Please connect to ROS bridge from the Settings page to view
                  the computation graph.
                </p>
                <SpinnerCustom />
                <Link href="/dashboard/settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4 ml-2" />
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
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <RQTGraphLoading />
      </div>
    );
  }

  // RQT Graph visualization
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
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
