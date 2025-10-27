import type { TFTransform } from '@/store/tf-store'

export interface TreeNode {
  frame: string
  parent: string | null
  children: string[]
  transform: TFTransform | null
  level: number
  isRoot: boolean
}

export interface TreeStructure {
  nodes: Map<string, TreeNode>
  roots: string[]
  hasCycles: boolean
}

export function buildTreeStructure (tfTree: Map<string, TFTransform>): TreeStructure {
  const nodes = new Map<string, TreeNode>()
  const childToParent = new Map<string, string>()
  const parentToChildren = new Map<string, string[]>()

  // First pass: collect all frames and relationships
  tfTree.forEach((transform) => {
    const { parent, child } = transform

    // Initialize parent node if not exists
    if (!nodes.has(parent)) {
      nodes.set(parent, {
        frame: parent,
        parent: null,
        children: [],
        transform: null,
        level: 0,
        isRoot: false
      })
    }

    // Initialize child node if not exists
    if (!nodes.has(child)) {
      nodes.set(child, {
        frame: child,
        parent: null,
        children: [],
        transform: null,
        level: 0,
        isRoot: false
      })
    }

    // Set relationships
    childToParent.set(child, parent)
    const children = parentToChildren.get(parent) || []
    if (!children.includes(child)) {
      children.push(child)
    }
    parentToChildren.set(parent, children)

    // Update node with transform
    const childNode = nodes.get(child)
    if (childNode) {
      childNode.parent = parent
      childNode.transform = transform
    }
  })

  // Update children arrays
  parentToChildren.forEach((children, parent) => {
    const node = nodes.get(parent)
    if (node) {
      node.children = children
    }
  })

  // Find root nodes (frames with no parent)
  const roots: string[] = []
  nodes.forEach((node, frame) => {
    if (!childToParent.has(frame)) {
      node.isRoot = true
      roots.push(frame)
    }
  })

  // If no roots found, pick the most common parent
  if (roots.length === 0 && nodes.size > 0) {
    const parentCounts = new Map<string, number>()
    tfTree.forEach((transform) => {
      const count = parentCounts.get(transform.parent) || 0
      parentCounts.set(transform.parent, count + 1)
    })

    let maxCount = 0
    let mostCommonParent = ''
    parentCounts.forEach((count, parent) => {
      if (count > maxCount) {
        maxCount = count
        mostCommonParent = parent
      }
    })

    if (mostCommonParent) {
      const node = nodes.get(mostCommonParent)
      if (node) {
        node.isRoot = true
        roots.push(mostCommonParent)
      }
    }
  }

  // Detect cycles using DFS
  const hasCycles = detectCycles(nodes, childToParent)

  // Calculate levels from roots
  roots.forEach((root) => {
    calculateLevels(nodes, root, 0)
  })

  return { nodes, roots, hasCycles }
}

function detectCycles (
  nodes: Map<string, TreeNode>,
  childToParent: Map<string, string>
): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs (frame: string): boolean {
    visited.add(frame)
    recursionStack.add(frame)

    const parent = childToParent.get(frame)
    if (parent) {
      if (!visited.has(parent)) {
        if (dfs(parent)) return true
      } else if (recursionStack.has(parent)) {
        return true // Cycle detected
      }
    }

    recursionStack.delete(frame)
    return false
  }

  for (const frame of nodes.keys()) {
    if (!visited.has(frame)) {
      if (dfs(frame)) return true
    }
  }

  return false
}

function calculateLevels (
  nodes: Map<string, TreeNode>,
  frame: string,
  level: number
): void {
  const node = nodes.get(frame)
  if (!node) return

  node.level = level

  node.children.forEach((child) => {
    calculateLevels(nodes, child, level + 1)
  })
}

export function getFramePath (
  nodes: Map<string, TreeNode>,
  fromFrame: string,
  toFrame: string
): string[] {
  // Get path from frame to root
  const getPathToRoot = (frame: string): string[] => {
    const path: string[] = []
    let current: string | null = frame

    while (current) {
      path.push(current)
      const node = nodes.get(current)
      current = node?.parent || null
    }

    return path
  }

  const fromPath = getPathToRoot(fromFrame)
  const toPath = getPathToRoot(toFrame)

  // Find common ancestor
  const fromSet = new Set(fromPath)
  let commonAncestor: string | null = null

  for (const frame of toPath) {
    if (fromSet.has(frame)) {
      commonAncestor = frame
      break
    }
  }

  if (!commonAncestor) {
    return [] // No path exists
  }

  // Build path
  const pathToAncestor = fromPath.slice(
    0,
    fromPath.indexOf(commonAncestor) + 1
  )
  const pathFromAncestor = toPath
    .slice(0, toPath.indexOf(commonAncestor))
    .reverse()

  return [...pathToAncestor, ...pathFromAncestor]
}

