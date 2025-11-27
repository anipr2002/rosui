'use client'

import React, { useCallback, useState, useId, memo } from 'react'
import { usePanelsStore } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Clock, Radio, Loader2, X, FileVideo, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { formatTimestamp } from '@/lib/rosbag/mcap-reader'
import { cn } from '@/lib/utils'
import { motion, LazyMotion, domAnimation } from 'framer-motion'

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

export function FileUpload() {
  const { file, metadata, isLoading, error, loadFile, clearFile } = usePanelsStore()
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredButton, setHoveredButton] = useState(false)
  const titleId = useId()
  const descriptionId = useId()

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      // Validate file type
      if (!selectedFile.name.endsWith('.mcap')) {
        toast.error('Invalid file type. Please upload an MCAP file.')
        return
      }

      try {
        await loadFile(selectedFile)
        toast.success('MCAP file loaded successfully')
      } catch (error) {
        toast.error('Failed to load MCAP file')
        console.error(error)
      }
    },
    [loadFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  const handleClear = useCallback(() => {
    clearFile()
    toast.success('File cleared')
  }, [clearFile])

  const handleUploadClick = () => {
    document.getElementById('file-input')?.click()
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="shadow-none pt-0 rounded-xl border border-amber-300">
        <CardHeader className="bg-amber-50 border-amber-300 border-b rounded-t-xl pt-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
            <Loader2 className="h-5 w-5 mt-0.5 text-amber-600 animate-spin" />
            <div className="min-w-0">
              <CardTitle className="text-base text-amber-900">Loading MCAP File</CardTitle>
              <CardDescription className="text-xs text-amber-800 mt-1">
                Parsing rosbag data...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show file info if loaded
  if (file && metadata) {
    return (
      <Card className="shadow-none pt-0 rounded-xl border border-green-300">
        <CardHeader className="bg-green-50 border-green-300 border-b rounded-t-xl pt-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
            <FileText className="h-5 w-5 mt-0.5 text-green-600" />
            <div className="min-w-0">
              <CardTitle className="text-base text-green-900">MCAP File Loaded</CardTitle>
              <CardDescription className="text-xs text-green-800 mt-1 font-mono truncate">
                {file.name}
              </CardDescription>
            </div>
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Topics</p>
              </div>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {metadata.topics.length}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Messages</p>
              </div>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {metadata.totalMessages.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Duration</p>
              </div>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {formatTimestamp(metadata.endTime, metadata.startTime)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Available Topics</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {metadata.topics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border rounded-lg p-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-gray-900 truncate">{topic.name}</p>
                    <p className="text-xs text-gray-500 truncate">{topic.type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {topic.messageCount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show enhanced upload interface
  return (
    <LazyMotion features={domAnimation}>
      <motion.section
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
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
              {isDragging ? "Drop your file here!" : "Upload MCAP File"}
            </h2>
            <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
              {isDragging
                ? "Release to upload your MCAP file for visualization"
                : "Upload a rosbag file in MCAP format to visualize and analyze"}
            </p>
          </motion.div>

          {/* Action button */}
          <motion.div variants={BUTTON_VARIANTS} className="flex flex-wrap items-center justify-center gap-3">
            <input
              type="file"
              accept=".mcap"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
            />
            <Button
              variant="outline"
              className={cn(
                "group/btn relative overflow-hidden border-violet-200 px-5 transition-all duration-300 hover:border-violet-500 hover:bg-violet-50",
                hoveredButton && "border-violet-500 bg-violet-50",
              )}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              onClick={handleUploadClick}
            >
              <span
                className={cn(
                  "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-100 to-transparent transition-transform duration-700",
                  hoveredButton && "translate-x-full",
                )}
              />
              <Upload className="mr-2 h-4 w-4 text-violet-600 transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
              <span className="relative text-violet-600">Choose File</span>
            </Button>
          </motion.div>

          {/* Helper text */}
          <motion.p variants={BUTTON_VARIANTS} className="mt-6 text-xs text-gray-400">
            Supports .mcap files • For local visualization
          </motion.p>

          {error && (
            <motion.p variants={BUTTON_VARIANTS} className="mt-2 text-xs text-red-600">
              {error}
            </motion.p>
          )}
        </div>
      </motion.section>
    </LazyMotion>
  )
}



