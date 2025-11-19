import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface StorageQuotaInfo {
  tier: "free" | "pro" | "team";
  quota: number;
  used: number;
  remaining: number;
  percentageUsed: number;
  canUpload: boolean;
}

/**
 * Hook to get user's storage quota information
 */
export function useStorageQuota() {
  const storageInfo = useQuery(api.users.getUserStorageInfo);

  const canUploadFile = (fileSize: number): boolean => {
    if (!storageInfo) return false;
    return storageInfo.remaining >= fileSize;
  };

  const getRemainingStorage = (): number => {
    return storageInfo?.remaining ?? 0;
  };

  const getUsedPercentage = (): number => {
    return storageInfo?.percentageUsed ?? 0;
  };

  return {
    storageInfo,
    canUploadFile,
    getRemainingStorage,
    getUsedPercentage,
    isLoading: storageInfo === undefined,
  };
}
