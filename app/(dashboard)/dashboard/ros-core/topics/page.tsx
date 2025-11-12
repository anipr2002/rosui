"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useTopicsStore } from "@/store/topic-store";
import { TopicCard } from "@/components/dashboard/roscore/topics";
import { AlertCircle, ArrowRight, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { SpinnerCustom } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function TopicsPage() {
  const { ros, status } = useRosStore();
  const { topics, isLoadingTopics, getTopicsList, cleanup } = useTopicsStore();

  useEffect(() => {
    if (status === "connected" && ros) {
      try {
        getTopicsList();
      } catch (error) {
        console.error("Failed to load topics:", error);
        toast.error("Failed to load ROS topics");
      }
    }
  }, [status, ros, getTopicsList]);

  // Cleanup subscriptions and publishers when component unmounts
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
          <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS topics
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
                  topics.
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
  if (isLoadingTopics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-amber-900">
                  Loading ROS Topics...
                </h3>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Please wait while we load the ROS topics...
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
    );
  }

  // Empty state
  if (topics.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS topics
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center">
            <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              No Topics Available
            </h3>
            <p className="text-sm text-gray-500">
              No ROS topics were found. Make sure your ROS system is running and
              publishing topics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Topics list
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS topics ({topics.length} available)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <TopicCard
            key={topic.name}
            topicName={topic.name}
            topicType={topic.type}
          />
        ))}
      </div>
    </div>
  );
}

export default TopicsPage;
