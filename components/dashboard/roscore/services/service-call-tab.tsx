"use client";

import React, { useState, useEffect } from "react";
import { useServicesStore } from "@/store/service-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ServiceCallTabProps {
  serviceName: string;
  serviceType: string;
}

export function ServiceCallTab({
  serviceName,
  serviceType,
}: ServiceCallTabProps) {
  const {
    serviceDefinitions,
    isLoadingDefinitions,
    getServiceDefinition,
    callService,
    serviceCalls,
  } = useServicesStore();

  const definition = serviceDefinitions.get(serviceType);
  const isLoading = isLoadingDefinitions.get(serviceType) || false;
  const callInfo = serviceCalls.get(serviceName);
  const isCallLoading = callInfo?.isLoading || false;

  const [requestJson, setRequestJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!definition) {
      getServiceDefinition(serviceType);
    }
  }, [definition, getServiceDefinition, serviceType]);

  useEffect(() => {
    // Initialize with default message structure
    // Only initialize after definition is loaded to avoid parser errors
    if (definition && requestJson === "" && !isLoading) {
      const defaultMessage = definition.request.defaultMessage;
      console.log("Service call tab - defaultMessage:", defaultMessage);
      console.log(
        "Service call tab - defaultMessage keys:",
        Object.keys(defaultMessage || {})
      );
      console.log(
        "Service call tab - request definition:",
        definition.request.definition
      );

      if (defaultMessage && Object.keys(defaultMessage).length > 0) {
        setRequestJson(JSON.stringify(defaultMessage, null, 2));
      } else {
        // Try to create a basic structure from the definition text
        console.log(
          "Service call tab - attempting to create structure from definition"
        );
        const basicStructure = createBasicStructureFromDefinition(
          definition.request.definition
        );
        if (basicStructure && Object.keys(basicStructure).length > 0) {
          setRequestJson(JSON.stringify(basicStructure, null, 2));
        } else {
          // Final fallback to empty object
          console.log("Service call tab - using fallback empty object");
          setRequestJson("{}");
        }
      }
    }
  }, [definition, requestJson, isLoading]);

  // Helper function to create basic structure from definition text
  const createBasicStructureFromDefinition = (definitionText: string) => {
    if (!definitionText) return {};

    const lines = definitionText
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));
    const structure: any = {};

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const type = parts[0];
        const name = parts[1];

        // Remove array notation for simplicity
        let cleanName = name.replace(/\[.*\]/, "");
        // Remove leading underscore from field name for compatibility
        cleanName = cleanName.startsWith("_")
          ? cleanName.substring(1)
          : cleanName;

        // Set default values based on type
        if (type === "string") {
          structure[cleanName] = "";
        } else if (
          type.includes("int") ||
          type.includes("float") ||
          type.includes("uint")
        ) {
          structure[cleanName] = 0;
        } else if (type === "bool") {
          structure[cleanName] = false;
        } else {
          structure[cleanName] = {};
        }
      }
    }

    return structure;
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

  const handleCallService = async () => {
    const request = validateJson(requestJson);
    if (!request) {
      toast.error("Invalid JSON format for service request");
      return;
    }

    try {
      toast.info(`Calling service ${serviceName}...`);
      await callService(serviceName, serviceType, request);
      toast.success(`Service ${serviceName} called successfully.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to call service";
      toast.error(errorMessage);
      console.error("Service call error:", error);
    }
  };

  const handleRequestChange = (value: string) => {
    setRequestJson(value);
    if (jsonError) {
      setJsonError(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Request Editor */}
      <div className="space-y-2">
        <Label htmlFor="request-json" className="text-sm font-medium">
          Request (JSON)
        </Label>
        <textarea
          id="request-json"
          value={requestJson}
          onChange={(e) => handleRequestChange(e.target.value)}
          className="w-full min-h-[150px] p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Enter request JSON..."
          disabled={isCallLoading}
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

      {/* Response Display */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Response</Label>
        <div className="w-full min-h-[150px] p-3 font-mono text-sm border rounded-lg bg-gray-50 overflow-x-auto">
          {callInfo?.response && (
            <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
              {JSON.stringify(callInfo.response, null, 2)}
            </pre>
          )}
          {callInfo?.error && (
            <div className="text-red-700">
              <p className="font-bold">Error:</p>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {callInfo.error}
              </pre>
            </div>
          )}
          {!callInfo?.response && !callInfo?.error && (
            <p className="text-xs text-gray-500">
              Service response will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
