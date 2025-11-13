export interface Panel {
  id: string;
  color: string;
  colspan: number;
  rowspan: number;
  panelType: string;
}

export interface LayoutConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  cols: number;
  description: string;
}

export type LayoutType = "single" | "twoColumn" | "threeColumn" | "fourColumn";

export interface PanelTypeInfo {
  name: string;
  component?: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

export interface DashboardPage {
  id: string;
  name: string;
  panels: Panel[];
  layout: LayoutType;
  createdAt: number;
}
