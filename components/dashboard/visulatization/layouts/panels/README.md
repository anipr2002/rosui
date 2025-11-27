# Live ROS Data Panels System

A flexible, extensible panel system for visualizing live ROS data in custom dashboard layouts. Unlike rosbag panels that replay recorded data, these panels subscribe to live ROS topics and display real-time streaming data.

## Overview

The Live Panels system provides a compact, efficient way to visualize live ROS data within resizable grid layouts. Each panel type can subscribe to topics, process messages, and render visualizations in real-time.

## Key Differences from Rosbag Panels

| Feature      | Rosbag Panels          | Live Panels             |
| ------------ | ---------------------- | ----------------------- |
| Data Source  | MCAP files (recorded)  | Live ROS topics         |
| Settings UI  | Tabs (Chart/Settings)  | Compact popover         |
| Panel Size   | Large, detailed        | Compact, grid-optimized |
| Time Control | Playback timeline      | Real-time only          |
| Data Buffer  | Full file loaded       | Last N messages         |
| Layout       | Fixed individual cards | Resizable grid panels   |

## Architecture

```
components/dashboard/advanced/layouts/
├── core/                          # Layout building blocks
│   ├── panel-registry.tsx        # Central panel registration
│   ├── panel-grid.tsx            # Grid layout with drag-and-drop
│   ├── sortable-panel.tsx        # Individual panel wrapper
│   ├── types.ts                  # Shared types
│   └── constants.ts              # Layout configurations
│
└── panels/                        # Live panel implementations
    ├── plot/                      # Plot panel
    │   ├── live-plot-panel.tsx   # Main component
    │   ├── plot-settings.tsx     # Settings popover
    │   ├── types.ts              # Panel-specific types
    │   └── index.ts              # Exports
    ├── [gauge]/                   # Future: Gauge panel
    ├── [indicator]/               # Future: Indicator panel
    ├── index.ts                   # Main exports
    └── README.md                  # This file
```

## Current Panel Types

### Plot Panel

Real-time streaming line chart for numeric data.

**Features:**

- Subscribe to any ROS topic
- Parse nested message paths (e.g., `.data`, `.pose.position.x`)
- Configurable line color
- Adjustable data buffer (10-1000 points)
- Auto-scaling axes
- Responsive to panel resize

**Configuration:**

- Topic selection (dropdown)
- Message path (text input with validation)
- Line color (color picker)
- Max data points (number input)

**Use Cases:**

- Velocity monitoring
- Sensor value plots
- Position tracking
- Any numeric time-series data

## Adding New Panel Types

Follow these steps to add a new live panel type (e.g., Gauge, Indicator, Map).

### Step 1: Create Panel Structure

Create a new folder under `panels/`:

```bash
panels/
└── your-panel/
    ├── live-your-panel.tsx    # Main component
    ├── your-settings.tsx      # Settings popover
    ├── types.ts               # Panel-specific types
    └── index.ts               # Exports
```

### Step 2: Define Panel Configuration Type

**File:** `panels/your-panel/types.ts`

```typescript
export interface YourPanelConfig {
  topic?: string;
  // Add panel-specific configuration fields
  threshold?: number;
  color?: string;
  // ... other settings
}

export interface YourPanelData {
  // Define data structure for your panel
  value: number;
  timestamp: number;
}
```

### Step 3: Create Settings Component

**File:** `panels/your-panel/your-settings.tsx`

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTopicsStore } from '@/store/topic-store'
import type { YourPanelConfig } from './types'

interface YourSettingsProps {
  config: YourPanelConfig
  onConfigChange: (config: YourPanelConfig) => void
}

