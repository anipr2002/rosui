"use client";

import React, { useEffect } from "react";
import { useRosStore } from "@/store/ros-store";
import { useTopicsStore } from "@/store/topic-store";
import { TopicCard, TopicLoading, TopicsEmptyState } from "@/components/dashboard/roscore/topics";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { RosConnectionRequired } from "@/components/dashboard/misc";
import { Skeleton } from "@/components/ui/skeleton";

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
    return <RosConnectionRequired title="Topics" />;
  }

  // Loading state
  if (isLoadingTopics) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <TopicLoading key={`topic-loading-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (topics.length === 0) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS topics
          </p>
        </div>
<TopicsEmptyState />
      </div>
    );
  }

  // Topics list
  return (
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS topics ({topics.length} available)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
