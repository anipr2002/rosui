"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateProfileImage } from "@/app/actions/update-user";

interface ProfileImageUploadProps {
  currentImageUrl: string;
  userName: string;
  onImageUpdate?: () => void;
}

export function ProfileImageUpload({
  currentImageUrl,
  userName,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are supported");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await updateProfileImage(selectedFile);

      if (result.success) {
        toast.success("Profile image updated successfully");
        setPreviewUrl(null);
        setSelectedFile(null);
        onImageUpdate?.();
      } else {
        toast.error(result.error || "Failed to update profile image");
      }
    } catch (error) {
      toast.error("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentImageUrl;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <Avatar className="h-24 w-24 rounded-lg">
          <AvatarImage src={displayUrl} alt={userName} />
          <AvatarFallback className="rounded-lg text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center shadow-lg transition-colors"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Profile Photo
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          JPG, PNG or WebP. Max size 5MB.
        </p>

        {selectedFile && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isUploading}
              size="sm"
              variant="outline"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
