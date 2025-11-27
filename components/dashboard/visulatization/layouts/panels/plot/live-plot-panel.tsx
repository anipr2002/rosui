"use client"

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react"
import { Trash2, StopCircle } from "lucide-react"
import { useTopicsStore } from "@/store/topic-store"
import { PlotSettings } from "./plot-settings"
import { getPanelWorkerManager } from "@/lib/workers/panels/panel-worker-manager"
import type { Panel } from "../../core/types"
import type { LivePlotConfig, PlotDataPoint, PlotSeries } from "./types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Memoized chart component to prevent unnecessary re-renders
const PlotChart = React.memo<{
  chartData: PlotDataPoint[]
  activeSeries: PlotSeries[]
}>(
  ({ chartData, activeSeries }) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.toFixed(1)}
            label={{
              value: "Time (s)",
              position: "insideBottom",
              offset: -2,
              style: { fontSize: 10 },
            }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{
              value: "Value",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10 },
            }}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "11px",
              padding: "4px 8px",
            }}
            formatter={(value: any, name: string) => {
              const series = activeSeries.find((s) => s.id === name)
              return [value.toFixed(4), series?.label || name]
            }}
            labelFormatter={(value) => `Time: ${value.toFixed(2)}s`}
          />
          {activeSeries.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: "10px" }}
              formatter={(value) => {
                const series = activeSeries.find((s) => s.id === value)
                return series?.label || value
              }}
            />
          )}
          {activeSeries.map((series) => (
            <Line
              key={series.id}
              type="monotone"
              dataKey={series.id}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when data hasn't changed
    if (prevProps.chartData.length !== nextProps.chartData.length) {
      return false
    }
    if (prevProps.activeSeries.length !== nextProps.activeSeries.length) {
      return false
    }
    // Compare series configuration
    for (let i = 0; i < prevProps.activeSeries.length; i++) {
      const prevSeries = prevProps.activeSeries[i]
      const nextSeries = nextProps.activeSeries[i]
      if (
        prevSeries.id !== nextSeries.id ||
        prevSeries.color !== nextSeries.color ||
        prevSeries.label !== nextSeries.label
      ) {
        return false
      }
    }
    // Only re-render if last data point changed (new data arrived)
    if (prevProps.chartData.length > 0 && nextProps.chartData.length > 0) {
      const prevLast = prevProps.chartData[prevProps.chartData.length - 1]
      const nextLast = nextProps.chartData[nextProps.chartData.length - 1]
      return prevLast.timestamp === nextLast.timestamp
    }
    return true
  }
)

PlotChart.displayName = "PlotChart"

interface LivePlotPanelProps {
  panel: Panel
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void
  onDelete?: (id: string) => void
}

export function LivePlotPanel({
  panel,
  onUpdatePanel,
  onDelete,
}: LivePlotPanelProps) {
  // Use targeted selectors to prevent unnecessary re-renders
  const topics = useTopicsStore((state) => state.topics)
  const subscribers = useTopicsStore((state) => state.subscribers)
  const createSubscriber = useTopicsStore((state) => state.createSubscriber)
  const removeSubscriber = useTopicsStore((state) => state.removeSubscriber)

  // Worker-processed data state
  const [chartData, setChartData] = useState<PlotDataPoint[]>([])
  const [workerActiveSeries, setWorkerActiveSeries] = useState<PlotSeries[]>([])

  // Track if we've configured the worker
  const workerConfiguredRef = useRef(false)
  const lastMessageTimestampsRef = useRef<Map<string, number>>(new Map())

  // Use stable config reference to prevent unnecessary recalculations
  const configRef = useRef<LivePlotConfig>(
    (panel.config as LivePlotConfig) || {}
  )

  // Only update config ref if it actually changed (deep comparison for series)
  const config = useMemo<LivePlotConfig>(() => {
    const newConfig = (panel.config as LivePlotConfig) || {}
    const prevConfig = configRef.current

    // Check if config actually changed
    if (
      JSON.stringify(prevConfig.series) === JSON.stringify(newConfig.series) &&
      prevConfig.maxDataPoints === newConfig.maxDataPoints
    ) {
      return prevConfig // Return same reference if unchanged
    }

    configRef.current = newConfig
    return newConfig
  }, [panel.config])

  // Migrate legacy single-series config to multi-series
  const activeSeries = useMemo(() => {
    if (config.series && config.series.length > 0) {
      return config.series.filter((s) => s.enabled)
    }
    // Legacy support: convert old config to series format
    if (config.topic && config.messagePath) {
      return [
        {
          id: "legacy",
          topic: config.topic,
          messagePath: config.messagePath,
          label: config.messagePath,
          color: config.lineColor || "#3b82f6",
          enabled: true,
        },
      ]
    }
    return []
  }, [config.series, config.topic, config.messagePath, config.lineColor])

  // Get all unique topics from active series
  const activeTopics = useMemo(() => {
    return [...new Set(activeSeries.map((s) => s.topic))]
  }, [activeSeries])

  // Configure worker when panel or series config changes
  useEffect(() => {
    if (activeSeries.length === 0) return

    const workerManager = getPanelWorkerManager()

    workerManager.configurePlotPanel(
      {
        panelId: panel.id,
        series: activeSeries,
        maxDataPoints: config.maxDataPoints || 100,
      },
      (panelId, data, series) => {
        if (panelId === panel.id) {
          setChartData(data)
          setWorkerActiveSeries(series)
        }
      },
      (panelId, error) => {
        console.error(`[LivePlotPanel] Worker error for ${panelId}:`, error)
      }
    )

    workerConfiguredRef.current = true

    return () => {
      // Clean up worker state on unmount
      workerManager.removePlotPanel(panel.id)
      workerConfiguredRef.current = false
    }
  }, [panel.id, activeSeries, config.maxDataPoints])

  // Subscribe to all active topics
  useEffect(() => {
    activeTopics.forEach((topicName) => {
      const topic = topics.find((t) => t.name === topicName)
      if (!topic) return

      const existingSubscriber = subscribers.get(topicName)
      if (!existingSubscriber) {
        try {
          createSubscriber(topicName, topic.type)
        } catch (error) {
          console.error("Failed to subscribe to topic:", error)
        }
      }
    })
  }, [activeTopics, topics, createSubscriber, subscribers])

  // Forward messages to worker when they arrive
  useEffect(() => {
    if (!workerConfiguredRef.current) return

    const workerManager = getPanelWorkerManager()

    // Process messages for each active series
    activeSeries.forEach((series) => {
      const subscriber = subscribers.get(series.topic)
      if (!subscriber || !subscriber.messages || subscriber.messages.length === 0) return

      // Get the latest message
      const latestMessage = subscriber.messages[0]
      if (!latestMessage) return

      // Check if we've already processed this message
      const lastTimestamp = lastMessageTimestampsRef.current.get(series.id) || 0
      if (latestMessage.timestamp <= lastTimestamp) return

      // Update last processed timestamp
      lastMessageTimestampsRef.current.set(series.id, latestMessage.timestamp)

      // Forward to worker for processing
      workerManager.processPlotMessage(
        panel.id,
        series.id,
        latestMessage.data,
        latestMessage.timestamp
      )
    })
  }, [panel.id, activeSeries, subscribers])

  const handleConfigChange = useCallback(
    (newConfig: LivePlotConfig) => {
      // If topics changed significantly, clear worker data
      const oldTopics = activeSeries
        .map((s) => s.topic)
        .sort()
        .join(",")
      const newTopics =
        newConfig.series
          ?.filter((s) => s.enabled)
          .map((s) => s.topic)
          .sort()
          .join(",") || ""

      if (oldTopics !== newTopics) {
        const workerManager = getPanelWorkerManager()
        workerManager.clearPlotData(panel.id)
        lastMessageTimestampsRef.current.clear()
      }

      onUpdatePanel(panel.id, {
        config: newConfig,
      })
    },
    [panel.id, activeSeries, onUpdatePanel]
  )

  const handleStop = useCallback(() => {
    // Clear worker data
    const workerManager = getPanelWorkerManager()
    workerManager.clearPlotData(panel.id)
    lastMessageTimestampsRef.current.clear()

    // Unsubscribe from all active topics to stop receiving data
    activeTopics.forEach((topicName) => {
      try {
        removeSubscriber(topicName)
      } catch (error) {
        console.error("Failed to unsubscribe from topic:", error)
      }
    })
  }, [panel.id, activeTopics, removeSubscriber])

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id)
    }
  }, [onDelete, panel.id])

  // Use worker-provided series or fall back to local
  const displaySeries = workerActiveSeries.length > 0 ? workerActiveSeries : activeSeries

  // Empty state when no configuration
  if (activeSeries.length === 0) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-100 flex gap-2">
          <PlotSettings config={config} onConfigChange={handleConfigChange} />
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
              title="Delete Panel"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Plot Panel
          </div>
          <div className="text-xs text-gray-500">
            Click settings icon to add series to plot
          </div>
        </div>
      </div>
    )
  }

  // Empty state when no data
  if (chartData.length === 0) {
    return (
      <div className="relative h-full w-full group">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all"
            title="Stop Plot"
          >
            <StopCircle className="h-4 w-4 text-gray-600" />
          </button>
          <PlotSettings config={config} onConfigChange={handleConfigChange} />
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
              title="Delete Panel"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Waiting for data...
          </div>
          <div className="text-xs text-gray-500">
            {displaySeries.map((s) => (
              <div key={s.id}>
                {s.label}: {s.topic} {s.messagePath}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={handleStop}
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white border border-gray-200 transition-all"
          title="Stop Plot"
        >
          <StopCircle className="h-4 w-4 text-gray-600" />
        </button>
        <PlotSettings config={config} onConfigChange={handleConfigChange} />
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
            title="Delete Panel"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>
      <div className="h-full w-full p-2">
        <PlotChart chartData={chartData} activeSeries={displaySeries} />
      </div>
    </div>
  )
}
