'use client'

import React, { useCallback } from 'react'
import { usePanelsStore } from '@/store/panels-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react'
import { formatTimestamp } from '@/lib/rosbag/mcap-reader'

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
    (value: number) => {
      setPlaybackSpeed(value)
    },
    [setPlaybackSpeed]
  )

  const handleReset = useCallback(() => {
    pause()
    setCurrentTime(metadata.startTime)
  }, [metadata.startTime, pause, setCurrentTime])

  return (
    <div className="bg-white/95 backdrop-blur-sm border shadow-lg rounded-xl p-3 flex items-center gap-3">
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPause}
        size="icon"
        className={`h-9 w-9 rounded-lg shadow-none transition-colors ${
          isPlaying
            ? 'bg-amber-200 border-amber-500 border text-amber-500 hover:bg-amber-500 hover:text-white'
            : 'bg-green-200 border-green-500 border text-green-500 hover:bg-green-500 hover:text-white'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      {/* Skip Controls */}
      <div className="flex items-center gap-1">
        <Button
          onClick={handleReset}
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          title="Reset to start"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <Button
          onClick={handleSkipBack}
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          title="Skip back 5s"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>

        <Button
          onClick={handleSkipForward}
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          title="Skip forward 5s"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Time & Slider */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-[200px]">
        <Slider
          value={[progress]}
          onValueChange={handleSliderChange}
          max={100}
          step={0.1}
          className="w-full cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
          <span>{formatTimestamp(currentTime, metadata.startTime)}</span>
          <span>{formatTimestamp(metadata.endTime, metadata.startTime)}</span>
        </div>
      </div>

      {/* Speed Control */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1.5"
            title="Playback speed"
          >
            <Gauge className="h-3.5 w-3.5" />
            {playbackSpeed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[100px]">
          {[0.25, 0.5, 1, 2, 4, 8].map((speed) => (
            <DropdownMenuItem 
              key={speed} 
              onClick={() => handleSpeedChange(speed)}
              className={`text-xs ${playbackSpeed === speed ? 'bg-indigo-50 text-indigo-600 font-medium' : ''}`}
            >
              {speed}x speed
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}



