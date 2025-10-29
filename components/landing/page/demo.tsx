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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Server,
  Radio,
  Info,
  Send,
  Eye,
  Play,
  Square,
  AlertCircle,
  Loader2,
  FileCode,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// Demo Service Card Component
function DemoServiceCard({
  service,
  onServiceCall,
}: {
  service: any;
  onServiceCall: any;
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [requestJson, setRequestJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (service.definition?.request?.defaultMessage) {
      setRequestJson(
        JSON.stringify(service.definition.request.defaultMessage, null, 2)
      );
    }
  }, [service]);

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

  const handleCallService = async () => {
    const request = validateJson(requestJson);
    if (!request) {
      toast.error("Invalid JSON format for service request");
      return;
    }

    setIsLoading(true);
    try {
      toast.info(`Calling service ${service.name}...`);
      const result = await onServiceCall(service.name, service.type, request);
      setResponse(result);
      toast.success(`Service ${service.name} called successfully.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to call service";
      toast.error(errorMessage);
      setResponse({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-none pt-0 rounded-xl border-teal-200 w-full sm:w-[416px]">
      <CardHeader className="bg-teal-50 border-teal-200 border-b rounded-t-xl pt-6">
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start sm:gap-4">
            <Server className="h-5 w-5 mt-0.5 text-teal-400 flex-shrink-0" />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className="text-sm sm:text-base text-teal-900 truncate cursor-help block"
                    title={service.name}
                  >
                    {service.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words">{service.name}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className="text-xs text-teal-700 font-mono truncate cursor-help block"
                    title={service.type}
                  >
                    {service.type}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words font-mono text-xs">
                    {service.type}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="call" className="text-xs">
              <Send className="h-3 w-3 mr-1" />
              Call
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3 py-2 border-b">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Service Name
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right break-all">
                    {service.name}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-3 py-2 border-b">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                    Service Type
                  </span>
                  <span className="text-sm font-mono text-gray-900 text-right break-all">
                    {service.type}
                  </span>
                </div>
              </div>

              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="definition"
              >
                <AccordionItem value="definition">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-gray-600" />
                      <span>Service Definition</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Request
                        </h4>
                        <div className="bg-gray-50 border rounded-lg p-3">
                          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                            {service.definition?.request?.definition ||
                              "Empty request"}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Response
                        </h4>
                        <div className="bg-gray-50 border rounded-lg p-3">
                          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                            {service.definition?.response?.definition ||
                              "Empty response"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="call" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-json" className="text-sm font-medium">
                  Request (JSON)
                </Label>
                <Textarea
                  id="request-json"
                  value={requestJson}
                  onChange={(e) => {
                    setRequestJson(e.target.value);
                    if (jsonError) setJsonError(null);
                  }}
                  className="w-full min-h-[150px] p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter request JSON..."
                  disabled={isLoading}
                />
                {jsonError && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCallService}
                disabled={isLoading || !!jsonError}
                className="w-full bg-blue-200 border-1 border-blue-500 hover:bg-blue-500 hover:text-white text-blue-500"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Call Service
              </Button>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Response</Label>
                <div className="w-full min-h-[150px] p-3 font-mono text-sm border rounded-lg bg-gray-50 overflow-x-auto">
                  {response && (
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  )}
                  {!response && (
                    <p className="text-xs text-gray-500">
                      Service response will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Demo Topic Card Component
function DemoTopicCard({
  topic,
  subscribers,
  publishers,
  onSubscribe,
  onUnsubscribe,
  onPublish,
  onStartPeriodic,
  onStopPeriodic,
  onClearHistory,
}: {
  topic: any;
  subscribers: any;
  publishers: any;
  onSubscribe: any;
  onUnsubscribe: any;
  onPublish: any;
  onStartPeriodic: any;
  onStopPeriodic: any;
  onClearHistory: any;
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [messageJson, setMessageJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [publishRate, setPublishRate] = useState(1);

  const isSubscribed = subscribers.has(topic.name);
  const isPublishing = publishers.get(topic.name)?.isPublishing || false;
  const subscriber = subscribers.get(topic.name);

  useEffect(() => {
    // Initialize with default message structure
    if (messageJson === "{}") {
      const defaultMessage = getDefaultMessage(topic.type);
      if (defaultMessage) {
        setMessageJson(JSON.stringify(defaultMessage, null, 2));
      }
    }
  }, [topic.type, messageJson]);

  const getDefaultMessage = (topicType: string) => {
    switch (topicType) {
      case "geometry_msgs/Twist":
        return {
          linear: { x: 0.0, y: 0.0, z: 0.0 },
          angular: { x: 0.0, y: 0.0, z: 0.0 },
        };
      case "std_msgs/String":
        return { data: "Hello ROS!" };
      case "turtlesim/Pose":
        return {
          x: 0.0,
          y: 0.0,
          theta: 0.0,
          linear_velocity: 0.0,
          angular_velocity: 0.0,
        };
      default:
        return {};
    }
  };

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

  const handlePublishOnce = () => {
    const message = validateJson(messageJson);
    if (!message) {
      toast.error("Invalid JSON format");
      return;
    }
    onPublish(topic.name, message);
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
    onStartPeriodic(topic.name, message, publishRate);
  };

  const handleStopPeriodic = () => {
    onStopPeriodic(topic.name);
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
      className={`shadow-none pt-0 rounded-xl w-full sm:w-[416px] ${colors.border}`}
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
                    title={topic.name}
                  >
                    {topic.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words">{topic.name}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className={`text-xs ${colors.descriptionText} font-mono truncate cursor-help block`}
                    title={topic.type}
                  >
                    {topic.type}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words font-mono text-xs">{topic.type}</p>
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
                            {publishers.has(topic.name) ? 1 : 0}
                          </span>
                          {publishers.has(topic.name) && (
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
                            {subscribers.has(topic.name) ? 1 : 0}
                          </span>
                          {subscribers.has(topic.name) && (
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
                          {subscribers.get(topic.name)?.messages?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Publish Rate
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {publishers.get(topic.name)?.publishRate || 0} Hz
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">
                          Last Message
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {subscribers.get(topic.name)?.latestMessage
                            ? new Date(
                                subscribers.get(topic.name).messages[0]
                                  ?.timestamp || Date.now()
                              ).toLocaleTimeString()
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
            <DemoTopicSubscribeTab
              topicName={topic.name}
              topicType={topic.type}
              subscriber={subscriber}
              onSubscribe={onSubscribe}
              onUnsubscribe={onUnsubscribe}
              onClearHistory={onClearHistory}
            />
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
                        Publishing at {publishers.get(topic.name)?.publishRate}{" "}
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

// Demo Topic Subscribe Tab Component
function DemoTopicSubscribeTab({
  topicName,
  topicType,
  subscriber,
  onSubscribe,
  onUnsubscribe,
  onClearHistory,
}: {
  topicName: string;
  topicType: string;
  subscriber: any;
  onSubscribe: any;
  onUnsubscribe: any;
  onClearHistory: any;
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isSubscribed = !!subscriber;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString() +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  if (!isSubscribed) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => onSubscribe(topicName, topicType)}
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => onUnsubscribe(topicName)}
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Square className="mr-2 h-4 w-4" />
          Unsubscribe
        </Button>

        {subscriber.messages.length > 0 && (
          <Button
            onClick={() => onClearHistory(topicName)}
            variant="outline"
            size="icon"
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {subscriber.latestMessage ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Latest Message
              </h4>
              <span className="text-xs text-gray-500">
                {formatTimestamp(
                  subscriber.messages[0]?.timestamp || Date.now()
                )}
              </span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                {JSON.stringify(subscriber.latestMessage, null, 2)}
              </pre>
            </div>
          </div>

          {subscriber.messages.length > 1 && (
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="text-sm font-medium">
                    Message History ({subscriber.messages.length - 1} older)
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
                  {subscriber.messages
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
  );
}

// Mock data for services
const MOCK_SERVICES = [
  {
    name: "/turtle1/teleport_absolute",
    type: "turtlesim/TeleportAbsolute",
    definition: {
      request: {
        definition: `float32 x
float32 y
float32 theta`,
        defaultMessage: { x: 5.0, y: 5.0, theta: 0.0 },
      },
      response: {
        definition: "---",
      },
    },
  },
  {
    name: "/turtle1/set_pen",
    type: "turtlesim/SetPen",
    definition: {
      request: {
        definition: `uint8 r
uint8 g
uint8 b
uint8 width
uint8 off`,
        defaultMessage: { r: 255, g: 0, b: 0, width: 3, off: 0 },
      },
      response: {
        definition: "---",
      },
    },
  },
  {
    name: "/spawn",
    type: "turtlesim/Spawn",
    definition: {
      request: {
        definition: `float32 x
float32 y
float32 theta
string name`,
        defaultMessage: { x: 2.0, y: 2.0, theta: 0.0, name: "my_turtle" },
      },
      response: {
        definition: `string name`,
      },
    },
  },
  {
    name: "/reset",
    type: "std_srvs/Empty",
    definition: {
      request: {
        definition: "---",
      },
      response: {
        definition: "---",
      },
    },
  },
];

// Mock data for topics
const MOCK_TOPICS = [
  {
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
  },
  {
    name: "/turtle1/pose",
    type: "turtlesim/Pose",
    definition: `float32 x
float32 y
float32 theta
float32 linear_velocity
float32 angular_velocity`,
  },
  {
    name: "/chatter",
    type: "std_msgs/String",
    definition: `string data`,
  },
  {
    name: "/scan",
    type: "sensor_msgs/LaserScan",
    definition: `Header header
  uint32 seq
  time stamp
  string frame_id
float32 angle_min
float32 angle_max
float32 angle_increment
float32 time_increment
float32 scan_time
float32 range_min
float32 range_max
float32[] ranges
float32[] intensities`,
  },
];

// Generate mock message based on topic type
const generateMockMessage = (topicType: string, timestamp: number) => {
  switch (topicType) {
    case "geometry_msgs/Twist":
      return {
        linear: { x: Math.random() * 2 - 1, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: Math.random() * 4 - 2 },
      };
    case "turtlesim/Pose":
      return {
        x: Math.random() * 11,
        y: Math.random() * 11,
        theta: Math.random() * Math.PI * 2,
        linear_velocity: Math.random() * 2,
        angular_velocity: Math.random() * 4 - 2,
      };
    case "std_msgs/String":
      const messages = [
        "Hello ROS!",
        "Demo message",
        "Testing topic subscription",
        "ROS is awesome!",
      ];
      return { data: messages[Math.floor(Math.random() * messages.length)] };
    case "sensor_msgs/LaserScan":
      return {
        header: {
          seq: Math.floor(Math.random() * 1000),
          stamp: {
            secs: Math.floor(timestamp / 1000),
            nsecs: (timestamp % 1000) * 1000000,
          },
          frame_id: "laser_frame",
        },
        angle_min: -Math.PI / 2,
        angle_max: Math.PI / 2,
        angle_increment: Math.PI / 180,
        time_increment: 0.001,
        scan_time: 0.1,
        range_min: 0.1,
        range_max: 10.0,
        ranges: Array.from({ length: 180 }, () => Math.random() * 9.9 + 0.1),
        intensities: Array.from({ length: 180 }, () => Math.random() * 100),
      };
    default:
      return {};
  }
};

export default function Demo() {
  const [activeTab, setActiveTab] = useState("services");
  const [subscribers, setSubscribers] = useState<Map<string, any>>(new Map());
  const [publishers, setPublishers] = useState<Map<string, any>>(new Map());
  const [subscriptionIntervals, setSubscriptionIntervals] = useState<
    Map<string, NodeJS.Timeout>
  >(new Map());

  // Handle service calls
  const handleServiceCall = async (
    serviceName: string,
    serviceType: string,
    request: any
  ) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock responses based on service type
    let response = {};
    switch (serviceType) {
      case "turtlesim/TeleportAbsolute":
        response = {};
        toast.success(`Teleported turtle to (${request.x}, ${request.y})`);
        break;
      case "turtlesim/SetPen":
        response = {};
        toast.success(
          `Set pen color to RGB(${request.r}, ${request.g}, ${request.b})`
        );
        break;
      case "turtlesim/Spawn":
        response = { name: request.name };
        toast.success(`Spawned turtle "${request.name}"`);
        break;
      case "std_srvs/Empty":
        response = {};
        toast.success("Simulation reset");
        break;
    }

    return response;
  };

  // Handle subscription
  const handleSubscribe = (topicName: string, topicType: string) => {
    const interval = setInterval(() => {
      const message = generateMockMessage(topicType, Date.now());
      setSubscribers((prev) => {
        const current = prev.get(topicName) || {
          messages: [],
          latestMessage: null,
        };
        const newMessage = { data: message, timestamp: Date.now() };
        const updatedMessages = [newMessage, ...current.messages].slice(0, 21); // Keep last 21 messages
        return new Map(prev).set(topicName, {
          messages: updatedMessages,
          latestMessage: message,
        });
      });
    }, 1000); // Generate message every second

    setSubscriptionIntervals((prev) => new Map(prev).set(topicName, interval));
    toast.success(`Subscribed to ${topicName}`);
  };

  // Handle unsubscribe
  const handleUnsubscribe = (topicName: string) => {
    const interval = subscriptionIntervals.get(topicName);
    if (interval) {
      clearInterval(interval);
      setSubscriptionIntervals((prev) => {
        const newMap = new Map(prev);
        newMap.delete(topicName);
        return newMap;
      });
    }
    setSubscribers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(topicName);
      return newMap;
    });
    toast.info(`Unsubscribed from ${topicName}`);
  };

  // Handle publish
  const handlePublish = (topicName: string, message: any) => {
    toast.success(`Published message to ${topicName}`);
  };

  // Handle periodic publish start
  const handleStartPeriodicPublish = (
    topicName: string,
    message: any,
    rate: number
  ) => {
    setPublishers((prev) =>
      new Map(prev).set(topicName, {
        isPublishing: true,
        publishRate: rate,
        message,
      })
    );
    toast.success(`Started publishing to ${topicName} at ${rate} Hz`);
  };

  // Handle periodic publish stop
  const handleStopPeriodicPublish = (topicName: string) => {
    setPublishers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(topicName);
      return newMap;
    });
    toast.info(`Stopped publishing to ${topicName}`);
  };

  // Handle clear history
  const handleClearHistory = (topicName: string) => {
    setSubscribers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(topicName);
      return newMap;
    });
    toast.info("Message history cleared");
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      subscriptionIntervals.forEach((interval) => clearInterval(interval));
    };
  }, [subscriptionIntervals]);

  return (
    <div className="min-h-screen p-8 mt-40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            ROS UI Demo
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Interactive demonstration of ROS services and topics
          </p>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="services" className="text-sm">
                Services
              </TabsTrigger>
              <TabsTrigger value="topics" className="text-sm">
                Topics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <DemoServiceCard
                  service={MOCK_SERVICES[0]}
                  onServiceCall={handleServiceCall}
                />
              </div>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <DemoTopicCard
                  topic={MOCK_TOPICS[0]}
                  subscribers={subscribers}
                  publishers={publishers}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                  onPublish={handlePublish}
                  onStartPeriodic={handleStartPeriodicPublish}
                  onStopPeriodic={handleStopPeriodicPublish}
                  onClearHistory={handleClearHistory}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop side-by-side layout */}
        <div className="hidden md:flex md:flex-row justify-center gap-8">
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <DemoServiceCard
                service={MOCK_SERVICES[0]}
                onServiceCall={handleServiceCall}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <DemoTopicCard
                topic={MOCK_TOPICS[0]}
                subscribers={subscribers}
                publishers={publishers}
                onSubscribe={handleSubscribe}
                onUnsubscribe={handleUnsubscribe}
                onPublish={handlePublish}
                onStartPeriodic={handleStartPeriodicPublish}
                onStopPeriodic={handleStopPeriodicPublish}
                onClearHistory={handleClearHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
