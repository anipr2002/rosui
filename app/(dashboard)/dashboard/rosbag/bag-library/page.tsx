"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useStorageQuota } from "@/hooks/use-storage-quota";
import { UploadDialog } from "@/components/dashboard/rosbag/bag-library/upload-dialog";
import { CreateProjectDialog } from "@/components/dashboard/rosbag/bag-library/create-project-dialog";
import { MoveFileDialog } from "@/components/dashboard/rosbag/bag-library/move-file-dialog";
import { FileCard } from "@/components/dashboard/rosbag/bag-library/file-card";
import { ProjectCard } from "@/components/dashboard/rosbag/bag-library/project-card";
import { LibraryHeader } from "@/components/dashboard/rosbag/bag-library/library-header";
import {
  FreeUserEmptyState,
} from "@/components/dashboard/rosbag/bag-library/empty-states";
import {
  LibraryEmptyState,
  FolderEmptyState,
  SharedEmptyState,
} from "@/components/dashboard/rosbag/bag-library/empty-states-library";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BagLibraryPage() {
  const { storageInfo, isLoading: storageLoading } = useStorageQuota();
  const files = useQuery(api.rosbagFiles.list, {});
  const sharedFiles = useQuery(api.rosbagFiles.listShared, {});
  const projects = useQuery(api.projects.list, { includeShared: true });

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter logic
  const filteredFiles = files?.filter((f) =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedFiles = sharedFiles?.filter((f) =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-4 mx-auto py-8 max-w-7xl">
      <LibraryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setUploadDialogOpen(true)}
        onCreateProjectClick={() => setCreateProjectDialogOpen(true)}
        isFreeUser={isFreeUser}
      />

      {/* Main Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-transparent p-0 h-auto border-b w-full justify-start rounded-none space-x-6">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-sm text-muted-foreground data-[state=active]:text-indigo-900"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-sm text-muted-foreground data-[state=active]:text-indigo-900"
            >
              Folders
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-2 text-sm text-muted-foreground data-[state=active]:text-indigo-900"
            >
              Shared
            </TabsTrigger>
          </TabsList>

          {!isFreeUser && (
            <div className="flex items-center gap-1 border rounded-lg p-1 ml-4 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-7 w-7 p-0 ${viewMode === "grid" ? "bg-gray-100" : ""}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-gray-100" : ""}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* All Files Tab */}
        <TabsContent value="all" className="mt-0">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : filteredFiles && filteredFiles.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                No files found matching "{searchQuery}"
              </div>
            ) : (
              <LibraryEmptyState 
                onUpload={() => setUploadDialogOpen(true)}
                onRecord={() => {
                  // Navigate to record page
                  window.location.href = '/dashboard/rosbag/record';
                }}
              />
            )
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-2"
              }
            >
              {filteredFiles?.map((file) => (
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
        <TabsContent value="projects" className="mt-0">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : filteredProjects && filteredProjects.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                No projects found matching "{searchQuery}"
              </div>
            ) : (
              <FolderEmptyState onCreateClick={() => setCreateProjectDialogOpen(true)} />
            )
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-2"
              }
            >
              {filteredProjects?.map((project) => {
                const projectFiles = files?.filter((f) => f.projectId === project._id) || [];
                return (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    fileCount={projectFiles.length}
                    files={projectFiles}
                    viewMode={viewMode}
                    onClick={() => {
                      // TODO: Navigate to project detail view
                      console.log("Navigate to project:", project._id);
                    }}
                    onMoveFile={handleMoveFile}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shared Tab */}
        <TabsContent value="shared" className="mt-0">
          {isFreeUser ? (
            <FreeUserEmptyState />
          ) : filteredSharedFiles && filteredSharedFiles.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                No shared files found matching "{searchQuery}"
              </div>
            ) : (
              <SharedEmptyState />
            )
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-2"
              }
            >
              {filteredSharedFiles?.map((file) => (
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