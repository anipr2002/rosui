/**
 * Image Worker
 * Handles raw image decoding and transformation for image panels off the main thread
 * - Decodes raw ROS images (sensor_msgs/Image)
 * - Applies color mapping for depth images
 * - Applies transformations (flip, rotate)
 * 
 * Note: Compressed images (sensor_msgs/CompressedImage) are still decoded on main thread
 * because they require Image() and canvas which aren't fully available in workers.
 */

import type {
  ImageWorkerCommand,
  ImageWorkerResponse,
  ImageWorkerConfig,
  RawImageData,
  DecodedImageData,
  ColorMode,
  ColorMapType,
  RotationAngle,
} from './panel-worker-types'

// ============================================================================
// Panel State
// ============================================================================

interface PanelState {
  config: ImageWorkerConfig
}

const panelStates = new Map<string, PanelState>()

// ============================================================================
// Color Maps (copied from image-decoder.ts to avoid import issues)
// ============================================================================

// Turbo colormap (Google's improved rainbow colormap)
const TURBO_COLORMAP = [
  [0.18995, 0.07176, 0.23217],
  [0.22875, 0.17481, 0.47578],
  [0.25369, 0.26327, 0.65406],
  [0.26967, 0.34878, 0.79631],
  [0.27509, 0.40072, 0.86692],
  [0.27648, 0.48144, 0.95064],
  [0.26878, 0.54995, 0.99303],
  [0.24946, 0.59943, 0.99835],
  [0.22039, 0.64901, 0.98436],
  [0.18625, 0.69775, 0.95498],
  [0.15173, 0.74472, 0.91416],
  [0.11639, 0.7974, 0.85559],
  [0.09287, 0.85875, 0.7724],
  [0.10815, 0.90142, 0.70599],
  [0.16319, 0.93609, 0.63137],
  [0.24797, 0.96423, 0.54303],
  [0.35043, 0.98477, 0.45002],
  [0.45854, 0.99663, 0.3614],
  [0.56026, 0.99873, 0.28623],
  [0.65394, 0.98775, 0.22835],
  [0.74617, 0.95593, 0.20406],
  [0.83241, 0.90627, 0.20788],
  [0.90605, 0.84337, 0.22188],
  [0.96049, 0.78005, 0.22836],
  [0.98549, 0.7125, 0.2165],
  [0.99535, 0.65341, 0.19577],
  [0.99593, 0.58703, 0.16899],
  [0.98799, 0.51667, 0.13883],
  [0.97234, 0.44565, 0.10797],
  [0.94977, 0.37729, 0.07905],
  [0.91572, 0.3053, 0.05134],
  [0.86079, 0.22945, 0.02875],
]

// Rainbow colormap (RViz-style)
const RAINBOW_COLORMAP = [
  [0.5, 0.0, 1.0],
  [0.0, 0.0, 1.0],
  [0.0, 0.5, 1.0],
  [0.0, 1.0, 1.0],
  [0.0, 1.0, 0.5],
  [0.0, 1.0, 0.0],
  [0.5, 1.0, 0.0],
  [1.0, 1.0, 0.0],
  [1.0, 0.5, 0.0],
  [1.0, 0.0, 0.0],
]

function getColorFromMap(
  value: number,
  colormap: number[][]
): [number, number, number] {
  const normalizedValue = Math.max(0, Math.min(1, value))
  const index = normalizedValue * (colormap.length - 1)
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)
  const t = index - lowerIndex

  if (lowerIndex === upperIndex) {
    const color = colormap[lowerIndex]
    return [color[0] * 255, color[1] * 255, color[2] * 255]
  }

  const lower = colormap[lowerIndex]
  const upper = colormap[upperIndex]

  return [
    (lower[0] + (upper[0] - lower[0]) * t) * 255,
    (lower[1] + (upper[1] - lower[1]) * t) * 255,
    (lower[2] + (upper[2] - lower[2]) * t) * 255,
  ]
}

function applyColorMap(
  value: number,
  colorMapType: ColorMapType
): [number, number, number] {
  const colormap = colorMapType === 'turbo' ? TURBO_COLORMAP : RAINBOW_COLORMAP
  return getColorFromMap(value, colormap)
}

function applyGradient(
  value: number,
  minColor: string,
  maxColor: string
): [number, number, number] {
  const parseHex = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]
  }

  const min = parseHex(minColor)
  const max = parseHex(maxColor)
  const normalizedValue = Math.max(0, Math.min(1, value))

  return [
    min[0] + (max[0] - min[0]) * normalizedValue,
    min[1] + (max[1] - min[1]) * normalizedValue,
    min[2] + (max[2] - min[2]) * normalizedValue,
  ]
}

// ============================================================================
// Image Decoding
// ============================================================================

