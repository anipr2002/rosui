'use client'

import React, { useState } from 'react'
import { useDiagnosticsStore } from '@/store/diagnostics-store'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@/components/ui/collapsible'
import { CpuMemoryDisplay } from './cpu-memory-display'
import { NodeDetailsPanel } from './node-details-panel'
import { Activity, ChevronDown, ChevronRight, Info } from 'lucide-react'

interface NodeStatusCardProps {
  nodeName: string
}

export function NodeStatusCard({ nodeName }: NodeStatusCardProps) {
  const { nodes } = useDiagnosticsStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const nodeMetrics = nodes.get(nodeName)
  if (!nodeMetrics) {
    return null
  }

  const getStatusColors = () => {
    switch (nodeMetrics.level) {
      case 0: // OK
        return {
          border: 'border-green-300',
          headerBg: 'bg-green-50',
          headerText: 'text-green-900',
          descriptionText: 'text-green-800',
          iconColor: 'text-green-600'
        }
      case 1: // WARN
        return {
          border: 'border-amber-300',
          headerBg: 'bg-amber-50',
          headerText: 'text-amber-900',
          descriptionText: 'text-amber-800',
          iconColor: 'text-amber-600'
        }
      case 2: // ERROR
        return {
          border: 'border-red-300',
          headerBg: 'bg-red-50',
          headerText: 'text-red-900',
          descriptionText: 'text-red-800',
          iconColor: 'text-red-600'
        }
      case 3: // STALE
        return {
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          headerText: 'text-gray-900',
          descriptionText: 'text-gray-700',
          iconColor: 'text-gray-400'
        }
      default:
        return {
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          headerText: 'text-gray-900',
          descriptionText: 'text-gray-700',
          iconColor: 'text-gray-400'
        }
    }
  }

  const getStatusBadge = () => {
    switch (nodeMetrics.level) {
      case 0:
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
            OK
          </Badge>
        )
      case 1:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs">
            WARN
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
            ERROR
          </Badge>
        )
      case 3:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 text-xs">
            STALE
          </Badge>
        )
      default:
        return null
    }
  }

  const getLevelLabel = (level: number): string => {
    switch (level) {
      case 0:
        return 'OK'
      case 1:
        return 'WARN'
      case 2:
        return 'ERROR'
      case 3:
        return 'STALE'
      default:
        return 'UNKNOWN'
    }
  }

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    return new Date(timestamp).toLocaleTimeString()
  }

  const colors = getStatusColors()
  const tooltipColor = nodeMetrics.level === 0 ? 'green' : nodeMetrics.level === 1 ? 'amber' : nodeMetrics.level === 2 ? 'red' : 'gray'

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${colors.border}`}>
      <CardHeader
        className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}
      >
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Activity
              className={`h-5 w-5 mt-0.5 ${colors.iconColor} flex-shrink-0`}
            />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className={`text-sm sm:text-base ${colors.headerText} truncate cursor-help block`}
                    title={nodeMetrics.name}
                  >
                    {nodeMetrics.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs" colorVariant={tooltipColor}>
                  <p className="break-words">{nodeMetrics.name}</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2">
                <CardDescription
                  className={`text-xs ${colors.descriptionText} truncate`}
                >
                  {nodeMetrics.message || 'No message'}
                </CardDescription>
                {nodeMetrics.sourceTopic && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-100 text-gray-600 border-gray-300 cursor-help"
                      >
                        {nodeMetrics.sourceTopic === '/diagnostics' ? 'System' : nodeMetrics.sourceTopic === '/diagnostics_agg' ? 'Agg' : nodeMetrics.sourceTopic}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="break-words font-mono text-xs">Source: {nodeMetrics.sourceTopic}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {getStatusBadge()}
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Quick Metrics */}
        <CpuMemoryDisplay nodeMetrics={nodeMetrics} compact />

        {/* Last Update */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Last update</span>
          <span>{formatRelativeTime(nodeMetrics.lastUpdate)}</span>
        </div>

        {/* Collapsible Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2">
              <span className="text-xs font-medium text-gray-600">
                {isExpanded ? 'Hide' : 'Show'} Details
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="pt-4 border-t border-gray-200">
              <NodeDetailsPanel nodeName={nodeName} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

