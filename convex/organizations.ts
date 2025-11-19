import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

// Get organization details
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.organizationId) {
      return null;
    }

    const org = await ctx.db.get(user.organizationId);
    return org;
  },
});

// Get organization members
export const getMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.organizationId) {
      return [];
    }

    const members = await ctx.db
      .query("users")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", user.organizationId)
      )
      .collect();

    return members.map((member) => ({
      _id: member._id,
      name: member.name,
      storageUsedBytes: member.storageUsedBytes,
    }));
  },
});

// Get organization storage info
export const getStorageInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user.organizationId) {
      return null;
    }

    const org = await ctx.db.get(user.organizationId);
    if (!org) {
      return null;
    }

    const percentageUsed = (org.storageUsedBytes / org.storageQuotaBytes) * 100;

    return {
      quota: org.storageQuotaBytes,
      used: org.storageUsedBytes,
      remaining: org.storageQuotaBytes - org.storageUsedBytes,
      percentageUsed,
    };
  },
});
