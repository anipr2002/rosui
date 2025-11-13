export interface PlotSeries {
  id: string
  topic: string
  messagePath: string
  label: string
  color: string
  enabled: boolean
}

export interface LivePlotConfig {
  series?: PlotSeries[]
  maxDataPoints?: number
  // Legacy support for single series
  topic?: string
  messagePath?: string
  lineColor?: string
}

export interface PlotDataPoint {
  timestamp: number
  [key: string]: number // Allow multiple series as keys
}
