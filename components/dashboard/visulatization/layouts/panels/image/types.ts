// Image encoding types supported by ROS
export type RawImageEncoding =
  | "8UC1"
  | "8UC3"
  | "16UC1"
  | "32FC1"
  | "bayer_bggr8"
  | "bayer_gbrg8"
  | "bayer_grbg8"
  | "bayer_rggb8"
  | "bgr8"
  | "bgra8"
  | "mono8"
  | "mono16"
  | "rgb8"
  | "rgba8"
  | "uyvy"
  | "yuv422"
  | "yuyv"
  | "yuv422_yuy2";

export type CompressedImageFormat = "webp" | "jpeg" | "jpg" | "png" | "avif";

export type ColorMode = "raw" | "colormap" | "gradient";

export type ColorMapType = "turbo" | "rainbow";

export type RotationAngle = 0 | 90 | 180 | 270;

// ROS message types
export interface RawImageMessage {
  header: {
    seq?: number;
    stamp: {
      secs: number;
      nsecs: number;
    };
    frame_id: string;
  };
  height: number;
  width: number;
  encoding: string;
  is_bigendian: number;
  step: number;
  data: number[] | Uint8Array;
}

export interface CompressedImageMessage {
  header: {
    seq?: number;
    stamp: {
      secs: number;
      nsecs: number;
    };
    frame_id: string;
  };
  format: string;
  data: number[] | Uint8Array;
}

export interface CameraInfoMessage {
  header: {
    seq?: number;
    stamp: {
      secs: number;
      nsecs: number;
    };
    frame_id: string;
  };
  height: number;
  width: number;
  distortion_model: string;
  D: number[];
  K: number[];
  R: number[];
  P: number[];
  binning_x: number;
  binning_y: number;
  roi: {
    x_offset: number;
    y_offset: number;
    height: number;
    width: number;
    do_rectify: boolean;
  };
}

export interface ImageMarkerMessage {
  header: {
    seq?: number;
    stamp: {
      secs: number;
      nsecs: number;
    };
    frame_id: string;
  };
  ns: string;
  id: number;
  type: number; // 0=CIRCLE, 1=LINE_STRIP, 2=LINE_LIST, 3=POLYGON, 4=POINTS, 5=TEXT_VIEW_FACING
  action: number; // 0=ADD, 1=REMOVE
  position: {
    x: number;
    y: number;
  };
  scale: number;
  outline_color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  filled: number;
  fill_color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  lifetime: {
    secs: number;
    nsecs: number;
  };
  points?: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  outline_colors?: Array<{
    r: number;
    g: number;
    b: number;
    a: number;
  }>;
  text?: string;
}

// Decoded image data
export interface DecodedImage {
  width: number;
  height: number;
  data: Uint8ClampedArray<ArrayBuffer>; // RGBA format
  encoding: string;
}

// Transform state
export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// Panel configuration
export interface ImagePanelConfig {
  // Image topic
  imageTopic?: string;

  // Calibration
  calibrationTopic?: string;

  // Annotation topics
  annotationTopics?: string[];

  // Transform settings
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotation?: RotationAngle;

  // Color mode for depth images
  colorMode?: ColorMode;
  colorMap?: ColorMapType;
  gradientColors?: {
    min: string;
    max: string;
  };

  // Value range for depth images
  valueMin?: number;
  valueMax?: number;

  // Zoom/pan state (persisted)
  transform?: ImageTransform;
}

// Annotation types enum (matches visualization_msgs/ImageMarker)
export enum ImageMarkerType {
  CIRCLE = 0,
  LINE_STRIP = 1,
  LINE_LIST = 2,
  POLYGON = 3,
  POINTS = 4,
  TEXT_VIEW_FACING = 5,
}

export enum ImageMarkerAction {
  ADD = 0,
  REMOVE = 1,
}
