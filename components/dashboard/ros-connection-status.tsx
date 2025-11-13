'use client'

import { useRosStore } from '@/store/ros-store'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function RosConnectionStatus () {
  const status = useRosStore((state) => state.status)

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const isDisconnected = status === 'disconnected' || status === 'error'

  return (
    <Link
      href="/dashboard/settings/ros-connection"
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
        'border hover:shadow-sm',
        isConnected && 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
        isDisconnected && 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
        isConnecting && 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
      )}
    >
      {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
      {isConnected && <Wifi className="h-4 w-4" />}
      {isDisconnected && <WifiOff className="h-4 w-4" />}
      <span className="hidden sm:inline">
        {isConnecting && 'Connecting'}
        {isConnected && 'Connected'}
        {isDisconnected && 'Disconnected'}
      </span>
    </Link>
  )
}











