"use client"

import React, { useMemo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { UserCheck, Trash2, Copy, X, CheckCircle, XCircle } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useWorkflowCanvas } from "../workflow-context"
import type { HumanInterventionNodeConfig, WorkflowNodeData } from "../types"

export function HumanInterventionNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const {
    updateHumanInterventionConfig,
    updateLabel,
    removeNode,
    duplicateNode,
    isRunning,
    getLiveMessages,
    clearLiveMessages,
    approveNode,
    rejectNode,
    expandedNodeId,
    setExpandedNode,
  } = useWorkflowCanvas()
  
  const isExpanded = expandedNodeId === id
  const config = data.config as HumanInterventionNodeConfig
  const liveMessages = getLiveMessages(id)

  const isPending = data.status === 'pending'
  const isApproved = data.status === 'approved'
  const isRejected = data.status === 'rejected'

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setExpandedNode(id);
    }
  };

  // Collapsed view - Diamond shape
  if (!isExpanded) {
    return (
      <div
        className="relative cursor-pointer transition-all duration-300 ease-in-out"
        onClick={handleNodeClick}
      >
        <div 
          className="w-14 h-14 bg-amber-50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative"
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: 'rotate(45deg)'
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="w-2 h-2 bg-amber-500 border-2 border-white shadow"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-2 h-2 bg-amber-500 border-2 border-white shadow"
          />
          <div style={{ transform: 'rotate(-45deg)' }}>
            <UserCheck className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        {data.label && (
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-600 truncate max-w-[80px]">
            {data.label}
          </div>
        )}
        {isPending && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
        )}
        {isApproved && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
        {isRejected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </div>
    );
  }

  // Expanded view - Full form
  return (
    <Card 
      className="relative shadow-none pt-0 rounded-xl border border-amber-200 transition-all duration-300 ease-in-out overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-amber-500 border-2 border-white shadow"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-500 border-2 border-white shadow"
      />
      <CardHeader className="bg-amber-50 border-amber-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
          <UserCheck className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <Input
              value={data.label}
              onChange={(event) => updateLabel(id, event.target.value)}
              className="h-8 text-sm border-amber-100 focus-visible:ring-amber-500"
              disabled={isRunning}
            />
            <p className="text-xs text-amber-800 truncate">
              Requires human approval to continue
            </p>
          </div>
          <Badge
            variant="outline"
            className={`justify-self-end text-[10px] capitalize ${
              isPending
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : isApproved
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : isRejected
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : ''
            }`}
          >
            {data.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              Live Data ({liveMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Instructions</Label>
              <Textarea
                value={config.instructions || ""}
                onChange={(event) =>
                  updateHumanInterventionConfig(id, (prev) => ({
                    ...prev,
                    instructions: event.target.value,
                  }))
                }
                placeholder="Enter instructions for the operator..."
                className="text-sm"
                rows={3}
                disabled={isRunning}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Requires approval
                </p>
                <p className="text-[10px] text-gray-500">
                  Pause workflow until approved
                </p>
              </div>
              <Switch
                checked={config.requiresApproval}
                onCheckedChange={(checked) =>
                  updateHumanInterventionConfig(id, (prev) => ({
                    ...prev,
                    requiresApproval: checked,
                  }))
                }
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">
                Timeout (seconds, optional)
              </Label>
              <Input
                type="number"
                min={0}
                value={config.timeoutSeconds || ""}
                onChange={(event) =>
                  updateHumanInterventionConfig(id, (prev) => ({
                    ...prev,
                    timeoutSeconds: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
                placeholder="No timeout"
                className="h-9 text-sm"
                disabled={isRunning}
              />
            </div>

            {isPending && isRunning && (
              <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-900">
                  Approval Required
                </p>
                <p className="text-xs text-amber-800">
                  {config.instructions || "No instructions provided"}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={() => approveNode(id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                    onClick={() => rejectNode(id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <div>
                <span className="font-semibold text-gray-900 text-sm mr-1">
                  {data.stats.messageCount}
                </span>
                approvals
              </div>
              <div className="text-xs text-gray-500">
                {data.stats.throughput.toFixed(2)} msg/s
              </div>
              <div className="text-[10px] text-gray-500">
                {data.stats.lastUpdated
                  ? new Date(data.stats.lastUpdated).toLocaleTimeString()
                  : "idle"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 flex-1"
                onClick={() => duplicateNode(id)}
                disabled={isRunning}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                onClick={() => removeNode(id)}
                disabled={isRunning}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="live" className="space-y-2 mt-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-600">
                Last {liveMessages.length} messages
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearLiveMessages(id)}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {liveMessages.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No messages yet
                </div>
              ) : (
                liveMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded p-2 border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {msg.type || 'human-intervention'}
                      </Badge>
                      <div className="text-[10px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <pre className="text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

