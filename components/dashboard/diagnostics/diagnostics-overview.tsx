"use client";

import React from "react";
import { useRosStore, ConnectionStatus } from "@/store/ros-store";
import { useDiagnosticsStore } from "@/store/diagnostics-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
} from "lucide-react";

export function DiagnosticsOverview() {
  const { status: connectionStatus } = useRosStore();
  const { nodes, subscribedTopics, getActiveTopics } = useDiagnosticsStore();

  const activeTopics = getActiveTopics();
  const nodeCount = nodes.size;
  const subscribedCount = subscribedTopics.size;

  // Count nodes by status level
  const statusCounts = {
    ok: 0,
    warn: 0,
    error: 0,
    stale: 0,
  };

  nodes.forEach((node) => {
    if (node.level === 0) statusCounts.ok++;
    else if (node.level === 1) statusCounts.warn++;
    else if (node.level === 2) statusCounts.error++;
    else if (node.level === 3) statusCounts.stale++;
  });

  const getConnectionColors = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          border: "border-green-300",
          headerBg: "bg-green-50",
          headerText: "text-green-900",
          descriptionText: "text-green-800",
          iconColor: "text-green-600",
        };
      case "connecting":
        return {
          border: "border-amber-300",
          headerBg: "bg-amber-50",
          headerText: "text-amber-900",
          descriptionText: "text-amber-800",
          iconColor: "text-amber-600",
        };
      case "error":
        return {
          border: "border-red-300",
          headerBg: "bg-red-50",
          headerText: "text-red-900",
          descriptionText: "text-red-800",
          iconColor: "text-red-600",
        };
      default:
        return {
          border: "border-gray-200",
          headerBg: "bg-gray-50",
          headerText: "text-gray-900",
          descriptionText: "text-gray-700",
          iconColor: "text-gray-400",
        };
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
        );
      case "connecting":
        return (
          <Circle className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0 animate-spin" />
        );
      case "error":
        return (
          <XCircle className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0" />
        );
      default:
        return (
          <Circle className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
        );
    }
  };

  const getConnectionLabel = (): string => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const colors = getConnectionColors();
  const tooltipColor =
    connectionStatus === "connected"
      ? "green"
      : connectionStatus === "connecting"
      ? "amber"
      : connectionStatus === "error"
      ? "red"
      : "gray";

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${colors.border}`}>
      <CardHeader
        className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}
      >
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Activity
              className={`h-5 w-5 mt-0.5 ${colors.iconColor} flex-shrink-0`}
            />
            <div className="min-w-0 overflow-hidden space-y-1">
              <CardTitle
                className={`text-sm sm:text-base ${colors.headerText}`}
              >
                Diagnostics Overview
              </CardTitle>
              <CardDescription className={`text-xs ${colors.descriptionText}`}>
                System health monitoring and diagnostics
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {connectionStatus === "connected" ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    {getConnectionLabel()}
                  </div>
                </Badge>
              ) : connectionStatus === "connecting" ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs">
                  {getConnectionLabel()}
                </Badge>
              ) : connectionStatus === "error" ? (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
                  {getConnectionLabel()}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 text-xs">
                  {getConnectionLabel()}
                </Badge>
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Connection</div>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className={`text-sm font-medium ${colors.headerText}`}>
                {getConnectionLabel()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">
              Active Topics
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {subscribedCount} / {activeTopics.length}
            </div>
            <div className="text-xs text-gray-500">
              {activeTopics.length - subscribedCount === 0
                ? "All subscribed"
                : `${activeTopics.length - subscribedCount} pending`}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">
              Nodes Monitored
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {nodeCount}
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{statusCounts.ok} OK</span>
              {statusCounts.warn > 0 && (
                <span className="text-amber-600">{statusCounts.warn} WARN</span>
              )}
              {statusCounts.error > 0 && (
                <span className="text-red-600">{statusCounts.error} ERROR</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Alerts</div>
            <div className="flex flex-col gap-1">
              {statusCounts.error > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  <span className="font-semibold text-red-600">
                    {statusCounts.error} Error
                    {statusCounts.error !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {statusCounts.warn > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="font-semibold text-amber-600">
                    {statusCounts.warn} Warning
                    {statusCounts.warn !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {statusCounts.error === 0 && statusCounts.warn === 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-gray-600">No alerts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
