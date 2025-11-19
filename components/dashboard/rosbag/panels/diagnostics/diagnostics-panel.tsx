'use client'

import React, { useMemo, useState } from 'react'
import { usePanelsStore, type DiagnosticsPanelConfig } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Trash2, Pin, Search } from 'lucide-react'
import { DiagnosticEntry } from './diagnostic-entry'
import { timestampToSeconds } from '@/lib/rosbag/mcap-reader'

interface DiagnosticsPanelProps {
  panelConfig: DiagnosticsPanelConfig
}

interface ProcessedDiagnostic {
  name: string
  hardware_id: string
  level: 0 | 1 | 2 | 3
  message: string
  values: Array<{ key: string; value: string }>
  timestamp: bigint
  isPinned: boolean
}

export function DiagnosticsPanel({ panelConfig }: DiagnosticsPanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    getDeserializedMessage,
    updateDiagnosticsPanel,
    togglePinnedDiagnostic,
    removePanel,
  } = usePanelsStore()

  const [expandedDiagnostics, setExpandedDiagnostics] = useState<Set<string>>(new Set())

  // Get and process diagnostic messages
  const diagnostics = useMemo(() => {
    if (!metadata) return []

    const messages = getMessagesForTopic(
      panelConfig.topic,
      metadata.startTime,
      currentTime
    )

    // Extract all diagnostic statuses from messages
    const allDiagnostics = new Map<string, ProcessedDiagnostic>()

    messages.forEach((msg) => {
      const data = getDeserializedMessage(msg)
      if (data && data.status && Array.isArray(data.status)) {
        data.status.forEach((status: any) => {
          const diagnosticKey = `${status.name}:${status.hardware_id}`
          allDiagnostics.set(diagnosticKey, {
            name: status.name || 'Unknown',
            hardware_id: status.hardware_id || '',
            level: status.level ?? 0,
            message: status.message || '',
            values: status.values || [],
            timestamp: msg.logTime,
            isPinned: panelConfig.pinnedDiagnostics.includes(diagnosticKey),
          })
        })
      }
    })

    return Array.from(allDiagnostics.values())
  }, [metadata, currentTime, panelConfig.topic, panelConfig.pinnedDiagnostics, getMessagesForTopic, getDeserializedMessage])

  // Filter and sort diagnostics
  const filteredDiagnostics = useMemo(() => {
    let filtered = diagnostics

    // Filter by minimum level
    filtered = filtered.filter((d) => d.level >= panelConfig.minLevel)

    // Filter by search
    if (panelConfig.searchFilter) {
      const search = panelConfig.searchFilter.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.hardware_id.toLowerCase().includes(search) ||
          d.message.toLowerCase().includes(search)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      // Pinned items always come first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // Then sort by selected criteria
      switch (panelConfig.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'level':
          return b.level - a.level // Higher levels first
        case 'time':
          return Number(b.timestamp - a.timestamp) // Most recent first
        default:
          return 0
      }
    })

    return filtered
  }, [diagnostics, panelConfig.minLevel, panelConfig.searchFilter, panelConfig.sortBy])

  // Count diagnostics by level
  const levelCounts = useMemo(() => {
    const counts = { ok: 0, warn: 0, error: 0, stale: 0 }
    diagnostics.forEach((d) => {
      if (d.level === 0) counts.ok++
      else if (d.level === 1) counts.warn++
      else if (d.level === 2) counts.error++
      else if (d.level === 3) counts.stale++
    })
    return counts
  }, [diagnostics])

  const toggleExpanded = (diagnosticKey: string) => {
    setExpandedDiagnostics((prev) => {
      const next = new Set(prev)
      if (next.has(diagnosticKey)) {
        next.delete(diagnosticKey)
      } else {
        next.add(diagnosticKey)
      }
      return next
    })
  }

  const handleTogglePin = (diagnosticKey: string) => {
    togglePinnedDiagnostic(panelConfig.id, diagnosticKey)
  }

  if (!metadata) return null

  // Get available topics that might contain diagnostics
  const diagnosticTopics = metadata.topics.filter(
    (t) => t.name.includes('diagnostic') || t.type?.includes('DiagnosticArray')
  )

  const getLevelBadge = () => {
    const worstLevel = Math.max(...diagnostics.map((d) => d.level), 0)
    if (worstLevel === 2) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
          {levelCounts.error} ERROR{levelCounts.error !== 1 ? 'S' : ''}
        </Badge>
      )
    }
    if (worstLevel === 1) {
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs">
          {levelCounts.warn} WARN{levelCounts.warn !== 1 ? 'S' : ''}
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
        {levelCounts.ok} OK
      </Badge>
    )
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border-blue-300">
      <CardHeader className="bg-blue-50 border-blue-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <Activity className="h-5 w-5 mt-0.5 text-blue-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-blue-900">
              Diagnostics
            </CardTitle>
            <p className="text-xs text-blue-700 mt-1">
              {panelConfig.topic} • {filteredDiagnostics.length} of {diagnostics.length}
            </p>
          </div>
          {getLevelBadge()}
          <Button
            onClick={() => removePanel(panelConfig.id)}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 h-7 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Topic Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Topic</label>
            <Select
              value={panelConfig.topic}
              onValueChange={(value) =>
                updateDiagnosticsPanel(panelConfig.id, { topic: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diagnosticTopics.map((topic) => (
                  <SelectItem key={topic.name} value={topic.name} className="text-xs">
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Level Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Min Level</label>
            <Select
              value={panelConfig.minLevel.toString()}
              onValueChange={(value) =>
                updateDiagnosticsPanel(panelConfig.id, {
                  minLevel: parseInt(value) as 0 | 1 | 2 | 3,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">OK</SelectItem>
                <SelectItem value="1" className="text-xs">WARN</SelectItem>
                <SelectItem value="2" className="text-xs">ERROR</SelectItem>
                <SelectItem value="3" className="text-xs">STALE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Sort By</label>
            <Select
              value={panelConfig.sortBy}
              onValueChange={(value) =>
                updateDiagnosticsPanel(panelConfig.id, {
                  sortBy: value as 'name' | 'level' | 'time',
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name" className="text-xs">Name</SelectItem>
                <SelectItem value="level" className="text-xs">Level</SelectItem>
                <SelectItem value="time" className="text-xs">Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search diagnostics..."
            value={panelConfig.searchFilter}
            onChange={(e) =>
              updateDiagnosticsPanel(panelConfig.id, {
                searchFilter: e.target.value,
              })
            }
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Diagnostics List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredDiagnostics.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No diagnostics found
            </div>
          ) : (
            filteredDiagnostics.map((diagnostic) => {
              const diagnosticKey = `${diagnostic.name}:${diagnostic.hardware_id}`
              return (
                <DiagnosticEntry
                  key={diagnosticKey}
                  diagnostic={diagnostic}
                  diagnosticKey={diagnosticKey}
                  isExpanded={expandedDiagnostics.has(diagnosticKey)}
                  onToggleExpanded={() => toggleExpanded(diagnosticKey)}
                  onTogglePin={() => handleTogglePin(diagnosticKey)}
                  startTime={metadata.startTime}
                />
              )
            })
          )}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex gap-3">
            <span className="text-green-600">{levelCounts.ok} OK</span>
            {levelCounts.warn > 0 && (
              <span className="text-amber-600">{levelCounts.warn} WARN</span>
            )}
            {levelCounts.error > 0 && (
              <span className="text-red-600">{levelCounts.error} ERROR</span>
            )}
            {levelCounts.stale > 0 && (
              <span className="text-gray-600">{levelCounts.stale} STALE</span>
            )}
          </div>
          <span>Total: {diagnostics.length}</span>
        </div>
      </CardContent>
    </Card>
  )
}
