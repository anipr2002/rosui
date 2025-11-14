import type { Node, Edge } from 'reactflow'

export type WorkflowNodeType = 'input' | 'process' | 'output'
export type WorkflowStatus = 'idle' | 'configured' | 'active' | 'error'

export interface WorkflowStats {
  messageCount: number
  throughput: number
  lastUpdated?: number
  startedAt?: number
}

export interface InputNodeConfig {
  topicName?: string
  topicType?: string
  bufferSize: number
  autoStart: boolean
}

export type ProcessOperation = 
  | 'passThrough' 
  | 'throttle' 
  | 'filter' 
  | 'aggregate'
  // Data Transformations
  | 'mapField'
  | 'mathOp'
  | 'stringTransform'
  | 'jsonPath'
  // Statistical Operations
  | 'movingAverage'
  | 'stdDev'
  | 'minMax'
  | 'rateOfChange'
  | 'outlierDetection'
  // ROS-Specific Operations
  | 'coordinateTransform'
  | 'messageSplit'
  | 'messageMerge'
  | 'timestampValidation'
  // Advanced Filters
  | 'rangeFilter'
  | 'regexFilter'
  | 'multiCondition'

export type MathOperator = '+' | '-' | '*' | '/' | '%' | 'pow' | 'sqrt'
export type StringTransformType = 'uppercase' | 'lowercase' | 'trim' | 'substring' | 'replace'
export type ConditionOperator = 'AND' | 'OR'
export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<='

export interface FieldMapping {
  source: string
  target: string
}

export interface FilterCondition {
  field: string
  operator: ComparisonOperator
  value: string | number
}

export interface ProcessNodeConfig {
  operation: ProcessOperation
  // Existing operations
  throttleHz: number
  filterField?: string
  filterOperator?: ComparisonOperator
  filterValue?: string
  aggregateWindow: number
  
  // Data Transformations
  fieldMappings?: FieldMapping[]
  mathOperator?: MathOperator
  mathField?: string
  mathValue?: number
  mathOutputField?: string
  stringTransformType?: StringTransformType
  stringField?: string
  stringValue?: string
  substringStart?: number
  substringEnd?: number
  jsonPathField?: string
  jsonPathExpression?: string
  
  // Statistical Operations
  statisticalField?: string
  statisticalWindow?: number
  stdDevThreshold?: number
  
  // ROS-Specific Operations
  sourceFrame?: string
  targetFrame?: string
  splitArrayField?: string
  mergeTimeWindow?: number
  mergeFields?: string[]
  timestampField?: string
  maxAge?: number
  
  // Advanced Filters
  rangeField?: string
  rangeMin?: number
  rangeMax?: number
  regexField?: string
  regexPattern?: string
  multiConditions?: FilterCondition[]
  conditionOperator?: ConditionOperator
  
  // Error tracking
  errors?: string[]
  warnings?: string[]
}

export type OutputMode = 'publish' | 'service'

export interface OutputNodeConfig {
  mode: OutputMode
  targetTopic?: string
  targetType?: string
  serviceName?: string
  serviceType?: string
  customMessage?: string
  autoPublish: boolean
}

export type WorkflowNodeConfig =
  | InputNodeConfig
  | ProcessNodeConfig
  | OutputNodeConfig

export interface WorkflowNodeData {
  label: string
  description?: string
  nodeType: WorkflowNodeType
  status: WorkflowStatus
  config: WorkflowNodeConfig
  stats: WorkflowStats
}

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge

export interface WorkflowPersistence {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  version?: string
  timestamp?: number
  description?: string
}

export interface LiveMessage {
  timestamp: number
  data: any
  nodeId: string
  type?: 'input' | 'process-before' | 'process-after' | 'output'
}

export interface HistoryEntry {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  timestamp: number
}

export interface PerformanceMetrics {
  nodeId: string
  totalMessages: number
  throughput: number
  averageLatency?: number
  errorCount: number
  lastActive?: number
}

