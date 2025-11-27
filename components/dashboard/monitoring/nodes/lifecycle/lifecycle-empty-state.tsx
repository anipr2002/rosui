'use client'

import React from 'react'
import { Circle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface LifecycleEmptyStateProps {
  hasNodes?: boolean
}

export function LifecycleEmptyState({ hasNodes = true }: LifecycleEmptyStateProps) {
  if (!hasNodes) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md mx-auto text-center">
        <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          No Nodes Found
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Unable to detect any ROS nodes. Make sure your ROS system is running and nodes are active.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings">
            Check Connection
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-md mx-auto text-center">
      <Circle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-amber-900 mb-2">
        No Lifecycle Nodes Detected
      </h3>
      <p className="text-sm text-amber-700 mb-4">
        Your ROS system has nodes, but none of them appear to be lifecycle-managed nodes. 
        Lifecycle nodes expose <code className="bg-amber-100 px-1 rounded">get_state</code> and{' '}
        <code className="bg-amber-100 px-1 rounded">change_state</code> services.
      </p>
      <div className="text-xs text-amber-600 bg-amber-100/50 rounded p-3 font-mono">
        ros2 lifecycle nodes
      </div>
    </div>
  )
}

