"use client";

import React from "react";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Copy, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";
import { getFramePath } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import type { TreeStructure } from "@/lib/tf-tree-reactflow/tf-tree-builder";

interface TFDetailsPanelProps {
  selectedNode: TFNodeData | null;
  treeStructure: TreeStructure | null;
}

export function TFDetailsPanel({
  selectedNode,
  treeStructure,
}: TFDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!selectedNode) {
    return (
      <Card className="shadow-none rounded-xl border-gray-200">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            Select a frame to view detailed information
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyTransform = () => {
    if (!selectedNode.transform) return;

    const text = JSON.stringify(
      {
        parent: selectedNode.transform.parent,
        child: selectedNode.transform.child,
        translation: selectedNode.transform.translation,
        rotation: selectedNode.transform.rotation,
      },
      null,
      2
    );
    copyToClipboard(text, "Transform data");
  };

  const getPathToRoot = () => {
    if (!treeStructure || !treeStructure.roots[0]) return [];

    return getFramePath(
      treeStructure.nodes,
      selectedNode.frame,
      treeStructure.roots[0]
    ).reverse();
  };

  const pathToRoot = getPathToRoot();

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-200">
      <CardHeader
        className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-purple-600" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-purple-900 font-semibold">
                Frame Details
              </h3>
              <Badge
                variant="outline"
                className="mt-1 font-mono text-xs border-purple-300 text-purple-800"
              >
                {selectedNode.frame}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-purple-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      {isExpanded && (
        <CardContent className="px-6 py-4 space-y-4">
          {/* Frame Info */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">
              Frame Properties
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNode.isRoot && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  Root Frame
                </Badge>
              )}
              {selectedNode.isStatic && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                  Static Transform
                </Badge>
              )}
              <Badge variant="outline">Level {selectedNode.level}</Badge>
            </div>
          </div>

          {/* Transform Data */}
          {selectedNode.transform && (
            <>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Parent Frame
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm">
                  {selectedNode.transform.parent}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Translation
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedNode.transform?.translation),
                          "Translation"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2 font-mono text-xs space-y-1">
                    <div>
                      x: {selectedNode.transform.translation.x.toFixed(6)}
                    </div>
                    <div>
                      y: {selectedNode.transform.translation.y.toFixed(6)}
                    </div>
                    <div>
                      z: {selectedNode.transform.translation.z.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Rotation (Quaternion)
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedNode.transform?.rotation),
                          "Rotation"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2 font-mono text-xs space-y-1">
                    <div>x: {selectedNode.transform.rotation.x.toFixed(6)}</div>
                    <div>y: {selectedNode.transform.rotation.y.toFixed(6)}</div>
                    <div>z: {selectedNode.transform.rotation.z.toFixed(6)}</div>
                    <div>w: {selectedNode.transform.rotation.w.toFixed(6)}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Last Update
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">
                  {(selectedNode.age / 1000).toFixed(2)}s ago
                </div>
              </div>
            </>
          )}

          {/* Path to Root */}
          {pathToRoot.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                Path to Root
              </div>
              <div className="bg-gray-50 rounded px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  {pathToRoot.map((frame, index) => (
                    <React.Fragment key={frame}>
                      <span
                        className={
                          frame === selectedNode.frame
                            ? "font-bold text-blue-600"
                            : ""
                        }
                      >
                        {frame}
                      </span>
                      {index < pathToRoot.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Copy All Button */}
          {selectedNode.transform && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyTransform}
                className="w-full"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy All Transform Data
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
