import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

// List projects for the current user
export const list = query({
  args: {
    includeShared: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeShared = false }) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get user's own projects
    const userProjects = await ctx.db
      .query("projects")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    if (!includeShared || !user.organizationId) {
      return userProjects;
    }

    // Get shared organization projects
    const orgProjects = await ctx.db
      .query("projects")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", user.organizationId)
      )
      .filter((q) => q.and(q.eq(q.field("isShared"), true), q.neq(q.field("userId"), user._id)))
      .collect();

    return [...userProjects, ...orgProjects];
  },
});

// Get a single project with file count
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const project = await ctx.db.get(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Check access
    const hasAccess =
      project.userId === user._id ||
      (project.isShared &&
        project.organizationId === user.organizationId);

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Count files in this project
    const files = await ctx.db
      .query("rosbagFiles")
      .withIndex("byProject", (q) => q.eq("projectId", projectId))
      .collect();

    return {
      ...project,
      fileCount: files.length,
    };
  },
});

// Create a new project
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, description, isShared = false }) => {
    const user = await getCurrentUserOrThrow(ctx);

    // If sharing, user must be in an organization
    if (isShared && !user.organizationId) {
      throw new Error("Cannot create shared project without an organization");
    }

    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      name,
      description,
      userId: user._id,
      organizationId: isShared ? user.organizationId : undefined,
      isShared,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Update a project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, { projectId, name, description, isShared }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const project = await ctx.db.get(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Only owner can update
    if (project.userId !== user._id) {
      throw new Error("Access denied");
    }

    // If changing to shared, user must be in an organization
    if (isShared && !user.organizationId) {
      throw new Error("Cannot share project without an organization");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isShared !== undefined) {
      updates.isShared = isShared;
      updates.organizationId = isShared ? user.organizationId : undefined;
    }

    await ctx.db.patch(projectId, updates);
  },
});

// Delete a project
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    deleteFiles: v.optional(v.boolean()),
  },
  handler: async (ctx, { projectId, deleteFiles = false }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const project = await ctx.db.get(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Only owner can delete
    if (project.userId !== user._id) {
      throw new Error("Access denied");
    }

    if (deleteFiles) {
      // Delete all files in the project
      const files = await ctx.db
        .query("rosbagFiles")
        .withIndex("byProject", (q) => q.eq("projectId", projectId))
        .collect();

      for (const file of files) {
        await ctx.db.delete(file._id);
        
        // Update storage usage
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
      }
    } else {
      // Just unassign files from the project
      const files = await ctx.db
        .query("rosbagFiles")
        .withIndex("byProject", (q) => q.eq("projectId", projectId))
        .collect();

      for (const file of files) {
        await ctx.db.patch(file._id, { projectId: undefined });
      }
    }

    await ctx.db.delete(projectId);
  },
});
