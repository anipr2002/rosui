import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Activity, Zap, Play, Share2, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeCategories = [
  {
    title: 'Triggers',
    color: 'text-blue-500',
    items: [
      { type: 'trigger', label: 'Topic Monitor', icon: Zap },
      { type: 'trigger', label: 'Interval', icon: Zap },
      { type: 'trigger', label: 'Manual Trigger', icon: MousePointerClick },
    ],
  },
  {
    title: 'Logic',
    color: 'text-purple-500',
    items: [
      { type: 'logic', label: 'Filter/Script', icon: Activity },
      { type: 'logic', label: 'AI Processor', icon: Activity },
    ],
  },
  {
    title: 'ROS Actions',
    color: 'text-orange-500',
    items: [
      { type: 'action', label: 'Publish Topic', icon: Play },
      { type: 'action', label: 'Call Service', icon: Play },
      { type: 'action', label: 'Set Param', icon: Play },
      { type: 'action', label: 'Get Param', icon: Play },
      { type: 'action', label: 'Delete Param', icon: Play },
    ],
  },
  {
    title: 'Integrations',
    color: 'text-green-500',
    items: [
      { type: 'integration', label: 'Slack', icon: Share2 },
      { type: 'integration', label: 'Discord', icon: Share2 },
      { type: 'integration', label: 'Email', icon: Share2 },
    ],
  },
];

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, category: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.setData('application/reactflow/category', category);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="h-full w-64 border-r rounded-none border-y-0 border-l-0 shadow-none bg-gray-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Node Palette</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-120px)] px-4">
          <div className="space-y-6 pb-8">
            {nodeCategories.map((category, index) => (
              <div key={index} className="space-y-3">
                <h3 className={cn("text-xs font-semibold uppercase tracking-wider", category.color)}>
                  {category.title}
                </h3>
                <div className="grid gap-2">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab hover:border-indigo-300 hover:shadow-sm transition-all active:cursor-grabbing"
                      draggable
                      onDragStart={(event) => onDragStart(event, item.type, item.label, item.type)}
                    >
                      <item.icon className={cn("w-4 h-4", category.color)} />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
                {index < nodeCategories.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
