"use client";

import React, { useEffect } from "react";
import { useServicesStore } from "@/store/service-store";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, FileCode } from "lucide-react";

interface ServiceInfoTabProps {
  serviceName: string;
  serviceType: string;
}

export function ServiceInfoTab({
  serviceName,
  serviceType,
}: ServiceInfoTabProps) {
  const { serviceDefinitions, isLoadingDefinitions, getServiceDefinition } =
    useServicesStore();

  const definition = serviceDefinitions.get(serviceType);
  const isLoading = isLoadingDefinitions.get(serviceType) || false;

  useEffect(() => {
    if (!definition) {
      getServiceDefinition(serviceType);
    }
  }, [definition, getServiceDefinition, serviceType]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-3 py-2 border-b">
            <span className="text-sm font-medium text-gray-600 flex-shrink-0">
              Service Name
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-mono text-gray-900 text-right break-all cursor-help">
                  {serviceName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="break-words font-mono text-xs">{serviceName}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex justify-between items-start gap-3 py-2 border-b">
            <span className="text-sm font-medium text-gray-600 flex-shrink-0">
              Service Type
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-mono text-gray-900 text-right break-all cursor-help">
                  {serviceType}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="break-words font-mono text-xs">{serviceType}</p>
              </TooltipContent>
            </Tooltip>
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
              {isLoading && !definition ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : definition ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      Request
                    </h4>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {definition.request.definition || "Empty request"}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      Response
                    </h4>
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                        {definition.response.definition || "Empty response"}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-gray-500">
                    Service definition not available.
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
}
