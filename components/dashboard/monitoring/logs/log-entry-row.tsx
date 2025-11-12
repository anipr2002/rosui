"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";
import { LogEntry, getLevelLabel, getLevelColor } from "@/store/log-store";
import { toast } from "sonner";

interface LogEntryRowProps {
  log: LogEntry;
}

export function LogEntryRow({ log }: LogEntryRowProps) {
  const [copied, setCopied] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  const handleCopy = () => {
    const logText = `[${formatTimestamp(log.timestamp)}] [${getLevelLabel(log.level)}] [${log.name}] ${log.msg}`;
    navigator.clipboard.writeText(logText).then(() => {
      setCopied(true);
      toast.success("Log entry copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatFullTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div
      className="group flex items-start gap-3 px-4 py-2 hover:bg-gray-50 border-b border-gray-200 font-mono text-xs transition-colors cursor-pointer"
      onClick={handleCopy}
    >
      {/* Timestamp */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-gray-500 flex-shrink-0 w-28 cursor-help">
              {formatTimestamp(log.timestamp)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{formatFullTimestamp(log.timestamp)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Severity Badge */}
      <Badge
        className={`${getLevelColor(log.level)} text-xs flex-shrink-0 w-16 justify-center`}
      >
        {getLevelLabel(log.level)}
      </Badge>

      {/* Node Name */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-indigo-600 flex-shrink-0 w-48 truncate cursor-help font-semibold">
              {log.name}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="break-words">{log.name}</p>
            {log.file && (
              <p className="text-xs text-gray-400 mt-1">
                {log.file}
                {log.line ? `:${log.line}` : ""}
              </p>
            )}
            {log.function && (
              <p className="text-xs text-gray-400">Function: {log.function}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Message */}
      <span className="text-gray-800 flex-1 break-words whitespace-pre-wrap">
        {log.msg}
      </span>

      {/* Copy Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
        aria-label="Copy log entry"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}


