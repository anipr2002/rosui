# Adding New Panel Types - Developer Guide

This guide explains how to add new panel types to the Rosbag Panels system. The architecture is designed to be extensible and maintainable.

## Architecture Overview

The panels system follows a type-safe, modular architecture:

```
components/dashboard/rosbag/panels/
├── plot/              # Plot panel implementation
│   ├── plot-panel.tsx
│   ├── series-config.tsx
│   └── index.ts
├── [new-type]/        # Your new panel type goes here
│   ├── [type]-panel.tsx
│   ├── [components].tsx
│   └── index.ts
├── file-upload.tsx    # Shared: File upload component
├── playback-controls.tsx  # Shared: Playback controls
├── index.ts           # Main exports
└── ADDING_PANELS.md   # This file
```

**Key Principles:**
- Each panel type lives in its own folder
- Shared components (FileUpload, PlaybackControls) are at the panels level
- Type-safe panel configuration using TypeScript discriminated unions
- Centralized state management in `store/panels-store.ts`

## Step-by-Step Guide

### 1. Define Your Panel Configuration Type

**File:** `store/panels-store.ts`

Add your panel config interface and update the union type:

```typescript
// Example: Adding a Video Panel
export interface VideoPanelConfig {
  id: string
  type: 'video'  // Discriminant - must be a unique literal type
  topic: string
  playbackRate: number
  // ... your panel-specific configuration
}

// Update the union type
export type PanelConfig = 
  | PlotPanelConfig 
  | VideoPanelConfig  // Add your type here
  // | FuturePanelConfig
```

**Configuration Guidelines:**
- Always include `id: string` (unique identifier)
- Always include `type: 'your-type'` (discriminant for type narrowing)
- Add panel-specific configuration fields
- Use optional fields (`?`) for non-essential config

### 2. Create Panel Component Folder

Create a new folder: `components/dashboard/rosbag/panels/[your-type]/`

**Required structure:**
```
[your-type]/
├── [your-type]-panel.tsx  # Main panel component
├── index.ts               # Exports
└── [other components]     # Panel-specific components
```

### 3. Implement Your Panel Component

**File:** `components/dashboard/rosbag/panels/[your-type]/[your-type]-panel.tsx`

```typescript
'use client'

import React from 'react'
import { usePanelsStore, type YourPanelConfig } from '@/store/panels-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { YourIcon, Trash2 } from 'lucide-react'

interface YourPanelProps {
  panelConfig: YourPanelConfig
}

export function YourPanel({ panelConfig }: YourPanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    // Add other store methods you need
  } = usePanelsStore()

  // Panel-specific logic here
  
  if (!metadata) return null

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-[your-color]-300">
      <CardHeader className="bg-[your-color]-50 border-[your-color]-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <YourIcon className="h-5 w-5 mt-0.5 text-[your-color]-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-[your-color]-900">
              Your Panel Type
            </CardTitle>
          </div>
          <Badge className="bg-[your-color]-100 text-[your-color]-700 hover:bg-[your-color]-100 border-[your-color]-200 text-xs">
            {/* Status info */}
          </Badge>
          <Button
            onClick={() => usePanelsStore.getState().removePanel(panelConfig.id)}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 h-7 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {/* Your panel content */}
      </CardContent>
    </Card>
  )
}
```

**Component Guidelines:**
- Use the Card component for consistent styling
- Follow the header pattern (Icon, Title, Badge, Delete button)
- Choose a unique color scheme (e.g., teal for playback, amber for warnings)
- Always implement a delete button
- Use `usePanelsStore` to access shared state (metadata, currentTime, messages)

### 4. Add Store Actions

**File:** `store/panels-store.ts`

Add actions specific to your panel type:

```typescript
interface PanelsState {
  // ... existing state
  
  // Add your panel type actions
  addYourPanel: () => void
  updateYourPanel: (panelId: string, config: Partial<YourPanelConfig>) => void
  // Generic remove works for all types
}

export const usePanelsStore = create<PanelsState>((set, get) => ({
  // ... existing implementation
  
  addYourPanel: () => {
    const newPanel: YourPanelConfig = {
      id: `panel-${Date.now()}-${Math.random()}`,
      type: 'your-type',
      // ... default configuration
    }
    
    set((state) => ({
      panels: [...state.panels, newPanel],
      // Update type-specific arrays if needed
    }))
  },
  
  updateYourPanel: (panelId: string, config: Partial<YourPanelConfig>) => {
    set((state) => ({
      panels: state.panels.map(p =>
        p.id === panelId && p.type === 'your-type' 
          ? { ...p, ...config } 
          : p
      ),
    }))
  },
}))
```

**Store Action Guidelines:**
- Generate unique IDs using timestamp + random
- Always set the `type` field correctly
- Update the `panels` array (main source of truth)
- Use type guards (`p.type === 'your-type'`) when filtering

### 5. Export Your Panel

**File:** `components/dashboard/rosbag/panels/[your-type]/index.ts`

```typescript
export { YourPanel } from './your-panel'
// Export other components if needed
```

**File:** `components/dashboard/rosbag/panels/index.ts`

```typescript
// ... existing exports
export { YourPanel } from './your-type'
```

### 6. Update the Page Component

