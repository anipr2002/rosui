'use client'

import React, { useMemo } from 'react'
import { use3DVisStore } from '@/store/3d-vis-store'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface TFAxesProps {
  axisLength?: number
  axisWidth?: number
  showLabels?: boolean
}

function AxisHelper({ 
  position, 
  rotation, 
  scale = 1, 
  label,
  showLabel = true 
}: { 
  position: [number, number, number]
  rotation: [number, number, number, number]
  scale?: number
  label: string
  showLabel?: boolean
}) {
  const quaternion = useMemo(() => {
    return new THREE.Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])
  }, [rotation])

  const euler = useMemo(() => {
    return new THREE.Euler().setFromQuaternion(quaternion)
  }, [quaternion])

  return (
    <group position={position} rotation={euler}>
      {/* X axis - Red */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), scale, 0xff0000, scale * 0.2, scale * 0.1]} />
      
      {/* Y axis - Green */}
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), scale, 0x00ff00, scale * 0.2, scale * 0.1]} />
      
      {/* Z axis - Blue */}
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), scale, 0x0000ff, scale * 0.2, scale * 0.1]} />
      
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
  )
}

export function TFAxes({ axisLength = 0.2, axisWidth = 0.02, showLabels = true }: TFAxesProps) {
  const { tfFrames, showTFAxes, tfAxesSize } = use3DVisStore()

  if (!showTFAxes) {
    return null
  }

  const frames = Array.from(tfFrames.values())

  return (
    <group>
      {frames.map((frame) => (
        <AxisHelper
          key={frame.name}
          position={[
            frame.translation.x,
            frame.translation.y,
            frame.translation.z
          ]}
          rotation={[
            frame.rotation.x,
            frame.rotation.y,
            frame.rotation.z,
            frame.rotation.w
          ]}
          scale={tfAxesSize}
          label={frame.name}
          showLabel={showLabels}
        />
      ))}
    </group>
  )
}

