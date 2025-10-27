"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { RQTNodeData } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function TopicNode({ data, selected }: NodeProps<RQTNodeData>) {
  if (!data.topicInfo) return null;

  const topicInfo = data.topicInfo;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`rounded-full border-2 border-amber-400 bg-amber-50 shadow-sm ${
              selected ? "ring-2 ring-amber-500 ring-offset-2" : ""
            }`}
            style={{
              minWidth: "160px",
              maxWidth: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 bg-amber-500"
            />

            <div className="px-3 py-2">
              <div className="font-medium text-xs text-amber-900 truncate text-center">
                {topicInfo.name}
              </div>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-amber-500"
            />
          </div>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b pb-1">
              {topicInfo.name}
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Message Type
              </div>
              <div className="text-xs font-mono">{topicInfo.messageType}</div>
            </div>

            {topicInfo.publishers.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Publishers ({topicInfo.publishers.length})
                </div>
                <div className="text-xs space-y-0.5">
                  {topicInfo.publishers.map((pub) => (
                    <div key={pub} className="font-mono">
                      {pub}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topicInfo.subscribers.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Subscribers ({topicInfo.subscribers.length})
                </div>
                <div className="text-xs space-y-0.5">
                  {topicInfo.subscribers.map((sub) => (
                    <div key={sub} className="font-mono">
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default memo(TopicNode);
