'use client'

import React, { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ReactFlowProvider } from 'reactflow'
import { RQTGraph } from '@/components/dashboard/visulatization/rqt-graph'
import { RqtGraphSettings } from './rqt-graph-settings'
import type { Panel } from '../../core/types'
import type { RqtGraphConfig } from './types'

interface RqtGraphPanelProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
  onDelete?: (id: string) => void
}

export function RqtGraphPanel({ panel, onUpdatePanel, onDelete }: RqtGraphPanelProps) {
  const config = (panel.config as RqtGraphConfig) || {}

  const handleConfigChange = useCallback(
    (newConfig: RqtGraphConfig) => {
      onUpdatePanel(panel.id, { config: newConfig })
    },
    [panel.id, onUpdatePanel]
  )

  const handleDelete = () => {
    if (onDelete) {
      onDelete(panel.id)
    }
  }

  return (
    <div className="relative h-full w-full group">
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <RqtGraphSettings config={config} onConfigChange={handleConfigChange} />
        
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
            title="Delete Panel"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Graph Visualization */}
      <div className="h-full w-full overflow-hidden rounded-lg">
        <ReactFlowProvider>
          <RQTGraph 
            searchQuery={config.searchQuery}
            filterSystemNodes={config.filterSystemNodes}
            showTopics={config.showTopics}
            layoutDirection={config.layoutDirection}
            hideControls={true}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
