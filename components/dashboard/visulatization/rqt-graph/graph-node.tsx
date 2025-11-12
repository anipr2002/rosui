"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { RQTNodeData } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import {
  getNodeTypeColor,
  getNodeTypeLabel,
} from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function GraphNode({ data, selected }: NodeProps<RQTNodeData>) {
  if (!data.nodeInfo) return null;

  const nodeInfo = data.nodeInfo;
  const typeColor = getNodeTypeColor(nodeInfo);
  const typeLabel = getNodeTypeLabel(nodeInfo);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`rounded-lg border-2 bg-white shadow-sm ${
              selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
            }`}
            style={{
              borderColor: typeColor,
              minWidth: "220px",
              maxWidth: "220px",
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3"
              style={{ background: typeColor }}
            />

            <div className="px-3 py-2">
              <div className="font-medium text-xs text-gray-900 truncate text-center">
                {nodeInfo.name}
              </div>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3"
              style={{ background: typeColor }}
            />
          </div>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b pb-1">
              {nodeInfo.name}
            </div>

            {nodeInfo.publishedTopics.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Published Topics ({nodeInfo.publishedTopics.length})
                </div>
                <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                  {nodeInfo.publishedTopics.slice(0, 5).map((topic) => (
                    <div key={topic} className="font-mono">
                      {topic}
                    </div>
                  ))}
                  {nodeInfo.publishedTopics.length > 5 && (
                    <div className="text-gray-500 italic">
                      +{nodeInfo.publishedTopics.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {nodeInfo.subscribedTopics.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Subscribed Topics ({nodeInfo.subscribedTopics.length})
                </div>
                <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                  {nodeInfo.subscribedTopics.slice(0, 5).map((topic) => (
                    <div key={topic} className="font-mono">
                      {topic}
                    </div>
                  ))}
                  {nodeInfo.subscribedTopics.length > 5 && (
                    <div className="text-gray-500 italic">
                      +{nodeInfo.subscribedTopics.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default memo(GraphNode);
