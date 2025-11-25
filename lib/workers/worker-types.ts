/**
 * Type definitions for web worker communication
 * Shared between main thread and worker thread
 */

import type { MessageRecord } from "@/store/topic-store";

// Commands sent from main thread to worker
export type WorkerCommand =
  | {
      type: "SUBSCRIBE";
      topicName: string;
      messageType: string;
    }
  | {
      type: "UNSUBSCRIBE";
      topicName: string;
    }
  | {
      type: "CLEAR_HISTORY";
      topicName: string;
    }
  | {
      type: "MESSAGE";
      topicName: string;
      message: any;
      timestamp: number;
    }
  | {
      type: "CONFIGURE";
      config: WorkerConfig;
    };

// Responses sent from worker to main thread
export type WorkerResponse =
  | {
      type: "SUBSCRIBED";
      topicName: string;
    }
  | {
      type: "UNSUBSCRIBED";
      topicName: string;
    }
  | {
      type: "HISTORY_CLEARED";
      topicName: string;
    }
  | {
      type: "MESSAGE_UPDATE";
      topicName: string;
      messages: MessageRecord[];
      latestMessage: any;
    }
  | {
      type: "BATCH_UPDATE";
      updates: Array<{
        topicName: string;
        messages: MessageRecord[];
        latestMessage: any;
      }>;
    }
  | {
      type: "ERROR";
      error: string;
      topicName?: string;
    };

// Worker configuration
export interface WorkerConfig {
  // Maximum number of messages to keep per topic
  maxMessagesPerTopic?: number;
  // Throttle interval for batch updates in milliseconds (default: 16ms for 60fps)
  throttleInterval?: number;
  // Enable debug logging
  debug?: boolean;
}

// Internal worker state for a subscriber
export interface WorkerSubscriberState {
  topicName: string;
  messageType: string;
  messages: MessageRecord[];
  latestMessage: any;
  messageCount: number;
}
