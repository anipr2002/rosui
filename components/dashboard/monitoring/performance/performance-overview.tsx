'use client'

import React from 'react'
import { Activity, Cpu, MemoryStick, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePerformanceStore, MetricStats } from '@/store/performance-store'

function getStatusColor(value: number | undefined): 'green' | 'amber' | 'red' | 'gray' {
  if (value === undefined) return 'gray'
  if (value < 70) return 'green'
  if (value < 90) return 'amber'
  return 'red'
}

function getStatusLabel(value: number | undefined): string {
  if (value === undefined) return 'N/A'
  if (value < 70) return 'Normal'
  if (value < 90) return 'Warning'
  return 'Critical'
}

interface MetricCardProps {
  title: string
  icon: React.ReactNode
  stats: MetricStats | null
  unit?: string
  colorScheme: 'blue' | 'green' | 'purple' | 'orange'
}

function MetricCard({ title, icon, stats, unit = '%', colorScheme }: MetricCardProps) {
  const statusColor = getStatusColor(stats?.current)
  const statusLabel = getStatusLabel(stats?.current)

  const colorClasses = {
    blue: {
      header: 'bg-blue-50 border-blue-200',
      title: 'text-blue-900',
      desc: 'text-blue-700'
    },
    green: {
      header: 'bg-green-50 border-green-200',
      title: 'text-green-900',
      desc: 'text-green-700'
    },
    purple: {
      header: 'bg-purple-50 border-purple-200',
      title: 'text-purple-900',
      desc: 'text-purple-700'
    },
    orange: {
      header: 'bg-orange-50 border-orange-200',
      title: 'text-orange-900',
      desc: 'text-orange-700'
    }
  }

  const badgeClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className={`${colorClasses[colorScheme].header} border-b rounded-t-xl pt-4 pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={colorClasses[colorScheme].title}>{icon}</div>
            <CardTitle className={`text-sm font-medium ${colorClasses[colorScheme].title}`}>
              {title}
            </CardTitle>
          </div>
          <Badge variant="outline" className={`text-xs ${badgeClasses[statusColor]}`}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {stats ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {stats.current.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-gray-500">Min</div>
                <div className="font-mono font-medium text-gray-700">
                  {stats.min.toFixed(1)}
                </div>
              </div>
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-gray-500">Avg</div>
                <div className="font-mono font-medium text-gray-700">
                  {stats.avg.toFixed(1)}
                </div>
              </div>
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="text-gray-500">Max</div>
                <div className="font-mono font-medium text-gray-700">
                  {stats.max.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-400">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PerformanceOverview() {
  const cpuStats = usePerformanceStore((state) => state.cpuStats)
  const memoryStats = usePerformanceStore((state) => state.memoryStats)
  const networkTxStats = usePerformanceStore((state) => state.networkTxStats)
  const networkRxStats = usePerformanceStore((state) => state.networkRxStats)
  const isSubscribed = usePerformanceStore((state) => state.isSubscribed)
  const lastUpdate = usePerformanceStore((state) => state.lastUpdate)

  const hasAnyData = cpuStats || memoryStats || networkTxStats || networkRxStats

  return (
    <Card className="shadow-none pt-0 rounded-xl">
      <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-900" />
            <div>
              <CardTitle className="text-base text-blue-900">
                Performance Overview
              </CardTitle>
              <CardDescription className="text-xs text-blue-700">
                Real-time system metrics from ROS diagnostics
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
                Live
              </Badge>
            )}
            {lastUpdate && (
              <span className="text-xs text-blue-600">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {hasAnyData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="CPU Usage"
              icon={<Cpu className="h-4 w-4" />}
              stats={cpuStats}
              colorScheme="blue"
            />
            <MetricCard
              title="Memory"
              icon={<MemoryStick className="h-4 w-4" />}
              stats={memoryStats}
              colorScheme="green"
            />
            <MetricCard
              title="Network TX"
              icon={<Wifi className="h-4 w-4" />}
              stats={networkTxStats}
              unit="KB/s"
              colorScheme="purple"
            />
            <MetricCard
              title="Network RX"
              icon={<Wifi className="h-4 w-4" />}
              stats={networkRxStats}
              unit="KB/s"
              colorScheme="orange"
            />
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Waiting for Performance Data
            </div>
            <div className="text-sm text-gray-500">
              {isSubscribed
                ? 'Subscribed to diagnostics topic. Waiting for messages with CPU, memory, or network metrics.'
                : 'Not subscribed to any topic. Configure and subscribe to start monitoring.'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

