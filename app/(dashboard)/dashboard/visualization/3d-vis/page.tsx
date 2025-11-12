"use client";

import React from "react";
import {
  Viewer3D,
  Controls3D,
  DetailsPanel3D,
} from "@/components/dashboard/visulatization/3d-vis";

export default function ThreeDVisPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">3D Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Visualize robot URDFs, TF transforms, point clouds, and markers in 3D
          space
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <Controls3D />
      </div>

      {/* 3D Viewer */}
      <div className="mb-6">
        <Viewer3D width={1000} height={700} />
      </div>

      {/* Details Panel */}
      <div className="mb-6">
        <DetailsPanel3D />
      </div>
    </div>
  );
}
