"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { use3DVisStore } from "@/store/3d-vis-store";
import * as THREE from "three";
import { Text } from "@react-three/drei";

interface TFAxesProps {
  axisLength?: number;
  axisWidth?: number;
  showLabels?: boolean;
}

// Custom axis lines component optimized for WebGPU
function AxisLines({ scale = 1 }: { scale: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const { positions, colors } = useMemo(() => {
    // Create axis line vertices
    const pos = new Float32Array([
      // X axis (red)
      0,
      0,
      0,
      scale,
      0,
      0,
      // Y axis (green)
      0,
      0,
      0,
      0,
      scale,
      0,
      // Z axis (blue)
      0,
      0,
      0,
      0,
      0,
      scale,
    ]);

    const col = new Float32Array([
      // X axis (red)
      1, 0, 0, 1, 0, 0,
      // Y axis (green)
      0, 1, 0, 0, 1, 0,
      // Z axis (blue)
      0, 0, 1, 0, 0, 1,
    ]);

    return { positions: pos, colors: col };
  }, [scale]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, colors]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 2,
    });
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <lineSegments ref={groupRef} geometry={geometry} material={material} />
  );
}

// Arrow head cone for axis tips
function AxisArrowHead({
  direction,
  color,
  scale,
}: {
  direction: "x" | "y" | "z";
  color: string;
  scale: number;
}) {
  const position = useMemo((): [number, number, number] => {
    const offset = scale * 0.85;
    switch (direction) {
      case "x":
        return [offset, 0, 0];
      case "y":
        return [0, offset, 0];
      case "z":
        return [0, 0, offset];
    }
  }, [direction, scale]);

  const rotation = useMemo((): [number, number, number] => {
    switch (direction) {
      case "x":
        return [0, 0, -Math.PI / 2];
      case "y":
        return [0, 0, 0];
      case "z":
        return [Math.PI / 2, 0, 0];
    }
  }, [direction]);

  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[scale * 0.08, scale * 0.2, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function AxisHelper({
  position,
  rotation,
  scale = 1,
  label,
  showLabel = true,
}: {
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale?: number;
  label: string;
  showLabel?: boolean;
}) {
  const quaternion = useMemo(() => {
    return new THREE.Quaternion(
      rotation[0],
      rotation[1],
      rotation[2],
      rotation[3]
    );
  }, [rotation]);

  const euler = useMemo(() => {
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [quaternion]);

  return (
    <group position={position} rotation={euler}>
      {/* Axis lines */}
      <AxisLines scale={scale} />

      {/* Arrow heads */}
      <AxisArrowHead direction="x" color="#ff0000" scale={scale} />
      <AxisArrowHead direction="y" color="#00ff00" scale={scale} />
      <AxisArrowHead direction="z" color="#0000ff" scale={scale} />

      {/* Label */}
      {showLabel && (
        <Text
          position={[0, 0, scale * 1.2]}
          fontSize={scale * 0.15}
          color="#333333"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

export function TFAxes({
  axisLength = 0.2,
  axisWidth = 0.02,
  showLabels = true,
}: TFAxesProps) {
  const { tfFrames, showTFAxes, tfAxesSize } = use3DVisStore();

  if (!showTFAxes) {
    return null;
  }

  const frames = Array.from(tfFrames.values());

  return (
    <group>
      {frames.map((frame) => (
        <AxisHelper
          key={frame.name}
          position={[
            frame.translation.x,
            frame.translation.y,
            frame.translation.z,
          ]}
          rotation={[
            frame.rotation.x,
            frame.rotation.y,
            frame.rotation.z,
            frame.rotation.w,
          ]}
          scale={tfAxesSize}
          label={frame.name}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
}
