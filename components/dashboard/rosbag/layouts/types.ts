import type { PanelConfig } from "@/store/panels-store";

export interface LayoutConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  cols: number;
  description: string;
}

export type LayoutType = "single" | "twoColumn" | "threeColumn" | "fourColumn";

export interface DashboardPage {
  id: string;
  name: string;
  panels: PanelConfig[];
  layout: LayoutType;
  createdAt: number;
}
