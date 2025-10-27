import type { NodeInfo, TopicInfo, ConnectionInfo } from '@/store/rqt-graph-store'

export interface GraphNode {
  name: string
  type: 'node'
  publishedTopics: string[]
  subscribedTopics: string[]
  isSystemNode: boolean
}

export interface GraphTopic {
  name: string
  type: 'topic'
  messageType: string
  publishers: string[]
  subscribers: string[]
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  direction: 'publish' | 'subscribe'
}

export interface GraphStructure {
  nodeElements: Map<string, GraphNode>
  topicElements: Map<string, GraphTopic>
  edges: GraphEdge[]
}

// System nodes to filter out
const SYSTEM_NODES = [
  '/rosout',
  '/rosapi',
  '/rosbridge_websocket',
  '/record',
  '/play',
  '/rostopic',
  '/rosnode',
  '/rosparam'
]

export function isSystemNode (nodeName: string): boolean {
  // Check if node starts with any system node pattern
  return SYSTEM_NODES.some(sysNode => nodeName.startsWith(sysNode))
}

export function buildGraphStructure (
  nodes: NodeInfo[],
  topics: TopicInfo[],
  connections: ConnectionInfo[],
  filterSystemNodes: boolean = true,
  showTopics: boolean = true
): GraphStructure {
  const nodeElements = new Map<string, GraphNode>()
  const topicElements = new Map<string, GraphTopic>()
  const edges: GraphEdge[] = []

  // Initialize topic elements (only if showing topics)
  if (showTopics) {
    topics.forEach(topic => {
      topicElements.set(topic.name, {
        name: topic.name,
        type: 'topic',
        messageType: topic.type,
        publishers: [],
        subscribers: []
      })
    })
  }

  // Initialize node elements and build connections
  nodes.forEach(node => {
    const isSysNode = isSystemNode(node.name)
    
    // Skip system nodes if filtering is enabled
    if (filterSystemNodes && isSysNode) {
      return
    }

    const publishedTopics: string[] = []
    const subscribedTopics: string[] = []

    // Find all connections for this node
    connections.forEach(conn => {
      if (conn.node === node.name) {
        if (conn.direction === 'publish') {
          publishedTopics.push(conn.topic)
          
          if (showTopics) {
            // Update topic's publishers list
            const topicElement = topicElements.get(conn.topic)
            if (topicElement && !topicElement.publishers.includes(node.name)) {
              topicElement.publishers.push(node.name)
            }

            // Create edge: node -> topic
            edges.push({
              id: `${node.name}-pub-${conn.topic}`,
              source: node.name,
              target: conn.topic,
              direction: 'publish'
            })
          }
        } else if (conn.direction === 'subscribe') {
          subscribedTopics.push(conn.topic)
          
          if (showTopics) {
            // Update topic's subscribers list
            const topicElement = topicElements.get(conn.topic)
            if (topicElement && !topicElement.subscribers.includes(node.name)) {
              topicElement.subscribers.push(node.name)
            }

            // Create edge: topic -> node
            edges.push({
              id: `${conn.topic}-sub-${node.name}`,
              source: conn.topic,
              target: node.name,
              direction: 'subscribe'
            })
          }
        }
      }
    })

    nodeElements.set(node.name, {
      name: node.name,
      type: 'node',
      publishedTopics,
      subscribedTopics,
      isSystemNode: isSysNode
    })
  })

  // If not showing topics, create direct node-to-node connections
  if (!showTopics) {
    // Build a map of topic -> subscribers/publishers
    const topicConnections = new Map<string, { publishers: string[], subscribers: string[] }>()
    
    connections.forEach(conn => {
      if (!topicConnections.has(conn.topic)) {
        topicConnections.set(conn.topic, { publishers: [], subscribers: [] })
      }
      const topicConn = topicConnections.get(conn.topic)!
      
      if (conn.direction === 'publish' && !topicConn.publishers.includes(conn.node)) {
        topicConn.publishers.push(conn.node)
      } else if (conn.direction === 'subscribe' && !topicConn.subscribers.includes(conn.node)) {
        topicConn.subscribers.push(conn.node)
      }
    })

    // Create edges from publishers to subscribers (through common topics)
    topicConnections.forEach((conn, topicName) => {
      conn.publishers.forEach(publisher => {
        // Skip if publisher was filtered out
        if (!nodeElements.has(publisher)) return
        
        conn.subscribers.forEach(subscriber => {
          // Skip if subscriber was filtered out or if it's the same node
          if (!nodeElements.has(subscriber) || publisher === subscriber) return
          
          const edgeId = `${publisher}-${topicName}-${subscriber}`
          edges.push({
            id: edgeId,
            source: publisher,
            target: subscriber,
            direction: 'publish'
          })
        })
      })
    })
  } else {
    // Filter out topics that have no connections after filtering nodes
    const connectedTopics = new Map<string, GraphTopic>()
    topicElements.forEach((topic, name) => {
      if (topic.publishers.length > 0 || topic.subscribers.length > 0) {
        connectedTopics.set(name, topic)
      }
    })

    return {
      nodeElements,
      topicElements: connectedTopics,
      edges
    }
  }

  return {
    nodeElements,
    topicElements: new Map(), // Empty when not showing topics
    edges
  }
}

export function filterGraphBySearch (
  structure: GraphStructure,
  searchQuery: string
): GraphStructure {
  if (!searchQuery.trim()) {
    return structure
  }

  const query = searchQuery.toLowerCase()
  const filteredNodeElements = new Map<string, GraphNode>()
  const filteredTopicElements = new Map<string, GraphTopic>()
  const matchingNodeIds = new Set<string>()
  const matchingTopicIds = new Set<string>()

  // Find matching nodes
  structure.nodeElements.forEach((node, name) => {
    if (name.toLowerCase().includes(query)) {
      matchingNodeIds.add(name)
      filteredNodeElements.set(name, node)
    }
  })

  // Find matching topics
  structure.topicElements.forEach((topic, name) => {
    if (name.toLowerCase().includes(query) || topic.messageType.toLowerCase().includes(query)) {
      matchingTopicIds.add(name)
      filteredTopicElements.set(name, topic)
    }
  })

  // Filter edges to only include those connected to matching nodes/topics
  const filteredEdges = structure.edges.filter(edge => {
    const sourceMatches = matchingNodeIds.has(edge.source) || matchingTopicIds.has(edge.source)
    const targetMatches = matchingNodeIds.has(edge.target) || matchingTopicIds.has(edge.target)
    return sourceMatches && targetMatches
  })

  return {
    nodeElements: filteredNodeElements,
    topicElements: filteredTopicElements,
    edges: filteredEdges
  }
}

