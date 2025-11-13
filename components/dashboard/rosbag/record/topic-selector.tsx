'use client'

import React, { useState } from 'react'
import { useTopicsStore } from '@/store/topic-store'
import { useRosbagRecordStore } from '@/store/rosbag-record-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, Circle, Search, Info, CheckSquare, Square } from 'lucide-react'

export function TopicSelector () {
  const { topics } = useTopicsStore()
  const {
    selectedTopics,
    recordAllTopics,
    status,
    toggleTopicSelection,
    selectAllTopics,
    clearTopicSelection,
    setRecordAllTopics
  } = useRosbagRecordStore()

  const [searchQuery, setSearchQuery] = useState('')

  const isRecording = status === 'recording'

  // Filter topics based on search query
  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.toLowerCase()
    return (
      topic.name.toLowerCase().includes(query) ||
      topic.type.toLowerCase().includes(query)
    )
  })

  const selectedCount = selectedTopics.size
  const totalCount = topics.length

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-indigo-300">
      <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <CheckSquare className="h-5 w-5 mt-0.5 text-indigo-600" />
          
          <div className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-base text-indigo-900 cursor-help truncate">
                    Topic Selection
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" colorVariant="indigo">
                  <p>Select which topics to record in the rosbag</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <CardDescription className="text-xs text-indigo-800 mt-1">
              {selectedCount} of {totalCount} topics selected
            </CardDescription>
          </div>

          <Badge 
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-xs"
          >
            {totalCount} available
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Record All Topics Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2">
            <Label htmlFor="record-all" className="text-sm font-medium cursor-pointer">
              Record All Topics
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Automatically record all available topics, including new ones that appear</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="record-all"
            checked={recordAllTopics}
            onCheckedChange={setRecordAllTopics}
            disabled={isRecording}
            className="data-[state=checked]:bg-indigo-500"
          />
        </div>

        <Separator />

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={selectAllTopics}
            disabled={isRecording || recordAllTopics}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearTopicSelection}
            disabled={isRecording || recordAllTopics || selectedCount === 0}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
            disabled={isRecording}
          />
        </div>

        {/* Topics List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTopics.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-2">No topics found</p>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'No topics available. Make sure ROS is connected.'}
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isSelected = selectedTopics.has(topic.name)
              const isDisabled = isRecording || recordAllTopics

              return (
                <button
                  key={topic.name}
                  onClick={() => !isDisabled && toggleTopicSelection(topic.name)}
                  disabled={isDisabled}
                  className={`
                    w-full p-3 rounded-lg border text-left transition-all
                    ${isSelected
                      ? 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm font-medium text-gray-900 truncate cursor-help">
                              {topic.name}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{topic.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-gray-500 font-mono truncate cursor-help mt-0.5">
                              {topic.type}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-mono">{topic.type}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

