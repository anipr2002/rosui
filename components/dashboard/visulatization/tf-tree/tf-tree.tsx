"use client";

import React, { useEffect, useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTFStore } from "@/store/tf-store";
import { useRosStore } from "@/store/ros-store";
import { buildTreeStructure } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import { convertToReactFlow } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { getLayoutedElements } from "@/lib/tf-tree-reactflow/layout-tf-tree";
import TFNode from "./tf-node";
import { TFControls } from "./tf-controls";
import { TFDetailsPanel } from "./tf-details-panel";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { Loader2, GitBranch } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function TFTree() {
  const nodeTypes = useMemo(
    () => ({
      tfNode: TFNode,
    }),
    []
  );

  const { status } = useRosStore();
  const { tfTree, lastUpdate, isSubscribed, subscribeTF, unsubscribeTF } =
    useTFStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<TFNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutCounter, setLayoutCounter] = useState(0);
  const { fitView } = useReactFlow();

  // Subscribe to TF topics on mount
  useEffect(() => {
    if (status === "connected" && !isSubscribed) {
      subscribeTF();
    }

    return () => {
      if (isSubscribed) {
        unsubscribeTF();
      }
    };
  }, [status, isSubscribed, subscribeTF, unsubscribeTF]);

  // Build tree structure from TF data
  const treeStructure = useMemo(() => {
    if (tfTree.size === 0) return null;
    return buildTreeStructure(tfTree);
  }, [tfTree, layoutCounter]);

  // Debounced layout update
  useEffect(() => {
    if (!treeStructure) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const timer = setTimeout(() => {
      const { nodes: rawNodes, edges: rawEdges } = convertToReactFlow(
        treeStructure,
        lastUpdate
      );

      // Filter nodes based on search query
      let filteredNodes = rawNodes;
      let filteredEdges = rawEdges;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchingNodeIds = new Set(
          rawNodes
            .filter((node) => node.data.frame.toLowerCase().includes(query))
            .map((node) => node.id)
        );

        filteredNodes = rawNodes.filter((node) => matchingNodeIds.has(node.id));
        filteredEdges = rawEdges.filter(
          (edge) =>
            matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target)
        );
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(filteredNodes, filteredEdges, "TB");

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Fit view after layout
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 });
      }, 50);
    }, 300);

    return () => clearTimeout(timer);
  }, [treeStructure, lastUpdate, searchQuery, setNodes, setEdges, fitView]);

  // Periodic update to refresh node ages
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          const now = Date.now();
          const transform = node.data.transform;
          const key = transform
            ? `${transform.parent}->${transform.child}`
            : "";
          const lastUpdateTime = lastUpdate.get(key) || 0;
          const age = now - lastUpdateTime;

          return {
            ...node,
            data: {
              ...node.data,
              age,
            },
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [setNodes, lastUpdate]);

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node.data);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setLayoutCounter((prev) => prev + 1);
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  // Loading state
  if (!isSubscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-gray-600">Subscribing to TF topics...</p>
      </div>
    );
  }

  // Empty state
  if (tfTree.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            No TF frames detected
          </p>
          <p className="text-sm text-gray-500">
            Waiting for transform data on /tf and /tf_static topics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TFControls
        frameCount={treeStructure?.nodes.size || 0}
        onRefresh={handleRefresh}
        onFitView={handleFitView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Card className="shadow-none pt-0 rounded-xl border-blue-200">
        <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
          <div className="flex items-start gap-3">
            <GitBranch className="h-5 w-5 mt-0.5 text-blue-600" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base text-blue-900 font-semibold">
                Transform Tree Visualization
              </h2>
              <p className="mt-1 text-xs text-blue-800">
                Interactive visualization of the TF (Transform) tree structure
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          <div style={{ height: "600px" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                type: "smoothstep",
              }}
            >
              <Background color="#e5e7eb" gap={16} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  const data = node.data as TFNodeData;
                  if (data.isRoot) return "#3b82f6";
                  if (data.isStatic) return "#9ca3af";
                  return "#6b7280";
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
                style={{
                  backgroundColor: "#f9fafb",
                }}
              />

              <Panel
                position="top-right"
                className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm"
              >
                <div className="text-xs text-gray-600 space-y-1">
                  <div>🟢 Fresh (&lt;1s)</div>
                  <div>🟡 Recent (1-5s)</div>
                  <div>🟠 Stale (5-10s)</div>
                  <div>🔴 Very Old (&gt;10s)</div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      <TFDetailsPanel
        selectedNode={selectedNode}
        treeStructure={treeStructure}
      />
    </div>
  );
}
