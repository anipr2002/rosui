# ROS Connection Manager

A beautiful, feature-rich React component for managing ROS (Robot Operating System) connections through rosbridge WebSocket.

## Features

- 🎨 **Beautiful UI** with light pastel colors and smooth animations
- 🔌 **Real-time connection status** with visual indicators
- ⚙️ **Comprehensive configuration options** based on roslibjs
- 🔄 **Auto-reconnect** functionality with configurable intervals
- 💾 **Persistent settings** using Zustand with localStorage
- 🎯 **Type-safe** with TypeScript support
- ♿ **Accessible** following best practices

## Usage

### Basic Usage

```tsx
import { RosConnectionManager } from "@/components/dashboard/ros-connection-manager";

function MyPage() {
  return <RosConnectionManager />;
}
```

### Using the Store

The component uses a global Zustand store that you can access from anywhere:

```tsx
import { useRosStore } from "@/store/ros-store";

function MyComponent() {
  const { ros, status, connect, disconnect } = useRosStore();

  // Use the ros instance for topics, services, etc.
  useEffect(() => {
    if (ros && status === "connected") {
      const listener = new ROSLIB.Topic({
        ros: ros,
        name: "/my_topic",
        messageType: "std_msgs/String",
      });

      listener.subscribe((message) => {
        console.log(message);
      });

      return () => listener.unsubscribe();
    }
  }, [ros, status]);
}
```

## Configuration Options

The component supports all roslibjs configuration options:

- **WebSocket URL**: The rosbridge server URL (default: `ws://localhost:9090`)
- **Transport Library**: Choose between `websocket`, `workersocket`, or `socket.io`
- **Groovy Compatibility**: Enable for older rosbridge versions (pre-Hydro)
- **Auto Reconnect**: Automatically reconnect on connection loss
- **Reconnect Interval**: Time in milliseconds between reconnection attempts

## Store API

### State

- `ros`: The ROSLIB.Ros instance
- `status`: Current connection status (`'disconnected' | 'connecting' | 'connected' | 'error'`)
- `errorMessage`: Error message if connection failed
- `config`: Current connection configuration

### Actions

- `setConfig(config)`: Update connection configuration
- `connect()`: Initiate connection to ROS
- `disconnect()`: Close the connection
- `resetError()`: Clear error messages

## Styling

The component uses:

- Tailwind CSS for styling
- Shadcn UI components (Card, Button, Input, Switch, Badge, etc.)
- Light pastel gradient backgrounds
- Smooth animations and transitions

## Dependencies

- `roslib`: ^1.4.1
- `zustand`: ^5.0.8
- `@radix-ui/*`: Various UI components
- `lucide-react`: Icons
