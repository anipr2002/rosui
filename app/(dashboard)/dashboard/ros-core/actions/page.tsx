"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useActionsStore } from "@/store/action-store";
import {
  ActionCard,
  ActionLoading,
} from "@/components/dashboard/roscore/actions";
import { AlertCircle, ArrowRight, Activity } from "lucide-react";
import { toast } from "sonner";
import { SpinnerCustom } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Actions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS action servers
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-900">
                    ROS Connection Required
                  </h3>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Please connect to ROS bridge from the Settings page to view
                  action servers.
                </p>
                <SpinnerCustom />
                <Link href="/dashboard/settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              No Action Servers Available
            </h3>
            <p className="text-sm text-gray-500">
              No ROS action servers were found. Make sure your ROS system is
              running and has action servers available.
            </p>
          </div>
        </div>
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
