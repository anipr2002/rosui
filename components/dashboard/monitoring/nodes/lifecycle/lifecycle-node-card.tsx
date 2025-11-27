'use client'

import React from 'react'
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
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  Circle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react'
import { LifecycleTimeline } from './lifecycle-timeline'
import { LifecycleControls } from './lifecycle-controls'
import type { LifecycleNodeInfo, LifecycleState } from '@/store/lifecycle-nodes-store'

const STATE_CONFIG: Record<LifecycleState, {
  icon: React.ReactNode
  label: string
  colors: {
    border: string
    headerBg: string
    headerText: string
    descriptionText: string
    iconColor: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
  }
}> = {
  unknown: {
    icon: <Circle className="h-5 w-5" />,
    label: 'Unknown',
    colors: {
      border: 'border-gray-200',
      headerBg: 'bg-gray-50',
      headerText: 'text-gray-900',
      descriptionText: 'text-gray-700',
      iconColor: 'text-gray-400',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200'
    }
  },
  unconfigured: {
    icon: <Circle className="h-5 w-5" />,
    label: 'Unconfigured',
    colors: {
      border: 'border-gray-300',
      headerBg: 'bg-gray-50',
      headerText: 'text-gray-900',
      descriptionText: 'text-gray-700',
      iconColor: 'text-gray-500',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-200'
    }
  },
  inactive: {
    icon: <AlertCircle className="h-5 w-5" />,
    label: 'Inactive',
    colors: {
      border: 'border-amber-300',
      headerBg: 'bg-amber-50',
      headerText: 'text-amber-900',
      descriptionText: 'text-amber-800',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200'
    }
  },
  active: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: 'Active',
    colors: {
      border: 'border-green-300',
      headerBg: 'bg-green-50',
      headerText: 'text-green-900',
      descriptionText: 'text-green-800',
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-700',
      badgeBorder: 'border-green-200'
    }
  },
  finalized: {
    icon: <XCircle className="h-5 w-5" />,
    label: 'Finalized',
    colors: {
      border: 'border-red-300',
      headerBg: 'bg-red-50',
      headerText: 'text-red-900',
      descriptionText: 'text-red-800',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      badgeBorder: 'border-red-200'
    }
  }
}

interface LifecycleNodeCardProps {
  node: LifecycleNodeInfo
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function LifecycleNodeCard({
  node,
  isExpanded = false,
  onToggleExpand
}: LifecycleNodeCardProps) {
  const config = STATE_CONFIG[node.currentState]
  const { colors } = config

  const formatLastSeen = () => {
    const seconds = Math.floor((Date.now() - node.lastSeen) / 1000)
    if (seconds < 5) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${colors.border}`}>
      <CardHeader className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}>
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <div className={`${colors.iconColor} mt-0.5 flex-shrink-0`}>
              {config.icon}
            </div>
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className={`text-sm sm:text-base ${colors.headerText} truncate cursor-help`}>
                    {node.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-mono text-xs">{node.fullPath}</p>
                </TooltipContent>
              </Tooltip>
              <CardDescription className={`text-xs ${colors.descriptionText} font-mono truncate`}>
                {node.namespace === '/' ? '/' : node.namespace}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <Badge className={`${colors.badgeBg} ${colors.badgeText} ${colors.badgeBorder} text-xs hover:${colors.badgeBg}`}>
                <div className="flex items-center gap-1.5">
                  {node.currentState === 'active' && (
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                  {config.label}
                </div>
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatLastSeen()}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Lifecycle Controls */}
        <LifecycleControls node={node} />

        {/* Timeline Section */}
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-0 hover:bg-transparent"
            >
              <span className="text-sm font-medium text-gray-700">
                State Timeline
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <LifecycleTimeline
              transitionHistory={node.transitionHistory}
              currentState={node.currentState}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Node Details (if available) */}
        {node.details && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="text-sm font-medium text-gray-700">
                  Node Details
                </span>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {node.details.publications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Publications</p>
                  <div className="flex flex-wrap gap-1">
                    {node.details.publications.map((pub) => (
                      <Badge key={pub.name} variant="outline" className="text-xs font-mono">
                        {pub.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {node.details.subscriptions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Subscriptions</p>
                  <div className="flex flex-wrap gap-1">
                    {node.details.subscriptions.map((sub) => (
                      <Badge key={sub.name} variant="outline" className="text-xs font-mono">
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {node.details.services.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {node.details.services.map((srv) => (
                      <Badge key={srv.name} variant="outline" className="text-xs font-mono">
                        {srv.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

