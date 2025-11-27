"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileArchive,
  MoreVertical,
  FolderInput,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import { formatFileSize, deleteRosbagFile } from "@/lib/rosbag/rosbag-upload";
import { toast } from "sonner";
import { usePanelsStore } from "@/store/panels-store";

interface FileCardProps {
  file: {
    _id: Id<"rosbagFiles">;
    fileName: string;
    fileSize: number;
    uploadedAt: number;
    projectId?: Id<"projects">;
    organizationId?: Id<"organizations">;
    s3Url: string;
    s3Key: string;
  };
  project?: {
    _id: Id<"projects">;
    name: string;
    isShared?: boolean;
  };
  viewMode?: "grid" | "list";
  onMoveClick?: () => void;
}

export function FileCard({ file, project, viewMode = "grid", onMoveClick }: FileCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const deleteFile = useMutation(api.rosbagFiles.deleteFile);
  const router = useRouter();
  const { loadFileFromUrl } = usePanelsStore();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteRosbagFile(file.s3Key, async () => {
        await deleteFile({ fileId: file._id });
      });

      if (result.success) {
        toast.success("File deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    window.open(file.s3Url, "_blank");
  };

  const handleVisualize = async () => {
    setVisualizing(true);
    try {
      await loadFileFromUrl(file.s3Url, file.fileName, file.s3Key);
      // Navigate to panels page
      router.push("/dashboard/rosbag/panels");
    } catch (error) {
      console.error("Visualization error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load file for visualization"
      );
      setVisualizing(false);
    }
  };

  const uploadDate = new Date(file.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (viewMode === "list") {
    return (
      <Card className="shadow-none rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <FileArchive className="h-5 w-5 text-gray-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {file.fileName}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{uploadDate}</span>
              </div>
            </div>

            {project && (
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                {project.name}
              </Badge>
            )}

            {file.organizationId && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                <Users className="h-3 w-3 mr-1" />
                Team
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleVisualize}
              disabled={visualizing || deleting}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              {visualizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={deleting}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onMoveClick}>
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start">
          <FileArchive className="h-5 w-5 mt-0.5 text-gray-600" />
          <div className="min-w-0">
            <h4 className="text-sm text-gray-900 truncate font-medium">
              {file.fileName}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={deleting}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onMoveClick}>
                <FolderInput className="h-4 w-4 mr-2" />
                Move to Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <HardDrive className="h-3 w-3" />
          <span>{formatFileSize(file.fileSize)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>{uploadDate}</span>
        </div>

        {project && (
          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
            {project.name}
          </Badge>
        )}

        {file.organizationId && (
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
            <Users className="h-3 w-3 mr-1" />
            Team Storage
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleVisualize}
          disabled={visualizing || deleting}
          className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 mt-2"
        >
          {visualizing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Visualize
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
