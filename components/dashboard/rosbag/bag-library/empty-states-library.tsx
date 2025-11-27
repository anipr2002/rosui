"use client"

import type React from "react"
import { useState, useId, forwardRef, memo } from "react"
import { Upload, Radio, FileVideo, FolderOpen, Folder, FolderPlus, Users, Share2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, LazyMotion, domAnimation } from "framer-motion"

const ICON_VARIANTS = {
  left: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: -6, transition: { duration: 0.4, delay: 0.1 } },
    hover: { x: -22, y: -5, rotate: -15, scale: 1.1, transition: { duration: 0.2 } },
  },
  center: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
    hover: { y: -10, scale: 1.15, transition: { duration: 0.2 } },
  },
  right: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: 6, transition: { duration: 0.4, delay: 0.3 } },
    hover: { x: 22, y: -5, rotate: 15, scale: 1.1, transition: { duration: 0.2 } },
  },
}

const CONTENT_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.4 } },
}

const BUTTON_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.5 } },
}

const IconContainer = memo(
  ({
    children,
    variant,
    isDragging,
  }: {
    children: React.ReactNode
    variant: "left" | "center" | "right"
    isDragging: boolean
  }) => (
    <motion.div
      variants={ICON_VARIANTS[variant]}
      className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center relative shadow-lg transition-all duration-300",
        "bg-white border border-gray-200 group-hover:shadow-xl group-hover:border-gray-300",
        isDragging && "border-violet-300 bg-violet-50 shadow-violet-200",
      )}
    >
      <div
        className={cn(
          "transition-colors duration-300",
          "text-gray-500 group-hover:text-violet-600",
          isDragging && "text-violet-600",
        )}
      >
        {children}
      </div>
    </motion.div>
  ),
)
IconContainer.displayName = "IconContainer"

const MultiIconDisplay = memo(({ isDragging }: { isDragging: boolean }) => (
  <div className="flex justify-center isolate relative">
    <IconContainer variant="left" isDragging={isDragging}>
      <FileVideo className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="center" isDragging={isDragging}>
      <Upload className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="right" isDragging={isDragging}>
      <FolderOpen className="h-6 w-6" />
    </IconContainer>
  </div>
))
MultiIconDisplay.displayName = "MultiIconDisplay"

interface LibraryEmptyStateProps {
  onUpload?: () => void
  onRecord?: () => void
  onFileDrop?: (files: FileList) => void
}

export const LibraryEmptyState = forwardRef<HTMLDivElement, LibraryEmptyStateProps>(
  ({ onUpload, onRecord, onFileDrop }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [hoveredButton, setHoveredButton] = useState<"upload" | "record" | null>(null)
    const titleId = useId()
    const descriptionId = useId()

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      onFileDrop?.(e.dataTransfer.files)
    }

    return (
      <LazyMotion features={domAnimation}>
        <motion.section
          ref={ref}
          role="region"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "group relative flex min-h-[400px] flex-col items-center justify-center rounded-xl p-8 transition-all duration-300 overflow-hidden",
            "border-dashed border-2",
            isDragging
              ? "scale-[1.01] border-violet-400 bg-violet-50/50"
              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial="initial"
          animate="animate"
          whileHover="hover"
        >
          {/* Animated background particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <motion.div
              className={cn(
                "absolute left-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl transition-all duration-700",
                isDragging ? "bg-violet-400/20 scale-150" : "bg-violet-400/5 scale-100",
              )}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className={cn(
                "absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full blur-3xl transition-all duration-700",
                isDragging ? "bg-amber-400/20 scale-150" : "bg-amber-400/5 scale-100",
              )}
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
            {/* Animated icons group */}
            <div className="mb-8">
              <MultiIconDisplay isDragging={isDragging} />
            </div>

            {/* Title and description */}
            <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-8">
              <h2
                id={titleId}
                className={cn(
                  "text-xl font-semibold transition-colors duration-300",
                  isDragging ? "text-violet-700" : "text-gray-900",
                )}
              >
                {isDragging ? "Drop files here!" : "No Files Yet"}
              </h2>
              <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
                {isDragging
                  ? "Release to upload your rosbag files"
                  : "Upload rosbag files or record new ones to get started with your project"}
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={BUTTON_VARIANTS} className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className={cn(
                  "group/btn relative overflow-hidden border-violet-200 px-5 transition-all duration-300 hover:border-violet-500 hover:bg-violet-50",
                  hoveredButton === "upload" && "border-violet-500 bg-violet-50",
                )}
                onMouseEnter={() => setHoveredButton("upload")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={onUpload}
              >
                <span
                  className={cn(
                    "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-100 to-transparent transition-transform duration-700",
                    hoveredButton === "upload" && "translate-x-full",
                  )}
                />
                <Upload className="mr-2 h-4 w-4 text-violet-600 transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
                <span className="relative text-violet-600">Upload File</span>
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "group/btn relative overflow-hidden border-amber-200 px-5 transition-all duration-300 hover:border-amber-500 hover:bg-amber-50",
                  hoveredButton === "record" && "border-amber-500 bg-amber-50",
                )}
                onMouseEnter={() => setHoveredButton("record")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={onRecord}
              >
                <span
                  className={cn(
                    "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-100 to-transparent transition-transform duration-700",
                    hoveredButton === "record" && "translate-x-full",
                  )}
                />
                <Radio
                  className={cn(
                    "mr-2 h-4 w-4 text-amber-600 transition-all duration-300",
                    hoveredButton === "record" && "animate-pulse",
                  )}
                />
                <span className="relative text-amber-600">Record New</span>
              </Button>
            </motion.div>

            {/* Helper text */}
            <motion.p variants={BUTTON_VARIANTS} className="mt-6 text-xs text-gray-400">
              Supports .bag, .mcap, and .db3 files
            </motion.p>
          </div>
        </motion.section>
      </LazyMotion>
    )
  },
)
LibraryEmptyState.displayName = "LibraryEmptyState"

