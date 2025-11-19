import React, { useCallback } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Gauge,
  Lightbulb,
  FileText,
  Activity,
} from "lucide-react";

import { LAYOUTS } from "./constants";
import type { LayoutType } from "./types";

interface LayoutControlsProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onAddPanel: (type: string) => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
}

const LayoutControls = React.memo<LayoutControlsProps>(
  ({
    currentLayout,
    onLayoutChange,
    onAddPanel,
    isControlsOpen,
    onToggleControls,
  }) => {
    const handleLayoutChange = useCallback(
      (layoutKey: string) => {
        onLayoutChange(layoutKey as LayoutType);
      },
      [onLayoutChange]
    );

    return (
      <div className="bg-white border rounded-xl shadow-none pt-0 mt-4">
        <button
          onClick={onToggleControls}
          className="w-full bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6 px-6 pb-4 flex items-center justify-between hover:bg-indigo-100 transition-colors"
        >
          <h2 className="text-base font-semibold text-indigo-900">
            Layout Controls
          </h2>
          {isControlsOpen ? (
            <ChevronDown className="h-5 w-5 text-indigo-700" />
          ) : (
            <ChevronRight className="h-5 w-5 text-indigo-700" />
          )}
        </button>

        {isControlsOpen && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              {/* Layout Selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(LAYOUTS).map(([key, layout]) => {
                  const Icon = layout.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleLayoutChange(key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        currentLayout === key
                          ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs font-medium">{layout.name}</div>
                        <div className="text-xs opacity-70">
                          {layout.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full md:w-auto bg-indigo-200 border-indigo-500 border text-indigo-500 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Panel
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => onAddPanel("plot")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Plot Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddPanel("gauge")}>
                    <Gauge className="h-4 w-4 mr-2" />
                    Gauge Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddPanel("indicator")}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Indicator Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddPanel("raw-topic-viewer")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Raw Topic Viewer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddPanel("diagnostics")}>
                    <Activity className="h-4 w-4 mr-2" />
                    Diagnostics Panel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    );
  }
);

LayoutControls.displayName = "LayoutControls";

export { LayoutControls };
