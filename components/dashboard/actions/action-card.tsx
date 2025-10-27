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

  const borderColor = isLoading ? "border-blue-300" : "border-gray-200";
  const headerBg = isLoading ? "bg-blue-50" : "bg-gray-50";
  const headerText = isLoading ? "text-blue-900" : "text-gray-900";
  const descriptionText = isLoading ? "text-blue-800" : "text-gray-700";
  const iconColor = isLoading ? "text-blue-600" : "text-gray-400";

  return (
    <Card className={`shadow-none pt-0 pb-0 rounded-xl ${borderColor}`}>
      <CardHeader
        className={`${headerBg} ${borderColor} border-b rounded-t-xl pt-6`}
      >
        <div className="flex items-start gap-3">
          <Activity className={`h-5 w-5 mt-0.5 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-base ${headerText} break-words`}>
              {actionName}
            </CardTitle>
            <CardDescription
              className={`mt-1 text-xs ${descriptionText} font-mono break-words`}
            >
              {actionType}
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
