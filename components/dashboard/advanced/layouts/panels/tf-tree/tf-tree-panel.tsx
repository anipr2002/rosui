'use client'

import React, { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ReactFlowProvider } from 'reactflow'
import { TFTree } from '@/components/dashboard/visulatization/tf-tree'
import { TFTreeSettings } from './tf-tree-settings'
import type { Panel } from '../../core/types'
import type { TFTreeConfig } from './types'

interface TFTreePanelProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
  onDelete?: (id: string) => void
}

export function TFTreePanel({ panel, onUpdatePanel, onDelete }: TFTreePanelProps) {
  const config = (panel.config as TFTreeConfig) || {}

  const handleConfigChange = useCallback(
    (newConfig: TFTreeConfig) => {
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
        <TFTreeSettings config={config} onConfigChange={handleConfigChange} />
        
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

      {/* TF Tree Visualization */}
      <div className="h-full w-full overflow-hidden rounded-lg">
        <ReactFlowProvider>
          <TFTree 
            hideControls={true}
            hideDetailsPanel={!config.showDetailsPanel}
            searchQuery={config.searchQuery}
            layoutDirection={config.layoutDirection}
            showMinimap={config.showMinimap}
            staleTimeout={config.staleTimeout}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
