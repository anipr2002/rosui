'use client'

import React, { useRef, useEffect, useState } from 'react'
import { use3DVisStore } from '@/store/3d-vis-store'
import * as THREE from 'three'

interface MarkerObject {
  id: string
  namespace: string
  object: THREE.Object3D
  timestamp: number
}

interface MarkerRendererProps {
  topic: string
}

function createMarkerGeometry(markerType: number, scale: any): THREE.Object3D {
  const group = new THREE.Group()

  switch (markerType) {
    case 0: // ARROW
      {
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8)
        const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
        shaft.rotation.z = Math.PI / 2
        shaft.position.x = 0.35
        
        const headGeometry = new THREE.ConeGeometry(0.1, 0.3, 8)
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const head = new THREE.Mesh(headGeometry, headMaterial)
        head.rotation.z = -Math.PI / 2
        head.position.x = 0.85
        
        group.add(shaft)
        group.add(head)
      }
      break
    case 1: // CUBE
      {
        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 2: // SPHERE
      {
        const geometry = new THREE.SphereGeometry(scale.x / 2, 16, 16)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 3: // CYLINDER
      {
        const geometry = new THREE.CylinderGeometry(scale.x / 2, scale.x / 2, scale.z, 16)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 4: // LINE_STRIP
      {
        // Will be handled separately with points
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 })
        const line = new THREE.Line(geometry, material)
        group.add(line)
      }
      break
    case 5: // LINE_LIST
      {
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 })
        const line = new THREE.LineSegments(geometry, material)
        group.add(line)
      }
      break
    case 6: // CUBE_LIST
      {
        // Will be instanced
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 7: // SPHERE_LIST
      {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 8: // POINTS
      {
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 })
        const points = new THREE.Points(geometry, material)
        group.add(points)
      }
      break
    case 9: // TEXT_VIEW_FACING
      {
        // Text rendering would require additional library
        // Placeholder for now
        const geometry = new THREE.PlaneGeometry(0.5, 0.2)
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 10: // MESH_RESOURCE
      {
        // Would require loading external mesh files
        // Placeholder cube
        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    case 11: // TRIANGLE_LIST
      {
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.MeshStandardMaterial({ 
          color: 0xff0000,
          side: THREE.DoubleSide
        })
        const mesh = new THREE.Mesh(geometry, material)
        group.add(mesh)
      }
      break
    default:
      // Unknown marker type, use cube
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
  }

  return group
}

function updateMarkerObject(object: THREE.Object3D, marker: any) {
  // Update position
  object.position.set(
    marker.pose.position.x,
    marker.pose.position.y,
    marker.pose.position.z
  )

  // Update rotation
  object.quaternion.set(
    marker.pose.orientation.x,
    marker.pose.orientation.y,
    marker.pose.orientation.z,
    marker.pose.orientation.w
  )

  // Update scale
  object.scale.set(
    marker.scale.x || 1,
    marker.scale.y || 1,
    marker.scale.z || 1
  )

  // Update color
  const color = new THREE.Color(
    marker.color.r,
    marker.color.g,
    marker.color.b
  )

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.color = color
          mat.opacity = marker.color.a
          mat.transparent = marker.color.a < 1
        })
      } else {
        child.material.color = color
        child.material.opacity = marker.color.a
        child.material.transparent = marker.color.a < 1
      }
    } else if (child instanceof THREE.Line || child instanceof THREE.LineSegments) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.color = color
          mat.opacity = marker.color.a
          mat.transparent = marker.color.a < 1
        })
      } else {
        child.material.color = color
        child.material.opacity = marker.color.a
        child.material.transparent = marker.color.a < 1
      }
    } else if (child instanceof THREE.Points) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.color = color
          mat.opacity = marker.color.a
          mat.transparent = marker.color.a < 1
        })
      } else {
        child.material.color = color
        child.material.opacity = marker.color.a
        child.material.transparent = marker.color.a < 1
      }
    }
  })

  // Handle points for LINE_STRIP and LINE_LIST
  if (marker.type === 4 || marker.type === 5) {
    const positions = new Float32Array(marker.points.length * 3)
    marker.points.forEach((point: any, i: number) => {
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    })

    object.traverse((child) => {
      if (child instanceof THREE.Line || child instanceof THREE.LineSegments) {
        child.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        child.geometry.computeBoundingSphere()
      }
    })
  }

  // Handle POINTS
  if (marker.type === 8 && marker.points && marker.points.length > 0) {
    const positions = new Float32Array(marker.points.length * 3)
    const colors = new Float32Array(marker.points.length * 3)
    
    marker.points.forEach((point: any, i: number) => {
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z

      if (marker.colors && marker.colors[i]) {
        colors[i * 3] = marker.colors[i].r
        colors[i * 3 + 1] = marker.colors[i].g
        colors[i * 3 + 2] = marker.colors[i].b
      } else {
        colors[i * 3] = marker.color.r
        colors[i * 3 + 1] = marker.color.g
        colors[i * 3 + 2] = marker.color.b
      }
    })

    object.traverse((child) => {
      if (child instanceof THREE.Points) {
        child.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        child.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        child.geometry.computeBoundingSphere()
      }
    })
  }
}

