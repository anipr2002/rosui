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

interface TFState {
  // TF data
  tfTree: Map<string, TFTransform>
  lastUpdate: Map<string, number>
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
}

// Internal references to topics
let tfTopic: ROSLIB.Topic | null = null
let tfStaticTopic: ROSLIB.Topic | null = null
let staleCheckInterval: NodeJS.Timeout | null = null

export const useTFStore = create<TFState>((set, get) => ({
  tfTree: new Map(),
  lastUpdate: new Map(),
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
        isSubscribed: false
      })

      console.log('Successfully unsubscribed from TF topics')
    } catch (error) {
      console.error('Failed to unsubscribe from TF topics:', error)
    }
  },

  updateTransform: (transform: TFTransform) => {
    const { tfTree, lastUpdate } = get()
    const key = `${transform.parent}->${transform.child}`

    const newTfTree = new Map(tfTree)
    const newLastUpdate = new Map(lastUpdate)

    newTfTree.set(key, transform)
    newLastUpdate.set(key, transform.timestamp)

    set({ tfTree: newTfTree, lastUpdate: newLastUpdate })
  },

  clearStaleTransforms: () => {
    const { tfTree, lastUpdate, staleTimeout } = get()
    const now = Date.now()
    let hasChanges = false

    const newTfTree = new Map(tfTree)
    const newLastUpdate = new Map(lastUpdate)

    // Remove transforms that haven't been updated and are not static
    tfTree.forEach((transform, key) => {
      const lastUpdateTime = lastUpdate.get(key) || 0
      const age = now - lastUpdateTime

      // Only remove non-static transforms that are stale
      if (!transform.isStatic && age > staleTimeout) {
        newTfTree.delete(key)
        newLastUpdate.delete(key)
        hasChanges = true
      }
    })

    if (hasChanges) {
      set({ tfTree: newTfTree, lastUpdate: newLastUpdate })
    }
  },

  getTFTree: () => {
    return get().tfTree
  },

  setStaleTimeout: (timeout: number) => {
    set({ staleTimeout: timeout })
  }
}))

