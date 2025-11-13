'use client'

import React, { useCallback } from 'react'
import { usePanelsStore, type SeriesConfig } from '@/store/panels-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Eye, EyeOff } from 'lucide-react'

interface SeriesConfigProps {
  panelId: string
  series: SeriesConfig
}

export function SeriesConfigComponent({ panelId, series }: SeriesConfigProps) {
  const { metadata, updateSeries, removeSeries } = usePanelsStore()

  const handleTopicChange = useCallback(
    (topic: string) => {
      updateSeries(panelId, series.id, { topic })
    },
    [panelId, series.id, updateSeries]
  )

  const handlePathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSeries(panelId, series.id, { messagePath: e.target.value })
    },
    [panelId, series.id, updateSeries]
  )

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSeries(panelId, series.id, { label: e.target.value })
    },
    [panelId, series.id, updateSeries]
  )

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSeries(panelId, series.id, { color: e.target.value })
    },
    [panelId, series.id, updateSeries]
  )

  const handleToggleEnabled = useCallback(
    (enabled: boolean) => {
      updateSeries(panelId, series.id, { enabled })
    },
    [panelId, series.id, updateSeries]
  )

  const handleRemove = useCallback(() => {
    removeSeries(panelId, series.id)
  }, [panelId, series.id, removeSeries])

  if (!metadata) return null

  return (
    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded border border-gray-300"
            style={{ backgroundColor: series.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {series.label || 'Unnamed Series'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={series.enabled}
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-indigo-500"
          />
          <Button
            onClick={handleRemove}
            size="sm"
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Topic Selection */}
        <div className="space-y-1.5">
          <Label htmlFor={`topic-${series.id}`} className="text-xs font-medium">
            Topic
          </Label>
          <Select value={series.topic} onValueChange={handleTopicChange}>
            <SelectTrigger id={`topic-${series.id}`} className="bg-white text-sm">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {metadata.topics.map((topic) => (
                <SelectItem key={topic.name} value={topic.name} className="text-sm">
                  <div className="flex flex-col items-start">
                    <span className="font-mono">{topic.name}</span>
                    <span className="text-xs text-gray-500">{topic.type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Path */}
        <div className="space-y-1.5">
          <Label htmlFor={`path-${series.id}`} className="text-xs font-medium">
            Message Path
          </Label>
          <Input
            id={`path-${series.id}`}
            type="text"
            value={series.messagePath}
            onChange={handlePathChange}
            placeholder=".data"
            className="bg-white font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            e.g., .data, .pose.position.x, .array[0]
          </p>
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor={`label-${series.id}`} className="text-xs font-medium">
            Label
          </Label>
          <Input
            id={`label-${series.id}`}
            type="text"
            value={series.label}
            onChange={handleLabelChange}
            placeholder="Series label"
            className="bg-white text-sm"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <Label htmlFor={`color-${series.id}`} className="text-xs font-medium">Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded border-2 border-gray-300"
              style={{ backgroundColor: series.color }}
            />
            <Input
              id={`color-${series.id}`}
              type="color"
              value={series.color}
              onChange={handleColorChange}
              className="w-24 h-8 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


