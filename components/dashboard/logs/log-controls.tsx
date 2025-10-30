'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Download, Trash2, Settings, ArrowDown } from 'lucide-react'
import { useLogStore } from '@/store/log-store'
import { toast } from 'sonner'

interface LogControlsProps {
  onJumpToLatest: () => void
}

export function LogControls ({ onJumpToLatest }: LogControlsProps) {
  const {
    clearLogs,
    exportLogsAsJSON,
    exportLogsAsCSV,
    maxBufferSize,
    setMaxBufferSize,
    isAutoScrollEnabled,
    unreadCount,
    filteredLogs
  } = useLogStore()

  const [bufferSizeInput, setBufferSizeInput] = useState(maxBufferSize.toString())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      clearLogs()
    }
  }

  const handleSaveBufferSize = () => {
    const size = parseInt(bufferSizeInput, 10)
    if (isNaN(size) || size < 100 || size > 10000) {
      toast.error('Buffer size must be between 100 and 10000')
      return
    }
    setMaxBufferSize(size)
    toast.success(`Buffer size updated to ${size}`)
    setIsSettingsOpen(false)
  }

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export')
      return
    }
    exportLogsAsJSON()
  }

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export')
      return
    }
    exportLogsAsCSV()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Jump to Latest Button (shown when paused) */}
      {!isAutoScrollEnabled && unreadCount > 0 && (
        <Button
          size="sm"
          onClick={onJumpToLatest}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <ArrowDown className="h-4 w-4 mr-2" />
          Jump to Latest
          {unreadCount > 0 && (
            <span className="ml-2 bg-indigo-800 px-2 py-0.5 rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Export Dropdown */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportJSON}
                className="rounded-none hover:bg-gray-100 text-gray-700"
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <div className="w-px bg-gray-300" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-none hover:bg-gray-100 text-gray-700"
              >
                CSV
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export logs ({filteredLogs.length} entries)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Clear Logs */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear all logs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Log settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Log Settings</DialogTitle>
            <DialogDescription>
              Configure log viewer preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="buffer-size" className="text-sm font-medium">
                Buffer Size
              </Label>
              <div className="flex gap-2">
                <Input
                  id="buffer-size"
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={bufferSizeInput}
                  onChange={(e) => setBufferSizeInput(e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Button
                  onClick={handleSaveBufferSize}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Maximum number of log entries to keep in memory (100-10000)
              </p>
              <p className="text-xs text-gray-500">
                Current: {maxBufferSize} entries
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Statistics
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Total logs in buffer:</span>
                  <span className="font-mono text-gray-900">
                    {useLogStore.getState().logs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered logs displayed:</span>
                  <span className="font-mono text-gray-900">
                    {filteredLogs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buffer usage:</span>
                  <span className="font-mono text-gray-900">
                    {Math.round(
                      (useLogStore.getState().logs.length / maxBufferSize) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

