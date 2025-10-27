import type { Node, Edge } from 'reactflow'
import type { GraphStructure, GraphNode, GraphTopic } from './rqt-graph-builder'

export interface RQTNodeData {
  name: string
  elementType: 'node' | 'topic'
  nodeInfo?: GraphNode
  topicInfo?: GraphTopic
}

export function convertToReactFlow (
  structure: GraphStructure
): { nodes: Node<RQTNodeData>[]; edges: Edge[] } {
  const nodes: Node<RQTNodeData>[] = []
  const edges: Edge[] = []

  // Create nodes for ROS nodes (rectangular)
  structure.nodeElements.forEach((nodeInfo, name) => {
    nodes.push({
      id: name,
      type: 'rosNode',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        name,
        elementType: 'node',
        nodeInfo
      }
    })
  })

  // Create nodes for topics (elliptical)
  structure.topicElements.forEach((topicInfo, name) => {
    nodes.push({
      id: name,
      type: 'rosTopic',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        name,
        elementType: 'topic',
        topicInfo
      }
    })
  })

  // Create edges with simpler styling like rqt_graph
  structure.edges.forEach(edge => {
    const edgeStyle = edge.direction === 'publish'
      ? {
          stroke: '#374151', // dark gray for publish
          strokeWidth: 1.5
        }
      : {
          stroke: '#374151', // dark gray for subscribe
          strokeWidth: 1.5
        }

    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'straight',
      animated: false,
      style: edgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        width: 15,
        height: 15,
        color: edgeStyle.stroke
      }
    })
  })

  return { nodes, edges }
}

export function getNodeTypeColor (nodeInfo: GraphNode): string {
  const hasBoth = nodeInfo.publishedTopics.length > 0 && nodeInfo.subscribedTopics.length > 0
  
  if (hasBoth) return '#9333ea' // purple - both pub and sub
  if (nodeInfo.publishedTopics.length > 0) return '#3b82f6' // blue - publisher
  if (nodeInfo.subscribedTopics.length > 0) return '#10b981' // green - subscriber
  return '#6b7280' // gray - no connections
}

export function getNodeTypeLabel (nodeInfo: GraphNode): string {
  const hasBoth = nodeInfo.publishedTopics.length > 0 && nodeInfo.subscribedTopics.length > 0
  
  if (hasBoth) return 'Pub/Sub'
  if (nodeInfo.publishedTopics.length > 0) return 'Publisher'
  if (nodeInfo.subscribedTopics.length > 0) return 'Subscriber'
  return 'Node'
}

