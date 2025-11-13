import { SqliteSqljs } from "@foxglove/rosbag2-web";
import { Rosbag2, ROS2_TO_DEFINITIONS } from "@foxglove/rosbag2";
import { McapWriter } from "@mcap/core";
import { Time } from "@foxglove/rostime";
import { stringify as stringifyMessageDefinition } from "@foxglove/rosmsg";

export interface ConversionMetadata {
  topicCount: number;
  messageCount: number;
  duration: number;
  startTime: number;
  endTime: number;
  inputSize: number;
  outputSize: number;
  topics: {
    name: string;
    type: string;
    messageCount: number;
  }[];
}

export interface ConversionProgress {
  status: string;
  messagesProcessed?: number;
  totalMessages?: number;
}

/**
 * Normalize ROS2 type names to include /msg/ if missing
 * e.g., "rcl_interfaces/Parameter" -> "rcl_interfaces/msg/Parameter"
 */
function normalizeRos2TypeName(typeName: string): string {
  // If it's a primitive or already has /msg/, /srv/, or /action/, return as-is
  if (
    !typeName.includes("/") ||
    typeName.includes("/msg/") ||
    typeName.includes("/srv/") ||
    typeName.includes("/action/")
  ) {
    return typeName;
  }

  // Split into package and type name, insert /msg/
  const parts = typeName.split("/");
  if (parts.length === 2) {
    return `${parts[0]}/msg/${parts[1]}`;
  }

  return typeName;
}

/**
 * Recursively collect all message definitions needed for a type, including dependencies
 */
function collectMessageDefinitions(
  typeName: string,
  collected = new Map<string, any>()
): Map<string, any> {
  // Normalize the type name
  const normalizedType = normalizeRos2TypeName(typeName);

  // Skip if already collected or if it's a primitive type
  if (collected.has(normalizedType) || !normalizedType.includes("/")) {
    return collected;
  }

  const msgDef = ROS2_TO_DEFINITIONS.get(normalizedType);
  if (!msgDef) {
    return collected;
  }

  collected.set(normalizedType, msgDef);

  // Recursively collect dependencies
  for (const field of msgDef.definitions) {
    if (field.isComplex) {
      collectMessageDefinitions(field.type, collected);
    }
  }

  return collected;
}

/**
 * Convert a ROS2 bag file (.bag or .db3) to MCAP format
 * @param file - The input bag file
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to the MCAP file data and metadata
 */
