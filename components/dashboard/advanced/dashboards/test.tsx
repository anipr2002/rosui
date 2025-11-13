"use client";
import React, { useState, useCallback, useMemo } from "react";

import { PageTabs } from "./page-tabs";
import { LayoutControls } from "./layout-controls";
import { PanelGrid } from "./panel-grid";
import { LAYOUTS, PANEL_COLORS } from "./constants";
import { useDashboardPagesStore } from "@/store/dashboard-pages-store";
import type { Panel, LayoutType } from "./types";

export default function PanelLayoutManager() {
  const { 
    pages,
    activePageId,
    updatePagePanels, 
    updatePageLayout
  } = useDashboardPagesStore();
  
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  
  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || null,
    [pages, activePageId]
  );
  const panels = activePage?.panels || [];
  const currentLayout = activePage?.layout || 'threeColumn';
  
  // Generate next panel ID based on existing panels
  const getNextPanelId = useCallback(() => {
    if (!activePage) return '1';
    const existingIds = activePage.panels.map((p) => parseInt(p.id)).filter((id) => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return String(maxId + 1);
  }, [activePage]);

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    if (activePage) {
      updatePageLayout(activePage.id, layout);
    }
  }, [activePage, updatePageLayout]);

  const handleToggleControls = useCallback(() => {
    setIsControlsOpen((prev) => !prev);
  }, []);

  const handleAddPanel = useCallback(() => {
    if (!activePage) return;
    
    const randomColor =
      PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];
    const newPanel: Panel = {
      id: getNextPanelId(),
      color: randomColor,
      colspan: 1,
      rowspan: 1,
      panelType: "Default",
    };
    updatePagePanels(activePage.id, [...activePage.panels, newPanel]);
  }, [activePage, getNextPanelId, updatePagePanels]);

  const handleDeletePanel = useCallback((id: string) => {
    if (!activePage) return;
    updatePagePanels(
      activePage.id,
      activePage.panels.filter((panel) => panel.id !== id)
    );
  }, [activePage, updatePagePanels]);

  const handleResizePanel = useCallback(
    (id: string, colspan: number, rowspan: number) => {
      if (!activePage) return;
      updatePagePanels(
        activePage.id,
        activePage.panels.map((panel) =>
          panel.id === id ? { ...panel, colspan, rowspan } : panel
        )
      );
    },
    [activePage, updatePagePanels]
  );

  const handleChangePanelType = useCallback((id: string, panelType: string) => {
    if (!activePage) return;
    updatePagePanels(
      activePage.id,
      activePage.panels.map((panel) =>
        panel.id === id ? { ...panel, panelType } : panel
      )
    );
  }, [activePage, updatePagePanels]);

  const handlePanelsChange = useCallback((newPanels: Panel[]) => {
    if (!activePage) return;
    updatePagePanels(activePage.id, newPanels);
  }, [activePage, updatePagePanels]);

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

      <PageTabs />

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
