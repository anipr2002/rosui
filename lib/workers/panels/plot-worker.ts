/**
 * Plot Worker
 * Handles chart data processing for plot panels off the main thread
 * - Parses message paths from raw ROS messages
 * - Maintains chart data history per panel
 * - Assembles multi-series data points
 */

import type {
  PlotWorkerCommand,
  PlotWorkerResponse,
  PlotWorkerConfig,
  PlotDataPoint,
  PlotSeriesConfig,
} from './panel-worker-types'

// ============================================================================
// Message Path Parser (copied to avoid import issues in workers)
// ============================================================================

interface PathParseResult {
  value: any
  success: boolean
  error?: string
}

function parseMessagePath(message: any, path: string): PathParseResult {
  try {
    const cleanPath = path.startsWith('.') ? path.slice(1) : path

    if (!cleanPath) {
      return { value: message, success: true }
    }

    const parts = cleanPath.split('.')
    let current = message

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const arrayMatch = part.match(/^(.+?)\[(.+?)\]$/)
      
      if (arrayMatch) {
        const [, fieldName, indexStr] = arrayMatch
        
        if (fieldName) {
          current = current[fieldName]
          if (current === undefined || current === null) {
            return {
              value: undefined,
              success: false,
              error: `Field '${fieldName}' not found in path '${path}'`
            }
          }
        }

        if (indexStr === ':') {
          if (!Array.isArray(current)) {
            return {
              value: undefined,
              success: false,
              error: `Field '${fieldName || 'root'}' is not an array`
            }
          }

          if (i < parts.length - 1) {
            const remainingPath = parts.slice(i + 1).join('.')
            const results = current.map(item => {
              const result = parseMessagePath(item, remainingPath)
              return result.success ? result.value : undefined
            })
            return { value: results, success: true }
          }

          return { value: current, success: true }
        }

        const index = Number.parseInt(indexStr, 10)
        if (Number.isNaN(index)) {
          return {
            value: undefined,
            success: false,
            error: `Invalid array index '${indexStr}' in path '${path}'`
          }
        }

        if (!Array.isArray(current)) {
          return {
            value: undefined,
            success: false,
            error: `Field '${fieldName || 'root'}' is not an array`
          }
        }

        current = current[index]
        if (current === undefined) {
          return {
            value: undefined,
            success: false,
            error: `Array index ${index} out of bounds in path '${path}'`
          }
        }
      } else {
        current = current[part]
        if (current === undefined || current === null) {
          return {
            value: undefined,
            success: false,
            error: `Field '${part}' not found in path '${path}'`
          }
        }
      }
    }

    return { value: current, success: true }
  } catch (error) {
    return {
      value: undefined,
      success: false,
      error: `Error parsing path '${path}': ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function extractNumericValue(value: any): number | null {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  return null
}

function parseNumericPath(message: any, path: string): number | null {
  const result = parseMessagePath(message, path)
  if (!result.success) {
    return null
  }
  return extractNumericValue(result.value)
}

// ============================================================================
// Panel State
// ============================================================================

interface PanelState {
  config: PlotWorkerConfig
  startTime: number | null
  // Store data points by timestamp for efficient merging
  dataByTimestamp: Map<number, PlotDataPoint>
}

const panelStates = new Map<string, PanelState>()

// ============================================================================
// Command Handlers
// ============================================================================

function handleConfigure(config: PlotWorkerConfig): void {
  const existing = panelStates.get(config.panelId)
  
  // Check if topics changed - if so, reset start time
  const topicsChanged = existing 
    ? JSON.stringify(existing.config.series.map(s => s.topic).sort()) !== 
      JSON.stringify(config.series.map(s => s.topic).sort())
    : true

  panelStates.set(config.panelId, {
    config,
    startTime: topicsChanged ? null : (existing?.startTime ?? null),
    dataByTimestamp: topicsChanged ? new Map() : (existing?.dataByTimestamp ?? new Map()),
  })

  // Send initial empty data
  sendProcessedData(config.panelId)
}

function handleMessage(panelId: string, seriesId: string, message: any, timestamp: number): void {
  const state = panelStates.get(panelId)
  if (!state) return

  const series = state.config.series.find(s => s.id === seriesId)
  if (!series || !series.enabled) return

  // Parse the numeric value from the message
  const value = parseNumericPath(message, series.messagePath)
  if (value === null) return

  // Initialize start time on first valid value
  if (state.startTime === null) {
    state.startTime = timestamp
  }

  // Calculate relative timestamp in seconds
  const relativeTime = (timestamp - state.startTime) / 1000

  // Get or create data point for this timestamp
  let dataPoint = state.dataByTimestamp.get(timestamp)
  if (!dataPoint) {
    dataPoint = { timestamp: relativeTime }
    state.dataByTimestamp.set(timestamp, dataPoint)
  }

  // Set the value for this series
  dataPoint[seriesId] = value

  // Trim data to max points
  if (state.dataByTimestamp.size > state.config.maxDataPoints) {
    const sortedTimestamps = Array.from(state.dataByTimestamp.keys()).sort((a, b) => a - b)
    const toRemove = sortedTimestamps.slice(0, state.dataByTimestamp.size - state.config.maxDataPoints)
    for (const ts of toRemove) {
      state.dataByTimestamp.delete(ts)
    }
  }

  // Send processed data
  sendProcessedData(panelId)
}

function handleClear(panelId: string): void {
  const state = panelStates.get(panelId)
  if (!state) return

  state.startTime = null
  state.dataByTimestamp.clear()

  sendProcessedData(panelId)
}

function handleRemovePanel(panelId: string): void {
  panelStates.delete(panelId)
}

// ============================================================================
// Response Helpers
// ============================================================================

function sendProcessedData(panelId: string): void {
  const state = panelStates.get(panelId)
  if (!state) return

  // Convert map to sorted array
  const chartData = Array.from(state.dataByTimestamp.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, dataPoint]) => {
      // Only include active series in data points
      const activeSeriesIds = new Set(state.config.series.filter(s => s.enabled).map(s => s.id))
      const filteredPoint: PlotDataPoint = { timestamp: dataPoint.timestamp }
      
      for (const key of Object.keys(dataPoint)) {
        if (key === 'timestamp' || activeSeriesIds.has(key)) {
          filteredPoint[key] = dataPoint[key]
        }
      }
      
      return filteredPoint
    })

  const activeSeries = state.config.series.filter(s => s.enabled)

  const response: PlotWorkerResponse = {
    type: 'PROCESSED_DATA',
    panelId,
    chartData,
    activeSeries,
  }

  self.postMessage(response)
}

function sendError(panelId: string, error: string): void {
  const response: PlotWorkerResponse = {
    type: 'ERROR',
    panelId,
    error,
  }

  self.postMessage(response)
}

// ============================================================================
// Main Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent<PlotWorkerCommand>) => {
  const command = event.data

  try {
    switch (command.type) {
      case 'CONFIGURE':
        handleConfigure(command.config)
        break

      case 'MESSAGE':
        handleMessage(command.panelId, command.seriesId, command.message, command.timestamp)
        break

      case 'CLEAR':
        handleClear(command.panelId)
        break

      case 'REMOVE_PANEL':
        handleRemovePanel(command.panelId)
        break

      default:
        console.error('[PlotWorker] Unknown command type:', command)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const panelId = 'panelId' in command ? command.panelId : 'unknown'
    sendError(panelId, errorMessage)
    console.error('[PlotWorker] Error processing command:', error)
  }
}

// Export empty object to make this a module
export {}