function decodeRawImage(
  image: RawImageData,
  config: ImageWorkerConfig
): DecodedImageData | null {
  const { width, height, encoding } = image
  const dataArray = new Uint8Array(image.data)

  if (dataArray.length === 0) {
    return null
  }

  const imageData = new Uint8ClampedArray(width * height * 4)

  try {
    switch (encoding) {
      case 'rgb8':
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3]
          imageData[i * 4 + 1] = dataArray[i * 3 + 1]
          imageData[i * 4 + 2] = dataArray[i * 3 + 2]
          imageData[i * 4 + 3] = 255
        }
        break

      case 'rgba8':
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 4]
          imageData[i * 4 + 1] = dataArray[i * 4 + 1]
          imageData[i * 4 + 2] = dataArray[i * 4 + 2]
          imageData[i * 4 + 3] = dataArray[i * 4 + 3]
        }
        break

      case 'bgr8':
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3 + 2]
          imageData[i * 4 + 1] = dataArray[i * 3 + 1]
          imageData[i * 4 + 2] = dataArray[i * 3]
          imageData[i * 4 + 3] = 255
        }
        break

      case 'bgra8':
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 4 + 2]
          imageData[i * 4 + 1] = dataArray[i * 4 + 1]
          imageData[i * 4 + 2] = dataArray[i * 4]
          imageData[i * 4 + 3] = dataArray[i * 4 + 3]
        }
        break

      case 'mono8':
      case '8UC1':
        for (let i = 0; i < width * height; i++) {
          const gray = dataArray[i]
          imageData[i * 4] = gray
          imageData[i * 4 + 1] = gray
          imageData[i * 4 + 2] = gray
          imageData[i * 4 + 3] = 255
        }
        break

      case '8UC3':
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3]
          imageData[i * 4 + 1] = dataArray[i * 3 + 1]
          imageData[i * 4 + 2] = dataArray[i * 3 + 2]
          imageData[i * 4 + 3] = 255
        }
        break

      case 'mono16':
      case '16UC1': {
        for (let i = 0; i < width * height; i++) {
          const value16 = (dataArray[i * 2 + 1] << 8) | dataArray[i * 2]
          const normalized = (value16 - config.valueMin) / (config.valueMax - config.valueMin)

          let r: number, g: number, b: number

          if (config.colorMode === 'colormap') {
            [r, g, b] = applyColorMap(normalized, config.colorMap)
          } else if (config.colorMode === 'gradient' && config.gradientColors) {
            [r, g, b] = applyGradient(
              normalized,
              config.gradientColors.min,
              config.gradientColors.max
            )
          } else {
            const gray = Math.max(0, Math.min(255, normalized * 255))
            r = gray
            g = gray
            b = gray
          }

          imageData[i * 4] = r
          imageData[i * 4 + 1] = g
          imageData[i * 4 + 2] = b
          imageData[i * 4 + 3] = 255
        }
        break
      }

      case '32FC1': {
        const floatView = new DataView(dataArray.buffer)
        for (let i = 0; i < width * height; i++) {
          const value32 = floatView.getFloat32(i * 4, true)
          const normalized = (value32 - config.valueMin) / (config.valueMax - config.valueMin)

          let r: number, g: number, b: number

          if (config.colorMode === 'colormap') {
            [r, g, b] = applyColorMap(normalized, config.colorMap)
          } else if (config.colorMode === 'gradient' && config.gradientColors) {
            [r, g, b] = applyGradient(
              normalized,
              config.gradientColors.min,
              config.gradientColors.max
            )
          } else {
            const gray = Math.max(0, Math.min(255, normalized * 255))
            r = gray
            g = gray
            b = gray
          }

          imageData[i * 4] = r
          imageData[i * 4 + 1] = g
          imageData[i * 4 + 2] = b
          imageData[i * 4 + 3] = 255
        }
        break
      }

      case 'yuv422':
      case 'uyvy': {
        for (let i = 0; i < (width * height) / 2; i++) {
          const u = dataArray[i * 4] - 128
          const y1 = dataArray[i * 4 + 1]
          const v = dataArray[i * 4 + 2] - 128
          const y2 = dataArray[i * 4 + 3]

          const r1 = Math.max(0, Math.min(255, y1 + 1.402 * v))
          const g1 = Math.max(0, Math.min(255, y1 - 0.344 * u - 0.714 * v))
          const b1 = Math.max(0, Math.min(255, y1 + 1.772 * u))

          const r2 = Math.max(0, Math.min(255, y2 + 1.402 * v))
          const g2 = Math.max(0, Math.min(255, y2 - 0.344 * u - 0.714 * v))
          const b2 = Math.max(0, Math.min(255, y2 + 1.772 * u))

          imageData[i * 8] = r1
          imageData[i * 8 + 1] = g1
          imageData[i * 8 + 2] = b1
          imageData[i * 8 + 3] = 255

          imageData[i * 8 + 4] = r2
          imageData[i * 8 + 5] = g2
          imageData[i * 8 + 6] = b2
          imageData[i * 8 + 7] = 255
        }
        break
      }

      case 'yuv422_yuy2':
      case 'yuyv': {
        for (let i = 0; i < (width * height) / 2; i++) {
          const y1 = dataArray[i * 4]
          const u = dataArray[i * 4 + 1] - 128
          const y2 = dataArray[i * 4 + 2]
          const v = dataArray[i * 4 + 3] - 128

          const r1 = Math.max(0, Math.min(255, y1 + 1.402 * v))
          const g1 = Math.max(0, Math.min(255, y1 - 0.344 * u - 0.714 * v))
          const b1 = Math.max(0, Math.min(255, y1 + 1.772 * u))

          const r2 = Math.max(0, Math.min(255, y2 + 1.402 * v))
          const g2 = Math.max(0, Math.min(255, y2 - 0.344 * u - 0.714 * v))
          const b2 = Math.max(0, Math.min(255, y2 + 1.772 * u))

          imageData[i * 8] = r1
          imageData[i * 8 + 1] = g1
          imageData[i * 8 + 2] = b1
          imageData[i * 8 + 3] = 255

          imageData[i * 8 + 4] = r2
          imageData[i * 8 + 5] = g2
          imageData[i * 8 + 6] = b2
          imageData[i * 8 + 7] = 255
        }
        break
      }

      default:
        console.warn(`[ImageWorker] Unsupported encoding: ${encoding}`)
        return null
    }

    // Apply transformations if needed
    const transformed = transformImage(
      imageData,
      width,
      height,
      config.flipHorizontal,
      config.flipVertical,
      config.rotation
    )

    return {
      width: transformed.width,
      height: transformed.height,
      data: transformed.data.buffer,
      encoding,
    }
  } catch (error) {
    console.error('[ImageWorker] Error decoding image:', error)
    return null
  }
}

