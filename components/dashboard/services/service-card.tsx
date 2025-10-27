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

  const borderColor = isLoading ? "border-blue-300" : "border-gray-200";
  const headerBg = isLoading ? "bg-blue-50" : "bg-gray-50";
  const headerText = isLoading ? "text-blue-900" : "text-gray-900";
  const descriptionText = isLoading ? "text-blue-800" : "text-gray-700";
  const iconColor = isLoading ? "text-blue-600" : "text-gray-400";

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${borderColor}`}>
      <CardHeader
        className={`${headerBg} ${borderColor} border-b rounded-t-xl pt-6`}
      >
        <div className="flex items-start gap-3">
          <Server className={`h-5 w-5 mt-0.5 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-base ${headerText} break-words`}>
              {serviceName}
            </CardTitle>
            <CardDescription
              className={`mt-1 text-xs ${descriptionText} font-mono break-words`}
            >
              {serviceType}
            </CardDescription>
          </div>
        </div>
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
