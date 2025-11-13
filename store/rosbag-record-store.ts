import { create } from "zustand";
import { McapWriter, type McapWriterOptions } from "@mcap/core";
import { useTopicsStore, type MessageRecord } from "./topic-store";
import { useRosStore } from "./ros-store";
import * as ROSLIB from "roslib";

export interface RecordingTopic {
  name: string;
  type: string;
  channelId: number;
  messageCount: number;
}

export interface RecordingMetadata {
  startTime: number;
  duration: number;
  messageCount: number;
  topics: RecordingTopic[];
}

export type RecordingStatus = "idle" | "recording" | "paused" | "stopping";

interface RosbagRecordState {
  // Recording state
  status: RecordingStatus;
  selectedTopics: Set<string>;
  recordingTopics: Map<string, RecordingTopic>;

  // Recording data
  metadata: RecordingMetadata | null;
  mcapData: Uint8Array | null;

  // Recording options
  recordAllTopics: boolean;
  maxDuration: number | null; // milliseconds, null for unlimited
  maxSize: number | null; // bytes, null for unlimited

  // Subscribers for recording
  recordingSubscribers: Map<string, ROSLIB.Topic>;

  // Actions - Topic Selection
  toggleTopicSelection: (topicName: string) => void;
  selectAllTopics: () => void;
  clearTopicSelection: () => void;
  setRecordAllTopics: (enabled: boolean) => void;

  // Actions - Recording Control
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;

  // Actions - Export
  downloadRecording: (filename?: string) => void;
  clearRecording: () => void;

  // Actions - Options
  setMaxDuration: (duration: number | null) => void;
  setMaxSize: (size: number | null) => void;
}

// MCAP writer state
let mcapWriter: McapWriter | null = null;
let mcapBuffer: Uint8Array[] = [];
let recordingStartTime: number | null = null;
let nextChannelId = 0;
let channelIdMap = new Map<string, number>();

