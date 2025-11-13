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

import { SortablePanel } from "./sortable-panel";
import type { Panel } from "./types";

interface PanelGridProps {
  panels: Panel[];
  maxCols: number;
  onPanelsChange: (panels: Panel[]) => void;
  onDeletePanel: (id: string) => void;
  onResizePanel: (id: string, colspan: number, rowspan: number) => void;
  onChangePanelType: (id: string, panelType: string) => void;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
}

const PanelGrid = React.memo<PanelGridProps>(
  ({
    panels,
    maxCols,
    onPanelsChange,
    onDeletePanel,
    onResizePanel,
    onChangePanelType,
    onUpdatePanel,
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

    // Create stable panel keys including config hash to force re-render only when needed
    const panelKeys = useMemo(() => {
      return panels.map(
        (p) => `${p.id}-${p.panelType}-${p.colspan}-${p.rowspan}`
      );
    }, [panels]);

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
            className="grid gap-2 auto-rows-fr"
            style={{
              gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            }}
          >
            {panels.map((panel) => (
              <SortablePanel
                key={panel.id}
                panel={panel}
                onDelete={onDeletePanel}
                onResize={onResizePanel}
                onChangePanelType={onChangePanelType}
                onUpdatePanel={onUpdatePanel}
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
    // Re-render only if panels array length or individual panels changed
    if (prevProps.panels.length !== nextProps.panels.length) {
      return false;
    }

    if (prevProps.maxCols !== nextProps.maxCols) {
      return false;
    }

    // Check if callback references changed (they should be stable with useCallback)
    if (
      prevProps.onPanelsChange !== nextProps.onPanelsChange ||
      prevProps.onDeletePanel !== nextProps.onDeletePanel ||
      prevProps.onResizePanel !== nextProps.onResizePanel ||
      prevProps.onChangePanelType !== nextProps.onChangePanelType ||
      prevProps.onUpdatePanel !== nextProps.onUpdatePanel
    ) {
      return false;
    }

    // Deep comparison of panels - check if any panel changed
    for (let i = 0; i < prevProps.panels.length; i++) {
      const prevPanel = prevProps.panels[i];
      const nextPanel = nextProps.panels[i];

      if (
        prevPanel.id !== nextPanel.id ||
        prevPanel.panelType !== nextPanel.panelType ||
        prevPanel.colspan !== nextPanel.colspan ||
        prevPanel.rowspan !== nextPanel.rowspan ||
        prevPanel.color !== nextPanel.color ||
        JSON.stringify(prevPanel.config) !== JSON.stringify(nextPanel.config)
      ) {
        return false;
      }
    }

    return true;
  }
);

PanelGrid.displayName = "PanelGrid";

export { PanelGrid };
