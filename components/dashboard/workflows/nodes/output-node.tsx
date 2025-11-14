"use client";

import React, { useMemo, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { UploadCloud, Trash2, Copy, X } from "lucide-react";
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
import type { OutputNodeConfig, WorkflowNodeData } from "../types";
import { useWorkflowCanvas } from "../workflow-context";
import { messageTypeParser } from "@/lib/ros/messageTypeParser";
import { useServicesStore } from "@/store/service-store";

export function OutputNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const {
    topics,
    services,
    updateOutputConfig,
    updateLabel,
    removeNode,
    duplicateNode,
    isRunning,
    getLiveMessages,
    clearLiveMessages,
  } = useWorkflowCanvas();
  const config = data.config as OutputNodeConfig;
  const { getServiceDefinition } = useServicesStore();
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

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        label: service.name,
        value: service.name,
        type: service.type,
      })),
    [services]
  );

  // Auto-populate message template when target topic type changes
  useEffect(() => {
    if (config.mode === "publish" && config.targetType) {
      const defaultMessage = messageTypeParser.createDefaultMessage(
        config.targetType
      );
      if (defaultMessage && Object.keys(defaultMessage).length > 0) {
        const formattedMessage = JSON.stringify(defaultMessage, null, 2);
        updateOutputConfig(id, (prev) => ({
          ...prev,
          customMessage: formattedMessage,
        }));
      }
    }
  }, [config.targetType]);

  // Auto-populate message template when service type changes
  useEffect(() => {
    if (config.mode === "service" && config.serviceType) {
      const loadServiceTemplate = async () => {
        try {
          const serviceDef = await getServiceDefinition(config.serviceType!);
          if (serviceDef?.request?.defaultMessage) {
            const formattedMessage = JSON.stringify(
              serviceDef.request.defaultMessage,
              null,
              2
            );
            updateOutputConfig(id, (prev) => ({
              ...prev,
              customMessage: formattedMessage,
            }));
          }
        } catch (error) {
          console.error("Failed to load service template:", error);
        }
      };
      loadServiceTemplate();
    }
  }, [config.serviceType]);

  return (
    <Card className="relative shadow-none pt-0 rounded-xl border border-green-200">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white shadow"
      />
      <CardHeader className="bg-green-50 border-green-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
          <UploadCloud className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <Input
              value={data.label}
              onChange={(event) => updateLabel(id, event.target.value)}
              className="h-8 text-sm border-green-100 focus-visible:ring-green-500"
              disabled={isRunning}
            />
            <p className="text-xs text-green-800 truncate">
              Publish or trigger services
            </p>
          </div>
          <Badge
            variant="outline"
            className="justify-self-end text-[10px] capitalize"
          >
            {data.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              Live Data ({liveMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Mode</Label>
              <Select
                value={config.mode}
                onValueChange={(value) =>
                  updateOutputConfig(id, (prev) => ({
                    ...prev,
                    mode: value as OutputNodeConfig["mode"],
                  }))
                }
                disabled={isRunning}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish topic</SelectItem>
                  <SelectItem value="service">Trigger service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.mode === "publish" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Target topic</Label>
                  <Select
                    value={config.targetTopic}
                    onValueChange={(value) =>
                      updateOutputConfig(id, (prev) => ({
                        ...prev,
                        targetTopic: value === "__custom" ? "" : value,
                        targetType:
                          value === "__custom"
                            ? prev.targetType
                            : topicOptions.find(
                                (topic) => topic.value === value
                              )?.type,
                      }))
                    }
                    disabled={isRunning}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__custom">Custom topic</SelectItem>
                      {topicOptions.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          <div className="flex flex-col">
                            <span>{topic.label}</span>
                            <span className="text-[10px] text-gray-500">
                              {topic.type}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Topic name</Label>
                    <Input
                      value={config.targetTopic || ""}
                      onChange={(event) =>
                        updateOutputConfig(id, (prev) => ({
                          ...prev,
                          targetTopic: event.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">
                      Message type
                    </Label>
                    <Input
                      value={config.targetType || ""}
                      onChange={(event) =>
                        updateOutputConfig(id, (prev) => ({
                          ...prev,
                          targetType: event.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                      placeholder="std_msgs/String"
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Service</Label>
                  <Select
                    value={config.serviceName}
                    onValueChange={(value) =>
                      updateOutputConfig(id, (prev) => ({
                        ...prev,
                        serviceName: value,
                        serviceType: serviceOptions.find(
                          (service) => service.value === value
                        )?.type,
                      }))
                    }
                    disabled={isRunning}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.length === 0 && (
                        <SelectItem value="no-services" disabled>
                          No services available
                        </SelectItem>
                      )}
                      {serviceOptions.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          <div className="flex flex-col">
                            <span>{service.label}</span>
                            <span className="text-[10px] text-gray-500">
                              {service.type}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Service type</Label>
                  <Input
                    value={config.serviceType || ""}
                    onChange={(event) =>
                      updateOutputConfig(id, (prev) => ({
                        ...prev,
                        serviceType: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="rosapi/Topics"
                    disabled={isRunning}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">
                Message template (optional JSON)
              </Label>
              <Textarea
                value={config.customMessage || ""}
                onChange={(event) =>
                  updateOutputConfig(id, (prev) => ({
                    ...prev,
                    customMessage: event.target.value,
                  }))
                }
                placeholder='{ "data": "custom" }'
                className="text-xs font-mono"
                rows={4}
                disabled={isRunning}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Auto publish
                </p>
                <p className="text-[10px] text-gray-500">
                  Send when pipeline runs
                </p>
              </div>
              <Switch
                checked={config.autoPublish}
                onCheckedChange={(checked) =>
                  updateOutputConfig(id, (prev) => ({
                    ...prev,
                    autoPublish: checked,
                  }))
                }
                disabled={isRunning}
              />
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
                className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1"
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

          <TabsContent value="live" className="space-y-2 mt-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-600">
                Last {liveMessages.length} sent messages
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
                  No messages sent yet
                </div>
              ) : (
                liveMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded p-2 border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-50 text-green-700 border-green-200"
                      >
                        Sent
                      </Badge>
                      <div className="text-[10px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
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