export const useRosbagRecordStore = create<RosbagRecordState>((set, get) => ({
  status: "idle",
  selectedTopics: new Set(),
  recordingTopics: new Map(),

  metadata: null,
  mcapData: null,

  recordAllTopics: false,
  maxDuration: null,
  maxSize: null,

  recordingSubscribers: new Map(),

  toggleTopicSelection: (topicName: string) => {
    const { selectedTopics, status } = get();

    // Don't allow changing topics while recording
    if (status === "recording") {
      console.warn("Cannot change topic selection while recording");
      return;
    }

    const newSelectedTopics = new Set(selectedTopics);
    if (newSelectedTopics.has(topicName)) {
      newSelectedTopics.delete(topicName);
    } else {
      newSelectedTopics.add(topicName);
    }

    set({ selectedTopics: newSelectedTopics });
  },

  selectAllTopics: () => {
    const { status } = get();
    if (status === "recording") {
      console.warn("Cannot change topic selection while recording");
      return;
    }

    const topics = useTopicsStore.getState().topics;
    const newSelectedTopics = new Set(topics.map((t) => t.name));
    set({ selectedTopics: newSelectedTopics });
  },

  clearTopicSelection: () => {
    const { status } = get();
    if (status === "recording") {
      console.warn("Cannot change topic selection while recording");
      return;
    }

    set({ selectedTopics: new Set() });
  },

  setRecordAllTopics: (enabled: boolean) => {
    const { status } = get();
    if (status === "recording") {
      console.warn("Cannot change record all topics while recording");
      return;
    }

    set({ recordAllTopics: enabled });

    if (enabled) {
      get().selectAllTopics();
    }
  },

  startRecording: async () => {
    const ros = useRosStore.getState().ros;
    if (!ros) {
      throw new Error("ROS connection not available");
    }

    const { selectedTopics, recordAllTopics, status } = get();

    if (status === "recording") {
      console.warn("Already recording");
      return;
    }

    const topics = useTopicsStore.getState().topics;
    const topicsToRecord = recordAllTopics
      ? topics
      : topics.filter((t) => selectedTopics.has(t.name));

    if (topicsToRecord.length === 0) {
      throw new Error("No topics selected for recording");
    }

    // Get type definitions from topics store
    const typeDefinitions = useTopicsStore.getState().typeDefinitions;

    // Initialize MCAP writer
    mcapBuffer = [];
    nextChannelId = 0;
    channelIdMap.clear();

    // Create a simple writable that accumulates chunks
    const writable = {
      write: async (chunk: Uint8Array): Promise<void> => {
        mcapBuffer.push(chunk);
      },
      position: (): bigint => {
        return BigInt(mcapBuffer.reduce((sum, chunk) => sum + chunk.length, 0));
      },
    };

    mcapWriter = new McapWriter({
      writable,
      useStatistics: true,
      useChunkIndex: true,
      useSummaryOffsets: true,
    });

    recordingStartTime = Date.now();

    // Write MCAP header
    await mcapWriter.start({
      profile: "ros2",
      library: "rosui-web-dashboard",
    });

    // Map to store schema IDs for each message type
    const schemaIdMap = new Map<string, number>();

    // Initialize recording topics and subscribers
    const recordingTopics = new Map<string, RecordingTopic>();
    const recordingSubscribers = new Map<string, ROSLIB.Topic>();

    for (const topic of topicsToRecord) {
      // Get or register schema for this topic's message type
      let schemaId = schemaIdMap.get(topic.type);

      if (schemaId === undefined) {
        // For JSON encoding, we use an empty schema with the type name
        // The message structure is self-describing in JSON format
        schemaId = await mcapWriter.registerSchema({
          name: topic.type,
          encoding: "",
          data: new Uint8Array(),
        });

        schemaIdMap.set(topic.type, schemaId);
      }

      // Get the message definition for metadata
      const typeDef = typeDefinitions.get(topic.type) || "";

      // Register channel with MCAP
      const channelId = await mcapWriter.registerChannel({
        schemaId,
        topic: topic.name,
        messageEncoding: "json",
        metadata: new Map([
          ["type", topic.type],
          ["message_definition", typeDef],
        ]),
      });

      channelIdMap.set(topic.name, channelId);

      recordingTopics.set(topic.name, {
        name: topic.name,
        type: topic.type,
        channelId,
        messageCount: 0,
      });

      // Create subscriber for this topic
      const rosTopic = new ROSLIB.Topic({
        ros,
        name: topic.name,
        messageType: topic.type,
      });

      rosTopic.subscribe((message: any) => {
        const { status } = get();
        if (status !== "recording") return;

        const channelId = channelIdMap.get(topic.name);
        if (channelId === undefined) return;

        // Write message to MCAP
        const timestamp = BigInt(Date.now() * 1000000); // nanoseconds
        const messageData = new TextEncoder().encode(JSON.stringify(message));

        mcapWriter?.addMessage({
          channelId,
          sequence: 0,
          publishTime: timestamp,
          logTime: timestamp,
          data: messageData,
        });

        // Update message count
        const recordingTopics = get().recordingTopics;
        const topicInfo = recordingTopics.get(topic.name);
        if (topicInfo) {
          const updatedTopics = new Map(recordingTopics);
          updatedTopics.set(topic.name, {
            ...topicInfo,
            messageCount: topicInfo.messageCount + 1,
          });
          set({ recordingTopics: updatedTopics });
        }
      });

      recordingSubscribers.set(topic.name, rosTopic);
    }

    set({
      status: "recording",
      recordingTopics,
      recordingSubscribers,
      metadata: {
        startTime: recordingStartTime,
        duration: 0,
        messageCount: 0,
        topics: Array.from(recordingTopics.values()),
      },
    });

    console.log(`Started recording ${topicsToRecord.length} topics`);
  },

  stopRecording: async () => {
    const { status, recordingSubscribers } = get();

    if (status !== "recording") {
      console.warn("Not currently recording");
      return;
    }

    set({ status: "stopping" });

    // Unsubscribe from all topics
    recordingSubscribers.forEach((topic) => {
      topic.unsubscribe();
    });

    // Finalize MCAP file
    if (mcapWriter) {
      await mcapWriter.end();
    }

    // Combine all chunks into single Uint8Array
    const totalLength = mcapBuffer.reduce(
      (sum, chunk) => sum + chunk.length,
      0
    );
    const mcapData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mcapBuffer) {
      mcapData.set(chunk, offset);
      offset += chunk.length;
    }

    const duration = recordingStartTime ? Date.now() - recordingStartTime : 0;
    const recordingTopics = get().recordingTopics;
    const totalMessages = Array.from(recordingTopics.values()).reduce(
      (sum, topic) => sum + topic.messageCount,
      0
    );

    set({
      status: "idle",
      mcapData,
      recordingSubscribers: new Map(),
      metadata: {
        startTime: recordingStartTime || Date.now(),
        duration,
        messageCount: totalMessages,
        topics: Array.from(recordingTopics.values()),
      },
    });

    console.log(
      `Stopped recording. Total messages: ${totalMessages}, Duration: ${duration}ms`
    );
  },

  pauseRecording: () => {
    const { status } = get();
    if (status !== "recording") return;

    set({ status: "paused" });
  },

  resumeRecording: () => {
    const { status } = get();
    if (status !== "paused") return;

    set({ status: "recording" });
  },

  downloadRecording: (filename?: string) => {
    const { mcapData } = get();

    if (!mcapData) {
      throw new Error("No recording data available");
    }

    const defaultFilename = `rosbag_${new Date().toISOString().replace(/[:.]/g, "-")}.mcap`;
    // Create a new Uint8Array from the data to ensure it's a standard ArrayBuffer
    const dataArray = new Uint8Array(mcapData);
    const blob = new Blob([dataArray], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Downloaded recording as ${filename || defaultFilename}`);
  },

  clearRecording: () => {
    const { status } = get();

    if (status === "recording") {
      console.warn("Cannot clear recording while recording is in progress");
      return;
    }

    mcapWriter = null;
    mcapBuffer = [];
    recordingStartTime = null;
    nextChannelId = 0;
    channelIdMap.clear();

    set({
      mcapData: null,
      metadata: null,
      recordingTopics: new Map(),
    });
  },

  setMaxDuration: (duration: number | null) => {
    set({ maxDuration: duration });
  },

  setMaxSize: (size: number | null) => {
    set({ maxSize: size });
  },
}));
