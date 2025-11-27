/**
 * Panel Worker Manager
 * Singleton manager for panel-type-specific workers
 * Creates and manages one worker per panel type for efficient resource usage
 */

import type {
  PanelType,
  PlotWorkerCommand,
  PlotWorkerResponse,
  ImageWorkerCommand,
  ImageWorkerResponse,
  RawTopicWorkerCommand,
  RawTopicWorkerResponse,
  PlotWorkerConfig,
  ImageWorkerConfig,
  RawTopicWorkerConfig,
  PlotDataPoint,
  PlotSeriesConfig,
  DecodedImageData,
} from './panel-worker-types'

// ============================================================================
// Callback Types
// ============================================================================

export type PlotDataCallback = (
  panelId: string,
  chartData: PlotDataPoint[],
  activeSeries: PlotSeriesConfig[]
) => void

export type ImageDataCallback = (
  panelId: string,
  image: DecodedImageData,
  timestamp: number
) => void

export type RawTopicDataCallback = (
  panelId: string,
  formattedMessage: string,
  timestamp: number
) => void

export type ErrorCallback = (panelId: string, error: string) => void

// ============================================================================
// Panel Worker Manager Class
// ============================================================================

export class PanelWorkerManager {
  private plotWorker: Worker | null = null
  private imageWorker: Worker | null = null
  private rawTopicWorker: Worker | null = null

  // Callbacks per panel type
  private plotCallbacks = new Map<string, PlotDataCallback>()
  private imageCallbacks = new Map<string, ImageDataCallback>()
  private rawTopicCallbacks = new Map<string, RawTopicDataCallback>()

  // Error callbacks
  private plotErrorCallbacks = new Map<string, ErrorCallback>()
  private imageErrorCallbacks = new Map<string, ErrorCallback>()
  private rawTopicErrorCallbacks = new Map<string, ErrorCallback>()

  // Track initialized state
  private initialized = {
    plot: false,
    image: false,
    'raw-topic': false,
  }

  // ============================================================================
  // Plot Worker Methods
  // ============================================================================

  /**
   * Initialize the plot worker if not already initialized
   */
  initPlotWorker(): void {
    if (this.initialized.plot) return

    try {
      this.plotWorker = new Worker(
        new URL('./plot-worker.ts', import.meta.url),
        { type: 'module' }
      )

      this.plotWorker.onmessage = (event: MessageEvent<PlotWorkerResponse>) => {
        this.handlePlotWorkerMessage(event.data)
      }

      this.plotWorker.onerror = (error) => {
        console.error('[PanelWorkerManager] Plot worker error:', error)
      }

      this.initialized.plot = true
      console.log('[PanelWorkerManager] Plot worker initialized')
    } catch (error) {
      console.error('[PanelWorkerManager] Failed to initialize plot worker:', error)
      throw error
    }
  }

  /**
   * Handle messages from plot worker
   */
  private handlePlotWorkerMessage(response: PlotWorkerResponse): void {
    switch (response.type) {
      case 'PROCESSED_DATA': {
        const callback = this.plotCallbacks.get(response.panelId)
        if (callback) {
          callback(response.panelId, response.chartData, response.activeSeries)
        }
        break
      }
      case 'ERROR': {
        const errorCallback = this.plotErrorCallbacks.get(response.panelId)
        if (errorCallback) {
          errorCallback(response.panelId, response.error)
        }
        console.error(`[PanelWorkerManager] Plot worker error for ${response.panelId}:`, response.error)
        break
      }
    }
  }

  /**
   * Configure a plot panel
   */
  configurePlotPanel(config: PlotWorkerConfig, callback: PlotDataCallback, errorCallback?: ErrorCallback): void {
    this.initPlotWorker()
    
    this.plotCallbacks.set(config.panelId, callback)
    if (errorCallback) {
      this.plotErrorCallbacks.set(config.panelId, errorCallback)
    }

    const command: PlotWorkerCommand = {
      type: 'CONFIGURE',
      config,
    }
    this.plotWorker?.postMessage(command)
  }

  /**
   * Send a message to the plot worker for processing
   */
  processPlotMessage(panelId: string, seriesId: string, message: any, timestamp: number): void {
    if (!this.plotWorker) return

    const command: PlotWorkerCommand = {
      type: 'MESSAGE',
      panelId,
      seriesId,
      message,
      timestamp,
    }
    this.plotWorker.postMessage(command)
  }

