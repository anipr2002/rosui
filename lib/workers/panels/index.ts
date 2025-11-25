/**
 * Panel Workers - Public API
 * 
 * This module provides Web Worker-based data processing for dashboard panels.
 * Each panel type has a dedicated worker to offload heavy computations from the main thread.
 */

// Types
export type {
  PanelType,
  MessageRecord,
  // Plot types
  PlotSeriesConfig,
  PlotWorkerConfig,
  PlotDataPoint,
  PlotWorkerCommand,
  PlotWorkerResponse,
  // Image types
  ColorMode,
  ColorMapType,
  RotationAngle,
  ImageWorkerConfig,
  RawImageData,
  DecodedImageData,
  ImageWorkerCommand,
  ImageWorkerResponse,
  // Raw topic types
  RawTopicWorkerConfig,
  RawTopicWorkerCommand,
  RawTopicWorkerResponse,
  // Union types
  PanelWorkerCommand,
  PanelWorkerResponse,
} from './panel-worker-types'

// Manager
export {
  PanelWorkerManager,
  getPanelWorkerManager,
  resetPanelWorkerManager,
} from './panel-worker-manager'

// Callback types
export type {
  PlotDataCallback,
  ImageDataCallback,
  RawTopicDataCallback,
  ErrorCallback,
} from './panel-worker-manager'

