import React from "react";
import type { PanelTypeInfo } from "./types";

class PanelRegistry {
  private panels = new Map<string, PanelTypeInfo>();

  register(panelType: string, info: PanelTypeInfo) {
    this.panels.set(panelType, info);
  }

  get(panelType: string): PanelTypeInfo | undefined {
    return this.panels.get(panelType);
  }

  getAll(): string[] {
    return Array.from(this.panels.keys());
  }

  renderPanel(panelType: string, props: any = {}) {
    const panelInfo = this.get(panelType);
    if (!panelInfo?.component) {
      return this.renderDefaultPanel(panelType, props);
    }

    const PanelComponent = panelInfo.component;
    return <PanelComponent {...props} {...panelInfo.defaultProps} />;
  }

  private renderDefaultPanel(panelType: string, props: any) {
    if (panelType === "Default") {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 pointer-events-none">
          <div className="animate-pulse flex flex-col items-center space-y-3">
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-400">
              Right-click to select panel type
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 pointer-events-none">
        <span className="text-sm font-medium text-gray-600">
          {panelType}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {props.colspan}×{props.rowspan}
        </span>
      </div>
    );
  }
}

export const panelRegistry = new PanelRegistry();

// Register default placeholder panel
panelRegistry.register("Default", {
  name: "Default Panel",
  component: undefined, // Uses default renderer
});
