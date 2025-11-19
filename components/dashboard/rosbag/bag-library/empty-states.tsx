"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Upload, Radio, Folder, Users, FolderPlus } from "lucide-react";

// Empty state for free users
export function FreeUserEmptyState() {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center mx-auto">
      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Storage Not Available
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Upgrade to Pro or Team to store rosbag files in the cloud
      </p>
      <Link href="/pricing">
        <Button className="bg-indigo-200 border-indigo-500 border-1 text-indigo-500 hover:bg-indigo-500 hover:text-white">
          Upgrade Now
        </Button>
      </Link>
    </div>
  );
}

// Empty state for paid users with no files
export function PaidUserEmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center mx-auto">
      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No Files Yet
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload rosbag files or record new ones to get started
      </p>
      <div className="flex items-center gap-2 justify-center">
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
      </div>
    </div>
  );
}

// Empty state for no projects
export function NoProjectsEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center mx-auto">
      <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No Projects Yet
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Create projects to organize your rosbag files
      </p>
      <Button 
        className="bg-purple-200 border-purple-500 border-1 text-purple-500 hover:bg-purple-500 hover:text-white"
        onClick={onCreateClick}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        Create Project
      </Button>
    </div>
  );
}

// Empty state for no shared files
export function NoSharedFilesEmptyState() {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md text-center mx-auto">
      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No Shared Files
      </h3>
      <p className="text-sm text-gray-500">
        Files shared with your team will appear here
      </p>
    </div>
  );
}
