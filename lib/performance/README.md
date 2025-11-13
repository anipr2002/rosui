# Performance Monitoring Utilities

This directory contains performance monitoring and debugging utilities for React components. These tools are **only active in development mode** and have zero impact on production builds.

## Available Tools

### 1. `useRenderCount`

Tracks how many times a component renders.

```tsx
import { useRenderCount } from '@/lib/performance'

function MyComponent() {
  useRenderCount('MyComponent')
  
  return <div>My Component</div>
}
```

### 2. `useWhyDidYouUpdate`

Logs which props changed between renders, helping identify unnecessary re-renders.

```tsx
import { useWhyDidYouUpdate } from '@/lib/performance'

function MyComponent({ prop1, prop2, prop3 }) {
  useWhyDidYouUpdate('MyComponent', { prop1, prop2, prop3 })
  
  return <div>My Component</div>
}
```

### 3. `ProfilerWrapper`

Wraps components with React Profiler and logs render times.

```tsx
import { ProfilerWrapper } from '@/lib/performance'

<ProfilerWrapper id="MyExpensiveComponent">
  <MyExpensiveComponent />
</ProfilerWrapper>
```

**Output:**
- Warnings (⚠️) for renders > 16ms (missed frame at 60fps)
- Info logs for renders > 5ms
- Silent for fast renders < 5ms

### 4. `PerformanceTracker`

Tracks performance of specific operations.

```tsx
import { PerformanceTracker } from '@/lib/performance'

function processData() {
  PerformanceTracker.mark('dataProcessing')
  
  // ... expensive operation ...
  
  PerformanceTracker.measure('Data Processing Complete', 'dataProcessing')
}
```

## Performance Optimization Best Practices

Based on the optimizations implemented in this codebase:

### 1. Use React.memo with Custom Comparisons

```tsx
const MyComponent = React.memo(
  ({ data, callback }) => {
    // Component logic
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.data === nextProps.data &&
           prevProps.callback === nextProps.callback
  }
)
```

### 2. Stabilize References with useMemo/useCallback

```tsx
const stableConfig = useMemo(() => {
  const newConfig = computeConfig()
  // Return same reference if nothing changed
  if (JSON.stringify(prevConfig) === JSON.stringify(newConfig)) {
    return prevConfig
  }
  return newConfig
}, [dependencies])
```

### 3. Use Zustand with Immer

```tsx
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useStore = create()(
  immer((set) => ({
    data: [],
    update: (item) => set((state) => {
      // Immer handles immutability
      state.data.push(item)
    })
  }))
)
```

### 4. Debounce Expensive Updates

```tsx
const debouncedValue = useDebounce(value, 300) // 300ms delay

useEffect(() => {
  // Only runs after user stops typing for 300ms
  expensiveOperation(debouncedValue)
}, [debouncedValue])
```

### 5. Extract Heavy Components

```tsx
// Bad: Chart re-renders with every parent render
function Panel() {
  return <HeavyChart data={data} />
}

// Good: Chart only re-renders when data actually changes
const MemoizedChart = React.memo(HeavyChart)

function Panel() {
  return <MemoizedChart data={data} />
}
```

## Debugging Performance Issues

1. **Enable profiling:**
   - Run in development mode
   - Open DevTools Console
   - Look for `[Profiler]`, `[Render]`, or `[Performance]` logs

2. **Identify problematic components:**
   - Components rendering > 16ms will show warnings
   - Use `useWhyDidYouUpdate` to see what props changed

3. **Common issues:**
   - **Inline object/array creation:** `style={{ margin: 10 }}` creates new object each render
   - **Missing dependencies:** useCallback/useMemo without proper deps
   - **Store updates:** Zustand subscribers re-rendering on every state change
   - **Large lists:** Not using virtualization (react-window/react-virtual)

## Performance Metrics

The dashboard layout system has been optimized for:
- **< 16ms** renders (60fps) for UI interactions
- **< 100ms** for settings panel operations
- **Minimal re-renders** when multiple plots are running simultaneously

All optimizations maintain the same functionality while improving responsiveness.

