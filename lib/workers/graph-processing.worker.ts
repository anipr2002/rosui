import { buildGraphStructure, filterGraphBySearch } from "@/lib/rqt-reactflow/rqt-graph-builder";
import { convertToReactFlow } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { getLayoutedElements, LayoutDirection } from "@/lib/rqt-reactflow/layout-rqt-graph";
import type { NodeInfo, TopicInfo, ConnectionInfo } from "@/store/rqt-graph-store";

// Define input message types
export type GraphWorkerInput = {
  type: "PROCESS_GRAPH";
  payload: {
    nodes: NodeInfo[];
    topics: TopicInfo[];
    connections: ConnectionInfo[];
    filterSystemNodes: boolean;
    showTopics: boolean;
    searchQuery: string;
    layoutDirection: LayoutDirection;
  };
};

// Define output message types
export type GraphWorkerOutput = {
  type: "GRAPH_PROCESSED";
  payload: {
    nodes: any[]; // ReactFlow nodes
    edges: any[]; // ReactFlow edges
    nodeCount: number;
    topicCount: number;
  };
} | {
  type: "ERROR";
  payload: {
    message: string;
  };
};

self.onmessage = (event: MessageEvent<GraphWorkerInput>) => {
  const { type, payload } = event.data;

  if (type === "PROCESS_GRAPH") {
    try {
      const {
        nodes,
        topics,
        connections,
        filterSystemNodes,
        showTopics,
        searchQuery,
        layoutDirection,
      } = payload;

      // 1. Build graph structure
      let graphStructure = buildGraphStructure(
        nodes,
        topics,
        connections,
        filterSystemNodes,
        showTopics
      );

      // 2. Filter by search query
      if (searchQuery && searchQuery.trim()) {
        graphStructure = filterGraphBySearch(graphStructure, searchQuery);
      }

      // 3. Convert to ReactFlow elements
      const { nodes: rawNodes, edges: rawEdges } = convertToReactFlow(graphStructure);

      // 4. Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rawNodes,
        rawEdges,
        layoutDirection
      );

      // 5. Send back results
      const response: GraphWorkerOutput = {
        type: "GRAPH_PROCESSED",
        payload: {
          nodes: layoutedNodes,
          edges: layoutedEdges,
          nodeCount: graphStructure.nodeElements.size,
          topicCount: graphStructure.topicElements.size,
        },
      };

      self.postMessage(response);
    } catch (error) {
      console.error("Graph processing error:", error);
      self.postMessage({
        type: "ERROR",
        payload: {
          message: error instanceof Error ? error.message : "Unknown error during graph processing",
        },
      });
    }
  }
};
