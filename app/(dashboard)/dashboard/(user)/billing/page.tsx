"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import {
  Crown,
  Zap,
  Users,
  Calendar,
  CreditCard,
  ExternalLink,
  Check,
  HelpCircle,
  FileText,
  HardDrive,
  Layout,
  Workflow,
  TrendingUp,
  Clock,
  Infinity,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

// Polar Product IDs - must match convex/polar.ts
const POLAR_PRODUCTS = {
  proMonthly: "b6970110-bc70-4d40-9401-3d5dd2caf607",
  teamMonthly: "5135d64d-ce9d-47d8-91d4-b13747a11e93",
};

const PLAN_CONFIG = {
  free: {
    name: "Free Plan",
    price: "$0",
    icon: Zap,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    headerBg: "bg-gray-50",
    features: [
      "Access to 1 layout",
      "Access to 5 Workflows per month",
      "No storage",
    ],
  },
  pro: {
    name: "Pro Plan",
    price: "$3.99",
    icon: Crown,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    headerBg: "bg-blue-50",
    features: [
      "Everything in Free",
      "Create up to 10 layouts",
      "Access to 50 Workflows per month",
      "50GB ROSBAG Storage",
      "Sharable links",
      "Priority Support",
    ],
  },
  team: {
    name: "Team Plan",
    price: "$12.99",
    icon: Users,
    color: "bg-green-100 text-green-700 border-green-200",
    headerBg: "bg-green-50",
    features: [
      "Everything in Pro",
      "Unlimited layouts",
      "Unlimited Workflows",
      "500GB ROSBAG Storage",
      "Team collaboration",
      "Priority Support",
    ],
  },
};

