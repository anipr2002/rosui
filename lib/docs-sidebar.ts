import type { ReactNode } from 'react'

export type DocsSidebarItem = {
  id: string
  title: string
  url?: string
  children?: DocsSidebarItem[]
}

type PageTreeRoot = {
  children: PageTreeNode[]
}

type PageTreeNode =
  | PageTreePageNode
  | PageTreeFolderNode
  | PageTreeSeparatorNode

type PageTreePageNode = {
  $id?: string
  type: 'page'
  name?: ReactNode
  url?: string
}

type PageTreeFolderNode = {
  $id?: string
  type: 'folder'
  name?: ReactNode
  index?: {
    url?: string
    name?: ReactNode
  }
  children: PageTreeNode[]
}

type PageTreeSeparatorNode = {
  $id?: string
  type: 'separator'
}

export function createDocsSidebarItems(
  root: PageTreeRoot | null | undefined
): DocsSidebarItem[] {
  if (!root) return []

  return root.children
    .map((node, index) => mapNodeToItem(node, `root-${index}`))
    .filter(isDefined)
}

function mapNodeToItem(
  node: PageTreeNode,
  idFallback: string
): DocsSidebarItem | null {
  if (node.type === 'separator') return null

  if (node.type === 'page') {
    const title = resolveNodeTitle(node.name) || 'Untitled'
    const id = node.$id ?? node.url ?? idFallback

    return {
      id,
      title,
      url: node.url,
    }
  }

  const title = resolveNodeTitle(node.name) || 'Untitled'
  const id = node.$id ?? node.index?.url ?? idFallback
  const children = node.children
    .map((child, index) => mapNodeToItem(child, `${id}-child-${index}`))
    .filter(isDefined)

  const firstChildUrl = children.length > 0 ? children[0]?.url : undefined
  const url = node.index?.url ?? firstChildUrl

  return {
    id,
    title,
    url,
    children,
  }
}

function resolveNodeTitle(name?: ReactNode): string {
  if (name == null || typeof name === 'boolean') return ''
  if (typeof name === 'string' || typeof name === 'number') {
    return String(name).trim()
  }
  if (Array.isArray(name)) {
    return name.map((child) => resolveNodeTitle(child)).join('').trim()
  }
  if (typeof name === 'object' && 'props' in (name as Record<string, any>)) {
    const withChildren = name as { props?: { children?: ReactNode } }
    return resolveNodeTitle(withChildren.props?.children)
  }

  return ''
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null
}

