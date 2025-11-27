"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePanelsStore } from "@/store/panels-store";
import {
  FileUpload,
  PlaybackControls,
} from "@/components/dashboard/rosbag/panels";
import { S3FilesCard } from "@/components/dashboard/rosbag/panels/s3-files-card";
import { RecentFilesCard } from "@/components/dashboard/rosbag/panels/recent-files-card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Plus,
  Gauge,
  Lightbulb,
  FileText,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Layout Components
import { PanelGrid } from "@/components/dashboard/rosbag/layouts/panel-grid";
import { PageTabs } from "@/components/dashboard/rosbag/layouts/page-tabs";
import { LAYOUTS } from "@/components/dashboard/rosbag/layouts/constants";

export default function PanelsPage() {
  const router = useRouter();
  const {
    file,
    metadata,
    panels,
    activePageId,
    pages,
    addPlotPanel,
    addGaugePanel,
    addIndicatorPanel,
    addRawTopicViewerPanel,
    addDiagnosticsPanel,
    removePanel,
    resizePanel,
    movePanel,
  } = usePanelsStore();

  // Filter panels for current page
  const activePanels = useMemo(() => {
    if (!activePageId) return [];
    return panels.filter((p) => p.pageId === activePageId);
  }, [panels, activePageId]);

  // Get current page layout
  const activePage = pages.find((p) => p.id === activePageId);
  const currentLayoutKey = activePage?.layout || "threeColumn";
  const currentLayout = LAYOUTS[currentLayoutKey];

  const handleAddPanel = (type: string) => {
    switch (type) {
      case "plot":
        addPlotPanel();
        break;
      case "gauge":
        addGaugePanel();
        break;
      case "indicator":
        addIndicatorPanel();
        break;
      case "raw-topic-viewer":
        addRawTopicViewerPanel();
        break;
      case "diagnostics":
        addDiagnosticsPanel();
        break;
    }
  };

  // No file loaded - show upload interface
  if (!file || !metadata) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Rosbag Panels</h1>
          <p className="text-muted-foreground mt-2">
            Visualize and analyze your ROS bag files with interactive plots and
            real-time playback
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col justify-center py-12 px-4">
          {/* Upload Section - Top */}
          <div className="w-full mb-12">
            <FileUpload />
          </div>

          {/* S3 and Recent Files Cards - Below */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <S3FilesCard />
            <RecentFilesCard />
          </div>
        </div>
      </div>
    );
  }

  // File loaded - show panels interface
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
        {/* Page Tabs */}
        <PageTabs />

        {/* Panels Grid */}
        <PanelGrid
          panels={activePanels}
          maxCols={currentLayout.cols}
          onPanelsChange={movePanel}
          onDeletePanel={removePanel}
          onResizePanel={resizePanel}
        />
      </div>

      {/* Playback Controls - Floating at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50">
        <PlaybackControls />
      </div>

      {/* Floating Add Panel Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 z-50"
            title="Add Panel"
          >
            <Plus className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleAddPanel("plot")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Plot Panel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddPanel("gauge")}>
            <Gauge className="h-4 w-4 mr-2" />
            Gauge Panel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddPanel("indicator")}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Indicator Panel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddPanel("raw-topic-viewer")}>
            <FileText className="h-4 w-4 mr-2" />
            Raw Topic Viewer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddPanel("diagnostics")}>
            <Activity className="h-4 w-4 mr-2" />
            Diagnostics Panel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
