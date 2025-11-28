import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  Square,
  Radio,
  CircleOff,
  RotateCcw,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { ExecutionState } from "./store/execution-store";
import { cn } from "@/lib/utils";

interface WorkflowToolbarProps {
  executionState: ExecutionState;
  triggersArmed: boolean;
  hasNodes: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onArm: () => void;
  onDisarm: () => void;
  onReset: () => void;
}

const WorkflowToolbar = ({
  executionState,
  triggersArmed,
  hasNodes,
  onStart,
  onPause,
  onResume,
  onStop,
  onArm,
  onDisarm,
  onReset,
}: WorkflowToolbarProps) => {
  const isRunning = executionState === "running";
  const isPaused = executionState === "paused";
  const isIdle = executionState === "idle" || executionState === "stopped";

  const getStatusColor = () => {
    switch (executionState) {
      case "running":
        return "bg-yellow-500";
      case "paused":
        return "bg-orange-500";
      case "stopped":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (executionState) {
      case "running":
        return "Running";
      case "paused":
        return "Paused";
      case "stopped":
        return "Stopped";
      default:
        return "Ready";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm border rounded-lg shadow-sm">
        {/* Execution Controls */}
        <div className="flex items-center gap-1">
          {/* Play/Resume Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isIdle ? "default" : "outline"}
                size="sm"
                onClick={isPaused ? onResume : onStart}
                disabled={isRunning || !hasNodes}
                className={cn(
                  "gap-1.5",
                  isIdle && hasNodes && "bg-green-600 hover:bg-green-700"
                )}
              >
                <Play className="w-4 h-4" />
                {isPaused ? "Resume" : "Run"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isPaused ? "Resume execution" : "Start workflow execution"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Pause Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onPause}
                disabled={!isRunning}
                className="h-8 w-8"
              >
                <Pause className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pause execution</p>
            </TooltipContent>
          </Tooltip>

          {/* Stop Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onStop}
                disabled={isIdle}
                className={cn(
                  "h-8 w-8",
                  (isRunning || isPaused) &&
                    "text-red-600 hover:text-red-700 hover:bg-red-50"
                )}
              >
                <Square className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop execution</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Trigger Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={triggersArmed ? "default" : "outline"}
                size="sm"
                onClick={triggersArmed ? onDisarm : onArm}
                disabled={isRunning || !hasNodes}
                className={cn(
                  "gap-1.5",
                  triggersArmed && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {triggersArmed ? (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    Armed
                  </>
                ) : (
                  <>
                    <CircleOff className="w-4 h-4" />
                    Arm Triggers
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {triggersArmed
                  ? "Triggers are active - workflow will run when conditions are met"
                  : "Arm triggers to enable automatic workflow execution"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Reset Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              disabled={isRunning}
              className="h-8 w-8"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset workflow state</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-2">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              getStatusColor(),
              isRunning && "animate-pulse"
            )}
          />
          <span className="text-sm font-medium text-gray-600">
            {getStatusText()}
          </span>

          {triggersArmed && isIdle && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700"
            >
              <Zap className="w-3 h-3 mr-0.5" />
              Listening
            </Badge>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

// Mini version for Panel positioning
export const WorkflowToolbarMini = ({
  executionState,
  triggersArmed,
  hasNodes,
  onStart,
  onPause,
  onResume,
  onStop,
  onArm,
  onDisarm,
  onReset,
}: WorkflowToolbarProps) => {
  const isRunning = executionState === "running";
  const isPaused = executionState === "paused";
  const isIdle = executionState === "idle" || executionState === "stopped";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1.5 bg-white/95 backdrop-blur-sm border rounded-lg shadow-md">
        {/* Play/Pause/Stop */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isIdle ? "default" : "ghost"}
              size="icon"
              onClick={isRunning ? onPause : isPaused ? onResume : onStart}
              disabled={!hasNodes}
              className={cn(
                "h-7 w-7",
                isIdle &&
                  hasNodes &&
                  "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isRunning ? "Pause" : isPaused ? "Resume" : "Run"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onStop}
              disabled={isIdle}
              className="h-7 w-7"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Stop</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-gray-200" />

        {/* Arm Triggers */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={triggersArmed ? "default" : "ghost"}
              size="icon"
              onClick={triggersArmed ? onDisarm : onArm}
              disabled={isRunning || !hasNodes}
              className={cn(
                "h-7 w-7",
                triggersArmed && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {triggersArmed ? (
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <CircleOff className="w-3.5 h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{triggersArmed ? "Disarm Triggers" : "Arm Triggers"}</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-gray-200" />

        {/* Reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              disabled={isRunning}
              className="h-7 w-7"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Reset</p>
          </TooltipContent>
        </Tooltip>

        {/* Status LED */}
        <div
          className={cn(
            "w-2 h-2 rounded-full ml-1",
            executionState === "running" && "bg-yellow-500 animate-pulse",
            executionState === "paused" && "bg-orange-500",
            executionState === "stopped" && "bg-red-500",
            isIdle && triggersArmed && "bg-blue-500 animate-pulse",
            isIdle && !triggersArmed && "bg-gray-400"
          )}
        />
      </div>
    </TooltipProvider>
  );
};

export default WorkflowToolbar;
