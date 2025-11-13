'use client'

import React, { useState, useRef } from 'react'
import { useRosbagConvertStore } from '@/store/rosbag-convert-store'
import { isValidRosbagFile, formatFileSize } from '@/lib/rosbag/converter'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Upload, FileCode, X, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

export function FileUploader() {
  const { inputFile, setInputFile, status } = useRosbagConvertStore()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisabled = status === 'converting'

  const handleFileSelect = (file: File) => {
    if (!isValidRosbagFile(file)) {
      toast.error('Invalid file type. Please select a .bag or .db3 file.')
      return
    }

    // Warn for large files
    if (file.size > 500 * 1024 * 1024) {
      // 500MB
      toast.warning(
        'Large file detected. Conversion may take several minutes and consume significant memory.'
      )
    }

    setInputFile(file)
    toast.success('File selected successfully')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDisabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (isDisabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setInputFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-purple-300">
      <CardHeader className="bg-purple-50 border-purple-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <Upload className="h-5 w-5 mt-0.5 text-purple-600" />

          <div className="min-w-0">
            <CardTitle className="text-base text-purple-900">
              Select Rosbag File
            </CardTitle>
            <CardDescription className="text-xs text-purple-800 mt-1">
              Upload a .bag or .db3 file to convert to MCAP format
            </CardDescription>
          </div>

          {inputFile && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs">
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-purple-400 bg-purple-50' : 'border-gray-300 bg-white'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400 hover:bg-purple-50'}
          `}
          onClick={!isDisabled ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".bag,.db3"
            onChange={handleInputChange}
            disabled={isDisabled}
            className="hidden"
          />

          {inputFile ? (
            <div className="space-y-3">
              <FileCode className="h-12 w-12 text-purple-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {inputFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(inputFile.size)}
                </p>
              </div>
              {!isDisabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  Drop your rosbag file here
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  .bag
                </Badge>
                <Badge variant="outline" className="text-xs">
                  .db3
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Supported Formats
            </p>
            <p className="text-xs text-blue-700 mt-1">
              ROS2 bag files (.bag, .db3) are supported. The conversion happens
              entirely in your browser, so no data is uploaded to any server.
            </p>
          </div>
        </div>

        {/* Warning for large files */}
        {inputFile && inputFile.size > 100 * 1024 * 1024 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Large File Detected
              </p>
              <p className="text-xs text-amber-700 mt-1">
                This file is quite large ({formatFileSize(inputFile.size)}).
                Conversion may take several minutes and use significant memory.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



