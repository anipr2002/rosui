"use client";

import React from "react";
import { useActionsStore } from "@/store/action-store";
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
import { ActionInfoTab } from "./action-info-tab";
import { ActionGoalTab } from "./action-goal-tab";
import { Activity, Info, Target } from "lucide-react";

interface ActionCardProps {
  actionName: string;
  actionType: string;
}

export function ActionCard({ actionName, actionType }: ActionCardProps) {
  const { isLoadingActions, isLoadingDefinitions, activeGoals } =
    useActionsStore();

  const activeGoal = activeGoals.get(actionName);
  const isLoading =
    isLoadingActions || isLoadingDefinitions.get(actionType) || false;

  const borderColor = isLoading ? "border-blue-300" : "border-indigo-200";
  const headerBg = isLoading ? "bg-blue-50" : "bg-indigo-50";
  const headerText = isLoading ? "text-blue-900" : "text-indigo-900";
  const descriptionText = isLoading ? "text-blue-800" : "text-indigo-700";
  const iconColor = isLoading ? "text-blue-600" : "text-indigo-400";

  const tooltipColor = isLoading ? "blue" : "indigo";

  return (
    <Card className={`shadow-none pt-0 pb-0 rounded-xl ${borderColor}`}>
      <CardHeader
        className={`${headerBg} ${borderColor} border-b rounded-t-xl pt-6`}
      >
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start sm:gap-4">
            <Activity className={`h-5 w-5 mt-0.5 ${iconColor} flex-shrink-0`} />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle
                    className={`text-sm sm:text-base ${headerText} truncate cursor-help block`}
                    title={actionName}
                  >
                    {actionName}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words">{actionName}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardDescription
                    className={`text-xs ${descriptionText} font-mono truncate cursor-help block`}
                    title={actionType}
                  >
                    {actionType}
                  </CardDescription>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  colorVariant={tooltipColor}
                >
                  <p className="break-words font-mono text-xs">{actionType}</p>
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
            <TabsTrigger value="goal" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Send Goal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <ActionInfoTab actionName={actionName} actionType={actionType} />
          </TabsContent>

          <TabsContent value="goal" className="mt-4">
            <ActionGoalTab actionName={actionName} actionType={actionType} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
