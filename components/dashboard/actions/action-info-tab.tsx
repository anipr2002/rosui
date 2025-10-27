'use client'

import React, { useEffect, useState } from 'react'
import { useActionsStore } from '@/store/action-store'
import { Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ActionInfoTabProps {
  actionName: string
  actionType: string
}

export function ActionInfoTab ({ actionName, actionType }: ActionInfoTabProps) {
  const { getActionDefinition, actionDefinitions, isLoadingDefinitions } =
    useActionsStore()
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

  useEffect(() => {
    if (!hasAttemptedLoad && actionType !== 'unknown') {
      setHasAttemptedLoad(true)
      getActionDefinition(actionType).catch((error) => {
        console.error(`Failed to load action definition for ${actionType}:`, error)
        toast.error(`Failed to load action definition for ${actionType}`)
      })
    }
  }, [actionType, getActionDefinition, hasAttemptedLoad])

  const definition = actionDefinitions.get(actionType)
  const isLoading = isLoadingDefinitions.get(actionType) || false

  if (actionType === 'unknown') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700">
            <p className="font-medium">Unknown Action Type</p>
            <p className="mt-1">
              Unable to determine the action type for this action server.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold">Action Name</h4>
          </div>
          <div className="pl-6">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {actionName}
            </code>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
        <p className="text-xs text-gray-500">Loading action definition...</p>
      </div>
    )
  }

  if (!definition) {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-red-700">
          <p className="font-medium">Failed to Load Definition</p>
          <p className="mt-1">
            Could not retrieve the action definition. The action server might not be
            available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Name and Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold">Action Server</h4>
        </div>
        <div className="pl-6 space-y-1">
          <div className="text-xs">
            <span className="text-muted-foreground">Name:</span>{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {actionName}
            </code>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Type:</span>{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {actionType}
            </code>
          </div>
        </div>
      </div>

      {/* Goal Definition */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Goal
          </Badge>
          <code className="text-xs text-muted-foreground">
            {definition.goal.type}
          </code>
        </div>
        <div className="pl-6">
          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
            {definition.goal.definition || 'No definition available'}
          </pre>
        </div>
      </div>

      {/* Result Definition */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Result
          </Badge>
          <code className="text-xs text-muted-foreground">
            {definition.result.type}
          </code>
        </div>
        <div className="pl-6">
          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
            {definition.result.definition || 'No definition available'}
          </pre>
        </div>
      </div>

      {/* Feedback Definition */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Feedback
          </Badge>
          <code className="text-xs text-muted-foreground">
            {definition.feedback.type}
          </code>
        </div>
        <div className="pl-6">
          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
            {definition.feedback.definition || 'No definition available'}
          </pre>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="h-3 w-3 text-green-600" />
        <span className="text-xs text-green-700">
          Action definition loaded successfully
        </span>
      </div>
    </div>
  )
}

