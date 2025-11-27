"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Lock, Sparkles, Eye, Loader2, FileArchive, Calendar, HardDrive } from "lucide-react";
import { useStorageQuota } from "@/hooks/use-storage-quota";
import { usePanelsStore } from "@/store/panels-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/rosbag/rosbag-upload";
import { cn } from "@/lib/utils";

export function S3FilesCard() {
  const { storageInfo } = useStorageQuota();
  const s3Files = useQuery(api.rosbagFiles.listRecent, { limit: 10 });
  const { loadFileFromUrl, isLoading: fileLoading } = usePanelsStore();
  const router = useRouter();
  const [visualizingId, setVisualizingId] = React.useState<string | null>(null);

  const isProUser = storageInfo?.tier === "pro" || storageInfo?.tier === "team";

  const handleVisualize = async (file: any) => {
    setVisualizingId(file._id);
    try {
      await loadFileFromUrl(file.s3Url, file.fileName, file.s3Key);
      router.push("/dashboard/rosbag/panels");
    } catch (error) {
      console.error("Failed to load file:", error);
      toast.error("Failed to load file for visualization");
      setVisualizingId(null);
    }
  };

  const handleUpgrade = () => {
    router.push("/dashboard/settings/billing");
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-indigo-200 relative overflow-hidden">
      <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Cloud className="h-5 w-5 mt-0.5 text-indigo-600" />
          <div>
            <CardTitle className="text-base text-indigo-900">
              Cloud Storage (S3)
            </CardTitle>
            <CardDescription className="text-xs text-indigo-700">
              {isProUser 
                ? "Access your rosbag files from cloud storage"
                : "Upgrade to Pro to access cloud storage files"}
            </CardDescription>
          </div>
          {!isProUser && (
            <Lock className="h-5 w-5 mt-0.5 text-indigo-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 relative">
        {!isProUser ? (
          // Locked state for free users
          <div className="space-y-4">
            {/* Blurred preview */}
            <div className="relative">
              <div className="space-y-2 blur-sm pointer-events-none select-none">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <FileArchive className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
              
              {/* Upgrade overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                <div className="text-center space-y-3 px-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100">
                    <Lock className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Pro Feature</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Access cloud storage files
                    </p>
                  </div>
                  <Button
                    onClick={handleUpgrade}
                    className="bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                    size="sm"
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // File list for pro/team users
          <div className="space-y-2">
            {s3Files === undefined ? (
              // Loading state
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : s3Files.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Cloud className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No files in cloud storage yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload files to get started</p>
              </div>
            ) : (
              // File list
              s3Files.map((file) => {
                const uploadDate = new Date(file.uploadedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isVisualizing = visualizingId === file._id;

                return (
                  <div
                    key={file._id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      "border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200"
                    )}
                  >
                    <FileArchive className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(file.fileSize)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {uploadDate}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVisualize(file)}
                      disabled={isVisualizing || fileLoading}
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex-shrink-0"
                    >
                      {isVisualizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Visualize</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
