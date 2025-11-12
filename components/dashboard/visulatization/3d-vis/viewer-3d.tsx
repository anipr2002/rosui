"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid as DreiGrid,
  Environment,
} from "@react-three/drei";
import { Card, CardContent } from "@/components/ui/card";
import { useRosStore } from "@/store/ros-store";
import { use3DVisStore } from "@/store/3d-vis-store";
import { AlertCircle, Loader2 } from "lucide-react";
import { URDFModel } from "./scene-objects/urdf-model";
import { TFAxes } from "./scene-objects/tf-axes";
import { PointCloudManager } from "./scene-objects/point-cloud";
import { MarkerManager } from "./scene-objects/markers";
import * as THREE from "three";

interface Viewer3DProps {
  width?: number;
  height?: number;
}

function Scene() {
  const sceneSettings = use3DVisStore((state) => state.sceneSettings);
  const updateStats = use3DVisStore((state) => state.updateStats);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  // Calculate FPS
  useFrame(({ scene, gl }) => {
    frameCountRef.current++;
    const now = Date.now();

    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round(
        (frameCountRef.current * 1000) / (now - lastTimeRef.current)
      );

      // Count objects
      let objectCount = 0;
      let polygonCount = 0;

      scene.traverse((obj) => {
        objectCount++;
        if (obj instanceof THREE.Mesh && obj.geometry) {
          const positions = obj.geometry.attributes.position;
          if (positions) {
            polygonCount += positions.count / 3;
          }
        }
      });

      updateStats(fps, objectCount, Math.round(polygonCount));

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={sceneSettings.ambientLightIntensity} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={sceneSettings.directionalLightIntensity}
        castShadow
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={sceneSettings.directionalLightIntensity * 0.5}
      />

      {/* Grid */}
      {sceneSettings.showGrid && (
        <DreiGrid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#374151"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* URDF Model */}
      <Suspense fallback={null}>
        <URDFModel />
      </Suspense>

      {/* TF Axes */}
      <TFAxes />

      {/* Point Clouds */}
      <PointCloudManager />

      {/* Markers */}
      <MarkerManager />

      {/* Environment (optional subtle reflections) */}
      <Environment preset="city" background={false} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

export function Viewer3D({ width = 800, height = 600 }: Viewer3DProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { status } = useRosStore();
  const { urdfError, sceneSettings } = use3DVisStore();

  // Initialize viewer (ros3d is already in package.json, no need to load from CDN)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ROS3D should be available from the installed package
    // Mark as initialized immediately since we're using the npm package
    setIsInitialized(true);
    setViewerError(null);
  }, []);

  const displayError = viewerError || urdfError;

  return (
    <div className="space-y-4">
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
                <span className="text-sm">Initializing 3D viewer...</span>
              </div>
            </div>
          ) : status !== "connected" ? (
            <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center text-gray-500">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Not Connected to ROS
                </p>
                <p className="text-sm text-gray-500">
                  Please connect to ROS to use 3D visualization
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="w-full rounded-lg overflow-hidden"
              style={{
                height: `${height}px`,
                backgroundColor: sceneSettings.backgroundColor,
              }}
            >
              <Canvas
                camera={{
                  position: [3, 3, 3],
                  fov: 50,
                  near: 0.1,
                  far: 1000,
                }}
                shadows
              >
                <Suspense fallback={<LoadingFallback />}>
                  <Scene />
                </Suspense>
                <OrbitControls
                  enableDamping
                  dampingFactor={0.05}
                  minDistance={0.5}
                  maxDistance={100}
                  target={[0, 0, 0]}
                />
              </Canvas>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
