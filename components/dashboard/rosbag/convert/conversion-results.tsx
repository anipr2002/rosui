'use client'

import React, { useState } from 'react'
import { useRosbagConvertStore } from '@/store/rosbag-convert-store'
import { formatFileSize, formatDuration } from '@/lib/rosbag/converter'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Download, CheckCircle, FileCode, Info, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ConversionResults() {
  const { status, metadata, outputData, inputFile, downloadMcap, reset } =
    useRosbagConvertStore()
  const [filename, setFilename] = useState('')

  const isCompleted = status === 'completed'
  const hasResults = metadata !== null && outputData !== null

  if (!isCompleted || !hasResults) {
    return null
  }

  const handleDownload = () => {
    try {
      const trimmedFilename = filename.trim()
      downloadMcap(trimmedFilename || undefined)
      toast.success('MCAP file downloaded successfully')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to download file'
      toast.error(message)
      console.error('Download error:', error)
    }
  }

  const handleClear = () => {
    setFilename('')
    reset()
    toast.success('Results cleared')
  }

  const compressionRatio =
    metadata.inputSize > 0
      ? ((1 - metadata.outputSize / metadata.inputSize) * 100).toFixed(1)
      : '0'

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-green-300">
      <CardHeader className="bg-green-50 border-green-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />

          <div className="min-w-0">
            <CardTitle className="text-base text-green-900">
              Conversion Results
            </CardTitle>
            <CardDescription className="text-xs text-green-800 mt-1">
              Download your converted MCAP file
            </CardDescription>
          </div>

          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
            Success
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600 mb-3">
            Conversion Statistics
          </p>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Topics</span>
            <span className="text-sm font-mono text-gray-900">
              {metadata.topicCount}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Messages</span>
            <span className="text-sm font-mono text-gray-900">
              {metadata.messageCount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Duration</span>
            <span className="text-sm font-mono text-gray-900">
              {formatDuration(metadata.duration)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Input Size</span>
            <span className="text-sm font-mono text-gray-900">
              {formatFileSize(metadata.inputSize)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Output Size</span>
            <span className="text-sm font-mono text-gray-900">
              {formatFileSize(metadata.outputSize)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              Size Change
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Positive values indicate compression, negative values
                      indicate the output is larger
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span
              className={`text-sm font-mono ${
                Number.parseFloat(compressionRatio) > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {Number.parseFloat(compressionRatio) > 0 ? '-' : '+'}
              {Math.abs(Number.parseFloat(compressionRatio))}%
            </span>
          </div>
        </div>

        <Separator />

        {/* Topic Details */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="topics">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-gray-600" />
                <span>Topic Details</span>
                <Badge variant="outline" className="text-xs">
                  {metadata.topics.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 mt-2">
                {metadata.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border rounded-lg p-3 space-y-1"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-mono text-gray-900 break-all">
                        {topic.name}
                      </p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {topic.messageCount}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {topic.type}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        {/* Download Section */}
        <div className="space-y-3">
          <Label
            htmlFor="filename"
            className="text-sm font-medium flex items-center gap-2"
          >
            Output Filename
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Optional custom filename. If empty, will use the input
                    filename with .mcap extension
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <Input
            id="filename"
            type="text"
            placeholder={
              inputFile
                ? inputFile.name.replace(/\.(bag|db3)$/i, '.mcap')
                : 'output.mcap'
            }
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="bg-white"
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Download MCAP
            </Button>

            <Button
              onClick={handleClear}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


