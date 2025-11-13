'use client'

import React from 'react'
import { useRosbagConvertStore } from '@/store/rosbag-convert-store'
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
import { RefreshCw, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

export function ConversionControls() {
  const { status, inputFile, progress, error, convertFile, reset } =
    useRosbagConvertStore()

  const isConverting = status === 'converting'
  const isCompleted = status === 'completed'
  const isError = status === 'error'
  const canConvert = inputFile !== null && status === 'idle'

  const handleConvert = async () => {
    try {
      await convertFile()
      toast.success('Conversion completed successfully!')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to convert file'
      toast.error(message)
      console.error('Conversion error:', err)
    }
  }

  const handleReset = () => {
    reset()
    toast.info('Converter reset')
  }

  const getStatusColor = () => {
    switch (status) {
      case 'converting':
        return 'indigo'
      case 'completed':
        return 'green'
      case 'error':
        return 'red'
      default:
        return 'gray'
    }
  }

  const statusColor = getStatusColor()

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-indigo-300">
      <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <RefreshCw className="h-5 w-5 mt-0.5 text-indigo-600" />

          <div className="min-w-0">
            <CardTitle className="text-base text-indigo-900">
              Conversion Controls
            </CardTitle>
            <CardDescription className="text-xs text-indigo-800 mt-1">
              Convert your rosbag file to MCAP format
            </CardDescription>
          </div>

          <Badge
            className={`bg-${statusColor}-100 text-${statusColor}-700 hover:bg-${statusColor}-100 border-${statusColor}-200 text-xs flex items-center gap-1.5`}
          >
            {isConverting && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {isCompleted && <CheckCircle className="h-3 w-3" />}
            {isError && <AlertCircle className="h-3 w-3" />}
            {status === 'converting'
              ? 'Converting'
              : status === 'completed'
                ? 'Complete'
                : status === 'error'
                  ? 'Error'
                  : 'Ready'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* No File Selected Warning */}
        {!inputFile && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                No File Selected
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Please select a rosbag file to begin conversion
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isError && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                Conversion Failed
              </p>
              <p className="text-xs text-red-700 mt-1 font-mono">{error}</p>
            </div>
          </div>
        )}

        {/* Progress Status */}
        {isConverting && progress && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-900">
                  {progress.status}
                </p>
                {progress.messagesProcessed !== undefined && (
                  <p className="text-xs text-indigo-700 mt-1 font-mono">
                    Processed {progress.messagesProcessed.toLocaleString()}{' '}
                    messages
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Conversion Complete
              </p>
              <p className="text-xs text-green-700 mt-1">
                Your MCAP file is ready for download
              </p>
            </div>
          </div>
        )}

        {/* Convert Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleConvert}
            disabled={!canConvert || isConverting}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white border-0"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert to MCAP
              </>
            )}
          </Button>

          {(isCompleted || isError) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset and convert another file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              About MCAP Format
            </p>
            <p className="text-xs text-blue-700 mt-1">
              MCAP is a modern container format for multimodal log data. It's
              optimized for robotics data and supported by tools like Foxglove
              Studio.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

