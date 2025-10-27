export interface MessageField {
    type: string
    name: string
    isArray: boolean
    arrayLength?: number // undefined for dynamic arrays
    isBuiltin: boolean
    defaultValue?: any
    comment?: string
  }
  
  export interface MessageDefinition {
    type: string
    fields: MessageField[]
    fullDefinition: string
  }
  
  const BUILTIN_TYPES = [
    'bool', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32',
    'int64', 'uint64', 'float32', 'float64', 'string', 'time', 'duration'
  ]
  
  export class MessageTypeParser {
    private typeDefinitions: Map<string, string> = new Map()
    private parsedDefinitions: Map<string, MessageDefinition> = new Map()
  
  /**
   * Load all type definitions from ROS
   */
  loadTypeDefinitions(typedefs: string[], types: string[]) {
    types.forEach((type, index) => {
      const typedef = typedefs[index]
      this.typeDefinitions.set(type, typedef)
      
      // Parse embedded MSG: definitions from ROS2 format
      this.extractEmbeddedTypes(typedef)
    })
  }

  /**
   * Extract embedded message type definitions from ROS2 typedef text
   * ROS2 includes nested message definitions with "MSG: package/Type" markers
   */
  private extractEmbeddedTypes(typedef: string) {
    const lines = typedef.split('\n')
    let currentEmbeddedType: string | null = null
    let currentEmbeddedDef: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const msgMatch = line.match(/^MSG:\s*(.+)$/)
      
      if (msgMatch) {
        // Save previous embedded type if exists
        if (currentEmbeddedType && currentEmbeddedDef.length > 0) {
          this.typeDefinitions.set(currentEmbeddedType, currentEmbeddedDef.join('\n'))
        }
        
        // Start new embedded type
        currentEmbeddedType = msgMatch[1].trim()
        currentEmbeddedDef = []
      } else if (currentEmbeddedType) {
        // Check if we've reached the next section or end
        if (line.trim() === '' || line.match(/^[A-Z]+:/)) {
          // Empty line or new section marker - save current embedded type
          if (currentEmbeddedDef.length > 0) {
            this.typeDefinitions.set(currentEmbeddedType, currentEmbeddedDef.join('\n'))
          }
          currentEmbeddedType = null
          currentEmbeddedDef = []
        } else {
          // Add line to current embedded definition
          currentEmbeddedDef.push(line)
        }
      }
    }
    
    // Save last embedded type if exists
    if (currentEmbeddedType && currentEmbeddedDef.length > 0) {
      this.typeDefinitions.set(currentEmbeddedType, currentEmbeddedDef.join('\n'))
    }
  }
  
  /**
   * Parse a message type definition
   */
  parseMessageType(messageType: string): MessageDefinition | null {
    // Check cache first
    if (this.parsedDefinitions.has(messageType)) {
      return this.parsedDefinitions.get(messageType)!
    }

    const fullDefinition = this.typeDefinitions.get(messageType)
    if (!fullDefinition) {
      // Only log warning for non-builtin types
      if (!BUILTIN_TYPES.includes(messageType.toLowerCase())) {
        console.warn(`Type definition not found for: ${messageType}. Available types:`, Array.from(this.typeDefinitions.keys()).slice(0, 10))
      }
      return null
    }
  
      const fields: MessageField[] = []
      const lines = fullDefinition.split('\n')
  
      for (const line of lines) {
        const trimmed = line.trim()
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue
        
        // Skip constant definitions (lines with '=')
        if (trimmed.includes('=')) continue
  
        // Extract inline comment
        let comment: string | undefined
        let fieldLine = trimmed
        const commentIndex = trimmed.indexOf('#')
        if (commentIndex > 0) {
          comment = trimmed.substring(commentIndex + 1).trim()
          fieldLine = trimmed.substring(0, commentIndex).trim()
        }
  
        // Parse field: "type name" or "type[] name" or "type[N] name"
        const parts = fieldLine.split(/\s+/)
        if (parts.length < 2) continue
  
        let [typeStr, name] = parts
        let isArray = false
        let arrayLength: number | undefined
  
        // Check for array notation
        if (typeStr.includes('[')) {
          isArray = true
          const match = typeStr.match(/^(.+)\[(\d*)\]$/)
          if (match) {
            typeStr = match[1]
            if (match[2]) {
              arrayLength = parseInt(match[2])
            }
          }
        }
  
        const isBuiltin = BUILTIN_TYPES.includes(typeStr)
  
        fields.push({
          type: typeStr,
          name,
          isArray,
          arrayLength,
          isBuiltin,
          comment,
          defaultValue: this.getDefaultValue(typeStr, isBuiltin, isArray)
        })
      }
  
      const definition: MessageDefinition = {
        type: messageType,
        fields,
        fullDefinition
      }
  
      this.parsedDefinitions.set(messageType, definition)
      return definition
    }
  
    /**
     * Get default value for a field type
     */
    private getDefaultValue(type: string, isBuiltin: boolean, isArray: boolean): any {
      if (isArray) return []
  
      if (isBuiltin) {
        switch (type) {
          case 'bool': return false
          case 'int8': case 'uint8': case 'int16': case 'uint16':
          case 'int32': case 'uint32': case 'int64': case 'uint64':
          case 'float32': case 'float64':
            return 0
          case 'string': return ''
          case 'time': case 'duration':
            return { sec: 0, nanosec: 0 }
          default: return null
        }
      }
  
      // For complex types, return empty object
      return {}
    }
  
  /**
   * Create a default message object from a message definition
   */
  createDefaultMessage(messageType: string): any {
    const definition = this.parseMessageType(messageType)
    if (!definition || definition.fields.length === 0) {
      // Return safe fallback for missing types
      return {}
    }

    const message: any = {}

    for (const field of definition.fields) {
      if (field.isArray) {
        message[field.name] = []
      } else if (field.isBuiltin) {
        message[field.name] = field.defaultValue
      } else {
        // Recursively create nested message with error handling
        try {
          const nestedMessage = this.createDefaultMessage(field.type)
          message[field.name] = nestedMessage && Object.keys(nestedMessage).length > 0 ? nestedMessage : {}
        } catch (error) {
          console.warn(`Failed to create default message for nested type ${field.type}:`, error)
          message[field.name] = {}
        }
      }
    }

    return message
  }
  
  /**
   * Validate a message object against its type definition
   */
  validateMessage(messageType: string, message: any): { isValid: boolean; errors: string[] } {
    const definition = this.parseMessageType(messageType)
    if (!definition) {
      return {
        isValid: false,
        errors: [`Message type definition not found for: ${messageType}`]
      }
    }

    const errors: string[] = []

    // Check if message is an object
    if (message === null || typeof message !== 'object') {
      errors.push('Message must be an object')
      return { isValid: false, errors }
    }

    // Validate each field in the message definition
    for (const field of definition.fields) {
      const fieldValue = message[field.name]

      // Check if required field is missing
      if (fieldValue === undefined || fieldValue === null) {
        // For some ROS message types, missing fields might be acceptable
        // We'll only warn for now, but could be made strict if needed
        continue
      }

      // Validate arrays
      if (field.isArray) {
        if (!Array.isArray(fieldValue)) {
          errors.push(`Field '${field.name}' must be an array`)
          continue
        }

        // Check fixed-size arrays
        if (field.arrayLength !== undefined && fieldValue.length !== field.arrayLength) {
          errors.push(`Field '${field.name}' must have exactly ${field.arrayLength} elements`)
        }

        // Validate array elements if they are complex types
        if (fieldValue.length > 0 && !field.isBuiltin) {
          for (let i = 0; i < fieldValue.length; i++) {
            const elementValidation = this.validateMessage(field.type, fieldValue[i])
            if (!elementValidation.isValid) {
              errors.push(`Field '${field.name}[${i}]': ${elementValidation.errors.join(', ')}`)
            }
          }
        }
      } else {
        // Validate non-array fields
        if (field.isBuiltin) {
          // Basic type checking for built-in types
          const typeError = this.validateBuiltinType(field.type, fieldValue)
          if (typeError) {
            errors.push(`Field '${field.name}': ${typeError}`)
          }
        } else {
          // Recursively validate nested message types
          const nestedValidation = this.validateMessage(field.type, fieldValue)
          if (!nestedValidation.isValid) {
            errors.push(`Field '${field.name}': ${nestedValidation.errors.join(', ')}`)
          }
        }
      }
    }

    // Check for extra fields not in the definition
    const allowedFields = new Set(definition.fields.map(f => f.name))
    for (const fieldName in message) {
      if (!allowedFields.has(fieldName)) {
        errors.push(`Unknown field '${fieldName}' not defined in message type ${messageType}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate a built-in type value
   */
  private validateBuiltinType(type: string, value: any): string | null {
    switch (type) {
      case 'bool':
        if (typeof value !== 'boolean') {
          return 'must be a boolean'
        }
        break
      case 'int8': case 'uint8': case 'int16': case 'uint16':
      case 'int32': case 'uint32': case 'int64': case 'uint64':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          return 'must be an integer'
        }
        // Could add range validation here if needed
        break
      case 'float32': case 'float64':
        if (typeof value !== 'number') {
          return 'must be a number'
        }
        break
      case 'string':
        if (typeof value !== 'string') {
          return 'must be a string'
        }
        break
      case 'time': case 'duration':
        if (typeof value !== 'object' || value === null) {
          return 'must be an object with sec and nanosec fields'
        }
        if (typeof value.sec !== 'number' || typeof value.nanosec !== 'number') {
          return 'must have numeric sec and nanosec fields'
        }
        break
      default:
        // Unknown built-in type
        return null
    }
    return null
  }

  /**
   * Get all dependencies (nested types) for a message type
   */
  getMessageDependencies(messageType: string): string[] {
    const definition = this.parseMessageType(messageType)
    if (!definition) return []

    const dependencies: Set<string> = new Set()

    for (const field of definition.fields) {
      if (!field.isBuiltin) {
        dependencies.add(field.type)
        // Recursively get dependencies
        const nestedDeps = this.getMessageDependencies(field.type)
        nestedDeps.forEach(dep => dependencies.add(dep))
      }
    }

    return Array.from(dependencies)
  }
  }
  
  // Singleton instance
  export const messageTypeParser = new MessageTypeParser()