// Format bytes to human readable format
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  if (!bytes) return "N/A";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Format time remaining until reset
function formatTimeUntilReset(resetTimestamp: number) {
  const now = Date.now();
  const diff = resetTimestamp - now;

  if (diff <= 0) return "Resetting soon";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} min${minutes > 1 ? "s" : ""}`;
}

function BillingPage() {
  const user = useQuery(api.users.current);
  const polarSubscription = useQuery(api.polar.getCurrentSubscription);
  const storageInfo = useQuery(api.users.getUserStorageInfo);
  const limitsInfo = useQuery(api.users.getUserLimitsInfo);

  // Loading state
  if (user === undefined || polarSubscription === undefined) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Determine tier from Polar subscription or default to free
  const currentTier = polarSubscription?.tier || "free";
  const planConfig = PLAN_CONFIG[currentTier];

  // Check if subscription is cancelled but still active
  const isCancelled = polarSubscription?.cancelAtPeriodEnd === true;

  // Get next billing date from Polar subscription
  const nextBillingDate = polarSubscription?.currentPeriodEnd
    ? new Date(polarSubscription.currentPeriodEnd)
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader
              className={`${planConfig.headerBg} border-b rounded-t-xl pt-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-600 text-base">
                    Current Plan
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your active subscription tier
                  </CardDescription>
                </div>
                <Badge className={planConfig.color}>{planConfig.name}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Cancellation Notice */}
              {isCancelled && nextBillingDate && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Subscription Cancelled
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Your subscription has been cancelled. You'll continue to
                        have access to {planConfig.name} features until{" "}
                        <span className="font-semibold">
                          {nextBillingDate.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        . After that, you'll be downgraded to the Free plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 pb-6 border-b">
                <span className="text-4xl font-bold text-gray-900">
                  {planConfig.price}
                </span>
                <span className="text-gray-600">/mo</span>
                <span className="text-gray-500 text-sm ml-2">
                  billed monthly
                </span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Plan Features
                </h3>
                <div className="space-y-3">
                  {planConfig.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {currentTier === "free" && (
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={[POLAR_PRODUCTS.proMonthly]}
                    embed={true}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Upgrade to Pro
                  </CheckoutLink>
                )}

                {currentTier === "free" && (
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={[POLAR_PRODUCTS.teamMonthly]}
                    embed={true}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-white px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
                  >
                    Upgrade to Team
                  </CheckoutLink>
                )}

                {currentTier === "pro" && (
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={[POLAR_PRODUCTS.teamMonthly]}
                    embed={true}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-white px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
                  >
                    Upgrade to Team
                  </CheckoutLink>
                )}

                {currentTier !== "free" && !isCancelled && (
                  <CustomerPortalLink
                    polarApi={{
                      generateCustomerPortalUrl:
                        api.polar.generateCustomerPortalUrl,
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    Cancel Subscription
                    <ExternalLink className="h-3.5 w-3.5" />
                  </CustomerPortalLink>
                )}

                {currentTier !== "free" && isCancelled && (
                  <CustomerPortalLink
                    polarApi={{
                      generateCustomerPortalUrl:
                        api.polar.generateCustomerPortalUrl,
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reactivate Subscription
                  </CustomerPortalLink>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Info Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-gray-50 border-b rounded-t-xl pt-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <CardTitle className="text-base">Billing Info</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Next Billing Date / Access Until */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {isCancelled ? "Access Until" : "Next Billing Date"}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {nextBillingDate
                    ? nextBillingDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Amount</p>
                <p className="text-sm font-medium text-gray-900">
                  {isCancelled ? (
                    <span className="text-gray-500 line-through">
                      {planConfig.price}/mo
                    </span>
                  ) : (
                    `${planConfig.price}/mo`
                  )}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <Badge
                  className={
                    currentTier === "free"
                      ? "bg-gray-100 text-gray-700"
                      : isCancelled
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }
                >
                  {currentTier === "free"
                    ? "Free"
                    : isCancelled
                      ? "Cancelling"
                      : "Active"}
                </Badge>
              </div>

              {/* Manage Payment Methods */}
              {currentTier !== "free" && (
                <CustomerPortalLink
                  polarApi={{
                    generateCustomerPortalUrl:
                      api.polar.generateCustomerPortalUrl,
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Manage Payment Methods
                  <ExternalLink className="h-3.5 w-3.5" />
                </CustomerPortalLink>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats Card */}
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base text-indigo-900">
                    Usage Stats
                  </CardTitle>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  {currentTier === "team" ? "Unlimited" : "Limited"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Storage Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Storage
                    </span>
                  </div>
                  {storageInfo ? (
                    <span className="text-xs text-gray-500">
                      {formatBytes(storageInfo.used)} /{" "}
                      {storageInfo.quota > 0
                        ? formatBytes(storageInfo.quota)
                        : "No storage"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                </div>
                {storageInfo && storageInfo.quota > 0 ? (
                  <div className="space-y-1">
                    <Progress
                      value={storageInfo.percentageUsed}
                      className={`h-2 ${
                        storageInfo.percentageUsed > 90
                          ? "[&>div]:bg-red-500"
                          : storageInfo.percentageUsed > 70
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-indigo-500"
                      }`}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {formatBytes(storageInfo.remaining)} remaining
                      </span>
                      <span>{storageInfo.percentageUsed.toFixed(1)}% used</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">
                      No storage on Free plan
                    </p>
                  </div>
                )}
              </div>

              {/* Layouts Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Layouts
                    </span>
                  </div>
                  {limitsInfo ? (
                    <span className="text-xs text-gray-500">
                      {limitsInfo.layouts.current} /{" "}
                      {!isFinite(limitsInfo.layouts.limit) ||
                      limitsInfo.layouts.limit > 1000000 ? (
                        <Infinity className="h-3 w-3 inline" />
                      ) : (
                        limitsInfo.layouts.limit
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                </div>
                {limitsInfo && (
                  <div className="space-y-1">
                    {!isFinite(limitsInfo.layouts.limit) ||
                    limitsInfo.layouts.limit > 1000000 ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Unlimited layouts
                        </span>
                      </div>
                    ) : (
                      <>
                        <Progress
                          value={
                            (limitsInfo.layouts.current /
                              limitsInfo.layouts.limit) *
                            100
                          }
                          className={`h-2 ${
                            limitsInfo.layouts.current >=
                            limitsInfo.layouts.limit
                              ? "[&>div]:bg-red-500"
                              : limitsInfo.layouts.current >=
                                  limitsInfo.layouts.limit * 0.8
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-indigo-500"
                          }`}
                        />
                        <p className="text-xs text-gray-500">
                          {limitsInfo.layouts.canCreate
                            ? `${limitsInfo.layouts.limit - limitsInfo.layouts.current} remaining`
                            : "Limit reached"}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Workflows Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Workflows
                    </span>
                  </div>
                  {limitsInfo ? (
                    <span className="text-xs text-gray-500">
                      {limitsInfo.workflows.current} /{" "}
                      {!isFinite(limitsInfo.workflows.limit) ||
                      limitsInfo.workflows.limit > 1000000 ? (
                        <Infinity className="h-3 w-3 inline" />
                      ) : (
                        limitsInfo.workflows.limit
                      )}
                      <span className="text-gray-400"> / mo</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                </div>
                {limitsInfo && (
                  <div className="space-y-1">
                    {!isFinite(limitsInfo.workflows.limit) ||
                    limitsInfo.workflows.limit > 1000000 ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Unlimited workflows
                        </span>
                      </div>
                    ) : (
                      <>
                        <Progress
                          value={
                            (limitsInfo.workflows.current /
                              limitsInfo.workflows.limit) *
                            100
                          }
                          className={`h-2 ${
                            limitsInfo.workflows.current >=
                            limitsInfo.workflows.limit
                              ? "[&>div]:bg-red-500"
                              : limitsInfo.workflows.current >=
                                  limitsInfo.workflows.limit * 0.8
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-indigo-500"
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {limitsInfo.workflows.canUse
                              ? `${limitsInfo.workflows.limit - limitsInfo.workflows.current} remaining`
                              : "Limit reached"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              Resets in{" "}
                              {formatTimeUntilReset(
                                limitsInfo.workflows.resetsAt
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Upgrade prompt for free users */}
              {currentTier === "free" && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    Need more resources?
                  </p>
                  <CheckoutLink
                    polarApi={api.polar}
                    productIds={[POLAR_PRODUCTS.proMonthly]}
                    embed={true}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </CheckoutLink>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Need Help Section */}
      {/* <Card className="shadow-none rounded-xl mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                Have questions about your subscription or billing?
              </p>
              <a
                href="/docs"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                <FileText className="h-3.5 w-3.5" />
                View Documentation →
              </a>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

export default BillingPage;
