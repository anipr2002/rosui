"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Settings,
  Zap,
  FileText,
} from "lucide-react";
import { useTopicsStore } from "@/store/topic-store";
import { useServicesStore } from "@/store/service-store";
import { useActionsStore } from "@/store/action-store";
import { useParamsStore } from "@/store/param-store";
import { useRosStore } from "@/store/ros-store";
import { toast } from "sonner";

export function RefreshButton() {
  const getTopicsList = useTopicsStore((state) => state.getTopicsList);
  const isLoadingTopics = useTopicsStore((state) => state.isLoadingTopics);
  const getServicesList = useServicesStore((state) => state.getServicesList);
  const isLoadingServices = useServicesStore(
    (state) => state.isLoadingServices
  );
  const getActionsList = useActionsStore((state) => state.getActionsList);
  const isLoadingActions = useActionsStore((state) => state.isLoadingActions);
  const getParamsList = useParamsStore((state) => state.getParamsList);
  const isLoadingParams = useParamsStore((state) => state.isLoadingParams);
  const status = useRosStore((state) => state.status);

  const isConnected = status === "connected";
  const isAnyLoading =
    isLoadingTopics || isLoadingServices || isLoadingActions || isLoadingParams;
  const isDisabled = !isConnected;

  const handleRefreshTopics = async () => {
    if (isDisabled || isLoadingTopics) return;
    try {
      await getTopicsList();
      toast.success("Topics list refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh topics list");
      console.error("Failed to refresh topics list:", error);
    }
  };

  const handleRefreshServices = async () => {
    if (isDisabled || isLoadingServices) return;
    try {
      await getServicesList();
      toast.success("Services list refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh services list");
      console.error("Failed to refresh services list:", error);
    }
  };

  const handleRefreshActions = async () => {
    if (isDisabled || isLoadingActions) return;
    try {
      await getActionsList();
      toast.success("Actions list refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh actions list");
      console.error("Failed to refresh actions list:", error);
    }
  };

  const handleRefreshParams = async () => {
    if (isDisabled || isLoadingParams) return;
    try {
      await getParamsList();
      toast.success("Parameters list refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh parameters list");
      console.error("Failed to refresh parameters list:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh ROS Resources"
        >
          <RefreshCw
            className={`h-4 w-4 ${isAnyLoading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-blue-50 border border-blue-200"
      >
        <DropdownMenuItem
          onClick={handleRefreshTopics}
          disabled={isLoadingTopics || isDisabled}
          className="cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span>Topics</span>
          {isLoadingTopics && (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRefreshServices}
          disabled={isLoadingServices || isDisabled}
          className="cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Settings className="h-4 w-4 mr-2" />
          <span>Services</span>
          {isLoadingServices && (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRefreshActions}
          disabled={isLoadingActions || isDisabled}
          className="cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="h-4 w-4 mr-2" />
          <span>Actions</span>
          {isLoadingActions && (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRefreshParams}
          disabled={isLoadingParams || isDisabled}
          className="cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span>Parameters</span>
          {isLoadingParams && (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
