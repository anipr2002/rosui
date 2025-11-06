import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { toast } from 'sonner'

export type LogLevel = 10 | 20 | 30 | 40 | 50 // DEBUG | INFO | WARN | ERROR | FATAL

export interface LogEntry {
  id: string
  timestamp: number // milliseconds
  level: LogLevel
  name: string // logger/node name
  msg: string
  file?: string
  function?: string
  line?: number
}

export interface LogMessage {
  stamp: {
    sec: number
    nanosec: number
  }
  level: number
  name: string
  msg: string
  file: string
  function: string
  line: number
}

export interface FilterState {
  severityLevels: LogLevel[]
  nodeNames: string[]
  textSearch: string
  useRegex: boolean
  timeRange: 'all' | '5min' | '30min' | '1hour' | 'custom'
  customStartTime?: number
  customEndTime?: number
}

interface LogState {
  // Log data
  logs: LogEntry[]
  filteredLogs: LogEntry[]
  maxBufferSize: number
  
  // Subscription
  topic: ROSLIB.Topic | null
  isSubscribed: boolean
  isLoading: boolean
  
  // Auto-scroll state
  isAutoScrollEnabled: boolean
  unreadCount: number
  lastReadIndex: number
  
  // Filters
  filters: FilterState
  availableNodes: Set<string>
  
  // Actions
  subscribe: () => Promise<void>
  unsubscribe: () => void
  addLogEntry: (message: LogMessage) => void
  clearLogs: () => void
  setMaxBufferSize: (size: number) => void
  
  // Auto-scroll
  setAutoScroll: (enabled: boolean) => void
  markAsRead: () => void
  
  // Filters
  setFilter: (filter: Partial<FilterState>) => void
  clearFilters: () => void
  applyFilters: () => void
  
  // Export
  exportLogsAsJSON: () => void
  exportLogsAsCSV: () => void
}

const LOG_TOPIC = '/rosout'
const LOG_MESSAGE_TYPE = 'rcl_interfaces/msg/Log'

