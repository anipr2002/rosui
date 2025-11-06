import { create } from "zustand";
import * as ROSLIB from "roslib";
import { useRosStore } from "./ros-store";
import { useTFStore } from "./tf-store";
import { toast } from "sonner";

// URDF source types
export type URDFSourceMode = "ros-parameter" | "ros-topic" | "static-file";

// Visualization types
export interface PointCloudSubscription {
  topic: string;
  messageType: string;
  enabled: boolean;
  color: string;
  size: number;
  subscriber: ROSLIB.Topic | null;
}

export interface MarkerSubscription {
  topic: string;
  messageType: string;
  enabled: boolean;
  namespaceFilter: string[];
  subscriber: ROSLIB.Topic | null;
}

export interface URDFInfo {
  jointCount: number;
  linkCount: number;
  rootFrame: string;
  joints: string[];
  links: string[];
}

export interface TFFrame {
  name: string;
  parent: string;
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  lastUpdate: number;
}

// Scene settings
export interface SceneSettings {
  showGrid: boolean;
  showAxes: boolean;
  axesSize: number;
  backgroundColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  meshServerUrl: string; // HTTP server URL for loading mesh files
}

// Store state
interface ThreeDVisState {
  // URDF state
  urdfSourceMode: URDFSourceMode;
  urdfParameterName: string;
  urdfTopicName: string;
  urdfFileUrl: string;
  urdfData: string | null;
  urdfInfo: URDFInfo | null;
  isLoadingURDF: boolean;
  urdfError: string | null;
  urdfTopicSubscriber: ROSLIB.Topic | null;

  // TF state
  tfEnabled: boolean;
  tfClient: any | null; // ROSLIB.TFClient
  tfFrames: Map<string, TFFrame>;
  showTFAxes: boolean;
  tfAxesSize: number;

  // Joint state
  jointStatesEnabled: boolean;
  jointStateTopic: string;
  jointStatesSubscriber: ROSLIB.Topic | null;
  currentJointStates: Map<string, number>;
  lastJointStateUpdate: number;

  // Point cloud state
  pointCloudSubscriptions: Map<string, PointCloudSubscription>;

  // Marker state
  markerSubscriptions: Map<string, MarkerSubscription>;

  // Scene settings
  sceneSettings: SceneSettings;

  // Scene stats
  fps: number;
  objectCount: number;
  polygonCount: number;

  // Actions - URDF
  setURDFSourceMode: (mode: URDFSourceMode) => void;
  setURDFParameterName: (name: string) => void;
  setURDFTopicName: (name: string) => void;
  setURDFFileUrl: (url: string) => void;
  loadURDFFromParameter: () => Promise<void>;
  loadURDFFromTopic: () => Promise<void>;
  loadURDFFromFile: () => Promise<void>;
  clearURDF: () => void;

  // Actions - TF
  toggleTF: (enabled: boolean) => void;
  setShowTFAxes: (show: boolean) => void;
  setTFAxesSize: (size: number) => void;
  updateTFFrame: (frame: TFFrame) => void;

  // Actions - Joint States
  toggleJointStates: (enabled: boolean) => void;
  setJointStateTopic: (topic: string) => void;
  updateJointState: (name: string, position: number) => void;

  // Actions - Point clouds
  addPointCloudSubscription: (topic: string, messageType: string) => void;
  removePointCloudSubscription: (topic: string) => void;
  togglePointCloudEnabled: (topic: string) => void;
  updatePointCloudColor: (topic: string, color: string) => void;
  updatePointCloudSize: (topic: string, size: number) => void;

  // Actions - Markers
  addMarkerSubscription: (topic: string, messageType: string) => void;
  removeMarkerSubscription: (topic: string) => void;
  toggleMarkerEnabled: (topic: string) => void;
  updateMarkerNamespaceFilter: (topic: string, namespaces: string[]) => void;

  // Actions - Scene
  updateSceneSettings: (settings: Partial<SceneSettings>) => void;
  updateStats: (fps: number, objectCount: number, polygonCount: number) => void;

  // Cleanup
  cleanup: () => void;
}

const defaultSceneSettings: SceneSettings = {
  showGrid: true,
  showAxes: true,
  axesSize: 1.0,
  backgroundColor: "#f5f5f5",
  ambientLightIntensity: 0.6,
  directionalLightIntensity: 0.8,
  meshServerUrl: "http://localhost:8080", // Default HTTP server for mesh files
};

