"use client";

import { CheckoutLink } from "@convex-dev/polar/react";
import { api } from "@/convex/_generated/api";

interface CheckoutButtonProps {
  productIds: string[];
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  embed?: boolean;
}

export function CheckoutButton({
  productIds,
  children,
  className = "",
  variant = "default",
  embed = true,
}: CheckoutButtonProps) {
  const baseStyles =
    variant === "default"
      ? "bg-blue-500 hover:bg-blue-600 text-white"
      : variant === "outline"
        ? "border-blue-500 text-blue-500 hover:bg-blue-50"
        : "";

  return (
    <CheckoutLink
      polarApi={api.polar}
      productIds={productIds}
      embed={embed}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors ${baseStyles} ${className}`}
    >
      {children}
    </CheckoutLink>
  );
}
