/**
 * Parse a message path and extract the value from a message
 * Supports paths like:
 * - .data
 * - .pose.position.x
 * - .array[0]
 * - .array[:].x (returns array of x values)
 */

export interface PathParseResult {
  value: any
  success: boolean
  error?: string
}

/**
 * Parse a message path and extract the value
 * @param message - The message object
 * @param path - The path string (e.g., ".data", ".pose.position.x")
 * @returns The extracted value or undefined
 */
export function parseMessagePath(message: any, path: string): PathParseResult {
  try {
    // Remove leading dot if present
    const cleanPath = path.startsWith('.') ? path.slice(1) : path

    if (!cleanPath) {
      return { value: message, success: true }
    }

    // Split path into parts
    const parts = cleanPath.split('.')
    let current = message

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      // Check for array indexing
      const arrayMatch = part.match(/^(.+?)\[(.+?)\]$/)
      
      if (arrayMatch) {
        const [, fieldName, indexStr] = arrayMatch
        
        // Navigate to the array field first
        if (fieldName) {
          current = current[fieldName]
          if (current === undefined || current === null) {
            return {
              value: undefined,
              success: false,
              error: `Field '${fieldName}' not found in path '${path}'`
            }
          }
        }

        // Handle array slicing [:] - get all elements
        if (indexStr === ':') {
          if (!Array.isArray(current)) {
            return {
              value: undefined,
              success: false,
              error: `Field '${fieldName || 'root'}' is not an array`
            }
          }

          // If there are more path parts, extract that field from each element
          if (i < parts.length - 1) {
            const remainingPath = parts.slice(i + 1).join('.')
            const results = current.map(item => {
              const result = parseMessagePath(item, remainingPath)
              return result.success ? result.value : undefined
            })
            return { value: results, success: true }
          }

          return { value: current, success: true }
        }

        // Handle numeric index
        const index = Number.parseInt(indexStr, 10)
        if (Number.isNaN(index)) {
          return {
            value: undefined,
            success: false,
            error: `Invalid array index '${indexStr}' in path '${path}'`
          }
        }

        if (!Array.isArray(current)) {
          return {
            value: undefined,
            success: false,
            error: `Field '${fieldName || 'root'}' is not an array`
          }
        }

        current = current[index]
        if (current === undefined) {
          return {
            value: undefined,
            success: false,
            error: `Array index ${index} out of bounds in path '${path}'`
          }
        }
      } else {
        // Simple field access
        current = current[part]
        if (current === undefined || current === null) {
          return {
            value: undefined,
            success: false,
            error: `Field '${part}' not found in path '${path}'`
          }
        }
      }
    }

    return { value: current, success: true }
  } catch (error) {
    return {
      value: undefined,
      success: false,
      error: `Error parsing path '${path}': ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validate if a path can be extracted from a message
 */
export function validateMessagePath(message: any, path: string): boolean {
  const result = parseMessagePath(message, path)
  return result.success
}

/**
 * Get all valid paths from a message (for autocomplete/suggestions)
 */
export function getMessagePaths(
  obj: any,
  prefix = '',
  maxDepth = 5,
  currentDepth = 0
): string[] {
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return []
  }

  const paths: string[] = []
  const objType = typeof obj

  // Handle primitives
  if (objType !== 'object') {
    return [prefix]
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      // Add indexed path
      paths.push(`${prefix}[0]`)
      // Add slice path
      paths.push(`${prefix}[:]`)
      // Recurse into first element to get nested paths
      const nestedPaths = getMessagePaths(
        obj[0],
        `${prefix}[0]`,
        maxDepth,
        currentDepth + 1
      )
      paths.push(...nestedPaths)
    }
    return paths
  }

  // Handle objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      const newPrefix = prefix ? `${prefix}.${key}` : key
      const valueType = typeof value

      // Add the path for this key
      if (valueType !== 'object' || value === null) {
        paths.push(newPrefix)
      } else {
        // Recurse for nested objects/arrays
        const nestedPaths = getMessagePaths(
          value,
          newPrefix,
          maxDepth,
          currentDepth + 1
        )
        paths.push(...nestedPaths)
      }
    }
  }

  return paths
}

/**
 * Extract numeric values from messages for plotting
 */
export function extractNumericValue(value: any): number | null {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  return null
}

/**
 * Check if a value is numeric or can be coerced to numeric
 */
export function isNumericValue(value: any): boolean {
  return extractNumericValue(value) !== null
}

/**
 * Parse message path and extract numeric value
 */
export function parseNumericPath(message: any, path: string): number | null {
  const result = parseMessagePath(message, path)
  if (!result.success) {
    return null
  }
  return extractNumericValue(result.value)
}



