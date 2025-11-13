'use client'

import React from 'react'
import { useTopicsStore } from '@/store/topic-store'
import { useRosbagRecordStore } from '@/store/rosbag-record-store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { FileCode, Info, Search } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { messageTypeParser } from '@/lib/ros/messageTypeParser'

export function TopicStructureViewer () {
  const { topics, typeDefinitions } = useTopicsStore()
  const { selectedTopics, recordAllTopics } = useRosbagRecordStore()

  // Get the topics that will be recorded
  const topicsToDisplay = recordAllTopics
    ? topics
    : topics.filter((topic) => selectedTopics.has(topic.name))

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-purple-300">
      <CardHeader className="bg-purple-50 border-purple-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
          <FileCode className="h-5 w-5 mt-0.5 text-purple-600" />
          
          <div className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-base text-purple-900 cursor-help truncate">
                    Message Structure
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" colorVariant="purple">
                  <p>View the message definitions for selected topics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <CardDescription className="text-xs text-purple-800 mt-1">
              Message definitions for topics to be recorded
            </CardDescription>
          </div>

          <Badge 
            className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs"
          >
            {topicsToDisplay.length} {topicsToDisplay.length === 1 ? 'topic' : 'topics'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {topicsToDisplay.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900 mb-2">No Topics Selected</p>
            <p className="text-sm text-gray-500">
              Select topics from the left panel to view their message structures
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {topicsToDisplay.map((topic) => {
              const typeDefinition = typeDefinitions.get(topic.type)
              
              // Generate default message structure
              let messageStructure = null
              let messageJson = ''
              try {
                messageStructure = messageTypeParser.createDefaultMessage(topic.type)
                if (messageStructure && Object.keys(messageStructure).length > 0) {
                  messageJson = JSON.stringify(messageStructure, null, 2)
                }
              } catch (error) {
                console.error(`Failed to create message structure for ${topic.type}:`, error)
              }
              
              return (
                <AccordionItem key={topic.name} value={topic.name}>
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-start justify-between w-full pr-2">
                      <div className="flex-1 min-w-0 text-left">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-medium text-gray-900 truncate cursor-help">
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
                      
                      <Badge 
                        variant="outline" 
                        className="ml-2 bg-purple-50 text-purple-700 border-purple-200 text-xs flex-shrink-0"
                      >
                        {messageJson ? 'Available' : 'No structure'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="pt-2 pb-4 space-y-3">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-3 py-2 border-b">
                          <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                            Topic Name
                          </span>
                          <span className="text-xs font-mono text-gray-900 text-right break-all">
                            {topic.name}
                          </span>
                        </div>

                        <div className="flex justify-between items-start gap-3 py-2 border-b">
                          <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                            Message Type
                          </span>
                          <span className="text-xs font-mono text-gray-900 text-right break-all">
                            {topic.type}
                          </span>
                        </div>
                      </div>

                      {/* Message Structure (JSON) */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-3.5 w-3.5 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-700">Message Structure (JSON)</span>
                        </div>
                        
                        {messageJson ? (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                            <pre className="text-xs font-mono text-purple-900 whitespace-pre-wrap break-words">
                              {messageJson}
                            </pre>
                          </div>
                        ) : (
                          <div className="p-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              Message structure not available for this type
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}

        {topicsToDisplay.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700">
              <Info className="h-3.5 w-3.5 inline-block mr-1.5" />
              These message structures will be included in the recorded rosbag file.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

