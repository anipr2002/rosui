import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

// List rosbag files for the current user
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, limit = 50 }) => {
    const user = await getCurrentUserOrThrow(ctx);

    let query = ctx.db
      .query("rosbagFiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .order("desc");

    const files = await query.take(limit);

    // Filter by project if specified
    if (projectId !== undefined) {
      return files.filter((f) => f.projectId === projectId);
    }

    return files;
  },
});

// Get a single rosbag file
export const get = query({
  args: { fileId: v.id("rosbagFiles") },
  handler: async (ctx, { fileId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const file = await ctx.db.get(fileId);

    if (!file) {
      throw new Error("File not found");
    }

    // Check if user has access to this file
    if (file.userId !== user._id) {
      // Check if it's a shared org file
      if (!file.organizationId || file.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    return file;
  },
});

// Create a rosbag file record after S3 upload
export const create = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    s3Key: v.string(),
    s3Url: v.string(),
    projectId: v.optional(v.id("projects")),
    saveToOrganization: v.optional(v.boolean()),
    metadata: v.object({
      duration: v.number(),
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Determine if saving to organization storage
    const organizationId =
      args.saveToOrganization && user.organizationId
        ? user.organizationId
        : undefined;

    // Create the file record
    const fileId = await ctx.db.insert("rosbagFiles", {
      fileName: args.fileName,
      fileSize: args.fileSize,
      s3Key: args.s3Key,
      s3Url: args.s3Url,
      userId: user._id,
      projectId: args.projectId,
      organizationId,
      uploadedAt: Date.now(),
      metadata: args.metadata,
    });

    // Update storage usage
    if (organizationId) {
      // Update organization storage
      const org = await ctx.db.get(organizationId);
      if (org) {
        await ctx.db.patch(organizationId, {
          storageUsedBytes: org.storageUsedBytes + args.fileSize,
        });
      }
    } else {
      // Update user storage
      await ctx.db.patch(user._id, {
        storageUsedBytes: user.storageUsedBytes + args.fileSize,
      });
    }

    return fileId;
  },
});

// Delete a rosbag file
export const deleteFile = mutation({
  args: { fileId: v.id("rosbagFiles") },
  handler: async (ctx, { fileId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const file = await ctx.db.get(fileId);

    if (!file) {
      throw new Error("File not found");
    }

    // Check if user has permission to delete
    if (file.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Update storage usage before deleting
    if (file.organizationId) {
      const org = await ctx.db.get(file.organizationId);
      if (org) {
        await ctx.db.patch(file.organizationId, {
          storageUsedBytes: Math.max(0, org.storageUsedBytes - file.fileSize),
        });
      }
    } else {
      await ctx.db.patch(user._id, {
        storageUsedBytes: Math.max(0, user.storageUsedBytes - file.fileSize),
      });
    }

    // Delete the file record
    await ctx.db.delete(fileId);

    // Return S3 key for deletion
    return { s3Key: file.s3Key };
  },
});

// Update file's project assignment
export const updateProject = mutation({
  args: {
    fileId: v.id("rosbagFiles"),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, { fileId, projectId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const file = await ctx.db.get(fileId);

    if (!file) {
      throw new Error("File not found");
    }

    if (file.userId !== user._id) {
      throw new Error("Access denied");
    }

    // If assigning to a project, verify user owns it
    if (projectId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== user._id) {
        throw new Error("Project not found or access denied");
      }
    }

    await ctx.db.patch(fileId, { projectId });
  },
});

// Get files shared with the user's organization
export const listShared = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.organizationId) {
      return [];
    }

    const files = await ctx.db
      .query("rosbagFiles")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", user.organizationId)
      )
      .order("desc")
      .take(limit);

    return files;
  },
});

// Get recent rosbag files for quick access
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const files = await ctx.db
      .query("rosbagFiles")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return files;
  },
});


// Move a file to a different project (or remove from project)
export const moveToProject = mutation({
  args: {
    fileId: v.id("rosbagFiles"),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, { fileId, projectId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const file = await ctx.db.get(fileId);

    if (!file) {
      throw new Error("File not found");
    }

    // Only file owner can move it
    if (file.userId !== user._id) {
      throw new Error("Access denied");
    }

    // If assigning to a project, verify user has access to it
    if (projectId) {
      const project = await ctx.db.get(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // User must own the project or have access via shared org project
      const hasAccess =
        project.userId === user._id ||
        (project.isShared &&
          project.organizationId === user.organizationId);

      if (!hasAccess) {
        throw new Error("Access denied to this project");
      }
    }

    await ctx.db.patch(fileId, { projectId });
  },
});
