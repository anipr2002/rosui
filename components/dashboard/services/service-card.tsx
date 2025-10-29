"use client";

import React from "react";
import { useServicesStore } from "@/store/service-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceInfoTab } from "./service-info-tab";
import { ServiceCallTab } from "./service-call-tab";
import { Server, Info, Send } from "lucide-react";

interface ServiceCardProps {
  serviceName: string;
  serviceType: string;
}

export function ServiceCard({ serviceName, serviceType }: ServiceCardProps) {
  const { serviceCalls } = useServicesStore();
  const callInfo = serviceCalls.get(serviceName);
  const isLoading = callInfo?.isLoading || false;

  const borderColor = isLoading ? "border-blue-300" : "border-teal-200";
  const headerBg = isLoading ? "bg-blue-50" : "bg-teal-50";
  const headerText = isLoading ? "text-blue-900" : "text-teal-900";
  const descriptionText = isLoading ? "text-blue-800" : "text-teal-700";
  const iconColor = isLoading ? "text-blue-600" : "text-teal-400";

  const tooltipColor = isLoading ? "blue" : "teal";

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${borderColor}`}>
      <CardHeader
        className={`${headerBg} ${borderColor} border-b rounded-t-xl pt-6`}
      >
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start sm:gap-4">
            <Server className={`h-5 w-5 mt-0.5 ${iconColor} flex-shrink-0`} />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className={`text-sm sm:text-base ${headerText} truncate cursor-help block`}
                    title={serviceName}
                  >
                    {serviceName}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words">{serviceName}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardDescription
                    className={`text-xs ${descriptionText} font-mono truncate cursor-help block`}
                    title={serviceType}
                  >
                    {serviceType}
                  </CardDescription>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words font-mono text-xs">{serviceType}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="info" className="w-full">
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
            <ServiceInfoTab
              serviceName={serviceName}
              serviceType={serviceType}
            />
          </TabsContent>

          <TabsContent value="call" className="mt-4">
            <ServiceCallTab
              serviceName={serviceName}
              serviceType={serviceType}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