const defaultFilters: FilterState = {
  severityLevels: [10, 20, 30, 40, 50],
  nodeNames: [],
  textSearch: '',
  useRegex: false,
  timeRange: 'all'
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],
      filteredLogs: [],
      maxBufferSize: 500,
      
      topic: null,
      isSubscribed: false,
      isLoading: false,
      
      isAutoScrollEnabled: true,
      unreadCount: 0,
      lastReadIndex: -1,
      
      filters: defaultFilters,
      availableNodes: new Set(),

      subscribe: async () => {
        const ros = useRosStore.getState().ros
        if (!ros || !ros.isConnected) {
          toast.error('ROS connection not available')
          throw new Error('ROS connection not available')
        }

        const { topic: existingTopic } = get()
        if (existingTopic) {
          console.warn('Already subscribed to logs')
          return
        }

        set({ isLoading: true })

        try {
          const topic = new ROSLIB.Topic({
            ros,
            name: LOG_TOPIC,
            messageType: LOG_MESSAGE_TYPE
          })

          topic.subscribe((message: any) => {
            try {
              get().addLogEntry(message as LogMessage)
            } catch (error) {
              console.error('Error processing log message:', error)
            }
          })

          set({
            topic,
            isSubscribed: true,
            isLoading: false
          })

          console.log(`Successfully subscribed to ${LOG_TOPIC}`)
          toast.success('Connected to ROS logs')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to subscribe'
          console.error('Failed to subscribe to logs:', error)
          toast.error(`Failed to subscribe to logs: ${message}`)
          set({ isLoading: false })
          throw error
        }
      },

      unsubscribe: () => {
        const { topic } = get()
        if (topic) {
          try {
            topic.unsubscribe()
            set({
              topic: null,
              isSubscribed: false
            })
            console.log('Unsubscribed from logs')
            toast.info('Disconnected from ROS logs')
          } catch (error) {
            console.error('Failed to unsubscribe from logs:', error)
          }
        }
      },

      addLogEntry: (message: LogMessage) => {
        const { logs, maxBufferSize, availableNodes, isAutoScrollEnabled } = get()
        
        // Convert ROS timestamp to milliseconds
        const timestamp = message.stamp.sec * 1000 + message.stamp.nanosec / 1000000
        
        const entry: LogEntry = {
          id: `${timestamp}-${Math.random()}`,
          timestamp,
          level: message.level as LogLevel,
          name: message.name,
          msg: message.msg,
          file: message.file,
          function: message.function,
          line: message.line
        }

        // Add to available nodes
        const newAvailableNodes = new Set(availableNodes)
        newAvailableNodes.add(message.name)

        // Circular buffer: keep only the most recent maxBufferSize entries
        const newLogs = [...logs, entry]
        if (newLogs.length > maxBufferSize) {
          newLogs.shift()
        }

        // Update unread count if auto-scroll is disabled
        const newUnreadCount = isAutoScrollEnabled ? 0 : get().unreadCount + 1

        set({
          logs: newLogs,
          availableNodes: newAvailableNodes,
          unreadCount: newUnreadCount
        })

        // Apply filters to update filtered logs
        get().applyFilters()
      },

      clearLogs: () => {
        set({
          logs: [],
          filteredLogs: [],
          unreadCount: 0,
          lastReadIndex: -1
        })
        toast.success('Logs cleared')
      },

      setMaxBufferSize: (size: number) => {
        const { logs } = get()
        let newLogs = logs
        
        // Trim logs if new size is smaller
        if (logs.length > size) {
          newLogs = logs.slice(logs.length - size)
        }
        
        set({
          maxBufferSize: size,
          logs: newLogs
        })
        
        get().applyFilters()
      },

      setAutoScroll: (enabled: boolean) => {
        set({
          isAutoScrollEnabled: enabled,
          unreadCount: enabled ? 0 : get().unreadCount
        })
        
        if (enabled) {
          get().markAsRead()
        }
      },

      markAsRead: () => {
        const { logs } = get()
        set({
          unreadCount: 0,
          lastReadIndex: logs.length - 1
        })
      },

      setFilter: (filter: Partial<FilterState>) => {
        set({
          filters: { ...get().filters, ...filter }
        })
        get().applyFilters()
      },

      clearFilters: () => {
        set({ filters: defaultFilters })
        get().applyFilters()
      },

      applyFilters: () => {
        const { logs, filters } = get()
        
        let filtered = logs

        // Filter by severity
        if (filters.severityLevels.length > 0 && filters.severityLevels.length < 5) {
          filtered = filtered.filter(log => filters.severityLevels.includes(log.level))
        }

        // Filter by node names
        if (filters.nodeNames.length > 0) {
          filtered = filtered.filter(log => filters.nodeNames.includes(log.name))
        }

        // Filter by text search
        if (filters.textSearch.trim()) {
          if (filters.useRegex) {
            try {
              const regex = new RegExp(filters.textSearch, 'i')
              filtered = filtered.filter(log => 
                regex.test(log.msg) || regex.test(log.name)
              )
            } catch (error) {
              // Invalid regex, fall back to string search
              const search = filters.textSearch.toLowerCase()
              filtered = filtered.filter(log =>
                log.msg.toLowerCase().includes(search) ||
                log.name.toLowerCase().includes(search)
              )
            }
          } else {
            const search = filters.textSearch.toLowerCase()
            filtered = filtered.filter(log =>
              log.msg.toLowerCase().includes(search) ||
              log.name.toLowerCase().includes(search)
            )
          }
        }

        // Filter by time range
        if (filters.timeRange !== 'all') {
          const now = Date.now()
          let startTime = 0

          switch (filters.timeRange) {
            case '5min':
              startTime = now - 5 * 60 * 1000
              break
            case '30min':
              startTime = now - 30 * 60 * 1000
              break
            case '1hour':
              startTime = now - 60 * 60 * 1000
              break
            case 'custom':
              startTime = filters.customStartTime || 0
              break
          }

          filtered = filtered.filter(log => {
            if (log.timestamp < startTime) return false
            if (filters.timeRange === 'custom' && filters.customEndTime) {
              return log.timestamp <= filters.customEndTime
            }
            return true
          })
        }

        set({ filteredLogs: filtered })
      },

      exportLogsAsJSON: () => {
        const { filteredLogs } = get()
        const dataStr = JSON.stringify(filteredLogs, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rosui-logs-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Logs exported as JSON')
      },

      exportLogsAsCSV: () => {
        const { filteredLogs } = get()
        
        const headers = ['Timestamp', 'Level', 'Name', 'Message', 'File', 'Function', 'Line']
        const rows = filteredLogs.map(log => [
          new Date(log.timestamp).toISOString(),
          getLevelLabel(log.level),
          log.name,
          log.msg.replace(/"/g, '""'), // Escape quotes
          log.file || '',
          log.function || '',
          log.line?.toString() || ''
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const dataBlob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rosui-logs-${Date.now()}.csv`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Logs exported as CSV')
      }
    }),
    {
      name: 'log-storage',
      partialize: (state) => ({
        maxBufferSize: state.maxBufferSize,
        filters: state.filters
      })
    }
  )
)

// Helper function
export function getLevelLabel(level: LogLevel): string {
  switch (level) {
    case 10:
      return 'DEBUG'
    case 20:
      return 'INFO'
    case 30:
      return 'WARN'
    case 40:
      return 'ERROR'
    case 50:
      return 'FATAL'
    default:
      return 'UNKNOWN'
  }
}

export function getLevelColor(level: LogLevel): string {
  switch (level) {
    case 10:
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 20:
      return 'bg-green-100 text-green-700 border-green-200'
    case 30:
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 40:
      return 'bg-red-100 text-red-700 border-red-200'
    case 50:
      return 'bg-red-900 text-red-50 border-red-700'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}



