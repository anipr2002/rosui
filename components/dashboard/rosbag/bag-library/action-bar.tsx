"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Radio, FolderPlus, Grid3x3, List } from "lucide-react";

interface ActionBarProps {
  onUploadClick: () => void;
  onCreateProjectClick: () => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function ActionBar({
  onUploadClick,
  onCreateProjectClick,
  viewMode,
  onViewModeChange,
}: ActionBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          className="bg-green-200 border-green-500 border-1 text-green-500 hover:bg-green-500 hover:text-white"
          onClick={onUploadClick}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>

        <Link href="/dashboard/rosbag/record">
          <Button className="bg-purple-200 border-purple-500 border-1 text-purple-500 hover:bg-purple-500 hover:text-white">
            <Radio className="h-4 w-4 mr-2" />
            Record New
          </Button>
        </Link>

        <Button
          className="bg-indigo-200 border-indigo-500 border-1 text-indigo-500 hover:bg-indigo-500 hover:text-white"
          onClick={onCreateProjectClick}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-1 border rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className={viewMode === "grid" ? "bg-gray-100" : ""}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("list")}
          className={viewMode === "list" ? "bg-gray-100" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
