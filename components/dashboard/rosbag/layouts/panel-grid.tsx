import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Layout } from "lucide-react";
import { ROW_HEIGHT } from "./constants";

import { SortablePanel } from "./sortable-panel";
import type { PanelConfig } from "@/store/panels-store";

interface PanelGridProps {
  panels: PanelConfig[];
  maxCols: number;
  onPanelsChange: (panels: PanelConfig[]) => void;
  onDeletePanel: (id: string) => void;
  onResizePanel: (id: string, colspan: number, rowspan: number) => void;
}

const PanelGrid = React.memo<PanelGridProps>(
  ({
    panels,
    maxCols,
    onPanelsChange,
    onDeletePanel,
    onResizePanel,
  }) => {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleDragEnd = React.useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
          const oldIndex = panels.findIndex((item) => item.id === active.id);
          const newIndex = panels.findIndex((item) => item.id === over.id);
          const newPanels = arrayMove(panels, oldIndex, newIndex);
          onPanelsChange(newPanels);
        }
      },
      [panels, onPanelsChange]
    );

    // Stable panel IDs to prevent SortableContext re-renders
    const panelIds = useMemo(() => panels.map((p) => p.id), [panels]);

    if (panels.length === 0) {
      return (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <Layout className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            No panels yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Click "Add Panel" to create your first panel
          </p>
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={panelIds} strategy={rectSortingStrategy}>
          <div
            className="grid gap-2 auto-rows-auto"
            style={{
              gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
              gridAutoRows: `${ROW_HEIGHT}px`,
            }}
          >
            {panels.map((panel) => (
              <SortablePanel
                key={panel.id}
                panel={panel}
                onDelete={onDeletePanel}
                onResize={onResizePanel}
                maxCols={maxCols}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    if (prevProps.panels.length !== nextProps.panels.length) {
      return false;
    }

    if (prevProps.maxCols !== nextProps.maxCols) {
      return false;
    }

    // Deep comparison of panels - check if any panel changed
    for (let i = 0; i < prevProps.panels.length; i++) {
      const prevPanel = prevProps.panels[i];
      const nextPanel = nextProps.panels[i];

      if (
        prevPanel.id !== nextPanel.id ||
        prevPanel.type !== nextPanel.type ||
        prevPanel.colspan !== nextPanel.colspan ||
        prevPanel.rowspan !== nextPanel.rowspan ||
        prevPanel.color !== nextPanel.color ||
        // We might need deeper comparison if config changes matter for grid layout
        // But for layout purposes, mostly dimensions matter.
        // However, if content changes, we want to re-render.
        // Since PanelConfig is immutable in store updates, reference equality check in SortablePanel might be enough?
        // But here we are comparing props for PanelGrid.
        // Let's just return false if any prop is different to be safe.
        prevPanel !== nextPanel
      ) {
        return false;
      }
    }

    return true;
  }
);

PanelGrid.displayName = "PanelGrid";

export { PanelGrid };
