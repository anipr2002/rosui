import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'

export interface TFTransform {
  parent: string
  child: string
  translation: {
    x: number
    y: number
    z: number
  }
  rotation: {
    x: number
    y: number
    z: number
    w: number
  }
  timestamp: number
  isStatic: boolean
}

// Store recent timestamps for update rate calculation
const MAX_RATE_SAMPLES = 20
const RATE_WINDOW_MS = 5000 // 5 second window for rate calculation

interface TFState {
  // TF data
  tfTree: Map<string, TFTransform>
  lastUpdate: Map<string, number>
  updateTimestamps: Map<string, number[]> // For calculating update rates
  isSubscribed: boolean
  isLoading: boolean
  
  // Configuration
  staleTimeout: number // milliseconds
  
  // Actions
  subscribeTF: () => void
  unsubscribeTF: () => void
  updateTransform: (transform: TFTransform) => void
  clearStaleTransforms: () => void
  getTFTree: () => Map<string, TFTransform>
  setStaleTimeout: (timeout: number) => void
  getUpdateRate: (frameKey: string) => number
  getAllUpdateRates: () => Map<string, number>
  exportTreeAsJSON: () => string
}

// Internal references to topics
let tfTopic: ROSLIB.Topic | null = null
let tfStaticTopic: ROSLIB.Topic | null = null
let staleCheckInterval: NodeJS.Timeout | null = null

