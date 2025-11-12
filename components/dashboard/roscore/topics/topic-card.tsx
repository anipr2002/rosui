"use client";

import React from "react";
import { useTopicsStore } from "@/store/topic-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TopicInfoTab } from "./topic-info-tab";
import { TopicSubscribeTab } from "./topic-subscribe-tab";
import { TopicPublishTab } from "./topic-publish-tab";
import { Radio, Eye, Send } from "lucide-react";

interface TopicCardProps {
  topicName: string;
  topicType: string;
}

export function TopicCard({ topicName, topicType }: TopicCardProps) {
  const { subscribers, publishers } = useTopicsStore();

  const isSubscribed = subscribers.has(topicName);
  const isPublishing = publishers.get(topicName)?.isPublishing || false;

  const getStatusColors = () => {
    const hasSubscriber = isSubscribed;
    const hasPublisher = isPublishing;

    if (hasSubscriber && hasPublisher) {
      // Both - mixed state
      return {
        border: "border-transparent",
        borderInner: "border border-transparent",
        headerBg: "",
        headerText: "text-gray-900",
        descriptionText: "text-gray-700",
        iconColor: "text-green-600",
        customBorderStyle: {
          background:
            "linear-gradient(270deg, oklch(98.2% 0.018 155.826) 0%, oklch(98.2% 0.018 155.826) 50%, oklch(98.2% 0.018 155.826) 50%, oklch(98.2% 0.018 155.826) 100%)",
        },
        customHeaderStyle: {
          background:
            "linear-gradient(270deg, oklch(98.2% 0.018 155.826) 0%, oklch(98.2% 0.018 155.826) 50%, oklch(98.2% 0.018 155.826) 50%, oklch(98.2% 0.018 155.826) 100%)",
        },
      };
    } else if (hasSubscriber) {
      // Subscribing only
      return {
        border: "border-green-300",
        borderInner: "",
        headerBg: "bg-green-50",
        headerText: "text-green-900",
        descriptionText: "text-green-800",
        iconColor: "text-green-600",
      };
    } else if (hasPublisher) {
      // Publishing only
      return {
        border: "border-purple-300",
        borderInner: "",
        headerBg: "bg-purple-50",
        headerText: "text-purple-900",
        descriptionText: "text-purple-800",
        iconColor: "text-purple-600",
      };
    } else {
      // Default - inactive
      return {
        border: "border-amber-200",
        borderInner: "",
        headerBg: "bg-amber-50",
        headerText: "text-amber-900",
        descriptionText: "text-gray-700",
        iconColor: "text-amber-400",
      };
    }
  };

  const getStatusBadges = () => {
    const badges = [];

    if (isSubscribed) {
      badges.push(
        <Badge
          key="subscribe"
          className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden sm:inline">Subscribed</span>
            <span className="sm:hidden">Sub</span>
          </div>
        </Badge>
      );
    }

    if (isPublishing) {
      badges.push(
        <Badge
          key="publish"
          className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="hidden sm:inline">Publishing</span>
            <span className="sm:hidden">Pub</span>
          </div>
        </Badge>
      );
    }

    if (badges.length === 0) {
      badges.push(
        <Badge
          key="inactive"
          className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 text-xs"
        >
          Inactive
        </Badge>
      );
    }

    return badges;
  };

  const colors = getStatusColors();

  // Determine color variant for tooltip based on status
  const getTooltipColor = () => {
    if (isSubscribed && isPublishing) return "green"; // Mixed state uses green
    if (isSubscribed) return "green";
    if (isPublishing) return "purple";
    return "amber"; // Default/inactive
  };

  const tooltipColor = getTooltipColor();

  return (
    <Card
      className={`shadow-none pt-0 rounded-xl ${colors.border}`}
      style={colors.customBorderStyle}
    >
      <CardHeader
        className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}
        style={colors.customHeaderStyle}
      >
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Radio
              className={`h-5 w-5 mt-0.5 ${colors.iconColor} flex-shrink-0`}
            />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className={`text-sm sm:text-base ${colors.headerText} truncate cursor-help block`}
                    title={topicName}
                  >
                    {topicName}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words">{topicName}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardDescription
                    className={`text-xs ${colors.descriptionText} font-mono truncate cursor-help block`}
                    title={topicType}
                  >
                    {topicType}
                  </CardDescription>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words font-mono text-xs">{topicType}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {getStatusBadges()}
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="text-xs">
              <Radio className="h-3 w-3 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="subscribe" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Subscribe
            </TabsTrigger>
            <TabsTrigger value="publish" className="text-xs">
              <Send className="h-3 w-3 mr-1" />
              Publish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <TopicInfoTab topicName={topicName} topicType={topicType} />
          </TabsContent>

          <TabsContent value="subscribe" className="mt-4">
            <TopicSubscribeTab topicName={topicName} topicType={topicType} />
          </TabsContent>

          <TabsContent value="publish" className="mt-4">
            <TopicPublishTab topicName={topicName} topicType={topicType} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
