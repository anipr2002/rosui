"use client";

import React, { useState, useCallback } from "react";
import { usePanelsStore, type IndicatorRule } from "@/store/panels-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface RulesConfigProps {
  panelId: string;
  rules: IndicatorRule[];
}

const COMPARISON_OPTIONS = [
  { value: "equal", label: "Equal to" },
  { value: "less", label: "Less than" },
  { value: "lessOrEqual", label: "Less than or equal to" },
  { value: "greater", label: "Greater than" },
  { value: "greaterOrEqual", label: "Greater than or equal to" },
];

const COLOR_PRESETS = [
  { value: "#22c55e", label: "Green", class: "bg-green-500" },
  { value: "#eab308", label: "Yellow", class: "bg-yellow-500" },
  { value: "#f97316", label: "Orange", class: "bg-orange-500" },
  { value: "#ef4444", label: "Red", class: "bg-red-500" },
  { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
  { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
  { value: "#ec4899", label: "Pink", class: "bg-pink-500" },
  { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
];

export function RulesConfig({ panelId, rules }: RulesConfigProps) {
  const {
    addIndicatorRule,
    updateIndicatorRule,
    removeIndicatorRule,
    reorderIndicatorRules,
  } = usePanelsStore();

  const handleAddRule = useCallback(() => {
    addIndicatorRule(panelId, {
      comparison: "equal",
      compareWith: 0,
      color: "#22c55e",
      label: "New Rule",
    });
  }, [panelId, addIndicatorRule]);

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      removeIndicatorRule(panelId, ruleId);
    },
    [panelId, removeIndicatorRule]
  );

  const handleUpdateRule = useCallback(
    (ruleId: string, updates: Partial<IndicatorRule>) => {
      updateIndicatorRule(panelId, ruleId, updates);
    },
    [panelId, updateIndicatorRule]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        reorderIndicatorRules(panelId, index, index - 1);
      }
    },
    [panelId, reorderIndicatorRules]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < rules.length - 1) {
        reorderIndicatorRules(panelId, index, index + 1);
      }
    },
    [panelId, rules.length, reorderIndicatorRules]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Rules</h4>
          <p className="text-xs text-gray-500 mt-1">
            First matching rule wins. Order matters.
          </p>
        </div>
        <Button
          onClick={handleAddRule}
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">
            No rules configured. Click &quot;Add Rule&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <Card key={rule.id} className="p-4 border border-gray-200">
              <div className="space-y-3">
                {/* Rule Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      Rule {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleMoveUp(index)}
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleMoveDown(index)}
                      variant="ghost"
                      size="sm"
                      disabled={index === rules.length - 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleRemoveRule(rule.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Comparison */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`comparison-${rule.id}`}
                    className="text-xs font-medium"
                  >
                    Comparison
                  </Label>
                  <Select
                    value={rule.comparison}
                    onValueChange={(value) =>
                      handleUpdateRule(rule.id, {
                        comparison: value as IndicatorRule["comparison"],
                      })
                    }
                  >
                    <SelectTrigger
                      id={`comparison-${rule.id}`}
                      className="bg-white text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPARISON_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Compare With */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`compareWith-${rule.id}`}
                    className="text-xs font-medium"
                  >
                    Compare with
                  </Label>
                  <Input
                    id={`compareWith-${rule.id}`}
                    value={rule.compareWith.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Try to parse as number, otherwise keep as string
                      const parsedValue = !isNaN(Number(value))
                        ? Number(value)
                        : value;
                      handleUpdateRule(rule.id, { compareWith: parsedValue });
                    }}
                    placeholder="Value to compare"
                    className="bg-white text-xs font-mono"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`color-${rule.id}`}
                    className="text-xs font-medium"
                  >
                    Color
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={rule.color}
                      onValueChange={(value) =>
                        handleUpdateRule(rule.id, { color: value })
                      }
                    >
                      <SelectTrigger
                        id={`color-${rule.id}`}
                        className="bg-white text-xs flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: rule.color }}
                          />
                          <span>
                            {COLOR_PRESETS.find((c) => c.value === rule.color)
                              ?.label || "Custom"}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PRESETS.map((color) => (
                          <SelectItem
                            key={color.value}
                            value={color.value}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded ${color.class}`}
                              />
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="color"
                      value={rule.color}
                      onChange={(e) =>
                        handleUpdateRule(rule.id, { color: e.target.value })
                      }
                      className="w-16 h-9 p-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`label-${rule.id}`}
                    className="text-xs font-medium"
                  >
                    Label
                  </Label>
                  <Input
                    id={`label-${rule.id}`}
                    value={rule.label}
                    onChange={(e) =>
                      handleUpdateRule(rule.id, { label: e.target.value })
                    }
                    placeholder="Display label"
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
