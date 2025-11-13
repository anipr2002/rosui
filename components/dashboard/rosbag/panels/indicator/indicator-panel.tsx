"use client";

import React, { useMemo, useCallback } from "react";
import {
  usePanelsStore,
  type IndicatorPanelConfig,
} from "@/store/panels-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RulesConfig } from "./rules-config";
import { Lightbulb, Eye, Settings, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseNumericPath } from "@/lib/rosbag/message-path-parser";

interface IndicatorPanelProps {
  panelConfig: IndicatorPanelConfig;
}

function evaluateRule(
  value: any,
  comparison: string,
  compareWith: any
): boolean {
  // Handle type conversion
  const numValue = typeof value === "number" ? value : parseFloat(value);
  const numCompare =
    typeof compareWith === "number" ? compareWith : parseFloat(compareWith);

  // Try numeric comparison first
  if (!isNaN(numValue) && !isNaN(numCompare)) {
    switch (comparison) {
      case "equal":
        return Math.abs(numValue - numCompare) < 0.0001;
      case "less":
        return numValue < numCompare;
      case "lessOrEqual":
        return numValue <= numCompare;
      case "greater":
        return numValue > numCompare;
      case "greaterOrEqual":
        return numValue >= numCompare;
      default:
        return false;
    }
  }

  // Fall back to string/exact comparison
  if (comparison === "equal") {
    return value === compareWith || String(value) === String(compareWith);
  }

  return false;
}

export function IndicatorPanel({ panelConfig }: IndicatorPanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    getDeserializedMessage,
    updateIndicatorPanel,
    removePanel,
  } = usePanelsStore();

  // Get current value from messages
  const currentValue = useMemo(() => {
    if (!metadata || !panelConfig.topic || !panelConfig.messagePath)
      return null;

    const messages = getMessagesForTopic(
      panelConfig.topic,
      metadata.startTime,
      currentTime
    );

    if (messages.length === 0) return null;

    // Get the most recent message
    const latestMessage = messages[messages.length - 1];
    const deserializedMsg = getDeserializedMessage(latestMessage);

    // Parse the message path
    const value = parseNumericPath(deserializedMsg, panelConfig.messagePath);
    return value;
  }, [
    metadata,
    currentTime,
    panelConfig.topic,
    panelConfig.messagePath,
    getMessagesForTopic,
    getDeserializedMessage,
  ]);

  // Find the first matching rule
  const matchedRule = useMemo(() => {
    if (currentValue === null || panelConfig.rules.length === 0) return null;

    for (const rule of panelConfig.rules) {
      if (evaluateRule(currentValue, rule.comparison, rule.compareWith)) {
        return rule;
      }
    }

    return null;
  }, [currentValue, panelConfig.rules]);

  const handleRemovePanel = useCallback(() => {
    removePanel(panelConfig.id);
  }, [panelConfig.id, removePanel]);

  const handleTopicChange = useCallback(
    (topic: string) => {
      updateIndicatorPanel(panelConfig.id, { topic });
    },
    [panelConfig.id, updateIndicatorPanel]
  );

  const handleMessagePathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateIndicatorPanel(panelConfig.id, { messagePath: e.target.value });
    },
    [panelConfig.id, updateIndicatorPanel]
  );

  const handleStyleChange = useCallback(
    (style: "bulb" | "background") => {
      updateIndicatorPanel(panelConfig.id, { style });
    },
    [panelConfig.id, updateIndicatorPanel]
  );

  if (!metadata) return null;

  // Determine display color and label
  const displayColor = matchedRule?.color || "#6b7280"; // gray-500 as default
  const displayLabel =
    matchedRule?.label ||
    (currentValue !== null ? String(currentValue) : "No data");

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-indigo-300">
      <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <Lightbulb className="h-5 w-5 mt-0.5 text-indigo-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-indigo-900">
              Indicator Panel
            </CardTitle>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-xs">
            {panelConfig.rules.length}{" "}
            {panelConfig.rules.length === 1 ? "Rule" : "Rules"}
          </Badge>
          <Button
            onClick={handleRemovePanel}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 h-7 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="indicator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="indicator" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Indicator
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indicator" className="mt-0">
            <div className="space-y-4">
              {/* Display current value */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-2">Current Value</div>
                <div className="text-2xl font-mono font-semibold text-gray-900">
                  {currentValue !== null ? currentValue : "N/A"}
                </div>
              </div>

              {/* Indicator Display */}
              <div className="flex items-center justify-center p-8">
                {panelConfig.style === "bulb" ? (
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: displayColor,
                        boxShadow: `0 0 30px ${displayColor}60`,
                      }}
                    >
                      <Lightbulb className="h-16 w-16 text-white" />
                    </div>
                    <div
                      className="text-xl font-semibold px-6 py-2 rounded-lg"
                      style={{
                        color: displayColor,
                        backgroundColor: `${displayColor}20`,
                        border: `2px solid ${displayColor}`,
                      }}
                    >
                      {displayLabel}
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full p-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: displayColor }}
                  >
                    <div className="text-3xl font-bold text-white drop-shadow-lg">
                      {displayLabel}
                    </div>
                  </div>
                )}
              </div>

              {panelConfig.rules.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-amber-800">
                    No rules configured. Add rules in the Settings tab to
                    display different colors and labels based on data values.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">General</h4>

                {/* Topic Selection */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium">
                    Topic
                  </Label>
                  <Select
                    value={panelConfig.topic}
                    onValueChange={handleTopicChange}
                  >
                    <SelectTrigger id="topic" className="bg-white">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata.topics.map((topic) => (
                        <SelectItem key={topic.name} value={topic.name}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Path */}
                <div className="space-y-2">
                  <Label htmlFor="messagePath" className="text-sm font-medium">
                    Data (Message Path)
                  </Label>
                  <Input
                    id="messagePath"
                    value={panelConfig.messagePath}
                    onChange={handleMessagePathChange}
                    placeholder=".data"
                    className="bg-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Path to the data field (e.g., .data, .pose.position.x)
                  </p>
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label htmlFor="style" className="text-sm font-medium">
                    Style
                  </Label>
                  <Select
                    value={panelConfig.style}
                    onValueChange={handleStyleChange}
                  >
                    <SelectTrigger id="style" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulb">Bulb</SelectItem>
                      <SelectItem value="background">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rules Configuration */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <RulesConfig
                    panelId={panelConfig.id}
                    rules={panelConfig.rules}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
