'use client'

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import type { DocsSidebarItem } from '@/lib/docs-sidebar'

type DocsSidebarNavProps = {
  items: DocsSidebarItem[]
}

export function DocsSidebarNav({ items }: DocsSidebarNavProps) {
  const pathname = usePathname()

  const { tree, initialOpenState } = useMemo(() => {
    const result = buildSidebarTree(items, pathname)
    return {
      tree: result.items,
      initialOpenState: Object.fromEntries(
        Array.from(result.openIds).map((id) => [id, true] as const)
      ),
    }
  }, [items, pathname])

  const [openState, setOpenState] = useState<Record<string, boolean>>(initialOpenState)

  useEffect(() => {
    setOpenState(initialOpenState)
  }, [initialOpenState])

  if (!items.length) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Docs</SidebarGroupLabel>
      <SidebarMenu>
        {tree.map((item) => (
          <DocsTreeItem
            key={item.id}
            item={item}
            depth={0}
            openState={openState}
            setOpenState={setOpenState}
            pathname={pathname}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

type SidebarTreeItem = Omit<DocsSidebarItem, 'children'> & {
  children: SidebarTreeItem[]
}

type TreeItemProps = {
  item: SidebarTreeItem
  depth: number
  pathname: string
  openState: Record<string, boolean>
  setOpenState: Dispatch<SetStateAction<Record<string, boolean>>>
}

function DocsTreeItem({
  item,
  depth,
  pathname,
  openState,
  setOpenState,
}: TreeItemProps) {
  const hasChildren = item.children.length > 0
  const isActive = isUrlActive(item.url, pathname)
  const isExpanded = openState[item.id] ?? false

  const handleOpenChange = (value: boolean) => {
    setOpenState((previous) => ({
      ...previous,
      [item.id]: value,
    }))
  }

  const buttonContent = (
    <Link href={item.url ?? '#'} aria-disabled={!item.url}>
      <span>{item.title}</span>
    </Link>
  )

  if (!hasChildren) {
    if (depth === 0) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
            {buttonContent}
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          size={depth > 1 ? 'sm' : 'md'}
          isActive={isActive}
        >
          {buttonContent}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  const content = (
    <>
      <CollapsibleTrigger asChild>
        <SidebarMenuAction className="data-[state=open]:rotate-90">
          <ChevronRight />
          <span className="sr-only">Toggle</span>
        </SidebarMenuAction>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <DocsTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              pathname={pathname}
              openState={openState}
              setOpenState={setOpenState}
            />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </>
  )

  if (depth === 0) {
    return (
      <Collapsible asChild open={isExpanded} onOpenChange={handleOpenChange}>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            isActive={isActive}
          >
            {buttonContent}
          </SidebarMenuButton>
          {content}
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <Collapsible
      asChild
      open={isExpanded}
      onOpenChange={handleOpenChange}
    >
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          size={depth > 1 ? 'sm' : 'md'}
          isActive={isActive}
        >
          {buttonContent}
        </SidebarMenuSubButton>
        {content}
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function isUrlActive(url: string | undefined, pathname: string) {
  if (!url || url === '#') return false
  if (pathname === url) return true
  return pathname.startsWith(`${url}/`)
}

function buildSidebarTree(
  nodes: DocsSidebarItem[],
  pathname: string,
  parents: string[] = [],
  openIds: Set<string> = new Set()
): { items: SidebarTreeItem[]; openIds: Set<string> } {
  const items = nodes.map((node) => {
    const currentParents = [...parents, node.id]
    const hasChildren = Array.isArray(node.children) && node.children.length > 0

    if (hasChildren) {
      const childResult = buildSidebarTree(
        node.children ?? [],
        pathname,
        currentParents,
        openIds
      )
      if (isUrlActive(node.url, pathname)) {
        parents.forEach((parentId) => openIds.add(parentId))
        openIds.add(node.id)
      }
      return {
        ...node,
        children: childResult.items,
      }
    }

    if (isUrlActive(node.url, pathname)) {
      parents.forEach((parentId) => openIds.add(parentId))
      openIds.add(node.id)
    }

    return {
      ...node,
      children: [],
    }
  })

  return { items, openIds }
}