export async function convertRosbagToMcap(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<{ data: Uint8Array; metadata: ConversionMetadata }> {
  try {
    onProgress?.({ status: "Reading bag file..." });

    const inputSize = file.size;

    onProgress?.({ status: "Initializing SQL.js..." });

    // Initialize SqliteSqljs with custom WASM path
    // (only needs to be done once, but safe to call multiple times)
    await SqliteSqljs.Initialize({
      locateFile: (file: string) => {
        // Serve WASM file from public directory
        if (file.endsWith(".wasm")) {
          return "/wasm/sql-wasm.wasm";
        }
        return file;
      },
    });

    onProgress?.({ status: "Reading file data..." });

    // Read the file as ArrayBuffer first (FileReaderSync is not available in browser)
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    onProgress?.({ status: "Parsing bag structure..." });

    // Initialize SqliteSqljs with Uint8Array data
    const sqliteDb = new SqliteSqljs(fileData);
    await sqliteDb.open();

    // Wrap with Rosbag2 for easier API access
    const bag = new Rosbag2([sqliteDb]);
    await bag.open();

    onProgress?.({ status: "Initializing MCAP writer..." });

    // Initialize MCAP writer
    const mcapBuffer: Uint8Array[] = [];
    const writable = {
      write: async (chunk: Uint8Array): Promise<void> => {
        mcapBuffer.push(chunk);
      },
      position: (): bigint => {
        return BigInt(mcapBuffer.reduce((sum, chunk) => sum + chunk.length, 0));
      },
    };

    const mcapWriter = new McapWriter({
      writable,
      useStatistics: true,
      useChunkIndex: true,
      useSummaryOffsets: true,
    });

    // Start MCAP file
    await mcapWriter.start({
      profile: "ros2",
      library: "rosui-web-dashboard-converter",
    });

    onProgress?.({ status: "Processing topics and schemas..." });

    // Get topics from bag
    const topics = await bag.readTopics();

    // Track metadata
    const topicMessageCounts = new Map<string, number>();
    let totalMessages = 0;
    const [minTimeObj, maxTimeObj] = await bag.timeRange();

    // Convert Time objects to milliseconds
    let minTime = minTimeObj.sec * 1000 + minTimeObj.nsec / 1e6;
    let maxTime = maxTimeObj.sec * 1000 + maxTimeObj.nsec / 1e6;

    // Register schemas and channels
    const schemaIdMap = new Map<string, number>();
    const channelIdMap = new Map<string, number>(); // topic name -> channel id

    for (const topic of topics) {
      // Register schema for this message type
      let schemaId = schemaIdMap.get(topic.type);

      if (schemaId === undefined) {
        let schemaData = "";

        // Collect all message definitions including dependencies
        const allDefinitions = collectMessageDefinitions(topic.type);

        if (allDefinitions.size > 0) {
          // Convert all definitions to an array and stringify
          const definitionsArray = Array.from(allDefinitions.values());
          try {
            schemaData = stringifyMessageDefinition(definitionsArray);
          } catch (error) {
            console.warn(
              `Failed to stringify message definition for ${topic.type}:`,
              error
            );
          }
        } else {
          console.warn(`No message definition found for ${topic.type}`);
        }

        schemaId = await mcapWriter.registerSchema({
          name: topic.type,
          encoding: "ros2msg",
          data: new TextEncoder().encode(schemaData),
        });
        schemaIdMap.set(topic.type, schemaId);
      }

      // Register channel
      const channelId = await mcapWriter.registerChannel({
        schemaId,
        topic: topic.name,
        messageEncoding: "cdr",
        metadata: new Map([["type", topic.type]]),
      });

      channelIdMap.set(topic.name, channelId);
      topicMessageCounts.set(topic.name, 0);
    }

    onProgress?.({ status: "Converting messages...", messagesProcessed: 0 });

    // Read and convert all messages
    let processedCount = 0;
    for await (const message of bag.readMessages({ rawMessages: true })) {
      const channelId = channelIdMap.get(message.topic.name);
      if (channelId === undefined) {
        console.warn(`Unknown topic: ${message.topic.name}`);
        continue;
      }

      // Convert timestamp to nanoseconds
      const timeNs =
        BigInt(message.timestamp.sec) * BigInt(1e9) +
        BigInt(message.timestamp.nsec);

      // Write message to MCAP
      await mcapWriter.addMessage({
        channelId,
        sequence: 0,
        publishTime: timeNs,
        logTime: timeNs,
        data: message.data,
      });

      // Update statistics
      topicMessageCounts.set(
        message.topic.name,
        (topicMessageCounts.get(message.topic.name) || 0) + 1
      );

      processedCount++;
      totalMessages++;

      // Update progress every 100 messages
      if (processedCount % 100 === 0) {
        onProgress?.({
          status: "Converting messages...",
          messagesProcessed: processedCount,
        });
      }
    }

    onProgress?.({ status: "Finalizing MCAP file..." });

    // Close the bag
    await bag.close();
    await sqliteDb.close();

    // End MCAP file
    await mcapWriter.end();

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

    onProgress?.({ status: "Conversion complete!" });

    // Build metadata
    const metadata: ConversionMetadata = {
      topicCount: topics.length,
      messageCount: totalMessages,
      duration: maxTime - minTime,
      startTime: minTime,
      endTime: maxTime,
      inputSize,
      outputSize: mcapData.length,
      topics: Array.from(topicMessageCounts.entries()).map(([name, count]) => {
        const topic = topics.find((t) => t.name === name);
        return {
          name,
          type: topic?.type || "unknown",
          messageCount: count,
        };
      }),
    };

    return { data: mcapData, metadata };
  } catch (error) {
    console.error("Conversion error:", error);
    throw new Error(
      `Failed to convert rosbag: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate if a file is a valid rosbag file based on extension
 */
export function isValidRosbagFile(file: File): boolean {
  const validExtensions = [".bag", ".db3"];
  return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
