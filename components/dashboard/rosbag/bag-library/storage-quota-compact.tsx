"use client";

import { useStorageQuota } from "@/hooks/use-storage-quota";
import {
  getStorageProgressColor,
  getStorageWarningLevel,
  getTierBadgeColor,
  getTierDisplayName,
} from "@/lib/subscription-utils";
import { formatFileSize } from "@/lib/rosbag/rosbag-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import Link from "next/link";

export function StorageQuotaCompact() {
  const { storageInfo, isLoading } = useStorageQuota();

  if (isLoading || !storageInfo) {
    return (
      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden animate-pulse">
        <div className="h-full bg-gray-200 w-1/3" />
      </div>
    );
  }

  const { tier, quota, used, percentageUsed } = storageInfo;
  const warningLevel = getStorageWarningLevel(percentageUsed);
  const progressColor = getStorageProgressColor(percentageUsed);
  const tierColors = getTierBadgeColor(tier);

  if (tier === "free") {
    return (
      <Link href="/pricing">
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-gray-50 transition-colors"
        >
          Upgrade Storage
        </Badge>
      </Link>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 cursor-help">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>{percentageUsed.toFixed(0)}% used</span>
              </div>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-300`}
                  style={{ width: `${percentageUsed}%` }}
                />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold text-xs">Storage Usage</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(used)} of {formatFileSize(quota)} used
            </p>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Plan:</span>
              <Badge
                className={`${tierColors.bg} ${tierColors.text} ${tierColors.border} border text-[10px] px-1.5 py-0`}
              >
                {getTierDisplayName(tier)}
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
