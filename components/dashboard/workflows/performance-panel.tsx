"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Activity, TrendingUp } from "lucide-react";
import type { WorkflowNode } from "./types";

interface PerformancePanelProps {
  nodes: WorkflowNode[];
  isRunning: boolean;
}

export function PerformancePanel({ nodes, isRunning }: PerformancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalMessages = nodes.reduce(
    (sum, node) => sum + node.data.stats.messageCount,
    0
  );
  const avgThroughput =
    nodes.length > 0
      ? nodes.reduce((sum, node) => sum + node.data.stats.throughput, 0) /
        nodes.length
      : 0;
  const activeNodes = nodes.filter(
    (node) => node.data.status === "active"
  ).length;
  const errorNodes = nodes.filter(
    (node) => node.data.status === "error"
  ).length;

  return (
    <Card className="shadow-none rounded-xl border border-teal-200 py-0  rounded-t-xl">
      <CardHeader className="bg-teal-50 border-b border-teal-100 px-6 py-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <div>
              <h3 className="text-base font-semibold text-teal-900">
                Performance Analytics
              </h3>
              <p className="text-xs text-teal-800">
                Real-time pipeline metrics
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-teal-700 hover:text-teal-900 hover:bg-teal-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">
                Total Messages
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {totalMessages.toLocaleString()}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1">
                Avg Throughput
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {avgThroughput.toFixed(1)}
                <span className="text-sm ml-1">msg/s</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1">
                Active Nodes
              </div>
              <div className="text-2xl font-bold text-green-900">
                {activeNodes} / {nodes.length}
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-xs text-red-700 font-medium mb-1">
                Error Nodes
              </div>
              <div className="text-2xl font-bold text-red-900">
                {errorNodes}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Per-Node Breakdown
              </h4>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {nodes.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No nodes in pipeline
                </div>
              ) : (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className="bg-gray-50 rounded p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            node.data.nodeType === "input"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : node.data.nodeType === "process"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {node.data.nodeType}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {node.data.label}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          node.data.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : node.data.status === "error"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {node.data.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Messages:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {node.data.stats.messageCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Throughput:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {node.data.stats.throughput.toFixed(2)} msg/s
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Updated:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {node.data.stats.lastUpdated
                            ? new Date(
                                node.data.stats.lastUpdated
                              ).toLocaleTimeString()
                            : "idle"}
                        </span>
                      </div>
                    </div>

                    {node.data.stats.messageCount > 0 && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              node.data.nodeType === "input"
                                ? "bg-blue-500"
                                : node.data.nodeType === "process"
                                  ? "bg-purple-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min((node.data.stats.messageCount / totalMessages) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
