"use client";

import React from "react";
import type { RQTNodeData } from "@/lib/rqt-reactflow/rqt-graph-to-reactflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Copy, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";

interface RQTGraphDetailsPanelProps {
  selectedElement: RQTNodeData | null;
}

export function RQTGraphDetailsPanel({
  selectedElement,
}: RQTGraphDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!selectedElement) {
    return (
      <Card className="shadow-none rounded-xl border-gray-200">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            Select a node or topic to view detailed information
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isNode = selectedElement.elementType === "node";
  const nodeInfo = selectedElement.nodeInfo;
  const topicInfo = selectedElement.topicInfo;

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-200">
      <CardHeader
        className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-purple-600" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-purple-900 font-semibold">
                {isNode ? "Node Details" : "Topic Details"}
              </h3>
              <Badge
                variant="outline"
                className="mt-1 font-mono text-xs border-purple-300 text-purple-800"
              >
                {selectedElement.name}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-purple-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 py-4 space-y-4">
          {/* Node Information */}
          {isNode && nodeInfo && (
            <>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Node Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {nodeInfo.publishedTopics.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      Publisher
                    </Badge>
                  )}
                  {nodeInfo.subscribedTopics.length > 0 && (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      Subscriber
                    </Badge>
                  )}
                  {nodeInfo.isSystemNode && (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                      System Node
                    </Badge>
                  )}
                </div>
              </div>

              {/* Published Topics */}
              {nodeInfo.publishedTopics.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Published Topics ({nodeInfo.publishedTopics.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          nodeInfo.publishedTopics.join("\n"),
                          "Published topics"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2 max-h-48 overflow-y-auto">
                    <div className="space-y-1">
                      {nodeInfo.publishedTopics.map((topic) => (
                        <div key={topic} className="text-xs font-mono">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscribed Topics */}
              {nodeInfo.subscribedTopics.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Subscribed Topics ({nodeInfo.subscribedTopics.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          nodeInfo.subscribedTopics.join("\n"),
                          "Subscribed topics"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2 max-h-48 overflow-y-auto">
                    <div className="space-y-1">
                      {nodeInfo.subscribedTopics.map((topic) => (
                        <div key={topic} className="text-xs font-mono">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Topic Information */}
          {!isNode && topicInfo && (
            <>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Message Type
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm">
                  {topicInfo.messageType}
                </div>
              </div>

              {/* Publishers */}
              {topicInfo.publishers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Publishers ({topicInfo.publishers.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          topicInfo.publishers.join("\n"),
                          "Publishers"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2">
                    <div className="space-y-1">
                      {topicInfo.publishers.map((pub) => (
                        <div key={pub} className="text-xs font-mono">
                          {pub}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscribers */}
              {topicInfo.subscribers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500">
                      Subscribers ({topicInfo.subscribers.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          topicInfo.subscribers.join("\n"),
                          "Subscribers"
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2">
                    <div className="space-y-1">
                      {topicInfo.subscribers.map((sub) => (
                        <div key={sub} className="text-xs font-mono">
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Copy All Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = isNode
                  ? JSON.stringify(nodeInfo, null, 2)
                  : JSON.stringify(topicInfo, null, 2);
                copyToClipboard(data, "Element data");
              }}
              className="w-full"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy All Data
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
