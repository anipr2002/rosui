"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Radio,
  Send,
  Eye,
  Play,
  Square,
  AlertCircle,
  FileCode,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// Mock data for the demo
const DEMO_TOPIC = {
  name: "/turtle1/cmd_vel",
  type: "geometry_msgs/Twist",
  definition: `geometry_msgs/Vector3 linear
  float64 x
  float64 y
  float64 z
geometry_msgs/Vector3 angular
  float64 x
  float64 y
  float64 z`,
};

// Generate mock message based on topic type
const generateMockMessage = (topicType: string) => {
  switch (topicType) {
    case "geometry_msgs/Twist":
      return {
        linear: { x: Math.random() * 2 - 1, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: Math.random() * 4 - 2 },
      };
    default:
      return {};
  }
};

export function TopicDemoCard() {
  const [activeTab, setActiveTab] = useState("info");
  const [messageJson, setMessageJson] = useState('{\n  "linear": {\n    "x": 0.5,\n    "y": 0.0,\n    "z": 0.0\n  },\n  "angular": {\n    "x": 0.0,\n    "y": 0.0,\n    "z": 0.2\n  }\n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [publishRate, setPublishRate] = useState(1);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const topic = DEMO_TOPIC;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSubscribed) {
      interval = setInterval(() => {
        const newMessage = {
          data: generateMockMessage(topic.type),
          timestamp: Date.now(),
        };
        setMessages(prev => [newMessage, ...prev].slice(0, 21));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSubscribed, topic.type]);

  const validateJson = (jsonStr: string): any | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      return null;
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
    toast.success(`Subscribed to ${topic.name}`);
  };

  const handleUnsubscribe = () => {
    setIsSubscribed(false);
    setMessages([]);
    toast.info(`Unsubscribed from ${topic.name}`);
  };

  const handlePublishOnce = () => {
    const message = validateJson(messageJson);
    if (!message) {
      toast.error("Invalid JSON format");
      return;
    }
    toast.success(`Published message to ${topic.name}`);
  };

  const handleStartPeriodic = () => {
    const message = validateJson(messageJson);
    if (!message) {
      toast.error("Invalid JSON format");
      return;
    }
    if (publishRate <= 0 || publishRate > 100) {
      toast.error("Publish rate must be between 0 and 100 Hz");
      return;
    }
    setIsPublishing(true);
    toast.success(`Started publishing to ${topic.name} at ${publishRate} Hz`);
  };

  const handleStopPeriodic = () => {
    setIsPublishing(false);
    toast.info(`Stopped publishing to ${topic.name}`);
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.info("Message history cleared");
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString() +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  const getStatusColors = () => {
    if (isSubscribed && isPublishing) {
      return {
        border: "border-transparent",
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
    } else if (isSubscribed) {
      return {
        border: "border-green-300",
        headerBg: "bg-green-50",
        headerText: "text-green-900",
        descriptionText: "text-green-800",
        iconColor: "text-green-600",
      };
    } else if (isPublishing) {
      return {
        border: "border-purple-300",
        headerBg: "bg-purple-50",
        headerText: "text-purple-900",
        descriptionText: "text-purple-800",
        iconColor: "text-purple-600",
      };
    } else {
      return {
        border: "border-amber-200",
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

  return (
    <Card
      className={`shadow-none pt-0 rounded-xl w-full max-w-[416px] mx-auto ${colors.border}`}
      style={colors.customBorderStyle}
    >
      <CardHeader
        className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}
        style={colors.customHeaderStyle}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
          <Radio
            className={`h-5 w-5 mt-0.5 ${colors.iconColor} flex-shrink-0`}
          />
          <div className="min-w-0 overflow-hidden space-y-1">
            <CardTitle
              className={`text-sm sm:text-base ${colors.headerText} truncate cursor-help block`}
              title={topic.name}
            >
              {topic.name}
            </CardTitle>
            <CardTitle
              className={`text-xs ${colors.descriptionText} font-mono truncate cursor-help block`}
              title={topic.type}
            >
              {topic.type}
            </CardTitle>
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {getStatusBadges()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3 py-2 border-b">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Topic Name
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right break-all">
                    {topic.name}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-3 py-2 border-b">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Message Type
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right break-all">
                    {topic.type}
                  </span>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="definition">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-gray-600" />
                      <span>Message Definition</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {topic.definition}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="publishers-subscribers">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span>Publishers & Subscribers</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Publishers
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-900">
                            {isPublishing ? 1 : 0}
                          </span>
                          {isPublishing && (
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Subscribers
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-900">
                            {isSubscribed ? 1 : 0}
                          </span>
                          {isSubscribed && (
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="statistics">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                      <span>Statistics</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Messages Received
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {messages.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Publish Rate
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {isPublishing ? `${publishRate} Hz` : "0 Hz"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Last Message
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {messages.length > 0
                            ? new Date(messages[0]?.timestamp || Date.now()).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="subscribe" className="mt-4">
            {!isSubscribed ? (
              <div className="space-y-4">
                <Button
                  onClick={handleSubscribe}
                  className="w-full bg-green-200 border-1 border-green-500 hover:bg-green-500 hover:text-white text-green-500"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>

                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-sm text-gray-500">
                    Click Subscribe to start receiving messages from this topic
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleUnsubscribe}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Unsubscribe
                  </Button>

                  {messages.length > 0 && (
                    <Button
                      onClick={handleClearHistory}
                      variant="outline"
                      size="icon"
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {messages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Latest Message
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(messages[0]?.timestamp || Date.now())}
                        </span>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                          {JSON.stringify(messages[0]?.data, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {messages.length > 1 && (
                      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="text-sm font-medium">
                              Message History ({messages.length - 1} older)
                            </span>
                            {isHistoryOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-2 space-y-2">
                          <div className="max-h-96 overflow-y-auto space-y-2">
                            {messages
                              .slice(1, 21)
                              .map((msg: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-600">
                                      Message #{index + 2}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(msg.timestamp)}
                                    </span>
                                  </div>
                                  <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                                    {JSON.stringify(msg.data, null, 2)}
                                  </pre>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-lg bg-green-50">
                    <p className="text-sm text-green-700">
                      Subscribed - waiting for messages...
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="publish" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-json" className="text-sm font-medium">
                  Message (JSON)
                </Label>
                <Textarea
                  id="message-json"
                  value={messageJson}
                  onChange={(e) => {
                    setMessageJson(e.target.value);
                    if (jsonError) setJsonError(null);
                  }}
                  className="w-full min-h-[200px] p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  placeholder="Enter message JSON..."
                  disabled={isPublishing}
                />
                {jsonError && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handlePublishOnce}
                disabled={isPublishing || !!jsonError}
                className="w-full bg-purple-200 border-1 border-purple-500 hover:bg-purple-500 hover:text-white text-purple-500"
              >
                <Send className="mr-2 h-4 w-4" />
                Publish Once
              </Button>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Periodic Publishing
                </Label>

                <div className="space-y-2">
                  <Label htmlFor="publish-rate" className="text-sm font-medium">
                    Rate (Hz)
                  </Label>
                  <Input
                    id="publish-rate"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={publishRate}
                    onChange={(e) => setPublishRate(parseFloat(e.target.value))}
                    disabled={isPublishing}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Publish rate between 0.1 and 100 Hz
                  </p>
                </div>

                {!isPublishing ? (
                  <Button
                    onClick={handleStartPeriodic}
                    disabled={!!jsonError}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Periodic Publishing
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium">
                        Publishing at {publishRate}{" "}
                        Hz
                      </p>
                    </div>
                    <Button
                      onClick={handleStopPeriodic}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Publishing
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

