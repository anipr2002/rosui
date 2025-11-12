import { Layout, Grid3x3, Columns, Rows3 } from "lucide-react";

import type { LayoutConfig, LayoutType } from "./types";

// Layout configurations
export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  single: {
    name: "Single Column",
    icon: Layout,
    cols: 1,
    description: "1 column",
  },
  twoColumn: {
    name: "Two Columns",
    icon: Columns,
    cols: 2,
    description: "2 columns",
  },
  threeColumn: {
    name: "Three Columns",
    icon: Grid3x3,
    cols: 3,
    description: "3 columns",
  },
  fourColumn: {
    name: "Four Columns",
    icon: Rows3,
    cols: 4,
    description: "4 columns",
  },
};

export const PANEL_TYPES = [
  "Audio Panel",
  "Gauge Panel",
  "Image Panel",
  "Indicator Panel",
  "Map Panel",
  "Markdown Panel",
  "Parameters Panel",
  "Plot Panel",
  "Publish Panel",
  "Raw Messages Panel",
  "Service Call Panel",
  "State Transitions Panel",
  "Table Panel",
  "Teleop Panel",
  "Transform Tree Panel",
  "Variable Slider Panel",
];

export const PANEL_COLORS = [
  "bg-blue-50",
  "bg-green-50",
  "bg-purple-50",
  "bg-amber-50",
  "bg-pink-50",
  "bg-teal-50",
];
