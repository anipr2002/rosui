"use client";

import React, { useEffect, useState } from "react";
import { useActionsStore } from "@/store/action-store";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Send,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ActionGoalTabProps {
  actionName: string;
  actionType: string;
}

const STATUS_NAMES: Record<number, string> = {
  0: "PENDING",
  1: "ACTIVE",
  2: "PREEMPTED",
  3: "SUCCEEDED",
  4: "ABORTED",
  5: "REJECTED",
  6: "PREEMPTING",
  7: "RECALLING",
  8: "RECALLED",
  9: "LOST",
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 3: // SUCCEEDED
      return "bg-green-100 text-green-800 border-green-200";
    case 1: // ACTIVE
    case 6: // PREEMPTING
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 4: // ABORTED
    case 5: // REJECTED
    case 9: // LOST
      return "bg-red-100 text-red-800 border-red-200";
    case 2: // PREEMPTED
    case 8: // RECALLED
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function ActionGoalTab({ actionName, actionType }: ActionGoalTabProps) {
  const {
    getActionDefinition,
    actionDefinitions,
    isLoadingDefinitions,
    sendGoal,
    cancelAllGoals,
    activeGoals,
  } = useActionsStore();

  const [goalMessage, setGoalMessage] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const definition = actionDefinitions.get(actionType);
  const isLoading = isLoadingDefinitions.get(actionType) || false;

  // Get active goals for this action
  const actionGoalsList = Array.from(activeGoals.values()).filter(
    (goal) => goal.actionName === actionName
  );

  useEffect(() => {
    if (!hasAttemptedLoad && actionType !== "unknown") {
      setHasAttemptedLoad(true);
      getActionDefinition(actionType)
        .then((def) => {
          if (def && def.goal.defaultMessage) {
            setGoalMessage(JSON.stringify(def.goal.defaultMessage, null, 2));
          }
        })
        .catch((error) => {
          console.error(
            `Failed to load action definition for ${actionType}:`,
            error
          );
          toast.error(`Failed to load action definition for ${actionType}`);
        });
    }
  }, [actionType, getActionDefinition, hasAttemptedLoad]);

  const handleSendGoal = async () => {
    try {
      setIsSending(true);
      const parsedGoal = JSON.parse(goalMessage);

      const goalId = await sendGoal(actionName, actionType, parsedGoal);
      toast.success("Goal sent successfully", {
        description: `Goal ID: ${goalId}`,
      });
    } catch (error) {
      console.error("Failed to send goal:", error);
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format", {
          description: "Please check your goal message syntax",
        });
      } else {
        toast.error("Failed to send goal", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelAll = () => {
    try {
      cancelAllGoals(actionName);
      toast.success("Cancelled all goals", {
        description: `All active goals for ${actionName} have been cancelled`,
      });
    } catch (error) {
      console.error("Failed to cancel goals:", error);
      toast.error("Failed to cancel goals", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleResetToDefault = () => {
    if (definition && definition.goal.defaultMessage) {
      setGoalMessage(JSON.stringify(definition.goal.defaultMessage, null, 2));
      toast.success("Reset to default goal message");
    }
  };

  if (actionType === "unknown") {
    return (
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-700">
          <p className="font-medium">Unknown Action Type</p>
          <p className="mt-1">Cannot send goals without a valid action type.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
        <p className="text-xs text-gray-500">Loading action definition...</p>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-red-700">
          <p className="font-medium">Failed to Load Definition</p>
          <p className="mt-1">Cannot send goals without action definition.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold">Goal Message</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="h-6 text-xs"
          >
            Reset to Default
          </Button>
        </div>
        <textarea
          value={goalMessage}
          onChange={(e) => setGoalMessage(e.target.value)}
          className="w-full min-h-[150px] p-2 text-xs font-mono border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter goal message as JSON..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSendGoal}
          disabled={isSending || !goalMessage.trim()}
          className="flex-1"
          size="sm"
        >
          {isSending ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-3 w-3 mr-2" />
              Send Goal
            </>
          )}
        </Button>
        <Button
          onClick={handleCancelAll}
          variant="destructive"
          size="sm"
          disabled={actionGoalsList.filter((g) => g.isActive).length === 0}
        >
          <XCircle className="h-3 w-3 mr-2" />
          Cancel All
        </Button>
      </div>

      {/* Active Goals List */}
      {actionGoalsList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold">
            Goals History ({actionGoalsList.length})
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {actionGoalsList.map((goal) => (
              <div
                key={goal.goalId}
                className="p-3 border rounded-md space-y-2 text-xs bg-gray-50"
              >
                {/* Goal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {goal.isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    ) : goal.result ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : goal.error ? (
                      <XCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <Clock className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {goal.goalId}
                    </span>
                  </div>
                  {goal.status && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(
                        goal.status.status
                      )}`}
                    >
                      {STATUS_NAMES[goal.status.status] || "UNKNOWN"}
                    </Badge>
                  )}
                </div>

                {/* Goal Content */}
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground">Goal:</span>
                    <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                      {JSON.stringify(goal.goal, null, 2)}
                    </pre>
                  </div>

                  {/* Feedback */}
                  {goal.feedback.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">
                        Feedback ({goal.feedback.length}):
                      </span>
                      <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto max-h-[100px] overflow-y-auto">
                        {JSON.stringify(
                          goal.feedback[goal.feedback.length - 1],
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}

                  {/* Result */}
                  {goal.result && (
                    <div>
                      <span className="text-muted-foreground">Result:</span>
                      <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                        {JSON.stringify(goal.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {goal.error && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700">{goal.error}</span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground">
                  {new Date(goal.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
