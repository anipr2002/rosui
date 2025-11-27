"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Upload, Radio, FolderPlus } from "lucide-react";
import { StorageQuotaCompact } from "./storage-quota-compact";
import Link from "next/link";

interface LibraryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
  onCreateProjectClick: () => void;
  isFreeUser: boolean;
}

export function LibraryHeader({
  searchQuery,
  onSearchChange,
  onUploadClick,
  onCreateProjectClick,
  isFreeUser,
}: LibraryHeaderProps) {
  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Top Bar: Title & Storage */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <StorageQuotaCompact />
      </div>

      {/* Controls Bar: Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for files, projects..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {!isFreeUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onUploadClick} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/rosbag/record" className="gap-2 flex items-center w-full cursor-pointer">
                  <Radio className="h-4 w-4" />
                  Record New
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateProjectClick} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
