import { mat4, quat, vec3 } from 'wgpu-matrix'
import type { TFTransform } from '@/store/tf-store'
import type { TreeStructure, TreeNode } from '@/lib/tf-tree-reactflow/tf-tree-builder'

// Type definitions
export interface EulerAngles {
  roll: number  // rotation around X axis (radians)
  pitch: number // rotation around Y axis (radians)
  yaw: number   // rotation around Z axis (radians)
}

export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface ComposedTransform {
  translation: Vector3
  rotation: Quaternion
  matrix: Float32Array
}

/**
 * Convert quaternion to Euler angles (Roll-Pitch-Yaw)
 * Uses ZYX convention (yaw-pitch-roll)
 */
export function quaternionToEuler(q: Quaternion): EulerAngles {
  const { x, y, z, w } = q

  // Roll (X-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z)
  const cosr_cosp = 1 - 2 * (x * x + y * y)
  const roll = Math.atan2(sinr_cosp, cosr_cosp)

  // Pitch (Y-axis rotation)
  const sinp = 2 * (w * y - z * x)
  let pitch: number
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2 // Use 90 degrees if out of range
  } else {
    pitch = Math.asin(sinp)
  }

  // Yaw (Z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y)
  const cosy_cosp = 1 - 2 * (y * y + z * z)
  const yaw = Math.atan2(siny_cosp, cosy_cosp)

  return { roll, pitch, yaw }
}

/**
 * Convert Euler angles to quaternion
 */
export function eulerToQuaternion(euler: EulerAngles): Quaternion {
  const { roll, pitch, yaw } = euler

  const cy = Math.cos(yaw * 0.5)
  const sy = Math.sin(yaw * 0.5)
  const cp = Math.cos(pitch * 0.5)
  const sp = Math.sin(pitch * 0.5)
  const cr = Math.cos(roll * 0.5)
  const sr = Math.sin(roll * 0.5)

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy
  }
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Get Euler angles in degrees
 */
export function quaternionToEulerDegrees(q: Quaternion): { roll: number; pitch: number; yaw: number } {
  const euler = quaternionToEuler(q)
  return {
    roll: radToDeg(euler.roll),
    pitch: radToDeg(euler.pitch),
    yaw: radToDeg(euler.yaw)
  }
}

/**
 * Convert quaternion to 3x3 rotation matrix (column-major)
 */
export function quaternionToRotationMatrix(q: Quaternion): Float32Array {
  const { x, y, z, w } = q

  const xx = x * x
  const xy = x * y
  const xz = x * z
  const xw = x * w
  const yy = y * y
  const yz = y * z
  const yw = y * w
  const zz = z * z
  const zw = z * w

  // Column-major 3x3 matrix
  return new Float32Array([
    1 - 2 * (yy + zz), 2 * (xy + zw), 2 * (xz - yw),
    2 * (xy - zw), 1 - 2 * (xx + zz), 2 * (yz + xw),
    2 * (xz + yw), 2 * (yz - xw), 1 - 2 * (xx + yy)
  ])
}

/**
 * Convert TFTransform to 4x4 homogeneous transformation matrix
 * Uses wgpu-matrix for GPU-compatible format
 */
export function transformToMatrix4(transform: TFTransform): Float32Array {
  const m = mat4.create()

  // Create rotation quaternion array for wgpu-matrix
  const q = quat.create()
  quat.set(
    transform.rotation.x,
    transform.rotation.y,
    transform.rotation.z,
    transform.rotation.w,
    q
  )

  // Apply rotation
  mat4.fromQuat(q, m)

  // Apply translation
  m[12] = transform.translation.x
  m[13] = transform.translation.y
  m[14] = transform.translation.z

  return m
}

/**
 * Compose multiple transforms (chain multiply)
 * Transforms are applied in order: T1 * T2 * T3...
 */
export function composeTransforms(transforms: TFTransform[]): ComposedTransform {
  if (transforms.length === 0) {
    return {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      matrix: mat4.identity()
    }
  }

  // Start with identity
  let result = mat4.identity()

  // Multiply transforms in order
  for (const transform of transforms) {
    const m = transformToMatrix4(transform)
    result = mat4.multiply(result, m)
  }

  // Extract translation from matrix
  const translation: Vector3 = {
    x: result[12],
    y: result[13],
    z: result[14]
  }

  // Extract rotation from matrix (convert to quaternion)
  const rotation = matrixToQuaternion(result)

  return {
    translation,
    rotation,
    matrix: result
  }
}

/**
 * Extract quaternion from 4x4 rotation matrix
 */
