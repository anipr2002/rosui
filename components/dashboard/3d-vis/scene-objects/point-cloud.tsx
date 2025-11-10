'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { use3DVisStore } from '@/store/3d-vis-store'
import * as THREE from 'three'

interface PointCloudRendererProps {
  topic: string
}

export function PointCloudRenderer({ topic }: PointCloudRendererProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const lastUpdateRef = useRef<number>(0)
  
  const subscription = use3DVisStore((state) => state.pointCloudSubscriptions.get(topic))

  useEffect(() => {
    if (!subscription || !subscription.subscriber || !subscription.enabled) {
      return
    }

    const handleMessage = (message: any) => {
      // Throttle updates to 10Hz for performance
      const now = Date.now()
      if (now - lastUpdateRef.current < 100) {
        return
      }
      lastUpdateRef.current = now

      try {
        // Parse PointCloud2 message
        const width = message.width
        const height = message.height
        const pointStep = message.point_step
        const rowStep = message.row_step
        const data = message.data
        const fields = message.fields

        // Find x, y, z field offsets
        const xField = fields.find((f: any) => f.name === 'x')
        const yField = fields.find((f: any) => f.name === 'y')
        const zField = fields.find((f: any) => f.name === 'z')
        const rgbField = fields.find((f: any) => f.name === 'rgb' || f.name === 'rgba')
        const intensityField = fields.find((f: any) => f.name === 'intensity')

        if (!xField || !yField || !zField) {
          console.error('Point cloud missing x, y, or z fields')
          return
        }

        const numPoints = width * height
        const positions = new Float32Array(numPoints * 3)
        const colors = new Float32Array(numPoints * 3)

        // Parse point cloud data
        const dataView = new DataView(new Uint8Array(data).buffer)
        
        for (let i = 0; i < numPoints; i++) {
          const offset = i * pointStep

          // Read position
          const x = dataView.getFloat32(offset + xField.offset, true)
          const y = dataView.getFloat32(offset + yField.offset, true)
          const z = dataView.getFloat32(offset + zField.offset, true)

          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z

          // Read color
          if (rgbField) {
            const rgb = dataView.getUint32(offset + rgbField.offset, true)
            const r = ((rgb >> 16) & 0xff) / 255
            const g = ((rgb >> 8) & 0xff) / 255
            const b = (rgb & 0xff) / 255
            colors[i * 3] = r
            colors[i * 3 + 1] = g
            colors[i * 3 + 2] = b
          } else if (intensityField) {
            const intensity = dataView.getFloat32(offset + intensityField.offset, true)
            colors[i * 3] = intensity
            colors[i * 3 + 1] = intensity
            colors[i * 3 + 2] = intensity
          } else {
            // Default white color
            colors[i * 3] = 1
            colors[i * 3 + 1] = 1
            colors[i * 3 + 2] = 1
          }
        }

        // Update geometry
        if (geometryRef.current) {
          geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
          geometryRef.current.computeBoundingSphere()
          geometryRef.current.attributes.position.needsUpdate = true
          geometryRef.current.attributes.color.needsUpdate = true
        }
      } catch (err) {
        console.error('Error parsing point cloud:', err)
      }
    }

    subscription.subscriber.subscribe(handleMessage)

    return () => {
      subscription.subscriber?.unsubscribe()
    }
  }, [subscription])

  // Create geometry
  useEffect(() => {
    geometryRef.current = new THREE.BufferGeometry()
    
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose()
      }
    }
  }, [])

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: subscription?.size || 0.01,
      vertexColors: true,
      sizeAttenuation: true
    })
  }, [subscription?.size])

  if (!subscription || !subscription.enabled || !geometryRef.current) {
    return null
  }

  return (
    <points ref={pointsRef} geometry={geometryRef.current} material={material} />
  )
}

export function PointCloudManager() {
  const pointCloudSubscriptions = use3DVisStore((state) => state.pointCloudSubscriptions)
  const topics = Array.from(pointCloudSubscriptions.keys())

  return (
    <group>
      {topics.map((topic) => (
        <PointCloudRenderer key={topic} topic={topic} />
      ))}
    </group>
  )
}





