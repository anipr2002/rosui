/**
 * Subscription tier utilities
 */

export type SubscriptionTier = "free" | "pro" | "team";

export interface StorageQuota {
  bytes: number;
  displayName: string;
}

const STORAGE_QUOTAS: Record<SubscriptionTier, StorageQuota> = {
  free: {
    bytes: 0,
    displayName: "No Storage",
  },
  pro: {
    bytes: 50 * 1024 * 1024 * 1024, // 50GB
    displayName: "50 GB",
  },
  team: {
    bytes: 500 * 1024 * 1024 * 1024, // 500GB
    displayName: "500 GB",
  },
};

/**
 * Get storage quota for a subscription tier
 */
export function getStorageQuota(tier: SubscriptionTier): StorageQuota {
  return STORAGE_QUOTAS[tier];
}

/**
 * Check if a subscription tier allows storage
 */
export function canAccessStorage(tier: SubscriptionTier): boolean {
  return tier !== "free";
}

/**
 * Get appropriate upgrade message for a tier
 */
export function getUpgradeMessage(tier: SubscriptionTier): string {
  switch (tier) {
    case "free":
      return "Upgrade to Pro or Team to access cloud storage for your rosbag files.";
    case "pro":
      return "Upgrade to Team for 500GB storage and collaboration features.";
    case "team":
      return "You have the maximum storage tier.";
  }
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "team":
      return "Team";
  }
}

/**
 * Get tier badge color for UI
 */
export function getTierBadgeColor(tier: SubscriptionTier): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case "free":
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
      };
    case "pro":
      return {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        border: "border-indigo-200",
      };
    case "team":
      return {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-200",
      };
  }
}

/**
 * Calculate storage usage percentage
 */
export function calculateStoragePercentage(used: number, quota: number): number {
  if (quota === 0) return 0;
  return Math.min((used / quota) * 100, 100);
}

/**
 * Get storage warning level
 */
export function getStorageWarningLevel(
  percentageUsed: number
): "normal" | "warning" | "critical" {
  if (percentageUsed >= 95) return "critical";
  if (percentageUsed >= 80) return "warning";
  return "normal";
}

/**
 * Get storage progress bar color based on usage
 */
export function getStorageProgressColor(percentageUsed: number): string {
  const level = getStorageWarningLevel(percentageUsed);
  switch (level) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    default:
      return "bg-indigo-500";
  }
}
