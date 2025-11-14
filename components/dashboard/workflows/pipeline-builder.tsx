"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  Connection,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import { AlertCircle, Sparkles } from "lucide-react";
import { WorkflowToolbar } from "./workflow-toolbar";
import { InputNode } from "./nodes/input-node";
import { ProcessNode } from "./nodes/process-node";
import { OutputNode } from "./nodes/output-node";
import { WorkflowCanvasProvider } from "./workflow-context";
import { PerformancePanel } from "./performance-panel";
import type {
  InputNodeConfig,
  OutputNodeConfig,
  ProcessNodeConfig,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeType,
  WorkflowStats,
  LiveMessage,
  HistoryEntry,
} from "./types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRosStore } from "@/store/ros-store";
import { useTopicsStore } from "@/store/topic-store";
import { useServicesStore } from "@/store/service-store";
import type { OperationRefs } from "./process-operations";
import {
  applyMapField,
  applyMathOp,
  applyStringTransform,
  applyJsonPath,
  applyMovingAverage,
  applyStdDev,
  applyMinMax,
  applyRateOfChange,
  applyOutlierDetection,
  applyCoordinateTransform,
  applyMessageSplit,
  applyMessageMerge,
  applyTimestampValidation,
  applyRangeFilter,
  applyRegexFilter,
  applyMultiCondition,
} from "./process-operations";

const WORKFLOW_STORAGE_KEY = "rosui.workflow.dataProcessing";

type MessageEvent = {
  nodeId: string;
  payload: any;
};

const defaultStats = (): WorkflowStats => ({
  messageCount: 0,
  throughput: 0,
});

const defaultConfig: Record<
  WorkflowNodeType,
  () => InputNodeConfig | ProcessNodeConfig | OutputNodeConfig
> = {
  input: () => ({
    topicName: undefined,
    topicType: undefined,
    bufferSize: 50,
    autoStart: true,
  }),
  process: () => ({
    operation: "passThrough",
    throttleHz: 10,
    aggregateWindow: 5,
    filterField: "",
    filterValue: "",
    fieldMappings: [],
    multiConditions: [],
  }),
  output: () => ({
    mode: "publish",
    targetTopic: "",
    targetType: "",
    autoPublish: true,
    customMessage: "",
  }),
};

const nodeTypesMap = {
  input: InputNode,
  process: ProcessNode,
  output: OutputNode,
};

function generateNodeId(prefix: WorkflowNodeType) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function isInputConfigured(config: InputNodeConfig) {
  return Boolean(config.topicName && config.topicType);
}

function isProcessConfigured(config: ProcessNodeConfig) {
  if (config.operation === "filter") {
    return Boolean(config.filterField && config.filterValue);
  }
  return true;
}

function isOutputConfigured(config: OutputNodeConfig) {
  if (config.mode === "publish") {
    return Boolean(config.targetTopic && config.targetType);
  }
  return Boolean(config.serviceName && config.serviceType);
}

function getNodeConfiguredStatus(node: WorkflowNode) {
  if (node.data.nodeType === "input") {
    return isInputConfigured(node.data.config as InputNodeConfig)
      ? "configured"
      : "idle";
  }
  if (node.data.nodeType === "process") {
    return isProcessConfigured(node.data.config as ProcessNodeConfig)
      ? "configured"
      : "idle";
  }
  return isOutputConfigured(node.data.config as OutputNodeConfig)
    ? "configured"
    : "idle";
}

function getValueAtPath(payload: any, path?: string) {
  if (!payload || !path) return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object") {
      return acc[key];
    }
    return undefined;
  }, payload);
}

