"use client";

import React, { useState } from "react";
import WorkflowEditor from "@/components/dashboard/workflows/workflow-editor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function DataProcessingPage() {
  const [workflowCount, setWorkflowCount] = useState(0);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  const handleCreateWorkflow = () => {
    setWorkflowCount((prev) => prev + 1);
    setIsEditorVisible(true);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ROS Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Compose data-processing graphs with live ROS topics, processors, and
            outputs.
          </p>
        </div>
        {!isEditorVisible && (
          <Button onClick={handleCreateWorkflow} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow ({workflowCount})
          </Button>
        )}
      </div>

      {isEditorVisible ? (
        <WorkflowEditor />
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed rounded-xl bg-gray-50">
          <div className="text-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm inline-block">
               <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Workflow Selected</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Create a new workflow to start designing your automation logic.
            </p>
            <Button onClick={handleCreateWorkflow}>Create New Workflow</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataProcessingPage;
