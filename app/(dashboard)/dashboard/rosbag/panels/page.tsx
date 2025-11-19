"use client";

import React, { useEffect } from "react";
import { usePanelsStore } from "@/store/panels-store";
import {
  FileUpload,
  PlaybackControls,
  PlotPanel,
  GaugePanel,
  IndicatorPanel,
  RawTopicViewerPanel,
  DiagnosticsPanel,
} from "@/components/dashboard/rosbag/panels";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileBox,
  BarChart3,
  Play,
  Settings2,
  Zap,
  ChevronDown,
  Gauge,
  Lightbulb,
  FileText,
  Activity,
} from "lucide-react";

export default function PanelsPage() {
  const {
    file,
    metadata,
    panels,
    addPlotPanel,
    addGaugePanel,
    addIndicatorPanel,
    addRawTopicViewerPanel,
    addDiagnosticsPanel,
  } = usePanelsStore();

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
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Rosbag File Loaded
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload an MCAP file to start creating interactive panels and
              visualizing your ROS data
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <FileUpload />
        </div>
      </div>
    );
  }

  // File loaded - show panels interface
  return (
    <div className="w-full px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rosbag Panels</h1>
        <p className="text-muted-foreground mt-2">
          Visualize rosbag data with interactive plots and panels
        </p>
      </div>

      {/* Panels Section */}
      <div className="space-y-6">
        {panels.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No Panels Added
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Add a panel to start visualizing your rosbag data
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Panel
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={addPlotPanel}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Plot Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addGaugePanel}>
                  <Gauge className="h-4 w-4 mr-2" />
                  Gauge Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addIndicatorPanel}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Indicator Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addRawTopicViewerPanel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Raw Topic Viewer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addDiagnosticsPanel}>
                  <Activity className="h-4 w-4 mr-2" />
                  Diagnostics Panel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          panels.map((panel) => {
            // Render different panel types based on panel.type
            if (panel.type === "plot") {
              return <PlotPanel key={panel.id} panelConfig={panel} />;
            }
            if (panel.type === "gauge") {
              return <GaugePanel key={panel.id} panelConfig={panel} />;
            }
            if (panel.type === "indicator") {
              return <IndicatorPanel key={panel.id} panelConfig={panel} />;
            }
            if (panel.type === "raw-topic-viewer") {
              return <RawTopicViewerPanel key={panel.id} panelConfig={panel} />;
            }
            if (panel.type === "diagnostics") {
              return <DiagnosticsPanel key={panel.id} panelConfig={panel} />;
            }
            return null;
          })
        )}
      </div>

      {/* Add Panel Button */}
      {panels.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Panel
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={addPlotPanel}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Plot Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addGaugePanel}>
              <Gauge className="h-4 w-4 mr-2" />
              Gauge Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addIndicatorPanel}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Indicator Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addRawTopicViewerPanel}>
              <FileText className="h-4 w-4 mr-2" />
              Raw Topic Viewer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addDiagnosticsPanel}>
              <Activity className="h-4 w-4 mr-2" />
              Diagnostics Panel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Playback Controls */}
      <PlaybackControls />

      {/* File Upload - at the bottom */}
      <FileUpload />
    </div>
  );
}
