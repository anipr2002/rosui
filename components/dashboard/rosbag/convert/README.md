# Rosbag to MCAP Converter

A client-side rosbag converter that allows ROS developers to convert `.bag` and `.db3` files to `.mcap` format directly in the browser.

## Features

- **Client-side conversion**: No data is uploaded to any server, everything happens in the browser
- **Multiple format support**: Converts both `.bag` and `.db3` ROS2 bag files
- **Modern UI**: Beautiful, consistent design following the dashboard's UI patterns
- **Progress tracking**: Real-time status updates during conversion
- **Detailed statistics**: Shows topic count, message count, file sizes, and more
- **Easy download**: One-click download of converted MCAP files

## Architecture

### Core Conversion Logic
- **`lib/rosbag/converter.ts`**: Core conversion utility using `@foxglove/rosbag2-web` to read bags and `@mcap/core` to write MCAP files

### State Management
- **`store/rosbag-convert-store.ts`**: Zustand store managing conversion state, file handling, and downloads

### UI Components
- **`file-uploader.tsx`**: Drag-and-drop file upload component with validation
- **`conversion-controls.tsx`**: Control panel for starting conversion and showing progress
- **`conversion-results.tsx`**: Results display with statistics and download functionality
- **`index.ts`**: Component exports

### Page
- **`app/(dashboard)/dashboard/rosbag/convert/page.tsx`**: Main converter page with 2-column layout

## Usage

1. Navigate to `/dashboard/rosbag/convert`
2. Upload a `.bag` or `.db3` file via drag-and-drop or file browser
3. Click "Convert to MCAP"
4. Wait for conversion to complete (progress shown in real-time)
5. Download the converted `.mcap` file

## Technical Details

### Dependencies
- `@foxglove/rosbag2-web` - Reading ROS2 bag files
- `@foxglove/rostime` - ROS time handling
- `@mcap/core` - MCAP file writing
- `@mcap/browser` - Browser-specific MCAP utilities
- `protobufjs` - Protocol buffer support

### Conversion Process
1. Read input file as ArrayBuffer
2. Parse bag structure using Bag class from `@foxglove/rosbag2-web`
3. Initialize MCAP writer with ROS2 profile
4. Register schemas and channels for each topic
5. Iterate through messages and write to MCAP
6. Finalize MCAP file and combine chunks
7. Provide download functionality

### UI Theme
- File uploader: Purple theme (`border-purple-300`, `bg-purple-50`)
- Conversion controls: Indigo theme (`border-indigo-300`, `bg-indigo-50`)
- Results display: Green theme (`border-green-300`, `bg-green-50`)
- Follows the dashboard's card design spec with consistent styling

## Error Handling

- File type validation (only `.bag` and `.db3` allowed)
- Large file warnings (>100MB)
- Graceful error handling during conversion
- Toast notifications for user feedback
- Detailed error messages in UI

## Performance Considerations

- Large files (>500MB) may take several minutes to convert
- Memory usage scales with file size
- All processing happens in the browser's main thread
- Progress updates every 100 messages to avoid UI blocking

## Future Improvements

- Batch conversion support
- More detailed progress bar with percentage
- Conversion options (compression, filtering)
- Background worker thread for large files
- Pause/resume functionality



