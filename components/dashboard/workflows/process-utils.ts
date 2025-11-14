/**
 * Utility functions for process node operations
 */

/**
 * Get value at nested path in object using dot notation
 * Example: getValueAtPath({a: {b: {c: 1}}}, 'a.b.c') => 1
 */
export function getValueAtPath (obj: any, path?: string): any {
  if (!path) return undefined
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    current = current[key]
  }
  return current
}

/**
 * Set value at nested path in object using dot notation
 * Creates intermediate objects if needed
 */
export function setValueAtPath (obj: any, path: string, value: any): any {
  if (!path) return obj
  const keys = path.split('.')
  const result = { ...obj }
  let current = result
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return result
}

/**
 * Check if value is numeric
 */
export function isNumeric (value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if value is a valid string
 */
export function isValidString (value: any): boolean {
  return typeof value === 'string' && value.length > 0
}

/**
 * Check if value is an array
 */
export function isArray (value: any): boolean {
  return Array.isArray(value)
}

/**
 * Safe number conversion
 */
export function toNumber (value: any): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }
  return undefined
}

/**
 * Calculate mean of numeric array
 */
export function calculateMean (values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev (values: number[]): number {
  if (values.length === 0) return 0
  const mean = calculateMean(values)
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const variance = calculateMean(squaredDiffs)
  return Math.sqrt(variance)
}

/**
 * Find min and max in array
 */
export function findMinMax (values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 }
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

/**
 * Validate regex pattern
 */
export function isValidRegex (pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

/**
 * Create error message
 */
export function createError (operation: string, message: string): string {
  return `[${operation}] ${message}`
}

/**
 * Create warning message
 */
export function createWarning (operation: string, message: string): string {
  return `[${operation}] Warning: ${message}`
}

/**
 * Deep clone object (simple implementation)
 */
export function deepClone<T> (obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Compare values based on operator
 */
export function compareValues (
  a: any,
  operator: string,
  b: any
): boolean {
  switch (operator) {
    case '=':
      return a === b
    case '!=':
      return a !== b
    case '>':
      return a > b
    case '<':
      return a < b
    case '>=':
      return a >= b
    case '<=':
      return a <= b
    default:
      return false
  }
}

/**
 * Extract timestamp from ROS message
 */
export function extractTimestamp (message: any, timestampField?: string): number | undefined {
  if (!timestampField) {
    // Try common ROS timestamp fields
    const commonFields = ['header.stamp', 'stamp', 'timestamp', 'time']
    for (const field of commonFields) {
      const value = getValueAtPath(message, field)
      if (value !== undefined) {
        // ROS timestamps are usually {sec, nsec}
        if (typeof value === 'object' && 'sec' in value) {
          return value.sec * 1000 + (value.nsec || 0) / 1000000
        }
        if (typeof value === 'number') {
          return value
        }
      }
    }
    return undefined
  }
  
  const value = getValueAtPath(message, timestampField)
  if (typeof value === 'object' && value !== null && 'sec' in value) {
    return value.sec * 1000 + (value.nsec || 0) / 1000000
  }
  if (typeof value === 'number') {
    return value
  }
  return undefined
}

/**
 * Simple coordinate transformation (2D rotation and translation)
 */
export function transformCoordinate (
  x: number,
  y: number,
  angle: number,
  tx: number,
  ty: number
): { x: number; y: number } {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: x * cos - y * sin + tx,
    y: x * sin + y * cos + ty
  }
}

/**
 * Format number with precision
 */
export function formatNumber (value: number, precision: number = 2): string {
  return value.toFixed(precision)
}

/**
 * Check if object has field
 */
export function hasField (obj: any, field: string): boolean {
  return getValueAtPath(obj, field) !== undefined
}

/**
 * Validate field exists and is numeric
 */
export function validateNumericField (
  obj: any,
  field?: string,
  operation?: string
): { valid: boolean; value?: number; error?: string } {
  if (!field) {
    return {
      valid: false,
      error: operation ? createError(operation, 'Field not specified') : 'Field not specified'
    }
  }
  
  const value = getValueAtPath(obj, field)
  if (value === undefined) {
    return {
      valid: false,
      error: operation ? createError(operation, `Field '${field}' not found`) : `Field '${field}' not found`
    }
  }
  
  const numValue = toNumber(value)
  if (numValue === undefined) {
    return {
      valid: false,
      error: operation ? createError(operation, `Field '${field}' is not numeric`) : `Field '${field}' is not numeric`
    }
  }
  
  return { valid: true, value: numValue }
}

/**
 * Validate field exists and is string
 */
export function validateStringField (
  obj: any,
  field?: string,
  operation?: string
): { valid: boolean; value?: string; error?: string } {
  if (!field) {
    return {
      valid: false,
      error: operation ? createError(operation, 'Field not specified') : 'Field not specified'
    }
  }
  
  const value = getValueAtPath(obj, field)
  if (value === undefined) {
    return {
      valid: false,
      error: operation ? createError(operation, `Field '${field}' not found`) : `Field '${field}' not found`
    }
  }
  
  if (!isValidString(value)) {
    return {
      valid: false,
      error: operation ? createError(operation, `Field '${field}' is not a string`) : `Field '${field}' is not a string`
    }
  }
  
  return { valid: true, value: String(value) }
}

