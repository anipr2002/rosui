"use client";

import { useStorageQuota } from "@/hooks/use-storage-quota";
import {
  getStorageProgressColor,
  getStorageWarningLevel,
  getTierBadgeColor,
  getTierDisplayName,
} from "@/lib/subscription-utils";
import { formatFileSize } from "@/lib/rosbag/rosbag-upload";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function StorageQuotaDisplay() {
  const { storageInfo, isLoading } = useStorageQuota();

  if (isLoading || !storageInfo) {
    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden animate-pulse">
        <div className="h-full bg-gray-300 w-1/3" />
      </div>
    );
  }

  const { tier, quota, used, remaining, percentageUsed } = storageInfo;
  const warningLevel = getStorageWarningLevel(percentageUsed);
  const progressColor = getStorageProgressColor(percentageUsed);
  const tierColors = getTierBadgeColor(tier);

  // Free tier - show upgrade prompt
  if (tier === "free") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Storage Access
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${tierColors.bg} ${tierColors.text} ${tierColors.border} border`}
          >
            {getTierDisplayName(tier)}
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              No Storage Available
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Upgrade to Pro or Team to store rosbag files in the cloud.
            </p>
            <Link href="/pricing">
              <Button
                size="sm"
                className="bg-amber-200 border-amber-500 border-1 text-amber-500 hover:bg-amber-500 hover:text-white mt-3 text-xs"
              >
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-300`}
          style={{ width: `${percentageUsed}%` }}
        />
      </div>

      {/* Usage Display */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-gray-900">
          {formatFileSize(used)} / {formatFileSize(quota)}
        </span>
        <span
          className={`text-sm font-semibold ${
            warningLevel === "critical"
              ? "text-red-600"
              : warningLevel === "warning"
                ? "text-amber-600"
                : "text-indigo-600"
          }`}
        >
          {percentageUsed.toFixed(1)}%
        </span>
      </div>

      {/* Warning Messages */}
      {warningLevel === "critical" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Storage almost full! Delete files or upgrade to continue uploading.
          </p>
        </div>
      )}

      {warningLevel === "warning" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Storage is {percentageUsed.toFixed(0)}% full. Consider managing your
            files.
          </p>
        </div>
      )}
    </div>
  );
}
