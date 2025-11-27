'use client'

import React, { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TFTreeConfig } from './types'

interface TFTreeSettingsProps {
  config: TFTreeConfig
  onConfigChange: (config: TFTreeConfig) => void
}

export function TFTreeSettings({ config, onConfigChange }: TFTreeSettingsProps) {
  const [localConfig, setLocalConfig] = useState<TFTreeConfig>(config)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleApply = () => {
    onConfigChange(localConfig)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all"
          title="Panel Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">TF Tree Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure transform tree visualization
            </p>
          </div>

          <div className="space-y-3">
            {/* Search Query */}
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs">Search Filter</Label>
              <Input
                id="search"
                className="h-8 text-xs"
                placeholder="Filter frames..."
                value={localConfig.searchQuery || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, searchQuery: e.target.value })}
              />
            </div>

            {/* Layout Direction */}
            <div className="space-y-1.5">
              <Label htmlFor="layout" className="text-xs">Layout Direction</Label>
              <Select
                value={localConfig.layoutDirection || 'TB'}
                onValueChange={(value) => setLocalConfig({ ...localConfig, layoutDirection: value as 'TB' | 'LR' | 'RL' | 'BT' })}
              >
                <SelectTrigger id="layout" className="h-8 text-xs">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TB">Top to Bottom</SelectItem>
                  <SelectItem value="LR">Left to Right</SelectItem>
                  <SelectItem value="RL">Right to Left</SelectItem>
                  <SelectItem value="BT">Bottom to Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stale Timeout */}
            <div className="space-y-1.5">
              <Label htmlFor="timeout" className="text-xs">Stale Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                step="1"
                className="h-8 text-xs"
                value={localConfig.staleTimeout ? localConfig.staleTimeout / 1000 : 10}
                onChange={(e) => setLocalConfig({ ...localConfig, staleTimeout: Number(e.target.value) * 1000 })}
              />
              <p className="text-xs text-muted-foreground">
                Frames older than this will be removed
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-minimap" className="text-xs">Show Minimap</Label>
                <Switch
                  id="show-minimap"
                  checked={localConfig.showMinimap !== false}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showMinimap: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-details" className="text-xs">Show Details Panel</Label>
                <Switch
                  id="show-details"
                  checked={localConfig.showDetailsPanel !== false}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showDetailsPanel: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
