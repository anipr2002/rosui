"use client"

import type React from "react"
import { useState, useId, forwardRef, memo } from "react"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, LazyMotion, domAnimation } from "framer-motion"
import { ParamLoading } from "./param-loading"

const CARD_VARIANTS = {
  left: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: -6, transition: { duration: 0.4, delay: 0.1 } },
    hover: { x: -22, y: -5, rotate: -15, scale: 1.05, transition: { duration: 0.2 } },
  },
  center: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
    hover: { y: -10, scale: 1.08, transition: { duration: 0.2 } },
  },
  right: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: 6, transition: { duration: 0.4, delay: 0.3 } },
    hover: { x: 22, y: -5, rotate: 15, scale: 1.05, transition: { duration: 0.2 } },
  },
}

const CONTENT_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.4 } },
}

const CardContainer = memo(
  ({
    variant,
  }: {
    variant: "left" | "center" | "right"
  }) => (
    <motion.div
      variants={CARD_VARIANTS[variant]}
      className="w-64 shrink-0"
    >
      <ParamLoading />
    </motion.div>
  ),
)
CardContainer.displayName = "CardContainer"

const MultiCardDisplay = memo(() => (
  <div className="flex justify-center isolate relative gap-4">
    <CardContainer variant="left" />
    <CardContainer variant="center" />
    <CardContainer variant="right" />
  </div>
))
MultiCardDisplay.displayName = "MultiCardDisplay"

export const ParamsEmptyState = forwardRef<HTMLDivElement>((props, ref) => {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <LazyMotion features={domAnimation}>
      <motion.section
        ref={ref}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "group relative flex min-h-[500px] flex-col items-center justify-center rounded-xl p-8 transition-all duration-300 overflow-hidden",
          "bg-white hover:bg-gray-50/50",
        )}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        {/* Animated background particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <motion.div
            className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-blue-400/5 blur-3xl"
            animate={{
              y: [0, 15, 0],
              x: [0, -10, 0],
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        {/* Dot grid background on hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(156 163 175 / 0.15) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated cards group */}
          <div className="mb-8 flex justify-center">
            <MultiCardDisplay />
          </div>

          {/* Title and description */}
          <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-cyan-600" />
              <h2
                id={titleId}
                className="text-xl font-semibold transition-colors duration-300 text-gray-900"
              >
                No Parameters Available
              </h2>
            </div>
            <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
              No ROS parameters were found. Make sure your ROS system is running and has parameters configured.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </LazyMotion>
  )
})
ParamsEmptyState.displayName = "ParamsEmptyState"
