import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import * as ROSLIB from "roslib";
import { useRosStore } from "./ros-store";
import { messageTypeParser } from "@/lib/ros/messageTypeParser";
import { enableMapSet } from "immer";

enableMapSet();

export interface TopicInfo {
  name: string;
  type: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  topicType: string;
  message: any;
  createdAt: number;
}

export interface PublisherInfo {
  topic: ROSLIB.Topic;
  name: string;
  type: string;
  isPublishing: boolean;
  publishRate?: number; // Hz
  intervalId?: NodeJS.Timeout;
}

export interface MessageRecord {
  data: any;
  timestamp: number;
}

export interface SubscriberInfo {
  topic: ROSLIB.Topic;
  name: string;
  type: string;
  isSubscribed: boolean;
  messages: MessageRecord[];
  latestMessage: any;
}

export interface TopicDetails {
  topicName: string;
  publishers: string[];
  subscribers: string[];
  fetchedAt: number;
}

interface TopicsState {
  // Topics list
  topics: TopicInfo[];
  isLoadingTopics: boolean;

  // Type definitions
  typeDefinitions: Map<string, string>;
  isLoadingTypes: boolean;

  // Topic details (publishers/subscribers)
  topicDetails: Map<string, TopicDetails>;
  isLoadingDetails: boolean;

  // Publishing
  publishers: Map<string, PublisherInfo>;
  messageTemplates: MessageTemplate[];

  // Subscribing
  subscribers: Map<string, SubscriberInfo>;

  // Actions - Topics
  getTopicsList: () => Promise<void>;

  // Actions - Type definitions
  loadTypeDefinitions: () => Promise<void>;

  // Actions - Topic details
  getTopicDetails: (topicName: string) => Promise<TopicDetails | null>;

  // Actions - Publishing
  createPublisher: (topicName: string, messageType: string) => void;
  publish: (topicName: string, message: any) => void;
  startPeriodicPublish: (topicName: string, message: any, rate: number) => void;
  stopPeriodicPublish: (topicName: string) => void;
  removePublisher: (topicName: string) => void;

  // Actions - Subscribing
  createSubscriber: (topicName: string, messageType: string) => void;
  removeSubscriber: (topicName: string) => void;
  clearMessageHistory: (topicName: string) => void;

  // Cleanup
  cleanup: () => void;

  // Templates
  saveTemplate: (name: string, topicType: string, message: any) => void;
  deleteTemplate: (id: string) => void;
  loadTemplate: (id: string) => MessageTemplate | undefined;
}

