"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
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
import { useRQTGraphStore } from "@/store/rqt-graph-store";
import { useRosStore } from "@/store/ros-store";
import {
  buildGraphStructure,
  filterGraphBySearch,
} from "@/lib/rqt-reactflow/rqt-graph-builder";
import { convertToReactFlow } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { getLayoutedElements } from "@/lib/rqt-reactflow/layout-rqt-graph";
import type { LayoutDirection } from "@/lib/rqt-reactflow/layout-rqt-graph";
import GraphNode from "./graph-node";
import TopicNode from "./topic-node";
import { RQTGraphControls } from "./rqt-graph-controls";
import { RQTGraphDetailsPanel } from "./rqt-graph-details-panel";
import type { RQTNodeData } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { Loader2, Network } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function RQTGraph() {
  const nodeTypes = useMemo(
    () => ({
      rosNode: GraphNode,
      rosTopic: TopicNode,
    }),
    []
  );

  const { status } = useRosStore();
  const {
    nodes: graphNodes,
    topics,
    connections,
    isLoading,
    fetchGraphData,
  } = useRQTGraphStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState<RQTNodeData | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSystemNodes, setFilterSystemNodes] = useState(true);
  const [showTopics, setShowTopics] = useState(true);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("LR");
  const [layoutCounter, setLayoutCounter] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Fetch graph data on mount
  useEffect(() => {
    if (status === "connected") {
      fetchGraphData();
    }
  }, [status, fetchGraphData]);

  // Build graph structure
  const graphStructure = useMemo(() => {
    if (graphNodes.length === 0 && topics.length === 0) return null;

    const structure = buildGraphStructure(
      graphNodes,
      topics,
      connections,
      filterSystemNodes,
      showTopics
    );

    // Apply search filter
    if (searchQuery.trim()) {
      return filterGraphBySearch(structure, searchQuery);
    }

    return structure;
  }, [
    graphNodes,
    topics,
    connections,
    filterSystemNodes,
    showTopics,
    searchQuery,
    layoutCounter,
  ]);

  // Update ReactFlow nodes and edges
  useEffect(() => {
    if (!graphStructure) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const timer = setTimeout(() => {
      const { nodes: rawNodes, edges: rawEdges } =
        convertToReactFlow(graphStructure);

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(rawNodes, rawEdges, layoutDirection);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Fit view after layout
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 });
      }, 50);
    }, 300);

    return () => clearTimeout(timer);
  }, [graphStructure, layoutDirection, setNodes, setEdges, fitView]);

  // Handle node/topic click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedElement(node.data);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchGraphData();
    setLayoutCounter((prev) => prev + 1);
  }, [fetchGraphData]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  // Fullscreen handlers
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Loading state
  if (isLoading && graphNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
        <p className="text-sm text-gray-600">Loading graph data...</p>
      </div>
    );
  }

  // Empty state
  if (
    !graphStructure ||
    (graphStructure.nodeElements.size === 0 &&
      graphStructure.topicElements.size === 0)
  ) {
    return (
      <div className="space-y-4">
        <RQTGraphControls
          nodeCount={0}
          topicCount={0}
          onRefresh={handleRefresh}
          onFitView={handleFitView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterSystemNodes={filterSystemNodes}
          onFilterSystemNodesChange={setFilterSystemNodes}
          showTopics={showTopics}
          onShowTopicsChange={setShowTopics}
          layoutDirection={layoutDirection}
          onLayoutDirectionChange={setLayoutDirection}
          isLoading={isLoading}
        />

        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              No nodes or topics detected
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No results found for your search. Try a different query."
                : "Waiting for ROS nodes and topics... Make sure your ROS system is running."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RQTGraphControls
        nodeCount={graphStructure.nodeElements.size}
        topicCount={graphStructure.topicElements.size}
        onRefresh={handleRefresh}
        onFitView={handleFitView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterSystemNodes={filterSystemNodes}
        onFilterSystemNodesChange={setFilterSystemNodes}
        showTopics={showTopics}
        onShowTopicsChange={setShowTopics}
        layoutDirection={layoutDirection}
        onLayoutDirectionChange={setLayoutDirection}
        isLoading={isLoading}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div ref={containerRef} className={isFullscreen ? "bg-white" : ""}>
        {isFullscreen && (
          <div className="p-4 border-b border-teal-200 bg-teal-50">
            <RQTGraphControls
              nodeCount={graphStructure.nodeElements.size}
              topicCount={graphStructure.topicElements.size}
              onRefresh={handleRefresh}
              onFitView={handleFitView}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterSystemNodes={filterSystemNodes}
              onFilterSystemNodesChange={setFilterSystemNodes}
              showTopics={showTopics}
              onShowTopicsChange={setShowTopics}
              layoutDirection={layoutDirection}
              onLayoutDirectionChange={setLayoutDirection}
              isLoading={isLoading}
              onFullscreen={handleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        )}

        <Card className="shadow-none pt-0 rounded-xl border-teal-200">
          <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
            <div className="flex items-start gap-3">
              <Network className="h-5 w-5 mt-0.5 text-teal-600" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base text-teal-900 font-semibold">
                  ROS Computation Graph
                </h2>
                <p className="mt-1 text-xs text-teal-800">
                  Interactive visualization of ROS nodes and topics
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0 py-0">
            <div
              style={{ height: isFullscreen ? "calc(100vh - 200px)" : "700px" }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.05}
                maxZoom={1.5}
                defaultEdgeOptions={{
                  type: "straight",
                  style: { strokeWidth: 1.5 },
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#f3f4f6" gap={20} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === "rosTopic") return "#fbbf24";
                    return "#60a5fa";
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                  }}
                />

                <Panel
                  position="top-right"
                  className="bg-white rounded-lg p-3 shadow-md border border-gray-200"
                >
                  <div className="text-xs text-gray-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-gray-400 bg-white" />
                      <span className="font-medium">Node</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-50" />
                      <span className="font-medium">Topic</span>
                    </div>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isFullscreen && (
        <RQTGraphDetailsPanel selectedElement={selectedElement} />
      )}
    </div>
  );
}
