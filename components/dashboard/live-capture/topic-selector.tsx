"use client";

import { useState, useMemo } from "react";
import { Search, Radio, CheckSquare, Square } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTopicsStore } from "@/store/topic-store";
import { useLiveCaptureStore } from "@/store/live-capture-store";
import type { RecordingTopic } from "@/lib/db/live-capture-db";

export function TopicSelector() {
  const { topics } = useTopicsStore();
  const { selectedTopics, setSelectedTopics, status } = useLiveCaptureStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isRecording = status === "recording";

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;

    const query = searchQuery.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(query) ||
        topic.type.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);

  const handleToggleTopic = (topicName: string, topicType: string) => {
    if (isRecording) return; // Don't allow changes while recording

    const isSelected = selectedTopics.some((t) => t.name === topicName);

    if (isSelected) {
      setSelectedTopics(selectedTopics.filter((t) => t.name !== topicName));
    } else {
      setSelectedTopics([
        ...selectedTopics,
        { name: topicName, type: topicType },
      ]);
    }
  };

  const handleSelectAll = () => {
    if (isRecording) return;

    if (selectedTopics.length === filteredTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(
        filteredTopics.map((t) => ({ name: t.name, type: t.type }))
      );
    }
  };

  const isTopicSelected = (topicName: string) => {
    return selectedTopics.some((t) => t.name === topicName);
  };

  const allSelected =
    filteredTopics.length > 0 &&
    selectedTopics.length === filteredTopics.length;

  return (
    <Card className="shadow-none pt-0 rounded-xl border-indigo-200">
      <CardHeader className="bg-indigo-50 border-indigo-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4">
          <Radio className="h-5 w-5 mt-0.5 text-indigo-900" />
          <div>
            <CardTitle className="text-base text-indigo-900">
              Topic Selection
            </CardTitle>
            <CardDescription className="text-xs text-indigo-700">
              Choose topics to record
            </CardDescription>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
            {selectedTopics.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {/* Search and Select All */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
                disabled={isRecording}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isRecording || filteredTopics.length === 0}
              className="whitespace-nowrap"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Select All
                </>
              )}
            </Button>
          </div>

          {/* Topic List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredTopics.length === 0 ? (
                <div className="p-8 text-center">
                  <Radio className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {searchQuery ? "No topics found" : "No topics available"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Connect to ROS to see available topics"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTopics.map((topic) => {
                    const selected = isTopicSelected(topic.name);
                    return (
                      <button
                        key={topic.name}
                        onClick={() =>
                          handleToggleTopic(topic.name, topic.type)
                        }
                        disabled={isRecording}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                          isRecording
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        } ${selected ? "bg-indigo-50" : ""}`}
                      >
                        <div className="mt-0.5">
                          {selected ? (
                            <CheckSquare className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {topic.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {topic.type}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Topics Summary */}
          {selectedTopics.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Selected Topics ({selectedTopics.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic) => (
                  <Badge
                    key={topic.name}
                    variant="outline"
                    className="bg-white text-xs"
                  >
                    {topic.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
