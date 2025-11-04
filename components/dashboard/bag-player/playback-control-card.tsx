'use client'

import { Play, Pause, Square, Loader2, Clock, Radio as RadioIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useBagPlayerStore, formatPlaybackTime } from '@/store/bag-player-store'

const SPEED_OPTIONS = [
  { value: '0.1', label: '0.1x' },
  { value: '0.25', label: '0.25x' },
  { value: '0.5', label: '0.5x' },
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '5', label: '5x' }
]

export function PlaybackControlCard() {
  const {
    currentRecording,
    status,
    currentTime,
    playbackSpeed,
    recordingStartTime,
    recordingEndTime,
    selectedTopics,
    play,
    pause,
    stop,
    seek,
    setPlaybackSpeed
  } = useBagPlayerStore()

  const isPlaying = status === 'playing'
  const isPaused = status === 'paused'
  const isLoading = status === 'loading'
  const hasRecording = currentRecording !== null

  const duration = recordingEndTime && recordingStartTime 
    ? recordingEndTime - recordingStartTime 
    : 0

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasRecording || duration === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    seek(Math.max(0, Math.min(newTime, duration)))
  }

  const getThemeColors = () => {
    if (isPlaying) {
      return {
        border: 'border-green-300',
        bg: 'bg-green-50',
        text: 'text-green-900',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700',
        badgeBorder: 'border-green-200'
      }
    } else if (isLoading) {
      return {
        border: 'border-amber-300',
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200'
      }
    } else {
      return {
        border: 'border-teal-300',
        bg: 'bg-teal-50',
        text: 'text-teal-900',
        badgeBg: 'bg-teal-100',
        badgeText: 'text-teal-700',
        badgeBorder: 'border-teal-200'
      }
    }
  }

  const theme = getThemeColors()

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${theme.border}`}>
      <CardHeader className={`${theme.bg} ${theme.border} border-b rounded-t-xl pt-6`}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <RadioIcon className={`h-5 w-5 mt-0.5 ${theme.text} ${isPlaying ? 'animate-pulse' : ''}`} />
          <div>
            <CardTitle className={`text-base ${theme.text}`}>
              Playback Control
            </CardTitle>
            <CardDescription className={`text-xs ${theme.text} opacity-80`}>
              {hasRecording
                ? currentRecording.name
                : 'No recording loaded'}
            </CardDescription>
          </div>
          <Badge
            className={`${theme.badgeBg} ${theme.badgeText} hover:${theme.badgeBg} ${theme.badgeBorder}`}
          >
            <div className="flex items-center gap-1.5">
              {isPlaying && (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
              <span className="text-xs">
                {isPlaying ? 'Playing' : isPaused ? 'Paused' : isLoading ? 'Loading' : 'Idle'}
              </span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {!hasRecording ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900 mb-2">
              No Recording Loaded
            </p>
            <p className="text-sm text-gray-500">
              Select a recording from the library to start playback
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-mono">{formatPlaybackTime(currentTime)}</span>
                <span className="font-mono">{formatPlaybackTime(duration)}</span>
              </div>

              {/* Progress Bar / Scrubber */}
              <div
                className="w-full bg-gray-200 rounded-full h-3 overflow-hidden cursor-pointer relative group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-teal-500 transition-all duration-100"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
                {/* Hover indicator */}
                <div className="absolute inset-0 bg-teal-600 opacity-0 group-hover:opacity-10 transition-opacity" />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{progressPercentage.toFixed(1)}% complete</span>
                <span>{selectedTopics.length} topics selected</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              {!isPlaying ? (
                <Button
                  onClick={play}
                  disabled={isLoading || selectedTopics.length === 0}
                  className="flex-1 bg-green-200 border-green-500 border-1 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2 fill-current" />
                      Play
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={pause}
                  className="flex-1 bg-amber-200 border-amber-500 border-1 text-amber-500 hover:bg-amber-500 hover:text-white"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}

              {/* Stop Button */}
              <Button
                onClick={stop}
                disabled={!isPlaying && !isPaused}
                variant="outline"
                className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>

              {/* Speed Selector */}
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-24 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning if no topics selected */}
            {selectedTopics.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  Please select at least one topic to start playback
                </p>
              </div>
            )}

            {/* Recording Info */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">Duration</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">
                  {formatPlaybackTime(duration)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">Topics</p>
                <p className="text-sm font-semibold text-gray-900">
                  {currentRecording.topics.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">Messages</p>
                <p className="text-sm font-semibold text-gray-900">
                  {currentRecording.messageCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

