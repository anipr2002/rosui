import React from 'react'
import {
  Card,
  CardHeader,
  CardContent
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function RQTGraphLoading() {
  return (
    <div className="space-y-4">
      {/* Controls Card Skeleton */}
      <Card className="shadow-none pt-0 rounded-xl border-teal-200 mb-4">
        <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Badges */}
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Card Skeleton */}
      <Card className="shadow-none pt-0 rounded-xl border-teal-200">
        <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4">
          {/* Graph Visualization Area Skeleton */}
          <div className="w-full h-[600px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-md">
              {/* Simulated nodes */}
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-16 w-32 rounded-lg" />
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-16 w-32 rounded-lg" />
              </div>
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-12 w-24 rounded-lg" />
                <Skeleton className="h-2 w-6" />
                <Skeleton className="h-12 w-24 rounded-lg" />
                <Skeleton className="h-2 w-6" />
                <Skeleton className="h-12 w-24 rounded-lg" />
              </div>
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-16 w-32 rounded-lg" />
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-16 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { RQTGraphLoading }

