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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTopicsStore } from "@/store/topic-store";
import type { RawTopicViewerConfig } from "./types";

interface RawTopicSettingsProps {
  config: RawTopicViewerConfig;
  onConfigChange: (config: RawTopicViewerConfig) => void;
}

export function RawTopicSettings({
  config,
  onConfigChange,
}: RawTopicSettingsProps) {
  const { topics } = useTopicsStore();
  const [localConfig, setLocalConfig] = useState<RawTopicViewerConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleApply = () => {
    onConfigChange(localConfig);
    setIsOpen(false);
  };

  const handleMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 100 && value <= 100000) {
      setLocalConfig({ ...localConfig, maxMessageLength: value });
    }
  };

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
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Panel Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure raw topic viewer
            </p>
          </div>

          <div className="space-y-3">
            {/* Topic Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="topic" className="text-xs">
                Topic
              </Label>
              <Select
                value={localConfig.topic || ""}
                onValueChange={(topic) =>
                  setLocalConfig({ ...localConfig, topic })
                }
              >
                <SelectTrigger id="topic" className="h-8 text-xs">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.name} value={topic.name}>
                      <span className="font-mono text-xs">{topic.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {topics.length} topic{topics.length !== 1 ? "s" : ""} available
              </p>
            </div>

            {/* Max Message Length */}
            <div className="space-y-1.5">
              <Label htmlFor="max-length" className="text-xs">
                Max Message Length
              </Label>
              <Input
                id="max-length"
                type="number"
                min="100"
                max="100000"
                value={localConfig.maxMessageLength || 10000}
                onChange={handleMaxLengthChange}
                className="h-8 text-xs"
              />
              <p className="text-xs text-gray-500">
                Characters to display (100 - 100,000)
              </p>
            </div>

            {/* Pretty Print Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="pretty-print" className="text-xs">
                Pretty Print JSON
              </Label>
              <Switch
                id="pretty-print"
                checked={localConfig.prettyPrint ?? true}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, prettyPrint: checked })
                }
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>

            {/* Show Timestamp Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="show-timestamp" className="text-xs">
                Show Timestamp
              </Label>
              <Switch
                id="show-timestamp"
                checked={localConfig.showTimestamp ?? true}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, showTimestamp: checked })
                }
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