  /**
   * Clear plot data for a panel
   */
  clearPlotData(panelId: string): void {
    if (!this.plotWorker) return

    const command: PlotWorkerCommand = {
      type: 'CLEAR',
      panelId,
    }
    this.plotWorker.postMessage(command)
  }

  /**
   * Remove a plot panel from the worker
   */
  removePlotPanel(panelId: string): void {
    this.plotCallbacks.delete(panelId)
    this.plotErrorCallbacks.delete(panelId)

    if (!this.plotWorker) return

    const command: PlotWorkerCommand = {
      type: 'REMOVE_PANEL',
      panelId,
    }
    this.plotWorker.postMessage(command)
  }

  // ============================================================================
  // Image Worker Methods
  // ============================================================================

  /**
   * Initialize the image worker if not already initialized
   */
  initImageWorker(): void {
    if (this.initialized.image) return

    try {
      this.imageWorker = new Worker(
        new URL('./image-worker.ts', import.meta.url),
        { type: 'module' }
      )

      this.imageWorker.onmessage = (event: MessageEvent<ImageWorkerResponse>) => {
        this.handleImageWorkerMessage(event.data)
      }

      this.imageWorker.onerror = (error) => {
        console.error('[PanelWorkerManager] Image worker error:', error)
      }

      this.initialized.image = true
      console.log('[PanelWorkerManager] Image worker initialized')
    } catch (error) {
      console.error('[PanelWorkerManager] Failed to initialize image worker:', error)
      throw error
    }
  }

  /**
   * Handle messages from image worker
   */
  private handleImageWorkerMessage(response: ImageWorkerResponse): void {
    switch (response.type) {
      case 'DECODED_IMAGE': {
        const callback = this.imageCallbacks.get(response.panelId)
        if (callback) {
          callback(response.panelId, response.image, response.timestamp)
        }
        break
      }
      case 'ERROR': {
        const errorCallback = this.imageErrorCallbacks.get(response.panelId)
        if (errorCallback) {
          errorCallback(response.panelId, response.error)
        }
        console.error(`[PanelWorkerManager] Image worker error for ${response.panelId}:`, response.error)
        break
      }
    }
  }

  /**
   * Configure an image panel
   */
  configureImagePanel(config: ImageWorkerConfig, callback: ImageDataCallback, errorCallback?: ErrorCallback): void {
    this.initImageWorker()
    
    this.imageCallbacks.set(config.panelId, callback)
    if (errorCallback) {
      this.imageErrorCallbacks.set(config.panelId, errorCallback)
    }

    const command: ImageWorkerCommand = {
      type: 'CONFIGURE',
      config,
    }
    this.imageWorker?.postMessage(command)
  }

  /**
   * Send raw image data to the image worker for decoding
   */
  decodeRawImage(
    panelId: string,
    width: number,
    height: number,
    encoding: string,
    data: ArrayBuffer,
    timestamp: number
  ): void {
    if (!this.imageWorker) return

    const command: ImageWorkerCommand = {
      type: 'DECODE_RAW',
      panelId,
      image: { width, height, encoding, data },
      timestamp,
    }
    
    // Transfer the ArrayBuffer to avoid copying
    this.imageWorker.postMessage(command, [data])
  }

  /**
   * Remove an image panel from the worker
   */
  removeImagePanel(panelId: string): void {
    this.imageCallbacks.delete(panelId)
    this.imageErrorCallbacks.delete(panelId)

    if (!this.imageWorker) return

    const command: ImageWorkerCommand = {
      type: 'REMOVE_PANEL',
      panelId,
    }
    this.imageWorker.postMessage(command)
  }

  // ============================================================================
  // Raw Topic Worker Methods
  // ============================================================================

