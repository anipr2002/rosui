'use client'

import React, { useMemo, useCallback } from 'react'
import { usePanelsStore, type GaugePanelConfig } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GaugeDisplay } from './gauge-display'
import { GaugeConfig } from './gauge-config'
import { Gauge, Settings, Eye, Trash2 } from 'lucide-react'
import { parseNumericPath } from '@/lib/rosbag/message-path-parser'

interface GaugePanelProps {
  panelConfig: GaugePanelConfig
}

export function GaugePanel({ panelConfig }: GaugePanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    getDeserializedMessage,
    removePanel
  } = usePanelsStore()

  // Get current value from messages
  const currentValue = useMemo(() => {
    if (!metadata || !panelConfig.topic || !panelConfig.messagePath) return null

    // Get messages up to current time
    const messages = getMessagesForTopic(
      panelConfig.topic,
      metadata.startTime,
      currentTime
    )

    if (messages.length === 0) return null

    // Get last message before or at current time
    const lastMsg = messages[messages.length - 1]
    const deserializedMsg = getDeserializedMessage(lastMsg)

    return parseNumericPath(deserializedMsg, panelConfig.messagePath)
  }, [
    currentTime,
    panelConfig.topic,
    panelConfig.messagePath,
    metadata,
    getMessagesForTopic,
    getDeserializedMessage
  ])

  const handleRemovePanel = useCallback(() => {
    removePanel(panelConfig.id)
  }, [panelConfig.id, removePanel])

  if (!metadata) return null

  // Determine display label
  const displayLabel = panelConfig.label || panelConfig.messagePath

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-indigo-300">
      <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <Gauge className="h-5 w-5 mt-0.5 text-indigo-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-indigo-900">Gauge Panel</CardTitle>
            <p className="text-xs text-indigo-700 mt-1 truncate">{displayLabel}</p>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-xs">
            {panelConfig.topic || 'No topic'}
          </Badge>
          <Button
            onClick={handleRemovePanel}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 h-7 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="gauge" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="gauge" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Gauge
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gauge" className="mt-0">
            <div className="space-y-4">
              {!panelConfig.topic || !panelConfig.messagePath ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Gauge className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    No Configuration
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure a topic and message path in the settings tab
                  </p>
                </div>
              ) : (
                <GaugeDisplay value={currentValue} config={panelConfig} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="space-y-4">
              <GaugeConfig panelId={panelConfig.id} config={panelConfig} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