// Folder Empty State Icons
const FolderIconDisplay = memo(({ isDragging }: { isDragging: boolean }) => (
  <div className="flex justify-center isolate relative">
    <IconContainer variant="left" isDragging={isDragging}>
      <FolderPlus className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="center" isDragging={isDragging}>
      <Folder className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="right" isDragging={isDragging}>
      <FolderOpen className="h-6 w-6" />
    </IconContainer>
  </div>
))
FolderIconDisplay.displayName = "FolderIconDisplay"

interface FolderEmptyStateProps {
  onCreateClick?: () => void
  onFileDrop?: (files: FileList) => void
}

export const FolderEmptyState = forwardRef<HTMLDivElement, FolderEmptyStateProps>(
  ({ onCreateClick, onFileDrop }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [hoveredButton, setHoveredButton] = useState<"create" | null>(null)
    const titleId = useId()
    const descriptionId = useId()

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      onFileDrop?.(e.dataTransfer.files)
    }

    return (
      <LazyMotion features={domAnimation}>
        <motion.section
          ref={ref}
          role="region"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "group relative flex min-h-[400px] flex-col items-center justify-center rounded-xl p-8 transition-all duration-300 overflow-hidden",
            "border-dashed border-2",
            isDragging
              ? "scale-[1.01] border-purple-400 bg-purple-50/50"
              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial="initial"
          animate="animate"
          whileHover="hover"
        >
          {/* Animated background particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <motion.div
              className={cn(
                "absolute left-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl transition-all duration-700",
                isDragging ? "bg-purple-400/20 scale-150" : "bg-purple-400/5 scale-100",
              )}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className={cn(
                "absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full blur-3xl transition-all duration-700",
                isDragging ? "bg-indigo-400/20 scale-150" : "bg-indigo-400/5 scale-100",
              )}
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
            {/* Animated icons group */}
            <div className="mb-8">
              <FolderIconDisplay isDragging={isDragging} />
            </div>

            {/* Title and description */}
            <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-8">
              <h2
                id={titleId}
                className={cn(
                  "text-xl font-semibold transition-colors duration-300",
                  isDragging ? "text-purple-700" : "text-gray-900",
                )}
              >
                {isDragging ? "Drop to create folder!" : "No Folders Yet"}
              </h2>
              <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
                {isDragging
                  ? "Release to create a new folder with these files"
                  : "Create folders to organize your rosbag files"}
              </p>
            </motion.div>

            {/* Action button */}
            <motion.div variants={BUTTON_VARIANTS} className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className={cn(
                  "group/btn relative overflow-hidden border-purple-200 px-5 transition-all duration-300 hover:border-purple-500 hover:bg-purple-50",
                  hoveredButton === "create" && "border-purple-500 bg-purple-50",
                )}
                onMouseEnter={() => setHoveredButton("create")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={onCreateClick}
              >
                <span
                  className={cn(
                    "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-purple-100 to-transparent transition-transform duration-700",
                    hoveredButton === "create" && "translate-x-full",
                  )}
                />
                <FolderPlus className="mr-2 h-4 w-4 text-purple-600 transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
                <span className="relative text-purple-600">Create Folder</span>
              </Button>
            </motion.div>

            {/* Helper text */}
            <motion.p variants={BUTTON_VARIANTS} className="mt-6 text-xs text-gray-400">
              Organize your files into folders for better management
            </motion.p>
          </div>
        </motion.section>
      </LazyMotion>
    )
  },
)
FolderEmptyState.displayName = "FolderEmptyState"

// Shared Empty State Icons
const SharedIconDisplay = memo(({ isDragging }: { isDragging: boolean }) => (
  <div className="flex justify-center isolate relative">
    <IconContainer variant="left" isDragging={isDragging}>
      <Users className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="center" isDragging={isDragging}>
      <Share2 className="h-6 w-6" />
    </IconContainer>
    <IconContainer variant="right" isDragging={isDragging}>
      <UserPlus className="h-6 w-6" />
    </IconContainer>
  </div>
))
SharedIconDisplay.displayName = "SharedIconDisplay"

export const SharedEmptyState = forwardRef<HTMLDivElement>((props, ref) => {
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
          "group relative flex min-h-[400px] flex-col items-center justify-center rounded-xl p-8 transition-all duration-300 overflow-hidden",
          "border-dashed border-2",
          "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50",
        )}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        {/* Animated background particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <motion.div
            className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-blue-400/5 blur-3xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-cyan-400/5 blur-3xl"
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
          {/* Animated icons group */}
          <div className="mb-8">
            <SharedIconDisplay isDragging={false} />
          </div>

          {/* Title and description */}
          <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-8">
            <h2
              id={titleId}
              className="text-xl font-semibold transition-colors duration-300 text-gray-900"
            >
              No Shared Files Yet
            </h2>
            <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Files shared with your team will appear here. Share files to collaborate with others
            </p>
          </motion.div>

          {/* Helper text */}
          <motion.p variants={BUTTON_VARIANTS} className="mt-6 text-xs text-gray-400">
            Collaborate with your team by sharing rosbag files
          </motion.p>
        </div>
      </motion.section>
    </LazyMotion>
  )
})
SharedEmptyState.displayName = "SharedEmptyState"
