// Main component
export { default as PanelLayoutManager } from "./test";

// Core components
export { PageTabs } from "./page-tabs";
export { LayoutControls } from "./layout-controls";
export { PanelGrid } from "./panel-grid";
export { SortablePanel } from "./sortable-panel";

// Registry system
export { panelRegistry } from "./panel-registry";

// Types and constants
export type { Panel, LayoutType, LayoutConfig, PanelTypeInfo, DashboardPage } from "./types";
export { LAYOUTS, PANEL_TYPES, PANEL_COLORS } from "./constants";
