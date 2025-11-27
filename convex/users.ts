import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";
import { components } from "./_generated/api";

// Polar Product IDs - must match convex/polar.ts
const POLAR_PRODUCTS = {
  proMonthly: "b6970110-bc70-4d40-9401-3d5dd2caf607",
  teamMonthly: "5135d64d-ce9d-47d8-91d4-b13747a11e93",
};

// Product ID to tier mapping - update these with your actual Polar product IDs
const PRODUCT_TO_TIER: Record<string, "free" | "pro" | "team"> = {
  "b6970110-bc70-4d40-9401-3d5dd2caf607": "pro",
  "5135d64d-ce9d-47d8-91d4-b13747a11e93": "team",
};

// Tier limits for layouts and workflows
export const TIER_LIMITS = {
  free: { layouts: 1, workflowsPerMonth: 5 },
  pro: { layouts: 10, workflowsPerMonth: 50 },
  team: { layouts: Infinity, workflowsPerMonth: Infinity },
};

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
      // New user - initialize with free tier and zero storage/counts
      await ctx.db.insert("users", {
        ...userAttributes,
        subscriptionTier: "free" as const,
        storageUsedBytes: 0,
        layoutCount: 0,
        workflowCount: 0,
        workflowResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // Reset in 30 days
      });
    } else {
      // Existing user - only update name
      await ctx.db.patch(user._id, { name: userAttributes.name });
    }
  },
});

// Update subscription tier from Polar webhook
export const updateSubscriptionFromPolar = internalMutation({
  args: {
    polarCustomerId: v.string(),
    productId: v.union(v.string(), v.null()),
    status: v.string(),
  },
  async handler(ctx, { polarCustomerId, productId, status }) {
    // Find user by Polar customer ID (stored in Polar's system, linked by email)
    // For now, we'll need to look up by the subscription data
    // The Polar component stores subscription data that we can query

    if (status === "canceled" || !productId) {
      // Subscription canceled - find and downgrade user
      // Note: In production, you'd want to track polar customer ID -> user mapping
      console.log(`Subscription canceled for customer: ${polarCustomerId}`);
      return;
    }

    const tier = PRODUCT_TO_TIER[productId];
    if (!tier) {
      console.warn(`Unknown product ID: ${productId}`);
      return;
    }

    console.log(
      `Subscription updated: customer=${polarCustomerId}, tier=${tier}`
    );
    // Note: The actual user update will happen through Polar's internal subscription tracking
    // and we'll query it via polar.getCurrentSubscription() in our app
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

// Helper to get effective tier from Polar subscription
async function getEffectiveTier(
  ctx: QueryCtx,
  userId: string
): Promise<"free" | "pro" | "team"> {
  try {
    const subscriptions = await ctx.runQuery(
      components.polar.lib.listUserSubscriptions,
      { userId }
    );

    const activeSubscription = subscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      return "free";
    }

    if (activeSubscription.productId === POLAR_PRODUCTS.proMonthly) {
      return "pro";
    } else if (activeSubscription.productId === POLAR_PRODUCTS.teamMonthly) {
      return "team";
    }

    return "free";
  } catch {
    return "free";
  }
}

export const getUserStorageInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    // Return null if user is not authenticated yet
    if (!user) {
      return null;
    }
    
    const identity = await ctx.auth.getUserIdentity();

    // Get effective tier from Polar subscription (takes precedence over database tier)
    const effectiveTier = identity
      ? await getEffectiveTier(ctx, identity.subject)
      : user.subscriptionTier;

    const quota = STORAGE_QUOTAS[effectiveTier];
    const used = user.storageUsedBytes;
    const remaining = Math.max(0, quota - used);
    const percentageUsed = quota > 0 ? (used / quota) * 100 : 0;

    return {
      tier: effectiveTier,
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
    const user = await getCurrentUser(ctx);
    
    // Return cannot upload if user is not authenticated yet
    if (!user) {
      return {
        canUpload: false,
        reason: "User not authenticated",
      };
    }
    
    const identity = await ctx.auth.getUserIdentity();

    // Get effective tier from Polar subscription
    const effectiveTier = identity
      ? await getEffectiveTier(ctx, identity.subject)
      : user.subscriptionTier;

    // Free users cannot upload
    if (effectiveTier === "free") {
      return {
        canUpload: false,
        reason:
          "Free tier does not have storage access. Please upgrade to Pro or Team.",
      };
    }

    const quota = STORAGE_QUOTAS[effectiveTier];
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

// Get user's tier limits and current usage
export const getUserLimitsInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    // Return null if user is not authenticated yet
    if (!user) {
      return null;
    }
    
    const identity = await ctx.auth.getUserIdentity();

    // Get effective tier from Polar subscription
    const effectiveTier = identity
      ? await getEffectiveTier(ctx, identity.subject)
      : user.subscriptionTier;

    const limits = TIER_LIMITS[effectiveTier];

    // Use defaults for existing users without these fields
    const layoutCount = user.layoutCount ?? 0;
    const workflowCount = user.workflowCount ?? 0;
    const workflowResetAt =
      user.workflowResetAt ?? Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Check if workflow count should be reset
    const now = Date.now();
    const shouldResetWorkflows = now >= workflowResetAt;

    return {
      tier: effectiveTier,
      layouts: {
        current: layoutCount,
        limit: limits.layouts,
        canCreate: layoutCount < limits.layouts,
      },
      workflows: {
        current: shouldResetWorkflows ? 0 : workflowCount,
        limit: limits.workflowsPerMonth,
        canUse: shouldResetWorkflows
          ? true
          : workflowCount < limits.workflowsPerMonth,
        resetsAt: workflowResetAt,
      },
    };
  },
});

