/**
 * Process node operation implementations
 */

import type { ProcessNodeConfig } from './types'
import {
  getValueAtPath,
  setValueAtPath,
  validateNumericField,
  validateStringField,
  isArray,
  toNumber,
  calculateMean,
  calculateStdDev,
  findMinMax,
  isValidRegex,
  compareValues,
  extractTimestamp,
  transformCoordinate,
  deepClone,
  createError
} from './process-utils'

export interface OperationResult {
  payload?: any
  error?: string
  warning?: string
}

export interface OperationRefs {
  throttle: Record<string, number>
  aggregate: Record<string, any[]>
  movingAverage: Record<string, number[]>
  stdDev: Record<string, number[]>
  minMax: Record<string, { min: number; max: number; values: number[] }>
  rateOfChange: Record<string, { lastValue: number; lastTime: number }>
  outlier: Record<string, number[]>
  merge: Record<string, { messages: any[]; lastCleanup: number }>
}

// Data Transformation Operations

export function applyMapField (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  if (!config.fieldMappings || config.fieldMappings.length === 0) {
    return {
      error: createError('mapField', 'No field mappings configured')
    }
  }

  const result: any = {}
  const errors: string[] = []

  for (const mapping of config.fieldMappings) {
    if (!mapping.source || !mapping.target) {
      errors.push('Invalid mapping: source and target required')
      continue
    }

    const value = getValueAtPath(payload, mapping.source)
    if (value === undefined) {
      errors.push(`Source field '${mapping.source}' not found`)
      continue
    }

    const newResult = setValueAtPath(result, mapping.target, value)
    Object.assign(result, newResult)
  }

  if (Object.keys(result).length === 0) {
    return {
      error: createError('mapField', errors.join('; '))
    }
  }

  return {
    payload: result,
    warning: errors.length > 0 ? errors.join('; ') : undefined
  }
}

export function applyMathOp (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  const validation = validateNumericField(payload, config.mathField, 'mathOp')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const fieldValue = validation.value
  const operand = config.mathValue ?? 0
  const operator = config.mathOperator ?? '+'
  let result: number

  switch (operator) {
    case '+':
      result = fieldValue + operand
      break
    case '-':
      result = fieldValue - operand
      break
    case '*':
      result = fieldValue * operand
      break
    case '/':
      if (operand === 0) {
        return { error: createError('mathOp', 'Division by zero') }
      }
      result = fieldValue / operand
      break
    case '%':
      if (operand === 0) {
        return { error: createError('mathOp', 'Modulo by zero') }
      }
      result = fieldValue % operand
      break
    case 'pow':
      result = Math.pow(fieldValue, operand)
      break
    case 'sqrt':
      if (fieldValue < 0) {
        return { error: createError('mathOp', 'Square root of negative number') }
      }
      result = Math.sqrt(fieldValue)
      break
    default:
      return { error: createError('mathOp', `Unknown operator: ${operator}`) }
  }

  const outputField = config.mathOutputField || config.mathField || 'result'
  return {
    payload: setValueAtPath(payload, outputField, result)
  }
}

export function applyStringTransform (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  const validation = validateStringField(payload, config.stringField, 'stringTransform')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  let result: string = validation.value
  const transformType = config.stringTransformType

  switch (transformType) {
    case 'uppercase':
      result = result.toUpperCase()
      break
    case 'lowercase':
      result = result.toLowerCase()
      break
    case 'trim':
      result = result.trim()
      break
    case 'substring': {
      const start = config.substringStart ?? 0
      const end = config.substringEnd
      result = end !== undefined ? result.substring(start, end) : result.substring(start)
      break
    }
    case 'replace': {
      const searchValue = config.stringValue || ''
      const replaceValue = config.stringValue || ''
      result = result.replace(new RegExp(searchValue, 'g'), replaceValue)
      break
    }
    default:
      return { error: createError('stringTransform', 'Transform type not specified') }
  }

  return {
    payload: setValueAtPath(payload, config.stringField!, result)
  }
}

export function applyJsonPath (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  if (!config.jsonPathExpression) {
    return { error: createError('jsonPath', 'Path expression not specified') }
  }

  const value = getValueAtPath(payload, config.jsonPathExpression)
  if (value === undefined) {
    return { error: createError('jsonPath', `Path '${config.jsonPathExpression}' not found`) }
  }

  const outputField = config.jsonPathField || 'extracted'
  return {
    payload: { [outputField]: value }
  }
}

