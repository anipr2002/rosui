"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTopicsStore } from "@/store/topic-store";
import type { LivePlotConfig, PlotSeries } from "./types";

interface PlotSettingsProps {
  config: LivePlotConfig;
  onConfigChange: (config: LivePlotConfig) => void;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Debounce hook for color inputs
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PlotSettingsComponent = ({ config, onConfigChange }: PlotSettingsProps) => {
  const { topics } = useTopicsStore();
  const [localConfig, setLocalConfig] = useState<LivePlotConfig>(config);
  const [isOpen, setIsOpen] = useState(false);
  
  // Ref to track if we're in the middle of editing
  const isEditingRef = useRef(false);

  useEffect(() => {
    // Only update local config if we're not currently editing
    if (!isEditingRef.current) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleApply = useCallback(() => {
    isEditingRef.current = false;
    onConfigChange(localConfig);
    setIsOpen(false);
  }, [localConfig, onConfigChange]);

  const handleAddSeries = useCallback(() => {
    isEditingRef.current = true;
    const existingSeries = localConfig.series || [];
    const colorIndex = existingSeries.length % DEFAULT_COLORS.length;
    const newSeries: PlotSeries = {
      id: generateId(),
      topic: topics[0]?.name || "",
      messagePath: "",
      label: `Series ${existingSeries.length + 1}`,
      color: DEFAULT_COLORS[colorIndex],
      enabled: true,
    };
    setLocalConfig((prev) => ({
      ...prev,
      series: [...(prev.series || []), newSeries],
    }));
  }, [localConfig.series, topics]);

  const handleRemoveSeries = useCallback((id: string) => {
    isEditingRef.current = true;
    setLocalConfig((prev) => ({
      ...prev,
      series: (prev.series || []).filter((s) => s.id !== id),
    }));
  }, []);

  const handleUpdateSeries = useCallback((id: string, updates: Partial<PlotSeries>) => {
    isEditingRef.current = true;
    setLocalConfig((prev) => ({
      ...prev,
      series: (prev.series || []).map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const handleToggleSeries = useCallback((id: string) => {
    isEditingRef.current = true;
    setLocalConfig((prev) => ({
      ...prev,
      series: (prev.series || []).map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const handleMaxDataPointsChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    isEditingRef.current = true;
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setLocalConfig((prev) => ({ ...prev, maxDataPoints: value }));
    }
  }, []);

  const series = localConfig.series || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all"
          title="Panel Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 max-h-[600px] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Plot Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure multiple series for the live plot
            </p>
          </div>

          <div className="space-y-3">
            {/* Series List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Series</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSeries}
                  className="h-7 text-xs"
                  disabled={topics.length === 0}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Series
                </Button>
              </div>

              {series.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                  No series added. Click "Add Series" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {series.map((s, index) => (
                    <div
                      key={s.id}
                      className={`border rounded-lg p-3 space-y-2 ${
                        s.enabled
                          ? "border-gray-200"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSeries(s.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title={s.enabled ? "Hide series" : "Show series"}
                          >
                            {s.enabled ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <span className="text-xs font-medium">
                            Series {index + 1}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSeries(s.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove series"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Label */}
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            type="text"
                            placeholder="Series label"
                            value={s.label}
                            onChange={(e) =>
                              handleUpdateSeries(s.id, {
                                label: e.target.value,
                              })
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        {/* Topic */}
                        <div className="space-y-1">
                          <Label className="text-xs">Topic</Label>
                          <Select
                            value={s.topic}
                            onValueChange={(topic) =>
                              handleUpdateSeries(s.id, { topic })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                            <SelectContent>
                              {topics.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  No topics available
                                </SelectItem>
                              ) : (
                                topics.map((topic) => (
                                  <SelectItem
                                    key={topic.name}
                                    value={topic.name}
                                  >
                                    {topic.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Message Path */}
                        <div className="space-y-1">
                          <Label className="text-xs">Message Path</Label>
                          <Input
                            type="text"
                            placeholder=".data or .pose.position.x"
                            value={s.messagePath}
                            onChange={(e) =>
                              handleUpdateSeries(s.id, {
                                messagePath: e.target.value,
                              })
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                          <Label className="text-xs">Color</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={s.color}
                              onChange={(e) =>
                                handleUpdateSeries(s.id, {
                                  color: e.target.value,
                                })
                              }
                              className="h-7 w-14 p-1"
                            />
                            <Input
                              type="text"
                              value={s.color}
                              onChange={(e) =>
                                handleUpdateSeries(s.id, {
                                  color: e.target.value,
                                })
                              }
                              className="h-7 text-xs flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Max Data Points */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label htmlFor="maxDataPoints" className="text-xs">
                Max Data Points
              </Label>
              <Input
                id="maxDataPoints"
                type="number"
                min="10"
                max="1000"
                value={localConfig.maxDataPoints || 100}
                onChange={handleMaxDataPointsChange}
                className="h-7 text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Number of points to display (10-1000)
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Memoize the component to prevent re-renders when parent updates
export const PlotSettings = React.memo(PlotSettingsComponent, (prevProps, nextProps) => {
  // Only re-render if config actually changed
  return (
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.onConfigChange === nextProps.onConfigChange
  );
});
