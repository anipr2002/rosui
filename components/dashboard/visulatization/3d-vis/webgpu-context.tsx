"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface WebGPUContextValue {
  device: GPUDevice | null;
  isSupported: boolean;
  isInitialized: boolean;
  error: string | null;
}

const WebGPUContext = createContext<WebGPUContextValue>({
  device: null,
  isSupported: false,
  isInitialized: false,
  error: null,
});

export function useWebGPU() {
  return useContext(WebGPUContext);
}

interface WebGPUProviderProps {
  children: React.ReactNode;
}

export function WebGPUProvider({ children }: WebGPUProviderProps) {
  const [device, setDevice] = useState<GPUDevice | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function initWebGPU() {
      try {
        // Check WebGPU support
        if (!navigator.gpu) {
          console.log(
            "WebGPU not supported in this browser, using WebGL fallback"
          );
          setIsSupported(false);
          setIsInitialized(true);
          return;
        }

        setIsSupported(true);

        // Request adapter and device
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });

        if (!adapter) {
          console.log("Failed to get WebGPU adapter, using WebGL fallback");
          setError("Failed to get WebGPU adapter");
          setIsInitialized(true);
          return;
        }

        const gpuDevice = await adapter.requestDevice({
          requiredFeatures: [],
          requiredLimits: {
            maxStorageBufferBindingSize:
              adapter.limits.maxStorageBufferBindingSize,
            maxBufferSize: adapter.limits.maxBufferSize,
          },
        });

        setDevice(gpuDevice);
        setIsInitialized(true);
        console.log("WebGPU device initialized successfully");

        // Handle device loss
        gpuDevice.lost.then((info) => {
          console.error("WebGPU device lost:", info.message);
          setError(`WebGPU device lost: ${info.message}`);
          setDevice(null);
        });
      } catch (err) {
        console.error("Failed to initialize WebGPU:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize WebGPU"
        );
        setIsInitialized(true);
      }
    }

    initWebGPU();
  }, []);

  return (
    <WebGPUContext.Provider
      value={{ device, isSupported, isInitialized, error }}
    >
      {children}
    </WebGPUContext.Provider>
  );
}
