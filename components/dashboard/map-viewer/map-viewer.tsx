"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRosStore } from "@/store/ros-store";
import { useMapStore } from "@/store/map-store";
import { MapControls } from "./map-controls";
import { AlertCircle, Loader2 } from "lucide-react";

// Import dependencies - ros2d requires createjs/EaselJS and EventEmitter2 to be available globally
// We'll load these dynamically to ensure they're initialized properly

declare global {
  interface Window {
    ROS2D: any;
    createjs: any;
    EventEmitter2: any;
  }
}

interface MapViewerProps {
  width?: number;
  height?: number;
}

export function MapViewer({ width = 800, height = 600 }: MapViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const gridClientRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const { ros, status } = useRosStore();
  const {
    mapTopic,
    subscribeToMap,
    unsubscribeFromMap,
    isLoading,
    error: mapError,
    mapMetadata,
  } = useMapStore();

  // Load dependencies dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadScript = (src: string, globalName: string) => {
      return new Promise((resolve, reject) => {
        if ((window as any)[globalName]) {
          resolve((window as any)[globalName]);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          if ((window as any)[globalName]) {
            resolve((window as any)[globalName]);
          } else {
            reject(
              new Error(`Script loaded but global '${globalName}' not found`)
            );
          }
        };
        script.onerror = () =>
          reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    const loadLibraries = async () => {
      try {
        // Load EventEmitter3 from CDN and alias it as EventEmitter2 for ros2d compatibility
        const EventEmitter3 = await loadScript(
          "https://unpkg.com/eventemitter3@latest/dist/eventemitter3.umd.min.js",
          "EventEmitter3"
        );
        window.EventEmitter2 = EventEmitter3 as any;

        // Load EaselJS and ros2d from reliable CDNs
        await loadScript(
          "https://code.createjs.com/1.0.0/easeljs.min.js",
          "createjs"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/ros2d@0.10.0/build/ros2d.min.js",
          "ROS2D"
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to load map viewer libraries";
        setViewerError(errorMsg);
        console.error("Library loading error:", err);
      }
    };

    loadLibraries();
  }, []);

  // Initialize viewer when component mounts and libraries are ready
  useEffect(() => {
    if (
      !viewerRef.current ||
      isInitialized ||
      !window.ROS2D ||
      !window.createjs
    )
      return;

    try {
      // Create a unique ID for this viewer instance
      const viewerId = `map-viewer-${Date.now()}`;
      viewerRef.current.id = viewerId;

      // Initialize the viewer
      const viewer = new window.ROS2D.Viewer({
        divID: viewerId,
        width,
        height,
        background: "#ffffff",
      });

      viewerInstanceRef.current = viewer;
      setIsInitialized(true);
      setViewerError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to initialize map viewer";
      setViewerError(errorMsg);
      console.error("Map viewer initialization error:", err);
    }

    return () => {
      // Cleanup
      if (gridClientRef.current) {
        try {
          // Grid client cleanup is handled by unsubscribe
          gridClientRef.current = null;
        } catch (err) {
          console.error("Error cleaning up grid client:", err);
        }
      }
    };
  }, []);

  // Subscribe to map when ROS is connected and viewer is ready
  useEffect(() => {
    if (
      status !== "connected" ||
      !ros ||
      !isInitialized ||
      !viewerInstanceRef.current
    ) {
      return;
    }

    try {
      // Cleanup existing grid client
      if (gridClientRef.current) {
        unsubscribeFromMap();
      }

      // Create new occupancy grid client
      const gridClient = new window.ROS2D.OccupancyGridClient({
        ros,
        topic: mapTopic,
        rootObject: viewerInstanceRef.current.scene,
        continuous: true,
      });

      // Listen for map changes to scale the view
      gridClient.on("change", () => {
        if (viewerInstanceRef.current && mapMetadata) {
          try {
            const mapWidth = mapMetadata.width * mapMetadata.resolution;
            const mapHeight = mapMetadata.height * mapMetadata.resolution;
            viewerInstanceRef.current.scaleToDimensions(mapWidth, mapHeight);
          } catch (err) {
            console.error("Error scaling map view:", err);
          }
        }
      });

      gridClientRef.current = gridClient;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to subscribe to map";
      console.error("Map subscription error:", err);
      setViewerError(errorMsg);
    }

    return () => {
      unsubscribeFromMap();
    };
  }, [status, ros, mapTopic, isInitialized, mapMetadata, unsubscribeFromMap]);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    if (viewerInstanceRef.current) {
      const scene = viewerInstanceRef.current.scene;
      scene.scaleX = scene.scaleX * 1.2;
      scene.scaleY = scene.scaleY * 1.2;
      scene.update();
    }
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    if (viewerInstanceRef.current) {
      const scene = viewerInstanceRef.current.scene;
      scene.scaleX = scene.scaleX / 1.2;
      scene.scaleY = scene.scaleY / 1.2;
      scene.update();
    }
  }, []);

  // Fit to view
  const handleFitView = useCallback(() => {
    if (viewerInstanceRef.current && mapMetadata) {
      const mapWidth = mapMetadata.width * mapMetadata.resolution;
      const mapHeight = mapMetadata.height * mapMetadata.resolution;
      viewerInstanceRef.current.scaleToDimensions(mapWidth, mapHeight);
    }
  }, [mapMetadata]);

  // Reset view
  const handleResetView = useCallback(() => {
    if (viewerInstanceRef.current) {
      const scene = viewerInstanceRef.current.scene;
      scene.x = 0;
      scene.y = viewerInstanceRef.current.height;
      scene.scaleX = 1;
      scene.scaleY = 1;
      scene.update();

      // If we have map metadata, fit to it
      if (mapMetadata) {
        handleFitView();
      }
    }
  }, [mapMetadata, handleFitView]);

  // Refresh map
  const handleRefresh = useCallback(() => {
    unsubscribeFromMap();
    setTimeout(() => {
      subscribeToMap();
    }, 100);
  }, [subscribeToMap, unsubscribeFromMap]);

  const displayError = viewerError || mapError;

  return (
    <div className="space-y-4">
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onResetView={handleResetView}
        onRefresh={handleRefresh}
      />

      <Card className="shadow-none pt-0 rounded-xl border-teal-200">
        <CardContent className="p-0">
          {displayError ? (
            <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="max-w-md mx-auto border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      Error
                    </h3>
                    <p className="text-sm text-red-800">{displayError}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : !isInitialized ? (
            <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Initializing map viewer...</span>
              </div>
            </div>
          ) : status !== "connected" ? (
            <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center text-gray-500">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Not Connected to ROS
                </p>
                <p className="text-sm text-gray-500">
                  Please connect to ROS to view the map
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={viewerRef}
              className="w-full"
              style={{ minHeight: `${height}px` }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