**File:** `app/(dashboard)/dashboard/rosbag/panels/page.tsx`

Add your panel to the dropdown and rendering logic:

```typescript
import { YourPanel } from '@/components/dashboard/rosbag/panels'
import { YourIcon } from 'lucide-react'

export default function PanelsPage() {
  const { panels, addYourPanel } = usePanelsStore()
  
  return (
    // ... existing code
    
    {/* In the dropdown menus (both locations) */}
    <DropdownMenuContent align="center" className="w-48">
      <DropdownMenuItem onClick={addPlotPanel}>
        <BarChart3 className="h-4 w-4 mr-2" />
        Plot Panel
      </DropdownMenuItem>
      <DropdownMenuItem onClick={addYourPanel}>
        <YourIcon className="h-4 w-4 mr-2" />
        Your Panel Type
      </DropdownMenuItem>
    </DropdownMenuContent>
    
    {/* In the panels rendering */}
    panels.map((panel) => {
      if (panel.type === 'plot') {
        return <PlotPanel key={panel.id} panelConfig={panel} />
      }
      if (panel.type === 'your-type') {
        return <YourPanel key={panel.id} panelConfig={panel} />
      }
      return null
    })
  )
}
```

## Data Access Patterns

### Accessing MCAP Data

Use the store's data access methods:

```typescript
const {
  metadata,           // MCAP file metadata
  messages,           // All messages (rarely used directly)
  currentTime,        // Current playback time (bigint nanoseconds)
  getMessagesForTopic,     // Get messages for a specific topic
  getDeserializedMessage,  // Deserialize a CDR message
} = usePanelsStore()

// Get messages for a topic
const messages = getMessagesForTopic('/your/topic')

// Filter by time range
const messages = getMessagesForTopic(
  '/your/topic',
  metadata.startTime,
  currentTime  // Only messages up to current time
)

// Deserialize message data
messages.forEach(msg => {
  const data = getDeserializedMessage(msg)
  // Use data...
})
```

### Progressive Reveal Pattern

For time-synchronized visualization:

```typescript
// Load all data once
const allData = useMemo(() => {
  const messages = getMessagesForTopic(topic)
  return messages.map(msg => ({
    time: timestampToSeconds(msg.logTime - metadata.startTime),
    value: getDeserializedMessage(msg).data
  }))
}, [topic, metadata])

// Filter to current time for rendering
const visibleData = allData.filter(
  point => point.time <= timestampToSeconds(currentTime - metadata.startTime)
)
```

## Shared Components

### FileUpload
- Shows MCAP file upload interface
- Displays loaded file info
- **Usage:** Always include at the bottom of the page

### PlaybackControls
- Timeline scrubbing
- Play/pause functionality
- Speed control
- **Usage:** Include once per page (not per panel)

## Color Schemes

Use distinct colors for different panel types:

- **Plot:** Purple (`purple-50`, `purple-600`, etc.)
- **Playback:** Teal (`teal-50`, `teal-600`, etc.)
- **Upload:** Amber/Green (`amber-50`, `green-600`, etc.)
- **Your Panel:** Choose a unique color (blue, indigo, pink, etc.)

## Testing Checklist

Before submitting your new panel type:

- [ ] Panel appears in "Add Panel" dropdown
- [ ] Panel renders correctly with default configuration
- [ ] Delete button removes the panel
- [ ] Panel updates when configuration changes
- [ ] Panel responds to playback time changes
- [ ] Multiple panels of your type can coexist
- [ ] Panel state persists when adding/removing other panels
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Follows the styling patterns of existing panels

## Examples

### Simple Panel (Counter)

```typescript
export interface CounterPanelConfig {
  id: string
  type: 'counter'
  topic: string
}

export function CounterPanel({ panelConfig }: { panelConfig: CounterPanelConfig }) {
  const { currentTime, metadata, getMessagesForTopic } = usePanelsStore()
  
  const count = useMemo(() => {
    if (!metadata) return 0
    const messages = getMessagesForTopic(panelConfig.topic, metadata.startTime, currentTime)
    return messages.length
  }, [panelConfig.topic, currentTime, metadata])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Counter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{count}</div>
        <p className="text-sm text-gray-500">messages on {panelConfig.topic}</p>
      </CardContent>
    </Card>
  )
}
```

## Common Pitfalls

1. **Forgetting the discriminant:** Always include `type: 'your-type'` in your config
2. **Not updating both arrays:** When you modify panels, update both `panels` and any type-specific arrays
3. **Direct state mutation:** Always use `set()` to update Zustand state
4. **Missing type guards:** Use `panel.type === 'your-type'` to narrow types
5. **Ignoring currentTime:** For time-based visualization, always filter by currentTime
6. **Not cleaning up:** Remove event listeners, intervals, etc. in useEffect cleanup

## Need Help?

- Check the Plot panel implementation as a reference
- Review the store implementation for patterns
- Ensure TypeScript types are correct (discriminated unions)
- Test with multiple panels of different types

## Future Enhancements

Potential improvements to the panel system:

- Panel persistence (save/load layouts)
- Panel templates
- Drag-and-drop reordering
- Panel grouping/tabs
- Export panel configurations
- Share panel configurations between users

