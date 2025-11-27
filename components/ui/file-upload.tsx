"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  selectedFiles: File[];
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  multiple?: boolean;
}

export function FileUpload({
  onFilesSelect,
  selectedFiles,
  accept = ".mcap",
  maxSize,
  disabled = false,
  className,
  helpText = "Drag and drop or choose file to upload",
  multiple = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: File[]) => {
    const validFiles: File[] = [];

    for (const file of files) {
      // Validate file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        
        if (!acceptedTypes.includes(fileExtension)) {
          continue;
        }
      }

      // Validate file size
      if (maxSize && file.size > maxSize) {
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        // Add to existing files
        const newFiles = [...selectedFiles, ...validFiles];
        onFilesSelect(newFiles);
      } else {
        // Replace with first valid file
        onFilesSelect([validFiles[0]]);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelect(newFiles);
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "flex justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors cursor-pointer",
          isDragging && !disabled
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          hasFiles && "border-green-300 bg-green-50"
        )}
      >
        <div className="text-center">
          <Upload
            className={cn(
              "mx-auto h-8 w-8 transition-colors",
              isDragging && !disabled
                ? "text-green-600"
                : "text-gray-400",
              hasFiles && "text-green-600"
            )}
            aria-hidden={true}
          />
          <div className="mt-4 flex text-sm leading-6">
            <Label
              htmlFor="file-upload"
              className={cn(
                "relative cursor-pointer rounded-sm font-medium text-green-600 hover:text-green-500",
                disabled && "cursor-not-allowed"
              )}
            >
              <span>{helpText}</span>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileInputChange}
                disabled={disabled}
                multiple={multiple}
              />
            </Label>
          </div>
          {multiple && hasFiles && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </p>
          )}
          {maxSize && (
            <p className="text-xs text-gray-500 mt-2">
              Max file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </div>

      {hasFiles && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="absolute right-1 top-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  disabled={disabled}
                  className="rounded-sm p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" aria-hidden={true} />
                </Button>
              </div>
              <div className="flex items-center space-x-2.5 pr-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm ring-1 ring-inset ring-gray-200">
                  <FileIcon
                    className="h-5 w-5 text-gray-600"
                    aria-hidden={true}
                  />
                </span>
                <div className="w-full min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
