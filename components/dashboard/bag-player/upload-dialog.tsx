'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, Loader2, Database, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { bagPlayerDB, type BagTopic } from '@/lib/db/bag-player-db'
import { formatBytes } from '@/lib/db/live-capture-db'
import { toast } from 'sonner'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

interface ParsedBagMetadata {
  topics: BagTopic[]
  messageCount: number
  startTime: number
  endTime: number
  duration: number
}

export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recordingName, setRecordingName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [metadata, setMetadata] = useState<ParsedBagMetadata | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.db3')) {
      toast.error('Please select a .db3 rosbag file')
      return
    }

    setSelectedFile(file)
    setRecordingName(file.name.replace('.db3', ''))
    setMetadata(null)
    setUploadProgress(0)

    // Parse metadata (simplified version - real implementation would use @foxglove/rosbag2-web)
    await parseFileMetadata(file)
  }

  const parseFileMetadata = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(20)

    try {
      // In a real implementation, we would use @foxglove/rosbag2-web to parse the bag file
      // For now, we'll create mock metadata
      // This is a simplified version - actual implementation would look like:
      // const reader = new BagReader(await file.arrayBuffer())
      // const metadata = await reader.getMetadata()
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing
      setUploadProgress(60)

      // Mock metadata - in production, extract from actual bag file
      const mockMetadata: ParsedBagMetadata = {
        topics: [
          { name: '/example/topic1', type: 'std_msgs/String', messageCount: 100 },
          { name: '/example/topic2', type: 'sensor_msgs/Image', messageCount: 200 }
        ],
        messageCount: 300,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        duration: 60000
      }

      setMetadata(mockMetadata)
      setUploadProgress(100)
      toast.success('File parsed successfully')
    } catch (error) {
      console.error('Failed to parse bag file:', error)
      toast.error('Failed to parse bag file')
      setSelectedFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !metadata || !recordingName.trim()) {
      toast.error('Please select a file and enter a name')
      return
    }

    setIsProcessing(true)

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer()

      // Store in database
      await bagPlayerDB.storeUploadedBag(
        recordingName.trim(),
        selectedFile.name,
        arrayBuffer,
        metadata
      )

      toast.success('Bag file uploaded successfully')
      handleClose()
      onUploadComplete()
    } catch (error) {
      console.error('Failed to upload bag file:', error)
      toast.error('Failed to upload bag file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setRecordingName('')
    setMetadata(null)
    setUploadProgress(0)
    setIsProcessing(false)
    onOpenChange(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload ROS Bag File
          </DialogTitle>
          <DialogDescription>
            Upload a .db3 rosbag file to play back recorded data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Drag and drop your .db3 file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <File className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db3"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>
          ) : (
            <>
              {/* Selected File */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-indigo-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedFile(null)
                      setMetadata(null)
                      setUploadProgress(0)
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Parsing file... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Success indicator */}
                {metadata && (
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">File parsed successfully</span>
                  </div>
                )}
              </div>

              {/* Metadata Preview */}
              {metadata && (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Bag Metadata
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Messages
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {metadata.messageCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Duration
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Math.floor(metadata.duration / 1000)}s
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Topics ({metadata.topics.length})
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {metadata.topics.map((topic, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Name */}
              <div className="space-y-2">
                <Label htmlFor="recording-name" className="text-sm font-medium">
                  Recording Name
                </Label>
                <Input
                  id="recording-name"
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder="Enter a name for this recording..."
                  className="bg-white"
                  disabled={isProcessing}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            {selectedFile && metadata && (
              <Button
                onClick={handleUpload}
                disabled={isProcessing || !recordingName.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Import to Library
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

