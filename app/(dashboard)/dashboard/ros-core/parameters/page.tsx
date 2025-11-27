"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useParamsStore } from "@/store/param-store";
import { ParamCard, ParamLoading, ParamsEmptyState } from "@/components/dashboard/roscore/params";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { RosConnectionRequired } from "@/components/dashboard/misc";
import { Skeleton } from "@/components/ui/skeleton";

function ParametersPage() {
  const { ros, status } = useRosStore();
  const { params, isLoadingParams, getParamsList, cleanup } = useParamsStore();

  useEffect(() => {
    if (status === "connected" && ros) {
      try {
        getParamsList();
      } catch (error) {
        console.error("Failed to load parameters:", error);
        toast.error("Failed to load ROS parameters");
      }
    }
  }, [status, ros, getParamsList]);

  // Cleanup watchers when component unmounts
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Not connected state
  if (status !== "connected") {
    return <RosConnectionRequired title="Parameters" />;
  }

  // Loading state
  if (isLoadingParams) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ParamLoading key={`param-loading-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (params.length === 0) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Parameters</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS parameters
          </p>
        </div>

        <ParamsEmptyState />
      </div>
    );
  }

  // Parameters list
  return (
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Parameters</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS parameters ({params.length} available)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {params.map((param) => (
          <ParamCard key={param.name} paramName={param.name} />
        ))}
      </div>
    </div>
  );
}

export default ParametersPage;
