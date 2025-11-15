"use client";

import React, { createContext, useContext } from "react";
import type { TopicInfo } from "@/store/topic-store";
import type { ServiceInfo } from "@/store/service-store";
import type {
  InputNodeConfig,
  OutputNodeConfig,
  ProcessNodeConfig,
  HumanInterventionNodeConfig,
  LiveMessage,
} from "./types";

export interface WorkflowCanvasContextValue {
  topics: TopicInfo[];
  services: ServiceInfo[];
  isRunning: boolean;
  expandedNodeId: string | null;
  setExpandedNode: (nodeId: string | null) => void;
  updateInputConfig: (
    nodeId: string,
    updater: (config: InputNodeConfig) => InputNodeConfig
  ) => void;
  updateProcessConfig: (
    nodeId: string,
    updater: (config: ProcessNodeConfig) => ProcessNodeConfig
  ) => void;
  updateOutputConfig: (
    nodeId: string,
    updater: (config: OutputNodeConfig) => OutputNodeConfig
  ) => void;
  updateHumanInterventionConfig: (
    nodeId: string,
    updater: (
      config: HumanInterventionNodeConfig
    ) => HumanInterventionNodeConfig
  ) => void;
  updateLabel: (nodeId: string, label: string) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  approveNode: (nodeId: string) => void;
  rejectNode: (nodeId: string) => void;
  getLiveMessages: (nodeId: string) => LiveMessage[];
  clearLiveMessages: (nodeId: string) => void;
}

export const WorkflowCanvasContext =
  createContext<WorkflowCanvasContextValue | null>(null);

interface WorkflowCanvasProviderProps {
  value: WorkflowCanvasContextValue;
  children: React.ReactNode;
}

export function WorkflowCanvasProvider({
  value,
  children,
}: WorkflowCanvasProviderProps) {
  return (
    <WorkflowCanvasContext.Provider value={value}>
      {children}
    </WorkflowCanvasContext.Provider>
  );
}

export function useWorkflowCanvas() {
  const context = useContext(WorkflowCanvasContext);
  if (!context) {
    throw new Error(
      "useWorkflowCanvas must be used inside a WorkflowCanvasProvider"
    );
  }
  return context;
}