// ============================================================================
// Image Transformation
// ============================================================================

interface TransformedImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

function transformImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
  rotation: RotationAngle
): TransformedImage {
  if (!flipHorizontal && !flipVertical && rotation === 0) {
    return { width, height, data }
  }

  // Calculate output dimensions based on rotation
  let outWidth = width
  let outHeight = height
  if (rotation === 90 || rotation === 270) {
    outWidth = height
    outHeight = width
  }

  const outData = new Uint8ClampedArray(outWidth * outHeight * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Source pixel
      let srcX = x
      let srcY = y

      // Apply flips first
      if (flipHorizontal) {
        srcX = width - 1 - srcX
      }
      if (flipVertical) {
        srcY = height - 1 - srcY
      }

      // Calculate destination coordinates based on rotation
      let destX: number
      let destY: number

      switch (rotation) {
        case 90:
          destX = height - 1 - srcY
          destY = srcX
          break
        case 180:
          destX = width - 1 - srcX
          destY = height - 1 - srcY
          break
        case 270:
          destX = srcY
          destY = width - 1 - srcX
          break
        default:
          destX = srcX
          destY = srcY
      }

      // Copy pixel data
      const srcIdx = (y * width + x) * 4
      const destIdx = (destY * outWidth + destX) * 4

      outData[destIdx] = data[srcIdx]
      outData[destIdx + 1] = data[srcIdx + 1]
      outData[destIdx + 2] = data[srcIdx + 2]
      outData[destIdx + 3] = data[srcIdx + 3]
    }
  }

  return { width: outWidth, height: outHeight, data: outData }
}

// ============================================================================
// Command Handlers
// ============================================================================

function handleConfigure(config: ImageWorkerConfig): void {
  panelStates.set(config.panelId, { config })
}

function handleDecodeRaw(panelId: string, image: RawImageData, timestamp: number): void {
  const state = panelStates.get(panelId)
  
  // Use default config if not configured
  const config: ImageWorkerConfig = state?.config ?? {
    panelId,
    colorMode: 'raw',
    colorMap: 'turbo',
    valueMin: 0,
    valueMax: 10000,
    flipHorizontal: false,
    flipVertical: false,
    rotation: 0,
  }

  const decoded = decodeRawImage(image, config)

  if (decoded) {
    const response: ImageWorkerResponse = {
      type: 'DECODED_IMAGE',
      panelId,
      image: decoded,
      timestamp,
    }
    
    // Transfer the buffer to avoid copying
    self.postMessage(response, [decoded.data])
  } else {
    sendError(panelId, 'Failed to decode image')
  }
}

function handleRemovePanel(panelId: string): void {
  panelStates.delete(panelId)
}

// ============================================================================
// Response Helpers
// ============================================================================

function sendError(panelId: string, error: string): void {
  const response: ImageWorkerResponse = {
    type: 'ERROR',
    panelId,
    error,
  }

  self.postMessage(response)
}

// ============================================================================
// Main Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent<ImageWorkerCommand>) => {
  const command = event.data

  try {
    switch (command.type) {
      case 'CONFIGURE':
        handleConfigure(command.config)
        break

      case 'DECODE_RAW':
        handleDecodeRaw(command.panelId, command.image, command.timestamp)
        break

      case 'REMOVE_PANEL':
        handleRemovePanel(command.panelId)
        break

      default:
        console.error('[ImageWorker] Unknown command type:', command)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const panelId = 'panelId' in command ? command.panelId : 'unknown'
    sendError(panelId, errorMessage)
    console.error('[ImageWorker] Error processing command:', error)
  }
}

// Export empty object to make this a module
export {}

