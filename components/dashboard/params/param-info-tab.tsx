"use client";

import React, { useState, useEffect } from "react";
import { useParamsStore } from "@/store/param-store";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileCode, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ParamInfoTabProps {
  paramName: string;
}

export function ParamInfoTab({ paramName }: ParamInfoTabProps) {
  const { params, watchedParams, getParamValue } = useParamsStore();
  const [isLoading, setIsLoading] = useState(false);

  const param = params.find((p) => p.name === paramName);
  const watched = watchedParams.get(paramName);

  useEffect(() => {
    // Auto-fetch value if not already loaded
    if (!param?.value && !isLoading) {
      handleRefreshValue();
    }
  }, [paramName]);

  const handleRefreshValue = async () => {
    setIsLoading(true);
    try {
      await getParamValue(paramName);
      toast.success("Parameter value refreshed");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch parameter value";
      toast.error(errorMessage);
      console.error("Failed to refresh parameter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString() +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  const getValueType = (value: any): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };

  const formatValue = (value: any): string => {
    if (value === undefined) return "Not fetched";
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm font-medium text-gray-600">
            Parameter Name
          </span>
          <span className="text-sm font-mono text-gray-900">{paramName}</span>
        </div>

        <div className="flex justify-between items-start py-2 border-b">
          <span className="text-sm font-medium text-gray-600">
            Current Value
          </span>
          <div className="flex flex-col items-end gap-2">
            {param?.value !== undefined ? (
              <div className="bg-gray-50 border rounded px-2 py-1 max-w-xs">
                <pre className="text-xs font-mono text-gray-900 whitespace-pre-wrap break-words text-right">
                  {formatValue(param.value)}
                </pre>
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">
                Not fetched yet
              </span>
            )}
          </div>
        </div>

        {param?.lastFetched && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              Last Fetched
            </span>
            <span className="text-xs font-mono text-gray-900">
              {formatTimestamp(param.lastFetched)}
            </span>
          </div>
        )}

        <Button
          onClick={handleRefreshValue}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Value
            </>
          )}
        </Button>
      </div>

      {/* Accordion with Additional Info */}
      <Accordion type="single" collapsible className="w-full">
        {/* Value Type */}
        <AccordionItem value="type">
          <AccordionTrigger className="text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-gray-600" />
              <span>Value Type</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {param?.value !== undefined ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {getValueType(param.value)}
                  </Badge>
                  {Array.isArray(param.value) && (
                    <span className="text-xs text-gray-500">
                      Length: {param.value.length}
                    </span>
                  )}
                  {typeof param.value === "object" &&
                    param.value !== null &&
                    !Array.isArray(param.value) && (
                      <span className="text-xs text-gray-500">
                        Keys: {Object.keys(param.value).length}
                      </span>
                    )}
                </div>
              ) : (
                <div className="p-4 text-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-gray-500">
                    Fetch the parameter value to see its type
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Value History */}
        {watched && watched.history.length > 0 && (
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <span>Value History ({watched.history.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {watched.history.slice(0, 20).map((record, index) => (
                  <div key={index} className="bg-gray-50 border rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                      {formatValue(record.value)}
                    </pre>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

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
              {watched?.isWatching ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Watch Status
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      Poll Rate
                    </span>
                    <span className="text-xs font-mono text-gray-900">
                      {watched.pollRate} Hz
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs font-medium text-gray-600">
                      History Records
                    </span>
                    <span className="text-xs font-mono text-gray-900">
                      {watched.history.length}
                    </span>
                  </div>
                  {watched.history.length > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-xs font-medium text-gray-600">
                        Last Update
                      </span>
                      <span className="text-xs font-mono text-gray-900">
                        {formatTimestamp(watched.history[0].timestamp)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Not currently watching this parameter. Use the Watch tab to
                    start monitoring.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          Use the Edit tab to modify this parameter, or the Watch tab to monitor
          its changes over time.
        </p>
      </div>
    </div>
  );
}