export function YourSettings({ config, onConfigChange }: YourSettingsProps) {
  const { topics } = useTopicsStore()
  const [localConfig, setLocalConfig] = useState<YourPanelConfig>(config)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleApply = () => {
    onConfigChange(localConfig)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all opacity-0 group-hover:opacity-100"
          title="Panel Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Panel Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure your panel
            </p>
          </div>

          <div className="space-y-3">
            {/* Topic Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="topic" className="text-xs">Topic</Label>
              <Select
                value={localConfig.topic || ''}
                onValueChange={(topic) => setLocalConfig({ ...localConfig, topic })}
              >
                <SelectTrigger id="topic" className="h-8 text-xs">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.name} value={topic.name}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add your panel-specific settings here */}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Step 4: Create Main Panel Component

**File:** `panels/your-panel/live-your-panel.tsx`

```typescript
'use client'

import React, { useEffect, useMemo, useCallback, useRef } from 'react'
import { useTopicsStore } from '@/store/topic-store'
import { YourSettings } from './your-settings'
import type { Panel } from '../../core/types'
import type { YourPanelConfig } from './types'

interface YourPanelProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
}

export function LiveYourPanel({ panel, onUpdatePanel }: YourPanelProps) {
  const { topics, subscribers, createSubscriber } = useTopicsStore()
  const config = (panel.config as YourPanelConfig) || {}

  // Get topic type
  const topicType = useMemo(() => {
    if (!config.topic) return null
    const topic = topics.find((t) => t.name === config.topic)
    return topic?.type || null
  }, [topics, config.topic])

  // Subscribe to topic
  useEffect(() => {
    if (!config.topic || !topicType) return

    const existingSubscriber = subscribers.get(config.topic)
    if (!existingSubscriber) {
      try {
        createSubscriber(config.topic, topicType)
      } catch (error) {
        console.error('Failed to subscribe:', error)
      }
    }
  }, [config.topic, topicType, createSubscriber, subscribers])

  // Process data
  const processedData = useMemo(() => {
    if (!config.topic) return null

    const subscriber = subscribers.get(config.topic)
    if (!subscriber?.latestMessage) return null

    // Extract and process your data here
    return subscriber.latestMessage
  }, [config.topic, subscribers])

  const handleConfigChange = useCallback(
    (newConfig: YourPanelConfig) => {
      onUpdatePanel(panel.id, { config: newConfig })
    },
    [panel.id, onUpdatePanel]
  )

  // Empty state
  if (!config.topic) {
    return (
      <div className="relative h-full w-full group">
        <YourSettings config={config} onConfigChange={handleConfigChange} />
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Your Panel
          </div>
          <div className="text-xs text-gray-500">
            Click settings to configure
          </div>
        </div>
      </div>
    )
  }

  // Render your visualization
  return (
    <div className="relative h-full w-full group">
      <YourSettings config={config} onConfigChange={handleConfigChange} />
      <div className="h-full w-full p-4 flex items-center justify-center">
        {/* Your visualization here */}
        <div className="text-2xl font-bold">
          {processedData ? JSON.stringify(processedData) : 'Waiting...'}
        </div>
      </div>
    </div>
  )
}
```

### Step 5: Create Exports

**File:** `panels/your-panel/index.ts`

```typescript
export { LiveYourPanel } from "./live-your-panel";
export type { YourPanelConfig } from "./types";
```

### Step 6: Register Panel

**File:** `core/panel-registry.tsx`

```typescript
// Add import
import { LiveYourPanel } from "../panels/your-panel";

// Add registration (after existing registrations)
panelRegistry.register("Your Panel", {
  name: "Your Panel",
  component: LiveYourPanel,
});
```

**File:** `core/constants.ts`

Add your panel type to the `PANEL_TYPES` array:

```typescript
export const PANEL_TYPES = [
  // ... existing types
  "Your Panel",
  // ... other types
];
```

### Step 7: Test Your Panel

1. Start your application
2. Navigate to the dashboard layouts page
3. Add a panel
4. Right-click the panel and select "Your Panel"
5. Click the settings icon and configure
6. Verify real-time data updates

## Panel Development Best Practices

### 1. Performance Optimization

- **Memoization:** Use `useMemo` for expensive computations
- **Data Buffering:** Limit the number of messages processed (e.g., last 100)
- **Animation Control:** Use `isAnimationActive={false}` for real-time charts
- **Debouncing:** Consider debouncing rapid updates if needed

```typescript
const chartData = useMemo(() => {
  // Expensive data processing
  const subscriber = subscribers.get(config.topic);
  const messages = subscriber?.messages.slice(0, 100); // Limit buffer
  return processMessages(messages);
}, [config.topic, subscribers]); // Only recompute when necessary
```

### 2. Subscription Management

- **Check existing subscriptions:** Don't create duplicate subscriptions
- **Centralized cleanup:** Let topic-store manage unsubscribe
- **Error handling:** Wrap subscribe calls in try-catch

```typescript
useEffect(() => {
  if (!config.topic || !topicType) return;

  const existingSubscriber = subscribers.get(config.topic);
  if (!existingSubscriber) {
    try {
      createSubscriber(config.topic, topicType);
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  }
}, [config.topic, topicType]);
```

### 3. Responsive Design

Panels must adapt to different sizes (colspan × rowspan):

- **Use ResponsiveContainer:** For charts (Recharts)
- **Flexible layouts:** Use flexbox or CSS Grid
- **Font scaling:** Adjust font sizes based on panel size
- **Conditional rendering:** Hide elements in small panels

```typescript
// Adjust based on panel size
const fontSize = panel.colspan < 2 ? 10 : 12;
const showLegend = panel.colspan >= 2 && panel.rowspan >= 2;
```

### 4. Empty States

Always handle empty/loading states gracefully:

- No configuration
- No data received
- Invalid message path
- Connection errors

```typescript
if (!config.topic) {
  return <EmptyConfigState />
}

if (!data || data.length === 0) {
  return <WaitingForDataState />
}

return <YourVisualization data={data} />
```

### 5. Settings UI Guidelines

- **Compact layout:** Use small inputs (h-8, text-xs)
- **Clear labels:** Describe what each setting does
- **Validation:** Validate inputs before applying
- **Apply/Cancel:** Always provide both buttons
- **Hover trigger:** Settings icon appears on hover

### 6. Message Parsing

Use the message-path-parser library for consistent data extraction:

```typescript
import {
  parseNumericPath,
  parseMessagePath,
} from "@/lib/rosbag/message-path-parser";

// For numeric values
const value = parseNumericPath(message, ".pose.position.x");

// For any value
const result = parseMessagePath(message, ".header.frame_id");
if (result.success) {
  console.log(result.value);
}
```

### 7. Type Safety

Define strong types for your panel configuration:

```typescript
// Good
export interface YourPanelConfig {
  topic: string;
  threshold: number;
  color: string;
}

// Bad - too generic
export interface YourPanelConfig {
  [key: string]: any;
}
```

## Common Panel Types to Implement

### Gauge Panel

- Single numeric value with min/max range
- Color-coded zones (green/yellow/red)
- Use cases: Battery level, temperature, speed

### Indicator Panel

- Boolean or status indicator
- LED-style display with colors
- Use cases: Connection status, error flags

### Raw Topic Viewer

- Display raw message content
- JSON tree view
- Use cases: Debugging, message inspection

### Image Panel

- Display sensor_msgs/Image topics
- Compressed image support
- Use cases: Camera feeds

### Map Panel

- 2D position visualization
- nav_msgs/Odometry, geometry_msgs/PoseStamped
- Use cases: Robot position tracking

### Table Panel

- Tabular data display
- Multiple fields from one topic
- Use cases: Joint states, sensor arrays

## Integration with Topic Store

The topic store (`store/topic-store.ts`) provides:

- **topics:** List of available topics with types
- **subscribers:** Map of active subscriptions
- **createSubscriber:** Subscribe to a topic
- **removeSubscriber:** Unsubscribe from a topic

```typescript
const { topics, subscribers, createSubscriber, removeSubscriber } =
  useTopicsStore();

// Get available topics
const topicList = topics.map((t) => t.name);

// Subscribe
createSubscriber("/cmd_vel", "geometry_msgs/Twist");

// Access messages
const subscriber = subscribers.get("/cmd_vel");
const messages = subscriber?.messages; // Last 50 messages
const latest = subscriber?.latestMessage; // Most recent
```

## Troubleshooting

### Panel not appearing in context menu

- Check registration in `panel-registry.tsx`
- Verify `PANEL_TYPES` in `constants.ts`
- Ensure component is properly exported

### Settings not updating panel

- Verify `onUpdatePanel` is called with correct panel ID
- Check that config is properly typed in component
- Use React DevTools to inspect panel state

### No data showing

- Verify topic exists and is publishing
- Check message path syntax
- Look for parsing errors in console
- Confirm subscriber is active

### Performance issues

- Limit data buffer size (< 1000 points)
- Use `useMemo` for data processing
- Disable animations in real-time charts
- Consider throttling rapid updates

## Future Enhancements

- **Panel templates:** Save/load panel configurations
- **Panel grouping:** Organize related panels
- **Shared subscriptions:** Optimize multiple panels on same topic
- **Persistence:** Save dashboard layouts to local storage
- **Export/import:** Share dashboard configurations
- **Panel linking:** Synchronize selections across panels

## Contributing

When adding new panel types:

1. Follow the step-by-step guide above
2. Test with multiple panel sizes
3. Handle all empty/error states
4. Document configuration options
5. Add examples to this README
6. Test real-time performance

## Examples

See the Plot Panel implementation (`panels/plot/`) as a reference for:

- Real-time data streaming
- Settings popover UI
- Message path parsing
- Responsive chart rendering
- Configuration management
