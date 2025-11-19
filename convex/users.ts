import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name} ${data.last_name}`,
      externalId: data.id,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      // New user - initialize with free tier and zero storage
      await ctx.db.insert("users", {
        ...userAttributes,
        subscriptionTier: "free" as const,
        storageUsedBytes: 0,
      });
    } else {
      // Existing user - only update name
      await ctx.db.patch(user._id, { name: userAttributes.name });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

// Storage quota utilities
const STORAGE_QUOTAS = {
  free: 0, // No storage for free users
  pro: 50 * 1024 * 1024 * 1024, // 50GB in bytes
  team: 500 * 1024 * 1024 * 1024, // 500GB in bytes
};

export const getUserStorageInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const quota = STORAGE_QUOTAS[user.subscriptionTier];
    const used = user.storageUsedBytes;
    const remaining = quota - used;
    const percentageUsed = quota > 0 ? (used / quota) * 100 : 0;

    return {
      tier: user.subscriptionTier,
      quota,
      used,
      remaining,
      percentageUsed,
      canUpload: remaining > 0,
    };
  },
});

export const canUploadFile = query({
  args: { fileSize: v.number() },
  handler: async (ctx, { fileSize }) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Free users cannot upload
    if (user.subscriptionTier === "free") {
      return {
        canUpload: false,
        reason: "Free tier does not have storage access. Please upgrade to Pro or Team.",
      };
    }

    const quota = STORAGE_QUOTAS[user.subscriptionTier];
    const used = user.storageUsedBytes;
    const remaining = quota - used;

    if (fileSize > remaining) {
      return {
        canUpload: false,
        reason: `Insufficient storage. File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB, Available: ${(remaining / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return {
      canUpload: true,
      reason: null,
    };
  },
});
