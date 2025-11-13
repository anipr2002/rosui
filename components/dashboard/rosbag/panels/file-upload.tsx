'use client'

import React, { useCallback, useState } from 'react'
import { usePanelsStore } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Clock, Radio, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatTimestamp } from '@/lib/rosbag/mcap-reader'

export function FileUpload() {
  const { file, metadata, isLoading, error, loadFile, clearFile } = usePanelsStore()
  const [isDragging, setIsDragging] = useState(false)

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

  // Show upload interface
  return (
    <Card className="shadow-none pt-0 rounded-xl border border-gray-200">
      <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:gap-4 items-start">
          <Upload className="h-5 w-5 mt-0.5 text-gray-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-gray-900">Upload MCAP File</CardTitle>
            <CardDescription className="text-xs text-gray-600 mt-1">
              Upload a rosbag file in MCAP format to visualize
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            isDragging ? 'text-indigo-500' : 'text-gray-400'
          }`} />
          
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {isDragging ? 'Drop your file here' : 'Drop MCAP file here'}
          </p>
          
          <p className="text-xs text-gray-500 mb-4">
            or click to browse
          </p>

          <input
            type="file"
            accept=".mcap"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input"
          />
          
          <label htmlFor="file-input">
            <Button
              type="button"
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-gray-200 border-gray-500 border-1 text-gray-500 hover:bg-gray-300 hover:text-gray-700"
            >
              Choose File
            </Button>
          </label>

          {error && (
            <p className="text-xs text-red-600 mt-4">{error}</p>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-1">Supported format:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>MCAP (.mcap) - ROS2 bag format</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}



