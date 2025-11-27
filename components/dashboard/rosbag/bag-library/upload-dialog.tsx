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
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadRosbagToS3, validateRosbagFile } from "@/lib/rosbag/rosbag-upload";
import { useStorageQuota } from "@/hooks/use-storage-quota";
import { formatFileSize } from "@/lib/rosbag/rosbag-upload";
import { FileUpload } from "@/components/ui/file-upload";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: Array<{ _id: string; name: string }>;
}

export function UploadDialog({ open, onOpenChange, projects = [] }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    successful: number;
    failed: number;
    failedFiles: string[];
  }>({ successful: 0, failed: 0, failedFiles: [] });

  const { storageInfo, canUploadFile } = useStorageQuota();
  const createFile = useMutation(api.rosbagFiles.create);

  const isProUser = storageInfo?.tier === "pro" || storageInfo?.tier === "team";
  const isTeamUser = storageInfo?.tier === "team";

  const handleFilesSelect = (selectedFiles: File[]) => {
    // Check if user is pro for multiple files
    if (selectedFiles.length > 1 && !isProUser) {
      toast.error("Multiple file upload is available for Pro and Team users. Upgrade to upload multiple files at once.");
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      const validation = validateRosbagFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check total size against remaining storage
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (!storageInfo) {
      toast.error("Unable to verify storage quota. Please try again.");
      return;
    }

    if (totalSize > storageInfo.remaining) {
      toast.error(
        `Selected files (${formatFileSize(totalSize)}) exceed available storage (${formatFileSize(storageInfo.remaining)}). Please remove some files or upgrade your plan.`
      );
      return;
    }

    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Final storage check
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!canUploadFile(totalSize)) {
      toast.error("Insufficient storage space for these files");
      return;
    }

    setUploading(true);
    setProgress(0);
    setCurrentFileIndex(0);
    setUploadResults({ successful: 0, failed: 0, failedFiles: [] });

    let successful = 0;
    let failed = 0;
    const failedFiles: string[] = [];

    try {
      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIndex(i);

        try {
          // Upload to S3
          const result = await uploadRosbagToS3({
            file,
            metadata: {
              duration: 0,
              messageCount: 0,
              topics: [],
            },
            projectId: projectId || undefined,
            saveToOrganization: saveToOrg,
            onProgress: (fileProgress) => {
              // Calculate overall progress
              const baseProgress = (i / files.length) * 100;
              const fileProgressContribution = (fileProgress / files.length);
              setProgress(Math.round(baseProgress + fileProgressContribution));
            },
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

          successful++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failed++;
          failedFiles.push(file.name);
        }
      }

      setUploadResults({ successful, failed, failedFiles });
      setUploadComplete(true);

      if (failed === 0) {
        toast.success(
          files.length === 1
            ? "File uploaded successfully!"
            : `All ${files.length} files uploaded successfully!`
        );
      } else if (successful === 0) {
        toast.error("All uploads failed. Please try again.");
      } else {
        toast.warning(`${successful} file(s) uploaded, ${failed} failed.`);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setProjectId("");
    setSaveToOrg(false);
    setUploading(false);
    setProgress(0);
    setCurrentFileIndex(0);
    setUploadComplete(false);
    setUploadResults({ successful: 0, failed: 0, failedFiles: [] });
    onOpenChange(false);
  };

  const canUpload = files.length > 0 && !uploading;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

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
          {/* File Upload with Drag & Drop */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select MCAP File{isProUser ? "(s)" : ""}
            </Label>
            <FileUpload
              onFilesSelect={handleFilesSelect}
              selectedFiles={files}
              accept=".mcap"
              disabled={uploading}
              helpText="Drag and drop or choose file to upload"
              multiple={isProUser}
            />
            <p className="text-xs text-gray-500">
              Only .mcap rosbag files are supported
              {!isProUser && " • Upgrade to Pro for multiple file uploads"}
            </p>
          </div>

          {/* Project Selection */}
          {files.length > 0 && projects.length > 0 && (
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
          {files.length > 0 && isTeamUser && (
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

          {/* Storage Info */}
          {files.length > 0 && storageInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium">
                Total size: {formatFileSize(totalSize)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Remaining after upload: {formatFileSize(storageInfo.remaining - totalSize)}
              </p>
            </div>
          )}

          {/* Storage Warning */}
          {files.length > 0 && storageInfo && (
            <StorageWarning fileSize={totalSize} storageInfo={storageInfo} />
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-600 text-center">
                Uploading {files.length > 1 ? `file ${currentFileIndex + 1} of ${files.length}` : "file"}... {progress}%
              </p>
              {files.length > 1 && (
                <p className="text-xs text-gray-500 text-center">
                  {files[currentFileIndex]?.name}
                </p>
              )}
            </div>
          )}

          {/* Success State */}
          {uploadComplete && (
            <div className={`border rounded-lg p-4 flex items-start gap-3 ${
              uploadResults.failed === 0 
                ? "bg-green-50 border-green-200" 
                : uploadResults.successful === 0 
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                uploadResults.failed === 0 
                  ? "text-green-600" 
                  : uploadResults.successful === 0 
                  ? "text-red-600"
                  : "text-amber-600"
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  uploadResults.failed === 0 
                    ? "text-green-900" 
                    : uploadResults.successful === 0 
                    ? "text-red-900"
                    : "text-amber-900"
                }`}>
                  {uploadResults.failed === 0 
                    ? "Upload Complete!" 
                    : uploadResults.successful === 0 
                    ? "Upload Failed"
                    : "Partial Upload Complete"}
                </p>
                <p className={`text-xs mt-1 ${
                  uploadResults.failed === 0 
                    ? "text-green-700" 
                    : uploadResults.successful === 0 
                    ? "text-red-700"
                    : "text-amber-700"
                }`}>
                  {uploadResults.successful > 0 && `${uploadResults.successful} file(s) uploaded successfully`}
                  {uploadResults.failed > 0 && uploadResults.successful > 0 && ", "}
                  {uploadResults.failed > 0 && `${uploadResults.failed} failed`}
                </p>
                {uploadResults.failedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-800">Failed files:</p>
                    <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                      {uploadResults.failedFiles.map((fileName, idx) => (
                        <li key={idx} className="truncate">• {fileName}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
              Upload {files.length > 1 ? `${files.length} Files` : "to S3"}
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
