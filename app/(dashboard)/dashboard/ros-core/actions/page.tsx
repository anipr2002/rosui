"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useActionsStore } from "@/store/action-store";
import {
  ActionCard,
  ActionLoading,
  ActionsEmptyState,
} from "@/components/dashboard/roscore/actions";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { RosConnectionRequired } from "@/components/dashboard/misc";
import { Skeleton } from "@/components/ui/skeleton";

function ActionsPage() {
  const { ros, status } = useRosStore();
  const { actions, isLoadingActions, getActionsList, cleanup } =
    useActionsStore();

  useEffect(() => {
    if (status === "connected" && ros) {
      try {
        getActionsList();
      } catch (error) {
        console.error("Failed to load action servers:", error);
        toast.error("Failed to load ROS action servers");
      }
    }
  }, [status, ros, getActionsList]);

  // Cleanup action clients when component unmounts
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Not connected state
  if (status !== "connected") {
    return <RosConnectionRequired title="Actions" />;
  }

  // Loading state
  if (isLoadingActions) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ActionLoading key={`action-loading-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (actions.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Actions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS action servers
          </p>
        </div>

        <ActionsEmptyState />
      </div>
    );
  }

  // Actions list
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Actions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS action servers ({actions.length} available)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <ActionCard
            key={action.name}
            actionName={action.name}
            actionType={action.type}
          />
        ))}
      </div>
    </div>
  );
}

export default ActionsPage;
