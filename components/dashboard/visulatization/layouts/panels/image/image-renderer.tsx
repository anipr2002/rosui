"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import type {
  DecodedImage,
  ImageMarkerMessage,
} from "./types"

interface ImageRendererProps {
  image: DecodedImage
  annotations?: ImageMarkerMessage[]
  onTransformChange?: (scale: number, offsetX: number, offsetY: number) => void
  initialScale?: number
  initialOffsetX?: number
  initialOffsetY?: number
}

function ImageRendererComponent({
  image,
  annotations = [],
  onTransformChange,
  initialScale = 1,
  initialOffsetX = 0,
  initialOffsetY = 0,
}: ImageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(initialScale)
  const [offsetX, setOffsetX] = useState(initialOffsetX)
  const [offsetY, setOffsetY] = useState(initialOffsetY)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    y: number
    r: number
    g: number
    b: number
  } | null>(null)

  // Reset view to fit image
  const resetView = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const imageAspect = image.width / image.height
    const containerAspect = containerWidth / containerHeight

    let newScale: number
    if (imageAspect > containerAspect) {
      newScale = containerWidth / image.width
    } else {
      newScale = containerHeight / image.height
    }

    setScale(newScale)
    setOffsetX(0)
    setOffsetY(0)

    if (onTransformChange) {
      onTransformChange(newScale, 0, 0)
    }
  }, [image.width, image.height, onTransformChange])

  // Initial render and when image dimensions change
  useEffect(() => {
    resetView()
  }, [resetView])

  // Render image and annotations
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set canvas size to match image
    canvas.width = image.width
    canvas.height = image.height

    // Draw image
    const imageData = new ImageData(image.data, image.width, image.height)
    ctx.putImageData(imageData, 0, 0)

    // Draw annotations
    if (annotations.length > 0) {
      drawAnnotations(ctx, annotations)
    }
  }, [image, annotations])

  // Handle mouse wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(10, scale * delta))

      // Zoom towards mouse position
      const scaleDiff = newScale / scale
      const newOffsetX = mouseX - (mouseX - offsetX) * scaleDiff
      const newOffsetY = mouseY - (mouseY - offsetY) * scaleDiff

      setScale(newScale)
      setOffsetX(newOffsetX)
      setOffsetY(newOffsetY)

      if (onTransformChange) {
        onTransformChange(newScale, newOffsetX, newOffsetY)
      }
    },
    [scale, offsetX, offsetY, onTransformChange]
  )

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY })
      }
    },
    [offsetX, offsetY]
  )

  // Handle mouse move for panning and hover info
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      if (isDragging) {
        const newOffsetX = e.clientX - dragStart.x
        const newOffsetY = e.clientY - dragStart.y

        setOffsetX(newOffsetX)
        setOffsetY(newOffsetY)

        if (onTransformChange) {
          onTransformChange(scale, newOffsetX, newOffsetY)
        }
      }

      // Calculate pixel coordinates
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const imageX = Math.floor((mouseX - offsetX) / scale)
      const imageY = Math.floor((mouseY - offsetY) / scale)

      if (
        imageX >= 0 &&
        imageX < image.width &&
        imageY >= 0 &&
        imageY < image.height
      ) {
        const pixelIndex = (imageY * image.width + imageX) * 4
        const r = image.data[pixelIndex]
        const g = image.data[pixelIndex + 1]
        const b = image.data[pixelIndex + 2]

        setHoverInfo({ x: imageX, y: imageY, r, g, b })
      } else {
        setHoverInfo(null)
      }
    },
    [isDragging, dragStart, scale, offsetX, offsetY, image, onTransformChange]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
    setHoverInfo(null)
  }, [])

  // Handle right-click to download
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `image-${Date.now()}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    })
  }, [])

  // Handle keyboard shortcut to reset view
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        resetView()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [resetView])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-900"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: image.width * scale,
          height: image.height * scale,
          imageRendering: scale > 2 ? "pixelated" : "auto",
        }}
      />

      {/* Hover info */}
      {hoverInfo && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded pointer-events-none font-mono">
          <div>
            x: {hoverInfo.x}, y: {hoverInfo.y}
          </div>
          <div>
            RGB: ({hoverInfo.r}, {hoverInfo.g}, {hoverInfo.b})
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs p-2 rounded pointer-events-none">
        <div>Scroll: Zoom | Drag: Pan | 1: Reset</div>
        <div>Right-click: Download PNG</div>
      </div>
    </div>
  )
}

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: ImageMarkerMessage[]
) {
  for (const marker of annotations) {
    // Skip REMOVE actions
    if (marker.action === 1) continue

    const color = marker.outline_color
    const fillColor = marker.fill_color || color

    ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`
    ctx.fillStyle = `rgba(${fillColor.r * 255}, ${fillColor.g * 255}, ${fillColor.b * 255}, ${fillColor.a})`
    ctx.lineWidth = 2

    switch (marker.type) {
      case 0: // CIRCLE
        ctx.beginPath()
        ctx.arc(
          marker.position.x,
          marker.position.y,
          marker.scale,
          0,
          2 * Math.PI
        )
        if (marker.filled) {
          ctx.fill()
        }
        ctx.stroke()
        break

      case 1: // LINE_STRIP
        if (marker.points && marker.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(marker.points[0].x, marker.points[0].y)
          for (let i = 1; i < marker.points.length; i++) {
            ctx.lineTo(marker.points[i].x, marker.points[i].y)
          }
          ctx.stroke()
        }
        break

      case 2: // LINE_LIST
        if (marker.points && marker.points.length >= 2) {
          ctx.beginPath()
          for (let i = 0; i < marker.points.length - 1; i += 2) {
            ctx.moveTo(marker.points[i].x, marker.points[i].y)
            ctx.lineTo(marker.points[i + 1].x, marker.points[i + 1].y)
          }
          ctx.stroke()
        }
        break

      case 3: // POLYGON
        if (marker.points && marker.points.length > 2) {
          ctx.beginPath()
          ctx.moveTo(marker.points[0].x, marker.points[0].y)
          for (let i = 1; i < marker.points.length; i++) {
            ctx.lineTo(marker.points[i].x, marker.points[i].y)
          }
          ctx.closePath()
          if (marker.filled) {
            ctx.fill()
          }
          ctx.stroke()
        }
        break

      case 4: // POINTS
        if (marker.points) {
          for (const point of marker.points) {
            ctx.beginPath()
            ctx.arc(point.x, point.y, marker.scale / 2, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
        break

      case 5: // TEXT_VIEW_FACING
        if (marker.text) {
          ctx.font = `${marker.scale}px sans-serif`
          ctx.fillText(marker.text, marker.position.x, marker.position.y)
        }
        break
    }
  }
}

/**
 * Custom comparison function for ImageRenderer
 * Compares image dimensions and a sample of pixels to determine if re-render is needed
 */
function areImagePropsEqual(
  prevProps: ImageRendererProps,
  nextProps: ImageRendererProps
): boolean {
  // Check if image dimensions changed
  if (
    prevProps.image.width !== nextProps.image.width ||
    prevProps.image.height !== nextProps.image.height
  ) {
    return false
  }

  // Check if encoding changed
  if (prevProps.image.encoding !== nextProps.image.encoding) {
    return false
  }

  // Check if data length changed (different image)
  if (prevProps.image.data.length !== nextProps.image.data.length) {
    return false
  }

  // Sample a few pixels to check if image content changed
  // This is a performance optimization - we don't want to compare every pixel
  const sampleSize = Math.min(100, prevProps.image.data.length / 4)
  const step = Math.floor(prevProps.image.data.length / sampleSize)
  
  for (let i = 0; i < prevProps.image.data.length; i += step) {
    if (prevProps.image.data[i] !== nextProps.image.data[i]) {
      return false
    }
  }

  // Check annotations (simple length check + first/last marker comparison)
  const prevAnnotations = prevProps.annotations || []
  const nextAnnotations = nextProps.annotations || []
  
  if (prevAnnotations.length !== nextAnnotations.length) {
    return false
  }

  if (prevAnnotations.length > 0) {
    // Compare first and last annotation IDs
    if (
      prevAnnotations[0].id !== nextAnnotations[0].id ||
      prevAnnotations[prevAnnotations.length - 1].id !== nextAnnotations[nextAnnotations.length - 1].id
    ) {
      return false
    }
  }

  // Check transform initial values
  if (
    prevProps.initialScale !== nextProps.initialScale ||
    prevProps.initialOffsetX !== nextProps.initialOffsetX ||
    prevProps.initialOffsetY !== nextProps.initialOffsetY
  ) {
    return false
  }

  // Props are equal, skip re-render
  return true
}

// Export memoized component
export const ImageRenderer = React.memo(ImageRendererComponent, areImagePropsEqual)
ImageRenderer.displayName = "ImageRenderer"
