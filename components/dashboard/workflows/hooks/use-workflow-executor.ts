import { useCallback, useEffect, useRef } from 'react'
import { Edge } from 'reactflow'
import { useWorkflowStore, WorkflowNode, WorkflowNodeData } from '../store/workflow-store'
import { useExecutionStore, getDownstreamNodes, NodeExecutionStatus } from '../store/execution-store'
import { useTopicsStore } from '@/store/topic-store'
import { useServicesStore } from '@/store/service-store'
import { useParamsStore } from '@/store/param-store'
import { useRosStore } from '@/store/ros-store'
import * as ROSLIB from 'roslib'

interface ExecutorOptions {
  onNodeStart?: (nodeId: string) => void
  onNodeComplete?: (nodeId: string, success: boolean, output?: any) => void
  onExecutionComplete?: (success: boolean) => void
  onError?: (nodeId: string, error: string) => void
}

export function useWorkflowExecutor(options: ExecutorOptions = {}) {
  const { onNodeStart, onNodeComplete, onExecutionComplete, onError } = options
  
  // Workflow state
  const { nodes, edges, updateNodeData } = useWorkflowStore()
  
  // Execution state
  const {
    executionState,
    currentContext,
    nodeResults,
    executionQueue,
    triggers,
    triggersArmed,
    startExecution,
    pauseExecution,
    resumeExecution,
    stopExecution,
    setNodeStatus,
    getNextNode,
    advanceQueue,
    setVariable,
    getVariable,
    setTriggerData,
    registerTrigger,
    unregisterTrigger,
    armTriggers,
    disarmTriggers,
    fireTrigger,
    reset
  } = useExecutionStore()
  
  // ROS stores
  const ros = useRosStore(state => state.ros)
  const topicsStore = useTopicsStore()
  const servicesStore = useServicesStore()
  const paramsStore = useParamsStore()
  
  // Refs for cleanup
  const executionLoopRef = useRef<boolean>(false)
  const topicSubscriptionsRef = useRef<Map<string, ROSLIB.Topic>>(new Map())
  const intervalIdsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Execute a single node
  const executeNode = useCallback(async (node: WorkflowNode): Promise<{ success: boolean; output?: any; error?: string }> => {
    const { data } = node
    
    try {
      switch (data.label) {
        // === TRIGGERS ===
        case 'Topic Monitor':
          // Triggers don't execute - they fire and pass data
          return { success: true, output: currentContext?.triggerData }
        
        case 'Interval':
          return { success: true, output: { timestamp: Date.now() } }
        
        case 'Manual Trigger':
          return { success: true, output: { triggered: true, timestamp: Date.now() } }
        
        // === LOGIC ===
        case 'Filter/Script':
          return await executeFilterScript(data, currentContext?.triggerData)
        
        case 'AI Processor':
          // TODO: Integrate with Inngest for AI processing
          return { success: true, output: { message: 'AI processing via Inngest - not yet implemented' } }
        
        // === ROS ACTIONS ===
        case 'Publish Topic':
          return await executePublishTopic(data)
        
        case 'Call Service':
          return await executeCallService(data)
        
        case 'Set Param':
          return await executeSetParam(data)
        
        case 'Get Param':
          return await executeGetParam(data)
        
        case 'Delete Param':
          return await executeDeleteParam(data)
        
        // === INTEGRATIONS ===
        case 'Slack':
        case 'Discord':
        case 'Email':
          // TODO: Integrate with Inngest for integrations
          return { success: true, output: { message: `${data.label} integration via Inngest - not yet implemented` } }
        
        default:
          return { success: true, output: null }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [currentContext])

  // Execute Filter/Script node
  const executeFilterScript = async (
    data: WorkflowNodeData,
    triggerData: any
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    try {
      const script = data.script || 'return true'
      const language = data.scriptLanguage || 'javascript'
      
      if (language !== 'javascript') {
        return { success: false, error: `Script language ${language} not supported in browser` }
      }
      
      // Create a safe execution context
      const fn = new Function('msg', 'context', `
        'use strict';
        ${script}
      `)
      
      const result = fn(triggerData, {
        getVariable,
        setVariable
      })
      
      // If result is falsy, skip downstream nodes
      if (!result) {
        return { success: true, output: { filtered: true, passed: false } }
      }
      
      return { success: true, output: { filtered: true, passed: true, result } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Script execution failed'
      return { success: false, error: errorMessage }
    }
  }

  // Execute Publish Topic action
  const executePublishTopic = async (
    data: WorkflowNodeData
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    if (!ros) {
      return { success: false, error: 'ROS connection not available' }
    }
    
    const { topicName, messageType, messageData } = data
    
    if (!topicName || !messageType) {
      return { success: false, error: 'Topic name and message type are required' }
    }
    
    try {
      // Parse message data
      let message: any = {}
      if (messageData) {
        try {
          message = JSON.parse(messageData)
        } catch {
          return { success: false, error: 'Invalid JSON in message data' }
        }
      }
      
      // Create publisher if not exists
      topicsStore.createPublisher(topicName, messageType)
      
      // Publish message
      topicsStore.publish(topicName, message)
      
      return { success: true, output: { published: true, topic: topicName, message } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish'
      return { success: false, error: errorMessage }
    }
  }

  // Execute Call Service action
  const executeCallService = async (
    data: WorkflowNodeData
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    if (!ros) {
      return { success: false, error: 'ROS connection not available' }
    }
    
    const { serviceName, serviceType, requestData } = data
    
    if (!serviceName || !serviceType) {
      return { success: false, error: 'Service name and type are required' }
    }
    
    try {
      // Parse request data
      let request: any = {}
      if (requestData) {
        try {
          request = JSON.parse(requestData)
        } catch {
          return { success: false, error: 'Invalid JSON in request data' }
        }
      }
      
      // Call service
      const response = await servicesStore.callService(serviceName, serviceType, request)
      
      return { success: true, output: { service: serviceName, response } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Service call failed'
      return { success: false, error: errorMessage }
    }
  }

  // Execute Set Param action
  const executeSetParam = async (
    data: WorkflowNodeData
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    if (!ros) {
      return { success: false, error: 'ROS connection not available' }
    }
    
    const { paramName, paramValue, paramType } = data
    
    if (!paramName) {
      return { success: false, error: 'Parameter name is required' }
    }
    
    try {
      // Convert value to proper type
      let value: any = paramValue
      switch (paramType) {
        case 'int':
          value = parseInt(String(paramValue), 10)
          break
        case 'float':
          value = parseFloat(String(paramValue))
          break
        case 'bool':
          value = paramValue === true || paramValue === 'true'
          break
        case 'string':
        default:
          value = String(paramValue)
      }
      
      await paramsStore.setParamValue(paramName, value)
      
      return { success: true, output: { param: paramName, value } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set parameter'
      return { success: false, error: errorMessage }
    }
  }

  // Execute Get Param action
  const executeGetParam = async (
    data: WorkflowNodeData
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    if (!ros) {
      return { success: false, error: 'ROS connection not available' }
    }
    
    const { paramName } = data
    
    if (!paramName) {
      return { success: false, error: 'Parameter name is required' }
    }
    
    try {
      const value = await paramsStore.getParamValue(paramName)
      
      // Store in context for downstream nodes
      setVariable(`param_${paramName}`, value)
      
      return { success: true, output: { param: paramName, value } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get parameter'
      return { success: false, error: errorMessage }
    }
  }

  // Execute Delete Param action
  const executeDeleteParam = async (
    data: WorkflowNodeData
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    if (!ros) {
      return { success: false, error: 'ROS connection not available' }
    }
    
    const { paramName } = data
    
    if (!paramName) {
      return { success: false, error: 'Parameter name is required' }
    }
    
    try {
      await paramsStore.deleteParam(paramName)
      
      return { success: true, output: { param: paramName, deleted: true } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete parameter'
      return { success: false, error: errorMessage }
    }
  }

  // Main execution loop
  const runExecutionLoop = useCallback(async () => {
    if (executionLoopRef.current) return
    executionLoopRef.current = true
    
    try {
      while (executionQueue.length > 0 && executionState === 'running') {
        const nextNodeId = getNextNode()
        if (!nextNodeId) break
        
        const node = nodes.find(n => n.id === nextNodeId)
        if (!node) {
          advanceQueue()
          continue
        }
        
        // Update node status to running
        setNodeStatus(nextNodeId, 'running')
        updateNodeData(nextNodeId, { status: 'running' })
        onNodeStart?.(nextNodeId)
        
        // Execute the node
        const result = await executeNode(node)
        
        // Update node status based on result
        const finalStatus: NodeExecutionStatus = result.success ? 'success' : 'failure'
        setNodeStatus(nextNodeId, finalStatus, result.output, result.error)
        updateNodeData(nextNodeId, { status: result.success ? 'success' : 'failure' })
        
        onNodeComplete?.(nextNodeId, result.success, result.output)
        
        if (!result.success) {
          onError?.(nextNodeId, result.error || 'Unknown error')
        }
        
        // Store output in context for downstream nodes
        if (result.output) {
          setVariable(`node_${nextNodeId}_output`, result.output)
        }
        
        // Check if this was a filter that didn't pass
        if (node.data.label === 'Filter/Script' && result.output?.passed === false) {
          // Skip downstream nodes
          const downstream = getDownstreamNodes(nextNodeId, nodes, edges)
          downstream.forEach(id => {
            setNodeStatus(id, 'skipped')
            updateNodeData(id, { status: 'idle' })
          })
          // Remove skipped nodes from queue
          break
        }
        
        advanceQueue()
        
        // Small delay between nodes for visual feedback
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Execution complete
      const hasFailures = Array.from(nodeResults.values()).some(r => r.status === 'failure')
      onExecutionComplete?.(!hasFailures)
      
    } finally {
      executionLoopRef.current = false
    }
  }, [
    executionQueue,
    executionState,
    nodes,
    edges,
    getNextNode,
    advanceQueue,
    executeNode,
    setNodeStatus,
    updateNodeData,
    setVariable,
    nodeResults,
    onNodeStart,
    onNodeComplete,
    onExecutionComplete,
    onError
  ])

  // Watch for running state changes
  useEffect(() => {
    if (executionState === 'running' && !executionLoopRef.current) {
      runExecutionLoop()
    }
  }, [executionState, runExecutionLoop])

  // Setup topic triggers
  const setupTopicTrigger = useCallback((node: WorkflowNode) => {
    if (!ros || !node.data.topicName || !node.data.messageType) return
    
    const topic = new ROSLIB.Topic({
      ros,
      name: node.data.topicName,
      messageType: node.data.messageType
    })
    
    const handleMessage = (message: any) => {
      if (triggersArmed && executionState !== 'running') {
        fireTrigger(node.id, message)
        
        // Start execution from this trigger's downstream nodes
        const downstream = getDownstreamNodes(node.id, nodes, edges)
        if (downstream.length > 0) {
          startExecution(nodes, edges)
        }
      }
    }
    
    topic.subscribe(handleMessage)
    topicSubscriptionsRef.current.set(node.id, topic)
    
    registerTrigger({
      nodeId: node.id,
      type: 'topic',
      config: {
        topicName: node.data.topicName,
        messageType: node.data.messageType
      },
      active: true,
      unsubscribe: () => topic.unsubscribe()
    })
  }, [ros, triggersArmed, executionState, nodes, edges, fireTrigger, registerTrigger, startExecution])

  // Setup interval triggers
  const setupIntervalTrigger = useCallback((node: WorkflowNode) => {
    const interval = node.data.interval || 1000
    
    const intervalId = setInterval(() => {
      if (triggersArmed && executionState !== 'running') {
        fireTrigger(node.id, { timestamp: Date.now() })
        
        // Start execution
        startExecution(nodes, edges)
      }
    }, interval)
    
    intervalIdsRef.current.set(node.id, intervalId)
    
    registerTrigger({
      nodeId: node.id,
      type: 'interval',
      config: { interval },
      active: true,
      intervalId
    })
  }, [triggersArmed, executionState, nodes, edges, fireTrigger, registerTrigger, startExecution])

  // Arm all triggers
  const arm = useCallback(() => {
    // Find all trigger nodes
    const triggerNodes = nodes.filter(n => n.data.category === 'trigger')
    
    triggerNodes.forEach(node => {
      switch (node.data.label) {
        case 'Topic Monitor':
          setupTopicTrigger(node)
          break
        case 'Interval':
          setupIntervalTrigger(node)
          break
        case 'Manual Trigger':
          registerTrigger({
            nodeId: node.id,
            type: 'manual',
            config: {},
            active: true
          })
          break
      }
    })
    
    armTriggers()
  }, [nodes, setupTopicTrigger, setupIntervalTrigger, registerTrigger, armTriggers])

  // Disarm all triggers
  const disarm = useCallback(() => {
    // Clean up topic subscriptions
    topicSubscriptionsRef.current.forEach(topic => {
      topic.unsubscribe()
    })
    topicSubscriptionsRef.current.clear()
    
    // Clean up intervals
    intervalIdsRef.current.forEach(intervalId => {
      clearInterval(intervalId)
    })
    intervalIdsRef.current.clear()
    
    disarmTriggers()
  }, [disarmTriggers])

  // Manual trigger fire
  const fireManualTrigger = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.data.label !== 'Manual Trigger') return
    
    fireTrigger(nodeId, { manual: true, timestamp: Date.now() })
    startExecution(nodes, edges)
  }, [nodes, edges, fireTrigger, startExecution])

  // Start workflow manually (runs all nodes)
  const start = useCallback(() => {
    // Reset all node statuses
    nodes.forEach(node => {
      updateNodeData(node.id, { status: 'idle' })
    })
    
    startExecution(nodes, edges)
  }, [nodes, edges, startExecution, updateNodeData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disarm()
      reset()
    }
  }, [])

  return {
    // State
    executionState,
    triggersArmed,
    currentContext,
    nodeResults,
    
    // Manual controls
    start,
    pause: pauseExecution,
    resume: resumeExecution,
    stop: stopExecution,
    
    // Trigger controls
    arm,
    disarm,
    fireManualTrigger,
    
    // Reset
    reset: () => {
      disarm()
      reset()
      nodes.forEach(node => {
        updateNodeData(node.id, { status: 'idle' })
      })
    }
  }
}

