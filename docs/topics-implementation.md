# Topics Page Implementation

## Overview

A complete implementation of the Topics page for the ROS Web Dashboard, allowing users to monitor, subscribe to, and publish ROS topics using roslibjs.

## Features Implemented

### 1. Topic Store (`store/topic-store.ts`)

- **Subscription Management**

  - `createSubscriber(topicName, messageType)` - Subscribe to a topic
  - `removeSubscriber(topicName)` - Unsubscribe from a topic
  - `clearMessageHistory(topicName)` - Clear message history for a topic
  - Stores last 50 messages per topic
  - Tracks latest message for quick access

- **Publishing Management** (existing functionality extended)

  - `createPublisher(topicName, messageType)` - Create a publisher
  - `publish(topicName, message)` - Publish a single message
  - `startPeriodicPublish(topicName, message, rate)` - Start periodic publishing
  - `stopPeriodicPublish(topicName)` - Stop periodic publishing
  - `removePublisher(topicName)` - Remove a publisher

- **Topics List**

  - `getTopicsList()` - Fetch all available topics and their types using `ros.getTopicsAndRawTypes()`
  - Automatically loads type definitions into the message parser

- **Cleanup**
  - `cleanup()` - Unsubscribe all topics and stop all publishers when page unmounts

### 2. Topic Card Component (`components/dashboard/topics/topic-card.tsx`)

- **Status-Based Styling** (following UI design spec)

  - Gray: Inactive (no subscription or publishing)
  - Green: Subscribing only (green-300 border, green-50 header)
  - Purple: Publishing only (purple-300 border, purple-50 header)
  - Mixed: Both subscribing and publishing (gradient green-to-purple)

- **Three Tabs**

  - Info: Display topic metadata
  - Subscribe: Subscribe and view messages
  - Publish: Publish messages to the topic

- **Status Badges**
  - Shows current state (Subscribed, Publishing, or Inactive)
  - Multiple badges for mixed state
  - Animated pulse indicators for active states

### 3. Topic Info Tab (`components/dashboard/topics/topic-info-tab.tsx`)

- Displays topic name and message type
- Clean, simple key-value layout
- Helper text guiding users to other tabs

### 4. Topic Subscribe Tab (`components/dashboard/topics/topic-subscribe-tab.tsx`)

- **Subscribe/Unsubscribe Button**

  - Green "Subscribe" button to start receiving messages
  - Red "Unsubscribe" button to stop

- **Latest Message Display**

  - Prominently shows the most recent message
  - Timestamp with millisecond precision
  - Pretty-printed JSON format
  - Green-tinted background

- **Message History**

  - Collapsible section showing last 20 messages
  - Each message has timestamp and pretty-printed JSON
  - Scrollable if history is long
  - Clear history button to remove old messages

- **Empty States**
  - Guidance when not subscribed
  - "Waiting for messages" when subscribed but no messages yet

### 5. Topic Publish Tab (`components/dashboard/topics/topic-publish-tab.tsx`)

- **JSON Message Editor**

  - Monospace textarea for editing messages
  - Pre-populated with default message structure from `messageTypeParser`
  - Real-time JSON validation
  - Error display for invalid JSON

- **One-Time Publishing**

  - Purple "Publish Once" button
  - Publishes a single message immediately
  - Toast notifications for success/error

- **Periodic Publishing**
  - Rate control (0.1 to 100 Hz)
  - Start/Stop buttons
  - Visual indicator when actively publishing
  - Prevents editing while publishing
  - Automatic cleanup on stop

### 6. Main Topics Page (`app/(dashboard)/dashboard/topics/page.tsx`)

- **Connection State Handling**

  - Warning message if ROS not connected
  - Link to settings page

- **Loading State**

  - Spinner while fetching topics
  - Clean loading message

- **Empty State**

  - Helpful message when no topics available
  - Icon and guidance text

- **Topics Grid**

  - Responsive 3-column layout (1 col mobile, 2 col tablet, 3 col desktop)
  - Shows count of available topics
  - Each topic rendered as a TopicCard

- **Automatic Cleanup**
  - Unsubscribes all topics when navigating away
  - Stops all periodic publishers
  - Prevents memory leaks

## Usage

### Subscribing to a Topic

1. Navigate to the Topics page
2. Find the topic you want to monitor
3. Click the "Subscribe" tab
4. Click the green "Subscribe" button
5. Watch messages appear in real-time
6. Expand "Message History" to see older messages
7. Click "Unsubscribe" to stop receiving messages

### Publishing to a Topic

1. Navigate to the Topics page
2. Find the topic you want to publish to
3. Click the "Publish" tab
4. Edit the JSON message in the textarea
5. Click "Publish Once" for a single message
6. OR set a rate and click "Start Periodic Publishing" for continuous publishing
7. Click "Stop Publishing" to stop periodic publishing

### Visual Indicators

- **Green Border/Badge**: Topic is being subscribed to
- **Purple Border/Badge**: Topic is being published to
- **Green-Purple Gradient**: Topic is both subscribed and published
- **Gray**: Topic is inactive
- **Pulsing Dot**: Active subscription or publishing

## Technical Details

### Message Type Parser (ROS2 Support)

The message type parser now fully supports ROS2 message definitions:

- **Embedded Type Extraction**: Automatically extracts nested message definitions from ROS2's `MSG: package/Type` format
- **Graceful Error Handling**: Returns safe fallbacks when type definitions are missing instead of crashing
- **Nested Message Support**: Recursively creates default messages for complex nested types
- **Type Definition Caching**: Caches parsed definitions for better performance
- **Warning System**: Logs helpful warnings (not errors) when types aren't found, including available types for debugging

### Message History

- Maximum 50 messages stored per topic
- Newest messages first
- Display limited to 20 in UI for performance
- Each message includes timestamp for reference

### JSON Validation

- Real-time validation as you type
- Clear error messages for invalid JSON
- Prevents publishing invalid messages
- Waits for type definitions to load before initializing message structure

### Cleanup

- Automatic cleanup on page unmount
- Prevents WebSocket memory leaks
- Stops all periodic publishing intervals
- Unsubscribes from all topics

### Performance

- Efficient state updates using Zustand
- Message history capped at 50 items
- Only re-renders affected components
- Collapsible history for reduced initial render

## Future Enhancements

- Message filtering/search in history
- Export message history to JSON/CSV
- Message templates for common publish patterns
- Topic visualization (graphs/charts for numeric data)
- Custom message formatters per type
- Bandwidth monitoring per topic
- Message rate statistics
