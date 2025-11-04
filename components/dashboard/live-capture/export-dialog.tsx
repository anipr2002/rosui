'use client'

import { useState } from 'react'
import { Download, FileJson, Package, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useLiveCaptureStore } from '@/store/live-capture-store'
import type { ExportFormat } from '@/lib/db/live-capture-db'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordingId: number | null
}

export function ExportDialog ({ open, onOpenChange, recordingId }: ExportDialogProps) {
  const { settings, exportRecording } = useLiveCaptureStore()
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(settings.exportFormats)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedFormats, setExportedFormats] = useState<ExportFormat[]>([])

  const handleFormatToggle = (format: ExportFormat) => {
    if (selectedFormats.includes(format)) {
      // Don't allow removing all formats
      if (selectedFormats.length === 1) {
        toast.error('At least one export format must be selected')
        return
      }
      setSelectedFormats(selectedFormats.filter((f) => f !== format))
    } else {
      setSelectedFormats([...selectedFormats, format])
    }
  }

  const handleExport = async () => {
    if (!recordingId || selectedFormats.length === 0) {
      toast.error('No formats selected')
      return
    }

    setIsExporting(true)
    setExportedFormats([])

    try {
      await exportRecording(recordingId, selectedFormats)
      setExportedFormats(selectedFormats)
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false)
        setExportedFormats([])
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const formatInfo: Record<
    ExportFormat,
    {
      icon: React.ReactNode
      label: string
      description: string
      fileExt: string
    }
  > = {
    'simple-json': {
      icon: <FileJson className="h-5 w-5" />,
      label: 'Simple JSON',
      description: 'Lightweight JSON array with topic messages',
      fileExt: '.json'
    },
    'ros2-json': {
      icon: <FileJson className="h-5 w-5" />,
      label: 'ROS 2 JSON',
      description: 'Complete metadata with message type definitions',
      fileExt: '.json'
    },
    mcap: {
      icon: <Package className="h-5 w-5" />,
      label: 'MCAP',
      description: 'Modern ROS 2 bag format (experimental)',
      fileExt: '.mcap'
    }
  }

  const allFormats: ExportFormat[] = ['simple-json', 'ros2-json', 'mcap']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Recording
          </DialogTitle>
          <DialogDescription>
            Select export formats and download your recording
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Formats</Label>
            <div className="space-y-2">
              {allFormats.map((format) => {
                const info = formatInfo[format]
                const isSelected = selectedFormats.includes(format)
                const isExported = exportedFormats.includes(format)

                return (
                  <button
                    key={format}
                    onClick={() => handleFormatToggle(format)}
                    disabled={isExporting}
                    className={`w-full border rounded-lg p-4 text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${isExporting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isExported ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {info.icon}
                          <p className="text-sm font-semibold text-gray-900">{info.label}</p>
                          <span className="text-xs text-gray-500 font-mono ml-auto">
                            {info.fileExt}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {selectedFormats.length === 0
                ? 'Select at least one format to export'
                : selectedFormats.length === 1
                  ? '1 file will be downloaded'
                  : `${selectedFormats.length} files will be downloaded`}
            </p>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-900">Exporting...</p>
                  <p className="text-xs text-indigo-700">
                    Generating {selectedFormats.length} file{selectedFormats.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportedFormats.length > 0 && !isExporting && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Export completed!</p>
                  <p className="text-xs text-green-700">
                    {exportedFormats.length} file{exportedFormats.length > 1 ? 's' : ''} downloaded
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFormats.length === 0 || isExporting || !recordingId}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

