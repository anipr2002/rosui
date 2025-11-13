"use client";

import React, { useMemo, useCallback } from "react";
import {
  usePanelsStore,
  type RawTopicViewerPanelConfig,
} from "@/store/panels-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Eye, Settings, Trash2, Info } from "lucide-react";
import { timestampToSeconds } from "@/lib/rosbag/mcap-reader";

interface RawTopicViewerPanelProps {
  panelConfig: RawTopicViewerPanelConfig;
}

export function RawTopicViewerPanel({ panelConfig }: RawTopicViewerPanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    getDeserializedMessage,
    updateRawTopicViewerPanel,
    removePanel,
  } = usePanelsStore();

  // Get topic metadata
  const topicInfo = useMemo(() => {
    if (!metadata || !panelConfig.topic) return null;
    return metadata.topics.find((t) => t.name === panelConfig.topic);
  }, [metadata, panelConfig.topic]);

  // Calculate topic statistics
  const topicStats = useMemo(() => {
    if (!metadata || !panelConfig.topic) return null;

    // Get all messages for this topic
    const allMessages = getMessagesForTopic(panelConfig.topic);

    if (allMessages.length === 0) return { count: 0, hz: 0 };

    // Calculate Hz (frequency)
    const duration = timestampToSeconds(metadata.endTime - metadata.startTime);
    const hz = duration > 0 ? allMessages.length / duration : 0;

    return {
      count: allMessages.length,
      hz: hz,
    };
  }, [metadata, panelConfig.topic, getMessagesForTopic]);

  // Get the latest message at or before the current time
  const currentMessage = useMemo(() => {
    if (!metadata || !panelConfig.topic) return null;

    const messages = getMessagesForTopic(
      panelConfig.topic,
      metadata.startTime,
      currentTime
    );

    if (messages.length === 0) return null;

    // Get the last message (most recent before/at currentTime)
    const latestMsg = messages[messages.length - 1];
    return {
      data: getDeserializedMessage(latestMsg),
      logTime: latestMsg.logTime,
    };
  }, [
    metadata,
    currentTime,
    panelConfig.topic,
    getMessagesForTopic,
    getDeserializedMessage,
  ]);

  // Format the message for display
  const formattedMessage = useMemo(() => {
    if (!currentMessage) return null;

    try {
      let jsonString = JSON.stringify(
        currentMessage.data,
        null,
        panelConfig.prettyPrint ? 2 : 0
      );

      // Apply max length truncation
      if (jsonString.length > panelConfig.maxMessageLength) {
        jsonString =
          jsonString.slice(0, panelConfig.maxMessageLength) +
          "\n... (truncated)";
      }

      return jsonString;
    } catch (error) {
      return (
        "Error formatting message: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }, [currentMessage, panelConfig.prettyPrint, panelConfig.maxMessageLength]);

  // Format timestamp
  const formattedTimestamp = useMemo(() => {
    if (!currentMessage || !metadata) return null;

    const timeSeconds = timestampToSeconds(
      currentMessage.logTime - metadata.startTime
    );
    return `${timeSeconds.toFixed(3)}s`;
  }, [currentMessage, metadata]);

  const handleTopicChange = useCallback(
    (newTopic: string) => {
      updateRawTopicViewerPanel(panelConfig.id, { topic: newTopic });
    },
    [panelConfig.id, updateRawTopicViewerPanel]
  );

  const handleMaxLengthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        updateRawTopicViewerPanel(panelConfig.id, { maxMessageLength: value });
      }
    },
    [panelConfig.id, updateRawTopicViewerPanel]
  );

  const handlePrettyPrintChange = useCallback(
    (checked: boolean) => {
      updateRawTopicViewerPanel(panelConfig.id, { prettyPrint: checked });
    },
    [panelConfig.id, updateRawTopicViewerPanel]
  );

  const handleShowTimestampChange = useCallback(
    (checked: boolean) => {
      updateRawTopicViewerPanel(panelConfig.id, { showTimestamp: checked });
    },
    [panelConfig.id, updateRawTopicViewerPanel]
  );

  const handleRemovePanel = useCallback(() => {
    removePanel(panelConfig.id);
  }, [panelConfig.id, removePanel]);

  if (!metadata) return null;

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-blue-300">
      <CardHeader className="bg-blue-50 border-blue-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <FileText className="h-5 w-5 mt-0.5 text-blue-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-blue-900">
              Raw Topic Viewer
            </CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs max-w-[200px] truncate cursor-help">
                  {panelConfig.topic || "No topic"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs"
                colorVariant="blue"
              >
                <p className="break-words font-mono text-xs">
                  {panelConfig.topic || "No topic selected"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="view" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-0">
            <div className="space-y-4">
              {/* Topic Information */}
              {topicInfo && topicStats && (
                <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    Topic Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3 py-1">
                      <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                        Type
                      </span>
                      <span className="text-xs font-mono text-gray-900 text-right break-all">
                        {topicInfo.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3 py-1">
                      <span className="text-xs font-medium text-gray-600">
                        Frequency
                      </span>
                      <span className="text-xs font-mono text-gray-900">
                        {topicStats.hz.toFixed(2)} Hz
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3 py-1">
                      <span className="text-xs font-medium text-gray-600">
                        Total Messages
                      </span>
                      <span className="text-xs font-mono text-gray-900">
                        {topicStats.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentMessage ? (
                <>
                  {panelConfig.showTimestamp && formattedTimestamp && (
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-xs font-medium text-gray-600">
                        Message Timestamp
                      </span>
                      <span className="text-xs font-mono text-gray-900">
                        {formattedTimestamp}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700">
                      Message Data
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {formattedMessage}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    No Message at Current Time
                  </h3>
                  <p className="text-sm text-gray-500">
                    {panelConfig.topic
                      ? "Move the playback slider to see messages from this topic"
                      : "Select a topic in the Settings tab to get started"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="space-y-6">
              {/* Topic Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topic-select" className="text-sm font-medium">
                    Topic
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Select the ROS topic to display messages from
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={panelConfig.topic}
                  onValueChange={handleTopicChange}
                >
                  <SelectTrigger id="topic-select" className="bg-white">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.topics.map((topic) => (
                      <SelectItem key={topic.name} value={topic.name}>
                        <span className="font-mono text-xs">{topic.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {metadata.topics.length} topic
                  {metadata.topics.length !== 1 ? "s" : ""} available
                </p>
              </div>

              {/* Max Message Length */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="max-length" className="text-sm font-medium">
                    Max Message Length
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Maximum number of characters to display. Longer
                          messages will be truncated.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="max-length"
                  type="number"
                  min="100"
                  max="100000"
                  value={panelConfig.maxMessageLength}
                  onChange={handleMaxLengthChange}
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">
                  Characters to display (100 - 100,000)
                </p>
              </div>

              {/* Pretty Print Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pretty-print" className="text-sm font-medium">
                    Pretty Print JSON
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Format JSON with indentation for better readability
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="pretty-print"
                  checked={panelConfig.prettyPrint}
                  onCheckedChange={handlePrettyPrintChange}
                  data-state={panelConfig.prettyPrint ? "checked" : "unchecked"}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>

              {/* Show Timestamp Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="show-timestamp"
                    className="text-sm font-medium"
                  >
                    Show Timestamp
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Display the message timestamp relative to the start of
                          the recording
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="show-timestamp"
                  checked={panelConfig.showTimestamp}
                  onCheckedChange={handleShowTimestampChange}
                  data-state={
                    panelConfig.showTimestamp ? "checked" : "unchecked"
                  }
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
