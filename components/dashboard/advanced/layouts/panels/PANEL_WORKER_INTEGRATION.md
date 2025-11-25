# Panel Worker Integration Specification

This document provides a comprehensive guide for integrating Web Workers with dashboard panels, including how to add new panel types with worker support.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Creating a New Panel Type with Worker Support](#creating-a-new-panel-type-with-worker-support)
3. [API Reference](#api-reference)
4. [Best Practices](#best-practices)
5. [Performance Benchmarks](#performance-benchmarks)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Design Philosophy

- **One Worker Per Panel Type**: Instead of spawning a worker for each panel instance (which would exhaust resources), we create one worker per panel type. Each worker can handle multiple panel instances.

- **Main Thread Stays Responsive**: Heavy computations (parsing, decoding, formatting) happen in workers while the main thread handles React rendering and user interactions.

- **Minimal Data Transfer**: Use transferable objects (ArrayBuffers) for large data to avoid serialization overhead.

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Thread                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  PlotPanel   │    │  ImagePanel  │    │ RawTopicPanel│       │
│  │  (Instance1) │    │  (Instance1) │    │  (Instance1) │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│  ┌──────┴───────┐    ┌──────┴───────┐    ┌──────┴───────┐       │
│  │  PlotPanel   │    │  ImagePanel  │    │ RawTopicPanel│       │
│  │  (Instance2) │    │  (Instance2) │    │  (Instance2) │       │
│  └──────┬───────┘    └──────┴───────┘    └──────┴───────┘       │
│         │                   │                   │                │
│         └─────────┬─────────┴─────────┬─────────┘                │
│                   │                   │                          │
│           ┌───────▼───────────────────▼───────┐                  │
│           │      PanelWorkerManager           │                  │
│           │  (Singleton - routes messages)    │                  │
│           └───────┬───────────────────┬───────┘                  │
│                   │                   │                          │
└───────────────────┼───────────────────┼──────────────────────────┘
                    │                   │
          postMessage │                 │ postMessage
                    │                   │
┌───────────────────▼───────────────────▼──────────────────────────┐
│                        Worker Threads                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  PlotWorker  │    │ ImageWorker  │    │RawTopicWorker│       │
│  │              │    │              │    │              │       │
│  │ Handles all  │    │ Handles all  │    │ Handles all  │       │
│  │ plot panels  │    │ image panels │    │ raw panels   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating a New Panel Type with Worker Support

Follow these steps to add a new panel type (e.g., "PointCloud Panel") with worker support:

### Step 1: Define Worker Types

Add types to `lib/workers/panels/panel-worker-types.ts`:

```typescript
// ============================================================================
// Point Cloud Worker Types
// ============================================================================

export interface PointCloudWorkerConfig {
  panelId: string
  pointSize: number
  colorMode: 'intensity' | 'height' | 'rgb'
  // ... other config options
}

export interface ProcessedPointCloud {
  positions: Float32Array
  colors: Float32Array
  count: number
}

// Commands sent to point cloud worker
export type PointCloudWorkerCommand =
  | {
      type: 'CONFIGURE'
      config: PointCloudWorkerConfig
    }
  | {
      type: 'PROCESS_POINTS'
      panelId: string
      points: ArrayBuffer
      timestamp: number
    }
  | {
      type: 'REMOVE_PANEL'
      panelId: string
    }

// Responses from point cloud worker
export type PointCloudWorkerResponse =
  | {
      type: 'PROCESSED_POINTS'
      panelId: string
      data: ProcessedPointCloud
      timestamp: number
    }
  | {
      type: 'ERROR'
      panelId: string
      error: string
    }
```

### Step 2: Create the Worker

Create `lib/workers/panels/pointcloud-worker.ts`:

```typescript
/**
 * Point Cloud Worker
 * Processes point cloud data off the main thread
 */

import type {
  PointCloudWorkerCommand,
  PointCloudWorkerResponse,
  PointCloudWorkerConfig,
} from './panel-worker-types'

// Panel state storage
const panelStates = new Map<string, { config: PointCloudWorkerConfig }>()

function handleConfigure(config: PointCloudWorkerConfig): void {
  panelStates.set(config.panelId, { config })
}

function handleProcessPoints(panelId: string, points: ArrayBuffer, timestamp: number): void {
  const state = panelStates.get(panelId)
  if (!state) return

  // Process point cloud data...
  const positions = new Float32Array(/* processed positions */)
  const colors = new Float32Array(/* processed colors */)

  const response: PointCloudWorkerResponse = {
    type: 'PROCESSED_POINTS',
    panelId,
    data: { positions, colors, count: positions.length / 3 },
    timestamp,
  }

  // Transfer buffers to avoid copying
  self.postMessage(response, [positions.buffer, colors.buffer])
}

function handleRemovePanel(panelId: string): void {
  panelStates.delete(panelId)
}

// Main message handler
self.onmessage = (event: MessageEvent<PointCloudWorkerCommand>) => {
  const command = event.data

  try {
    switch (command.type) {
      case 'CONFIGURE':
        handleConfigure(command.config)
        break
      case 'PROCESS_POINTS':
        handleProcessPoints(command.panelId, command.points, command.timestamp)
        break
      case 'REMOVE_PANEL':
        handleRemovePanel(command.panelId)
        break
    }
  } catch (error) {
    // Error handling...
  }
}

export {}
```

### Step 3: Add to Worker Manager

Update `lib/workers/panels/panel-worker-manager.ts`:

```typescript
// Add new callback type
export type PointCloudDataCallback = (
  panelId: string,
  data: ProcessedPointCloud,
  timestamp: number
) => void

// In the class, add:
private pointCloudWorker: Worker | null = null
private pointCloudCallbacks = new Map<string, PointCloudDataCallback>()

initPointCloudWorker(): void {
  if (this.initialized['pointcloud']) return

  this.pointCloudWorker = new Worker(
    new URL('./pointcloud-worker.ts', import.meta.url),
    { type: 'module' }
  )

  this.pointCloudWorker.onmessage = (event) => {
    this.handlePointCloudWorkerMessage(event.data)
  }

  this.initialized['pointcloud'] = true
}

configurePointCloudPanel(
  config: PointCloudWorkerConfig,
  callback: PointCloudDataCallback
): void {
  this.initPointCloudWorker()
  this.pointCloudCallbacks.set(config.panelId, callback)
  this.pointCloudWorker?.postMessage({ type: 'CONFIGURE', config })
}

processPointCloud(panelId: string, points: ArrayBuffer, timestamp: number): void {
  this.pointCloudWorker?.postMessage(
    { type: 'PROCESS_POINTS', panelId, points, timestamp },
    [points]  // Transfer the buffer
  )
}
```

### Step 4: Update Panel Component

Create/update your panel component:

```typescript
export function LivePointCloudPanel({ panel, onUpdatePanel, onDelete }) {
  // Use targeted selectors
  const topics = useTopicsStore((state) => state.topics)
  const subscribers = useTopicsStore((state) => state.subscribers)
  
  // Worker state
  const [processedData, setProcessedData] = useState<ProcessedPointCloud | null>(null)
  const workerConfiguredRef = useRef(false)

  // Configure worker
  useEffect(() => {
    const workerManager = getPanelWorkerManager()
    
    workerManager.configurePointCloudPanel(
      { panelId: panel.id, ...config },
      (panelId, data, timestamp) => {
        if (panelId === panel.id) {
          setProcessedData(data)
        }
      }
    )
    
    workerConfiguredRef.current = true
    
    return () => {
      workerManager.removePointCloudPanel(panel.id)
    }
  }, [panel.id, config])

  // Forward messages to worker
  useEffect(() => {
    if (!workerConfiguredRef.current) return
    
    const subscriber = subscribers.get(config.topic)
    if (!subscriber?.latestMessage) return
    
    // Convert to ArrayBuffer and send to worker
    const workerManager = getPanelWorkerManager()
    workerManager.processPointCloud(panel.id, pointsBuffer, Date.now())
  }, [panel.id, subscribers])

  // Render with processedData...
}
```

---

## API Reference

### PanelWorkerManager

```typescript
class PanelWorkerManager {
  // Plot Worker
  configurePlotPanel(config: PlotWorkerConfig, callback: PlotDataCallback, errorCallback?: ErrorCallback): void
  processPlotMessage(panelId: string, seriesId: string, message: any, timestamp: number): void
  clearPlotData(panelId: string): void
  removePlotPanel(panelId: string): void

  // Image Worker
  configureImagePanel(config: ImageWorkerConfig, callback: ImageDataCallback, errorCallback?: ErrorCallback): void
  decodeRawImage(panelId: string, width: number, height: number, encoding: string, data: ArrayBuffer, timestamp: number): void
  removeImagePanel(panelId: string): void

  // Raw Topic Worker
  configureRawTopicPanel(config: RawTopicWorkerConfig, callback: RawTopicDataCallback, errorCallback?: ErrorCallback): void
  formatRawTopicMessage(panelId: string, message: any, timestamp: number): void
  removeRawTopicPanel(panelId: string): void

  // Lifecycle
  terminate(): void
  isInitialized(type: PanelType): boolean
}

// Get singleton instance
function getPanelWorkerManager(): PanelWorkerManager
function resetPanelWorkerManager(): void
```

### Worker Command Types

All workers accept these standard commands:

| Command | Description |
|---------|-------------|
| `CONFIGURE` | Set/update panel configuration |
| `REMOVE_PANEL` | Clean up panel state in worker |
| Panel-specific commands | Process data for the panel type |

### Worker Response Types

All workers emit these standard responses:

| Response | Description |
|----------|-------------|
| `PROCESSED_DATA` / `DECODED_IMAGE` / `FORMATTED_MESSAGE` | Successfully processed data |
| `ERROR` | Error occurred during processing |

---

## Best Practices

### 1. Use Transferable Objects for Large Data

```typescript
// Good - transfers buffer without copying
const buffer = imageData.buffer.slice(0)
worker.postMessage({ type: 'DECODE', data: buffer }, [buffer])

// Bad - serializes and copies entire buffer
worker.postMessage({ type: 'DECODE', data: imageData })
```

### 2. Track Processed Messages to Avoid Duplicates

```typescript
const lastTimestampRef = useRef<number>(0)

useEffect(() => {
  if (message.timestamp <= lastTimestampRef.current) return
  lastTimestampRef.current = message.timestamp
  
  workerManager.process(panelId, message.data, message.timestamp)
}, [message])
```

### 3. Clean Up Worker State on Unmount

```typescript
useEffect(() => {
  workerManager.configurePanel(config, callback)
  
  return () => {
    workerManager.removePanel(panelId)  // Always clean up!
  }
}, [panelId])
```

### 4. Use Targeted Zustand Selectors

```typescript
// Good - only re-renders when topics change
const topics = useTopicsStore((state) => state.topics)

// Bad - re-renders on any store change
const { topics, subscribers, publishers } = useTopicsStore()
```

### 5. Memoize Expensive Child Components

```typescript
const ChartComponent = React.memo(
  ({ data, config }) => { /* render */ },
  (prev, next) => {
    // Custom comparison for complex props
    return prev.data.length === next.data.length &&
           prev.data[prev.data.length - 1] === next.data[next.data.length - 1]
  }
)
```

---

## Performance Benchmarks

Expected performance improvements with worker-based processing:

| Scenario | Before (Main Thread) | After (Workers) |
|----------|---------------------|-----------------|
| 4 Plot Panels @ 30Hz | ~45ms frame time | ~8ms frame time |
| 2 Image Panels (720p) | ~32ms per decode | <1ms main thread |
| 8 Raw Topic Viewers | ~15ms JSON.stringify | <1ms main thread |
| Mixed (3 plots + 2 images + 3 raw) | UI lag, dropped frames | Smooth 60fps |

### Main Thread Usage

| Metric | Target |
|--------|--------|
| Frame time | < 16ms (60fps) |
| Input latency | < 100ms |
| Time to first paint | < 50ms |

---

## Troubleshooting

### Worker Not Receiving Messages

1. Check if worker is initialized: `workerManager.isInitialized('plot')`
2. Verify `workerConfiguredRef.current === true` before sending messages
3. Check browser console for worker loading errors

### Data Not Updating in Panel

1. Verify callback is being called (add console.log in callback)
2. Check if message timestamp tracking is blocking updates
3. Ensure React state setter is being called with new reference

### Memory Leaks

1. Always call `removePanel()` in useEffect cleanup
2. Use `resetPanelWorkerManager()` on page navigation
3. Verify transferable objects are being transferred (not copied)

### Type Errors

1. Ensure worker types match between `panel-worker-types.ts` and worker file
2. Workers run in separate context - import types, not implementations
3. Use `export {}` at end of worker files to make them modules

---

## Future Improvements

1. **SharedArrayBuffer**: For zero-copy data sharing between main thread and workers
2. **Worker Pool**: Dynamically spawn additional workers under heavy load
3. **Priority Queue**: Process high-priority panels first (visible/focused)
4. **Offscreen Canvas**: Use OffscreenCanvas for image rendering in workers
5. **WASM Integration**: Use WebAssembly for even faster data processing

