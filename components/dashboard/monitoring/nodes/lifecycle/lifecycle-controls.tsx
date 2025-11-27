'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  Power,
  Loader2
} from 'lucide-react'
import {
  useLifecycleNodesStore,
  AVAILABLE_TRANSITIONS,
  type LifecycleNodeInfo,
  type LifecycleTransition
} from '@/store/lifecycle-nodes-store'

const TRANSITION_CONFIG: Record<LifecycleTransition, {
  icon: React.ReactNode
  label: string
  description: string
  variant: 'default' | 'outline' | 'destructive'
  className: string
}> = {
  configure: {
    icon: <Settings className="h-4 w-4" />,
    label: 'Configure',
    description: 'Initialize the node with configuration parameters',
    variant: 'outline',
    className: 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
  },
  activate: {
    icon: <Play className="h-4 w-4" />,
    label: 'Activate',
    description: 'Start the node\'s main functionality',
    variant: 'outline',
    className: 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800'
  },
  deactivate: {
    icon: <Pause className="h-4 w-4" />,
    label: 'Deactivate',
    description: 'Pause the node\'s functionality without cleanup',
    variant: 'outline',
    className: 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
  },
  cleanup: {
    icon: <RotateCcw className="h-4 w-4" />,
    label: 'Cleanup',
    description: 'Clean up resources and return to unconfigured state',
    variant: 'outline',
    className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
  },
  shutdown: {
    icon: <Power className="h-4 w-4" />,
    label: 'Shutdown',
    description: 'Permanently finalize the node',
    variant: 'destructive',
    className: 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800'
  }
}

// Ordered list of transitions for display
const TRANSITION_ORDER: LifecycleTransition[] = [
  'configure',
  'activate',
  'deactivate',
  'cleanup',
  'shutdown'
]

interface LifecycleControlsProps {
  node: LifecycleNodeInfo
}

export function LifecycleControls({ node }: LifecycleControlsProps) {
  const { triggerTransition } = useLifecycleNodesStore()
  
  const availableTransitions = AVAILABLE_TRANSITIONS[node.currentState]

  const handleTransition = async (transition: LifecycleTransition) => {
    await triggerTransition(node.fullPath, transition)
  }

  if (availableTransitions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p className="text-sm text-gray-500">
          No transitions available from {node.currentState} state
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">State Transitions</p>
        <div className="flex flex-wrap gap-2">
          {TRANSITION_ORDER.map((transition) => {
            const isAvailable = availableTransitions.includes(transition)
            const config = TRANSITION_CONFIG[transition]
            
            if (!isAvailable) return null

            return (
              <Tooltip key={transition}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTransition(transition)}
                    disabled={node.isTransitioning}
                    className={`${config.className} ${
                      node.isTransitioning ? 'opacity-50' : ''
                    }`}
                  >
                    {node.isTransitioning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <span className="mr-1.5">{config.icon}</span>
                    )}
                    {config.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

