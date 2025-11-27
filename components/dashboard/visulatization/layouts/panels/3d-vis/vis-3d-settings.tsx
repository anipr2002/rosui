"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Controls3D } from "@/components/dashboard/visulatization/3d-vis/3d-controls";

export function Vis3DSettings() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all"
          title="3D Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[450px] max-h-[600px] overflow-y-auto p-0 border-none bg-transparent shadow-none"
      >
        {/* We use p-0 and transparent bg because Controls3D is already a Card */}
        <Controls3D />
      </PopoverContent>
    </Popover>
  );
}
