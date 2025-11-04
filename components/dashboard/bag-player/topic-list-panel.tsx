'use client'

import { Radio as RadioIcon, CheckCircle, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBagPlayerStore } from '@/store/bag-player-store'
import { calculateFrequency } from '@/lib/db/bag-player-db'

export function TopicListPanel() {
  const {
    currentRecording,
    availableTopics,
    selectedTopics,
    toggleTopicSelection,
    selectAllTopics,
    deselectAllTopics,
    recordingStartTime,
    recordingEndTime
  } = useBagPlayerStore()

  const hasRecording = currentRecording !== null
  const allSelected = availableTopics.length > 0 && selectedTopics.length === availableTopics.length
  const someSelected = selectedTopics.length > 0 && !allSelected

  const duration = recordingEndTime && recordingStartTime 
    ? recordingEndTime - recordingStartTime 
    : 0

  return (
    <Card className="shadow-none pt-0 rounded-xl border-indigo-300">
      <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <RadioIcon className="h-5 w-5 mt-0.5 text-indigo-900" />
          <div>
            <CardTitle className="text-base text-indigo-900">
              Topic Selection
            </CardTitle>
            <CardDescription className="text-xs text-indigo-900 opacity-80">
              {hasRecording
                ? `${selectedTopics.length} of ${availableTopics.length} topics selected`
                : 'Load a recording to view topics'}
            </CardDescription>
          </div>
          {hasRecording && availableTopics.length > 0 && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={allSelected ? deselectAllTopics : selectAllTopics}
                className="h-8 text-xs"
              >
                {allSelected ? 'Clear' : 'All'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {!hasRecording ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <RadioIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900 mb-2">
              No Recording Loaded
            </p>
            <p className="text-sm text-gray-500">
              Load a recording to view available topics
            </p>
          </div>
        ) : availableTopics.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-sm text-amber-900">
              No topics found in this recording
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableTopics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.topicName)
              const topicInfo = currentRecording.topics.find(t => t.name === topic.topicName)
              const messageCount = currentRecording.messageCount // This is approximate, would need to calculate per topic
              const frequency = duration > 0 ? calculateFrequency(messageCount / availableTopics.length, duration) : 0

              return (
                <div
                  key={topic.topicName}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => toggleTopicSelection(topic.topicName)}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Indicator */}
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Topic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Color indicator for charts */}
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: topic.color }}
                        />
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {topic.topicName}
                        </p>
                      </div>

                      <p className="text-xs font-mono text-gray-600 mb-2">
                        {topicInfo?.type || topic.topicType}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                        >
                          ~{frequency.toFixed(1)} Hz
                        </Badge>
                        {isSelected && (
                          <Badge
                            className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200"
                          >
                            Visualizing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Help Text */}
        {hasRecording && availableTopics.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Click on topics to select them for visualization. Selected topics will be displayed in the message visualizer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

