import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ROSLIB from 'roslib'
import { toast } from 'sonner'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export type TransportLibrary = 'websocket' | 'workersocket' | 'socket.io'

interface RosConnectionConfig {
  url: string
  groovyCompatibility: boolean
  transportLibrary: TransportLibrary
  autoReconnect: boolean
  reconnectInterval: number
}

interface RosState {
  // Connection state
  ros: ROSLIB.Ros | null
  status: ConnectionStatus
  errorMessage: string | null
  
  // Configuration
  config: RosConnectionConfig
  
  // Actions
  setConfig: (config: Partial<RosConnectionConfig>) => void
  connect: () => Promise<void>
  disconnect: () => void
  resetError: () => void
}

const defaultConfig: RosConnectionConfig = {
  url: 'ws://localhost:9090',
  groovyCompatibility: false,
  transportLibrary: 'websocket',
  autoReconnect: true,
  reconnectInterval: 3000
}

export const useRosStore = create<RosState>()(
  persist(
    (set, get) => ({
      ros: null,
      status: 'disconnected',
      errorMessage: null,
      config: defaultConfig,

      setConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig }
        }))
      },

      connect: async () => {
        const { config, ros: existingRos } = get()
        
        // Disconnect existing connection
        if (existingRos) {
          existingRos.close()
        }

        set({ status: 'connecting', errorMessage: null })
        toast.loading('Connecting to ROS...', { id: 'ros-connection' })

        try {
          const ros = new ROSLIB.Ros({
            url: config.url,
            groovyCompatibility: config.groovyCompatibility,
            transportLibrary: config.transportLibrary
          })

          // Connection event handlers
          ros.on('connection', () => {
            set({ status: 'connected', errorMessage: null })
            console.log('Connected to ROS')
            toast.success('Connected to ROS successfully!', { id: 'ros-connection' })
          })

          ros.on('error', (error: any) => {
            console.error('ROS connection error:', error)
            const errorMessage = error?.message || 'Connection error occurred'
            set({ 
              status: 'error', 
              errorMessage 
            })
            toast.error(`ROS Connection Error: ${errorMessage}`, { id: 'ros-connection' })

            // Auto-reconnect logic
            if (config.autoReconnect) {
              setTimeout(() => {
                const currentStatus = get().status
                if (currentStatus === 'error' || currentStatus === 'disconnected') {
                  get().connect()
                }
              }, config.reconnectInterval)
            }
          })

          ros.on('close', () => {
            console.log('Disconnected from ROS')
            const currentStatus = get().status
            if (currentStatus !== 'error') {
              set({ status: 'disconnected' })
              toast.info('Disconnected from ROS', { id: 'ros-connection' })
            }
          })

          set({ ros })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create ROS connection'
          set({ status: 'error', errorMessage: message })
          toast.error(`Failed to create ROS connection: ${message}`, { id: 'ros-connection' })
        }
      },

      disconnect: () => {
        const { ros } = get()
        if (ros) {
          ros.close()
          set({ ros: null, status: 'disconnected', errorMessage: null })
          toast.info('Disconnected from ROS', { id: 'ros-connection' })
        }
      },

      resetError: () => {
        set({ errorMessage: null })
      }
    }),
    {
      name: 'ros-connection-storage',
      partialize: (state) => ({ 
        config: state.config,
        status: state.status
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-reconnect if we were previously connected
        if (state && state.status === 'connected') {
          // Reset status to disconnected first
          state.status = 'disconnected'
          // Then attempt to reconnect
          state.connect()
        }
      }
    }
  )
)

