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
import type { RqtGraphConfig } from './types'
import type { LayoutDirection } from '@/lib/rqt-reactflow/layout-rqt-graph'

interface RqtGraphSettingsProps {
  config: RqtGraphConfig
  onConfigChange: (config: RqtGraphConfig) => void
}

export function RqtGraphSettings({ config, onConfigChange }: RqtGraphSettingsProps) {
  const [localConfig, setLocalConfig] = useState<RqtGraphConfig>(config)
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
          className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all opacity-0 group-hover:opacity-100"
          title="Panel Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Graph Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure graph visualization
            </p>
          </div>

          <div className="space-y-3">
            {/* Search Query */}
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs">Search Filter</Label>
              <Input
                id="search"
                className="h-8 text-xs"
                placeholder="Filter nodes/topics..."
                value={localConfig.searchQuery || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, searchQuery: e.target.value })}
              />
            </div>

            {/* Layout Direction */}
            <div className="space-y-1.5">
              <Label htmlFor="layout" className="text-xs">Layout Direction</Label>
              <Select
                value={localConfig.layoutDirection || 'LR'}
                onValueChange={(value) => setLocalConfig({ ...localConfig, layoutDirection: value as LayoutDirection })}
              >
                <SelectTrigger id="layout" className="h-8 text-xs">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LR">Left to Right</SelectItem>
                  <SelectItem value="TB">Top to Bottom</SelectItem>
                  <SelectItem value="RL">Right to Left</SelectItem>
                  <SelectItem value="BT">Bottom to Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-topics" className="text-xs">Show Topics</Label>
                <Switch
                  id="show-topics"
                  checked={localConfig.showTopics !== false}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showTopics: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-system" className="text-xs">Hide System Nodes</Label>
                <Switch
                  id="hide-system"
                  checked={localConfig.filterSystemNodes !== false}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, filterSystemNodes: checked })}
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