// Check if user can create a new layout
export const canCreateLayout = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    // Return cannot create if user is not authenticated yet
    if (!user) {
      return {
        canCreate: false,
        reason: "User not authenticated",
      };
    }
    
    const identity = await ctx.auth.getUserIdentity();

    // Get effective tier from Polar subscription
    const effectiveTier = identity
      ? await getEffectiveTier(ctx, identity.subject)
      : user.subscriptionTier;

    const limits = TIER_LIMITS[effectiveTier];
    const layoutCount = user.layoutCount ?? 0;

    if (layoutCount >= limits.layouts) {
      return {
        canCreate: false,
        reason: `Layout limit reached (${layoutCount}/${limits.layouts}). Please upgrade your plan.`,
      };
    }

    return {
      canCreate: true,
      reason: null,
    };
  },
});

// Check if user can use a workflow
export const canUseWorkflow = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    // Return cannot use if user is not authenticated yet
    if (!user) {
      return {
        canUse: false,
        reason: "User not authenticated",
      };
    }
    
    const identity = await ctx.auth.getUserIdentity();

    // Get effective tier from Polar subscription
    const effectiveTier = identity
      ? await getEffectiveTier(ctx, identity.subject)
      : user.subscriptionTier;

    const limits = TIER_LIMITS[effectiveTier];
    const workflowCount = user.workflowCount ?? 0;
    const workflowResetAt =
      user.workflowResetAt ?? Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Check if workflow count should be reset
    const now = Date.now();
    const currentCount = now >= workflowResetAt ? 0 : workflowCount;

    if (currentCount >= limits.workflowsPerMonth) {
      return {
        canUse: false,
        reason: `Monthly workflow limit reached (${currentCount}/${limits.workflowsPerMonth}). Resets at ${new Date(workflowResetAt).toLocaleDateString()}.`,
      };
    }

    return {
      canUse: true,
      reason: null,
    };
  },
});

// Increment layout count (call when user creates a layout)
export const incrementLayoutCount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const layoutCount = user.layoutCount ?? 0;
    await ctx.db.patch(user._id, {
      layoutCount: layoutCount + 1,
    });
  },
});

// Decrement layout count (call when user deletes a layout)
export const decrementLayoutCount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const layoutCount = user.layoutCount ?? 0;
    await ctx.db.patch(user._id, {
      layoutCount: Math.max(0, layoutCount - 1),
    });
  },
});

// Increment workflow count (call when user runs a workflow)
export const incrementWorkflowCount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const workflowCount = user.workflowCount ?? 0;
    const workflowResetAt = user.workflowResetAt ?? 0;

    // Reset count if past reset date
    if (now >= workflowResetAt) {
      await ctx.db.patch(user._id, {
        workflowCount: 1,
        workflowResetAt: now + 30 * 24 * 60 * 60 * 1000, // Reset in 30 days
      });
    } else {
      await ctx.db.patch(user._id, {
        workflowCount: workflowCount + 1,
      });
    }
  },
});

// Get user profile with Clerk information
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    const user = await userByExternalId(ctx, identity.subject);
    
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: identity.email || "",
      emailVerified: identity.emailVerified || false,
      imageUrl: identity.pictureUrl || "",
      username: identity.nickname || "",
      externalId: user.externalId,
    };
  },
});

// Update user profile name in Convex
export const updateUserProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    await ctx.db.patch(user._id, {
      name,
    });

    return { success: true };
  },
});
