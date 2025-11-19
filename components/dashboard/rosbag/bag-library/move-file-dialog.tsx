"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderInput, X } from "lucide-react";
import { toast } from "sonner";

const NO_PROJECT_VALUE = "__NO_PROJECT__";

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    _id: Id<"rosbagFiles">;
    fileName: string;
    projectId?: Id<"projects">;
  } | null;
  projects: Array<{
    _id: Id<"projects">;
    name: string;
    isShared?: boolean;
  }>;
}

export function MoveFileDialog({
  open,
  onOpenChange,
  file,
  projects,
}: MoveFileDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(NO_PROJECT_VALUE);
  const [moving, setMoving] = useState(false);

  const moveToProject = useMutation(api.rosbagFiles.moveToProject);

  const handleMove = async () => {
    if (!file) return;

    setMoving(true);
    try {
      await moveToProject({
        fileId: file._id,
        projectId: selectedProjectId === NO_PROJECT_VALUE ? undefined : (selectedProjectId as Id<"projects">),
      });

      const action = selectedProjectId === NO_PROJECT_VALUE ? "removed from project" : "moved to project";
      toast.success(`File ${action} successfully!`);
      handleClose();
    } catch (error) {
      console.error("Move file error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to move file");
    } finally {
      setMoving(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId(NO_PROJECT_VALUE);
    setMoving(false);
    onOpenChange(false);
  };

  // Set initial value when dialog opens
  React.useEffect(() => {
    if (open && file) {
      setSelectedProjectId(file.projectId || NO_PROJECT_VALUE);
    }
  }, [open, file]);

  if (!file) return null;

  const currentProject = projects.find((p) => p._id === file.projectId);
  const hasChanged = selectedProjectId !== (file.projectId || NO_PROJECT_VALUE);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move File to Project</DialogTitle>
          <DialogDescription>
            Assign this file to a project or remove it from its current project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="font-mono text-xs text-gray-900 truncate">
              {file.fileName}
            </p>
            {currentProject && (
              <p className="text-xs text-gray-600 mt-1">
                Currently in: {currentProject.name}
              </p>
            )}
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">
              Target Project
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={moving}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT_VALUE}>
                  <div className="flex items-center gap-2">
                    <X className="h-3 w-3" />
                    <span>No Project (Individual File)</span>
                  </div>
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    <div className="flex items-center gap-2">
                      <span>{project.name}</span>
                      {project.isShared && (
                        <span className="text-xs text-purple-600">(Shared)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving || !hasChanged}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <FolderInput className="h-4 w-4 mr-2" />
            {moving ? "Moving..." : "Move File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
