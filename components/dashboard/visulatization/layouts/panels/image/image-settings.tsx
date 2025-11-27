"use client";

import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTopicsStore } from "@/store/topic-store";
import type {
  ImagePanelConfig,
  ColorMode,
  ColorMapType,
  RotationAngle,
} from "./types";

interface ImageSettingsProps {
  config: ImagePanelConfig;
  onConfigChange: (config: ImagePanelConfig) => void;
}

export function ImageSettings({ config, onConfigChange }: ImageSettingsProps) {
  const { topics } = useTopicsStore();
  const [localConfig, setLocalConfig] = useState<ImagePanelConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleApply = () => {
    onConfigChange(localConfig);
    setIsOpen(false);
  };

  // Filter topics to only show image types
  const imageTopics = topics.filter(
    (t) =>
      t.type === "sensor_msgs/Image" ||
      t.type === "sensor_msgs/CompressedImage" ||
      t.type.includes("Image")
  );

  // Filter topics for camera calibration
  const calibrationTopics = topics.filter(
    (t) => t.type === "sensor_msgs/CameraInfo" || t.type.includes("CameraInfo")
  );

  // Filter topics for image markers
  const annotationTopics = topics.filter(
    (t) =>
      t.type === "visualization_msgs/ImageMarker" ||
      t.type.includes("ImageMarker")
  );

  // Check if current image topic supports depth visualization
  const isDepthImage = localConfig.imageTopic
    ? imageTopics
        .find((t) => t.name === localConfig.imageTopic)
        ?.type.includes("16UC1") ||
      imageTopics
        .find((t) => t.name === localConfig.imageTopic)
        ?.type.includes("mono16") ||
      imageTopics
        .find((t) => t.name === localConfig.imageTopic)
        ?.type.includes("32FC1")
    : false;

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
            <h3 className="font-semibold text-sm mb-1">Image Panel Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure image display and processing
            </p>
          </div>

          <div className="space-y-3">
            {/* Image Topic */}
            <div className="space-y-1.5">
              <Label htmlFor="imageTopic" className="text-xs">
                Image Topic
              </Label>
              <Select
                value={localConfig.imageTopic || ""}
                onValueChange={(imageTopic) =>
                  setLocalConfig({ ...localConfig, imageTopic })
                }
              >
                <SelectTrigger id="imageTopic" className="h-8 text-xs">
                  <SelectValue placeholder="Select image topic" />
                </SelectTrigger>
                <SelectContent>
                  {imageTopics.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No image topics available
                    </SelectItem>
                  ) : (
                    imageTopics.map((topic) => (
                      <SelectItem key={topic.name} value={topic.name}>
                        {topic.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Calibration Topic */}
            <div className="space-y-1.5">
              <Label htmlFor="calibrationTopic" className="text-xs">
                Calibration Topic (Optional)
              </Label>
              <Select
                value={localConfig.calibrationTopic || "__none__"}
                onValueChange={(calibrationTopic) => {
                  const newValue =
                    calibrationTopic === "__none__"
                      ? undefined
                      : calibrationTopic;
                  setLocalConfig({
                    ...localConfig,
                    calibrationTopic: newValue,
                  });
                }}
              >
                <SelectTrigger id="calibrationTopic" className="h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {calibrationTopics.map((topic) => (
                    <SelectItem key={topic.name} value={topic.name}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transforms Section */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold">Transforms</Label>

              {/* Flip Controls */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="flipHorizontal"
                    checked={localConfig.flipHorizontal || false}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        flipHorizontal: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="flipHorizontal"
                    className="text-xs cursor-pointer"
                  >
                    Flip Horizontal
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="flipVertical"
                    checked={localConfig.flipVertical || false}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        flipVertical: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="flipVertical"
                    className="text-xs cursor-pointer"
                  >
                    Flip Vertical
                  </Label>
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-1.5">
                <Label htmlFor="rotation" className="text-xs">
                  Rotation
                </Label>
                <Select
                  value={String(localConfig.rotation || 0)}
                  onValueChange={(rotation) =>
                    setLocalConfig({
                      ...localConfig,
                      rotation: parseInt(rotation) as RotationAngle,
                    })
                  }
                >
                  <SelectTrigger id="rotation" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0°</SelectItem>
                    <SelectItem value="90">90°</SelectItem>
                    <SelectItem value="180">180°</SelectItem>
                    <SelectItem value="270">270°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color Mode Section - Only for depth images */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold">
                Color Mode (for depth images)
              </Label>

              <div className="space-y-1.5">
                <Label htmlFor="colorMode" className="text-xs">
                  Mode
                </Label>
                <Select
                  value={localConfig.colorMode || "raw"}
                  onValueChange={(colorMode) =>
                    setLocalConfig({
                      ...localConfig,
                      colorMode: colorMode as ColorMode,
                    })
                  }
                >
                  <SelectTrigger id="colorMode" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="colormap">Color Map</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Map Selector */}
              {localConfig.colorMode === "colormap" && (
                <div className="space-y-1.5">
                  <Label htmlFor="colorMap" className="text-xs">
                    Color Map
                  </Label>
                  <Select
                    value={localConfig.colorMap || "turbo"}
                    onValueChange={(colorMap) =>
                      setLocalConfig({
                        ...localConfig,
                        colorMap: colorMap as ColorMapType,
                      })
                    }
                  >
                    <SelectTrigger id="colorMap" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="turbo">Turbo (Google)</SelectItem>
                      <SelectItem value="rainbow">Rainbow (RViz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Gradient Colors */}
              {localConfig.colorMode === "gradient" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="gradientMin" className="text-xs">
                        Min Color
                      </Label>
                      <Input
                        id="gradientMin"
                        type="color"
                        value={localConfig.gradientColors?.min || "#000000"}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            gradientColors: {
                              min: e.target.value,
                              max: localConfig.gradientColors?.max || "#ffffff",
                            },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="gradientMax" className="text-xs">
                        Max Color
                      </Label>
                      <Input
                        id="gradientMax"
                        type="color"
                        value={localConfig.gradientColors?.max || "#ffffff"}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            gradientColors: {
                              min: localConfig.gradientColors?.min || "#000000",
                              max: e.target.value,
                            },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Value Range */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="valueMin" className="text-xs">
                      Value Min
                    </Label>
                    <Input
                      id="valueMin"
                      type="number"
                      value={localConfig.valueMin ?? 0}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          valueMin: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="valueMax" className="text-xs">
                      Value Max
                    </Label>
                    <Input
                      id="valueMax"
                      type="number"
                      value={localConfig.valueMax ?? 10000}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          valueMax: parseFloat(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Min/max values for depth scaling
                </p>
              </div>
            </div>

            {/* Annotation Topics */}
            {annotationTopics.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold">
                  Annotation Topics (Optional)
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {annotationTopics.map((topic) => {
                    const isSelected =
                      localConfig.annotationTopics?.includes(topic.name) ||
                      false;
                    return (
                      <div
                        key={topic.name}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`annotation-${topic.name}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const current = localConfig.annotationTopics || [];
                            const updated = checked
                              ? [...current, topic.name]
                              : current.filter((t) => t !== topic.name);
                            setLocalConfig({
                              ...localConfig,
                              annotationTopics: updated,
                            });
                          }}
                        />
                        <Label
                          htmlFor={`annotation-${topic.name}`}
                          className="text-xs cursor-pointer flex-1"
                        >
                          {topic.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
}
