"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  FileArchive,
  Users,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectCardProps {
  project: {
    _id: Id<"projects">;
    name: string;
    description?: string;
    isShared: boolean;
    organizationId?: Id<"organizations">;
    createdAt: number;
  };
  fileCount?: number;
  onClick?: () => void;
}

export function ProjectCard({ project, fileCount = 0, onClick }: ProjectCardProps) {
  const [deleting, setDeleting] = useState(false);
  const deleteProject = useMutation(api.projects.deleteProject);

  const handleDelete = async () => {
    const message = fileCount > 0
      ? `This project contains ${fileCount} file(s). Files will be unassigned but not deleted. Continue?`
      : `Are you sure you want to delete "${project.name}"?`;

    if (!confirm(message)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteProject({ 
        projectId: project._id,
        deleteFiles: false, // Don't delete files, just unassign them
      });
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
      setDeleting(false);
    }
  };

  const createdDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card 
      className="shadow-none pt-0 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start">
          <Folder className="h-5 w-5 mt-0.5 text-purple-600" />
          <div className="min-w-0">
            <h4 className="text-sm text-purple-900 truncate font-semibold">
              {project.name}
            </h4>
            {project.description && (
              <p className="text-xs text-purple-700 mt-1 line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" disabled={deleting}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toast.info("Edit functionality coming soon!");
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <FileArchive className="h-3 w-3" />
          <span>{fileCount} {fileCount === 1 ? "file" : "files"}</span>
        </div>

        <div className="flex items-center gap-2">
          {project.isShared ? (
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
              <Users className="h-3 w-3 mr-1" />
              Team Shared
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50">
              <Lock className="h-3 w-3 mr-1" />
              Personal
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Created {createdDate}
        </p>
      </CardContent>
    </Card>
  );
}
