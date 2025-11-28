import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export type WorkflowNodeData = {
  label: string;
  category: 'trigger' | 'logic' | 'action' | 'integration';
  // Specific fields
  topicName?: string;
  messageType?: string;
  paramName?: string;
  paramValue?: string | number | boolean;
  paramType?: 'int' | 'float' | 'bool' | 'string';
  prompt?: string;
  allowInput?: boolean;
  
  // New Fields
  interval?: number;
  script?: string;
  scriptLanguage?: string;
  qos?: number;
  messageData?: string;
  serviceName?: string;
  serviceType?: string;
  requestData?: string;
  webhookUrl?: string;
  recipient?: string;
  subject?: string;
  body?: string;

  // Status
  status?: 'idle' | 'queued' | 'running' | 'success' | 'failure' | 'skipped';
  [key: string]: any;
};

export type WorkflowNode = Node<WorkflowNodeData>;

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNode: WorkflowNode | null;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  saveWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (node: WorkflowNode) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  removeNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },

  setSelectedNode: (nodeId: string | null) => {
    if (!nodeId) {
      set({ selectedNode: null });
      return;
    }
    const node = get().nodes.find((n) => n.id === nodeId);
    set({ selectedNode: node || null });
  },

  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: { ...node.data, ...data },
          };
          // Update selected node if it's the one being modified
          if (get().selectedNode?.id === nodeId) {
             // We need to set selectedNode as well to reflect changes in the panel immediately if we were using that state directly,
             // but usually components subscribe to the node in the list. 
             // However, let's keep selectedNode in sync just in case.
             set({ selectedNode: updatedNode });
          }
          return updatedNode;
        }
        return node;
      }),
    });
  },

  saveWorkflow: () => {
    const { nodes, edges } = get();
    const workflow = { nodes, edges };
    console.log('Saving Workflow:', JSON.stringify(workflow, null, 2));
  },
}));
