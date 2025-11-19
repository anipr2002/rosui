"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useStorageQuota } from "@/hooks/use-storage-quota";
import { StorageQuotaDisplay } from "@/components/dashboard/rosbag/bag-library/storage-quota-display";
import { UploadDialog } from "@/components/dashboard/rosbag/bag-library/upload-dialog";
import { CreateProjectDialog } from "@/components/dashboard/rosbag/bag-library/create-project-dialog";
import { MoveFileDialog } from "@/components/dashboard/rosbag/bag-library/move-file-dialog";
import { FileCard } from "@/components/dashboard/rosbag/bag-library/file-card";
import { ProjectCard } from "@/components/dashboard/rosbag/bag-library/project-card";
import { ActionBar } from "@/components/dashboard/rosbag/bag-library/action-bar";
import {
  FreeUserEmptyState,
  PaidUserEmptyState,
  NoProjectsEmptyState,
  NoSharedFilesEmptyState,
} from "@/components/dashboard/rosbag/bag-library/empty-states";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, FileArchive, Folder, Users } from "lucide-react";
import { getTierBadgeColor, getTierDisplayName } from "@/lib/subscription-utils";

export default function BagLibraryPage() {
  const { storageInfo, isLoading: storageLoading } = useStorageQuota();
  const files = useQuery(api.rosbagFiles.list, {});
  const sharedFiles = useQuery(api.rosbagFiles.listShared, {});
  const projects = useQuery(api.projects.list, { includeShared: true });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [moveFileDialogOpen, setMoveFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    _id: Id<"rosbagFiles">;
    fileName: string;
    projectId?: Id<"projects">;
  } | null>(null);

  const isLoading = storageLoading || files === undefined;
  const isFreeUser = storageInfo?.tier === "free";

  const handleMoveFile = (file: any) => {
    setSelectedFile(file);
    setMoveFileDialogOpen(true);
  };

  // Get project lookup map
  const projectMap = new Map(
    projects?.map((p) => [p._id, p]) || []
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bag Library</h1>
        <p className="text-muted-foreground mt-2">
          Manage your rosbag files and projects in the cloud
        </p>
      </div>

      {/* Storage Quota Card */}
      <Card className="shadow-none pt-0 rounded-xl border border-indigo-300 mb-6">
        <CardHeader className="bg-indigo-50 border-indigo-300 border-b rounded-t-xl pt-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start">
            <Database className="h-5 w-5 mt-0.5 text-indigo-600" />

            <div className="min-w-0">
              <h3 className="text-base text-indigo-900 font-semibold">
                Storage Usage
              </h3>
              <p className="text-xs text-indigo-800 mt-1">
                Track your cloud storage usage and quota
              </p>
            </div>

            {storageInfo && (
              <Badge
                className={`${getTierBadgeColor(storageInfo.tier).bg} ${getTierBadgeColor(storageInfo.tier).text} ${getTierBadgeColor(storageInfo.tier).border} border text-xs`}
              >
                {getTierDisplayName(storageInfo.tier)}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <StorageQuotaDisplay />
        </CardContent>
      </Card>

      {/* Action Bar */}
      {!isFreeUser && (
        <ActionBar
          onUploadClick={() => setUploadDialogOpen(true)}
          onCreateProjectClick={() => setCreateProjectDialogOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Main Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            <FileArchive className="h-3 w-3 mr-1" />
            All Files
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs">
            <Folder className="h-3 w-3 mr-1" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Shared
          </TabsTrigger>
        </TabsList>

        {/* All Files Tab */}
        <TabsContent value="all" className="mt-4">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : files && files.length === 0 ? (
            <PaidUserEmptyState onUploadClick={() => setUploadDialogOpen(true)} />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {files?.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  project={file.projectId ? projectMap.get(file.projectId) : undefined}
                  viewMode={viewMode}
                  onMoveClick={() => handleMoveFile(file)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-4">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : projects && projects.length === 0 ? (
            <NoProjectsEmptyState onCreateClick={() => setCreateProjectDialogOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  fileCount={files?.filter((f) => f.projectId === project._id).length || 0}
                  onClick={() => {
                    // TODO: Navigate to project detail view
                    console.log("Navigate to project:", project._id);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shared Tab */}
        <TabsContent value="shared" className="mt-4">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : sharedFiles && sharedFiles.length === 0 ? (
            <NoSharedFilesEmptyState />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {sharedFiles?.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  project={file.projectId ? projectMap.get(file.projectId) : undefined}
                  viewMode={viewMode}
                  onMoveClick={() => handleMoveFile(file)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projects={projects}
      />

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        userTier={storageInfo?.tier || "free"}
      />

      <MoveFileDialog
        open={moveFileDialogOpen}
        onOpenChange={setMoveFileDialogOpen}
        file={selectedFile}
        projects={projects || []}
      />
    </div>
  );
}