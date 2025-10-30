'use client'

import React from 'react'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Network, ChevronRight } from 'lucide-react'

export function DiagnosticsAggregatorView() {
  const { aggregatedStatus, subscribedTopics } = useDiagnosticsStore()

  const isSubscribedToAggregator = subscribedTopics.has('/diagnostics_agg')
  const aggregatedEntries = Array.from(aggregatedStatus.values())

  if (!isSubscribedToAggregator || aggregatedEntries.length === 0) {
    return null
  }

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

  // Group by hardware_id to show hierarchical structure
  const groupedByHardware = new Map<string, typeof aggregatedEntries>()
  aggregatedEntries.forEach((entry) => {
    const hwId = entry.hardware_id || 'unknown'
    if (!groupedByHardware.has(hwId)) {
      groupedByHardware.set(hwId, [])
    }
    groupedByHardware.get(hwId)!.push(entry)
  })

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-200">
      <CardHeader className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6">
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Network className="h-5 w-5 mt-0.5 text-purple-600 flex-shrink-0" />
            <div className="min-w-0 overflow-hidden space-y-1">
              <CardTitle className="text-sm sm:text-base text-purple-900">
                Aggregated Diagnostics
              </CardTitle>
              <CardDescription className="text-xs text-purple-700">
                Hierarchical view from /diagnostics_agg
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs">
                {aggregatedEntries.length} entries
              </Badge>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {groupedByHardware.size === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No aggregated diagnostics available
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {Array.from(groupedByHardware.entries()).map(([hardwareId, entries]) => {
              // Find the worst status level in this group
              const worstLevel = Math.max(...entries.map((e) => e.level))
              
              return (
                <AccordionItem key={hardwareId} value={hardwareId} className="border-gray-200">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{hardwareId || 'Unknown Hardware'}</span>
                      <Badge className={`text-xs ${getLevelColor(worstLevel)}`}>
                        {getLevelLabel(worstLevel)}
                      </Badge>
                      <span className="text-xs text-gray-500 ml-auto">
                        {entries.length} node{entries.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.name}
                        className="p-3 rounded-lg border border-gray-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-medium text-gray-900 truncate cursor-help">
                                  {entry.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="break-words">{entry.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge className={`text-xs ${getLevelColor(entry.level)}`}>
                            {getLevelLabel(entry.level)}
                          </Badge>
                        </div>
                        {entry.message && (
                          <div className="text-xs text-gray-600">{entry.message}</div>
                        )}
                        {entry.values.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-gray-100">
                            <div className="text-xs font-medium text-gray-500 mb-1">Key Metrics:</div>
                            <div className="flex flex-wrap gap-2">
                              {entry.values.slice(0, 5).map((value, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                >
                                  <span className="font-medium text-gray-700">{value.key}:</span>
                                  <span className="ml-1 text-gray-900 font-mono">{value.value}</span>
                                </div>
                              ))}
                              {entry.values.length > 5 && (
                                <div className="text-xs text-gray-500">
                                  +{entry.values.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
