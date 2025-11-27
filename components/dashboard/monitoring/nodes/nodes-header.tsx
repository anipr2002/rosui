'use client'

import React from 'react'
import { useLifecycleNodesStore } from '@/store/lifecycle-nodes-store'
import { useRosStore } from '@/store/ros-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  RefreshCw,
  Circle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Cpu
} from 'lucide-react'

const STATE_COLORS = {
  unknown: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  unconfigured: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  inactive: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  active: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  finalized: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
}

export function NodesHeader() {
  const { status: connectionStatus } = useRosStore()
  const {
    nodeCount,
    lifecycleNodeCount,
    lifecycleNodes,
    isLoading,
    isPolling,
    lastUpdate,
    fetchAllNodes,
    startPolling,
    stopPolling
  } = useLifecycleNodesStore()

  // Count nodes by state
  const stateCounts = React.useMemo(() => {
    const counts = {
      unknown: 0,
      unconfigured: 0,
      inactive: 0,
      active: 0,
      finalized: 0
    }
    lifecycleNodes.forEach((node) => {
      counts[node.currentState]++
    })
    return counts
  }, [lifecycleNodes])

  const isConnected = connectionStatus === 'connected'

  const handleRefresh = () => {
    fetchAllNodes()
  }

  const handleTogglePolling = () => {
    if (isPolling) {
      stopPolling()
    } else {
      startPolling(5000)
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never'
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000)
    if (seconds < 5) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  return (
    <div className="space-y-4">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Lifecycle Nodes</h1>
          <p className="text-muted-foreground">
            Monitor and control ROS2 lifecycle node states
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={!isConnected || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh nodes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant={isPolling ? 'default' : 'outline'}
            size="sm"
            onClick={handleTogglePolling}
            disabled={!isConnected}
            className={isPolling ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          >
            {isPolling ? (
              <>
                <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
                Live
              </>
            ) : (
              'Start Polling'
            )}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Nodes */}
        <Card className="shadow-none rounded-xl border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Nodes</p>
                <p className="text-2xl font-bold">{nodeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Nodes */}
        <Card className="shadow-none rounded-xl border border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-indigo-700">Lifecycle Nodes</p>
                <p className="text-2xl font-bold text-indigo-900">{lifecycleNodeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Circle className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Nodes */}
        <Card className="shadow-none rounded-xl border border-green-200 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">Active</p>
                <p className="text-2xl font-bold text-green-900">{stateCounts.active}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Summary */}
        <Card className="shadow-none rounded-xl border">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">States</p>
                <span className="text-xs text-muted-foreground">{formatLastUpdate()}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stateCounts.active > 0 && (
                  <Badge className={`${STATE_COLORS.active.bg} ${STATE_COLORS.active.text} ${STATE_COLORS.active.border} text-xs`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {stateCounts.active}
                  </Badge>
                )}
                {stateCounts.inactive > 0 && (
                  <Badge className={`${STATE_COLORS.inactive.bg} ${STATE_COLORS.inactive.text} ${STATE_COLORS.inactive.border} text-xs`}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {stateCounts.inactive}
                  </Badge>
                )}
                {stateCounts.unconfigured > 0 && (
                  <Badge className={`${STATE_COLORS.unconfigured.bg} ${STATE_COLORS.unconfigured.text} ${STATE_COLORS.unconfigured.border} text-xs`}>
                    <Circle className="h-3 w-3 mr-1" />
                    {stateCounts.unconfigured}
                  </Badge>
                )}
                {stateCounts.finalized > 0 && (
                  <Badge className={`${STATE_COLORS.finalized.bg} ${STATE_COLORS.finalized.text} ${STATE_COLORS.finalized.border} text-xs`}>
                    <XCircle className="h-3 w-3 mr-1" />
                    {stateCounts.finalized}
                  </Badge>
                )}
                {lifecycleNodeCount === 0 && (
                  <span className="text-xs text-muted-foreground">No lifecycle nodes</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

