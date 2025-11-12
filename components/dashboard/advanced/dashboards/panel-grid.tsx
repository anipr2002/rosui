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
}

const PanelGrid = React.memo<PanelGridProps>(
  ({
    panels,
    maxCols,
    onPanelsChange,
    onDeletePanel,
    onResizePanel,
    onChangePanelType,
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
                maxCols={maxCols}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }
);

PanelGrid.displayName = "PanelGrid";

export { PanelGrid };
