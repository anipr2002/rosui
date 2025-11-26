"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { use3DVisStore } from "@/store/3d-vis-store";
import { useRosStore } from "@/store/ros-store";
import { useTFStore } from "@/store/tf-store";
import * as THREE from "three";
import URDFLoader from "urdf-loader";
import { STLLoader } from "three-stdlib";
import { ColladaLoader } from "three-stdlib";

// WebGPU-compatible material factory
function createWebGPUCompatibleMaterial(
  color: number | string,
  options?: {
    metalness?: number;
    roughness?: number;
    transparent?: boolean;
    opacity?: number;
  }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options?.metalness ?? 0.3,
    roughness: options?.roughness ?? 0.7,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1.0,
    side: THREE.DoubleSide,
  });
}

interface URDFModelProps {
  meshBasePath?: string;
}

export function URDFModel({
  meshBasePath = "http://resources.robotwebtools.org/",
}: URDFModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const robotRef = useRef<any>(null);
  const jointMapRef = useRef<Map<string, any>>(new Map()); // Map of joint name to joint object
  const [error, setError] = useState<string | null>(null);

  const { ros, status } = useRosStore();
  const {
    urdfData,
    urdfSourceMode,
    tfEnabled,
    tfClient,
    isLoadingURDF,
    sceneSettings,
  } = use3DVisStore();

  // Note: Don't destructure these here - access them directly in useFrame
  // to get the latest values on each frame

  // Load and parse URDF
  useEffect(() => {
    if (!urdfData || !groupRef.current || status !== "connected") {
      return;
    }

    // Clean up existing model
    if (robotRef.current && groupRef.current) {
      groupRef.current.remove(robotRef.current);
      robotRef.current.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      robotRef.current = null;
    }

    try {
      // Create URDF loader with default manager
      const manager = new THREE.LoadingManager();
      const loader = new URDFLoader(manager);

      // Auto-detect packages from URDF data
      // Extract all package names referenced in the URDF
      const packageMatches = urdfData.match(/package:\/\/([^/]+)/g) || [];
      const packagePathMatches =
        urdfData.match(/\/([^/]+_description)\//g) || [];

      const packages: Record<string, string> = {};

      // From package:// URLs
      packageMatches.forEach((match) => {
        const pkgName = match.replace("package://", "");
        packages[pkgName] = `/${pkgName}`;
      });

      // From file paths like /ewellix_description/
      packagePathMatches.forEach((match) => {
        const pkgName = match.replace(/\//g, "");
        packages[pkgName] = `/${pkgName}`;
      });

      loader.packages = packages;
      console.log("Auto-detected packages:", Object.keys(packages));

      // Set up mesh loading callback
      loader.loadMeshCb = (
        path: string,
        manager: THREE.LoadingManager,
        done: (mesh: THREE.Object3D) => void
      ) => {
        // Resolve the mesh path - handle file:// URLs and package:// URLs
        let meshPath = path;

        console.log("Loading mesh:", meshPath);

        // Remove file:// prefix if present
        if (meshPath.startsWith("file://")) {
          meshPath = meshPath.replace("file://", "");
        }

        // Helper function to try loading from HTTP
        const tryLoadFromHTTP = (httpPath: string, extension: string) => {
          console.log("Attempting to load from HTTP:", httpPath);

          if (extension === "stl") {
            const stlLoader = new STLLoader(manager);
            stlLoader.load(
              httpPath,
              (geometry) => {
                geometry.computeVertexNormals();
                const material = createWebGPUCompatibleMaterial(0xcccccc);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                done(mesh);
              },
              undefined,
              (error) => {
                console.warn(
                  "Could not load STL from HTTP, using placeholder:",
                  error
                );
                const geometry = new THREE.SphereGeometry(0.05, 16, 16);
                const material = createWebGPUCompatibleMaterial(0x2196f3);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                done(mesh);
              }
            );
          } else if (extension === "dae") {
            const colladaLoader = new ColladaLoader(manager);
            colladaLoader.load(
              httpPath,
              (collada) => {
                collada.scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                });
                done(collada.scene);
              },
              undefined,
              (error) => {
                console.warn(
                  "Could not load DAE from HTTP, using placeholder:",
                  error
                );
                const geometry = new THREE.SphereGeometry(0.05, 16, 16);
                const material = createWebGPUCompatibleMaterial(0x2196f3);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                done(mesh);
              }
            );
          }
        };

        // Try to convert package:// URLs to HTTP URLs
        if (meshPath.startsWith("package://")) {
          // Extract package name and path
          const packagePath = meshPath.replace("package://", "");
          const [packageName, ...pathParts] = packagePath.split("/");
          const relativePath = pathParts.join("/");
          const extension = relativePath.split(".").pop()?.toLowerCase() || "";

          // Try to load from HTTP server using configured URL
          const httpPath = `${sceneSettings.meshServerUrl}/${packageName}/share/${packageName}/${relativePath}`;
          tryLoadFromHTTP(httpPath, extension);
          return;
        }

        // Handle paths like /ewellix_description/meshes/... or /robotiq_description/meshes/...
        // These are package-relative paths without the package:// scheme and without /share/
        if (
          meshPath.startsWith("/") &&
          meshPath.includes("_description/") &&
          !meshPath.includes("/share/")
        ) {
          // Extract package name from the path
          const pathMatch = meshPath.match(/\/([^/]+_description)\/(.+)/);
          if (pathMatch) {
            const packageName = pathMatch[1];
            const relativePath = pathMatch[2];
            const extension =
              relativePath.split(".").pop()?.toLowerCase() || "";

            // Convert to HTTP URL - add /share/ for these paths
            const httpPath = `${sceneSettings.meshServerUrl}/${packageName}/share/${packageName}/${relativePath}`;
            tryLoadFromHTTP(httpPath, extension);
            return;
          }
        }

        // Handle full filesystem paths like /home/rosuser/Code/ws/install/ur_description/share/...
        if (
          meshPath.includes("/install/") &&
          meshPath.includes("_description/")
        ) {
          // Extract package name and path after /install/
          const pathMatch = meshPath.match(/\/install\/(.+)/);
          if (pathMatch) {
            const pathAfterInstall = pathMatch[1];
            const extension =
              pathAfterInstall.split(".").pop()?.toLowerCase() || "";

            // Convert to HTTP URL - path after install/ maps directly
            const httpPath = `${sceneSettings.meshServerUrl}/${pathAfterInstall}`;
            tryLoadFromHTTP(httpPath, extension);
            return;
          }
        }

        // If none of the above patterns matched and it's a local path, use placeholder
        if (meshPath.startsWith("/")) {
          console.log("Using placeholder for local filesystem path:", meshPath);

          // Create a more visible placeholder - use a sphere to represent each link
          const geometry = new THREE.SphereGeometry(0.05, 16, 16);
          const material = createWebGPUCompatibleMaterial(0x2196f3, {
            metalness: 0.4,
            roughness: 0.6,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          done(mesh);
          return;
        }

        // Determine file type for remote URLs
        const extension = meshPath.split(".").pop()?.toLowerCase();

        if (extension === "stl") {
          const stlLoader = new STLLoader(manager);
          stlLoader.load(
            meshPath,
            (geometry) => {
              geometry.computeVertexNormals();
              const material = createWebGPUCompatibleMaterial(0xcccccc);
              const mesh = new THREE.Mesh(geometry, material);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              done(mesh);
            },
            undefined,
            (error) => {
              console.error("Error loading STL mesh:", error);
              // Fallback to sphere geometry
              const geometry = new THREE.SphereGeometry(0.05, 16, 16);
              const material = createWebGPUCompatibleMaterial(0xff9800);
              const mesh = new THREE.Mesh(geometry, material);
              done(mesh);
            }
          );
        } else if (extension === "dae") {
          const colladaLoader = new ColladaLoader(manager);
          colladaLoader.load(
            meshPath,
            (collada) => {
              collada.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              done(collada.scene);
            },
            undefined,
            (error) => {
              console.error("Error loading DAE mesh:", error);
              // Fallback to sphere geometry
              const geometry = new THREE.SphereGeometry(0.05, 16, 16);
              const material = createWebGPUCompatibleMaterial(0xff9800);
              const mesh = new THREE.Mesh(geometry, material);
              done(mesh);
            }
          );
        } else {
          // Unsupported format, use placeholder sphere
          const geometry = new THREE.SphereGeometry(0.05, 16, 16);
          const material = createWebGPUCompatibleMaterial(0x9e9e9e);
          const mesh = new THREE.Mesh(geometry, material);
          done(mesh);
        }
      };

      // Parse URDF
      console.log("Parsing URDF data...");
      const robot = loader.parse(urdfData);

      if (robot && groupRef.current) {
        robotRef.current = robot;
        groupRef.current.add(robot);
        setError(null);
        console.log("URDF loaded successfully, robot added to scene");
        console.log("Robot object:", robot);
        console.log("Robot children count:", robot.children.length);
        console.log("Robot position:", robot.position);
        console.log("Robot scale:", robot.scale);

        // Fix coordinate system: ROS uses Z-up, Three.js uses Y-up
        // Rotate the entire robot to align coordinate systems
        robot.rotation.x = -Math.PI / 2; // Rotate -90 degrees around X axis

        // Extract joint information for animation
        const jointMap = new Map<string, any>();
        robot.traverse((child: any) => {
          if (child.isURDFJoint) {
            console.log(
              "Joint found:",
              child.name,
              child.jointType,
              "position:",
              child.position
            );
            // Store joint reference for animation
            // Joint types: revolute, continuous, prismatic, fixed, floating, planar
            if (child.jointType !== "fixed") {
              jointMap.set(child.name, child);
            }
          } else if (child.isURDFLink) {
            console.log("Link found:", child.name, "position:", child.position);
          }

          // Log all meshes
          if (child instanceof THREE.Mesh) {
            console.log(
              "Mesh found in robot:",
              child.name,
              "visible:",
              child.visible,
              "position:",
              child.position
            );
          }
        });

        // Store joint map for use in useFrame
        jointMapRef.current = jointMap;
        console.log(
          `Extracted ${jointMap.size} movable joints:`,
          Array.from(jointMap.keys())
        );

        // Compute bounding box to see the actual size
        const box = new THREE.Box3().setFromObject(robot);
        console.log("Robot bounding box:", box);
        console.log("Robot size:", {
          x: box.max.x - box.min.x,
          y: box.max.y - box.min.y,
          z: box.max.z - box.min.z,
        });
      } else {
        console.error("Failed to parse URDF or add to scene");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load URDF";
      console.error("Error loading URDF:", err);
      setError(errorMsg);
    }

    return () => {
      // Cleanup on unmount
      if (robotRef.current && groupRef.current) {
        groupRef.current.remove(robotRef.current);
        robotRef.current.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
        robotRef.current = null;
      }
      // Clear joint map
      jointMapRef.current.clear();
    };
  }, [urdfData, status, sceneSettings.meshServerUrl]);

  // Update joint positions from joint_states and/or TF
  useFrame(() => {
    if (!robotRef.current) return;

    const robot = robotRef.current;
    const jointMap = jointMapRef.current;

    // Get latest state directly from store (not from component scope)
    // This ensures we always have the most recent joint states
    const { jointStatesEnabled, currentJointStates, tfEnabled } =
      use3DVisStore.getState();

    // Primary: Update joints from joint_states topic
    if (jointStatesEnabled && currentJointStates.size > 0) {
      jointMap.forEach((joint, jointName) => {
        const position = currentJointStates.get(jointName);
        if (position !== undefined && joint.setJointValue) {
          // setJointValue works for all joint types (revolute, prismatic, continuous)
          joint.setJointValue(position);
        }
      });
    }

    // Secondary: Update robot base position from TF (for mobile robots)
    // Get TF data from the tf-store
    const tfTree = useTFStore.getState().tfTree;
    if (tfEnabled && tfTree.size > 0) {
      // Look for base_link transform (common for mobile robots)
      // Try common frame names: base_link, base_footprint
      const baseFrameNames = ["base_link", "base_footprint"];

      for (const frameName of baseFrameNames) {
        const transform = tfTree.get(frameName);
        if (transform && transform.parent !== frameName) {
          // Apply transform to the root group (before the coordinate rotation)
          // This allows mobile robots to move in the scene
          if (groupRef.current) {
            // Store original rotation
            const originalRotation = robot.rotation.x;

            // Update position from TF
            groupRef.current.position.set(
              transform.translation.x,
              transform.translation.y,
              transform.translation.z
            );

            // Update rotation from TF quaternion
            const quaternion = new THREE.Quaternion(
              transform.rotation.x,
              transform.rotation.y,
              transform.rotation.z,
              transform.rotation.w
            );
            groupRef.current.quaternion.copy(quaternion);

            // Re-apply coordinate system fix
            robot.rotation.x = originalRotation;
          }
          break; // Found base frame, no need to check others
        }
      }
    }
  });

  if (!urdfData || isLoadingURDF) {
    return null;
  }

  if (error) {
    console.warn("URDF loading error:", error);
  }

  return <group ref={groupRef} />;
}