export const use3DVisStore = create<ThreeDVisState>((set, get) => ({
  // Initial URDF state
  urdfSourceMode: "ros-parameter",
  urdfParameterName: "/robot_description",
  urdfTopicName: "/robot_description",
  urdfFileUrl: "",
  urdfData: null,
  urdfInfo: null,
  isLoadingURDF: false,
  urdfError: null,
  urdfTopicSubscriber: null,

  // Initial TF state
  tfEnabled: false,
  tfClient: null,
  tfFrames: new Map(),
  showTFAxes: true,
  tfAxesSize: 0.2,

  // Initial joint state
  jointStatesEnabled: false,
  jointStateTopic: "/joint_states",
  jointStatesSubscriber: null,
  currentJointStates: new Map(),
  lastJointStateUpdate: 0,

  // Initial visualization state
  pointCloudSubscriptions: new Map(),
  markerSubscriptions: new Map(),

  // Initial scene settings
  sceneSettings: defaultSceneSettings,

  // Initial stats
  fps: 0,
  objectCount: 0,
  polygonCount: 0,

  // URDF Actions
  setURDFSourceMode: (mode) => {
    set({ urdfSourceMode: mode, urdfError: null });
  },

  setURDFParameterName: (name) => {
    set({ urdfParameterName: name });
  },

  setURDFTopicName: (name) => {
    set({ urdfTopicName: name });
  },

  setURDFFileUrl: (url) => {
    set({ urdfFileUrl: url });
  },

  loadURDFFromParameter: async () => {
    const { ros, status } = useRosStore.getState();
    const { urdfParameterName } = get();

    if (status !== "connected" || !ros) {
      set({ urdfError: "Not connected to ROS" });
      toast.error("Cannot load URDF: Not connected to ROS");
      return;
    }

    set({ isLoadingURDF: true, urdfError: null });

    try {
      // Create service client for getting parameter (ROS2)
      const getParamClient = new ROSLIB.Service({
        ros,
        name: "/rosapi/get_param",
        serviceType: "rosapi/GetParam",
      });

      // ROS2 rosapi GetParam service only has 'name' field, no 'default'
      const request = new ROSLIB.ServiceRequest({
        name: urdfParameterName,
      });

      getParamClient.callService(
        request,
        (response: any) => {
          if (response.value) {
            const urdfData = response.value;

            // Parse URDF to extract info
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(urdfData, "text/xml");

            const joints = Array.from(xmlDoc.getElementsByTagName("joint")).map(
              (j) => j.getAttribute("name") || ""
            );
            const links = Array.from(xmlDoc.getElementsByTagName("link")).map(
              (l) => l.getAttribute("name") || ""
            );
            const rootElement = xmlDoc.getElementsByTagName("robot")[0];
            const rootFrame = rootElement?.getAttribute("name") || "base_link";

            const urdfInfo: URDFInfo = {
              jointCount: joints.length,
              linkCount: links.length,
              rootFrame,
              joints,
              links,
            };

            set({
              urdfData,
              urdfInfo,
              isLoadingURDF: false,
              urdfError: null,
            });

            toast.success("URDF loaded successfully from parameter");
          } else {
            set({
              urdfError: `Parameter ${urdfParameterName} not found`,
              isLoadingURDF: false,
            });
            toast.error(`Parameter ${urdfParameterName} not found`);
          }
        },
        (error: any) => {
          const errorMsg = error?.message || "Failed to load URDF parameter";
          set({ urdfError: errorMsg, isLoadingURDF: false });
          toast.error(`Failed to load URDF: ${errorMsg}`);
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load URDF";
      set({ urdfError: errorMsg, isLoadingURDF: false });
      toast.error(`Failed to load URDF: ${errorMsg}`);
    }
  },

  loadURDFFromTopic: async () => {
    const { ros, status } = useRosStore.getState();
    const { urdfTopicName, urdfTopicSubscriber } = get();

    if (status !== "connected" || !ros) {
      set({ urdfError: "Not connected to ROS" });
      toast.error("Cannot load URDF: Not connected to ROS");
      return;
    }

    // Clean up existing subscriber if any
    if (urdfTopicSubscriber) {
      urdfTopicSubscriber.unsubscribe();
      set({ urdfTopicSubscriber: null });
    }

    set({ isLoadingURDF: true, urdfError: null });

    try {
      const topic = new ROSLIB.Topic({
        ros,
        name: urdfTopicName,
        messageType: "std_msgs/String",
      });

      let messageReceived = false;
      const timeoutDuration = 10000; // 10 seconds timeout

      const timeout = setTimeout(() => {
        if (!messageReceived) {
          topic.unsubscribe();
          set({
            urdfError: `Timeout waiting for URDF on topic ${urdfTopicName}`,
            isLoadingURDF: false,
            urdfTopicSubscriber: null,
          });
          toast.error(`Timeout: No URDF received from ${urdfTopicName}`);
        }
      }, timeoutDuration);

      topic.subscribe((message: any) => {
        if (messageReceived) return; // Only process first message
        messageReceived = true;
        clearTimeout(timeout);

        try {
          const urdfData = message.data;

          if (!urdfData) {
            throw new Error("Empty URDF data received");
          }

          // Parse URDF to extract info
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(urdfData, "text/xml");

          // Check for parse errors
          const parserError = xmlDoc.querySelector("parsererror");
          if (parserError) {
            throw new Error("Failed to parse URDF XML");
          }

          const joints = Array.from(xmlDoc.getElementsByTagName("joint")).map(
            (j) => j.getAttribute("name") || ""
          );
          const links = Array.from(xmlDoc.getElementsByTagName("link")).map(
            (l) => l.getAttribute("name") || ""
          );
          const rootElement = xmlDoc.getElementsByTagName("robot")[0];
          const rootFrame = rootElement?.getAttribute("name") || "base_link";

          const urdfInfo: URDFInfo = {
            jointCount: joints.length,
            linkCount: links.length,
            rootFrame,
            joints,
            links,
          };

          // Unsubscribe after receiving data
          topic.unsubscribe();

          set({
            urdfData,
            urdfInfo,
            isLoadingURDF: false,
            urdfError: null,
            urdfTopicSubscriber: null,
          });

          toast.success("URDF loaded successfully from topic");
        } catch (parseError) {
          topic.unsubscribe();
          const errorMsg =
            parseError instanceof Error
              ? parseError.message
              : "Failed to parse URDF data";
          set({
            urdfError: errorMsg,
            isLoadingURDF: false,
            urdfTopicSubscriber: null,
          });
          toast.error(`Failed to parse URDF: ${errorMsg}`);
        }
      });

      set({ urdfTopicSubscriber: topic });
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to subscribe to URDF topic";
      set({
        urdfError: errorMsg,
        isLoadingURDF: false,
        urdfTopicSubscriber: null,
      });
      toast.error(`Failed to load URDF: ${errorMsg}`);
    }
  },

  loadURDFFromFile: async () => {
    const { urdfFileUrl } = get();

    if (!urdfFileUrl) {
      set({ urdfError: "No URDF file URL provided" });
      toast.error("Please provide a URDF file URL");
      return;
    }

    set({ isLoadingURDF: true, urdfError: null });

    try {
      const response = await fetch(urdfFileUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const urdfData = await response.text();

      // Parse URDF to extract info
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(urdfData, "text/xml");

      const joints = Array.from(xmlDoc.getElementsByTagName("joint")).map(
        (j) => j.getAttribute("name") || ""
      );
      const links = Array.from(xmlDoc.getElementsByTagName("link")).map(
        (l) => l.getAttribute("name") || ""
      );
      const rootElement = xmlDoc.getElementsByTagName("robot")[0];
      const rootFrame = rootElement?.getAttribute("name") || "base_link";

      const urdfInfo: URDFInfo = {
        jointCount: joints.length,
        linkCount: links.length,
        rootFrame,
        joints,
        links,
      };

      set({
        urdfData,
        urdfInfo,
        isLoadingURDF: false,
        urdfError: null,
      });

      toast.success("URDF loaded successfully from file");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load URDF file";
      set({ urdfError: errorMsg, isLoadingURDF: false });
      toast.error(`Failed to load URDF: ${errorMsg}`);
    }
  },

  clearURDF: () => {
    set({
      urdfData: null,
      urdfInfo: null,
      urdfError: null,
    });
  },

  // TF Actions
  toggleTF: (enabled) => {
    const { status } = useRosStore.getState();
    const tfStore = useTFStore.getState();

    if (enabled && status !== "connected") {
      toast.error("Cannot enable TF: Not connected to ROS");
      return;
    }

    if (enabled) {
      // Use the existing tf-store for TF data
      // Subscribe to TF if not already subscribed
      if (!tfStore.isSubscribed) {
        tfStore.subscribeTF();
      }

      // Set up periodic sync from tf-store to 3d-vis-store
      const syncInterval = setInterval(() => {
        const currentTFTree = useTFStore.getState().tfTree;
        const newFrames = new Map<string, TFFrame>();

        currentTFTree.forEach((transform, key) => {
          newFrames.set(key, {
            name: transform.child,
            parent: transform.parent,
            translation: transform.translation,
            rotation: transform.rotation,
            lastUpdate: transform.timestamp,
          });
        });

        set({ tfFrames: newFrames });
      }, 100); // Sync at 10Hz

      set({
        tfEnabled: true,
        tfClient: syncInterval, // Store interval ID in tfClient
      });
      toast.success("TF updates enabled");
    } else {
      // Cleanup
      const { tfClient } = get();
      if (tfClient) {
        clearInterval(tfClient as any); // Clear the sync interval
        set({ tfEnabled: false, tfClient: null, tfFrames: new Map() });
        toast.info("TF updates disabled");
      }
    }
  },

  setShowTFAxes: (show) => {
    set({ showTFAxes: show });
  },

  setTFAxesSize: (size) => {
    set({ tfAxesSize: size });
  },

  updateTFFrame: (frame) => {
    set((state) => {
      const newFrames = new Map(state.tfFrames);
      newFrames.set(frame.name, frame);
      return { tfFrames: newFrames };
    });
  },

  // Joint State Actions
  setJointStateTopic: (topic) => {
    set({ jointStateTopic: topic });
  },

  updateJointState: (name, position) => {
    set((state) => {
      const newStates = new Map(state.currentJointStates);
      newStates.set(name, position);
      return {
        currentJointStates: newStates,
        lastJointStateUpdate: Date.now(),
      };
    });
  },

  toggleJointStates: (enabled) => {
    const { ros, status } = useRosStore.getState();
    const { jointStateTopic, jointStatesSubscriber } = get();

    if (enabled && status !== "connected") {
      toast.error("Cannot enable joint states: Not connected to ROS");
      return;
    }

    // Disable: cleanup existing subscriber
    if (!enabled && jointStatesSubscriber) {
      jointStatesSubscriber.unsubscribe();
      set({
        jointStatesEnabled: false,
        jointStatesSubscriber: null,
        currentJointStates: new Map(),
        lastJointStateUpdate: 0,
      });
      toast.info("Joint states disabled");
      return;
    }

    // Enable: create new subscriber
    if (enabled && ros) {
      try {
        const topic = new ROSLIB.Topic({
          ros,
          name: jointStateTopic,
          messageType: "sensor_msgs/JointState",
        });

        topic.subscribe((message: any) => {
          const { updateJointState } = get();
          // Message format: { name: string[], position: number[], velocity: number[], effort: number[] }
          const names = message.name || [];
          const positions = message.position || [];

          // Update joint states - names[i] maps to position[i]
          for (let i = 0; i < names.length; i++) {
            if (i < positions.length) {
              updateJointState(names[i], positions[i]);
            }
          }
        });

        set({
          jointStatesEnabled: true,
          jointStatesSubscriber: topic,
        });

        toast.success(`Subscribed to ${jointStateTopic}`);
      } catch (err) {
        toast.error("Failed to subscribe to joint states");
        console.error("Joint states subscription error:", err);
      }
    }
  },

  // Point cloud Actions
  addPointCloudSubscription: (topic, messageType) => {
    const { ros, status } = useRosStore.getState();

    if (status !== "connected" || !ros) {
      toast.error("Cannot subscribe: Not connected to ROS");
      return;
    }

    // Check if already subscribed
    if (get().pointCloudSubscriptions.has(topic)) {
      toast.warning(`Already subscribed to ${topic}`);
      return;
    }

    try {
      const subscriber = new ROSLIB.Topic({
        ros,
        name: topic,
        messageType,
      });

      const subscription: PointCloudSubscription = {
        topic,
        messageType,
        enabled: true,
        color: "#ffffff",
        size: 1,
        subscriber,
      };

      set((state) => {
        const newSubs = new Map(state.pointCloudSubscriptions);
        newSubs.set(topic, subscription);
        return { pointCloudSubscriptions: newSubs };
      });

      toast.success(`Subscribed to ${topic}`);
    } catch (err) {
      toast.error(`Failed to subscribe to ${topic}`);
      console.error("Subscription error:", err);
    }
  },

  removePointCloudSubscription: (topic) => {
    const subscription = get().pointCloudSubscriptions.get(topic);

    if (subscription?.subscriber) {
      subscription.subscriber.unsubscribe();
    }

    set((state) => {
      const newSubs = new Map(state.pointCloudSubscriptions);
      newSubs.delete(topic);
      return { pointCloudSubscriptions: newSubs };
    });

    toast.info(`Unsubscribed from ${topic}`);
  },

  togglePointCloudEnabled: (topic) => {
    set((state) => {
      const newSubs = new Map(state.pointCloudSubscriptions);
      const sub = newSubs.get(topic);
      if (sub) {
        sub.enabled = !sub.enabled;
        newSubs.set(topic, sub);
      }
      return { pointCloudSubscriptions: newSubs };
    });
  },

  updatePointCloudColor: (topic, color) => {
    set((state) => {
      const newSubs = new Map(state.pointCloudSubscriptions);
      const sub = newSubs.get(topic);
      if (sub) {
        sub.color = color;
        newSubs.set(topic, sub);
      }
      return { pointCloudSubscriptions: newSubs };
    });
  },

  updatePointCloudSize: (topic, size) => {
    set((state) => {
      const newSubs = new Map(state.pointCloudSubscriptions);
      const sub = newSubs.get(topic);
      if (sub) {
        sub.size = size;
        newSubs.set(topic, sub);
      }
      return { pointCloudSubscriptions: newSubs };
    });
  },

  // Marker Actions
  addMarkerSubscription: (topic, messageType) => {
    const { ros, status } = useRosStore.getState();

    if (status !== "connected" || !ros) {
      toast.error("Cannot subscribe: Not connected to ROS");
      return;
    }

    // Check if already subscribed
    if (get().markerSubscriptions.has(topic)) {
      toast.warning(`Already subscribed to ${topic}`);
      return;
    }

    try {
      const subscriber = new ROSLIB.Topic({
        ros,
        name: topic,
        messageType,
      });

      const subscription: MarkerSubscription = {
        topic,
        messageType,
        enabled: true,
        namespaceFilter: [],
        subscriber,
      };

      set((state) => {
        const newSubs = new Map(state.markerSubscriptions);
        newSubs.set(topic, subscription);
        return { markerSubscriptions: newSubs };
      });

      toast.success(`Subscribed to ${topic}`);
    } catch (err) {
      toast.error(`Failed to subscribe to ${topic}`);
      console.error("Subscription error:", err);
    }
  },

  removeMarkerSubscription: (topic) => {
    const subscription = get().markerSubscriptions.get(topic);

    if (subscription?.subscriber) {
      subscription.subscriber.unsubscribe();
    }

    set((state) => {
      const newSubs = new Map(state.markerSubscriptions);
      newSubs.delete(topic);
      return { markerSubscriptions: newSubs };
    });

    toast.info(`Unsubscribed from ${topic}`);
  },

  toggleMarkerEnabled: (topic) => {
    set((state) => {
      const newSubs = new Map(state.markerSubscriptions);
      const sub = newSubs.get(topic);
      if (sub) {
        sub.enabled = !sub.enabled;
        newSubs.set(topic, sub);
      }
      return { markerSubscriptions: newSubs };
    });
  },

  updateMarkerNamespaceFilter: (topic, namespaces) => {
    set((state) => {
      const newSubs = new Map(state.markerSubscriptions);
      const sub = newSubs.get(topic);
      if (sub) {
        sub.namespaceFilter = namespaces;
        newSubs.set(topic, sub);
      }
      return { markerSubscriptions: newSubs };
    });
  },

  // Scene Actions
  updateSceneSettings: (settings) => {
    set((state) => ({
      sceneSettings: { ...state.sceneSettings, ...settings },
    }));
  },

  updateStats: (fps, objectCount, polygonCount) => {
    set({ fps, objectCount, polygonCount });
  },

  // Cleanup
  cleanup: () => {
    const {
      tfClient,
      pointCloudSubscriptions,
      markerSubscriptions,
      urdfTopicSubscriber,
      jointStatesSubscriber,
    } = get();

    // Cleanup URDF topic subscriber
    if (urdfTopicSubscriber) {
      urdfTopicSubscriber.unsubscribe();
    }

    // Cleanup joint states subscriber
    if (jointStatesSubscriber) {
      jointStatesSubscriber.unsubscribe();
    }

    // Cleanup TF (tfClient is actually a setInterval ID)
    if (tfClient) {
      clearInterval(tfClient as any);
      set({ tfClient: null, tfEnabled: false, tfFrames: new Map() });
    }

    // Cleanup point clouds
    pointCloudSubscriptions.forEach((sub) => {
      if (sub.subscriber) {
        sub.subscriber.unsubscribe();
      }
    });

    // Cleanup markers
    markerSubscriptions.forEach((sub) => {
      if (sub.subscriber) {
        sub.subscriber.unsubscribe();
      }
    });

    set({
      pointCloudSubscriptions: new Map(),
      markerSubscriptions: new Map(),
      urdfData: null,
      urdfInfo: null,
      urdfTopicSubscriber: null,
      jointStatesSubscriber: null,
      currentJointStates: new Map(),
      lastJointStateUpdate: 0,
    });
  },
}));
