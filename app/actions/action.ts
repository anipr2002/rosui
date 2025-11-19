"use server"

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@clerk/nextjs/server"
import crypto from "crypto"

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex")

// ============================================
// ROSBAG FILE UPLOAD TO S3
// ============================================


const ROSBAG_MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB in bytes

type RosbagSignedURLResponse = Promise<
  | { failure?: undefined; success: { url: string; s3Key: string } }
  | { failure: string; success?: undefined }
>

type GetRosbagSignedURLParams = {
  fileName: string
  fileSize: number
}

export const getRosbagSignedURL = async ({
  fileName,
  fileSize,
}: GetRosbagSignedURLParams): RosbagSignedURLResponse => {
  console.log("getRosbagSignedURL called with:", { fileName, fileSize });
  
  const { userId } = await auth()

  if (!userId) {
    console.error("No userId from auth");
    return { failure: "Not authenticated" }
  }

  console.log("User authenticated:", userId);

  // Validate file extension
  if (!fileName.toLowerCase().endsWith(".mcap")) {
    return { failure: "Only .mcap rosbag files are allowed" }
  }

  // Validate file size
  if (fileSize > ROSBAG_MAX_FILE_SIZE) {
    return {
      failure: `File size too large. Maximum allowed: ${ROSBAG_MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`,
    }
  }

  // Note: Storage quota is checked client-side before calling this action
  // This ensures proper authentication context for Convex queries


  // Generate S3 key with user ID and timestamp
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const s3Key = `rosbags/${userId}/${timestamp}_${sanitizedFileName}`

  console.log("Generated S3 key:", s3Key);

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: s3Key,
    ContentType: "application/octet-stream",
    ContentLength: fileSize,
    // Note: ChecksumSHA256 removed - causes conflicts with presigned URLs
    Metadata: {
      userId,
      uploadedAt: timestamp.toString(),
      originalFileName: fileName,
    },
  })

  try {
    console.log("Generating signed URL...");
    const url = await getSignedUrl(
      s3Client,
      putObjectCommand,
      { expiresIn: 600 } // 10 minutes for large file uploads
    )

    console.log("Signed URL generated successfully");
    return { success: { url, s3Key } }
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return { failure: "Failed to generate upload URL" }
  }
}

// Delete rosbag file from S3
export const deleteRosbagFromS3 = async (s3Key: string): Promise<{ success: boolean; error?: string }> => {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify the s3Key belongs to the user (security check)
  if (!s3Key.startsWith(`rosbags/${userId}/`)) {
    return { success: false, error: "Access denied" }
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: s3Key,
  })

  try {
    await s3Client.send(deleteCommand)
    return { success: true }
  } catch (error) {
    console.error("Error deleting from S3:", error)
    return { success: false, error: "Failed to delete file from storage" }
  }
}