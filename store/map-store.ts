import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'

export interface MapMetadata {
  resolution: number
  width: number
  height: number
  origin: {
    x: number
    y: number
    z: number
  }
  frameId: string
  lastUpdate: number | null
}

export interface NavigationGoal {
  x: number
  y: number
  z: number
  w: number
}

interface MapState {
  // Map metadata
  mapMetadata: MapMetadata | null
  isLoading: boolean
  error: string | null
  
  // Map topic subscription
  mapTopic: string
  mapSubscriber: ROSLIB.Topic | null
  
  // Navigation (Phase 2)
  navigationGoal: NavigationGoal | null
  navigationStatus: 'idle' | 'active' | 'succeeded' | 'aborted' | 'preempted' | null
  actionServerName: string
  
  // Actions
  setMapTopic: (topic: string) => void
  subscribeToMap: () => void
  unsubscribeFromMap: () => void
  setMapMetadata: (metadata: Partial<MapMetadata>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Navigation actions (Phase 2)
  setActionServerName: (name: string) => void
  requestNavigationGoal: (goal: NavigationGoal) => void
  cancelNavigationGoal: () => void
  
  // Cleanup
  cleanup: () => void
}

const defaultMapMetadata: MapMetadata = {
  resolution: 0,
  width: 0,
  height: 0,
  origin: { x: 0, y: 0, z: 0 },
  frameId: 'map',
  lastUpdate: null
}

export const useMapStore = create<MapState>((set, get) => ({
  mapMetadata: null,
  isLoading: false,
  error: null,
  mapTopic: '/map',
  mapSubscriber: null,
  navigationGoal: null,
  navigationStatus: null,
  actionServerName: '/move_base',

  setMapTopic: (topic) => {
    const currentSubscriber = get().mapSubscriber
    if (currentSubscriber) {
      get().unsubscribeFromMap()
    }
    set({ mapTopic: topic })
    if (useRosStore.getState().status === 'connected') {
      // Auto-resubscribe if connected
      setTimeout(() => get().subscribeToMap(), 100)
    }
  },

  subscribeToMap: () => {
    const { ros, status } = useRosStore.getState()
    const { mapTopic, mapSubscriber } = get()

    if (status !== 'connected' || !ros) {
      set({ error: 'Not connected to ROS' })
      toast.error('Cannot subscribe to map: Not connected to ROS')
      return
    }

    // Cleanup existing subscription
    if (mapSubscriber) {
      mapSubscriber.unsubscribe()
    }

    set({ isLoading: true, error: null })

    try {
      const topic = new ROSLIB.Topic({
        ros,
        name: mapTopic,
        messageType: 'nav_msgs/OccupancyGrid'
      })

      topic.subscribe((message: any) => {
        try {
          const metadata: MapMetadata = {
            resolution: message.info.resolution || 0,
            width: message.info.width || 0,
            height: message.info.height || 0,
            origin: {
              x: message.info.origin.position.x || 0,
              y: message.info.origin.position.y || 0,
              z: message.info.origin.position.z || 0
            },
            frameId: message.header.frame_id || 'map',
            lastUpdate: Date.now()
          }

          set({
            mapMetadata: metadata,
            isLoading: false,
            error: null
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to parse map message'
          set({ error: errorMsg, isLoading: false })
          console.error('Error parsing map message:', err)
        }
      })

      set({ mapSubscriber: topic, isLoading: true })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to subscribe to map topic'
      set({ error: errorMsg, isLoading: false })
      toast.error(`Failed to subscribe to map: ${errorMsg}`)
    }
  },

  unsubscribeFromMap: () => {
    const { mapSubscriber } = get()
    if (mapSubscriber) {
      mapSubscriber.unsubscribe()
      set({ mapSubscriber: null, isLoading: false })
    }
  },

  setMapMetadata: (metadata) => {
    const current = get().mapMetadata || defaultMapMetadata
    set({ mapMetadata: { ...current, ...metadata } })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  setActionServerName: (name) => {
    set({ actionServerName: name })
  },

  requestNavigationGoal: (goal) => {
    // Phase 2: Implement navigation goal request
    set({ navigationGoal: goal, navigationStatus: 'active' })
    toast.info('Navigation goal sent')
  },

  cancelNavigationGoal: () => {
    // Phase 2: Implement navigation goal cancellation
    set({ navigationGoal: null, navigationStatus: 'aborted' })
    toast.info('Navigation goal cancelled')
  },

  cleanup: () => {
    const { mapSubscriber } = get()
    if (mapSubscriber) {
      mapSubscriber.unsubscribe()
    }
    set({
      mapSubscriber: null,
      isLoading: false,
      error: null,
      navigationGoal: null,
      navigationStatus: null
    })
  }
}))

