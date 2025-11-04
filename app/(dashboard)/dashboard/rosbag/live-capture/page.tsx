"use client";

import { useState, useEffect } from "react";
import { Database, WifiOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRosStore } from "@/store/ros-store";
import { useTopicsStore } from "@/store/topic-store";
import { useLiveCaptureStore } from "@/store/live-capture-store";
import {
  TopicSelector,
  RecordingControlCard,
  RecordingSettings,
  RecordingStats,
  ExportDialog,
} from "@/components/dashboard/live-capture";

export default function LiveCapturePage() {
  const { ros, status } = useRosStore();
  const { topics, getTopicsList, isLoadingTopics } = useTopicsStore();
  const { currentRecordingId, reset } = useLiveCaptureStore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const isConnected = status === "connected";

  // Load topics when connected
  useEffect(() => {
    if (isConnected && topics.length === 0 && !isLoadingTopics) {
      getTopicsList();
    }
  }, [isConnected, topics.length, isLoadingTopics, getTopicsList]);

  // Reset store on unmount
  useEffect(() => {
    return () => {
      // Clean up on unmount
      reset();
    };
  }, [reset]);

  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  // Loading state while connecting
  if (!ros) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Live Capture</h1>
          <p className="text-muted-foreground mt-2">
            Record ROS 2 topics to browser storage
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Initializing ROS Connection
              </p>
              <p className="text-sm text-amber-700">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Live Capture</h1>
          <p className="text-muted-foreground mt-2">
            Record ROS 2 topics to browser storage
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
          <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Not Connected to ROS
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Connect to a ROS 2 system to start recording topics
          </p>
          <Link href="/dashboard/settings/ros-connection">
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
              Go to Connection Settings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Connected - show main interface
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">Live Capture</h1>
        </div>
        <p className="text-muted-foreground">
          Record live ROS 2 topic data to browser storage and export in multiple
          formats
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Top Row: Control and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecordingControlCard onExport={handleExport} />
          <RecordingStats />
        </div>

        {/* Middle Row: Topic Selection */}
        <TopicSelector />

        {/* Bottom Row: Settings */}
        <RecordingSettings />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        recordingId={currentRecordingId}
      />
    </div>
  );
}
