"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
import {
  useLogStore,
  LogLevel,
  getLevelLabel,
  getLevelColor,
} from "@/store/log-store";

export function LogFilters() {
  const { filters, availableNodes, setFilter, clearFilters } = useLogStore();
  const [isOpen, setIsOpen] = useState(false);
  const [nodeSearchTerm, setNodeSearchTerm] = useState("");

  const severityLevels: LogLevel[] = [10, 20, 30, 40, 50];

  const toggleSeverity = (level: LogLevel) => {
    // If all levels are currently selected, treat the click as selecting only this level
    if (filters.severityLevels.length === severityLevels.length) {
      setFilter({ severityLevels: [level] });
      return;
    }

    const newLevels = filters.severityLevels.includes(level)
      ? filters.severityLevels.filter((l) => l !== level)
      : [...filters.severityLevels, level];
    setFilter({ severityLevels: newLevels });
  };

  const toggleNode = (nodeName: string) => {
    const newNodes = filters.nodeNames.includes(nodeName)
      ? filters.nodeNames.filter((n) => n !== nodeName)
      : [...filters.nodeNames, nodeName];
    setFilter({ nodeNames: newNodes });
  };

  const removeNodeFilter = (nodeName: string) => {
    setFilter({ nodeNames: filters.nodeNames.filter((n) => n !== nodeName) });
  };

  const filteredNodes = Array.from(availableNodes).filter((node) =>
    node.toLowerCase().includes(nodeSearchTerm.toLowerCase())
  );

  const hasActiveFilters =
    filters.severityLevels.length < 5 ||
    filters.nodeNames.length > 0 ||
    filters.textSearch.trim() !== "" ||
    filters.timeRange !== "all";

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={filters.textSearch}
            onChange={(e) => setFilter({ textSearch: e.target.value })}
            className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          Filters
          {hasActiveFilters && (
            <Badge className="ml-2 bg-indigo-600 text-white text-xs">
              Active
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Active filters:</span>

          {filters.severityLevels.length < 5 &&
            filters.severityLevels.map((level) => (
              <Badge
                key={level}
                className={`${getLevelColor(
                  level
                )} text-xs cursor-pointer hover:opacity-80`}
                onClick={() => toggleSeverity(level)}
              >
                {getLevelLabel(level)}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}

          {filters.nodeNames.map((nodeName) => (
            <Badge
              key={nodeName}
              className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs cursor-pointer hover:bg-cyan-200"
              onClick={() => removeNodeFilter(nodeName)}
            >
              {nodeName}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}

          {filters.timeRange !== "all" && (
            <Badge
              className="bg-purple-100 text-purple-700 border-purple-200 text-xs cursor-pointer hover:bg-purple-200"
              onClick={() => setFilter({ timeRange: "all" })}
            >
              {filters.timeRange === "custom"
                ? "Custom Range"
                : filters.timeRange}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Expandable Filters Section */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="border border-gray-300 rounded-lg p-4 space-y-4 bg-white">
          {/* Severity Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Severity Levels
            </Label>
            <div className="flex flex-wrap gap-2">
              {severityLevels.map((level) => {
                const isActive = filters.severityLevels.includes(level);
                return (
                  <Badge
                    key={level}
                    className={`${
                      isActive
                        ? getLevelColor(level)
                        : "bg-gray-100 text-gray-500 border-gray-300"
                    } cursor-pointer hover:opacity-80 text-xs`}
                    onClick={() => toggleSeverity(level)}
                  >
                    {isActive && "✓ "}
                    {getLevelLabel(level)}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Node Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Filter by Node
            </Label>
            <Input
              placeholder="Search nodes..."
              value={nodeSearchTerm}
              onChange={(e) => setNodeSearchTerm(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
            {filteredNodes.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-300 rounded-lg p-2 bg-gray-50">
                {filteredNodes.map((nodeName) => {
                  const isActive = filters.nodeNames.includes(nodeName);
                  return (
                    <div
                      key={nodeName}
                      className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
                        isActive ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => toggleNode(nodeName)}
                    >
                      <span className="text-xs font-mono text-gray-700 truncate">
                        {nodeName}
                      </span>
                      {isActive && (
                        <Badge className="bg-indigo-600 text-white text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {filteredNodes.length === 0 && availableNodes.size > 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                No nodes match your search
              </p>
            )}
            {availableNodes.size === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                No nodes available yet
              </p>
            )}
          </div>

          {/* Text Search Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Use Regular Expression
              </Label>
              <Switch
                checked={filters.useRegex}
                onCheckedChange={(checked) => setFilter({ useRegex: checked })}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
            {filters.useRegex && (
              <p className="text-xs text-gray-500">
                Text search will be treated as a regex pattern
              </p>
            )}
          </div>

          {/* Time Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Time Range
            </Label>
            <Select
              value={filters.timeRange}
              onValueChange={(value) => setFilter({ timeRange: value as any })}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="5min">Last 5 Minutes</SelectItem>
                <SelectItem value="30min">Last 30 Minutes</SelectItem>
                <SelectItem value="1hour">Last 1 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
