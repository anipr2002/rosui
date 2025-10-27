"use client";

import React, { useState, useEffect } from "react";
import { useParamsStore } from "@/store/param-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Trash2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ParamEditTabProps {
  paramName: string;
}

export function ParamEditTab({ paramName }: ParamEditTabProps) {
  const { params, getParamValue, setParamValue, deleteParam } =
    useParamsStore();
  const [valueJson, setValueJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const param = params.find((p) => p.name === paramName);

  useEffect(() => {
    // Initialize with current value if available
    if (param?.value !== undefined) {
      try {
        setValueJson(JSON.stringify(param.value, null, 2));
      } catch (error) {
        console.error("Failed to stringify parameter value:", error);
        setValueJson("null");
      }
    } else if (valueJson === "") {
      // Fetch value if not available
      handleGetLatest();
    }
  }, [param?.value]);

  const validateJson = (jsonStr: string): any | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      setJsonError(null);
      return parsed;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      return null;
    }
  };

  const handleGetLatest = async () => {
    setIsLoading(true);
    try {
      const value = await getParamValue(paramName);
      setValueJson(JSON.stringify(value, null, 2));
      toast.success("Fetched latest parameter value");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch parameter";
      toast.error(errorMessage);
      console.error("Failed to get parameter:", error);
      // Set default if fetch fails
      if (valueJson === "") {
        setValueJson("null");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const value = validateJson(valueJson);
    if (value === null && valueJson !== "null") {
      toast.error("Invalid JSON format");
      return;
    }

    setIsSaving(true);
    try {
      await setParamValue(paramName, value);
      toast.success("Parameter updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update parameter";
      toast.error(errorMessage);
      console.error("Failed to set parameter:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    // Confirm deletion
    if (
      !window.confirm(
        `Are you sure you want to delete parameter "${paramName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteParam(paramName);
      toast.success("Parameter deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete parameter";
      toast.error(errorMessage);
      console.error("Failed to delete parameter:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleValueChange = (value: string) => {
    setValueJson(value);
    // Clear error when user starts typing
    if (jsonError) {
      setJsonError(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Get Latest Button */}
      <Button
        onClick={handleGetLatest}
        disabled={isLoading || isSaving}
        variant="outline"
        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Get Latest Value
          </>
        )}
      </Button>

      {/* JSON Editor */}
      <div className="space-y-2">
        <Label htmlFor="value-json" className="text-sm font-medium">
          Value (JSON)
        </Label>
        <textarea
          id="value-json"
          value={valueJson}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-full min-h-[200px] p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Enter parameter value as JSON..."
          disabled={isSaving || isDeleting}
        />
        {jsonError && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}
        <p className="text-xs text-gray-500">
          Enter the parameter value in JSON format. All types must be valid JSON
          (strings, numbers, booleans, arrays, objects, or null).
        </p>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || isDeleting || !!jsonError || isLoading}
        className="w-full bg-blue-200 border-1 border-blue-500 hover:bg-blue-500 hover:text-white text-blue-500"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Parameter
          </>
        )}
      </Button>

      {/* Delete Section */}
      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-semibold text-gray-700">
          Danger Zone
        </Label>

        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 mb-3">
            Deleting a parameter will remove it from the ROS parameter server.
            This action cannot be undone.
          </p>
          <Button
            onClick={handleDelete}
            disabled={isDeleting || isSaving || isLoading}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Parameter
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          Changes are applied immediately to the ROS parameter server when you
          click Save.
        </p>
      </div>
    </div>
  );
}
