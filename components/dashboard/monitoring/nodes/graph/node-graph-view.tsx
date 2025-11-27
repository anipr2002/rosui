'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useLifecycleNodesStore } from '@/store/lifecycle-nodes-store'
import { useRQTGraphStore } from '@/store/rqt-graph-store'
import { NodeControls } from './node-controls'
import { NodeDetailsPanel } from './node-details-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Cpu,
  Circle,
  Upload,
  Download,
  Loader2
} from 'lucide-react'

interface NodeItem {
  name: string
  fullPath: string
  publications: string[]
  subscriptions: string[]
  isLifecycleNode: boolean
}

export function AllNodesView() {
  const {
    nodes: lifecycleNodes,
    selectedNodeName,
    selectNode,
    fetchNodeDetails
  } = useLifecycleNodesStore()

  const {
    nodes: rqtNodes,
    topics,
    connections,
    isLoading: isLoadingGraph,
    fetchGraphData
  } = useRQTGraphStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterSystemNodes, setFilterSystemNodes] = useState(true)
  const [showTopics, setShowTopics] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Fetch graph data on mount
  useEffect(() => {
    if (rqtNodes.length === 0) {
      fetchGraphData()
    }
  }, [fetchGraphData, rqtNodes.length])

  // Build enhanced node list with connections
  const allNodes = useMemo<NodeItem[]>(() => {
    return rqtNodes.map((node) => {
      const nodeConnections = connections.filter((c) => c.node === node.name)
      const publications = nodeConnections
        .filter((c) => c.direction === 'publish')
        .map((c) => c.topic)
      const subscriptions = nodeConnections
        .filter((c) => c.direction === 'subscribe')
        .map((c) => c.topic)

      const lifecycleNode = lifecycleNodes.get(node.name)

      return {
        name: node.name.split('/').pop() || node.name,
        fullPath: node.name,
        publications,
        subscriptions,
        isLifecycleNode: !!lifecycleNode?.isLifecycleNode
      }
    })
  }, [rqtNodes, connections, lifecycleNodes])

  // Filter nodes
  const filteredNodes = useMemo(() => {
    let filtered = allNodes

    // Filter system nodes
    if (filterSystemNodes) {
      filtered = filtered.filter((node) => {
        const systemPrefixes = ['/rosout', '/rosapi', '/_', '/parameter_events']
        return !systemPrefixes.some((prefix) => node.fullPath.startsWith(prefix))
      })
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.fullPath.toLowerCase().includes(query) ||
          node.publications.some((p) => p.toLowerCase().includes(query)) ||
          node.subscriptions.some((s) => s.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [allNodes, filterSystemNodes, searchQuery])

  // Get unique topics if showTopics is enabled
  const visibleTopics = useMemo(() => {
    if (!showTopics) return []
    
    const topicSet = new Set<string>()
    filteredNodes.forEach((node) => {
      node.publications.forEach((t) => topicSet.add(t))
      node.subscriptions.forEach((t) => topicSet.add(t))
    })
    
    return Array.from(topicSet).sort()
  }, [filteredNodes, showTopics])

  // Get selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeName) return null
    return lifecycleNodes.get(selectedNodeName)
  }, [selectedNodeName, lifecycleNodes])

  const handleNodeClick = useCallback(async (fullPath: string) => {
    if (selectedNodeName === fullPath) {
      selectNode(null)
    } else {
      selectNode(fullPath)
      setIsLoadingDetails(true)
      await fetchNodeDetails(fullPath)
      setIsLoadingDetails(false)
    }
  }, [selectedNodeName, selectNode, fetchNodeDetails])

  const handleRefresh = () => {
    fetchGraphData()
  }

  if (isLoadingGraph && rqtNodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading nodes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <NodeControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterSystemNodes={filterSystemNodes}
        onFilterSystemNodesChange={setFilterSystemNodes}
        showTopics={showTopics}
        onShowTopicsChange={setShowTopics}
        selectedNodePath={selectedNodeName}
        onRefresh={handleRefresh}
        isLoading={isLoadingGraph}
      />

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-4 w-4" />
          <span>{filteredNodes.length} nodes</span>
        </div>
        {showTopics && (
          <div className="flex items-center gap-1.5">
            <Circle className="h-4 w-4" />
            <span>{visibleTopics.length} topics</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node list */}
        <div className={`${selectedNodeName ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredNodes.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                No Nodes Found
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search query' : 'No nodes available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TooltipProvider>
                {filteredNodes.map((node) => (
                  <Card
                    key={node.fullPath}
                    className={`shadow-none rounded-xl cursor-pointer transition-all hover:border-indigo-300 ${
                      selectedNodeName === node.fullPath
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleNodeClick(node.fullPath)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Node header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h4 className="font-medium text-sm truncate cursor-help">
                                  {node.name}
                                </h4>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{node.fullPath}</p>
                              </TooltipContent>
                            </Tooltip>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {node.fullPath}
                            </p>
                          </div>
                          {node.isLifecycleNode && (
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs flex-shrink-0">
                              Lifecycle
                            </Badge>
                          )}
                        </div>

                        {/* Connection counts */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-green-700">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{node.publications.length} pub</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <Download className="h-3.5 w-3.5" />
                            <span>{node.subscriptions.length} sub</span>
                          </div>
                        </div>

                        {/* Topics preview */}
                        {showTopics && (node.publications.length > 0 || node.subscriptions.length > 0) && (
                          <div className="space-y-1.5">
                            {node.publications.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {node.publications.slice(0, 3).map((topic) => (
                                  <Badge
                                    key={topic}
                                    variant="outline"
                                    className="text-xs font-mono bg-green-50 text-green-700 border-green-200"
                                  >
                                    {topic.length > 20 ? `...${topic.slice(-17)}` : topic}
                                  </Badge>
                                ))}
                                {node.publications.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{node.publications.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {node.subscriptions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {node.subscriptions.slice(0, 3).map((topic) => (
                                  <Badge
                                    key={topic}
                                    variant="outline"
                                    className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {topic.length > 20 ? `...${topic.slice(-17)}` : topic}
                                  </Badge>
                                ))}
                                {node.subscriptions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{node.subscriptions.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Details panel */}
        {selectedNodeName && (
          <div className="lg:col-span-1">
            <NodeDetailsPanel
              nodeName={selectedNodeName.split('/').pop() || selectedNodeName}
              nodeFullPath={selectedNodeName}
              details={selectedNode?.details || null}
              isLoading={isLoadingDetails}
              onClose={() => selectNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