export const useTFStore = create<TFState>((set, get) => ({
  tfTree: new Map(),
  lastUpdate: new Map(),
  updateTimestamps: new Map(),
  isSubscribed: false,
  isLoading: false,
  staleTimeout: 10000, // 10 seconds default

  subscribeTF: () => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      console.error('ROS connection not available')
      return
    }

    const { isSubscribed } = get()
    if (isSubscribed) {
      console.warn('Already subscribed to TF topics')
      return
    }

    set({ isLoading: true })

    try {
      // Subscribe to /tf (dynamic transforms)
      tfTopic = new ROSLIB.Topic({
        ros,
        name: '/tf',
        messageType: 'tf2_msgs/TFMessage'
      })

      tfTopic.subscribe((message: any) => {
        const transforms = message.transforms || []
        transforms.forEach((transform: any) => {
          const tfTransform: TFTransform = {
            parent: transform.header.frame_id,
            child: transform.child_frame_id,
            translation: {
              x: transform.transform.translation.x,
              y: transform.transform.translation.y,
              z: transform.transform.translation.z
            },
            rotation: {
              x: transform.transform.rotation.x,
              y: transform.transform.rotation.y,
              z: transform.transform.rotation.z,
              w: transform.transform.rotation.w
            },
            timestamp: Date.now(),
            isStatic: false
          }
          get().updateTransform(tfTransform)
        })
      })

      // Subscribe to /tf_static (static transforms)
      tfStaticTopic = new ROSLIB.Topic({
        ros,
        name: '/tf_static',
        messageType: 'tf2_msgs/TFMessage'
      })

      tfStaticTopic.subscribe((message: any) => {
        const transforms = message.transforms || []
        transforms.forEach((transform: any) => {
          const tfTransform: TFTransform = {
            parent: transform.header.frame_id,
            child: transform.child_frame_id,
            translation: {
              x: transform.transform.translation.x,
              y: transform.transform.translation.y,
              z: transform.transform.translation.z
            },
            rotation: {
              x: transform.transform.rotation.x,
              y: transform.transform.rotation.y,
              z: transform.transform.rotation.z,
              w: transform.transform.rotation.w
            },
            timestamp: Date.now(),
            isStatic: true
          }
          get().updateTransform(tfTransform)
        })
      })

      // Set up periodic stale check
      staleCheckInterval = setInterval(() => {
        get().clearStaleTransforms()
      }, 1000) // Check every second

      set({ isSubscribed: true, isLoading: false })
      console.log('Successfully subscribed to TF topics')
    } catch (error) {
      console.error('Failed to subscribe to TF topics:', error)
      set({ isLoading: false })
    }
  },

  unsubscribeTF: () => {
    const { isSubscribed } = get()
    if (!isSubscribed) return

    try {
      if (tfTopic) {
        tfTopic.unsubscribe()
        tfTopic = null
      }

      if (tfStaticTopic) {
        tfStaticTopic.unsubscribe()
        tfStaticTopic = null
      }

      if (staleCheckInterval) {
        clearInterval(staleCheckInterval)
        staleCheckInterval = null
      }

      set({
        tfTree: new Map(),
        lastUpdate: new Map(),
        updateTimestamps: new Map(),
        isSubscribed: false
      })

      console.log('Successfully unsubscribed from TF topics')
    } catch (error) {
      console.error('Failed to unsubscribe from TF topics:', error)
    }
  },

  updateTransform: (transform: TFTransform) => {
    const { tfTree, lastUpdate, updateTimestamps } = get()
    const key = `${transform.parent}->${transform.child}`
    const now = transform.timestamp

    const newTfTree = new Map(tfTree)
    const newLastUpdate = new Map(lastUpdate)
    const newUpdateTimestamps = new Map(updateTimestamps)

    newTfTree.set(key, transform)
    newLastUpdate.set(key, now)

    // Track timestamps for rate calculation
    const timestamps = newUpdateTimestamps.get(key) || []
    timestamps.push(now)
    
    // Keep only recent timestamps within the rate window
    const cutoff = now - RATE_WINDOW_MS
    const filteredTimestamps = timestamps.filter(t => t > cutoff).slice(-MAX_RATE_SAMPLES)
    newUpdateTimestamps.set(key, filteredTimestamps)

    set({ tfTree: newTfTree, lastUpdate: newLastUpdate, updateTimestamps: newUpdateTimestamps })
  },

  clearStaleTransforms: () => {
    const { tfTree, lastUpdate, updateTimestamps, staleTimeout } = get()
    const now = Date.now()
    let hasChanges = false

    const newTfTree = new Map(tfTree)
    const newLastUpdate = new Map(lastUpdate)
    const newUpdateTimestamps = new Map(updateTimestamps)

    // Remove transforms that haven't been updated and are not static
    tfTree.forEach((transform, key) => {
      const lastUpdateTime = lastUpdate.get(key) || 0
      const age = now - lastUpdateTime

      // Only remove non-static transforms that are stale
      if (!transform.isStatic && age > staleTimeout) {
        newTfTree.delete(key)
        newLastUpdate.delete(key)
        newUpdateTimestamps.delete(key)
        hasChanges = true
      }
    })

    if (hasChanges) {
      set({ tfTree: newTfTree, lastUpdate: newLastUpdate, updateTimestamps: newUpdateTimestamps })
    }
  },

  getTFTree: () => {
    return get().tfTree
  },

  setStaleTimeout: (timeout: number) => {
    set({ staleTimeout: timeout })
  },

  /**
   * Calculate update rate (Hz) for a specific frame
   */
  getUpdateRate: (frameKey: string): number => {
    const { updateTimestamps } = get()
    const timestamps = updateTimestamps.get(frameKey)
    
    if (!timestamps || timestamps.length < 2) {
      return 0
    }

    const now = Date.now()
    const cutoff = now - RATE_WINDOW_MS
    const recentTimestamps = timestamps.filter(t => t > cutoff)
    
    if (recentTimestamps.length < 2) {
      return 0
    }

    // Calculate average rate from time differences
    const timeSpan = recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0]
    if (timeSpan <= 0) return 0
    
    const rate = ((recentTimestamps.length - 1) / timeSpan) * 1000 // Convert to Hz
    return Math.round(rate * 10) / 10 // Round to 1 decimal place
  },

  /**
   * Get update rates for all frames
   */
  getAllUpdateRates: (): Map<string, number> => {
    const { updateTimestamps, getUpdateRate } = get()
    const rates = new Map<string, number>()
    
    updateTimestamps.forEach((_, key) => {
      rates.set(key, getUpdateRate(key))
    })
    
    return rates
  },

  /**
   * Export TF tree as JSON for debugging
   */
  exportTreeAsJSON: (): string => {
    const { tfTree, lastUpdate } = get()
    const now = Date.now()
    
    const exportData = {
      exportTime: new Date().toISOString(),
      frameCount: tfTree.size,
      transforms: Array.from(tfTree.entries()).map(([key, transform]) => ({
        key,
        parent: transform.parent,
        child: transform.child,
        translation: transform.translation,
        rotation: transform.rotation,
        isStatic: transform.isStatic,
        age: now - (lastUpdate.get(key) || 0)
      }))
    }
    
    return JSON.stringify(exportData, null, 2)
  }
}))