export function MarkerRenderer({ topic }: MarkerRendererProps) {
  const groupRef = useRef<THREE.Group>(null)
  const markersRef = useRef<Map<string, MarkerObject>>(new Map())
  
  const subscription = use3DVisStore((state) => state.markerSubscriptions.get(topic))

  useEffect(() => {
    if (!subscription || !subscription.subscriber || !subscription.enabled) {
      return
    }

    const handleMessage = (message: any) => {
      try {
        // Handle both Marker and MarkerArray
        const markers = message.markers || [message]

        markers.forEach((marker: any) => {
          const markerId = `${marker.ns}:${marker.id}`

          // Check namespace filter
          if (subscription.namespaceFilter.length > 0 && 
              !subscription.namespaceFilter.includes(marker.ns)) {
            return
          }

          // Handle marker action
          if (marker.action === 2 || marker.action === 3) {
            // DELETE or DELETEALL
            const existing = markersRef.current.get(markerId)
            if (existing && groupRef.current) {
              groupRef.current.remove(existing.object)
              existing.object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.geometry?.dispose()
                  if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose())
                  } else {
                    child.material?.dispose()
                  }
                }
              })
              markersRef.current.delete(markerId)
            }

            if (marker.action === 3) {
              // DELETEALL - clear all markers
              markersRef.current.forEach((markerObj) => {
                if (groupRef.current) {
                  groupRef.current.remove(markerObj.object)
                }
              })
              markersRef.current.clear()
            }
          } else {
            // ADD or MODIFY
            let markerObj = markersRef.current.get(markerId)

            if (!markerObj) {
              // Create new marker
              const object = createMarkerGeometry(marker.type, marker.scale)
              markerObj = {
                id: markerId,
                namespace: marker.ns,
                object,
                timestamp: Date.now()
              }
              markersRef.current.set(markerId, markerObj)
              
              if (groupRef.current) {
                groupRef.current.add(object)
              }
            }

            // Update marker properties
            updateMarkerObject(markerObj.object, marker)

            // Handle lifetime
            if (marker.lifetime && (marker.lifetime.secs > 0 || marker.lifetime.nsecs > 0)) {
              const lifetimeMs = marker.lifetime.secs * 1000 + marker.lifetime.nsecs / 1000000
              setTimeout(() => {
                const existing = markersRef.current.get(markerId)
                if (existing && groupRef.current) {
                  groupRef.current.remove(existing.object)
                  markersRef.current.delete(markerId)
                }
              }, lifetimeMs)
            }
          }
        })
      } catch (err) {
        console.error('Error processing marker:', err)
      }
    }

    subscription.subscriber.subscribe(handleMessage)

    return () => {
      subscription.subscriber?.unsubscribe()
    }
  }, [subscription])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        markersRef.current.forEach((markerObj) => {
          groupRef.current?.remove(markerObj.object)
          markerObj.object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose()
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose())
              } else {
                child.material?.dispose()
              }
            }
          })
        })
        markersRef.current.clear()
      }
    }
  }, [])

  if (!subscription || !subscription.enabled) {
    return null
  }

  return <group ref={groupRef} />
}

export function MarkerManager() {
  const markerSubscriptions = use3DVisStore((state) => state.markerSubscriptions)
  const topics = Array.from(markerSubscriptions.keys())

  return (
    <group>
      {topics.map((topic) => (
        <MarkerRenderer key={topic} topic={topic} />
      ))}
    </group>
  )
}