// Statistical Operations

export function applyMovingAverage (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const validation = validateNumericField(payload, config.statisticalField, 'movingAverage')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const windowSize = Math.max(config.statisticalWindow || 5, 1)
  const values = refs.movingAverage[nodeId] || []
  values.unshift(validation.value)
  refs.movingAverage[nodeId] = values.slice(0, windowSize)

  const average = calculateMean(refs.movingAverage[nodeId])

  return {
    payload: {
      ...payload,
      movingAverage: average,
      window: refs.movingAverage[nodeId]
    }
  }
}

export function applyStdDev (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const validation = validateNumericField(payload, config.statisticalField, 'stdDev')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const windowSize = Math.max(config.statisticalWindow || 10, 2)
  const values = refs.stdDev[nodeId] || []
  values.unshift(validation.value)
  refs.stdDev[nodeId] = values.slice(0, windowSize)

  const mean = calculateMean(refs.stdDev[nodeId])
  const stdDev = calculateStdDev(refs.stdDev[nodeId])

  return {
    payload: {
      ...payload,
      mean,
      stdDev,
      values: refs.stdDev[nodeId]
    }
  }
}

export function applyMinMax (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const validation = validateNumericField(payload, config.statisticalField, 'minMax')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const windowSize = Math.max(config.statisticalWindow || 20, 1)
  const tracker = refs.minMax[nodeId] || { min: validation.value, max: validation.value, values: [] }
  tracker.values.unshift(validation.value)
  tracker.values = tracker.values.slice(0, windowSize)

  const { min, max } = findMinMax(tracker.values)
  tracker.min = min
  tracker.max = max
  refs.minMax[nodeId] = tracker

  return {
    payload: {
      ...payload,
      min,
      max,
      current: validation.value
    }
  }
}

export function applyRateOfChange (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const validation = validateNumericField(payload, config.statisticalField, 'rateOfChange')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const now = Date.now()
  const tracker = refs.rateOfChange[nodeId]

  if (!tracker) {
    refs.rateOfChange[nodeId] = { lastValue: validation.value, lastTime: now }
    return {
      payload: {
        ...payload,
        rateOfChange: 0,
        current: validation.value
      }
    }
  }

  const timeDelta = (now - tracker.lastTime) / 1000 // seconds
  const valueDelta = validation.value - tracker.lastValue
  const rate = timeDelta > 0 ? valueDelta / timeDelta : 0

  refs.rateOfChange[nodeId] = { lastValue: validation.value, lastTime: now }

  return {
    payload: {
      ...payload,
      rateOfChange: rate,
      current: validation.value,
      timeDelta
    }
  }
}

export function applyOutlierDetection (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const validation = validateNumericField(payload, config.statisticalField, 'outlierDetection')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const windowSize = Math.max(config.statisticalWindow || 20, 2)
  const threshold = config.stdDevThreshold || 2

  const values = refs.outlier[nodeId] || []
  values.unshift(validation.value)
  refs.outlier[nodeId] = values.slice(0, windowSize)

  if (refs.outlier[nodeId].length < 2) {
    return {
      payload: {
        ...payload,
        isOutlier: false,
        current: validation.value
      }
    }
  }

  const mean = calculateMean(refs.outlier[nodeId])
  const stdDev = calculateStdDev(refs.outlier[nodeId])
  const deviation = Math.abs(validation.value - mean)
  const isOutlier = stdDev > 0 && deviation > threshold * stdDev

  return {
    payload: {
      ...payload,
      isOutlier,
      current: validation.value,
      mean,
      stdDev,
      deviation
    }
  }
}

// ROS-Specific Operations

export function applyCoordinateTransform (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  // Simple 2D transformation
  const xVal = validateNumericField(payload, 'x', 'coordinateTransform')
  const yVal = validateNumericField(payload, 'y', 'coordinateTransform')

  if (!xVal.valid || !yVal.valid || xVal.value === undefined || yVal.value === undefined) {
    return { error: createError('coordinateTransform', 'x and y fields required') }
  }

  // For simplicity, assume transformation params are in config or use identity
  const angle = 0 // Could be extracted from config
  const tx = 0
  const ty = 0

  const transformed = transformCoordinate(xVal.value, yVal.value, angle, tx, ty)

  return {
    payload: {
      ...payload,
      x: transformed.x,
      y: transformed.y,
      sourceFrame: config.sourceFrame || 'source',
      targetFrame: config.targetFrame || 'target'
    }
  }
}

