/**
 * Bridge class to manage web worker communication from the main thread
 * Provides a typed interface for interacting with the message worker
 */

import type {
  WorkerCommand,
  WorkerResponse,
  WorkerConfig,
} from "./worker-types";
import type { MessageRecord } from "@/store/topic-store";

export type MessageUpdateCallback = (
  topicName: string,
  messages: MessageRecord[],
  latestMessage: any
) => void;

export type ErrorCallback = (error: string, topicName?: string) => void;

export class WorkerBridge {
  private worker: Worker | null = null;
  private messageUpdateCallback: MessageUpdateCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private isInitialized = false;

  /**
   * Initialize the worker
   */
  initialize(config?: WorkerConfig): void {
    if (this.isInitialized) {
      console.warn("[WorkerBridge] Already initialized");
      return;
    }

    try {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL("./message-worker.ts", import.meta.url),
        { type: "module" }
      );

      // Set up message listener
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      // Set up error listener
      this.worker.onerror = (error) => {
        console.error("[WorkerBridge] Worker error:", error);
        if (this.errorCallback) {
          this.errorCallback(error.message);
        }
      };

      this.isInitialized = true;

      // Send initial configuration if provided
      if (config) {
        this.configure(config);
      }

      console.log("[WorkerBridge] Worker initialized");
    } catch (error) {
      console.error("[WorkerBridge] Failed to initialize worker:", error);
      throw error;
    }
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(response: WorkerResponse): void {
    switch (response.type) {
      case "MESSAGE_UPDATE":
        if (this.messageUpdateCallback) {
          this.messageUpdateCallback(
            response.topicName,
            response.messages,
            response.latestMessage
          );
        }
        break;

      case "BATCH_UPDATE":
        if (this.messageUpdateCallback) {
          for (const update of response.updates) {
            this.messageUpdateCallback(
              update.topicName,
              update.messages,
              update.latestMessage
            );
          }
        }
        break;

      case "ERROR":
        if (this.errorCallback) {
          this.errorCallback(response.error, response.topicName);
        }
        console.error(
          `[WorkerBridge] Worker error for ${response.topicName}:`,
          response.error
        );
        break;

      case "SUBSCRIBED":
      case "UNSUBSCRIBED":
      case "HISTORY_CLEARED":
        // These are acknowledgment messages, we can log them if needed
        break;

      default:
        console.warn("[WorkerBridge] Unknown response type:", response);
    }
  }

  /**
   * Set callback for message updates
   */
  onMessageUpdate(callback: MessageUpdateCallback): void {
    this.messageUpdateCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Send a command to the worker
   */
  private sendCommand(command: WorkerCommand): void {
    if (!this.worker) {
      throw new Error("[WorkerBridge] Worker not initialized");
    }
    this.worker.postMessage(command);
  }

  /**
   * Configure the worker
   */
  configure(config: WorkerConfig): void {
    this.sendCommand({
      type: "CONFIGURE",
      config,
    });
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topicName: string, messageType: string): void {
    this.sendCommand({
      type: "SUBSCRIBE",
      topicName,
      messageType,
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topicName: string): void {
    this.sendCommand({
      type: "UNSUBSCRIBE",
      topicName,
    });
  }

  /**
   * Clear message history for a topic
   */
  clearHistory(topicName: string): void {
    this.sendCommand({
      type: "CLEAR_HISTORY",
      topicName,
    });
  }

  /**
   * Send a message to the worker for processing
   */
  processMessage(topicName: string, message: any, timestamp: number): void {
    this.sendCommand({
      type: "MESSAGE",
      topicName,
      message,
      timestamp,
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.messageUpdateCallback = null;
      this.errorCallback = null;
      console.log("[WorkerBridge] Worker terminated");
    }
  }

  /**
   * Check if worker is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let workerBridgeInstance: WorkerBridge | null = null;

/**
 * Get the singleton worker bridge instance
 */
export function getWorkerBridge(): WorkerBridge {
  if (!workerBridgeInstance) {
    workerBridgeInstance = new WorkerBridge();
  }
  return workerBridgeInstance;
}

/**
 * Reset the worker bridge (useful for cleanup)
 */
export function resetWorkerBridge(): void {
  if (workerBridgeInstance) {
    workerBridgeInstance.terminate();
    workerBridgeInstance = null;
  }
}
