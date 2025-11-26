"use client";

import React from "react";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Move3D,
  Grid3X3,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { getFramePath } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import type { TreeStructure } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import { useTFStore } from "@/store/tf-store";
import {
  quaternionToEulerDegrees,
  transformToMatrix4,
  formatMatrix4,
  quaternionMagnitude,
  translationMagnitude,
} from "@/lib/tf-math";

interface TFDetailsPanelProps {
  selectedNode: TFNodeData | null;
  treeStructure: TreeStructure | null;
}

export function TFDetailsPanel({
  selectedNode,
  treeStructure,
}: TFDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { getUpdateRate } = useTFStore();

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

    const euler = quaternionToEulerDegrees(selectedNode.transform.rotation);
    const text = JSON.stringify(
      {
        parent: selectedNode.transform.parent,
        child: selectedNode.transform.child,
        translation: selectedNode.transform.translation,
        rotation: selectedNode.transform.rotation,
        euler_degrees: euler,
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

  // Get Euler angles
  const eulerAngles = selectedNode.transform
    ? quaternionToEulerDegrees(selectedNode.transform.rotation)
    : null;

  // Get 4x4 matrix
  const matrix4 = selectedNode.transform
    ? transformToMatrix4(selectedNode.transform)
    : null;

  // Get update rate
  const frameKey = selectedNode.transform
    ? `${selectedNode.transform.parent}->${selectedNode.transform.child}`
    : "";
  const updateRate = getUpdateRate(frameKey);

  // Get quaternion magnitude (should be ~1 for valid quaternion)
  const quatMag = selectedNode.transform
    ? quaternionMagnitude(selectedNode.transform.rotation)
    : null;

  // Get translation magnitude
  const transMag = selectedNode.transform
    ? translationMagnitude(selectedNode.transform.translation)
    : null;

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
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="font-mono text-xs border-purple-300 text-purple-800"
                >
                  {selectedNode.frame}
                </Badge>
                {updateRate > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-green-300 text-green-700 bg-green-50"
                  >
                    <Gauge className="h-3 w-3 mr-1" />
                    {updateRate.toFixed(1)} Hz
                  </Badge>
                )}
              </div>
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
              {quatMag !== null && Math.abs(quatMag - 1) > 0.001 && (
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  Invalid Quaternion (|q|={quatMag.toFixed(4)})
                </Badge>
              )}
            </div>
          </div>

          {/* Transform Data */}
          {selectedNode.transform && (
            <Tabs defaultValue="translation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="translation" className="gap-1">
                  <Move3D className="h-3 w-3" />
                  Position
                </TabsTrigger>
                <TabsTrigger value="rotation" className="gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Rotation
                </TabsTrigger>
                <TabsTrigger value="matrix" className="gap-1">
                  <Grid3X3 className="h-3 w-3" />
                  Matrix
                </TabsTrigger>
              </TabsList>

              {/* Translation Tab */}
              <TabsContent value="translation" className="space-y-3 mt-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Parent Frame
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm">
                    {selectedNode.transform.parent}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Translation (x, y, z)
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
                      x: {selectedNode.transform.translation.x.toFixed(6)} m
                    </div>
                    <div>
                      y: {selectedNode.transform.translation.y.toFixed(6)} m
                    </div>
                    <div>
                      z: {selectedNode.transform.translation.z.toFixed(6)} m
                    </div>
                  </div>
                </div>

                {transMag !== null && (
                  <div className="bg-purple-50 rounded px-3 py-2">
                    <div className="text-xs font-medium text-purple-700">
                      Distance from parent
                    </div>
                    <div className="text-sm font-mono text-purple-900">
                      {transMag.toFixed(6)} m
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Rotation Tab */}
              <TabsContent value="rotation" className="space-y-3 mt-3">
                {/* Euler Angles */}
                {eulerAngles && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-500">
                        Euler Angles (Roll-Pitch-Yaw)
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(eulerAngles),
                            "Euler angles"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-purple-50 rounded px-3 py-2 font-mono text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Roll (X):</span>
                        <span className="text-purple-900">
                          {eulerAngles.roll.toFixed(3)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Pitch (Y):</span>
                        <span className="text-purple-900">
                          {eulerAngles.pitch.toFixed(3)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Yaw (Z):</span>
                        <span className="text-purple-900">
                          {eulerAngles.yaw.toFixed(3)}°
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quaternion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Quaternion (x, y, z, w)
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
              </TabsContent>

              {/* Matrix Tab */}
              <TabsContent value="matrix" className="space-y-3 mt-3">
                {matrix4 && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-gray-500">
                          4×4 Transformation Matrix
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const matrixArray = Array.from(matrix4);
                            copyToClipboard(
                              JSON.stringify(matrixArray),
                              "4x4 Matrix"
                            );
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="font-mono text-xs text-green-400 leading-relaxed">
                          {formatMatrix4(matrix4, 4).map((row, i) => (
                            <div key={i}>[{row}]</div>
                          ))}
                        </pre>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Column-major format (compatible with WebGPU/OpenGL)
                    </p>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded px-3 py-2">
              <div className="text-xs font-medium text-gray-500">
                Last Update
              </div>
              <div className="text-sm">
                {(selectedNode.age / 1000).toFixed(2)}s ago
              </div>
            </div>
            {updateRate > 0 && (
              <div className="bg-green-50 rounded px-3 py-2">
                <div className="text-xs font-medium text-green-700">
                  Update Rate
                </div>
                <div className="text-sm font-mono text-green-900">
                  {updateRate.toFixed(1)} Hz
                </div>
              </div>
            )}
          </div>

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
                            ? "font-bold text-purple-600"
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
