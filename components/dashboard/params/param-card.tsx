"use client";

import React from "react";
import { useParamsStore } from "@/store/param-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ParamInfoTab } from "./param-info-tab";
import { ParamEditTab } from "./param-edit-tab";
import { ParamWatchTab } from "./param-watch-tab";
import { Settings, Info, Edit, Eye } from "lucide-react";

interface ParamCardProps {
  paramName: string;
}

export function ParamCard({ paramName }: ParamCardProps) {
  const { watchedParams, params } = useParamsStore();

  const watched = watchedParams.get(paramName);
  const isWatching = watched?.isWatching || false;
  const param = params.find((p) => p.name === paramName);

  const getStatusColors = () => {
    if (isWatching) {
      // Watching - blue state
      return {
        border: "border-blue-300",
        borderInner: "",
        headerBg: "bg-blue-50",
        headerText: "text-blue-900",
        descriptionText: "text-blue-800",
        iconColor: "text-blue-600",
      };
    } else {
      // Default - inactive
      return {
        border: "border-gray-200",
        borderInner: "",
        headerBg: "bg-gray-50",
        headerText: "text-gray-900",
        descriptionText: "text-gray-700",
        iconColor: "text-gray-400",
      };
    }
  };

  const getStatusBadges = () => {
    const badges = [];

    if (isWatching) {
      badges.push(
        <Badge
          key="watching"
          className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Watching
          </div>
        </Badge>
      );
    }

    if (badges.length === 0) {
      badges.push(
        <Badge
          key="inactive"
          className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
        >
          Inactive
        </Badge>
      );
    }

    return badges;
  };

  const colors = getStatusColors();

  return (
    <Card className={`shadow-none pt-0 rounded-xl ${colors.border}`}>
      <CardHeader
        className={`${colors.headerBg} ${colors.border} border-b rounded-t-xl pt-6`}
      >
        <div className="flex items-start gap-3">
          <Settings className={`h-5 w-5 mt-0.5 ${colors.iconColor}`} />
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-base ${colors.headerText} break-words`}>
              {paramName}
            </CardTitle>
            {param?.type && (
              <CardDescription
                className={`mt-1 text-xs ${colors.descriptionText} font-mono break-words`}
              >
                Type: {param.type}
              </CardDescription>
            )}
          </div>
        </div>
        <CardAction>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadges()}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="edit" className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="watch" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Watch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <ParamInfoTab paramName={paramName} />
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <ParamEditTab paramName={paramName} />
          </TabsContent>

          <TabsContent value="watch" className="mt-4">
            <ParamWatchTab paramName={paramName} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
