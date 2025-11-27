"use client"

import React, { useMemo, useId } from "react";
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
import { ROW_HEIGHT } from "./constants";
import { cn } from "@/lib/utils";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import Lottie from "lottie-react";
import panelSkeletonAnimation from "@/public/lottie/panel-skeleton.json";

import { SortablePanel } from "./sortable-panel";
import type { PanelConfig } from "@/store/panels-store";

interface PanelGridProps {
  panels: PanelConfig[];
  maxCols: number;
  onPanelsChange: (panels: PanelConfig[]) => void;
  onDeletePanel: (id: string) => void;
  onResizePanel: (id: string, colspan: number, rowspan: number) => void;
}

const CONTENT_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.4 } },
};

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

    const titleId = useId();
    const descriptionId = useId();

    if (panels.length === 0) {
      return (
        <LazyMotion features={domAnimation}>
          <motion.section
            role="region"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
              "group relative flex min-h-[400px] flex-col items-center justify-center rounded-xl p-8 transition-all duration-300 overflow-hidden",
              "border-dashed border-2",
              "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50"
            )}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            {/* Animated background particles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              <motion.div
                className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-blue-400/5 blur-3xl"
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-indigo-400/5 blur-3xl"
                animate={{
                  y: [0, 15, 0],
                  x: [0, -10, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Dot grid background on hover */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgb(156 163 175 / 0.15) 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Lottie animation */}
              <div className="w-[400px] h-fit">
                <Lottie
                  animationData={panelSkeletonAnimation}
                  loop={true}
                  autoplay={true}
                />
              </div>

              {/* Title and description */}
              <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-8">
                <h2
                  id={titleId}
                  className="text-xl font-semibold transition-colors duration-300 text-gray-900"
                >
                  No Panels Yet
                </h2>
                <p id={descriptionId} className="text-sm text-gray-500 max-w-sm leading-relaxed">
                  Click "Add Panel" to create your first visualization panel
                </p>
              </motion.div>

              {/* Helper text */}
              <motion.p
                variants={CONTENT_VARIANTS}
                className="mt-6 text-xs text-gray-400"
              >
                Customize your dashboard with various panel types
              </motion.p>
            </div>
          </motion.section>
        </LazyMotion>
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
