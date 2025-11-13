'use client'

import React, { useCallback } from 'react'
import { usePanelsStore, type GaugePanelConfig } from '@/store/panels-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface GaugeConfigProps {
  panelId: string
  config: GaugePanelConfig
}

export function GaugeConfig({ panelId, config }: GaugeConfigProps) {
  const { metadata, updateGaugePanel } = usePanelsStore()

  const handleTopicChange = useCallback(
    (topic: string) => {
      updateGaugePanel(panelId, { topic })
    },
    [panelId, updateGaugePanel]
  )

  const handleMessagePathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateGaugePanel(panelId, { messagePath: e.target.value })
    },
    [panelId, updateGaugePanel]
  )

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateGaugePanel(panelId, { label: e.target.value || undefined })
    },
    [panelId, updateGaugePanel]
  )

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value)) {
        updateGaugePanel(panelId, { min: value })
      }
    },
    [panelId, updateGaugePanel]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value)) {
        updateGaugePanel(panelId, { max: value })
      }
    },
    [panelId, updateGaugePanel]
  )

  const handleColorModeChange = useCallback(
    (value: string) => {
      updateGaugePanel(panelId, { colorMode: value as 'preset' | 'custom' })
    },
    [panelId, updateGaugePanel]
  )

  const handleColorMapChange = useCallback(
    (value: string) => {
      updateGaugePanel(panelId, { 
        colorMap: value as 'red-to-green' | 'rainbow' | 'turbo' 
      })
    },
    [panelId, updateGaugePanel]
  )

  const handleCustomStartColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateGaugePanel(panelId, {
        customGradient: { ...config.customGradient, start: e.target.value }
      })
    },
    [panelId, config.customGradient, updateGaugePanel]
  )

  const handleCustomEndColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateGaugePanel(panelId, {
        customGradient: { ...config.customGradient, end: e.target.value }
      })
    },
    [panelId, config.customGradient, updateGaugePanel]
  )

  const handleReverseColorsChange = useCallback(
    (checked: boolean) => {
      updateGaugePanel(panelId, { reverseColors: checked })
    },
    [panelId, updateGaugePanel]
  )

  const handleReverseDirectionChange = useCallback(
    (checked: boolean) => {
      updateGaugePanel(panelId, { reverseDirection: checked })
    },
    [panelId, updateGaugePanel]
  )

  if (!metadata) return null

  return (
    <div className="space-y-4">
      {/* Topic Selection */}
      <div className="space-y-1.5">
        <Label htmlFor={`topic-${panelId}`} className="text-sm font-medium">
          Topic
        </Label>
        <Select value={config.topic} onValueChange={handleTopicChange}>
          <SelectTrigger id={`topic-${panelId}`} className="bg-white text-sm">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {metadata.topics.map((topic) => (
              <SelectItem key={topic.name} value={topic.name}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message Path */}
      <div className="space-y-1.5">
        <Label htmlFor={`path-${panelId}`} className="text-sm font-medium">
          Message path
        </Label>
        <Input
          id={`path-${panelId}`}
          type="text"
          value={config.messagePath}
          onChange={handleMessagePathChange}
          placeholder=".data"
          className="bg-white text-sm"
        />
      </div>

      {/* Custom Label */}
      <div className="space-y-1.5">
        <Label htmlFor={`label-${panelId}`} className="text-sm font-medium">
          Label (optional)
        </Label>
        <Input
          id={`label-${panelId}`}
          type="text"
          value={config.label || ''}
          onChange={handleLabelChange}
          placeholder={config.messagePath}
          className="bg-white text-sm"
        />
      </div>

      {/* Min/Max Range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`min-${panelId}`} className="text-sm font-medium">
            Min
          </Label>
          <Input
            id={`min-${panelId}`}
            type="number"
            value={config.min}
            onChange={handleMinChange}
            className="bg-white text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`max-${panelId}`} className="text-sm font-medium">
            Max
          </Label>
          <Input
            id={`max-${panelId}`}
            type="number"
            value={config.max}
            onChange={handleMaxChange}
            className="bg-white text-sm"
          />
        </div>
      </div>

      {/* Color Mode Selection */}
      <div className="space-y-1.5">
        <Label htmlFor={`color-mode-${panelId}`} className="text-sm font-medium">
          Color mode
        </Label>
        <Select value={config.colorMode} onValueChange={handleColorModeChange}>
          <SelectTrigger id={`color-mode-${panelId}`} className="bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="preset">Preset</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional: Preset Color Map */}
      {config.colorMode === 'preset' && (
        <div className="space-y-1.5">
          <Label htmlFor={`color-map-${panelId}`} className="text-sm font-medium">
            Color map
          </Label>
          <Select value={config.colorMap} onValueChange={handleColorMapChange}>
            <SelectTrigger id={`color-map-${panelId}`} className="bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="red-to-green">Red to green</SelectItem>
              <SelectItem value="rainbow">Rainbow</SelectItem>
              <SelectItem value="turbo">Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conditional: Custom Gradient */}
      {config.colorMode === 'custom' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`start-color-${panelId}`} className="text-sm font-medium">
              Start color
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: config.customGradient.start }}
              />
              <Input
                id={`start-color-${panelId}`}
                type="color"
                value={config.customGradient.start}
                onChange={handleCustomStartColorChange}
                className="w-24 h-8 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`end-color-${panelId}`} className="text-sm font-medium">
              End color
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: config.customGradient.end }}
              />
              <Input
                id={`end-color-${panelId}`}
                type="color"
                value={config.customGradient.end}
                onChange={handleCustomEndColorChange}
                className="w-24 h-8 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reverse Colors Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`reverse-colors-${panelId}`} className="text-sm font-medium">
          Reverse colors
        </Label>
        <Switch
          id={`reverse-colors-${panelId}`}
          checked={config.reverseColors}
          onCheckedChange={handleReverseColorsChange}
          className="data-[state=checked]:bg-indigo-500"
        />
      </div>

      {/* Reverse Direction Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`reverse-direction-${panelId}`} className="text-sm font-medium">
          Reverse direction
        </Label>
        <Switch
          id={`reverse-direction-${panelId}`}
          checked={config.reverseDirection}
          onCheckedChange={handleReverseDirectionChange}
          className="data-[state=checked]:bg-indigo-500"
        />
      </div>
    </div>
  )
}

