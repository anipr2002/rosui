import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { WorkflowNodeData } from '../store/workflow-store'
import { 
  Activity, 
  Zap, 
  Play, 
  Share2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Clock,
  Radio
} from 'lucide-react'

const categoryStyles = {
  trigger: {
    border: 'border-blue-400',
    activeBorder: 'border-blue-500',
    runningGlow: 'shadow-blue-400/50',
    icon: Zap,
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  logic: {
    border: 'border-purple-400',
    activeBorder: 'border-purple-500',
    runningGlow: 'shadow-purple-400/50',
    icon: Activity,
    iconColor: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700',
  },
  action: {
    border: 'border-orange-400',
    activeBorder: 'border-orange-500',
    runningGlow: 'shadow-orange-400/50',
    icon: Play,
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
  integration: {
    border: 'border-green-400',
    activeBorder: 'border-green-500',
    runningGlow: 'shadow-green-400/50',
    icon: Share2,
    iconColor: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
  },
}

// Enhanced Status LED Indicator
const StatusIndicator = ({ status }: { status?: string }) => {
  if (!status || status === 'idle') {
    return (
      <div className="relative">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      </div>
    )
  }
  
  if (status === 'queued') {
    return (
      <div className="relative">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <Clock className="w-3 h-3 text-gray-500 absolute -top-0.5 -right-0.5" />
      </div>
    )
  }
  
  if (status === 'running') {
    return (
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-4 h-4 rounded-full bg-yellow-400/30 animate-ping" />
        {/* Inner solid dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
        {/* Spinning loader */}
        <Loader2 className="w-4 h-4 text-yellow-600 absolute animate-spin" />
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="relative">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        {/* Success flash animation */}
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400/50 animate-ping-once" />
      </div>
    )
  }
  
  if (status === 'failure') {
    return (
      <div className="relative">
        <AlertCircle className="w-4 h-4 text-red-500" />
        {/* Failure flash animation */}
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-400/50 animate-ping-once" />
      </div>
    )
  }
  
  if (status === 'skipped') {
    return (
      <div className="relative">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 opacity-50" />
      </div>
    )
  }
  
  return null
}

const CustomNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const style = categoryStyles[data.category] || categoryStyles.trigger
  const Icon = style.icon
  const isRunning = data.status === 'running'
  const isSuccess = data.status === 'success'
  const isFailure = data.status === 'failure'
  const isQueued = data.status === 'queued'

  return (
    <Card
      className={cn(
        'w-64 transition-all duration-300',
        style.border,
        // Selection state
        selected && 'ring-2 ring-offset-2 ring-indigo-500',
        // Running state - pulsing border and glow
        isRunning && [
          'border-2',
          style.activeBorder,
          'shadow-lg',
          style.runningGlow,
          'animate-pulse-border'
        ],
        // Success state - brief green highlight
        isSuccess && 'border-green-500 shadow-md shadow-green-400/30',
        // Failure state - red highlight
        isFailure && 'border-red-500 shadow-md shadow-red-400/30',
        // Queued state - subtle highlight
        isQueued && 'opacity-80',
        // Default state
        !isRunning && !isSuccess && !isFailure && 'shadow-sm',
        'bg-white'
      )}
    >
      {/* Input Handle - Not for Triggers unless enabled */}
      {(data.category !== 'trigger' || data.allowInput) && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            'w-3 h-3 border-2 border-white transition-colors',
            isRunning ? '!bg-yellow-500' : '!bg-gray-400'
          )}
        />
      )}

      <CardHeader className={cn(
        'p-3 pb-2 flex flex-row items-center justify-between space-y-0 rounded-t-xl border-b transition-colors',
        isRunning && 'bg-yellow-50/50',
        isSuccess && 'bg-green-50/50',
        isFailure && 'bg-red-50/50',
        !isRunning && !isSuccess && !isFailure && 'bg-gray-50/50'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1 rounded transition-colors',
            isRunning && 'bg-yellow-100',
            isSuccess && 'bg-green-100',
            isFailure && 'bg-red-100'
          )}>
            <Icon className={cn(
              'w-4 h-4 transition-colors',
              isRunning && 'text-yellow-600 animate-pulse',
              isSuccess && 'text-green-600',
              isFailure && 'text-red-600',
              !isRunning && !isSuccess && !isFailure && style.iconColor
            )} />
          </div>
          <span className="font-semibold text-sm text-gray-700">{data.label}</span>
        </div>
        <StatusIndicator status={data.status} />
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="flex flex-col gap-1">
          <Badge 
            variant="secondary" 
            className={cn(
              'w-fit text-[10px] px-1.5 py-0 transition-colors',
              isRunning && 'bg-yellow-100 text-yellow-700',
              isSuccess && 'bg-green-100 text-green-700',
              isFailure && 'bg-red-100 text-red-700',
              !isRunning && !isSuccess && !isFailure && style.badge
            )}
          >
            {data.category.toUpperCase()}
          </Badge>
          
          {data.topicName && (
            <div className="text-xs text-gray-500 mt-1">
              Topic: <span className="font-mono text-gray-700">{data.topicName}</span>
            </div>
          )}
          
          {data.paramName && (
            <div className="text-xs text-gray-500 mt-1">
              Param: <span className="font-mono text-gray-700">{data.paramName}</span>
            </div>
          )}
          
          {data.serviceName && (
            <div className="text-xs text-gray-500 mt-1">
              Service: <span className="font-mono text-gray-700">{data.serviceName}</span>
            </div>
          )}
          
          {data.interval && (
            <div className="text-xs text-gray-500 mt-1">
              Interval: <span className="font-mono text-gray-700">{data.interval}ms</span>
            </div>
          )}
          
          {data.scriptLanguage && (
            <div className="text-xs text-gray-500 mt-1">
              Lang: <span className="font-mono text-gray-700">{data.scriptLanguage}</span>
            </div>
          )}

          {/* Running indicator bar */}
          {isRunning && (
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full animate-progress" />
            </div>
          )}
        </div>
      </CardContent>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          'w-3 h-3 border-2 border-white transition-colors',
          isRunning ? '!bg-yellow-500' : 
          isSuccess ? '!bg-green-500' : 
          isFailure ? '!bg-red-500' : '!bg-gray-400'
        )}
      />
    </Card>
  )
}

export default memo(CustomNode)

// Add these styles to your global CSS or tailwind config
// @keyframes ping-once {
//   0% { transform: scale(1); opacity: 1; }
//   100% { transform: scale(1.5); opacity: 0; }
// }
// .animate-ping-once {
//   animation: ping-once 0.5s ease-out forwards;
// }
// @keyframes progress {
//   0% { width: 0%; }
//   100% { width: 100%; }
// }
// .animate-progress {
//   animation: progress 2s ease-in-out infinite;
// }
// @keyframes pulse-border {
//   0%, 100% { border-color: currentColor; }
//   50% { border-color: transparent; }
// }
// .animate-pulse-border {
//   animation: pulse-border 1s ease-in-out infinite;
// }
