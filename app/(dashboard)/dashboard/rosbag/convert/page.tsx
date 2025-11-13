"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  FileUploader,
  ConversionControls,
  // ConversionResults,
} from "@/components/dashboard/rosbag/convert";

const ConversionResults = dynamic(
  () =>
    import("@/components/dashboard/rosbag/convert").then(
      (mod) => mod.ConversionResults
    ),
  { ssr: false }
);

export default function ConvertPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Convert Rosbag to MCAP
        </h1>
        <p className="text-muted-foreground mt-2">
          Convert ROS2 bag files (.bag, .db3) to MCAP format for modern robotics
          data analysis
        </p>
      </div>

      {/* Conversion Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - File Upload */}
        <FileUploader />

        {/* Right Column - Controls and Results */}
        <div className="space-y-6">
          <ConversionControls />
          <ConversionResults />
        </div>
      </div>
    </div>
  );
}
