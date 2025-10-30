"use client";

import React from "react";
import { MapViewer } from "@/components/dashboard/map-viewer";
import { MapDetailsPanel } from "@/components/dashboard/map-viewer";

export default function MapViewerPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Map Viewer</h1>
        <p className="text-muted-foreground mt-2">
          Visualize and interact with ROS occupancy grid maps in real-time
        </p>
      </div>

      {/* Map Viewer */}
      <div className="mb-6">
        <MapViewer width={1000} height={700} />
      </div>

      {/* Map Details Panel */}
      <div className="mb-6">
        <MapDetailsPanel />
      </div>
    </div>
  );
}
