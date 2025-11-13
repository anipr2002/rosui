"use client";
import React, { useCallback, useMemo } from "react";

import { PageTabs } from "./page-tabs";
import { PanelGrid } from "./panel-grid";
import { LAYOUTS, PANEL_COLORS } from "./constants";
import { useDashboardPagesStore } from "@/store/dashboard-pages-store";
import { Plus } from "lucide-react";
import type { Panel } from "./types";

export default function PanelLayoutManager() {
  const { 
    pages,
    activePageId,
    updatePagePanels
  } = useDashboardPagesStore();
  
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
    <div className="w-full mx-auto py-4 px-4 relative">
      <PageTabs />

      <PanelGrid
        panels={panels}
        maxCols={maxCols}
        onPanelsChange={handlePanelsChange}
        onDeletePanel={handleDeletePanel}
        onResizePanel={handleResizePanel}
        onChangePanelType={handleChangePanelType}
      />

      {/* Floating Add Panel Button */}
      <button
        onClick={handleAddPanel}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 z-50"
        title="Add Panel"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
