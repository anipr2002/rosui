/**
 * Utility functions for rosbag file uploads to S3
 */

import { getRosbagSignedURL, deleteRosbagFromS3 } from "@/app/actions/action";
import { toast } from "sonner";

export interface RosbagMetadata {
  duration: number;
  messageCount: number;
  topics: Array<{
    name: string;
    type: string;
    messageCount: number;
  }>;
  startTime?: number;
  endTime?: number;
}

export interface UploadRosbagParams {
  file: File;
  metadata: RosbagMetadata;
  projectId?: string;
  saveToOrganization?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Validate a rosbag file before upload
 */
export function validateRosbagFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  if (!file.name.toLowerCase().endsWith(".mcap")) {
    return {
      valid: false,
      error: "Only .mcap rosbag files are supported",
    };
  }

  // Check file size (5GB max)
  const maxSize = 5 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (5GB). Your file: ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB`,
    };
  }

  return { valid: true };
}

/**
 * Calculate SHA256 checksum for file integrity
 */
export async function calculateChecksum(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Upload a rosbag file to S3 and create Convex record
 * Returns s3Key and s3Url for the caller to create the Convex record
 */
export async function uploadRosbagToS3({
  file,
  metadata,
  projectId,
  saveToOrganization = false,
  onProgress,
}: UploadRosbagParams): Promise<{
  success: boolean;
  error?: string;
  s3Key?: string;
  s3Url?: string;
  metadata?: RosbagMetadata;
}> {
  try {
    // Validate file
    const validation = validateRosbagFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    onProgress?.(10);

    // Get signed URL from server action
    console.log("Requesting signed URL...");
    const signedUrlResult = await getRosbagSignedURL({
      fileName: file.name,
      fileSize: file.size,
    });

    console.log("Signed URL result:", signedUrlResult);

    if (signedUrlResult.failure) {
      console.error("Signed URL failure:", signedUrlResult.failure);
      return { success: false, error: signedUrlResult.failure };
    }

    if (!signedUrlResult.success) {
      console.error("No success in signed URL result");
      return { success: false, error: "Failed to get signed URL" };
    }

    const { url, s3Key } = signedUrlResult.success;
    console.log("Got signed URL, s3Key:", s3Key);
    onProgress?.(20);

    // Upload to S3
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
    }

    onProgress?.(80);

    // Get S3 URL (remove query params from signed URL)
    const s3Url = url.split("?")[0];

    onProgress?.(100);

    // Return data for Convex record creation
    return {
      success: true,
      s3Key,
      s3Url,
      metadata,
    };
  } catch (error) {
    console.error("Error uploading rosbag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Delete a rosbag file from S3 and Convex
 */
export async function deleteRosbagFile(
  s3Key: string,
  deleteFromConvex: () => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from Convex first (this updates storage quota)
    await deleteFromConvex();

    // Then delete from S3
    const result = await deleteRosbagFromS3(s3Key);

    if (!result.success) {
      // File deleted from Convex but not S3 - log error but don't fail
      console.error("Failed to delete from S3:", result.error);
      toast.warning("File removed from library but may still exist in storage");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting rosbag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}
