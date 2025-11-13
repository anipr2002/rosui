import React, { useState, useRef, useCallback, useMemo } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { panelRegistry } from "./panel-registry";
import { PANEL_TYPES } from "./constants";
import type { Panel } from "./types";

// Memoized context menu component
const PanelContextMenu = React.memo<{
  children: React.ReactNode;
  onChangePanelType: (panelType: string) => void;
}>(({ children, onChangePanelType }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {PANEL_TYPES.map((panelType) => (
          <ContextMenuItem
            key={panelType}
            onClick={() => onChangePanelType(panelType)}
          >
            {panelType}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
});

PanelContextMenu.displayName = "PanelContextMenu";

interface SortablePanelProps {
  panel: Panel;
  onDelete: (id: string) => void;
  onResize: (id: string, colspan: number, rowspan: number) => void;
  onChangePanelType: (id: string, panelType: string) => void;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  maxCols: number;
}

// Custom comparison function for SortablePanel
const arePropsEqual = (
  prevProps: SortablePanelProps,
  nextProps: SortablePanelProps
) => {
  // Deep comparison for panel to prevent unnecessary re-renders
  return (
    prevProps.panel.id === nextProps.panel.id &&
    prevProps.panel.panelType === nextProps.panel.panelType &&
    prevProps.panel.colspan === nextProps.panel.colspan &&
    prevProps.panel.rowspan === nextProps.panel.rowspan &&
    prevProps.panel.color === nextProps.panel.color &&
    JSON.stringify(prevProps.panel.config) === JSON.stringify(nextProps.panel.config) &&
    prevProps.maxCols === nextProps.maxCols &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onResize === nextProps.onResize &&
    prevProps.onChangePanelType === nextProps.onChangePanelType &&
    prevProps.onUpdatePanel === nextProps.onUpdatePanel
  );
};

const SortablePanel = React.memo<SortablePanelProps>(
  ({
    panel,
    onDelete,
    onResize,
    onChangePanelType,
    onUpdatePanel,
    maxCols,
  }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [resizeEdge, setResizeEdge] = useState<
      "right" | "bottom" | "corner" | null
    >(null);
    const startPosRef = useRef({ x: 0, y: 0, colspan: 0, rowspan: 0 });

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: panel.id });

    const canIncreaseColspan = panel.colspan < maxCols;
    const canIncreaseRowspan = panel.rowspan < 3;
    const canShowCornerResize = canIncreaseColspan && canIncreaseRowspan;

    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition: isResizing ? "none" : transition,
        opacity: isDragging ? 0.5 : 1,
        gridColumn: `span ${panel.colspan}`,
        gridRow: `span ${panel.rowspan}`,
      }),
      [
        transform,
        transition,
        isResizing,
        isDragging,
        panel.colspan,
        panel.rowspan,
      ]
    );

    const handleResizeStart = useCallback(
      (e: React.MouseEvent, edge: "right" | "bottom" | "corner") => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeEdge(edge);
        startPosRef.current = {
          x: e.clientX,
          y: e.clientY,
          colspan: panel.colspan,
          rowspan: panel.rowspan,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startPosRef.current.x;
          const deltaY = moveEvent.clientY - startPosRef.current.y;

          // Approximate: every ~200px = 1 column/row
          const colDelta = Math.round(deltaX / 200);
          const rowDelta = Math.round(deltaY / 200);

          let newColspan = startPosRef.current.colspan;
          let newRowspan = startPosRef.current.rowspan;

          if (edge === "right" || edge === "corner") {
            newColspan = Math.max(
              1,
              Math.min(maxCols, startPosRef.current.colspan + colDelta)
            );
          }
          if (edge === "bottom" || edge === "corner") {
            newRowspan = Math.max(
              1,
              Math.min(3, startPosRef.current.rowspan + rowDelta)
            );
          }

          if (newColspan !== panel.colspan || newRowspan !== panel.rowspan) {
            onResize(panel.id, newColspan, newRowspan);
          }
        };

        const handleMouseUp = () => {
          setIsResizing(false);
          setResizeEdge(null);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [panel.colspan, panel.rowspan, panel.id, maxCols, onResize]
    );

    const handleDelete = useCallback(() => {
      onDelete(panel.id);
    }, [onDelete, panel.id]);

    const handleChangePanelType = useCallback(
      (panelType: string) => {
        onChangePanelType(panel.id, panelType);
      },
      [onChangePanelType, panel.id]
    );

    const panelContent = useMemo(() => {
      return panelRegistry.renderPanel(panel.panelType, {
        panel,
        onUpdatePanel,
        onDelete: handleDelete,
        colspan: panel.colspan,
        rowspan: panel.rowspan,
      });
    }, [panel, onUpdatePanel, handleDelete]);

    return (
      <PanelContextMenu onChangePanelType={handleChangePanelType}>
        <div
          ref={setNodeRef}
          style={style}
          className={`${panel.color} border-2 rounded-xl shadow-none min-h-[250px] relative group ${
            isDragging ? "ring-2 ring-indigo-500 ring-offset-2" : ""
          } ${isResizing ? "ring-2 ring-blue-400" : ""}`}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onContextMenu={(e) => e.preventDefault()}
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm z-10"
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>

          {/* Right Edge Resize Handle */}
          {canIncreaseColspan && (
            <div
              onMouseDown={(e) => handleResizeStart(e, "right")}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute top-0 right-0 w-2 h-full rounded-full cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50 z-20"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5))",
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-l" />
            </div>
          )}

          {/* Bottom Edge Resize Handle */}
          {canIncreaseRowspan && (
            <div
              onMouseDown={(e) => handleResizeStart(e, "bottom")}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute bottom-0 left-0 h-2 w-full cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50 z-20"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5))",
              }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-blue-500 rounded-t" />
            </div>
          )}

          {/* Corner Resize Handle */}
          {canShowCornerResize && (
            <div
              onMouseDown={(e) => handleResizeStart(e, "corner")}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50 z-30"
            >
              <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-blue-500 rounded-br" />
            </div>
          )}

          {/* Panel Content */}
          {panelContent}
        </div>
      </PanelContextMenu>
    );
  },
  arePropsEqual
);

SortablePanel.displayName = "SortablePanel";

export { SortablePanel };
