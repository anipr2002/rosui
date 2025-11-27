'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useLifecycleNodesStore, LifecycleState } from '@/store/lifecycle-nodes-store'
import { LifecycleNodeCard } from './lifecycle-node-card'
import { LifecycleEmptyState } from './lifecycle-empty-state'
import { CombinedLifecycleTimeline } from './combined-lifecycle-timeline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, SortAsc, SortDesc, X, Loader2, LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type SortBy = 'name' | 'state' | 'lastSeen'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'timeline'

export function LifecycleNodeList() {
  const {
    lifecycleNodes,
    nodeCount,
    lifecycleNodeCount,
    isLoading,
    fetchAllNodes
  } = useLifecycleNodesStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState<LifecycleState | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Initial fetch
  useEffect(() => {
    if (lifecycleNodes.size === 0) {
      fetchAllNodes()
    }
  }, [fetchAllNodes, lifecycleNodes.size])

  // Filter and sort nodes
  const filteredNodes = useMemo(() => {
    let nodes = Array.from(lifecycleNodes.values())

    // Filter by state
    if (filterState !== 'all') {
      nodes = nodes.filter((node) => node.currentState === filterState)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      nodes = nodes.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.fullPath.toLowerCase().includes(query) ||
          node.namespace.toLowerCase().includes(query)
      )
    }

    // Sort
    nodes.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'state':
          const stateOrder: Record<LifecycleState, number> = {
            active: 0,
            inactive: 1,
            unconfigured: 2,
            finalized: 3,
            unknown: 4
          }
          comparison = stateOrder[a.currentState] - stateOrder[b.currentState]
          break
        case 'lastSeen':
          comparison = b.lastSeen - a.lastSeen
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return nodes
  }, [lifecycleNodes, searchQuery, filterState, sortBy, sortOrder])

  const toggleNodeExpanded = (nodeName: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeName)) {
        next.delete(nodeName)
      } else {
        next.add(nodeName)
      }
      return next
    })
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterState('all')
  }

  const hasActiveFilters = searchQuery.trim() !== '' || filterState !== 'all'

  // Loading state
  if (isLoading && lifecycleNodes.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading lifecycle nodes...</p>
        </div>
      </div>
    )
  }

  // Empty state - no nodes at all
  if (nodeCount === 0) {
    return <LifecycleEmptyState hasNodes={false} />
  }

  // Empty state - no lifecycle nodes
  if (lifecycleNodeCount === 0) {
    return <LifecycleEmptyState hasNodes={true} />
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterState} onValueChange={(v) => setFilterState(v as LifecycleState | 'all')}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Filter state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="unconfigured">Unconfigured</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[120px] bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="lastSeen">Last Seen</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              className="bg-white"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* View Toggle and Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredNodes.length} of {lifecycleNodeCount} lifecycle nodes
            </p>
            {hasActiveFilters && (
              <div className="flex gap-1">
                {filterState !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    State: {filterState}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchQuery}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">View:</span>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
              <ToggleGroupItem value="grid" size="sm" aria-label="Grid View">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="timeline" size="sm" aria-label="Timeline View">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredNodes.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            No nodes match your filters.{' '}
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNodes.map((node) => (
                <LifecycleNodeCard
                  key={node.fullPath}
                  node={node}
                  isExpanded={expandedNodes.has(node.fullPath)}
                  onToggleExpand={() => toggleNodeExpanded(node.fullPath)}
                />
              ))}
            </div>
          ) : (
            <div className="h-[600px]">
              <CombinedLifecycleTimeline nodes={filteredNodes} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

