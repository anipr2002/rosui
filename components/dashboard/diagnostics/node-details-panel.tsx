'use client'

import React, { useState } from 'react'
import { useDiagnosticsStore, ProcessedDiagnosticStatus } from '@/store/diagnostics-store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check, Info, List } from 'lucide-react'
import { toast } from 'sonner'

interface NodeDetailsPanelProps {
  nodeName: string
}

export function NodeDetailsPanel({ nodeName }: NodeDetailsPanelProps) {
  const { diagnosticMessages } = useDiagnosticsStore()
  const [copied, setCopied] = useState(false)

  const diagnostic = diagnosticMessages.get(nodeName)
  if (!diagnostic) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No diagnostic data available for this node
      </div>
    )
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

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'text-green-600'
      case 1:
        return 'text-amber-600'
      case 2:
        return 'text-red-600'
      case 3:
        return 'text-gray-600'
      default:
        return 'text-gray-400'
    }
  }

  const handleCopyJSON = () => {
    const json = JSON.stringify(diagnostic, null, 2)
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      toast.success('Diagnostic data copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds} seconds ago`
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return formatTimestamp(timestamp)
  }

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="status" className="text-xs">
          <Info className="h-3 w-3 mr-1" />
          Status
        </TabsTrigger>
        <TabsTrigger value="values" className="text-xs">
          <List className="h-3 w-3 mr-1" />
          Values
        </TabsTrigger>
        <TabsTrigger value="source" className="text-xs">
          <Info className="h-3 w-3 mr-1" />
          Source
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="mt-4 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Level</span>
            <span className={`text-sm font-semibold ${getLevelColor(diagnostic.level)}`}>
              {getLevelLabel(diagnostic.level)}
            </span>
          </div>
          <div className="flex justify-between items-start py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Message</span>
            <span className="text-sm text-gray-900 text-right break-words max-w-xs">
              {diagnostic.message || 'No message'}
            </span>
          </div>
          <div className="flex justify-between items-start py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Hardware ID</span>
            <span className="text-sm font-mono text-gray-900 text-right break-all max-w-xs">
              {diagnostic.hardware_id || 'N/A'}
            </span>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="values" className="mt-4 space-y-2">
        {diagnostic.values.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No diagnostic values available
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {diagnostic.values.map((value, index) => (
              <div
                key={index}
                className="flex justify-between items-start gap-3 py-2 border-b border-gray-200"
              >
                <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                  {value.key}
                </span>
                <span className="text-xs font-mono text-gray-900 text-right break-all">
                  {value.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="source" className="mt-4 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Source Topic</span>
            <span className="text-xs font-mono text-gray-900 text-right break-all max-w-xs">
              {diagnostic.sourceTopic}
            </span>
          </div>
          <div className="flex justify-between items-start py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Last Update</span>
            <div className="text-right">
              <div className="text-sm text-gray-900">{formatTimestamp(diagnostic.timestamp)}</div>
              <div className="text-xs text-gray-500">{formatRelativeTime(diagnostic.timestamp)}</div>
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJSON}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

