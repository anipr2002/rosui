"use client";

import React, { useMemo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Cog,
  Trash2,
  Copy,
  X,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ProcessNodeConfig, WorkflowNodeData } from "../types";
import { useWorkflowCanvas } from "../workflow-context";
import { Sparkline, DataDistribution, StatCard } from "../mini-charts";

export function ProcessNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const {
    updateProcessConfig,
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
  const config = data.config as ProcessNodeConfig;
  const liveMessages = getLiveMessages(id);
  const beforeMessages = liveMessages.filter(
    (m) => m.type === "process-before"
  );
  const afterMessages = liveMessages.filter((m) => m.type === "process-after");

  // Extract numeric data for analytics
  const numericData = useMemo(() => {
    const values: number[] = [];
    afterMessages.forEach((msg) => {
      if (typeof msg.data === "number") {
        values.push(msg.data);
      } else if (typeof msg.data === "object" && msg.data !== null) {
        Object.values(msg.data).forEach((val) => {
          if (typeof val === "number") {
            values.push(val);
          }
        });
      }
    });
    return values.slice(0, 50); // Last 50 values
  }, [afterMessages]);

  const operationCategories = {
    basic: [
      { value: "passThrough", label: "Pass through" },
      { value: "throttle", label: "Throttle" },
      { value: "filter", label: "Filter field" },
      { value: "aggregate", label: "Aggregate window" },
    ],
    transform: [
      { value: "mapField", label: "Map Field" },
      { value: "mathOp", label: "Math Operation" },
      { value: "stringTransform", label: "String Transform" },
      { value: "jsonPath", label: "JSON Path Extract" },
    ],
    statistical: [
      { value: "movingAverage", label: "Moving Average" },
      { value: "stdDev", label: "Standard Deviation" },
      { value: "minMax", label: "Min/Max Tracker" },
      { value: "rateOfChange", label: "Rate of Change" },
      { value: "outlierDetection", label: "Outlier Detection" },
    ],
    ros: [
      { value: "coordinateTransform", label: "Coordinate Transform" },
      { value: "messageSplit", label: "Message Split" },
      { value: "messageMerge", label: "Message Merge" },
      { value: "timestampValidation", label: "Timestamp Validation" },
    ],
    filters: [
      { value: "rangeFilter", label: "Range Filter" },
      { value: "regexFilter", label: "Regex Filter" },
      { value: "multiCondition", label: "Multi-Condition" },
    ],
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setExpandedNode(id);
    }
  };

  // Collapsed view - Hexagon shape
  if (!isExpanded) {
    return (
      <div
        className="relative cursor-pointer transition-all duration-300 ease-in-out"
        onClick={handleNodeClick}
      >
        <div
          className="w-14 h-14 bg-purple-50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative"
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="w-2 h-2 bg-purple-500 border-2 border-white shadow"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-2 h-2 bg-purple-500 border-2 border-white shadow"
          />
          <Cog className="h-6 w-6 text-purple-600" />
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
      className="relative shadow-none pt-0 rounded-xl border border-purple-200 w-[380px] transition-all duration-300 ease-in-out overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow"
      />
      <CardHeader className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
          <Cog className="h-5 w-5 text-purple-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <Input
              value={data.label}
              onChange={(event) => updateLabel(id, event.target.value)}
              className="h-8 text-sm border-purple-100 focus-visible:ring-purple-500"
              disabled={isRunning}
            />
            <p className="text-xs text-purple-800 truncate">
              Transform, filter or aggregate data
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
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              Live ({liveMessages.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Operation</Label>
              <Select
                value={config.operation}
                onValueChange={(value) =>
                  updateProcessConfig(id, (prev) => ({
                    ...prev,
                    operation: value as ProcessNodeConfig["operation"],
                  }))
                }
                disabled={isRunning}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select an operation" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                    Basic
                  </div>
                  {operationCategories.basic.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                    Data Transform
                  </div>
                  {operationCategories.transform.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                    Statistical
                  </div>
                  {operationCategories.statistical.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                    ROS-Specific
                  </div>
                  {operationCategories.ros.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                    Advanced Filters
                  </div>
                  {operationCategories.filters.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Operations */}
            {config.operation === "throttle" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Max rate (Hz)</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.throttleHz}
                  onChange={(event) =>
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      throttleHz: Number(event.target.value) || 1,
                    }))
                  }
                  className="h-9 text-sm"
                  disabled={isRunning}
                />
              </div>
            )}

            {config.operation === "filter" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.filterField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        filterField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. temperature"
                    disabled={isRunning}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Operator</Label>
                    <Select
                      value={config.filterOperator || "="}
                      onValueChange={(value) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          filterOperator: value as any,
                        }))
                      }
                      disabled={isRunning}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">Equals (=)</SelectItem>
                        <SelectItem value="!=">Not Equals (!=)</SelectItem>
                        <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                        <SelectItem value="<">Less Than (&lt;)</SelectItem>
                        <SelectItem value=">=">Greater or Equal (≥)</SelectItem>
                        <SelectItem value="<=">Less or Equal (≤)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Value</Label>
                    <Input
                      value={config.filterValue || ""}
                      onChange={(event) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          filterValue: event.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </div>
            )}

            {config.operation === "aggregate" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">
                  Window size (messages)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={config.aggregateWindow}
                  onChange={(event) =>
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      aggregateWindow: Number(event.target.value) || 1,
                    }))
                  }
                  className="h-9 text-sm"
                  disabled={isRunning}
                />
              </div>
            )}

            {/* Data Transformations */}
            {config.operation === "mapField" && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Field Mappings</Label>
                {(config.fieldMappings || []).map((mapping, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">
                        Source
                      </Label>
                      <Input
                        value={mapping.source}
                        onChange={(event) => {
                          const newMappings = [...(config.fieldMappings || [])];
                          newMappings[index] = {
                            ...newMappings[index],
                            source: event.target.value,
                          };
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            fieldMappings: newMappings,
                          }));
                        }}
                        className="h-8 text-sm"
                        placeholder="e.g. position.x"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">
                        Target
                      </Label>
                      <Input
                        value={mapping.target}
                        onChange={(event) => {
                          const newMappings = [...(config.fieldMappings || [])];
                          newMappings[index] = {
                            ...newMappings[index],
                            target: event.target.value,
                          };
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            fieldMappings: newMappings,
                          }));
                        }}
                        className="h-8 text-sm"
                        placeholder="e.g. x"
                        disabled={isRunning}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMappings = (config.fieldMappings || []).filter(
                          (_, i) => i !== index
                        );
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          fieldMappings: newMappings,
                        }));
                      }}
                      className="h-8 w-8 p-0 text-red-600"
                      disabled={isRunning}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMappings = [
                      ...(config.fieldMappings || []),
                      { source: "", target: "" },
                    ];
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      fieldMappings: newMappings,
                    }));
                  }}
                  className="w-full h-8 text-xs"
                  disabled={isRunning}
                >
                  + Add Mapping
                </Button>
              </div>
            )}

            {config.operation === "mathOp" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.mathField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        mathField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. position.x"
                    disabled={isRunning}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Operator</Label>
                    <Select
                      value={config.mathOperator || "+"}
                      onValueChange={(value) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          mathOperator: value as any,
                        }))
                      }
                      disabled={isRunning}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+">Add (+)</SelectItem>
                        <SelectItem value="-">Subtract (-)</SelectItem>
                        <SelectItem value="*">Multiply (*)</SelectItem>
                        <SelectItem value="/">Divide (/)</SelectItem>
                        <SelectItem value="%">Modulo (%)</SelectItem>
                        <SelectItem value="pow">Power (^)</SelectItem>
                        <SelectItem value="sqrt">Square Root</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Value</Label>
                    <Input
                      type="number"
                      value={config.mathValue || 0}
                      onChange={(event) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          mathValue: Number(event.target.value) || 0,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Output Field (optional)
                  </Label>
                  <Input
                    value={config.mathOutputField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        mathOutputField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="Default: same as input"
                    disabled={isRunning}
                  />
                </div>
              </>
            )}

            {config.operation === "stringTransform" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.stringField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        stringField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. message"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Transform Type
                  </Label>
                  <Select
                    value={config.stringTransformType || "uppercase"}
                    onValueChange={(value) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        stringTransformType: value as any,
                      }))
                    }
                    disabled={isRunning}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uppercase">Uppercase</SelectItem>
                      <SelectItem value="lowercase">Lowercase</SelectItem>
                      <SelectItem value="trim">Trim Whitespace</SelectItem>
                      <SelectItem value="substring">Substring</SelectItem>
                      <SelectItem value="replace">Replace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {config.stringTransformType === "substring" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Start</Label>
                      <Input
                        type="number"
                        value={config.substringStart || 0}
                        onChange={(event) =>
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            substringStart: Number(event.target.value) || 0,
                          }))
                        }
                        className="h-9 text-sm"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">End (opt)</Label>
                      <Input
                        type="number"
                        value={config.substringEnd || ""}
                        onChange={(event) =>
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            substringEnd: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9 text-sm"
                        disabled={isRunning}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {config.operation === "jsonPath" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">JSON Path</Label>
                  <Input
                    value={config.jsonPathExpression || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        jsonPathExpression: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. data.sensor.temperature"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Output Field</Label>
                  <Input
                    value={config.jsonPathField || "extracted"}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        jsonPathField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>
              </>
            )}

            {/* Statistical Operations */}
            {["movingAverage", "stdDev", "minMax", "outlierDetection"].includes(
              config.operation
            ) && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.statisticalField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        statisticalField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. velocity"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Window Size</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.statisticalWindow || 10}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        statisticalWindow: Number(event.target.value) || 10,
                      }))
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>
                {config.operation === "outlierDetection" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">
                      Std Dev Threshold
                    </Label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={config.stdDevThreshold || 2}
                      onChange={(event) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          stdDevThreshold: Number(event.target.value) || 2,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                )}
              </>
            )}

            {config.operation === "rateOfChange" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Field</Label>
                <Input
                  value={config.statisticalField || ""}
                  onChange={(event) =>
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      statisticalField: event.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  placeholder="e.g. position"
                  disabled={isRunning}
                />
              </div>
            )}

            {/* ROS-Specific Operations */}
            {config.operation === "coordinateTransform" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Source Frame</Label>
                  <Input
                    value={config.sourceFrame || "base_link"}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        sourceFrame: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Target Frame</Label>
                  <Input
                    value={config.targetFrame || "map"}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        targetFrame: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>
              </div>
            )}

            {config.operation === "messageSplit" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Array Field</Label>
                <Input
                  value={config.splitArrayField || ""}
                  onChange={(event) =>
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      splitArrayField: event.target.value,
                    }))
                  }
                  className="h-9 text-sm"
                  placeholder="e.g. points"
                  disabled={isRunning}
                />
              </div>
            )}

            {config.operation === "messageMerge" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">
                  Time Window (ms)
                </Label>
                <Input
                  type="number"
                  min={100}
                  value={config.mergeTimeWindow || 1000}
                  onChange={(event) =>
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      mergeTimeWindow: Number(event.target.value) || 1000,
                    }))
                  }
                  className="h-9 text-sm"
                  disabled={isRunning}
                />
              </div>
            )}

            {config.operation === "timestampValidation" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Timestamp Field (optional)
                  </Label>
                  <Input
                    value={config.timestampField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        timestampField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="Auto-detect common fields"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Max Age (ms)</Label>
                  <Input
                    type="number"
                    min={100}
                    value={config.maxAge || 5000}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        maxAge: Number(event.target.value) || 5000,
                      }))
                    }
                    className="h-9 text-sm"
                    disabled={isRunning}
                  />
                </div>
              </>
            )}

            {/* Advanced Filters */}
            {config.operation === "rangeFilter" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.rangeField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        rangeField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. temperature"
                    disabled={isRunning}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Min</Label>
                    <Input
                      type="number"
                      value={config.rangeMin ?? ""}
                      onChange={(event) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          rangeMin: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Max</Label>
                    <Input
                      type="number"
                      value={config.rangeMax ?? ""}
                      onChange={(event) =>
                        updateProcessConfig(id, (prev) => ({
                          ...prev,
                          rangeMax: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        }))
                      }
                      className="h-9 text-sm"
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </>
            )}

            {config.operation === "regexFilter" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input
                    value={config.regexField || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        regexField: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. message"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Regex Pattern</Label>
                  <Input
                    value={config.regexPattern || ""}
                    onChange={(event) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        regexPattern: event.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. ^[A-Z]+"
                    disabled={isRunning}
                  />
                </div>
              </>
            )}

            {config.operation === "multiCondition" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">Conditions</Label>
                  <Select
                    value={config.conditionOperator || "AND"}
                    onValueChange={(value) =>
                      updateProcessConfig(id, (prev) => ({
                        ...prev,
                        conditionOperator: value as any,
                      }))
                    }
                    disabled={isRunning}
                  >
                    <SelectTrigger className="h-7 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(config.multiConditions || []).map((condition, index) => (
                  <div
                    key={index}
                    className="border rounded p-2 space-y-2 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-gray-600">
                        Condition {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newConditions = (
                            config.multiConditions || []
                          ).filter((_, i) => i !== index);
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            multiConditions: newConditions,
                          }));
                        }}
                        className="h-6 w-6 p-0 text-red-600"
                        disabled={isRunning}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Field</Label>
                      <Input
                        value={condition.field}
                        onChange={(event) => {
                          const newConditions = [
                            ...(config.multiConditions || []),
                          ];
                          newConditions[index] = {
                            ...newConditions[index],
                            field: event.target.value,
                          };
                          updateProcessConfig(id, (prev) => ({
                            ...prev,
                            multiConditions: newConditions,
                          }));
                        }}
                        className="h-7 text-xs"
                        placeholder="e.g. temperature"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500">
                          Operator
                        </Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => {
                            const newConditions = [
                              ...(config.multiConditions || []),
                            ];
                            newConditions[index] = {
                              ...newConditions[index],
                              operator: value as any,
                            };
                            updateProcessConfig(id, (prev) => ({
                              ...prev,
                              multiConditions: newConditions,
                            }));
                          }}
                          disabled={isRunning}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value="!=">!=</SelectItem>
                            <SelectItem value=">">&gt;</SelectItem>
                            <SelectItem value="<">&lt;</SelectItem>
                            <SelectItem value=">=">&gt;=</SelectItem>
                            <SelectItem value="<=">&lt;=</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500">
                          Value
                        </Label>
                        <Input
                          value={condition.value}
                          onChange={(event) => {
                            const newConditions = [
                              ...(config.multiConditions || []),
                            ];
                            newConditions[index] = {
                              ...newConditions[index],
                              value: event.target.value,
                            };
                            updateProcessConfig(id, (prev) => ({
                              ...prev,
                              multiConditions: newConditions,
                            }));
                          }}
                          className="h-7 text-xs"
                          disabled={isRunning}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newConditions = [
                      ...(config.multiConditions || []),
                      { field: "", operator: "=" as any, value: "" },
                    ];
                    updateProcessConfig(id, (prev) => ({
                      ...prev,
                      multiConditions: newConditions,
                    }));
                  }}
                  className="w-full h-8 text-xs"
                  disabled={isRunning}
                >
                  + Add Condition
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-gray-600 pt-2 border-t">
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
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-1"
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
              <p className="text-xs text-gray-600">Before/After Processing</p>
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
                    <div className="flex justify-between items-center mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          msg.type === "process-before"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {msg.type === "process-before" ? "Before" : "After"}
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

          <TabsContent value="analytics" className="space-y-3 mt-0">
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Messages"
                value={data.stats.messageCount}
                icon={<Activity className="h-4 w-4" />}
                color="purple"
              />
              <StatCard
                label="Throughput"
                value={data.stats.throughput.toFixed(1)}
                unit="msg/s"
                icon={<TrendingUp className="h-4 w-4" />}
                color="blue"
              />
            </div>

            {numericData.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Value Trend</Label>
                  <div className="bg-gray-50 rounded p-3 flex justify-center">
                    <Sparkline
                      data={numericData}
                      width={280}
                      height={60}
                      showDots
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Distribution</Label>
                  <div className="bg-gray-50 rounded p-3 flex justify-center">
                    <DataDistribution
                      values={numericData}
                      width={280}
                      height={60}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-purple-50 rounded p-2 text-center">
                    <div className="text-[10px] text-purple-600 font-semibold">
                      MIN
                    </div>
                    <div className="text-sm font-bold text-purple-900">
                      {Math.min(...numericData).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded p-2 text-center">
                    <div className="text-[10px] text-blue-600 font-semibold">
                      AVG
                    </div>
                    <div className="text-sm font-bold text-blue-900">
                      {(
                        numericData.reduce((a, b) => a + b, 0) /
                        numericData.length
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded p-2 text-center">
                    <div className="text-[10px] text-green-600 font-semibold">
                      MAX
                    </div>
                    <div className="text-sm font-bold text-green-900">
                      {Math.max(...numericData).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {numericData.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8">
                No numeric data to analyze yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Configuration Status
              </Label>

              {config.operation === "passThrough" && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700">
                  ✓ Pass-through mode active
                </div>
              )}

              {config.operation === "filter" && !config.filterField && (
                <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                  ⚠ Filter field not configured
                </div>
              )}

              {config.operation === "mathOp" && !config.mathField && (
                <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                  ⚠ Math field not configured
                </div>
              )}

              {config.operation === "stringTransform" &&
                !config.stringField && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                    ⚠ String field not configured
                  </div>
                )}

              {(config.operation === "movingAverage" ||
                config.operation === "stdDev" ||
                config.operation === "minMax" ||
                config.operation === "rateOfChange" ||
                config.operation === "outlierDetection") &&
                !config.statisticalField && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                    ⚠ Statistical field not configured
                  </div>
                )}

              {data.stats.messageCount === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                  ℹ No messages processed yet
                </div>
              )}

              {data.stats.messageCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700">
                  ✓ Processing {data.stats.messageCount} messages successfully
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Node Health</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {data.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Running:</span>
                  <span
                    className={isRunning ? "text-green-600" : "text-gray-400"}
                  >
                    {isRunning ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="text-gray-500">
                    {data.stats.lastUpdated
                      ? new Date(data.stats.lastUpdated).toLocaleTimeString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
