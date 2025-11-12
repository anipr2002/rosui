'use client'

import React, { useState } from 'react'
import { useDiagnosticsStore } from '@/store/diagnostics-store'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Radio, X, Plus, Loader2, Info, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useRosStore } from '@/store/ros-store'
import { toast } from 'sonner'

export function TopicManager() {
  const {
    defaultTopics,
    customTopics,
    subscribedTopics,
    isLoading,
    addCustomTopic,
    removeCustomTopic,
    subscribeAllDiagnostics,
    verifyTopics
  } = useDiagnosticsStore()
  const { status: connectionStatus } = useRosStore()

  const [newTopicName, setNewTopicName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResults, setVerificationResults] = useState<Map<string, { exists: boolean; subscribed: boolean; error?: string }>>(new Map())

  const getFriendlyName = (topicName: string): string => {
    if (topicName === '/diagnostics') return 'System Diagnostics'
    if (topicName === '/diagnostics_agg') return 'Aggregated'
    return topicName
  }

  const handleAddTopic = async () => {
    const trimmed = newTopicName.trim()
    if (!trimmed) {
      setError('Topic name cannot be empty')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      await addCustomTopic(trimmed)
      setNewTopicName('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add topic'
      setError(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveTopic = (topicName: string) => {
    removeCustomTopic(topicName)
  }

  const handleVerifyTopics = async () => {
    if (connectionStatus !== 'connected') {
      toast.error('ROS not connected. Please connect first.')
      return
    }

    setIsVerifying(true)
    try {
      const results = await verifyTopics()
      const resultsMap = new Map<string, { exists: boolean; subscribed: boolean; error?: string }>()
      
      results.forEach((result) => {
        resultsMap.set(result.topicName, {
          exists: result.exists,
          subscribed: result.subscribed,
          error: result.error
        })
      })

      setVerificationResults(resultsMap)

      // Count issues
      const missingTopics = results.filter((r) => !r.exists).length
      const notSubscribed = results.filter((r) => r.exists && !r.subscribed).length
      const errors = results.filter((r) => r.error && r.exists).length

      if (missingTopics === 0 && notSubscribed === 0 && errors === 0) {
        toast.success('All topics verified and subscribed')
      } else {
        const issues = []
        if (missingTopics > 0) issues.push(`${missingTopics} missing`)
        if (notSubscribed > 0) issues.push(`${notSubscribed} not subscribed`)
        if (errors > 0) issues.push(`${errors} with errors`)
        toast.warning(`Topics verified: ${issues.join(', ')}`)
      }

      // Try to subscribe to topics that exist but aren't subscribed
      const needsSubscription = results.filter((r) => r.exists && !r.subscribed && !r.error)
      if (needsSubscription.length > 0) {
        await subscribeAllDiagnostics()
        toast.info(`Attempted to subscribe to ${needsSubscription.length} topic(s)`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify topics'
      toast.error(message)
      console.error('Verification error:', err)
    } finally {
      setIsVerifying(false)
    }
  }

  const allTopics = [...defaultTopics, ...customTopics]
  const isSubscribed = (topicName: string) => subscribedTopics.has(topicName)
  const getVerificationStatus = (topicName: string) => verificationResults.get(topicName)

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Radio className="h-5 w-5 mt-0.5 text-teal-600 flex-shrink-0" />
            <div className="min-w-0 overflow-hidden space-y-1">
              <CardTitle className="text-sm sm:text-base text-teal-900">
                Diagnostic Topics
              </CardTitle>
              <CardDescription className="text-xs text-teal-700">
                Manage default and custom diagnostic topics
              </CardDescription>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-4">
        {/* Verify Button */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="text-xs font-medium text-gray-500">
            Topic Verification
          </div>
          <Button
            onClick={handleVerifyTopics}
            disabled={isVerifying || connectionStatus !== 'connected'}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Verify Topics
              </>
            )}
          </Button>
        </div>

        {/* Add Topic Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="/custom/diagnostics"
              value={newTopicName}
              onChange={(e) => {
                setNewTopicName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAdding) {
                  handleAddTopic()
                }
              }}
              disabled={isAdding || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleAddTopic}
              disabled={isAdding || isLoading || !newTopicName.trim()}
              size="sm"
              className="bg-teal-200 border-teal-500 border-1 hover:bg-teal-500 hover:text-white text-teal-500"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <X className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>

        {/* Topics List */}
        {allTopics.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <Radio className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-gray-900 mb-2">
              No Topics
            </div>
            <div className="text-sm text-gray-500">
              Add a custom diagnostic topic to start monitoring
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 mb-2">
              Active Topics ({allTopics.length})
            </div>
            {defaultTopics.map((topicName) => {
              const subscribed = isSubscribed(topicName)
              return (
                <div
                  key={topicName}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs">
                      {getFriendlyName(topicName)}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-gray-500 font-mono truncate">
                            {topicName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="break-words font-mono text-xs">{topicName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {(() => {
                      const verification = getVerificationStatus(topicName)
                      const subscribed = isSubscribed(topicName)
                      
                      if (verification) {
                        if (!verification.exists) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <AlertCircle className="h-3 w-3 text-red-600" />
                                    <span className="text-xs text-red-600">Not found</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{verification.error || 'Topic does not exist'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                        if (verification.error) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                    <span className="text-xs text-amber-600">Error</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{verification.error}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                        if (subscribed) {
                          return (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          )
                        }
                        return (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Not subscribed</span>
                          </div>
                        )
                      }
                      
                      // No verification yet, show subscription status
                      if (subscribed) {
                        return (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600">Subscribed</span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                  >
                    Default
                  </Badge>
                </div>
              )
            })}

            {customTopics.map((topicName) => {
              const subscribed = isSubscribed(topicName)
              return (
                <div
                  key={topicName}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs">
                      {topicName}
                    </Badge>
                    {(() => {
                      const verification = getVerificationStatus(topicName)
                      const subscribed = isSubscribed(topicName)
                      
                      if (verification) {
                        if (!verification.exists) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <AlertCircle className="h-3 w-3 text-red-600" />
                                    <span className="text-xs text-red-600">Not found</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{verification.error || 'Topic does not exist'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                        if (verification.error) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                    <span className="text-xs text-amber-600">Error</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{verification.error}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                        if (subscribed) {
                          return (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          )
                        }
                        return (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Not subscribed</span>
                          </div>
                        )
                      }
                      
                      // No verification yet, show subscription status
                      if (subscribed) {
                        return (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600">Subscribed</span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTopic(topicName)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 cursor-help">
                <Info className="h-3.5 w-3.5" />
                <span>
                  Default topics are always active. Custom topics are saved and will
                  auto-subscribe when ROS is connected.
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <p className="text-xs">
                Default topics (/diagnostics, /diagnostics_agg) are automatically
                subscribed when the diagnostics page loads. Custom topics must be
                valid diagnostic topics with message type diagnostic_msgs/DiagnosticArray.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

