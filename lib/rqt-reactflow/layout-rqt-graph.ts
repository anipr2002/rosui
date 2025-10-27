import dagre from 'dagre'
import type { Node, Edge } from 'reactflow'

export type LayoutDirection = 'TB' | 'LR'

export function getLayoutedElements (
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const nodeWidth = 220
  const nodeHeight = 60
  const topicWidth = 160
  const topicHeight = 50

  // Use more aggressive spacing for cleaner layout
  dagreGraph.setGraph({
    rankdir: direction,
    align: 'UL', // Align nodes to upper left for cleaner layout
    nodesep: 80, // Increased horizontal spacing between nodes
    ranksep: 150, // Increased vertical spacing between ranks
    edgesep: 30, // Space between edges
    marginx: 50,
    marginy: 50,
    ranker: 'longest-path' // Better ranking algorithm for cleaner hierarchies
  })

  // Add nodes to dagre graph with appropriate dimensions
  nodes.forEach((node) => {
    const isTopic = node.type === 'rosTopic'
    dagreGraph.setNode(node.id, {
      width: isTopic ? topicWidth : nodeWidth,
      height: isTopic ? topicHeight : nodeHeight
    })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const isTopic = node.type === 'rosTopic'
    const width = isTopic ? topicWidth : nodeWidth
    const height = isTopic ? topicHeight : nodeHeight

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

