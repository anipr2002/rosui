'use client'

import React, { Profiler, ProfilerOnRenderCallback } from 'react'

interface ProfilerWrapperProps {
  id: string
  children: React.ReactNode
  enabled?: boolean
}

/**
 * Wrapper component for React Profiler
 * Only active in development mode
 * 
 * Usage:
 * <ProfilerWrapper id="MyComponent">
 *   <MyComponent />
 * </ProfilerWrapper>
 */
export function ProfilerWrapper({ id, children, enabled = true }: ProfilerWrapperProps) {
  const isDev = process.env.NODE_ENV === 'development'

  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    // Only log if render took significant time (> 16ms = 1 frame at 60fps)
    if (actualDuration > 16) {
      console.warn(
        `[Profiler] ${id} (${phase}):`,
        `${actualDuration.toFixed(2)}ms`,
        `(base: ${baseDuration.toFixed(2)}ms)`
      )
    } else if (actualDuration > 5) {
      console.log(
        `[Profiler] ${id} (${phase}):`,
        `${actualDuration.toFixed(2)}ms`
      )
    }
  }

  if (!isDev || !enabled) {
    return <>{children}</>
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}

/**
 * Performance metrics tracker
 * Tracks and logs performance metrics for key operations
 */
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map()
  private static isDev = process.env.NODE_ENV === 'development'

  static mark(name: string) {
    if (!this.isDev) return
    this.marks.set(name, performance.now())
  }

  static measure(name: string, markName: string) {
    if (!this.isDev) return
    
    const startTime = this.marks.get(markName)
    if (startTime === undefined) {
      console.warn(`[Performance] No mark found for: ${markName}`)
      return
    }

    const duration = performance.now() - startTime
    this.marks.delete(markName)

    if (duration > 16) {
      console.warn(`[Performance] ${name}: ${duration.toFixed(2)}ms ⚠️`)
    } else {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  static clear() {
    this.marks.clear()
  }
}

