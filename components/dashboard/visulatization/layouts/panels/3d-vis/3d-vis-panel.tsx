"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Panel } from "../../core/types";
import { Viewer3D } from "@/components/dashboard/visulatization/3d-vis/viewer-3d";
import { Vis3DSettings } from "./vis-3d-settings";


interface Vis3DPanelProps {
  panel: Panel;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  onDelete?: (id: string) => void;
}

export function Vis3DPanel({ panel, onUpdatePanel, onDelete }: Vis3DPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(panel.id);
    }
  };

  return (
    <div className="relative h-full w-full group" ref={containerRef}>
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <Vis3DSettings />

        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
            title="Delete Panel"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="h-full w-full overflow-hidden rounded-lg">
        <Viewer3D width={dimensions.width} height={dimensions.height} />
      </div>
    </div>
  );
}
