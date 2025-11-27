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
import type { LayoutDirection } from "@/lib/rqt-reactflow/layout-rqt-graph";
import GraphNode from "./graph-node";
import TopicNode from "./topic-node";
import { RQTGraphControls } from "./rqt-graph-controls";
import { RQTGraphDetailsPanel } from "./rqt-graph-details-panel";
import type { RQTNodeData } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { AlertCircle, ArrowRight, Link, Network } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpinnerCustom } from "@/components/ui/spinner";
import type { GraphWorkerInput, GraphWorkerOutput } from "@/lib/workers/graph-processing.worker";

const nodeTypes = {
  rosNode: GraphNode,
  rosTopic: TopicNode,
};

export interface RQTGraphProps {
  searchQuery?: string;
  filterSystemNodes?: boolean;
  showTopics?: boolean;
  layoutDirection?: LayoutDirection;
  hideControls?: boolean;
  onSearchChange?: (query: string) => void;
  onFilterSystemNodesChange?: (checked: boolean) => void;
  onShowTopicsChange?: (checked: boolean) => void;
  onLayoutDirectionChange?: (direction: LayoutDirection) => void;
}

export function RQTGraph({
  searchQuery: propSearchQuery,
  filterSystemNodes: propFilterSystemNodes,
  showTopics: propShowTopics,
  layoutDirection: propLayoutDirection,
  hideControls = false,
  onSearchChange,
  onFilterSystemNodesChange,
  onShowTopicsChange,
  onLayoutDirectionChange,
}: RQTGraphProps = {}) {
  const { status } = useRosStore();
  
  // Use selectors to prevent unnecessary re-renders
  const graphNodes = useRQTGraphStore((state) => state.nodes);
  const topics = useRQTGraphStore((state) => state.topics);
  const connections = useRQTGraphStore((state) => state.connections);
  const isLoading = useRQTGraphStore((state) => state.isLoading);
  const fetchGraphData = useRQTGraphStore((state) => state.fetchGraphData);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState<RQTNodeData | null>(
    null
  );
  
  // Internal state (used if props are not provided)
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalFilterSystemNodes, setInternalFilterSystemNodes] = useState(true);
  const [internalShowTopics, setInternalShowTopics] = useState(true);
  const [internalLayoutDirection, setInternalLayoutDirection] = useState<LayoutDirection>("LR");

  // Derived state (prefer props, fallback to internal)
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const filterSystemNodes = propFilterSystemNodes !== undefined ? propFilterSystemNodes : internalFilterSystemNodes;
  const showTopics = propShowTopics !== undefined ? propShowTopics : internalShowTopics;
  const layoutDirection = propLayoutDirection !== undefined ? propLayoutDirection : internalLayoutDirection;

  // Handlers (call prop callback if exists, otherwise set internal state)
  const handleSearchChange = (query: string) => {
    if (onSearchChange) onSearchChange(query);
    else setInternalSearchQuery(query);
  };

  const handleFilterSystemNodesChange = (checked: boolean) => {
    if (onFilterSystemNodesChange) onFilterSystemNodesChange(checked);
    else setInternalFilterSystemNodes(checked);
  };

  const handleShowTopicsChange = (checked: boolean) => {
    if (onShowTopicsChange) onShowTopicsChange(checked);
    else setInternalShowTopics(checked);
  };

  const handleLayoutDirectionChange = (direction: LayoutDirection) => {
    if (onLayoutDirectionChange) onLayoutDirectionChange(direction);
    else setInternalLayoutDirection(direction);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [topicCount, setTopicCount] = useState(0);
  
  // Track if we have initiated a fetch to prevent loops
  const hasFetchedRef = useRef(false);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/lib/workers/graph-processing.worker.ts", import.meta.url)
    );

    workerRef.current.onmessage = (event: MessageEvent<GraphWorkerOutput>) => {
      const { type, payload } = event.data;

      if (type === "GRAPH_PROCESSED") {
        setNodes(payload.nodes);
        setEdges(payload.edges);
        setNodeCount(payload.nodeCount);
        setTopicCount(payload.topicCount);
        setIsProcessing(false);

        // Fit view after layout update
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 200 });
        }, 50);
      } else if (type === "ERROR") {
        console.error("Worker error:", payload.message);
        setIsProcessing(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setNodes, setEdges, fitView]);

  // Fetch graph data on mount or connection
  useEffect(() => {
    if (status === "connected" && !hasFetchedRef.current) {
      fetchGraphData();
      hasFetchedRef.current = true;
    }
  }, [status, fetchGraphData]);

  // Send data to worker when it changes
  useEffect(() => {
    if (!workerRef.current) return;
    if (graphNodes.length === 0 && topics.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
    }

    setIsProcessing(true);
    const message: GraphWorkerInput = {
      type: "PROCESS_GRAPH",
      payload: {
        nodes: graphNodes,
        topics,
        connections,
        filterSystemNodes,
        showTopics,
        searchQuery,
        layoutDirection,
      },
    };
    workerRef.current.postMessage(message);

  }, [
    graphNodes,
    topics,
    connections,
    filterSystemNodes,
    showTopics,
    searchQuery,
    layoutDirection,
  ]);

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
      <div className="flex flex-col items-center justify-center py-12 px-4 h-full">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-amber-900">
                  Loading ROS Topics...
                </h3>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Please wait while we load the ROS topics...
              </p>
              <SpinnerCustom />
              {!hideControls && (
                <Link href="/dashboard/ros-settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (
    !isProcessing &&
    nodeCount === 0 &&
    topicCount === 0
  ) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        {!hideControls && (
          <RQTGraphControls
            nodeCount={0}
            topicCount={0}
            onRefresh={handleRefresh}
            onFitView={handleFitView}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filterSystemNodes={filterSystemNodes}
            onFilterSystemNodesChange={handleFilterSystemNodesChange}
            showTopics={showTopics}
            onShowTopicsChange={handleShowTopicsChange}
            layoutDirection={layoutDirection}
            onLayoutDirectionChange={handleLayoutDirectionChange}
            isLoading={isLoading || isProcessing}
          />
        )}

        <div className="flex flex-col items-center justify-center py-12 flex-1">
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
    <div className="space-y-4 h-full flex flex-col">
      {!hideControls && (
        <RQTGraphControls
          nodeCount={nodeCount}
          topicCount={topicCount}
          onRefresh={handleRefresh}
          onFitView={handleFitView}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filterSystemNodes={filterSystemNodes}
          onFilterSystemNodesChange={handleFilterSystemNodesChange}
          showTopics={showTopics}
          onShowTopicsChange={handleShowTopicsChange}
          layoutDirection={layoutDirection}
          onLayoutDirectionChange={handleLayoutDirectionChange}
          isLoading={isLoading || isProcessing}
          onFullscreen={handleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      <div ref={containerRef} className={`${isFullscreen ? "bg-white" : ""} flex-1 min-h-0 flex flex-col`}>
        {isFullscreen && (
          <div className="p-4 border-b border-teal-200 bg-teal-50">
            <RQTGraphControls
              nodeCount={nodeCount}
              topicCount={topicCount}
              onRefresh={handleRefresh}
              onFitView={handleFitView}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              filterSystemNodes={filterSystemNodes}
              onFilterSystemNodesChange={handleFilterSystemNodesChange}
              showTopics={showTopics}
              onShowTopicsChange={handleShowTopicsChange}
              layoutDirection={layoutDirection}
              onLayoutDirectionChange={handleLayoutDirectionChange}
              isLoading={isLoading || isProcessing}
              onFullscreen={handleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        )}

        <Card className={`shadow-none pt-0 rounded-xl border-teal-200 flex-1 flex flex-col overflow-hidden ${hideControls ? "border-0 rounded-none" : ""}`}>
          {!hideControls && (
            <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6 shrink-0">
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
          )}

          <CardContent className="px-0 py-0 flex-1 min-h-0 relative">
            <div
              className="h-full w-full absolute inset-0"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
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

      {!isFullscreen && !hideControls && (
        <RQTGraphDetailsPanel selectedElement={selectedElement} />
      )}
    </div>
  );
}
