import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import type { WebhookEvent } from "@clerk/backend"
import { Webhook } from "svix"
import { polar } from "./polar"

const http = httpRouter()

// Register Polar webhook routes for subscription management
polar.registerRoutes(http, {
  onSubscriptionCreated: async (ctx, event) => {
    const { productId, customerId } = event.data
    console.log(`Subscription created: product=${productId}, customer=${customerId}`)
    // Subscription tier is updated via the internal mutation triggered by product mapping
    await ctx.runMutation(internal.users.updateSubscriptionFromPolar, {
      polarCustomerId: customerId,
      productId,
      status: "active",
    })
  },
  onSubscriptionUpdated: async (ctx, event) => {
    const { productId, customerId, status, canceledAt } = event.data
    console.log(`Subscription updated: product=${productId}, customer=${customerId}, status=${status}`)
    
    // Handle cancellation
    if (canceledAt || status === "canceled") {
      await ctx.runMutation(internal.users.updateSubscriptionFromPolar, {
        polarCustomerId: customerId,
        productId: null,
        status: "canceled",
      })
    } else {
      await ctx.runMutation(internal.users.updateSubscriptionFromPolar, {
        polarCustomerId: customerId,
        productId,
        status: status || "active",
      })
    }
  },
})

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch ((event as any).type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data as any,
        });
        break;

      case "user.deleted": {
        const clerkUserId = (event.data as any).id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }

      default:
        console.log("Ignored webhook event", (event as any).type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
