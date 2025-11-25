# Performance Optimization Guide

This document describes the performance optimization strategies used in the ROS UI dashboard, particularly for handling multiple simultaneous panel visualizations.

## Architecture Overview

The dashboard uses **panel-type-specific Web Workers** to offload heavy computations from the main thread, combined with **optimized React patterns** to prevent unnecessary re-renders.

```
Main Thread                          Worker Threads
------------                         --------------
[TopicStore] ----postMessage---->   [PlotWorker]     (data parsing, chart processing)
     |                              [ImageWorker]    (raw decoding, transforms)
     |                              [RawTopicWorker] (JSON formatting)
     v
[Panel Components] <--onmessage---- [Workers respond with processed data]
```

## Panel Workers

Located in `lib/workers/panels/`:

### 1. Plot Worker (`plot-worker.ts`)

Handles chart data processing for plot panels:
- Parses message paths from raw ROS messages
- Maintains chart data history per panel
- Assembles multi-series data points
- Trims data to configured max points

### 2. Image Worker (`image-worker.ts`)

Handles raw image decoding for image panels:
- Decodes raw ROS images (`sensor_msgs/Image`)
- Applies color mapping for depth images (turbo, rainbow)
- Applies transformations (flip, rotate)
- Uses transferable ArrayBuffers to avoid copying

**Note:** Compressed images (`sensor_msgs/CompressedImage`) are still decoded on main thread because they require DOM APIs (`Image()`, `canvas`).

### 3. Raw Topic Worker (`raw-topic-worker.ts`)

Handles JSON formatting for raw topic viewer panels:
- Formats JSON messages with configurable pretty printing
- Handles message truncation for large payloads
- Maintains per-panel configuration

### Panel Worker Manager (`panel-worker-manager.ts`)

Singleton manager that:
- Creates one worker per panel type (not per instance)
- Routes messages to the correct worker
- Manages worker lifecycle (init, terminate)
- Provides clean API for panels

## React Optimization Patterns

### 1. Targeted Zustand Selectors

**Before (re-renders on any subscriber change):**
```tsx
const { subscribers } = useTopicsStore()
```

**After (re-renders only when specific data changes):**
```tsx
const topics = useTopicsStore((state) => state.topics)
const subscribers = useTopicsStore((state) => state.subscribers)
```

### 2. React.memo with Custom Comparison

For components with complex props like image data:

```tsx
const ImageRenderer = React.memo(
  ImageRendererComponent,
  (prevProps, nextProps) => {
    // Sample pixels instead of comparing entire buffer
    if (prevProps.image.width !== nextProps.image.width) return false
    
    const step = Math.floor(prevProps.image.data.length / 100)
    for (let i = 0; i < prevProps.image.data.length; i += step) {
      if (prevProps.image.data[i] !== nextProps.image.data[i]) return false
    }
    return true
  }
)
```

### 3. Stable References with useCallback/useMemo

```tsx
// Stabilize config reference to prevent recalculations
const config = useMemo<LivePlotConfig>(() => {
  const newConfig = (panel.config as LivePlotConfig) || {}
  
  // Return same reference if unchanged
  if (JSON.stringify(prevConfig.current) === JSON.stringify(newConfig)) {
    return prevConfig.current
  }
  
  prevConfig.current = newConfig
  return newConfig
}, [panel.config])
```

### 4. Message Deduplication

Track last processed message to avoid redundant worker calls:

```tsx
const lastMessageTimestampRef = useRef<number>(0)

useEffect(() => {
  if (timestamp <= lastMessageTimestampRef.current) return
  lastMessageTimestampRef.current = timestamp
  
  workerManager.processMessage(panelId, data, timestamp)
}, [subscribers])
```

## Performance Best Practices

### Do:

1. **Use Web Workers for CPU-intensive tasks**
   - Image decoding
   - JSON stringification of large objects
   - Data transformation and parsing

2. **Use targeted Zustand selectors**
   - Select only the state slices you need
   - Components only re-render when their selected state changes

3. **Use React.memo with custom comparators**
   - For components with large/complex props
   - Sample data instead of deep equality checks

4. **Use transferable objects in workers**
   - ArrayBuffers can be transferred without copying
   - Use `postMessage(data, [data.buffer])` syntax

5. **Debounce expensive operations**
   - Config changes that trigger worker reconfiguration
   - Transform state persistence

### Don't:

1. **Don't subscribe to entire Zustand store**
   - Causes re-renders on any state change

2. **Don't create inline objects/functions in render**
   - Creates new references each render
   - Defeats React.memo

3. **Don't do heavy processing in useMemo/useEffect**
   - Move to workers instead

4. **Don't create worker per panel instance**
   - Resource exhaustion with many panels
   - One worker per panel type is sufficient

## Debugging Performance

### React DevTools Profiler

1. Enable React DevTools
2. Go to Profiler tab
3. Record while interacting with panels
4. Look for:
   - Components re-rendering unnecessarily
   - Long render times (>16ms)

### Browser DevTools

1. Performance tab - record timeline
2. Look for:
   - Long tasks blocking main thread
   - Frequent garbage collection
   - Worker message timing

### Worker Debug Logging

Enable in worker configuration:

```tsx
workerBridge.initialize({
  debug: true,  // Logs message counts and timing
})
```

## Files Reference

| File | Purpose |
|------|---------|
| `lib/workers/panels/panel-worker-types.ts` | TypeScript types for worker communication |
| `lib/workers/panels/panel-worker-manager.ts` | Singleton worker lifecycle manager |
| `lib/workers/panels/plot-worker.ts` | Chart data processing worker |
| `lib/workers/panels/image-worker.ts` | Image decoding worker |
| `lib/workers/panels/raw-topic-worker.ts` | JSON formatting worker |
| `components/.../plot/live-plot-panel.tsx` | Optimized plot panel component |
| `components/.../image/live-image-panel.tsx` | Optimized image panel component |
| `components/.../raw-topic-viewer/live-raw-topic-viewer.tsx` | Optimized raw topic viewer |
| `components/.../image/image-renderer.tsx` | Memoized image renderer |
