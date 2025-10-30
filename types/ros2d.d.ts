/**
 * Type definitions for ros2d library
 */

declare namespace ROS2D {
  interface ViewerOptions {
    divID: string
    width: number
    height: number
    background?: string
  }

  interface OccupancyGridClientOptions {
    ros: ROSLIB.Ros
    topic?: string
    rootObject?: createjs.Container
    continuous?: boolean
  }

  interface OccupancyGridOptions {
    message: ROSLIB.Message
  }

  interface GridOptions {
    size?: number
  }

  interface NavigationArrowOptions {
    size?: number
    strokeSize?: number
    fillColor?: string
    strokeColor?: string
    pulse?: boolean
  }

  interface PathShapeOptions {
    strokeSize?: number
    strokeColor?: string
  }

  interface PanViewOptions {
    ros: ROSLIB.Ros
    tfClient: any
    rootObject: createjs.Container
    width?: number
    height?: number
    background?: string
  }

  interface ZoomViewOptions {
    ros: ROSLIB.Ros
    tfClient: any
    rootObject: createjs.Container
    width?: number
    height?: number
    background?: string
  }

  class Viewer {
    width: number
    height: number
    scene: createjs.Stage

    constructor(options: ViewerOptions)
    addObject(object: createjs.DisplayObject): void
    scaleToDimensions(width: number, height: number): void
    shift(x: number, y: number): void
  }

  class OccupancyGridClient extends EventEmitter2 {
    currentGrid: createjs.Shape
    rootObject: createjs.Container
    continuous: boolean

    constructor(options: OccupancyGridClientOptions)
    on(event: 'change', callback: () => void): this
  }

  class OccupancyGrid extends createjs.Shape {
    constructor(options: OccupancyGridOptions)
  }

  class Grid extends createjs.Shape {
    constructor(options?: GridOptions)
  }

  class NavigationArrow extends createjs.Container {
    constructor(options?: NavigationArrowOptions)
  }

  class PathShape extends createjs.Shape {
    constructor(options?: PathShapeOptions)
  }

  class ArrowShape extends createjs.Container {
    constructor(options?: any)
  }

  class PolygonShape extends createjs.Shape {
    constructor(options?: any)
  }

  class TraceShape extends createjs.Shape {
    constructor(options?: any)
  }

  class ImageMap extends createjs.Container {
    constructor(options?: any)
  }

  class ImageMapClient extends EventEmitter2 {
    constructor(options?: any)
    on(event: 'change', callback: () => void): this
  }

  class OccupancyGridSrvClient extends EventEmitter2 {
    constructor(options?: any)
    on(event: 'change', callback: () => void): this
  }

  class PanView extends Viewer {
    constructor(options: PanViewOptions)
  }

  class ZoomView extends Viewer {
    constructor(options: ZoomViewOptions)
  }

  const REVISION: string
}

declare module 'ros2d' {
  export = ROS2D
}

