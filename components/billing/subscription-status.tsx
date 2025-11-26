"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, Users, HardDrive, Layout, Workflow } from "lucide-react";
import { ManageSubscriptionButton } from "./manage-subscription-button";

const TIER_CONFIG = {
  free: {
    label: "Free",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Zap,
    headerBg: "bg-gray-50",
    headerBorder: "border-gray-200",
  },
  pro: {
    label: "Pro",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Crown,
    headerBg: "bg-blue-50",
    headerBorder: "border-blue-200",
  },
  team: {
    label: "Team",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Users,
    headerBg: "bg-green-50",
    headerBorder: "border-green-200",
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function SubscriptionStatus() {
  const storageInfo = useQuery(api.users.getUserStorageInfo);
  const limitsInfo = useQuery(api.users.getUserLimitsInfo);

  if (!storageInfo || !limitsInfo) {
    return (
      <Card className="shadow-none rounded-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierConfig = TIER_CONFIG[storageInfo.tier];
  const TierIcon = tierConfig.icon;

  const storagePercent =
    storageInfo.quota > 0 ? (storageInfo.used / storageInfo.quota) * 100 : 0;

  const layoutPercent =
    limitsInfo.layouts.limit === Infinity
      ? 0
      : (limitsInfo.layouts.current / limitsInfo.layouts.limit) * 100;

  const workflowPercent =
    limitsInfo.workflows.limit === Infinity
      ? 0
      : (limitsInfo.workflows.current / limitsInfo.workflows.limit) * 100;

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader
        className={`${tierConfig.headerBg} ${tierConfig.headerBorder} border-b rounded-t-xl pt-6`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TierIcon className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription className="text-xs">
                Your current plan and usage
              </CardDescription>
            </div>
          </div>
          <Badge className={tierConfig.color}>{tierConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Storage</span>
            </div>
            <span className="text-gray-600">
              {formatBytes(storageInfo.used)} /{" "}
              {storageInfo.quota > 0 ? formatBytes(storageInfo.quota) : "N/A"}
            </span>
          </div>
          {storageInfo.quota > 0 ? (
            <Progress value={storagePercent} className="h-2" />
          ) : (
            <p className="text-xs text-gray-500">
              Upgrade to Pro or Team for storage access
            </p>
          )}
        </div>

        {/* Layout Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Layouts</span>
            </div>
            <span className="text-gray-600">
              {limitsInfo.layouts.current} /{" "}
              {limitsInfo.layouts.limit === Infinity
                ? "∞"
                : limitsInfo.layouts.limit}
            </span>
          </div>
          {limitsInfo.layouts.limit !== Infinity && (
            <Progress value={layoutPercent} className="h-2" />
          )}
        </div>

        {/* Workflow Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Workflows</span>
            </div>
            <span className="text-gray-600">
              {limitsInfo.workflows.current} /{" "}
              {limitsInfo.workflows.limit === Infinity
                ? "∞"
                : limitsInfo.workflows.limit}
              <span className="text-xs text-gray-400 ml-1">/month</span>
            </span>
          </div>
          {limitsInfo.workflows.limit !== Infinity && (
            <>
              <Progress value={workflowPercent} className="h-2" />
              <p className="text-xs text-gray-500">
                Resets{" "}
                {new Date(limitsInfo.workflows.resetsAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>

        {/* Manage Button */}
        {storageInfo.tier !== "free" && (
          <div className="pt-2">
            <ManageSubscriptionButton className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
