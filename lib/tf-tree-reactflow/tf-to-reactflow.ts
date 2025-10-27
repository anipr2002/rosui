import type { Node, Edge } from 'reactflow'
import type { TFTransform } from '@/store/tf-store'
import type { TreeStructure } from '@/lib/tf-tree-reactflow/tf-tree-builder'

export interface TFNodeData {
  frame: string
  transform: TFTransform | null
  isRoot: boolean
  isStatic: boolean
  age: number
  level: number
}

export function convertToReactFlow (
  structure: TreeStructure,
  lastUpdate: Map<string, number>
): { nodes: Node<TFNodeData>[]; edges: Edge[] } {
  const nodes: Node<TFNodeData>[] = []
  const edges: Edge[] = []
  const now = Date.now()

  // Create nodes
  structure.nodes.forEach((treeNode, frame) => {
    const lastUpdateTime = lastUpdate.get(
      treeNode.transform
        ? `${treeNode.transform.parent}->${treeNode.transform.child}`
        : ''
    ) || 0
    const age = now - lastUpdateTime

    nodes.push({
      id: frame,
      type: 'tfNode',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        frame,
        transform: treeNode.transform,
        isRoot: treeNode.isRoot,
        isStatic: treeNode.transform?.isStatic || false,
        age,
        level: treeNode.level
      }
    })

    // Create edges from parent to children
    treeNode.children.forEach((child) => {
      const childNode = structure.nodes.get(child)
      const transform = childNode?.transform

      if (transform) {
        // Calculate distance for edge label
        const distance = Math.sqrt(
          transform.translation.x ** 2 +
            transform.translation.y ** 2 +
            transform.translation.z ** 2
        )

        // Determine if edge should be animated (fresh update)
        const edgeAge = now - (lastUpdate.get(`${frame}->${child}`) || 0)
        const isAnimated = edgeAge < 1000 // Less than 1 second

        edges.push({
          id: `${frame}-${child}`,
          source: frame,
          target: child,
          animated: isAnimated,
          label: distance > 0.01 ? `${distance.toFixed(2)}m` : undefined,
          style: {
            stroke: transform.isStatic ? '#94a3b8' : '#3b82f6',
            strokeWidth: 2
          },
          labelStyle: {
            fontSize: 10,
            fill: '#64748b'
          }
        })
      }
    })
  })

  return { nodes, edges }
}

export function getFreshnessColor (age: number): string {
  if (age < 1000) return '#22c55e' // green - fresh
  if (age < 5000) return '#eab308' // yellow - stale
  if (age < 10000) return '#f97316' // orange - old
  return '#ef4444' // red - very old
}

export function getFreshnessLabel (age: number): string {
  if (age < 1000) return 'Fresh'
  if (age < 5000) return 'Recent'
  if (age < 10000) return 'Stale'
  return 'Very Old'
}

