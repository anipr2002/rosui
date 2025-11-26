import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";

// Product keys mapped to Polar product IDs
// Replace these with your actual Polar product IDs from the sandbox dashboard
const POLAR_PRODUCTS = {
  proMonthly: "b6970110-bc70-4d40-9401-3d5dd2caf607",
  teamMonthly: "5135d64d-ce9d-47d8-91d4-b13747a11e93",
};

export const polar = new Polar(components.polar, {
  // Get user info from Clerk identity for Polar subscription management
  getUserInfo: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    return {
      userId: identity.subject, // Clerk user ID
      email: identity.email!,
    };
  },
  products: POLAR_PRODUCTS,
});

// Export API functions for use in client components
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();

// Sync existing products from Polar dashboard to Convex
import { action, query } from "./_generated/server";

export const syncProducts = action({
  args: {},
  handler: async (ctx) => {
    await polar.syncProducts(ctx);
    return { success: true };
  },
});

// Get current user's subscription from Polar
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Query subscriptions directly from the Polar component's internal table
    const subscriptions = await ctx.runQuery(
      components.polar.lib.listUserSubscriptions,
      { userId: identity.subject }
    );

    // Find active subscription
    const subscription = subscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!subscription) {
      return null;
    }

    // Map product ID to tier
    let tier: "free" | "pro" | "team" = "free";
    if (subscription.productId === POLAR_PRODUCTS.proMonthly) {
      tier = "pro";
    } else if (subscription.productId === POLAR_PRODUCTS.teamMonthly) {
      tier = "team";
    }

    return {
      id: subscription.id,
      status: subscription.status,
      productId: subscription.productId,
      currentPeriodEnd: subscription.currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      tier,
      productKey:
        Object.entries(POLAR_PRODUCTS).find(
          ([_, id]) => id === subscription.productId
        )?.[0] || null,
    };
  },
});
