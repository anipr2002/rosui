# Rosbag Panels System

A comprehensive, extensible rosbag visualization system for MCAP files with playback controls and multiple panel types, inspired by Foxglove Studio.

## Overview

The Rosbag Panels system provides a flexible, type-safe architecture for visualizing and analyzing ROS bag data. The system is designed to be easily extensible - new panel types can be added without modifying existing code.

## Features

- **MCAP File Upload**: Drag-and-drop or browse to upload MCAP rosbag files
- **Playback Controls**: Full timeline scrubbing with play/pause, skip forward/backward, and variable playback speed
- **Extensible Panel System**: Add new panel types easily with a type-safe architecture
- **Plot Panels**: Time-series data visualization with progressive reveal
- **Multi-Series Support**: Add multiple data series to a single plot
- **Message Path Parsing**: Extract nested fields from ROS messages (e.g., `.data`, `.pose.position.x`)
- **Real-time Updates**: All panels update as playback time changes

## Current Panel Types

### Plot Panel

- Time-series line charts with Recharts
- Multiple series per panel
- Custom axis labels and ranges
- Progressive data reveal during playback
- Interactive legend and tooltips

**Future Panel Types:** Video, 3D visualization, Image, Table, Gauge, Map, etc.

## Adding New Panel Types

**See [ADDING_PANELS.md](./ADDING_PANELS.md) for a comprehensive guide on adding new panel types.**

The system uses TypeScript discriminated unions for type safety and follows a consistent pattern:

1. Define panel configuration type in `store/panels-store.ts`
2. Create panel component in `panels/[type]/` folder
3. Add store actions for the panel type
4. Update the page to include the new panel in dropdown and rendering

## Architecture

### Core Libraries

- **`lib/rosbag/mcap-reader.ts`**: MCAP file parsing using `@mcap/core`
- **`lib/rosbag/message-path-parser.ts`**: Message path parsing for nested field access
- **`store/panels-store.ts`**: Zustand store for state management

### Component Structure

```
panels/
├── plot/                    # Plot panel implementation
│   ├── plot-panel.tsx      # Main plot visualization
│   ├── series-config.tsx   # Series configuration UI
│   └── index.ts
├── file-upload.tsx         # Shared: File upload with drag-and-drop
├── playback-controls.tsx   # Shared: Timeline and playback controls
├── index.ts                # Main exports
├── README.md               # This file
└── ADDING_PANELS.md        # Developer guide for new panels
```

**Shared Components:**

- **`file-upload.tsx`**: File upload interface, displays loaded file info
- **`playback-controls.tsx`**: Timeline scrubbing, play/pause, speed control

**Panel Type Components:**

- **`plot/`**: Plot panel with time-series visualization

### Page

- **`app/(dashboard)/dashboard/rosbag/panels/page.tsx`**: Main panels page

## Usage

1. Navigate to `/dashboard/rosbag/panels`
2. Upload an MCAP file (drag-and-drop or browse)
3. A plot panel will be automatically added
4. Click "Add Series" in the Settings tab
5. Select a topic and enter the message path (e.g., `.data`)
6. View the chart in the Chart tab
7. Use playback controls to scrub through time

## Message Path Syntax

The message path parser supports:

- **Simple fields**: `.data`
- **Nested fields**: `.pose.position.x`
- **Array indexing**: `.array[0]`
- **Array slicing**: `.array[:].x` (extracts field from all elements)

## Examples

### Float64 Topic

```
Topic: /test/cosine_wave
Type: std_msgs/Float64
Path: .data
```

### Pose Topic

```
Topic: /robot/pose
Type: geometry_msgs/PoseStamped
Path: .pose.position.x
```

### Array Topic

```
Topic: /sensor/readings
Type: sensor_msgs/JointState
Path: .position[0]
```

## Installation

**Important**: Before running the application, install the required package:

```bash
npm install @radix-ui/react-slider
```

This package is required for the playback timeline slider component.

## Fixed Issues

- **MCAP Reader API**: Updated to use `McapIndexedReader` from `@mcap/core` and `BlobReadable` from `@mcap/browser` instead of `McapStreamReader`, which resolves the parsing errors.
- The reader now properly uses:
  - `BlobReadable` to wrap the File object for browser compatibility
  - `McapIndexedReader.Initialize()` for efficient indexed reading
  - Async `readMessages()` iterator pattern with `for await` loop
  - Direct access to `schemasById` and `channelsById` maps

## UI Design

Follows the established UI design patterns:

- **File Upload**: Gray theme with drag-and-drop
- **Playback Controls**: Teal theme (consistent with RQT graph)
- **Plot Panels**: Purple theme
- **Cards**: Rounded corners, minimal shadows, status-colored headers

## Future Enhancements

The architecture supports easy addition of:

- Gauge panels
- Image panels
- Indicator panels
- Multiple panels in a single layout
- Panel layout persistence
- Live message visualization (currently only MCAP files)
