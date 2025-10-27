"use client";

import React, { useState } from "react";
import { useTopicsStore } from "@/store/topic-store";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileCode, Users, BarChart3 } from "lucide-react";

interface TopicInfoTabProps {
  topicName: string;
  topicType: string;
}

export function TopicInfoTab({ topicName, topicType }: TopicInfoTabProps) {
  const {
    typeDefinitions,
    subscribers,
    publishers,
    getTopicDetails,
    topicDetails,
    isLoadingDetails,
  } = useTopicsStore();
  const [detailsFetched, setDetailsFetched] = useState(false);

  const handleFetchDetails = async () => {
    if (!detailsFetched) {
      await getTopicDetails(topicName);
      setDetailsFetched(true);
    }
  };

  const typeDefinition = typeDefinitions.get(topicType);
  const subscriber = subscribers.get(topicName);
  const publisher = publishers.get(topicName);
  const details = topicDetails.get(topicName);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString() +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm font-medium text-gray-600">Topic Name</span>
          <span className="text-sm font-mono text-gray-900">{topicName}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm font-medium text-gray-600">
            Message Type
          </span>
          <span className="text-sm font-mono text-gray-900">{topicType}</span>
        </div>
      </div>

      {/* Accordion with Additional Info */}
      <Accordion type="single" collapsible className="w-full">
        {/* Message Definition */}
        <AccordionItem value="definition">
          <AccordionTrigger className="text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-gray-600" />
              <span>Message Definition</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {typeDefinition ? (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                    {typeDefinition}
                  </pre>
                </div>
              ) : (
                <div className="p-4 text-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-gray-500">
                    Type definition not available
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Publishers & Subscribers */}
        <AccordionItem value="nodes">
          <AccordionTrigger
            className="text-sm hover:no-underline"
            onClick={handleFetchDetails}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span>Publishers & Subscribers</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : details ? (
              <div className="space-y-3">
                {/* Publishers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700">
                    Publishers ({details.publishers.length})
                  </h4>
                  {details.publishers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.publishers.map((node, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {node}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center border-2 border-dashed rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500">
                        No publishers found
                      </p>
                    </div>
                  )}
                </div>

                {/* Subscribers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700">
                    Subscribers ({details.subscribers.length})
                  </h4>
                  {details.subscribers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.subscribers.map((node, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          {node}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center border-2 border-dashed rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500">
                        No subscribers found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center border-2 border-dashed rounded-lg">
                <p className="text-xs text-gray-500">
                  Unable to fetch publisher/subscriber information
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Statistics */}
        <AccordionItem value="statistics">
          <AccordionTrigger className="text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <span>Statistics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {subscriber ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Subscription Status
                    </span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Messages Received
                    </span>
                    <span className="text-xs font-mono text-gray-900">
                      {subscriber.messages.length}
                    </span>
                  </div>
                  {subscriber.messages.length > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-xs font-medium text-gray-600">
                        Last Message
                      </span>
                      <span className="text-xs font-mono text-gray-900">
                        {formatTimestamp(subscriber.messages[0].timestamp)}
                      </span>
                    </div>
                  )}
                </>
              ) : publisher?.isPublishing ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Publishing Status
                    </span>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Publish Rate
                    </span>
                    <span className="text-xs font-mono text-gray-900">
                      {publisher.publishRate} Hz
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">
                    No active subscription or publishing. Use the Subscribe or
                    Publish tabs to interact with this topic.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          Use the Subscribe tab to receive messages from this topic, or the
          Publish tab to send messages.
        </p>
      </div>
    </div>
  );
}
