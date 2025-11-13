import { create } from "zustand";
import {
  convertRosbagToMcap,
  type ConversionMetadata,
  type ConversionProgress,
} from "@/lib/rosbag/converter";

export type ConversionStatus = "idle" | "converting" | "completed" | "error";

interface RosbagConvertState {
  // State
  status: ConversionStatus;
  inputFile: File | null;
  outputData: Uint8Array | null;
  metadata: ConversionMetadata | null;
  error: string | null;
  progress: ConversionProgress | null;

  // Actions
  setInputFile: (file: File | null) => void;
  convertFile: () => Promise<void>;
  downloadMcap: (filename?: string) => void;
  reset: () => void;
}

export const useRosbagConvertStore = create<RosbagConvertState>((set, get) => ({
  status: "idle",
  inputFile: null,
  outputData: null,
  metadata: null,
  error: null,
  progress: null,

  setInputFile: (file: File | null) => {
    set({
      inputFile: file,
      status: "idle",
      outputData: null,
      metadata: null,
      error: null,
      progress: null,
    });
  },

  convertFile: async () => {
    const { inputFile } = get();

    if (!inputFile) {
      set({ error: "No input file selected", status: "error" });
      return;
    }

    set({
      status: "converting",
      error: null,
      progress: { status: "Starting conversion..." },
    });

    try {
      const result = await convertRosbagToMcap(inputFile, (progress) => {
        set({ progress });
      });

      set({
        status: "completed",
        outputData: result.data,
        metadata: result.metadata,
        progress: { status: "Conversion complete!" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown conversion error";
      set({
        status: "error",
        error: errorMessage,
        progress: null,
      });
      console.error("Conversion failed:", error);
    }
  },

  downloadMcap: (filename?: string) => {
    const { outputData, inputFile } = get();

    if (!outputData) {
      throw new Error("No output data available for download");
    }

    // Generate filename based on input file or use provided name
    let finalFilename = filename;
    if (!finalFilename && inputFile) {
      // Remove .bag or .db3 extension and add .mcap
      const baseName = inputFile.name.replace(/\.(bag|db3)$/i, "");
      finalFilename = `${baseName}.mcap`;
    }
    if (!finalFilename) {
      finalFilename = `rosbag_converted_${new Date().toISOString().replace(/[:.]/g, "-")}.mcap`;
    }

    // Ensure .mcap extension
    if (!finalFilename.toLowerCase().endsWith(".mcap")) {
      finalFilename = `${finalFilename}.mcap`;
    }

    // Create blob and trigger download
    const blob = new Blob([outputData as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Downloaded MCAP file as ${finalFilename}`);
  },

  reset: () => {
    set({
      status: "idle",
      inputFile: null,
      outputData: null,
      metadata: null,
      error: null,
      progress: null,
    });
  },
}));
