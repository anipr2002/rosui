/**
 * Type definitions for nav2d library (extending existing definitions)
 * This adds ROS-specific navigation types that combine nav2d with ros2d
 */

declare namespace NAV2D {
  interface OccupancyGridClientNavOptions {
    ros: ROSLIB.Ros
    rootObject: createjs.Container
    viewer: ROS2D.Viewer
    serverName?: string
    topic?: string
    actionName?: string
  }

  class OccupancyGridClientNav extends EventEmitter2 {
    constructor(options: OccupancyGridClientNavOptions)
    
    // Navigation methods
    onGoalClick(event: MouseEvent): void
    cancelGoal(): void
    on(event: string, callback: (...args: any[]) => void): this
    
    // Properties
    currentGoal: any | null
    actionClient: ROSLIB.ActionClient | null
  }
}

declare module 'nav2d' {
  export * from 'nav2d/src/index'
}

