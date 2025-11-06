'use client'

import { useState, useEffect } from 'react'
import { Database, Search, Trash2, Play, Upload, Clock, HardDrive } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { bagPlayerDB, type UnifiedRecording, formatTimestamp } from '@/lib/db/bag-player-db'
import { formatBytes } from '@/lib/db/live-capture-db'
import { toast } from 'sonner'
import { useBagPlayerStore } from '@/store/bag-player-store'

interface RecordingSelectorProps {
  onUploadClick: () => void
}

export function RecordingSelector({ onUploadClick }: RecordingSelectorProps) {
  const [recordings, setRecordings] = useState<UnifiedRecording[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { currentRecording, loadRecording } = useBagPlayerStore()

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    setIsLoading(true)
    try {
      const allRecordings = await bagPlayerDB.getAllRecordings()
      setRecordings(allRecordings)
    } catch (error) {
      console.error('Failed to load recordings:', error)
      toast.error('Failed to load recordings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadRecordings()
      return
    }

    try {
      const results = await bagPlayerDB.searchRecordings(searchQuery)
      setRecordings(results)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    }
  }

  const handleDelete = async (recording: UnifiedRecording, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm(`Delete recording "${recording.name}"?`)) {
      return
    }

    try {
      await bagPlayerDB.deleteRecording(recording)
      toast.success('Recording deleted')
      await loadRecordings()
    } catch (error) {
      console.error('Failed to delete recording:', error)
      toast.error('Failed to delete recording')
    }
  }

  const handleLoadRecording = async (recording: UnifiedRecording) => {
    try {
      await loadRecording(recording)
    } catch (error) {
      console.error('Failed to load recording:', error)
      toast.error('Failed to load recording')
    }
  }

  const filteredRecordings = searchQuery
    ? recordings
    : recordings

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-300">
      <CardHeader className="bg-purple-50 border-purple-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Database className="h-5 w-5 mt-0.5 text-purple-900" />
          <div>
            <CardTitle className="text-base text-purple-900">
              Recording Library
            </CardTitle>
            <CardDescription className="text-xs text-purple-900 opacity-80">
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
          <Button
            onClick={onUploadClick}
            size="sm"
            className="bg-purple-200 border-purple-500 border-1 text-purple-500 hover:bg-purple-500 hover:text-white"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recordings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-white"
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              Search
            </Button>
          </div>

          {/* Recording List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Loading recordings...
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  No recordings found
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a bag file or record topics using Live Capture
                </p>
                <Button
                  onClick={onUploadClick}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Bag File
                </Button>
              </div>
            ) : (
              filteredRecordings.map((recording) => {
                const isActive = currentRecording?.id === recording.id && 
                                 currentRecording?.source === recording.source
                const duration = recording.duration || 0
                const durationStr = `${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}`

                return (
                  <div
                    key={`${recording.source}-${recording.id}`}
                    className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      isActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleLoadRecording(recording)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {recording.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              recording.source === 'indexeddb'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {recording.source === 'indexeddb' ? 'Live' : 'Upload'}
                          </Badge>
                          {isActive && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{durationStr}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>{recording.messageCount.toLocaleString()} msgs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatBytes(recording.sizeBytes)}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {recording.topics.slice(0, 3).map((topic, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                            >
                              {topic.name}
                            </Badge>
                          ))}
                          {recording.topics.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                            >
                              +{recording.topics.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(recording.startTime)}
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLoadRecording(recording)
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDelete(recording, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



