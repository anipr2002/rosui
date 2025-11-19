"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadRosbagToS3, validateRosbagFile } from "@/lib/rosbag/rosbag-upload";
import { useStorageQuota } from "@/hooks/use-storage-quota";
import { formatFileSize } from "@/lib/rosbag/rosbag-upload";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: Array<{ _id: string; name: string }>;
}

export function UploadDialog({ open, onOpenChange, projects = [] }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const { storageInfo, canUploadFile } = useStorageQuota();
  const createFile = useMutation(api.rosbagFiles.create);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateRosbagFile(selectedFile);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Check storage quota
    if (!canUploadFile(file.size)) {
      toast.error("Insufficient storage space for this file");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload to S3
      const result = await uploadRosbagToS3({
        file,
        metadata: {
          duration: 0, // Will be updated after parsing
          messageCount: 0,
          topics: [],
        },
        projectId: projectId || undefined,
        saveToOrganization: saveToOrg,
        onProgress: setProgress,
      });

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Create Convex record
      await createFile({
        fileName: file.name,
        fileSize: file.size,
        s3Key: result.s3Key!,
        s3Url: result.s3Url!,
        projectId: projectId ? (projectId as Id<"projects">) : undefined,
        saveToOrganization: saveToOrg,
        metadata: result.metadata!,
      });

      setUploadComplete(true);
      toast.success("File uploaded successfully!");

      // Reset after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProjectId("");
    setSaveToOrg(false);
    setUploading(false);
    setProgress(0);
    setUploadComplete(false);
    onOpenChange(false);
  };

  const isTeamUser = storageInfo?.tier === "team";
  const canUpload = file && !uploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Rosbag File</DialogTitle>
          <DialogDescription>
            Upload a .mcap rosbag file to cloud storage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Picker */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              Select MCAP File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".mcap"
              onChange={handleFileSelect}
              disabled={uploading}
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              Only .mcap rosbag files are supported
            </p>
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Project Selection */}
          {file && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium">
                Project (Optional)
              </Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={uploading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="None (Individual File)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Individual File)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team Storage Toggle */}
          {file && isTeamUser && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="org-storage" className="text-sm font-medium">
                  Save to organization storage
                </Label>
                <p className="text-xs text-gray-500">
                  Share with your team members
                </p>
              </div>
              <Switch
                id="org-storage"
                checked={saveToOrg}
                onCheckedChange={setSaveToOrg}
                disabled={uploading}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          )}

          {/* Storage Warning */}
          {file && storageInfo && (
            <StorageWarning fileSize={file.size} storageInfo={storageInfo} />
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-600 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Success State */}
          {uploadComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Upload Complete!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your file has been saved to cloud storage
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!canUpload}
              className="bg-green-500 hover:bg-green-600 text-white flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload to S3
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StorageWarning({
  fileSize,
  storageInfo,
}: {
  fileSize: number;
  storageInfo: any;
}) {
  const remaining = storageInfo.remaining;
  const percentAfterUpload =
    ((storageInfo.used + fileSize) / storageInfo.quota) * 100;

  if (fileSize > remaining) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-red-700">
          File size exceeds available storage. Available:{" "}
          {formatFileSize(remaining)}
        </p>
      </div>
    );
  }

  if (percentAfterUpload >= 95) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          This upload will use {percentAfterUpload.toFixed(0)}% of your storage
        </p>
      </div>
    );
  }

  return null;
}