export function PipelineBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>(undefined);
  const { status } = useRosStore();
  const isConnected = status === "connected";

  const topics = useTopicsStore((state) => state.topics);
  const isLoadingTopics = useTopicsStore((state) => state.isLoadingTopics);
  const getTopicsList = useTopicsStore((state) => state.getTopicsList);
  const createSubscriber = useTopicsStore((state) => state.createSubscriber);
  const removeSubscriber = useTopicsStore((state) => state.removeSubscriber);
  const subscribers = useTopicsStore((state) => state.subscribers);
  const createPublisher = useTopicsStore((state) => state.createPublisher);
  const publishMessage = useTopicsStore((state) => state.publish);
  const removePublisher = useTopicsStore((state) => state.removePublisher);

  const services = useServicesStore((state) => state.services);
  const isLoadingServices = useServicesStore(
    (state) => state.isLoadingServices
  );
  const getServicesList = useServicesStore((state) => state.getServicesList);
  const callService = useServicesStore((state) => state.callService);

  const nodesRef = useRef<Node<WorkflowNodeData>[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const statsRef = useRef<Record<string, WorkflowStats>>({});
  const nodeStatusRef = useRef<Record<string, WorkflowNodeData["status"]>>({});
  const pendingNodeIdsRef = useRef<Set<string>>(new Set());
  const messageQueueRef = useRef<MessageEvent[]>([]);
  const queueBusyRef = useRef(false);
  const lastMessageRef = useRef<Record<string, number>>({});
  const throttleRef = useRef<Record<string, number>>({});
  const aggregateRef = useRef<Record<string, any[]>>({});
  const activeSubscribersRef = useRef<Set<string>>(new Set());
  const activePublishersRef = useRef<Set<string>>(new Set());
  const liveMessagesRef = useRef<Record<string, LiveMessage[]>>({});
  const outputCounterRef = useRef<Record<string, number>>({});
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Advanced operation refs
  const operationRefsRef = useRef<OperationRefs>({
    throttle: {},
    aggregate: {},
    movingAverage: {},
    stdDev: {},
    minMax: {},
    rateOfChange: {},
    outlier: {},
    merge: {},
  });

  useEffect(() => {
    nodesRef.current = nodes;
    nodes.forEach((node) => {
      if (!statsRef.current[node.id]) {
        statsRef.current[node.id] = { ...node.data.stats };
      }
    });
    Object.keys(statsRef.current).forEach((nodeId) => {
      if (!nodes.find((node) => node.id === nodeId)) {
        delete statsRef.current[nodeId];
        delete nodeStatusRef.current[nodeId];
      }
    });
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (isConnected) {
      getTopicsList();
      getServicesList();
    }
  }, [isConnected, getTopicsList, getServicesList]);

  useEffect(() => {
    const stored = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.nodes && parsed?.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        setLastSavedAt(parsed.timestamp);
      }
    } catch (error) {
      console.error("Failed to load workflow:", error);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingNodeIdsRef.current.size === 0) return;
      const ids = Array.from(pendingNodeIdsRef.current);
      pendingNodeIdsRef.current.clear();
      setNodes((current) =>
        current.map((node) => {
          if (!ids.includes(node.id)) return node;
          const stats = statsRef.current[node.id] ?? node.data.stats;
          const status = nodeStatusRef.current[node.id] ?? node.data.status;
          return {
            ...node,
            data: {
              ...node.data,
              stats,
              status: node.data.status === "error" ? "error" : status,
            },
          };
        })
      );
    }, 400);
    return () => clearInterval(interval);
  }, [setNodes]);

  useEffect(() => {
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        animated: isRunning,
        style: {
          ...edge.style,
          stroke: isRunning ? "#0f766e" : "#94a3b8",
          strokeWidth: isRunning ? 2 : 1.5,
        },
      }))
    );
  }, [isRunning, setEdges]);

  const addLiveMessage = useCallback(
    (nodeId: string, data: any, type: LiveMessage["type"]) => {
      const message: LiveMessage = {
        timestamp: Date.now(),
        data,
        nodeId,
        type,
      };
      if (!liveMessagesRef.current[nodeId]) {
        liveMessagesRef.current[nodeId] = [];
      }
      liveMessagesRef.current[nodeId].unshift(message);
      liveMessagesRef.current[nodeId] = liveMessagesRef.current[nodeId].slice(
        0,
        10
      );
    },
    []
  );

  const getLiveMessages = useCallback((nodeId: string): LiveMessage[] => {
    return liveMessagesRef.current[nodeId] || [];
  }, []);

  const clearLiveMessages = useCallback((nodeId: string) => {
    liveMessagesRef.current[nodeId] = [];
  }, []);

  const saveHistory = useCallback(() => {
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
      timestamp: Date.now(),
    };
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    historyRef.current.push(entry);
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setNodes(entry.nodes);
      setEdges(entry.edges);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      toast.info("Undo");
    }
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setNodes(entry.nodes);
      setEdges(entry.edges);
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      toast.info("Redo");
    }
  }, [setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key === "z"
      ) {
        event.preventDefault();
        undo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "z"
      ) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const markNodeActive = useCallback((nodeId: string) => {
    const now = Date.now();
    const currentStats = statsRef.current[nodeId] || {
      ...defaultStats(),
      startedAt: now,
    };
    const startedAt = currentStats.startedAt ?? now;
    const total = currentStats.messageCount + 1;
    const elapsedSeconds = Math.max((now - startedAt) / 1000, 0.001);
    statsRef.current[nodeId] = {
      messageCount: total,
      throughput: Number((total / elapsedSeconds).toFixed(2)),
      lastUpdated: now,
      startedAt,
    };
    nodeStatusRef.current[nodeId] = "active";
    pendingNodeIdsRef.current.add(nodeId);
  }, []);

  const setNodeStatus = useCallback(
    (nodeId: string, status: WorkflowNodeData["status"]) => {
      nodeStatusRef.current[nodeId] = status;
      pendingNodeIdsRef.current.add(nodeId);
    },
    []
  );

  const buildOutputPayload = useCallback(
    (config: OutputNodeConfig, payload: any) => {
      if (!config.customMessage) return payload;
      try {
        return JSON.parse(config.customMessage);
      } catch (error) {
        toast.error("Invalid JSON in custom message");
        return payload;
      }
    },
    []
  );

  const pushToOutput = useCallback(
    (node: WorkflowNode, payload: any) => {
      const config = node.data.config as OutputNodeConfig;
      if (!config.autoPublish) return;
      const message = buildOutputPayload(config, payload);

      // Track output count for toast notifications
      if (!outputCounterRef.current[node.id]) {
        outputCounterRef.current[node.id] = 0;
      }
      outputCounterRef.current[node.id]++;

      // Add to live messages
      addLiveMessage(node.id, message, "output");

      if (
        config.mode === "publish" &&
        config.targetTopic &&
        config.targetType
      ) {
        try {
          publishMessage(config.targetTopic, message);
          // Show toast every 10th message
          if (outputCounterRef.current[node.id] % 10 === 0) {
            toast.success(
              `${node.data.label}: ${outputCounterRef.current[node.id]} messages published`
            );
          }
        } catch (error) {
          console.error("Publish error:", error);
          setNodeStatus(node.id, "error");
          toast.error(`Failed to publish to ${config.targetTopic}`);
        }
        return;
      }
      if (
        config.mode === "service" &&
        config.serviceName &&
        config.serviceType
      ) {
        callService(config.serviceName, config.serviceType, message)
          .then(() => {
            // Show toast every 10th service call
            if (outputCounterRef.current[node.id] % 10 === 0) {
              toast.success(
                `${node.data.label}: ${outputCounterRef.current[node.id]} service calls`
              );
            }
          })
          .catch((error: any) => {
            console.error("Service call error:", error);
            setNodeStatus(node.id, "error");
            toast.error(`Service call failed for ${config.serviceName}`);
          });
      }
    },
    [
      buildOutputPayload,
      publishMessage,
      callService,
      setNodeStatus,
      addLiveMessage,
    ]
  );

  const applyProcessOperation = useCallback(
    (node: WorkflowNode, payload: any) => {
      const config = node.data.config as ProcessNodeConfig;
      const refs = operationRefsRef.current;

      // Existing operations
      if (config.operation === "passThrough") {
        return payload;
      }

      if (config.operation === "throttle") {
        const lastEmit = refs.throttle[node.id] || 0;
        const minInterval = 1000 / Math.max(config.throttleHz, 1);
        if (Date.now() - lastEmit < minInterval) {
          return undefined;
        }
        refs.throttle[node.id] = Date.now();
        return payload;
      }

      if (config.operation === "filter") {
        const value = getValueAtPath(payload, config.filterField);
        if (value === undefined) return undefined;
        if (config.filterValue === undefined) return payload;

        const operator = config.filterOperator || "=";
        const filterVal = config.filterValue;

        // Try numeric comparison first
        const numValue =
          typeof value === "number" ? value : parseFloat(String(value));
        const numFilterVal = parseFloat(filterVal);

        if (!isNaN(numValue) && !isNaN(numFilterVal)) {
          switch (operator) {
            case "=":
              return numValue === numFilterVal ? payload : undefined;
            case "!=":
              return numValue !== numFilterVal ? payload : undefined;
            case ">":
              return numValue > numFilterVal ? payload : undefined;
            case "<":
              return numValue < numFilterVal ? payload : undefined;
            case ">=":
              return numValue >= numFilterVal ? payload : undefined;
            case "<=":
              return numValue <= numFilterVal ? payload : undefined;
            default:
              return undefined;
          }
        }

        // Fall back to string comparison
        const strValue = String(value);
        switch (operator) {
          case "=":
            return strValue === filterVal ? payload : undefined;
          case "!=":
            return strValue !== filterVal ? payload : undefined;
          default:
            return undefined;
        }
      }

      if (config.operation === "aggregate") {
        const windowSize = Math.max(config.aggregateWindow, 1);
        const window = refs.aggregate[node.id] || [];
        window.unshift(payload);
        refs.aggregate[node.id] = window.slice(0, windowSize);
        return {
          latest: payload,
          window: refs.aggregate[node.id],
        };
      }

      // Data Transformations
      if (config.operation === "mapField") {
        const result = applyMapField(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "mathOp") {
        const result = applyMathOp(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "stringTransform") {
        const result = applyStringTransform(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "jsonPath") {
        const result = applyJsonPath(payload, config);
        return result.error ? undefined : result.payload;
      }

      // Statistical Operations
      if (config.operation === "movingAverage") {
        const result = applyMovingAverage(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "stdDev") {
        const result = applyStdDev(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "minMax") {
        const result = applyMinMax(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "rateOfChange") {
        const result = applyRateOfChange(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "outlierDetection") {
        const result = applyOutlierDetection(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      // ROS-Specific Operations
      if (config.operation === "coordinateTransform") {
        const result = applyCoordinateTransform(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "messageSplit") {
        const result = applyMessageSplit(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "messageMerge") {
        const result = applyMessageMerge(node.id, payload, config, refs);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "timestampValidation") {
        const result = applyTimestampValidation(payload, config);
        return result.error ? undefined : result.payload;
      }

      // Advanced Filters
      if (config.operation === "rangeFilter") {
        const result = applyRangeFilter(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "regexFilter") {
        const result = applyRegexFilter(payload, config);
        return result.error ? undefined : result.payload;
      }

      if (config.operation === "multiCondition") {
        const result = applyMultiCondition(payload, config);
        return result.error ? undefined : result.payload;
      }

      return payload;
    },
    []
  );

  const runWorkflowStep = useCallback(
    (startNodeId: string, payload: any) => {
      const queue: Array<{
        nodeId: string;
        payload: any;
        visited: Set<string>;
      }> = [{ nodeId: startNodeId, payload, visited: new Set() }];
      while (queue.length) {
        const current = queue.shift();
        if (!current) continue;
        if (current.visited.has(current.nodeId)) continue;
        current.visited.add(current.nodeId);
        const node = nodesRef.current.find(
          (candidate) => candidate.id === current.nodeId
        );
        if (!node) continue;
        markNodeActive(node.id);

        // Track input messages
        if (node.data.nodeType === "input") {
          addLiveMessage(node.id, current.payload, "input");
        }

        if (node.data.nodeType === "output") {
          pushToOutput(node, current.payload);
          continue;
        }

        let nextPayload = current.payload;
        if (node.data.nodeType === "process") {
          // Track before processing
          addLiveMessage(node.id, current.payload, "process-before");
          nextPayload = applyProcessOperation(node, current.payload);
          // Track after processing
          if (nextPayload !== undefined) {
            addLiveMessage(node.id, nextPayload, "process-after");
          }
        }
        if (nextPayload === undefined) continue;

        const outgoing = edgesRef.current.filter(
          (edge) => edge.source === node.id
        );
        outgoing.forEach((edge) => {
          queue.push({
            nodeId: edge.target,
            payload: nextPayload,
            visited: new Set(current.visited),
          });
        });
      }
    },
    [applyProcessOperation, markNodeActive, pushToOutput, addLiveMessage]
  );

  const scheduleQueueProcessing = useCallback(() => {
    if (queueBusyRef.current) return;
    queueBusyRef.current = true;
    requestAnimationFrame(() => {
      while (messageQueueRef.current.length) {
        const event = messageQueueRef.current.shift();
        if (event) {
          runWorkflowStep(event.nodeId, event.payload);
        }
      }
      queueBusyRef.current = false;
    });
  }, [runWorkflowStep]);

  useEffect(() => {
    if (!isRunning) return;
    const inputNodes = nodesRef.current.filter(
      (node) => node.data.nodeType === "input"
    );
    inputNodes.forEach((node) => {
      const config = node.data.config as InputNodeConfig;
      if (!config.topicName) return;
      const subscriber = subscribers.get(config.topicName);
      const latestTimestamp = subscriber?.messages[0]?.timestamp;
      if (!latestTimestamp) return;
      if (lastMessageRef.current[node.id] === latestTimestamp) return;
      lastMessageRef.current[node.id] = latestTimestamp;
      messageQueueRef.current.push({
        nodeId: node.id,
        payload: subscriber?.messages[0]?.data,
      });
    });
    if (messageQueueRef.current.length) {
      scheduleQueueProcessing();
    }
  }, [subscribers, isRunning, scheduleQueueProcessing]);

  const addNode = useCallback(
    (type: WorkflowNodeType) => {
      const id = generateNodeId(type);
      const position = {
        x: 100 + nodes.length * 40,
        y: 80 + nodes.length * 60,
      };
      const newNode: WorkflowNode = {
        id,
        type,
        position,
        data: {
          label: `${type === "input" ? "Input" : type === "process" ? "Process" : "Output"} ${nodes.length + 1}`,
          nodeType: type,
          status: "idle",
          config: defaultConfig[type](),
          stats: defaultStats(),
          description: "",
        },
        style: { width: 320 },
      };
      setNodes((current) => [...current, newNode]);
      saveHistory();
    },
    [nodes.length, setNodes, saveHistory]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (!nodeToDuplicate) return;

      const newId = generateNodeId(nodeToDuplicate.data.nodeType);
      const duplicatedNode: WorkflowNode = {
        ...nodeToDuplicate,
        id: newId,
        position: {
          x: nodeToDuplicate.position.x + 40,
          y: nodeToDuplicate.position.y + 40,
        },
        data: {
          ...nodeToDuplicate.data,
          label: `${nodeToDuplicate.data.label} (copy)`,
          stats: defaultStats(),
          status: "idle",
        },
      };
      setNodes((current) => [...current, duplicatedNode]);
      saveHistory();
      toast.success(`Duplicated ${nodeToDuplicate.data.label}`);
    },
    [nodes, setNodes, saveHistory]
  );

  const updateLabel = useCallback(
    (nodeId: string, label: string) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    <T extends WorkflowNodeData["config"]>(
      nodeId: string,
      updater: (config: T) => T
    ) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node;
          const nextConfig = updater(node.data.config as T);
          const status =
            node.data.status === "error"
              ? "error"
              : getNodeConfiguredStatus({
                  ...node,
                  data: { ...node.data, config: nextConfig },
                });
          nodeStatusRef.current[node.id] = status;
          pendingNodeIdsRef.current.add(node.id);
          return {
            ...node,
            data: {
              ...node.data,
              config: nextConfig,
              status,
            },
          };
        })
      );
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      );
      saveHistory();
    },
    [setNodes, setEdges, saveHistory]
  );

  const updateInputConfig = useCallback(
    (nodeId: string, updater: (config: InputNodeConfig) => InputNodeConfig) =>
      updateNodeData<InputNodeConfig>(nodeId, updater),
    [updateNodeData]
  );

  const updateProcessConfig = useCallback(
    (
      nodeId: string,
      updater: (config: ProcessNodeConfig) => ProcessNodeConfig
    ) => updateNodeData<ProcessNodeConfig>(nodeId, updater),
    [updateNodeData]
  );

  const updateOutputConfig = useCallback(
    (nodeId: string, updater: (config: OutputNodeConfig) => OutputNodeConfig) =>
      updateNodeData<OutputNodeConfig>(nodeId, updater),
    [updateNodeData]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: isRunning,
            style: { stroke: isRunning ? "#0f766e" : "#94a3b8" },
          },
          eds
        )
      );
      saveHistory();
    },
    [setEdges, isRunning, saveHistory]
  );

  const saveWorkflow = useCallback(() => {
    const payload = {
      nodes,
      edges,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(payload));
    setLastSavedAt(payload.timestamp);
    toast.success("Workflow saved locally");
  }, [nodes, edges]);

  const loadWorkflow = useCallback(() => {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      toast.info("No saved workflow found");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
      setLastSavedAt(parsed.timestamp);
      toast.success("Workflow loaded");
    } catch (error) {
      toast.error("Failed to load workflow");
      console.error(error);
    }
  }, [setNodes, setEdges]);

  const validatePipeline = useCallback(() => {
    const errors: string[] = [];
    if (!nodesRef.current.length) {
      errors.push("Add at least one node to run the pipeline.");
    }
    const inputCount = nodesRef.current.filter(
      (node) => node.data.nodeType === "input"
    ).length;
    const outputCount = nodesRef.current.filter(
      (node) => node.data.nodeType === "output"
    ).length;
    if (inputCount === 0) errors.push("Add at least one input node.");
    if (outputCount === 0) errors.push("Add at least one output node.");

    nodesRef.current.forEach((node) => {
      if (
        node.data.nodeType === "input" &&
        !isInputConfigured(node.data.config as InputNodeConfig)
      ) {
        errors.push(`Configure topic info for ${node.data.label}`);
      }
      if (
        node.data.nodeType === "process" &&
        !isProcessConfigured(node.data.config as ProcessNodeConfig)
      ) {
        errors.push(`Complete process settings for ${node.data.label}`);
      }
      if (
        node.data.nodeType === "output" &&
        !isOutputConfigured(node.data.config as OutputNodeConfig)
      ) {
        errors.push(`Configure output target for ${node.data.label}`);
      }
    });

    return errors;
  }, []);

  const handleStart = useCallback(async () => {
    if (!isConnected) {
      toast.error("Connect to rosbridge to start the pipeline");
      return;
    }
    const errors = validatePipeline();
    if (errors.length) {
      toast.error("Pipeline configuration incomplete", {
        description: errors[0],
      });
      return;
    }

    statsRef.current = {};
    nodeStatusRef.current = {};
    lastMessageRef.current = {};
    throttleRef.current = {};
    aggregateRef.current = {};
    pendingNodeIdsRef.current.clear();

    for (const node of nodesRef.current) {
      statsRef.current[node.id] = { ...defaultStats(), startedAt: Date.now() };
      nodeStatusRef.current[node.id] = "configured";
      pendingNodeIdsRef.current.add(node.id);
    }

    nodesRef.current.forEach((node) => {
      if (node.data.nodeType === "input") {
        const config = node.data.config as InputNodeConfig;
        if (!config.autoStart || !config.topicName || !config.topicType) return;
        try {
          createSubscriber(config.topicName, config.topicType);
          activeSubscribersRef.current.add(config.topicName);
        } catch (error) {
          console.error("Failed to subscribe:", error);
          toast.error(`Failed to subscribe to ${config.topicName}`);
        }
      }
      if (node.data.nodeType === "output") {
        const config = node.data.config as OutputNodeConfig;
        if (
          config.mode === "publish" &&
          config.targetTopic &&
          config.targetType
        ) {
          try {
            createPublisher(config.targetTopic, config.targetType);
            activePublishersRef.current.add(config.targetTopic);
          } catch (error) {
            console.error("Failed to create publisher:", error);
            toast.error(`Failed to create publisher for ${config.targetTopic}`);
          }
        }
      }
    });

    setIsRunning(true);
    toast.success("Pipeline started");
  }, [createPublisher, createSubscriber, isConnected, validatePipeline]);

  const handleStop = useCallback(() => {
    activeSubscribersRef.current.forEach((topicName) => {
      removeSubscriber(topicName);
    });
    activeSubscribersRef.current.clear();

    activePublishersRef.current.forEach((topicName) => {
      removePublisher(topicName);
    });
    activePublishersRef.current.clear();

    // Reset output counters
    outputCounterRef.current = {};

    setIsRunning(false);
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status:
            node.data.status === "error"
              ? "error"
              : getNodeConfiguredStatus(node),
        },
      }))
    );
    toast.info("Pipeline stopped");
  }, [removePublisher, removeSubscriber, setNodes]);

  const clearWorkflow = useCallback(() => {
    if (!window.confirm("Clear the current workflow?")) return;
    handleStop();
    setNodes([]);
    setEdges([]);
    statsRef.current = {};
    nodeStatusRef.current = {};
    toast.success("Workflow cleared");
  }, [handleStop, setNodes, setEdges]);

  const contextValue = useMemo(
    () => ({
      topics,
      services,
      isRunning,
      updateInputConfig,
      updateProcessConfig,
      updateOutputConfig,
      updateLabel,
      removeNode,
      duplicateNode,
      getLiveMessages,
      clearLiveMessages,
    }),
    [
      topics,
      services,
      isRunning,
      updateInputConfig,
      updateProcessConfig,
      updateOutputConfig,
      updateLabel,
      removeNode,
      duplicateNode,
      getLiveMessages,
      clearLiveMessages,
    ]
  );

  const nodeTypes = useMemo(() => nodeTypesMap, []);

  const edgeCount = edges.length;

  return (
    <div className="space-y-4">
      <WorkflowToolbar
        onAddNode={addNode}
        onStart={handleStart}
        onStop={handleStop}
        onSave={saveWorkflow}
        onLoad={loadWorkflow}
        onClear={clearWorkflow}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        isRunning={isRunning}
        isConnected={isConnected}
        nodeCount={nodes.length}
        edgeCount={edgeCount}
        lastSaved={lastSavedAt}
      />

      <Card className="shadow-none pt-0 rounded-xl border border-teal-200">
        <CardHeader className="bg-white border-b border-teal-100 pt-6 rounded-t-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <div>
                <h3 className="text-base font-semibold text-teal-900">
                  React Flow workspace
                </h3>
                <p className="text-xs text-teal-800">
                  Drag handles to connect nodes. Animated edges indicate live
                  data flow.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${
                isRunning
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {isRunning ? "Pipeline running" : "Pipeline idle"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {(!isConnected || isLoadingTopics || isLoadingServices) && (
            <div className="px-6 pt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    {isConnected
                      ? "Loading ROS metadata..."
                      : "ROS connection required"}
                  </p>
                  <p className="text-xs text-amber-700">
                    {isConnected
                      ? "Fetching topics and services for configuration."
                      : "Connect to rosbridge from Settings to stream live data."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 720 }} className="relative">
            {nodes.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-10 text-center max-w-md">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    No nodes yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Use the toolbar to add Input, Process, and Output nodes.
                    Connect them to form a pipeline.
                  </p>
                </div>
              </div>
            )}

            <WorkflowCanvasProvider value={contextValue}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#f3f4f6" gap={20} size={1} />
                <Controls showInteractive />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === "input") return "#60a5fa";
                    if (node.type === "process") return "#a78bfa";
                    return "#34d399";
                  }}
                  maskColor="rgba(15,118,110,0.1)"
                />
                <Panel
                  position="top-right"
                  className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                    Input
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-purple-500" />
                    Process
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                    Output
                  </div>
                </Panel>
              </ReactFlow>
            </WorkflowCanvasProvider>
          </div>
        </CardContent>
      </Card>

      <PerformancePanel nodes={nodes} isRunning={isRunning} />
    </div>
  );
}
