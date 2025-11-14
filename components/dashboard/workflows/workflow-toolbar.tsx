'use client'

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Activity,
  Play,
  Plus,
  Save,
  Square,
  Trash2,
  Upload,
  Wifi,
  Undo2,
  Redo2,
  Download
} from 'lucide-react'
import type { WorkflowNodeType } from './types'

interface WorkflowToolbarProps {
  onAddNode: (type: WorkflowNodeType) => void
  onStart: () => void
  onStop: () => void
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isRunning: boolean
  isConnected: boolean
  nodeCount: number
  edgeCount: number
  lastSaved?: number
}

export function WorkflowToolbar({
  onAddNode,
  onStart,
  onStop,
  onSave,
  onLoad,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isRunning,
  isConnected,
  nodeCount,
  edgeCount,
  lastSaved
}: WorkflowToolbarProps) {
  const handleExport = () => {
    const data = localStorage.getItem('rosui.workflow.dataProcessing')
    if (!data) {
      return
    }
    const parsed = JSON.parse(data)
    const exportData = {
      ...parsed,
      version: '1.0',
      description: 'ROS Workflow Export'
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          localStorage.setItem('rosui.workflow.dataProcessing', JSON.stringify(data))
          onLoad()
        } catch (error) {
          console.error('Failed to import workflow:', error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
  return (
    <Card className='shadow-none pt-0 rounded-xl border border-teal-200'>
      <CardHeader className='bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6'>
        <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4'>
          <Activity className='h-5 w-5 text-teal-600 mt-0.5' />
          <div className='flex flex-col'>
            <h2 className='text-base font-semibold text-teal-900'>
              Data workflow controls
            </h2>
            <p className='text-xs text-teal-800'>
              Add nodes, connect ROS topics, and orchestrate processing pipelines
            </p>
          </div>
          <Badge
            className={`justify-self-end text-xs ${
              isConnected
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}
          >
            <span className='flex items-center gap-1.5'>
              <Wifi className='h-3.5 w-3.5' />
              {isConnected ? 'rosbridge connected' : 'connection required'}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='px-6 py-4 space-y-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              className='bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              onClick={() => onAddNode('input')}
            >
              <Plus className='h-4 w-4 mr-2' />
              Input node
            </Button>
            <Button
              type='button'
              variant='outline'
              className='bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              onClick={() => onAddNode('process')}
            >
              <Plus className='h-4 w-4 mr-2' />
              Process node
            </Button>
            <Button
              type='button'
              variant='outline'
              className='bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              onClick={() => onAddNode('output')}
            >
              <Plus className='h-4 w-4 mr-2' />
              Output node
            </Button>
          </div>

          <div className='flex flex-wrap gap-2 justify-start lg:justify-end'>
            {isRunning ? (
              <Button
                type='button'
                variant='outline'
                className='border-red-200 text-red-600 hover:bg-red-50'
                onClick={onStop}
              >
                <Square className='h-4 w-4 mr-2' />
                Stop pipeline
              </Button>
            ) : (
              <Button
                type='button'
                className='bg-teal-600 hover:bg-teal-700 text-white'
                onClick={onStart}
                disabled={!isConnected}
              >
                <Play className='h-4 w-4 mr-2' />
                Start pipeline
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='border-gray-200 text-gray-700 hover:bg-gray-50'
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='border-gray-200 text-gray-700 hover:bg-gray-50'
                    onClick={onRedo}
                    disabled={!canRedo}
                  >
                    <Redo2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='border-gray-200 text-gray-700 hover:bg-gray-50'
                    onClick={onClear}
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove all nodes and edges</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3 justify-between border-t border-teal-100 pt-4'>
          <div className='flex items-center gap-3 text-xs text-gray-600'>
            <Badge variant='outline' className='text-xs border-gray-200 text-gray-700'>
              {nodeCount} nodes / {edgeCount} edges
            </Badge>
            <span>
              {lastSaved
                ? `Last saved ${new Date(lastSaved).toLocaleTimeString()}`
                : 'Not saved yet'}
            </span>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              className='border-gray-200 text-gray-700 hover:bg-gray-50'
              onClick={handleImport}
            >
              <Upload className='h-4 w-4 mr-2' />
              Import
            </Button>
            <Button
              type='button'
              variant='outline'
              className='border-gray-200 text-gray-700 hover:bg-gray-50'
              onClick={handleExport}
            >
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
            <Button
              type='button'
              variant='outline'
              className='border-gray-200 text-gray-700 hover:bg-gray-50'
              onClick={onSave}
            >
              <Save className='h-4 w-4 mr-2' />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