  /**
   * Initialize the raw topic worker if not already initialized
   */
  initRawTopicWorker(): void {
    if (this.initialized['raw-topic']) return

    try {
      this.rawTopicWorker = new Worker(
        new URL('./raw-topic-worker.ts', import.meta.url),
        { type: 'module' }
      )

      this.rawTopicWorker.onmessage = (event: MessageEvent<RawTopicWorkerResponse>) => {
        this.handleRawTopicWorkerMessage(event.data)
      }

      this.rawTopicWorker.onerror = (error) => {
        console.error('[PanelWorkerManager] Raw topic worker error:', error)
      }

      this.initialized['raw-topic'] = true
      console.log('[PanelWorkerManager] Raw topic worker initialized')
    } catch (error) {
      console.error('[PanelWorkerManager] Failed to initialize raw topic worker:', error)
      throw error
    }
  }

  /**
   * Handle messages from raw topic worker
   */
  private handleRawTopicWorkerMessage(response: RawTopicWorkerResponse): void {
    switch (response.type) {
      case 'FORMATTED_MESSAGE': {
        const callback = this.rawTopicCallbacks.get(response.panelId)
        if (callback) {
          callback(response.panelId, response.formattedMessage, response.timestamp)
        }
        break
      }
      case 'ERROR': {
        const errorCallback = this.rawTopicErrorCallbacks.get(response.panelId)
        if (errorCallback) {
          errorCallback(response.panelId, response.error)
        }
        console.error(`[PanelWorkerManager] Raw topic worker error for ${response.panelId}:`, response.error)
        break
      }
    }
  }

  /**
   * Configure a raw topic panel
   */
  configureRawTopicPanel(config: RawTopicWorkerConfig, callback: RawTopicDataCallback, errorCallback?: ErrorCallback): void {
    this.initRawTopicWorker()
    
    this.rawTopicCallbacks.set(config.panelId, callback)
    if (errorCallback) {
      this.rawTopicErrorCallbacks.set(config.panelId, errorCallback)
    }

    const command: RawTopicWorkerCommand = {
      type: 'CONFIGURE',
      config,
    }
    this.rawTopicWorker?.postMessage(command)
  }

  /**
   * Send a message to the raw topic worker for formatting
   */
  formatRawTopicMessage(panelId: string, message: any, timestamp: number): void {
    if (!this.rawTopicWorker) return

    const command: RawTopicWorkerCommand = {
      type: 'FORMAT_MESSAGE',
      panelId,
      message,
      timestamp,
    }
    this.rawTopicWorker.postMessage(command)
  }

  /**
   * Remove a raw topic panel from the worker
   */
  removeRawTopicPanel(panelId: string): void {
    this.rawTopicCallbacks.delete(panelId)
    this.rawTopicErrorCallbacks.delete(panelId)

    if (!this.rawTopicWorker) return

    const command: RawTopicWorkerCommand = {
      type: 'REMOVE_PANEL',
      panelId,
    }
    this.rawTopicWorker.postMessage(command)
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Terminate all workers and clean up
   */
  terminate(): void {
    if (this.plotWorker) {
      this.plotWorker.terminate()
      this.plotWorker = null
      this.initialized.plot = false
    }

    if (this.imageWorker) {
      this.imageWorker.terminate()
      this.imageWorker = null
      this.initialized.image = false
    }

    if (this.rawTopicWorker) {
      this.rawTopicWorker.terminate()
      this.rawTopicWorker = null
      this.initialized['raw-topic'] = false
    }

    // Clear all callbacks
    this.plotCallbacks.clear()
    this.imageCallbacks.clear()
    this.rawTopicCallbacks.clear()
    this.plotErrorCallbacks.clear()
    this.imageErrorCallbacks.clear()
    this.rawTopicErrorCallbacks.clear()

    console.log('[PanelWorkerManager] All workers terminated')
  }

  /**
   * Check if a worker type is initialized
   */
  isInitialized(type: PanelType): boolean {
    return this.initialized[type]
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let panelWorkerManagerInstance: PanelWorkerManager | null = null

/**
 * Get the singleton panel worker manager instance
 */
export function getPanelWorkerManager(): PanelWorkerManager {
  if (!panelWorkerManagerInstance) {
    panelWorkerManagerInstance = new PanelWorkerManager()
  }
  return panelWorkerManagerInstance
}

/**
 * Reset the panel worker manager (useful for cleanup)
 */
export function resetPanelWorkerManager(): void {
  if (panelWorkerManagerInstance) {
    panelWorkerManagerInstance.terminate()
    panelWorkerManagerInstance = null
  }
}


