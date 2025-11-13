'use client'

import React, { useCallback } from 'react'
import { usePanelsStore } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react'
import { formatTimestamp, timestampToSeconds } from '@/lib/rosbag/mcap-reader'

export function PlaybackControls() {
  const {
    metadata,
    currentTime,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    setCurrentTime,
    setPlaybackSpeed
  } = usePanelsStore()

  if (!metadata) {
    return null
  }

  const duration = Number(metadata.endTime - metadata.startTime)
  const currentRelative = Number(currentTime - metadata.startTime)
  const progress = duration > 0 ? (currentRelative / duration) * 100 : 0

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const newProgress = value[0]
      const newTime = metadata.startTime + BigInt(Math.floor((duration * newProgress) / 100))
      setCurrentTime(newTime)
    },
    [metadata.startTime, duration, setCurrentTime]
  )

  const handleSkipBack = useCallback(() => {
    const skipAmount = BigInt(5e9) // 5 seconds in nanoseconds
    const newTime = currentTime - skipAmount
    setCurrentTime(newTime)
  }, [currentTime, setCurrentTime])

  const handleSkipForward = useCallback(() => {
    const skipAmount = BigInt(5e9) // 5 seconds in nanoseconds
    const newTime = currentTime + skipAmount
    setCurrentTime(newTime)
  }, [currentTime, setCurrentTime])

  const handleSpeedChange = useCallback(
    (value: string) => {
      setPlaybackSpeed(Number.parseFloat(value))
    },
    [setPlaybackSpeed]
  )

  const handleReset = useCallback(() => {
    pause()
    setCurrentTime(metadata.startTime)
  }, [metadata.startTime, pause, setCurrentTime])

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-teal-200">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <Clock className="h-5 w-5 mt-0.5 text-teal-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-teal-900">Playback Controls</CardTitle>
          </div>
          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200 text-xs">
            {playbackSpeed}x
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Time Display */}
        <div className="flex items-center justify-between text-sm">
          <div className="font-mono text-gray-900">
            {formatTimestamp(currentTime, metadata.startTime)}
          </div>
          <div className="font-mono text-gray-500">
            {formatTimestamp(metadata.endTime, metadata.startTime)}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSliderChange}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleSkipBack}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              -5s
            </Button>

            <Button
              onClick={handlePlayPause}
              size="sm"
              className={
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-0'
                  : 'bg-green-500 hover:bg-green-600 text-white border-0'
              }
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={handleSkipForward}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              +5s
            </Button>

            <Button
              onClick={() => setCurrentTime(metadata.endTime)}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Speed:</span>
            <Select value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">0.25x</SelectItem>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="4">4x</SelectItem>
                <SelectItem value="8">8x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Progress: {progress.toFixed(1)}%
          </div>
          <div>
            {timestampToSeconds(currentTime - metadata.startTime).toFixed(2)}s / {' '}
            {timestampToSeconds(metadata.endTime - metadata.startTime).toFixed(2)}s
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



