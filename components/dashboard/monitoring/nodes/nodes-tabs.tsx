'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LifecycleNodeList } from './lifecycle/lifecycle-node-list'
import { AllNodesView } from './graph/node-graph-view'
import { Circle, Cpu } from 'lucide-react'

export type NodesTab = 'lifecycle' | 'all'

interface NodesTabsProps {
  defaultTab?: NodesTab
}

export function NodesTabs({ defaultTab = 'lifecycle' }: NodesTabsProps) {
  const [activeTab, setActiveTab] = useState<NodesTab>(defaultTab)

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NodesTab)} className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList className="bg-transparent p-0 h-auto border-b w-full justify-start rounded-none space-x-6">
          <TabsTrigger
            value="lifecycle"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-sm text-muted-foreground data-[state=active]:text-indigo-900 flex items-center gap-2"
          >
            <Circle className="h-4 w-4" />
            Lifecycle Nodes
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-sm text-muted-foreground data-[state=active]:text-indigo-900 flex items-center gap-2"
          >
            <Cpu className="h-4 w-4" />
            All Nodes
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="lifecycle" className="mt-0">
        <LifecycleNodeList />
      </TabsContent>

      <TabsContent value="all" className="mt-0">
        <AllNodesView />
      </TabsContent>
    </Tabs>
  )
}

