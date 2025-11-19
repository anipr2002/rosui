"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTier: "free" | "pro" | "team";
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  userTier,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [creating, setCreating] = useState(false);

  const createProject = useMutation(api.projects.create);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setCreating(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        isShared: userTier === "team" ? isShared : false,
      });

      toast.success("Project created successfully!");
      handleClose();
    } catch (error) {
      console.error("Create project error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setIsShared(false);
    setCreating(false);
    onOpenChange(false);
  };

  const isTeamUser = userTier === "team";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Organize your rosbag files into projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Project Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Autonomous Navigation Tests"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              className="bg-white"
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description for this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              className="bg-white resize-none"
              rows={3}
            />
          </div>

          {/* Team Sharing Toggle (Team users only) */}
          {isTeamUser && (
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="shared" className="text-sm font-medium">
                  Share with team
                </Label>
                <p className="text-xs text-gray-500">
                  Make this project accessible to all team members
                </p>
              </div>
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
                disabled={creating}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          )}

          {/* Info for Pro users */}
          {!isTeamUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                This will be a personal project. Upgrade to Team to create shared projects.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
