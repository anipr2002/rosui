'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Home,
  Map as MapIcon,
  Loader2
} from 'lucide-react'
import { useRosStore } from '@/store/ros-store'
import { useMapStore } from '@/store/map-store'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onResetView: () => void
  onRefresh: () => void
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  onRefresh
}: MapControlsProps) {
  const { status } = useRosStore()
  const {
    mapTopic,
    setMapTopic,
    isLoading,
    mapMetadata
  } = useMapStore()

  const getStatusBadge = () => {
    if (status === 'connected') {
      if (isLoading) {
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-2 w-2 animate-spin" />
              Loading Map
            </div>
          </Badge>
        )
      }
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </div>
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
        Disconnected
      </Badge>
    )
  }

  const getMapInfoBadge = () => {
    if (mapMetadata) {
      return (
        <Badge variant="outline" className="text-sm">
          {mapMetadata.width} × {mapMetadata.height} px
        </Badge>
      )
    }
    return null
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200 mb-4">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <div className="flex items-start gap-3">
          <MapIcon className="h-5 w-5 mt-0.5 text-teal-600" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base text-teal-900 font-semibold">
              Map Viewer Controls
            </h2>
            <p className="mt-1 text-xs text-teal-800">
              Navigate and control the occupancy grid map visualization
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Map Info */}
          {getMapInfoBadge()}

          {/* Map Topic Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Input
              type="text"
              placeholder="/map"
              value={mapTopic}
              onChange={(e) => setMapTopic(e.target.value)}
              className="h-9 bg-white"
              disabled={status !== 'connected' || isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              topic
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              disabled={status !== 'connected'}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              disabled={status !== 'connected'}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onFitView}
              disabled={status !== 'connected'}
              title="Fit to View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetView}
              disabled={status !== 'connected'}
              title="Reset View"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || status !== 'connected'}
              title="Refresh Map"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* Map Metadata Display */}
        {mapMetadata && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Resolution:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {mapMetadata.resolution.toFixed(3)} m
                </span>
              </div>
              <div>
                <span className="text-gray-500">Origin:</span>
                <span className="ml-2 font-mono text-gray-900">
                  ({mapMetadata.origin.x.toFixed(2)}, {mapMetadata.origin.y.toFixed(2)})
                </span>
              </div>
              <div>
                <span className="text-gray-500">Dimensions:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {mapMetadata.width} × {mapMetadata.height}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Frame:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {mapMetadata.frameId}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

