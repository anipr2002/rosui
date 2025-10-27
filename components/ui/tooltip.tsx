"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  colorVariant = "amber",
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  colorVariant?: "amber" | "green" | "purple" | "gray" | "blue" | "red";
}) {
  const colorStyles = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-900",
      arrow: "fill-amber-50",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-900",
      arrow: "fill-green-50",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-300",
      text: "text-purple-900",
      arrow: "fill-purple-50",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-300",
      text: "text-gray-900",
      arrow: "fill-gray-50",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-900",
      arrow: "fill-blue-50",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-900",
      arrow: "fill-red-50",
    },
  };

  const colors = colorStyles[colorVariant];

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          `${colors.bg} ${colors.border} ${colors.text} border animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance`,
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
