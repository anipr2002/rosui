'use client'

import React, { useCallback, useRef } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useWorkflowStore, WorkflowNode } from './store/workflow-store'
import { useWorkflowExecutor } from './hooks/use-workflow-executor'
import { nodeTypes } from './nodes/node-types'
import Sidebar from './sidebar'
import PropertiesPanel from './properties-panel'
import { WorkflowToolbarMini } from './workflow-toolbar'
import { Button } from '@/components/ui/button'
import { Save, Zap } from 'lucide-react'
import { toast } from 'sonner'

const WorkflowEditorContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNode, saveWorkflow } = useWorkflowStore()
  const { project } = useReactFlow()

  // Initialize the executor
  const {
    executionState,
    triggersArmed,
    start,
    pause,
    resume,
    stop,
    arm,
    disarm,
    reset,
    fireManualTrigger
  } = useWorkflowExecutor({
    onNodeStart: (nodeId) => {
      console.log(`Node started: ${nodeId}`)
    },
    onNodeComplete: (nodeId, success, output) => {
      if (success) {
        console.log(`Node completed: ${nodeId}`, output)
      } else {
        toast.error(`Node ${nodeId} failed`)
      }
    },
    onExecutionComplete: (success) => {
      if (success) {
        toast.success('Workflow completed successfully')
      } else {
        toast.error('Workflow completed with errors')
      }
    },
    onError: (nodeId, error) => {
      console.error(`Node ${nodeId} error:`, error)
      toast.error(`Error in node: ${error}`)
    }
  })

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow/type')
      const label = event.dataTransfer.getData('application/reactflow/label')
      const category = event.dataTransfer.getData('application/reactflow/category')

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const position = project({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      })

      const newNode: WorkflowNode = {
        id: `${type}-${Date.now()}`,
        type: 'custom', // using our custom node type
        position,
        data: { label, category: category as any, status: 'idle' },
      }

      addNode(newNode)
    },
    [project, addNode]
  )

  // Handle node click - check for manual trigger
  const handleNodeClick = useCallback((_: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node.id)
    
    // If it's a manual trigger and triggers are armed, fire it
    if (node.data.label === 'Manual Trigger' && triggersArmed) {
      fireManualTrigger(node.id)
      toast.info('Manual trigger fired!')
    }
  }, [setSelectedNode, triggersArmed, fireManualTrigger])

  const hasNodes = nodes.length > 0

  return (
    <div className="flex h-[calc(100vh-100px)] w-full border rounded-xl overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={(instance) => console.log('flow loaded:', instance)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          fitView
        >
          <Controls />
          <Background color="#aaa" gap={16} />
          <MiniMap 
            nodeColor={(n) => {
              // Color based on status first
              if (n.data.status === 'running') return '#eab308' // yellow
              if (n.data.status === 'success') return '#22c55e' // green
              if (n.data.status === 'failure') return '#ef4444' // red
              // Then by category
              if (n.data.category === 'trigger') return '#3b82f6' // blue
              if (n.data.category === 'logic') return '#a855f7' // purple
              if (n.data.category === 'action') return '#f97316' // orange
              if (n.data.category === 'integration') return '#22c55e' // green
              return '#e5e7eb'
            }} 
          />
          
          {/* Execution Toolbar - Top Left */}
          <Panel position="top-left">
            <WorkflowToolbarMini
              executionState={executionState}
              triggersArmed={triggersArmed}
              hasNodes={hasNodes}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onArm={arm}
              onDisarm={disarm}
              onReset={reset}
            />
          </Panel>

          {/* Save Button - Top Right */}
          <Panel position="top-right" className="mr-12">
            <Button onClick={saveWorkflow} size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              Save Workflow
            </Button>
          </Panel>

          {/* Trigger Status Indicator */}
          {triggersArmed && (
            <Panel position="bottom-left">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Triggers Armed - Listening for events</span>
              </div>
            </Panel>
          )}
        </ReactFlow>
        <PropertiesPanel />
      </div>
    </div>
  )
}

const WorkflowEditor = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent />
    </ReactFlowProvider>
  )
}

export default WorkflowEditor
