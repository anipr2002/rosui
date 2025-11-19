'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Pin, ChevronDown, ChevronRight } from 'lucide-react'
import { timestampToSeconds } from '@/lib/rosbag/mcap-reader'

interface DiagnosticEntryProps {
  diagnostic: {
    name: string
    hardware_id: string
    level: 0 | 1 | 2 | 3
    message: string
    values: Array<{ key: string; value: string }>
    timestamp: bigint
    isPinned: boolean
  }
  diagnosticKey: string
  isExpanded: boolean
  onToggleExpanded: () => void
  onTogglePin: () => void
  startTime: bigint
}

export function DiagnosticEntry({
  diagnostic,
  diagnosticKey,
  isExpanded,
  onToggleExpanded,
  onTogglePin,
  startTime,
}: DiagnosticEntryProps) {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'text-green-600 bg-green-100 border-green-200'
      case 1:
        return 'text-amber-600 bg-amber-100 border-amber-200'
      case 2:
        return 'text-red-600 bg-red-100 border-red-200'
      case 3:
        return 'text-gray-600 bg-gray-100 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
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

  const getBorderColor = (level: number) => {
    switch (level) {
      case 0:
        return 'border-green-200'
      case 1:
        return 'border-amber-200'
      case 2:
        return 'border-red-200'
      case 3:
        return 'border-gray-200'
      default:
        return 'border-gray-200'
    }
  }

  const relativeTime = timestampToSeconds(diagnostic.timestamp - startTime)

  return (
    <div className={`p-3 rounded-lg border ${getBorderColor(diagnostic.level)} bg-white`}>
      <div className="flex items-start gap-2">
        {/* Pin Button */}
        <Button
          onClick={onTogglePin}
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 flex-shrink-0 ${
            diagnostic.isPinned ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Pin className={`h-3.5 w-3.5 ${diagnostic.isPinned ? 'fill-current' : ''}`} />
        </Button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {diagnostic.name}
              </h4>
              {diagnostic.hardware_id && (
                <p className="text-xs text-gray-500 truncate">
                  {diagnostic.hardware_id}
                </p>
              )}
            </div>
            <Badge className={`text-xs flex-shrink-0 ${getLevelColor(diagnostic.level)}`}>
              {getLevelLabel(diagnostic.level)}
            </Badge>
          </div>

          {diagnostic.message && (
            <p className="text-xs text-gray-600 mb-2">{diagnostic.message}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{relativeTime.toFixed(2)}s</span>
            {diagnostic.values.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-xs hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Hide {diagnostic.values.length} values
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Show {diagnostic.values.length} values
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 pt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    {diagnostic.values.map((value, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-gray-700 flex-shrink-0">
                          {value.key}:
                        </span>
                        <span className="text-gray-900 font-mono text-right break-all">
                          {value.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
