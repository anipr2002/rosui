"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Database, FileArchive, Loader2 } from "lucide-react";
import { usePanelsStore } from "@/store/panels-store";
import { cn } from "@/lib/utils";

export function RecentFilesCard() {
  const recentFiles = useQuery(api.rosbagFiles.listRecent, { limit: 5 });
  const { loadFileFromUrl, isLoading: fileLoading } = usePanelsStore();

  const handleLoadFile = async (file: any) => {
    try {
      await loadFileFromUrl(file.s3Url, file.fileName, file.s3Key);
    } catch (error) {
      console.error("Failed to load file:", error);
    }
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-blue-200">
      <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Database className="h-5 w-5 mt-0.5 text-blue-600" />
          <div>
            <CardTitle className="text-base text-blue-900">
              Recent Files
            </CardTitle>
            <CardDescription className="text-xs text-blue-700">
              Quickly access your recently uploaded or analyzed rosbag files
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {recentFiles === undefined ? (
          // Loading state
          <div className="space-y-2 mt-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4"></div>
          </div>
        ) : recentFiles.length === 0 ? (
          // Empty state
          <p className="text-sm text-gray-500 mt-4">No files uploaded yet</p>
        ) : (
          // File list
          <div className="space-y-2 mt-4">
            {recentFiles.map((file) => {
              const uploadDate = new Date(file.uploadedAt).toLocaleDateString();

              return (
                <button
                  key={file._id}
                  onClick={() => handleLoadFile(file)}
                  disabled={fileLoading}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left",
                    "hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {fileLoading ? (
                    <Loader2 className="h-4 w-4 text-blue-600 flex-shrink-0 animate-spin" />
                  ) : (
                    <FileArchive className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uploadDate}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
