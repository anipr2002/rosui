"use client";

import React from "react";
import Link from "next/link";
import { ReactFlowProvider } from "reactflow";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRosStore } from "@/store/ros-store";
import { Button } from "@/components/ui/button";
import { SpinnerCustom } from "@/components/ui/spinner";
import { PipelineBuilder } from "@/components/dashboard/workflows/pipeline-builder";

function DataProcessingPage() {
  const { status } = useRosStore();
  const isConnected = status === "connected";

  if (!isConnected) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">ROS Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Build visual processing pipelines once rosbridge is connected.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  ROS connection required
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Connect to your rosbridge server from Settings to use the
                  workflow builder.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <SpinnerCustom />
                  <Link href="/dashboard/settings/ros-connection">
                    <Button variant="outline" className="w-full">
                      Go to Settings
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