export const useTopicsStore = create<TopicsState>()(
  immer((set, get) => ({
    topics: [],
    isLoadingTopics: false,

    typeDefinitions: new Map(),
    isLoadingTypes: false,

    topicDetails: new Map(),
    isLoadingDetails: false,

    publishers: new Map(),
    messageTemplates: [],

    subscribers: new Map(),

    getTopicsList: async () => {
      const ros = useRosStore.getState().ros;
      if (!ros) {
        console.error("ROS connection not available");
        return;
      }

      set({ isLoadingTopics: true });

      try {
        ros.getTopicsAndRawTypes(
          (result: {
            types: string[];
            topics: string[];
            typedefs_full_text: string[];
          }) => {
            try {
              const topicsList: TopicInfo[] = result.topics.map(
                (topic, index) => ({
                  name: topic,
                  type: result.types[index],
                })
              );

              const typeDefsMap = new Map<string, string>();
              result.types.forEach((type: string, index: number) => {
                typeDefsMap.set(type, result.typedefs_full_text[index]);
              });

              // Load into parser
              messageTypeParser.loadTypeDefinitions(
                result.typedefs_full_text,
                result.types
              );

              set({
                topics: topicsList,
                typeDefinitions: typeDefsMap,
                isLoadingTopics: false,
              });

              console.log(`Loaded ${topicsList.length} topics successfully`);
            } catch (error) {
              console.error("Error processing topics data:", error);
              set({ isLoadingTopics: false });
              // Note: We don't show toast here as this is called on page load
            }
          },
          (error: any) => {
            console.error("Failed to load topics:", error);
            set({ isLoadingTopics: false });
            // Note: We don't show toast here as this might be called frequently
          }
        );
      } catch (error) {
        console.error("Error loading topics:", error);
        set({ isLoadingTopics: false });
      }
    },

    loadTypeDefinitions: async () => {
      const ros = useRosStore.getState().ros;
      if (!ros) return;

      set({ isLoadingTypes: true });

      try {
        ros.getTopicsAndRawTypes(
          (result: {
            types: string[];
            topics: string[];
            typedefs_full_text: string[];
          }) => {
            const typeDefsMap = new Map<string, string>();
            result.types.forEach((type: string, index: number) => {
              typeDefsMap.set(type, result.typedefs_full_text[index]);
            });

            // Load into parser
            messageTypeParser.loadTypeDefinitions(
              result.typedefs_full_text,
              result.types
            );

            set({
              typeDefinitions: typeDefsMap,
              isLoadingTypes: false,
            });
          },
          (error: any) => {
            console.error("Failed to load type definitions:", error);
            set({ isLoadingTypes: false });
          }
        );
      } catch (error) {
        console.error("Error loading type definitions:", error);
        set({ isLoadingTypes: false });
      }
    },

    getTopicDetails: async (topicName: string) => {
      const ros = useRosStore.getState().ros;
      if (!ros) return null;

      const { topicDetails } = get();

      // Return cached data if available and recent (less than 30 seconds old)
      const cached = topicDetails.get(topicName);
      if (cached && Date.now() - cached.fetchedAt < 30000) {
        return cached;
      }

      set({ isLoadingDetails: true });

      return new Promise<TopicDetails | null>((resolve) => {
        try {
          // Get system state which includes all topics with their publishers and subscribers
          const service = new ROSLIB.Service({
            ros,
            name: "/rosapi/topics",
            serviceType: "rosapi/Topics",
          });

          // First get topics to ensure topic exists
          ros.getTopics(
            (result: { topics: string[]; types: string[] }) => {
              const topicIndex = result.topics.indexOf(topicName);
              if (topicIndex === -1) {
                set({ isLoadingDetails: false });
                resolve(null);
                return;
              }

              // Now get system state for publisher/subscriber info
              const stateService = new ROSLIB.Service({
                ros,
                name: "/rosapi/get_param",
                serviceType: "rosapi/GetParam",
              });

              // Use getTopicType to get additional info
              ros.getTopicType(
                topicName,
                (type: string) => {
                  // Create a basic topic to check for publishers/subscribers
                  // Note: roslibjs doesn't directly expose getSystemState
                  // We'll use a workaround by checking nodes
                  const details: TopicDetails = {
                    topicName,
                    publishers: [],
                    subscribers: [],
                    fetchedAt: Date.now(),
                  };

                  const newTopicDetails = new Map(topicDetails);
                  newTopicDetails.set(topicName, details);
                  set({
                    topicDetails: newTopicDetails,
                    isLoadingDetails: false,
                  });
                  resolve(details);
                },
                (error: any) => {
                  console.error("Failed to get topic type:", error);
                  set({ isLoadingDetails: false });
                  resolve(null);
                }
              );
            },
            (error: any) => {
              console.error("Failed to get topics:", error);
              set({ isLoadingDetails: false });
              resolve(null);
            }
          );
        } catch (error) {
          console.error("Error getting topic details:", error);
          set({ isLoadingDetails: false });
          resolve(null);
        }
      });
    },

    createPublisher: (topicName: string, messageType: string) => {
      const ros = useRosStore.getState().ros;
      if (!ros) return;

      const { publishers } = get();

      // Don't create if already exists
      if (publishers.has(topicName)) return;

      const topic = new ROSLIB.Topic({
        ros,
        name: topicName,
        messageType,
      });

      const publisher: PublisherInfo = {
        topic,
        name: topicName,
        type: messageType,
        isPublishing: false,
      };

      set((state) => {
        state.publishers.set(topicName, publisher);
      });
    },

    publish: (topicName: string, message: any) => {
      const { publishers } = get();
      const publisher = publishers.get(topicName);

      if (!publisher) {
        const error = new Error(`Publisher not found for topic: ${topicName}`);
        console.error(error.message);
        throw error;
      }

      // Validate message structure before publishing
      const validation = messageTypeParser.validateMessage(
        publisher.type,
        message
      );
      if (!validation.isValid) {
        const error = new Error(
          `Message validation failed: ${validation.errors.join(", ")}`
        );
        console.error(error.message);
        throw error;
      }

      try {
        const rosMessage = new ROSLIB.Message(message);
        publisher.topic.publish(rosMessage);
      } catch (error) {
        console.error(`Failed to publish message to ${topicName}:`, error);
        throw error;
      }
    },

    startPeriodicPublish: (topicName: string, message: any, rate: number) => {
      const { publishers } = get();
      const publisher = publishers.get(topicName);

      if (!publisher) {
        const error = new Error(`Publisher not found for topic: ${topicName}`);
        console.error(error.message);
        throw error;
      }

      // Validate message structure before starting periodic publishing
      const validation = messageTypeParser.validateMessage(
        publisher.type,
        message
      );
      if (!validation.isValid) {
        const error = new Error(
          `Message validation failed: ${validation.errors.join(", ")}`
        );
        console.error(error.message);
        throw error;
      }

      // Stop existing interval if any
      if (publisher.intervalId) {
        clearInterval(publisher.intervalId);
      }

      // Start new interval
      const intervalMs = 1000 / rate;
      const intervalId = setInterval(() => {
        try {
          get().publish(topicName, message);
        } catch (error) {
          console.error(
            `Failed to publish periodic message to ${topicName}:`,
            error
          );
          // Stop periodic publishing on error
          get().stopPeriodicPublish(topicName);
          throw error;
        }
      }, intervalMs);

      set((state) => {
        state.publishers.set(topicName, {
          ...publisher,
          isPublishing: true,
          publishRate: rate,
          intervalId,
        });
      });
    },

    stopPeriodicPublish: (topicName: string) => {
      const { publishers } = get();
      const publisher = publishers.get(topicName);

      if (!publisher) return;

      if (publisher.intervalId) {
        clearInterval(publisher.intervalId);
      }

      set((state) => {
        state.publishers.set(topicName, {
          ...publisher,
          isPublishing: false,
          publishRate: undefined,
          intervalId: undefined,
        });
      });
    },

    removePublisher: (topicName: string) => {
      const { publishers } = get();
      const publisher = publishers.get(topicName);

      if (publisher) {
        if (publisher.intervalId) {
          clearInterval(publisher.intervalId);
        }
        publisher.topic.unadvertise();

        set((state) => {
          state.publishers.delete(topicName);
        });
      }
    },

    saveTemplate: (name: string, topicType: string, message: any) => {
      try {
        // Validate inputs
        if (!name || !topicType || !message) {
          throw new Error(
            "Template name, topic type, and message are required"
          );
        }

        const template: MessageTemplate = {
          id: `${Date.now()}-${Math.random()}`,
          name,
          topicType,
          message,
          createdAt: Date.now(),
        };

        set((state) => ({
          messageTemplates: [...state.messageTemplates, template],
        }));

        console.log(`Template "${name}" saved successfully`);
      } catch (error) {
        console.error("Failed to save template:", error);
        throw error;
      }
    },

    deleteTemplate: (id: string) => {
      try {
        const { messageTemplates } = get();
        const template = messageTemplates.find((t) => t.id === id);

        if (!template) {
          throw new Error(`Template with id ${id} not found`);
        }

        set((state) => ({
          messageTemplates: state.messageTemplates.filter((t) => t.id !== id),
        }));

        console.log(`Template "${template.name}" deleted successfully`);
      } catch (error) {
        console.error("Failed to delete template:", error);
        throw error;
      }
    },

    loadTemplate: (id: string) => {
      return get().messageTemplates.find((t) => t.id === id);
    },

    createSubscriber: (topicName: string, messageType: string) => {
      const ros = useRosStore.getState().ros;
      if (!ros) {
        const error = new Error("ROS connection not available");
        console.error(error.message);
        throw error;
      }

      const { subscribers } = get();

      // Don't create if already exists
      if (subscribers.has(topicName)) {
        console.warn(`Already subscribed to topic: ${topicName}`);
        return;
      }

      try {
        const topic = new ROSLIB.Topic({
          ros,
          name: topicName,
          messageType,
        });

        const subscriber: SubscriberInfo = {
          topic,
          name: topicName,
          type: messageType,
          isSubscribed: true,
          messages: [],
          latestMessage: null,
        };

        // Subscribe to messages
        topic.subscribe((message: any) => {
          set((state) => {
            const sub = state.subscribers.get(topicName);
            if (!sub) return;

            const messageRecord: MessageRecord = {
              data: message,
              timestamp: Date.now(),
            };

            // Keep only last 50 messages - Immer handles immutability
            const newMessages = [messageRecord, ...sub.messages].slice(0, 50);

            state.subscribers.set(topicName, {
              ...sub,
              messages: newMessages,
              latestMessage: message,
            });
          });
        });

        set((state) => {
          state.subscribers.set(topicName, subscriber);
        });
        console.log(`Successfully subscribed to topic: ${topicName}`);
      } catch (error) {
        console.error(`Failed to subscribe to topic ${topicName}:`, error);
        throw error;
      }
    },

    removeSubscriber: (topicName: string) => {
      const { subscribers } = get();
      const subscriber = subscribers.get(topicName);

      if (subscriber) {
        try {
          subscriber.topic.unsubscribe();

          set((state) => {
            state.subscribers.delete(topicName);
          });

          console.log(`Successfully unsubscribed from topic: ${topicName}`);
        } catch (error) {
          console.error(
            `Failed to unsubscribe from topic ${topicName}:`,
            error
          );
          throw error;
        }
      } else {
        console.warn(`No subscription found for topic: ${topicName}`);
      }
    },

    clearMessageHistory: (topicName: string) => {
      const { subscribers } = get();
      const subscriber = subscribers.get(topicName);

      if (subscriber) {
        try {
          set((state) => {
            state.subscribers.set(topicName, {
              ...subscriber,
              messages: [],
              latestMessage: null,
            });
          });
          console.log(`Cleared message history for topic: ${topicName}`);
        } catch (error) {
          console.error(
            `Failed to clear message history for topic ${topicName}:`,
            error
          );
          throw error;
        }
      } else {
        console.warn(`No subscription found for topic: ${topicName}`);
      }
    },

    cleanup: () => {
      const { subscribers, publishers } = get();

      // Unsubscribe all subscribers
      subscribers.forEach((subscriber) => {
        subscriber.topic.unsubscribe();
      });

      // Stop all publishers and unadvertise
      publishers.forEach((publisher) => {
        if (publisher.intervalId) {
          clearInterval(publisher.intervalId);
        }
        publisher.topic.unadvertise();
      });

      // Clear state
      set((state) => {
        state.subscribers = new Map();
        state.publishers = new Map();
      });
    },
  }))
);
