"use client";

import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import type { ReactFlowInstance, Node } from "reactflow";
import "reactflow/dist/style.css";
import { useTFStore } from "@/store/tf-store";
import { useRosStore } from "@/store/ros-store";
import { buildTreeStructure } from "@/lib/tf-tree-reactflow/tf-tree-builder";
import { convertToReactFlow } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { getLayoutedElements } from "@/lib/tf-tree-reactflow/layout-tf-tree";
import TFNode from "./tf-node";
import { TFControls } from "./tf-controls";
import { TFDetailsPanel } from "./tf-details-panel";
import { TFDebugPanel } from "./tf-debug-panel";
import type { TFNodeData } from "@/lib/tf-tree-reactflow/tf-to-reactflow";
import { Loader2, GitBranch } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface TFTreeProps {
  hideControls?: boolean;
  hideDetailsPanel?: boolean;
  searchQuery?: string;
  layoutDirection?: "TB" | "LR" | "RL" | "BT";
  showMinimap?: boolean;
  staleTimeout?: number;
}

// Inner component that uses useReactFlow hook
function TFTreeInner({
  hideControls = false,
  hideDetailsPanel = false,
  searchQuery: externalSearchQuery,
  layoutDirection: externalLayoutDirection = "TB",
  showMinimap = true,
}: Omit<TFTreeProps, "staleTimeout">) {
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
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const [layoutCounter, setLayoutCounter] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);
  
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<TFNodeData>) => {
      setSelectedNode(node.data);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setLayoutCounter((prev) => prev + 1);
  }, []);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 200 });
    } else {
      fitView({ padding: 0.2, duration: 200 });
    }
  }, [fitView]);

  // Handle React Flow initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    setIsReactFlowReady(true);
    // Delay fitView to ensure nodes are rendered
    setTimeout(() => {
      instance.fitView({ padding: 0.2, duration: 200 });
    }, 100);
  }, []);

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

  // Layout and fit view when tree structure changes
  useEffect(() => {
    if (!treeStructure) {
      setNodes([]);
      setEdges([]);
      return;
    }

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

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      filteredEdges,
      externalLayoutDirection as any
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after layout if React Flow is ready
    // Only fit view if this is the first layout (nodes were empty before)
    // This prevents resetting the view when data updates
    if (isReactFlowReady && reactFlowInstance.current && nodes.length === 0 && layoutedNodes.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          reactFlowInstance.current?.fitView({ padding: 0.2, duration: 200 });
        }, 50);
      });
    }
  }, [
    treeStructure,
    lastUpdate,
    searchQuery,
    externalLayoutDirection,
    setNodes,
    setEdges,
    isReactFlowReady,
  ]);

  // Force fit view when React Flow becomes ready and we have nodes
  useEffect(() => {
    if (isReactFlowReady && nodes.length > 0 && reactFlowInstance.current) {
      const timer = setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 200 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReactFlowReady, nodes.length]);

  // Periodic update to refresh node ages
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          const now = Date.now();
          const transform = node.data.transform;
          const key = transform ? `${transform.parent}->${transform.child}` : "";
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

  const renderReactFlow = (height: string) => (
    <div
      ref={containerRef}
      style={{ height, width: "100%", minHeight: height === "100%" ? "400px" : undefined }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={onInit}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
        {showMinimap && (
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
        )}

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
  );

  return (
    <div className="space-y-4">
      {!hideControls && (
        <TFControls
          frameCount={treeStructure?.nodes.size || 0}
          onRefresh={handleRefresh}
          onFitView={handleFitView}
          searchQuery={internalSearchQuery}
          onSearchChange={setInternalSearchQuery}
          debugMode={debugMode}
          onDebugModeChange={setDebugMode}
          treeStructure={treeStructure}
        />
      )}

      {hideControls ? (
        // Panel mode - no card wrapper
        renderReactFlow("100%")
      ) : (
        // Standalone mode - with card wrapper
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
            {renderReactFlow("600px")}
          </CardContent>
        </Card>
      )}

      {debugMode && (
        <TFDebugPanel
          treeStructure={treeStructure}
          selectedNode={selectedNode}
        />
      )}

      {!hideDetailsPanel && (
        <TFDetailsPanel
          selectedNode={selectedNode}
          treeStructure={treeStructure}
        />
      )}
    </div>
  );
}

// Outer wrapper component with ReactFlowProvider
export function TFTree(props: TFTreeProps) {
  return (
    <ReactFlowProvider>
      <TFTreeInner {...props} />
    </ReactFlowProvider>
  );
}
