/**
 * Web Worker for processing ROS messages off the main thread
 * Handles message batching, throttling, and history management
 */

import type {
  WorkerCommand,
  WorkerResponse,
  WorkerConfig,
  WorkerSubscriberState,
} from "./worker-types";
import type { MessageRecord } from "@/store/topic-store";

// Worker state
const subscribers = new Map<string, WorkerSubscriberState>();
let config: WorkerConfig = {
  maxMessagesPerTopic: 50,
  throttleInterval: 16, // 60fps
  debug: false,
};

// Batch update queue
let pendingUpdates = new Map<
  string,
  { messages: MessageRecord[]; latestMessage: any }
>();
let batchTimeout: NodeJS.Timeout | null = null;

/**
 * Send a batch of updates to the main thread
 */
function flushBatchUpdates() {
  if (pendingUpdates.size === 0) return;

  const updates = Array.from(pendingUpdates.entries()).map(
    ([topicName, data]) => ({
      topicName,
      messages: data.messages,
      latestMessage: data.latestMessage,
    })
  );

  const response: WorkerResponse = {
    type: "BATCH_UPDATE",
    updates,
  };

  self.postMessage(response);

  // Clear pending updates
  pendingUpdates.clear();
  batchTimeout = null;

  if (config.debug) {
    console.log(`[Worker] Flushed ${updates.length} topic updates`);
  }
}

/**
 * Schedule a batch update
 */
function scheduleBatchUpdate() {
  if (batchTimeout !== null) return;

  batchTimeout = setTimeout(() => {
    flushBatchUpdates();
  }, config.throttleInterval);
}

/**
 * Handle SUBSCRIBE command
 */
function handleSubscribe(topicName: string, messageType: string) {
  if (subscribers.has(topicName)) {
    if (config.debug) {
      console.warn(`[Worker] Already subscribed to ${topicName}`);
    }
    return;
  }

  const state: WorkerSubscriberState = {
    topicName,
    messageType,
    messages: [],
    latestMessage: null,
    messageCount: 0,
  };

  subscribers.set(topicName, state);

  const response: WorkerResponse = {
    type: "SUBSCRIBED",
    topicName,
  };

  self.postMessage(response);

  if (config.debug) {
    console.log(`[Worker] Subscribed to ${topicName}`);
  }
}

/**
 * Handle UNSUBSCRIBE command
 */
function handleUnsubscribe(topicName: string) {
  if (!subscribers.has(topicName)) {
    if (config.debug) {
      console.warn(`[Worker] Not subscribed to ${topicName}`);
    }
    return;
  }

  subscribers.delete(topicName);
  pendingUpdates.delete(topicName);

  const response: WorkerResponse = {
    type: "UNSUBSCRIBED",
    topicName,
  };

  self.postMessage(response);

  if (config.debug) {
    console.log(`[Worker] Unsubscribed from ${topicName}`);
  }
}

/**
 * Handle CLEAR_HISTORY command
 */
function handleClearHistory(topicName: string) {
  const state = subscribers.get(topicName);
  if (!state) {
    if (config.debug) {
      console.warn(`[Worker] No subscriber found for ${topicName}`);
    }
    return;
  }

  state.messages = [];
  state.latestMessage = null;
  state.messageCount = 0;

  // Update pending updates
  pendingUpdates.set(topicName, {
    messages: [],
    latestMessage: null,
  });

  scheduleBatchUpdate();

  const response: WorkerResponse = {
    type: "HISTORY_CLEARED",
    topicName,
  };

  self.postMessage(response);

  if (config.debug) {
    console.log(`[Worker] Cleared history for ${topicName}`);
  }
}

/**
 * Handle MESSAGE command
 */
function handleMessage(topicName: string, message: any, timestamp: number) {
  const state = subscribers.get(topicName);
  if (!state) {
    if (config.debug) {
      console.warn(`[Worker] Received message for unsubscribed topic: ${topicName}`);
    }
    return;
  }

  // Create message record
  const messageRecord: MessageRecord = {
    data: message,
    timestamp,
  };

  // Add to message history (prepend to keep newest first)
  state.messages = [messageRecord, ...state.messages].slice(
    0,
    config.maxMessagesPerTopic
  );
  state.latestMessage = message;
  state.messageCount++;

  // Add to pending updates
  pendingUpdates.set(topicName, {
    messages: state.messages,
    latestMessage: state.latestMessage,
  });

  // Schedule batch update
  scheduleBatchUpdate();

  if (config.debug && state.messageCount % 100 === 0) {
    console.log(
      `[Worker] Processed ${state.messageCount} messages for ${topicName}`
    );
  }
}

/**
 * Handle CONFIGURE command
 */
function handleConfigure(newConfig: WorkerConfig) {
  config = { ...config, ...newConfig };

  if (config.debug) {
    console.log("[Worker] Configuration updated:", config);
  }
}

/**
 * Main message handler
 */
self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const command = event.data;

  try {
    switch (command.type) {
      case "SUBSCRIBE":
        handleSubscribe(command.topicName, command.messageType);
        break;

      case "UNSUBSCRIBE":
        handleUnsubscribe(command.topicName);
        break;

      case "CLEAR_HISTORY":
        handleClearHistory(command.topicName);
        break;

      case "MESSAGE":
        handleMessage(command.topicName, command.message, command.timestamp);
        break;

      case "CONFIGURE":
        handleConfigure(command.config);
        break;

      default:
        console.error("[Worker] Unknown command type:", command);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const response: WorkerResponse = {
      type: "ERROR",
      error: errorMessage,
      topicName: "topicName" in command ? command.topicName : undefined,
    };

    self.postMessage(response);

    console.error("[Worker] Error processing command:", error);
  }
};

// Log worker initialization
if (config.debug) {
  console.log("[Worker] Message worker initialized");
}

// Export empty object to make this a module
export {};
