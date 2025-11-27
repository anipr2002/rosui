'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Search, RefreshCw, Loader2 } from 'lucide-react'

interface NodeControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterSystemNodes: boolean
  onFilterSystemNodesChange: (value: boolean) => void
  showTopics: boolean
  onShowTopicsChange: (value: boolean) => void
  selectedNodePath: string | null
  onRefresh: () => void
  isLoading: boolean
}

export function NodeControls({
  searchQuery,
  onSearchChange,
  filterSystemNodes,
  onFilterSystemNodesChange,
  showTopics,
  onShowTopicsChange,
  selectedNodePath,
  onRefresh,
  isLoading
}: NodeControlsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white border rounded-lg">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes or topics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="filter-system"
            checked={filterSystemNodes}
            onCheckedChange={onFilterSystemNodesChange}
          />
          <Label htmlFor="filter-system" className="text-sm cursor-pointer">
            Hide system nodes
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-topics"
            checked={showTopics}
            onCheckedChange={onShowTopicsChange}
          />
          <Label htmlFor="show-topics" className="text-sm cursor-pointer">
            Show topics
          </Label>
        </div>

        {selectedNodePath && (
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground">
              Selected: <code className="bg-gray-100 px-1 rounded">{selectedNodePath}</code>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

