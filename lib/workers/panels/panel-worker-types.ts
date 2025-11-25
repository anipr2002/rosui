/**
 * Shared type definitions for panel workers
 * Used for communication between main thread and panel-specific workers
 */

// ============================================================================
// Common Types
// ============================================================================

export type PanelType = 'plot' | 'image' | 'raw-topic'

export interface MessageRecord {
  data: any
  timestamp: number
}

// ============================================================================
// Plot Worker Types
// ============================================================================

export interface PlotSeriesConfig {
  id: string
  topic: string
  messagePath: string
  label: string
  color: string
  enabled: boolean
}

export interface PlotWorkerConfig {
  panelId: string
  series: PlotSeriesConfig[]
  maxDataPoints: number
}

export interface PlotDataPoint {
  timestamp: number
  [key: string]: number
}

// Commands sent to plot worker
export type PlotWorkerCommand =
  | {
      type: 'CONFIGURE'
      config: PlotWorkerConfig
    }
  | {
      type: 'MESSAGE'
      panelId: string
      seriesId: string
      message: any
      timestamp: number
    }
  | {
      type: 'CLEAR'
      panelId: string
    }
  | {
      type: 'REMOVE_PANEL'
      panelId: string
    }

// Responses from plot worker
export type PlotWorkerResponse =
  | {
      type: 'PROCESSED_DATA'
      panelId: string
      chartData: PlotDataPoint[]
      activeSeries: PlotSeriesConfig[]
    }
  | {
      type: 'ERROR'
      panelId: string
      error: string
    }

// ============================================================================
// Image Worker Types
// ============================================================================

export type ColorMode = 'raw' | 'colormap' | 'gradient'
export type ColorMapType = 'turbo' | 'rainbow'
export type RotationAngle = 0 | 90 | 180 | 270

export interface ImageWorkerConfig {
  panelId: string
  colorMode: ColorMode
  colorMap: ColorMapType
  gradientColors?: { min: string; max: string }
  valueMin: number
  valueMax: number
  flipHorizontal: boolean
  flipVertical: boolean
  rotation: RotationAngle
}

export interface RawImageData {
  width: number
  height: number
  encoding: string
  data: ArrayBuffer
}

export interface DecodedImageData {
  width: number
  height: number
  data: ArrayBuffer // RGBA Uint8ClampedArray as transferable
  encoding: string
}

// Commands sent to image worker
export type ImageWorkerCommand =
  | {
      type: 'CONFIGURE'
      config: ImageWorkerConfig
    }
  | {
      type: 'DECODE_RAW'
      panelId: string
      image: RawImageData
      timestamp: number
    }
  | {
      type: 'REMOVE_PANEL'
      panelId: string
    }

// Responses from image worker
export type ImageWorkerResponse =
  | {
      type: 'DECODED_IMAGE'
      panelId: string
      image: DecodedImageData
      timestamp: number
    }
  | {
      type: 'ERROR'
      panelId: string
      error: string
    }

// ============================================================================
// Raw Topic Worker Types
// ============================================================================

export interface RawTopicWorkerConfig {
  panelId: string
  maxMessageLength: number
  prettyPrint: boolean
}

// Commands sent to raw topic worker
export type RawTopicWorkerCommand =
  | {
      type: 'CONFIGURE'
      config: RawTopicWorkerConfig
    }
  | {
      type: 'FORMAT_MESSAGE'
      panelId: string
      message: any
      timestamp: number
    }
  | {
      type: 'REMOVE_PANEL'
      panelId: string
    }

// Responses from raw topic worker
export type RawTopicWorkerResponse =
  | {
      type: 'FORMATTED_MESSAGE'
      panelId: string
      formattedMessage: string
      timestamp: number
    }
  | {
      type: 'ERROR'
      panelId: string
      error: string
    }

// ============================================================================
// Union Types for Panel Worker Manager
// ============================================================================

export type PanelWorkerCommand =
  | PlotWorkerCommand
  | ImageWorkerCommand
  | RawTopicWorkerCommand

export type PanelWorkerResponse =
  | PlotWorkerResponse
  | ImageWorkerResponse
  | RawTopicWorkerResponse

