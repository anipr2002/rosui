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

export const ROW_HEIGHT = 20;
export const MIN_ROWSPAN = 12; // 12 * 20px = 240px minimum height
