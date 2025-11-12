"use client";
import React, { useState, useCallback } from "react";

import { LayoutControls } from "./layout-controls";
import { PanelGrid } from "./panel-grid";
import { LAYOUTS, PANEL_COLORS } from "./constants";
import type { Panel, LayoutType } from "./types";

export default function PanelLayoutManager() {
  const [panels, setPanels] = useState<Panel[]>([
    {
      id: "1",
      color: "bg-blue-50",
      colspan: 1,
      rowspan: 1,
      panelType: "Default",
    },
    {
      id: "2",
      color: "bg-green-50",
      colspan: 1,
      rowspan: 1,
      panelType: "Default",
    },
    {
      id: "3",
      color: "bg-purple-50",
      colspan: 1,
      rowspan: 1,
      panelType: "Default",
    },
  ]);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>("threeColumn");
  const [nextId, setNextId] = useState(4);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setCurrentLayout(layout);
  }, []);

  const handleToggleControls = useCallback(() => {
    setIsControlsOpen((prev) => !prev);
  }, []);

  const handleAddPanel = useCallback(() => {
    const randomColor =
      PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];
    setPanels((prevPanels) => [
      ...prevPanels,
      {
        id: String(nextId),
        color: randomColor,
        colspan: 1,
        rowspan: 1,
        panelType: "Default",
      },
    ]);
    setNextId((prev) => prev + 1);
  }, [nextId]);

  const handleDeletePanel = useCallback((id: string) => {
    setPanels((prevPanels) => prevPanels.filter((panel) => panel.id !== id));
  }, []);

  const handleResizePanel = useCallback(
    (id: string, colspan: number, rowspan: number) => {
      setPanels((prevPanels) =>
        prevPanels.map((panel) =>
          panel.id === id ? { ...panel, colspan, rowspan } : panel
        )
      );
    },
    []
  );

  const handleChangePanelType = useCallback((id: string, panelType: string) => {
    setPanels((prevPanels) =>
      prevPanels.map((panel) =>
        panel.id === id ? { ...panel, panelType } : panel
      )
    );
  }, []);

  const handlePanelsChange = useCallback((newPanels: Panel[]) => {
    setPanels(newPanels);
  }, []);

  const maxCols = LAYOUTS[currentLayout].cols;

  return (
    <div className="w-full mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Panel Layout Manager
        </h1>
        <p className="text-muted-foreground mt-2">
          Create, arrange, resize, and organize panels with drag and drop
        </p>
      </div>

      <LayoutControls
        currentLayout={currentLayout}
        onLayoutChange={handleLayoutChange}
        onAddPanel={handleAddPanel}
        isControlsOpen={isControlsOpen}
        onToggleControls={handleToggleControls}
      />

      <PanelGrid
        panels={panels}
        maxCols={maxCols}
        onPanelsChange={handlePanelsChange}
        onDeletePanel={handleDeletePanel}
        onResizePanel={handleResizePanel}
        onChangePanelType={handleChangePanelType}
      />
    </div>
  );
}
