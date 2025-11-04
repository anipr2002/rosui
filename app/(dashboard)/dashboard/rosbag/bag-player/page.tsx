"use client";

import { useState } from "react";
import { PlayCircle, Database } from "lucide-react";
import {
  RecordingSelector,
  UploadDialog,
  PlaybackControlCard,
  TopicListPanel,
  MessageVisualizer,
} from "@/components/dashboard/bag-player";

export default function BagPlayerPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Trigger a refresh of the recording selector
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">Bag Player</h1>
        </div>
        <p className="text-muted-foreground">
          Play back and visualize recorded ROS 2 bag files and live capture
          recordings
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recording Selection & Topics */}
        <div className="lg:col-span-1 space-y-6">
          <RecordingSelector
            key={refreshKey}
            onUploadClick={() => setIsUploadDialogOpen(true)}
          />
          <TopicListPanel />
        </div>

        {/* Right Column - Playback Control & Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <PlaybackControlCard />
          <MessageVisualizer />
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
