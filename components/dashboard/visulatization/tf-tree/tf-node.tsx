"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import {
  getFreshnessColor,
  getFreshnessLabel,
} from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function TFNode({ data, selected }: NodeProps<TFNodeData>) {
  const freshnessColor = getFreshnessColor(data.age);
  const freshnessLabel = getFreshnessLabel(data.age);

  const getBorderColor = () => {
    if (data.isRoot) return "border-blue-400";
    if (data.isStatic) return "border-gray-300";
    return "border-gray-200";
  };

  const getHeaderBg = () => {
    if (data.isRoot) return "bg-blue-50";
    if (data.isStatic) return "bg-gray-50";
    return "bg-white";
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={`rounded-xl border-2 ${getBorderColor()} ${getHeaderBg()} shadow-sm min-w-[180px] cursor-pointer ${
              selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
            }`}
          >
            <Handle
              type="target"
              position={Position.Top}
              className="w-2 h-2 bg-blue-500"
            />

            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-semibold text-sm text-gray-900 break-all flex-1">
                  {data.frame}
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: freshnessColor }}
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {data.isRoot && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                  >
                    Root
                  </Badge>
                )}
                {data.isStatic && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                  >
                    Static
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: `${freshnessColor}20`,
                    color: freshnessColor,
                    borderColor: freshnessColor,
                  }}
                >
                  {freshnessLabel}
                </Badge>
              </div>
            </div>

            <Handle
              type="source"
              position={Position.Bottom}
              className="w-2 h-2 bg-blue-500"
            />
          </div>
        </TooltipTrigger>

        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b pb-1">
              {data.frame}
            </div>

            {data.transform && (
              <>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    Translation
                  </div>
                  <div className="text-xs font-mono space-y-0.5">
                    <div>x: {data.transform.translation.x.toFixed(4)}</div>
                    <div>y: {data.transform.translation.y.toFixed(4)}</div>
                    <div>z: {data.transform.translation.z.toFixed(4)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    Rotation (quaternion)
                  </div>
                  <div className="text-xs font-mono space-y-0.5">
                    <div>x: {data.transform.rotation.x.toFixed(4)}</div>
                    <div>y: {data.transform.rotation.y.toFixed(4)}</div>
                    <div>z: {data.transform.rotation.z.toFixed(4)}</div>
                    <div>w: {data.transform.rotation.w.toFixed(4)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500">
                    Parent Frame
                  </div>
                  <div className="text-xs font-mono">
                    {data.transform.parent}
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="text-xs font-medium text-gray-500">Age</div>
              <div className="text-xs">{(data.age / 1000).toFixed(2)}s ago</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default memo(TFNode);
