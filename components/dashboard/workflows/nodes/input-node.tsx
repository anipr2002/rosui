"use client";

import React, { useMemo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { DownloadCloud, Trash2, Copy, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useWorkflowCanvas } from "../workflow-context";
import type { InputNodeConfig, WorkflowNodeData } from "../types";

export function InputNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const {
    topics,
    updateInputConfig,
    updateLabel,
    removeNode,
    duplicateNode,
    isRunning,
    getLiveMessages,
    clearLiveMessages,
    expandedNodeId,
    setExpandedNode,
  } = useWorkflowCanvas();

  const isExpanded = expandedNodeId === id;
  const config = data.config as InputNodeConfig;
  const liveMessages = getLiveMessages(id);

  const topicOptions = useMemo(
    () =>
      topics.map((topic) => ({
        label: topic.name,
        value: topic.name,
        type: topic.type,
      })),
    [topics]
  );

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setExpandedNode(id);
    }
  };

  // Collapsed view - Circle shape
  if (!isExpanded) {
    return (
      <div
        className="relative cursor-pointer transition-all duration-300 ease-in-out w-fit"
        onClick={handleNodeClick}
        style={{ borderWidth: 0, padding: 0, background: "transparent" }}
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative">
          <Handle
            type="source"
            position={Position.Right}
            className="w-2 h-2 bg-blue-500 border-2 border-white shadow"
          />
          <DownloadCloud className="h-6 w-6 text-blue-600" />
        </div>
        {data.label && (
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-600 truncate max-w-[80px]">
            {data.label}
          </div>
        )}
        {data.status === "active" && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
    );
  }

  // Expanded view - Full form
  return (
    <Card
      className="relative shadow-none pt-0 rounded-xl border border-blue-200 transition-all duration-300 ease-in-out overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow"
      />
      <CardHeader
        className={`bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6`}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
          <DownloadCloud className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <Input
              value={data.label}
              onChange={(event) => updateLabel(id, event.target.value)}
              className="h-8 text-sm border-blue-100 focus-visible:ring-blue-500"
              disabled={isRunning}
            />
            <p className="text-xs text-blue-800 truncate">
              Subscribe & buffer ROS messages
            </p>
          </div>
          <Badge variant="outline" className="justify-self-end text-[10px]">
            {data.status === "active" ? "Streaming" : data.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
            <TabsTrigger value="execution" className="text-xs">
              Execution
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              Live ({liveMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Topic name</Label>
              <Select
                value={config.topicName}
                onValueChange={(value) =>
                  updateInputConfig(id, (prev) => ({
                    ...prev,
                    topicName: value,
                    topicType: topicOptions.find(
                      (option) => option.value === value
                    )?.type,
                  }))
                }
                disabled={isRunning}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topicOptions.length === 0 && (
                    <SelectItem value="no-topics" disabled>
                      No topics available
                    </SelectItem>
                  )}
                  {topicOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-[10px] text-gray-500">
                          {option.type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Buffer size</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.bufferSize}
                  onChange={(event) =>
                    updateInputConfig(id, (prev) => ({
                      ...prev,
                      bufferSize: Number(event.target.value) || 1,
                    }))
                  }
                  className="h-9 text-sm"
                  disabled={isRunning}
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg px-3">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Auto-start
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Subscribe when running
                  </p>
                </div>
                <Switch
                  checked={config.autoStart}
                  onCheckedChange={(checked) =>
                    updateInputConfig(id, (prev) => ({
                      ...prev,
                      autoStart: checked,
                    }))
                  }
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <div>
                <span className="font-semibold text-gray-900 text-sm mr-1">
                  {data.stats.messageCount}
                </span>
                msgs
              </div>
              <div className="text-xs text-gray-500">
                {data.stats.throughput.toFixed(2)} msg/s
              </div>
              <div className="text-[10px] text-gray-500">
                {data.stats.lastUpdated
                  ? new Date(data.stats.lastUpdated).toLocaleTimeString()
                  : "idle"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1"
                onClick={() => duplicateNode(id)}
                disabled={isRunning}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                onClick={() => removeNode(id)}
                disabled={isRunning}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="execution" className="space-y-4 mt-0">
            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Enable execution
                </p>
                <p className="text-[10px] text-gray-500">
                  Trigger actions on message receipt
                </p>
              </div>
              <Switch
                checked={config.executionEnabled || false}
                onCheckedChange={(checked) =>
                  updateInputConfig(id, (prev) => ({
                    ...prev,
                    executionEnabled: checked,
                  }))
                }
                disabled={isRunning}
              />
            </div>

            {config.executionEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Execution type
                  </Label>
                  <Select
                    value={config.executionType || "publish"}
                    onValueChange={(value) =>
                      updateInputConfig(id, (prev) => ({
                        ...prev,
                        executionType: value as "publish" | "service",
                      }))
                    }
                    disabled={isRunning}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publish">Publish Topic</SelectItem>
                      <SelectItem value="service">Call Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    {config.executionType === "service"
                      ? "Service name"
                      : "Topic name"}
                  </Label>
                  <Input
                    value={config.executionTarget || ""}
                    onChange={(event) =>
                      updateInputConfig(id, (prev) => ({
                        ...prev,
                        executionTarget: event.target.value,
                      }))
                    }
                    placeholder={
                      config.executionType === "service"
                        ? "/my_service"
                        : "/my_topic"
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Message template (JSON)
                  </Label>
                  <Textarea
                    value={config.executionMessage || ""}
                    onChange={(event) =>
                      updateInputConfig(id, (prev) => ({
                        ...prev,
                        executionMessage: event.target.value,
                      }))
                    }
                    placeholder='{"data": "value"}'
                    className="text-xs font-mono"
                    rows={4}
                    disabled={isRunning}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-2 mt-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-600">
                Last {liveMessages.length} messages
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearLiveMessages(id)}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {liveMessages.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No messages yet
                </div>
              ) : (
                liveMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded p-2 border border-gray-200"
                  >
                    <div className="text-[10px] text-gray-500 mb-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <pre className="text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
