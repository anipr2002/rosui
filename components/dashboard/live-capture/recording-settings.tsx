"use client";

import { useState } from "react";
import { Settings, Info, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLiveCaptureStore } from "@/store/live-capture-store";
import {
  SIZE_PRESETS,
  formatBytes,
  parseSizeToBytes,
} from "@/lib/db/live-capture-db";
import type { ExportFormat } from "@/lib/db/live-capture-db";
import { toast } from "sonner";

export function RecordingSettings() {
  const { settings, setSettings, status } = useLiveCaptureStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customSizeMB, setCustomSizeMB] = useState("");

  const isRecording = status === "recording";

  const handlePresetSelect = (preset: keyof typeof SIZE_PRESETS) => {
    if (isRecording) return;

    setSettings({
      sizeLimitBytes: SIZE_PRESETS[preset],
    });
    toast.success(`Size limit set to ${preset}`);
  };

  const handleCustomSize = () => {
    if (isRecording || !customSizeMB) return;

    const sizeNum = parseFloat(customSizeMB);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      toast.error("Please enter a valid number greater than 0");
      return;
    }

    const bytes = sizeNum * 1024 * 1024; // Convert MB to bytes
    setSettings({
      sizeLimitBytes: bytes,
    });
    toast.success(`Size limit set to ${sizeNum} MB`);
    setCustomSizeMB("");
  };

  const handleFormatToggle = (format: ExportFormat) => {
    if (isRecording) return;

    const currentFormats = settings.exportFormats;
    const hasFormat = currentFormats.includes(format);

    if (hasFormat) {
      // Don't allow removing all formats
      if (currentFormats.length === 1) {
        toast.error("At least one export format must be selected");
        return;
      }
      setSettings({
        exportFormats: currentFormats.filter((f) => f !== format),
      });
    } else {
      setSettings({
        exportFormats: [...currentFormats, format],
      });
    }
  };

  const formatLabels: Record<
    ExportFormat,
    { label: string; description: string }
  > = {
    "simple-json": {
      label: "Simple JSON",
      description: "Lightweight JSON array with messages",
    },
    "ros2-json": {
      label: "ROS 2 JSON",
      description: "Full metadata with type definitions",
    },
    mcap: {
      label: "MCAP",
      description: "Modern ROS 2 bag format (experimental)",
    },
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Settings className="h-5 w-5 mt-0.5 text-gray-900" />
          <div>
            <CardTitle className="text-base text-gray-900">
              Recording Settings
            </CardTitle>
            <CardDescription className="text-xs text-gray-700">
              Configure size limits and export formats
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
            >
              <span className="text-sm font-medium text-gray-900">
                {isOpen ? "Hide Settings" : "Show Settings"}
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-6">
            {/* Size Limit Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  Storage Size Limit
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Recording will stop automatically when this limit is
                        reached
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">Current Limit</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatBytes(settings.sizeLimitBytes)}
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SIZE_PRESETS).map(([label, bytes]) => (
                  <Button
                    key={label}
                    variant={
                      settings.sizeLimitBytes === bytes ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handlePresetSelect(label as keyof typeof SIZE_PRESETS)
                    }
                    disabled={isRecording}
                    className={
                      settings.sizeLimitBytes === bytes
                        ? "bg-indigo-500 text-white hover:bg-indigo-600"
                        : ""
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Custom Size Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Size (MB)</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="e.g., 1, 2, 750"
                      value={customSizeMB}
                      onChange={(e) => setCustomSizeMB(e.target.value)}
                      disabled={isRecording}
                      className="bg-white"
                      min="0.1"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      MB
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCustomSize}
                    disabled={isRecording || !customSizeMB}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter any size in megabytes (e.g., 1, 2, 50, 750)
                </p>
              </div>
            </div>

            {/* Export Formats Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Export Formats</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Select which formats to use when exporting recordings
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2">
                {(Object.keys(formatLabels) as ExportFormat[]).map((format) => {
                  const { label, description } = formatLabels[format];
                  const isSelected = settings.exportFormats.includes(format);

                  return (
                    <button
                      key={format}
                      onClick={() => handleFormatToggle(format)}
                      disabled={isRecording}
                      className={`w-full border rounded-lg p-3 text-left transition-colors ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-200"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      } ${
                        isRecording
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-indigo-500 border-indigo-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Throttle Section (Optional for future) */}
            <div className="p-4 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">Note</p>
              </div>
              <p className="text-xs text-gray-600">
                Settings can only be changed when recording is not active. Stop
                the current recording to modify these settings.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Always show current settings summary */}
        {!isOpen && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="text-xs bg-gray-100 rounded px-2 py-1">
              Limit: {formatBytes(settings.sizeLimitBytes)}
            </div>
            <div className="text-xs bg-gray-100 rounded px-2 py-1">
              Formats: {settings.exportFormats.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
