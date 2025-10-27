import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'

export interface ParamInfo {
  name: string
  value?: any
  type?: string
  lastFetched?: number
}

export interface ValueRecord {
  value: any
  timestamp: number
}

export interface WatchedParamInfo {
  name: string
  value: any
  isWatching: boolean
  pollRate: number
  intervalId?: NodeJS.Timeout
  history: ValueRecord[]
  lastValue?: any
}

interface ParamsState {
  // Parameters list
  params: ParamInfo[]
  isLoadingParams: boolean
  
  // Cached values
  paramValues: Map<string, any>
  
  // Watched parameters
  watchedParams: Map<string, WatchedParamInfo>
  
  // Actions - Parameters
  getParamsList: () => Promise<void>
  
  // Actions - Single parameter operations
  getParamValue: (name: string) => Promise<any>
  setParamValue: (name: string, value: any) => Promise<void>
  deleteParam: (name: string) => Promise<void>
  
  // Actions - Watching
  startWatching: (name: string, pollRate: number) => void
  stopWatching: (name: string) => void
  clearWatchHistory: (name: string) => void
  
  // Cleanup
  cleanup: () => void
}

export const useParamsStore = create<ParamsState>((set, get) => ({
  params: [],
  isLoadingParams: false,
  
  paramValues: new Map(),
  watchedParams: new Map(),

  getParamsList: async () => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      console.error('ROS connection not available')
      return
    }

    set({ isLoadingParams: true })

    try {
      ros.getParams(
        (paramNames: string[]) => {
          try {
            const paramsList: ParamInfo[] = paramNames.map((name) => ({
              name,
              value: undefined,
              type: undefined,
              lastFetched: undefined
            }))

            set({
              params: paramsList,
              isLoadingParams: false
            })

            console.log(`Loaded ${paramsList.length} parameters successfully`)
          } catch (error) {
            console.error('Error processing parameters data:', error)
            set({ isLoadingParams: false })
          }
        },
        (error: any) => {
          console.error('Failed to load parameters:', error)
          set({ isLoadingParams: false })
        }
      )
    } catch (error) {
      console.error('Error loading parameters:', error)
      set({ isLoadingParams: false })
    }
  },

  getParamValue: async (name: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      const error = new Error('ROS connection not available')
      console.error(error.message)
      throw error
    }

    const { paramValues, params } = get()
    
    // Return cached data if available and recent (less than 30 seconds old)
    const cached = params.find(p => p.name === name)
    if (cached?.value !== undefined && cached.lastFetched && Date.now() - cached.lastFetched < 30000) {
      return cached.value
    }

    return new Promise((resolve, reject) => {
      try {
        const param = new ROSLIB.Param({
          ros,
          name
        })

        param.get(
          (value: any) => {
            try {
              // Update cache
              const newParamValues = new Map(paramValues)
              newParamValues.set(name, value)

              // Update params list
              const newParams = params.map(p => 
                p.name === name 
                  ? { ...p, value, type: typeof value, lastFetched: Date.now() }
                  : p
              )

              set({ 
                paramValues: newParamValues,
                params: newParams
              })

              console.log(`Fetched parameter ${name}:`, value)
              resolve(value)
            } catch (error) {
              console.error(`Error processing parameter value for ${name}:`, error)
              reject(error)
            }
          },
          (error: any) => {
            const errorMsg = error?.error || error?.message || 'Failed to get parameter'
            console.error(`Failed to get parameter ${name}:`, errorMsg)
            reject(new Error(errorMsg))
          }
        )
      } catch (error) {
        console.error(`Error getting parameter ${name}:`, error)
        reject(error)
      }
    })
  },

  setParamValue: async (name: string, value: any) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      const error = new Error('ROS connection not available')
      console.error(error.message)
      throw error
    }

    return new Promise((resolve, reject) => {
      try {
        const param = new ROSLIB.Param({
          ros,
          name
        })

        param.set(
          value,
          () => {
            try {
              const { paramValues, params } = get()
              
              // Update cache
              const newParamValues = new Map(paramValues)
              newParamValues.set(name, value)

              // Update params list
              const newParams = params.map(p => 
                p.name === name 
                  ? { ...p, value, type: typeof value, lastFetched: Date.now() }
                  : p
              )

              set({ 
                paramValues: newParamValues,
                params: newParams
              })

              console.log(`Set parameter ${name}:`, value)
              resolve()
            } catch (error) {
              console.error(`Error updating cache for ${name}:`, error)
              reject(error)
            }
          },
          (error: any) => {
            const errorMsg = error?.error || error?.message || 'Failed to set parameter'
            console.error(`Failed to set parameter ${name}:`, errorMsg)
            reject(new Error(errorMsg))
          }
        )
      } catch (error) {
        console.error(`Error setting parameter ${name}:`, error)
        reject(error)
      }
    })
  },

  deleteParam: async (name: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      const error = new Error('ROS connection not available')
      console.error(error.message)
      throw error
    }

    return new Promise((resolve, reject) => {
      try {
        const param = new ROSLIB.Param({
          ros,
          name
        })

        param.delete(
          () => {
            try {
              const { paramValues, params, watchedParams } = get()
              
              // Stop watching if currently watching
              if (watchedParams.has(name)) {
                get().stopWatching(name)
              }
              
              // Remove from cache
              const newParamValues = new Map(paramValues)
              newParamValues.delete(name)

              // Remove from params list
              const newParams = params.filter(p => p.name !== name)

              set({ 
                paramValues: newParamValues,
                params: newParams
              })

              console.log(`Deleted parameter ${name}`)
              resolve()
            } catch (error) {
              console.error(`Error removing parameter ${name} from cache:`, error)
              reject(error)
            }
          },
          (error: any) => {
            const errorMsg = error?.error || error?.message || 'Failed to delete parameter'
            console.error(`Failed to delete parameter ${name}:`, errorMsg)
            reject(new Error(errorMsg))
          }
        )
      } catch (error) {
        console.error(`Error deleting parameter ${name}:`, error)
        reject(error)
      }
    })
  },

  startWatching: (name: string, pollRate: number) => {
    const { watchedParams } = get()
    
    // Don't start if already watching
    if (watchedParams.has(name) && watchedParams.get(name)?.isWatching) {
      console.warn(`Already watching parameter: ${name}`)
      return
    }

    // Validate poll rate
    if (pollRate <= 0 || pollRate > 10) {
      const error = new Error('Poll rate must be between 0.1 and 10 Hz')
      console.error(error.message)
      throw error
    }

    try {
      // Get initial value
      get().getParamValue(name).then((initialValue) => {
        const intervalMs = 1000 / pollRate
        
        const watchedParam: WatchedParamInfo = {
          name,
          value: initialValue,
          isWatching: true,
          pollRate,
          history: [{
            value: initialValue,
            timestamp: Date.now()
          }],
          lastValue: initialValue
        }

        // Start polling
        const intervalId = setInterval(async () => {
          try {
            const value = await get().getParamValue(name)
            const { watchedParams } = get()
            const watched = watchedParams.get(name)
            
            if (!watched) return

            // Only add to history if value changed
            const valueChanged = JSON.stringify(value) !== JSON.stringify(watched.lastValue)
            
            if (valueChanged) {
              const newHistory = [
                { value, timestamp: Date.now() },
                ...watched.history
              ].slice(0, 50) // Keep only last 50 records

              const newWatchedParams = new Map(watchedParams)
              newWatchedParams.set(name, {
                ...watched,
                value,
                history: newHistory,
                lastValue: value
              })

              set({ watchedParams: newWatchedParams })
            }
          } catch (error) {
            console.error(`Failed to poll parameter ${name}:`, error)
            // Continue polling even on error
          }
        }, intervalMs)

        watchedParam.intervalId = intervalId

        const newWatchedParams = new Map(watchedParams)
        newWatchedParams.set(name, watchedParam)
        
        set({ watchedParams: newWatchedParams })
        console.log(`Started watching parameter ${name} at ${pollRate} Hz`)
      }).catch((error) => {
        console.error(`Failed to get initial value for ${name}:`, error)
        throw error
      })
    } catch (error) {
      console.error(`Failed to start watching parameter ${name}:`, error)
      throw error
    }
  },

  stopWatching: (name: string) => {
    const { watchedParams } = get()
    const watched = watchedParams.get(name)
    
    if (!watched) {
      console.warn(`Parameter ${name} is not being watched`)
      return
    }

    if (watched.intervalId) {
      clearInterval(watched.intervalId)
    }

    const newWatchedParams = new Map(watchedParams)
    newWatchedParams.set(name, {
      ...watched,
      isWatching: false,
      intervalId: undefined
    })
    
    set({ watchedParams: newWatchedParams })
    console.log(`Stopped watching parameter ${name}`)
  },

  clearWatchHistory: (name: string) => {
    const { watchedParams } = get()
    const watched = watchedParams.get(name)
    
    if (!watched) {
      console.warn(`Parameter ${name} is not being watched`)
      return
    }

    try {
      const newWatchedParams = new Map(watchedParams)
      newWatchedParams.set(name, {
        ...watched,
        history: watched.value !== undefined ? [{
          value: watched.value,
          timestamp: Date.now()
        }] : []
      })
      
      set({ watchedParams: newWatchedParams })
      console.log(`Cleared watch history for parameter ${name}`)
    } catch (error) {
      console.error(`Failed to clear watch history for ${name}:`, error)
      throw error
    }
  },

  cleanup: () => {
    const { watchedParams } = get()
    
    // Stop all watchers
    watchedParams.forEach((watched) => {
      if (watched.intervalId) {
        clearInterval(watched.intervalId)
      }
    })
    
    // Clear state
    set({
      watchedParams: new Map()
    })

    console.log('Cleaned up all parameter watchers')
  }
}))

