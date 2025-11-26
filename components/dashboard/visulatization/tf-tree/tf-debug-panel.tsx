"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTFStore } from "@/store/tf-store";
import type { TreeStructure } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import {
  quaternionToEulerDegrees,
  transformToMatrix4,
  formatMatrix4,
  getTransformBetweenFrames,
  getTransformChain,
  distanceBetweenFrames,
  angleBetweenFrames,
  radToDeg,
  translationMagnitude,
} from "@/lib/tf-math";
import {
  Bug,
  Activity,
  ArrowRightLeft,
  Grid3X3,
  Copy,
  ChevronDown,
  ChevronUp,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";

interface TFDebugPanelProps {
  treeStructure: TreeStructure | null;
  selectedNode: TFNodeData | null;
}

export function TFDebugPanel({
  treeStructure,
  selectedNode,
}: TFDebugPanelProps) {
  const { getAllUpdateRates, tfTree } = useTFStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"rates" | "compare" | "matrix">(
    "rates"
  );
  const [compareFrameA, setCompareFrameA] = useState<string>("");
  const [compareFrameB, setCompareFrameB] = useState<string>("");

  // Get all frame names for selection
  const frameNames = useMemo(() => {
    if (!treeStructure) return [];
    return Array.from(treeStructure.nodes.keys()).sort();
  }, [treeStructure]);

  // Update compare frame A when a node is selected (convenience)
  React.useEffect(() => {
    if (selectedNode && !compareFrameA) {
      setCompareFrameA(selectedNode.frame);
    }
  }, [selectedNode, compareFrameA]);

  // Get update rates
  const updateRates = useMemo(() => {
    const rates = getAllUpdateRates();
    return Array.from(rates.entries())
      .map(([key, rate]) => {
        const [, child] = key.split("->");
        return { key, child, rate };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [getAllUpdateRates, tfTree]);

  // Compute transform between frames
  const comparisonResult = useMemo(() => {
    if (!treeStructure || !compareFrameA || !compareFrameB) return null;
    if (compareFrameA === compareFrameB) return null;

    const transform = getTransformBetweenFrames(
      treeStructure,
      compareFrameA,
      compareFrameB
    );
    const chain = getTransformChain(
      treeStructure,
      compareFrameA,
      compareFrameB
    );
    const distance = distanceBetweenFrames(
      treeStructure,
      compareFrameA,
      compareFrameB
    );
    const angle = angleBetweenFrames(
      treeStructure,
      compareFrameA,
      compareFrameB
    );

    if (!transform || !chain) return null;

    return {
      transform,
      path: chain.path,
      distance,
      angle: angle !== null ? radToDeg(angle) : null,
      euler: quaternionToEulerDegrees(transform.rotation),
    };
  }, [treeStructure, compareFrameA, compareFrameB]);

  // Matrix view for selected node
  const selectedNodeMatrix = useMemo(() => {
    if (!selectedNode?.transform) return null;
    return transformToMatrix4(selectedNode.transform);
  }, [selectedNode]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getMaxRate = () => {
    if (updateRates.length === 0) return 1;
    return Math.max(...updateRates.map((r) => r.rate), 1);
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-amber-200">
      <CardHeader
        className="bg-amber-50 border-amber-200 border-b rounded-t-xl pt-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bug className="h-5 w-5 mt-0.5 text-amber-600" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-amber-900 font-semibold">
                Debug Panel
              </h3>
              <p className="mt-1 text-xs text-amber-800">
                Transform rates, frame comparison, and matrix visualization
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-amber-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 py-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 border-b pb-3">
            <Button
              variant={activeTab === "rates" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("rates")}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Update Rates
            </Button>
            <Button
              variant={activeTab === "compare" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("compare")}
              className="gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Compare Frames
            </Button>
            <Button
              variant={activeTab === "matrix" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("matrix")}
              className="gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Matrix View
            </Button>
          </div>

          {/* Update Rates Tab */}
          {activeTab === "rates" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  Frame Update Rates
                </div>
                <Badge variant="outline" className="text-xs">
                  {updateRates.filter((r) => r.rate > 0).length} active
                </Badge>
              </div>

              {updateRates.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No update rate data available yet
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {updateRates.map(({ key, child, rate }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-gray-700 truncate">
                          {child}
                        </div>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((rate / getMaxRate()) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Gauge className="h-3 w-3 text-amber-500" />
                        {rate.toFixed(1)} Hz
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compare Frames Tab */}
          {activeTab === "compare" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    From Frame
                  </label>
                  <Select
                    value={compareFrameA}
                    onValueChange={setCompareFrameA}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select frame A" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameNames.map((frame) => (
                        <SelectItem key={frame} value={frame}>
                          {frame}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    To Frame
                  </label>
                  <Select
                    value={compareFrameB}
                    onValueChange={setCompareFrameB}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select frame B" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameNames.map((frame) => (
                        <SelectItem key={frame} value={frame}>
                          {frame}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {comparisonResult ? (
                <div className="space-y-3">
                  {/* Path */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Transform Path
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                        {comparisonResult.path.map((frame, index) => (
                          <React.Fragment key={index}>
                            <span
                              className={
                                frame === compareFrameA ||
                                frame === compareFrameB
                                  ? "font-bold text-amber-600"
                                  : ""
                              }
                            >
                              {frame}
                            </span>
                            {index < comparisonResult.path.length - 1 && (
                              <span className="text-gray-400">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="text-xs font-medium text-gray-500">
                        Distance
                      </div>
                      <div className="text-sm font-mono">
                        {comparisonResult.distance?.toFixed(4)} m
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="text-xs font-medium text-gray-500">
                        Rotation
                      </div>
                      <div className="text-sm font-mono">
                        {comparisonResult.angle?.toFixed(2)}°
                      </div>
                    </div>
                  </div>

                  {/* Translation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-500">
                        Translation
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              comparisonResult.transform.translation
                            ),
                            "Translation"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 font-mono text-xs space-y-0.5">
                      <div>
                        x: {comparisonResult.transform.translation.x.toFixed(6)}
                      </div>
                      <div>
                        y: {comparisonResult.transform.translation.y.toFixed(6)}
                      </div>
                      <div>
                        z: {comparisonResult.transform.translation.z.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* Euler Angles */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-500">
                        Euler Angles (RPY)
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(comparisonResult.euler),
                            "Euler angles"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 font-mono text-xs space-y-0.5">
                      <div>Roll: {comparisonResult.euler.roll.toFixed(3)}°</div>
                      <div>
                        Pitch: {comparisonResult.euler.pitch.toFixed(3)}°
                      </div>
                      <div>Yaw: {comparisonResult.euler.yaw.toFixed(3)}°</div>
                    </div>
                  </div>

                  {/* Quaternion */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-500">
                        Quaternion
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(comparisonResult.transform.rotation),
                            "Quaternion"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 font-mono text-xs space-y-0.5">
                      <div>
                        x: {comparisonResult.transform.rotation.x.toFixed(6)}
                      </div>
                      <div>
                        y: {comparisonResult.transform.rotation.y.toFixed(6)}
                      </div>
                      <div>
                        z: {comparisonResult.transform.rotation.z.toFixed(6)}
                      </div>
                      <div>
                        w: {comparisonResult.transform.rotation.w.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* Copy Full Transform */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            from: compareFrameA,
                            to: compareFrameB,
                            translation: comparisonResult.transform.translation,
                            rotation: comparisonResult.transform.rotation,
                            euler: comparisonResult.euler,
                            distance: comparisonResult.distance,
                            angle: comparisonResult.angle,
                          },
                          null,
                          2
                        ),
                        "Full comparison"
                      )
                    }
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy Full Comparison
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  {compareFrameA &&
                  compareFrameB &&
                  compareFrameA === compareFrameB
                    ? "Select different frames to compare"
                    : "Select two frames to compare transforms"}
                </div>
              )}
            </div>
          )}

          {/* Matrix View Tab */}
          {activeTab === "matrix" && (
            <div className="space-y-4">
              {selectedNode?.transform ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      4×4 Transformation Matrix
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedNode.frame}
                    </Badge>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="font-mono text-xs text-green-400 leading-relaxed">
                      {selectedNodeMatrix &&
                        formatMatrix4(selectedNodeMatrix, 6).map((row, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-gray-500 w-4">{i}</span>
                            <span>[{row}]</span>
                          </div>
                        ))}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Translation Magnitude
                      </div>
                      <div className="text-sm font-mono">
                        {translationMagnitude(
                          selectedNode.transform.translation
                        ).toFixed(6)}{" "}
                        m
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        From Parent
                      </div>
                      <div className="text-sm font-mono truncate">
                        {selectedNode.transform.parent}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (selectedNodeMatrix) {
                        const matrixArray = Array.from(selectedNodeMatrix);
                        copyToClipboard(
                          JSON.stringify(matrixArray, null, 2),
                          "4x4 Matrix"
                        );
                      }
                    }}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy Matrix (Column-Major)
                  </Button>
                </>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  Select a frame to view its transformation matrix
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
