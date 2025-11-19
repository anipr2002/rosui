import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
    // Subscription tier: free, pro, or team
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("team")
    ),
    // Organization ID for team users (optional)
    organizationId: v.optional(v.id("organizations")),
    // Storage used in bytes
    storageUsedBytes: v.number(),
  })
    .index("byExternalId", ["externalId"])
    .index("byOrganization", ["organizationId"]),

  organizations: defineTable({
    name: v.string(),
    // Storage quota in bytes (500GB for team tier)
    storageQuotaBytes: v.number(),
    // Storage currently used in bytes
    storageUsedBytes: v.number(),
    createdAt: v.number(),
  }),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    // Owner of the project
    userId: v.id("users"),
    // Organization ID if this is a team project (optional)
    organizationId: v.optional(v.id("organizations")),
    // Whether this project is shared with the team
    isShared: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUser", ["userId"])
    .index("byOrganization", ["organizationId"])
    .index("byUserAndShared", ["userId", "isShared"]),

  rosbagFiles: defineTable({
    // Original filename
    fileName: v.string(),
    // File size in bytes
    fileSize: v.number(),
    // S3 object key
    s3Key: v.string(),
    // S3 URL for download
    s3Url: v.string(),
    // Owner of the file
    userId: v.id("users"),
    // Optional project assignment
    projectId: v.optional(v.id("projects")),
    // Organization ID if saved to org storage (optional)
    organizationId: v.optional(v.id("organizations")),
    // Upload timestamp
    uploadedAt: v.number(),
    // Rosbag metadata
    metadata: v.object({
      duration: v.number(), // in seconds
      messageCount: v.number(),
      topics: v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          messageCount: v.number(),
        })
      ),
      startTime: v.optional(v.number()),
      endTime: v.optional(v.number()),
    }),
  })
    .index("byUser", ["userId"])
    .index("byProject", ["projectId"])
    .index("byOrganization", ["organizationId"])
    .index("byUserAndProject", ["userId", "projectId"])
    .index("byUploadedAt", ["uploadedAt"]),
});