export function matrixToQuaternion(m: Float32Array): Quaternion {
  // Extract 3x3 rotation part
  const trace = m[0] + m[5] + m[10]
  let x: number, y: number, z: number, w: number

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0)
    w = 0.25 / s
    x = (m[6] - m[9]) * s
    y = (m[8] - m[2]) * s
    z = (m[1] - m[4]) * s
  } else if (m[0] > m[5] && m[0] > m[10]) {
    const s = 2.0 * Math.sqrt(1.0 + m[0] - m[5] - m[10])
    w = (m[6] - m[9]) / s
    x = 0.25 * s
    y = (m[4] + m[1]) / s
    z = (m[8] + m[2]) / s
  } else if (m[5] > m[10]) {
    const s = 2.0 * Math.sqrt(1.0 + m[5] - m[0] - m[10])
    w = (m[8] - m[2]) / s
    x = (m[4] + m[1]) / s
    y = 0.25 * s
    z = (m[9] + m[6]) / s
  } else {
    const s = 2.0 * Math.sqrt(1.0 + m[10] - m[0] - m[5])
    w = (m[1] - m[4]) / s
    x = (m[8] + m[2]) / s
    y = (m[9] + m[6]) / s
    z = 0.25 * s
  }

  // Normalize
  const len = Math.sqrt(x * x + y * y + z * z + w * w)
  return {
    x: x / len,
    y: y / len,
    z: z / len,
    w: w / len
  }
}

/**
 * Compute inverse of a transform
 */
export function invertTransform(transform: TFTransform): TFTransform {
  const m = transformToMatrix4(transform)
  const invM = mat4.inverse(m)

  const translation: Vector3 = {
    x: invM[12],
    y: invM[13],
    z: invM[14]
  }

  const rotation = matrixToQuaternion(invM)

  return {
    parent: transform.child,
    child: transform.parent,
    translation,
    rotation,
    timestamp: transform.timestamp,
    isStatic: transform.isStatic
  }
}

/**
 * Get the chain of transforms from frameA to frameB
 * Returns transforms in order to go from A to B
 */
export function getTransformChain(
  structure: TreeStructure,
  frameA: string,
  frameB: string
): { transforms: TFTransform[]; path: string[] } | null {
  // Get path from A to root
  const getPathToRoot = (frame: string): string[] => {
    const path: string[] = []
    let current: string | null = frame

    while (current) {
      path.push(current)
      const node = structure.nodes.get(current)
      current = node?.parent || null
    }

    return path
  }

  const pathA = getPathToRoot(frameA)
  const pathB = getPathToRoot(frameB)

  // Find common ancestor
  const setA = new Set(pathA)
  let commonAncestor: string | null = null

  for (const frame of pathB) {
    if (setA.has(frame)) {
      commonAncestor = frame
      break
    }
  }

  if (!commonAncestor) {
    return null // No path exists
  }

  // Build path: A -> common -> B
  const pathFromA = pathA.slice(0, pathA.indexOf(commonAncestor) + 1)
  const pathToB = pathB.slice(0, pathB.indexOf(commonAncestor)).reverse()

  const fullPath = [...pathFromA, ...pathToB]
  const transforms: TFTransform[] = []

  // Collect transforms going up from A to common ancestor (need to invert)
  for (let i = 0; i < pathFromA.length - 1; i++) {
    const node = structure.nodes.get(pathFromA[i])
    if (node?.transform) {
      transforms.push(invertTransform(node.transform))
    }
  }

  // Collect transforms going down from common ancestor to B
  for (const frame of pathToB) {
    const node = structure.nodes.get(frame)
    if (node?.transform) {
      transforms.push(node.transform)
    }
  }

  return { transforms, path: fullPath }
}

/**
 * Compute full transform from frameA to frameB
 */
export function getTransformBetweenFrames(
  structure: TreeStructure,
  frameA: string,
  frameB: string
): ComposedTransform | null {
  const chain = getTransformChain(structure, frameA, frameB)
  if (!chain) return null

  return composeTransforms(chain.transforms)
}

/**
 * Calculate Euclidean distance between two frames
 */
export function distanceBetweenFrames(
  structure: TreeStructure,
  frameA: string,
  frameB: string
): number | null {
  const transform = getTransformBetweenFrames(structure, frameA, frameB)
  if (!transform) return null

  const { x, y, z } = transform.translation
  return Math.sqrt(x * x + y * y + z * z)
}

/**
 * Calculate angular difference between two frames (in radians)
 */
export function angleBetweenFrames(
  structure: TreeStructure,
  frameA: string,
  frameB: string
): number | null {
  const transform = getTransformBetweenFrames(structure, frameA, frameB)
  if (!transform) return null

  // Calculate angle from quaternion (angle of rotation)
  const { x, y, z, w } = transform.rotation
  const angle = 2 * Math.acos(Math.min(1, Math.abs(w)))

  return angle
}

/**
 * Format a 4x4 matrix as a readable string
 */
export function formatMatrix4(m: Float32Array, precision = 4): string[] {
  const rows: string[] = []
  for (let row = 0; row < 4; row++) {
    const values: string[] = []
    for (let col = 0; col < 4; col++) {
      // Column-major indexing
      values.push(m[col * 4 + row].toFixed(precision))
    }
    rows.push(values.join('  '))
  }
  return rows
}

/**
 * Get quaternion magnitude (should be ~1 for unit quaternion)
 */
export function quaternionMagnitude(q: Quaternion): number {
  return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
}

/**
 * Normalize a quaternion
 */
export function normalizeQuaternion(q: Quaternion): Quaternion {
  const mag = quaternionMagnitude(q)
  return {
    x: q.x / mag,
    y: q.y / mag,
    z: q.z / mag,
    w: q.w / mag
  }
}

/**
 * Calculate translation magnitude
 */
export function translationMagnitude(t: Vector3): number {
  return Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z)
}



