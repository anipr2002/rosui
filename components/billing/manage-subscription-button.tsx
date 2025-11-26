"use client";

import { CustomerPortalLink } from "@convex-dev/polar/react";
import { api } from "@/convex/_generated/api";
import { Settings } from "lucide-react";

interface ManageSubscriptionButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export function ManageSubscriptionButton({
  children,
  className = "",
}: ManageSubscriptionButtonProps) {
  return (
    <CustomerPortalLink
      polarApi={{
        generateCustomerPortalUrl: api.polar.generateCustomerPortalUrl,
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 ${className}`}
    >
      {children || (
        <>
          <Settings className="h-4 w-4" />
          Manage Subscription
        </>
      )}
    </CustomerPortalLink>
  );
}
