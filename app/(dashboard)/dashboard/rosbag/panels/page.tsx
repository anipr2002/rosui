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
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Cloud,
  Database,
  Plus,
  Gauge,
  Lightbulb,
  FileText,
  Activity,
  FileArchive,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    loadFileFromUrl,
    isLoading: fileLoading,
  } = usePanelsStore();

  const recentFiles = useQuery(api.rosbagFiles.listRecent, { limit: 5 });

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
      <div className="w-full max-w-7xl mx-auto py-8">
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
          {/* S3 and Recent Files Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* S3 Card */}
            <Card className="shadow-none pt-0 rounded-xl border-indigo-200">
              <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
                  <Cloud className="h-5 w-5 mt-0.5 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base text-indigo-900">
                      Cloud Storage (S3)
                    </CardTitle>
                    <CardDescription className="text-xs text-indigo-700">
                      Connect your AWS S3 bucket to load rosbag files directly
                      from the cloud.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-4">
                <Button variant="outline" className="w-full mt-4" disabled>
                  Connect S3 Bucket (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            {/* Recent Files Card */}
            <Card className="shadow-none pt-0 rounded-xl border-blue-200">
              <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
                  <Database className="h-5 w-5 mt-0.5 text-blue-600" />
                  <div>
                    <CardTitle className="text-base text-blue-900">
                      Recent Files
                    </CardTitle>
                    <CardDescription className="text-xs text-blue-700">
                      Quickly access your recently uploaded or analyzed rosbag
                      files.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-4">
                {recentFiles === undefined ? (
                  <div className="space-y-2 mt-4">
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : recentFiles.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-4">No files uploaded yet</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {recentFiles.map((file) => {
                      const handleLoadFile = async () => {
                        try {
                          await loadFileFromUrl(file.s3Url, file.fileName, file.s3Key);
                        } catch (error) {
                          console.error("Failed to load file:", error);
                        }
                      };

                      return (
                        <button
                          key={file._id}
                          onClick={handleLoadFile}
                          disabled={fileLoading}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {fileLoading ? (
                            <Loader2 className="h-4 w-4 text-blue-600 flex-shrink-0 animate-spin" />
                          ) : (
                            <FileArchive className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <div className="max-w-2xl mx-auto w-full">
            <FileUpload />
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