export function applyMessageSplit (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  if (!config.splitArrayField) {
    return { error: createError('messageSplit', 'Array field not specified') }
  }

  const arrayValue = getValueAtPath(payload, config.splitArrayField)
  if (!isArray(arrayValue)) {
    return { error: createError('messageSplit', `Field '${config.splitArrayField}' is not an array`) }
  }

  if (arrayValue.length === 0) {
    return { error: createError('messageSplit', 'Array is empty') }
  }

  // Return the first item, note: real implementation would need to handle multiple outputs
  return {
    payload: arrayValue[0],
    warning: `Split into ${arrayValue.length} messages (showing first)`
  }
}

export function applyMessageMerge (
  nodeId: string,
  payload: any,
  config: ProcessNodeConfig,
  refs: OperationRefs
): OperationResult {
  const timeWindow = (config.mergeTimeWindow || 1000) // ms
  const now = Date.now()

  const tracker = refs.merge[nodeId] || { messages: [], lastCleanup: now }

  // Clean up old messages
  if (now - tracker.lastCleanup > timeWindow) {
    tracker.messages = tracker.messages.filter(
      msg => now - msg.timestamp < timeWindow
    )
    tracker.lastCleanup = now
  }

  // Add current message
  tracker.messages.push({ ...payload, timestamp: now })
  refs.merge[nodeId] = tracker

  // Merge all messages in window
  const merged: any = {}
  for (const msg of tracker.messages) {
    Object.assign(merged, msg)
  }

  return {
    payload: {
      ...merged,
      mergedCount: tracker.messages.length
    }
  }
}

export function applyTimestampValidation (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  const timestamp = extractTimestamp(payload, config.timestampField)

  if (timestamp === undefined) {
    return { error: createError('timestampValidation', 'Timestamp not found') }
  }

  const now = Date.now()
  const age = now - timestamp
  const maxAge = config.maxAge || 5000 // 5 seconds default

  const isStale = age > maxAge

  return {
    payload: {
      ...payload,
      isStale,
      age,
      timestamp
    },
    warning: isStale ? `Message is stale (${age}ms old)` : undefined
  }
}

// Advanced Filter Operations

export function applyRangeFilter (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  const validation = validateNumericField(payload, config.rangeField, 'rangeFilter')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const min = config.rangeMin ?? -Infinity
  const max = config.rangeMax ?? Infinity

  if (validation.value >= min && validation.value <= max) {
    return { payload }
  }

  return {
    error: createError('rangeFilter', `Value ${validation.value} outside range [${min}, ${max}]`)
  }
}

export function applyRegexFilter (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  const validation = validateStringField(payload, config.regexField, 'regexFilter')
  if (!validation.valid || validation.value === undefined) {
    return { error: validation.error }
  }

  const pattern = config.regexPattern
  if (!pattern) {
    return { error: createError('regexFilter', 'Regex pattern not specified') }
  }

  if (!isValidRegex(pattern)) {
    return { error: createError('regexFilter', 'Invalid regex pattern') }
  }

  const regex = new RegExp(pattern)
  if (regex.test(validation.value)) {
    return { payload }
  }

  return {
    error: createError('regexFilter', `Value '${validation.value}' does not match pattern`)
  }
}

export function applyMultiCondition (
  payload: any,
  config: ProcessNodeConfig
): OperationResult {
  if (!config.multiConditions || config.multiConditions.length === 0) {
    return { error: createError('multiCondition', 'No conditions specified') }
  }

  const operator = config.conditionOperator || 'AND'
  const results: boolean[] = []

  for (const condition of config.multiConditions) {
    const value = getValueAtPath(payload, condition.field)
    if (value === undefined) {
      results.push(false)
      continue
    }

    const condValue = toNumber(condition.value) ?? condition.value
    const result = compareValues(value, condition.operator, condValue)
    results.push(result)
  }

  const passes = operator === 'AND'
    ? results.every(r => r)
    : results.some(r => r)

  if (passes) {
    return { payload }
  }

  return {
    error: createError('multiCondition', `Conditions not met (${operator})`)
  }
}

