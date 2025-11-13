"use client";

import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { Trash2, StopCircle } from "lucide-react";
import { useTopicsStore } from "@/store/topic-store";
import { parseNumericPath } from "@/lib/rosbag/message-path-parser";
import { PlotSettings } from "./plot-settings";
import type { Panel } from "../../core/types";
import type { LivePlotConfig, PlotDataPoint, PlotSeries } from "./types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Memoized chart component to prevent unnecessary re-renders
const PlotChart = React.memo<{
  chartData: PlotDataPoint[];
  activeSeries: PlotSeries[];
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
              const series = activeSeries.find((s) => s.id === name);
              return [value.toFixed(4), series?.label || name];
            }}
            labelFormatter={(value) => `Time: ${value.toFixed(2)}s`}
          />
          {activeSeries.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: "10px" }}
              formatter={(value) => {
                const series = activeSeries.find((s) => s.id === value);
                return series?.label || value;
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
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when data hasn't changed
    if (prevProps.chartData.length !== nextProps.chartData.length) {
      return false;
    }
    if (prevProps.activeSeries.length !== nextProps.activeSeries.length) {
      return false;
    }
    // Compare series configuration
    for (let i = 0; i < prevProps.activeSeries.length; i++) {
      const prevSeries = prevProps.activeSeries[i];
      const nextSeries = nextProps.activeSeries[i];
      if (
        prevSeries.id !== nextSeries.id ||
        prevSeries.color !== nextSeries.color ||
        prevSeries.label !== nextSeries.label
      ) {
        return false;
      }
    }
    // Only re-render if last data point changed (new data arrived)
    if (prevProps.chartData.length > 0 && nextProps.chartData.length > 0) {
      const prevLast = prevProps.chartData[prevProps.chartData.length - 1];
      const nextLast = nextProps.chartData[nextProps.chartData.length - 1];
      return prevLast.timestamp === nextLast.timestamp;
    }
    return true;
  }
);

PlotChart.displayName = "PlotChart";

interface LivePlotPanelProps {
  panel: Panel;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  onDelete?: (id: string) => void;
}

export function LivePlotPanel({
  panel,
  onUpdatePanel,
  onDelete,
}: LivePlotPanelProps) {
  const { topics, subscribers, createSubscriber, removeSubscriber } =
    useTopicsStore();

  // Use stable config reference to prevent unnecessary recalculations
  const configRef = useRef<LivePlotConfig>(
    (panel.config as LivePlotConfig) || {}
  );

  // Only update config ref if it actually changed (deep comparison for series)
  const config = useMemo<LivePlotConfig>(() => {
    const newConfig = (panel.config as LivePlotConfig) || {};
    const prevConfig = configRef.current;

    // Check if config actually changed
    if (
      JSON.stringify(prevConfig.series) === JSON.stringify(newConfig.series) &&
      prevConfig.maxDataPoints === newConfig.maxDataPoints
    ) {
      return prevConfig; // Return same reference if unchanged
    }

    configRef.current = newConfig;
    return newConfig;
  }, [panel.config]);

  const startTimeRef = useRef<number | null>(null);

  // Migrate legacy single-series config to multi-series
  const activeSeries = useMemo(() => {
    if (config.series && config.series.length > 0) {
      return config.series.filter((s) => s.enabled);
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
      ];
    }
    return [];
  }, [config.series, config.topic, config.messagePath, config.lineColor]);

  // Get all unique topics from active series
  const activeTopics = useMemo(() => {
    return [...new Set(activeSeries.map((s) => s.topic))];
  }, [activeSeries]);

  // Subscribe to all active topics
  // Note: Primary subscription management is now handled by usePageSubscriptions hook
  // This effect ensures subscriptions exist for panels on the active page
  useEffect(() => {
    activeTopics.forEach((topicName) => {
      const topic = topics.find((t) => t.name === topicName);
      if (!topic) return;

      const existingSubscriber = subscribers.get(topicName);
      if (!existingSubscriber) {
        try {
          createSubscriber(topicName, topic.type);
        } catch (error) {
          console.error("Failed to subscribe to topic:", error);
        }
      }
    });

    // Cleanup: don't unsubscribe here - managed by usePageSubscriptions hook
    // This prevents race conditions when switching pages
  }, [activeTopics, topics, createSubscriber, subscribers]);

  // Track subscriber message counts to optimize re-renders
  const subscriberMessageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSeries.forEach((series) => {
      const subscriber = subscribers.get(series.topic);
      counts[series.topic] = subscriber?.messages.length || 0;
    });
    return counts;
  }, [activeSeries, subscribers]);

  // Process messages into chart data for multiple series
  const chartData = useMemo(() => {
    if (activeSeries.length === 0) {
      return [];
    }

    const maxPoints = config.maxDataPoints || 100;
    const timestampMap = new Map<number, PlotDataPoint>();

    // Process each series
    activeSeries.forEach((series) => {
      const subscriber = subscribers.get(series.topic);
      if (
        !subscriber ||
        !subscriber.messages ||
        subscriber.messages.length === 0
      ) {
        return;
      }

      // Process messages (they're already in reverse chronological order)
      const messagesToProcess = subscriber.messages
        .slice(0, maxPoints)
        .reverse();

      for (const messageRecord of messagesToProcess) {
        try {
          const value = parseNumericPath(
            messageRecord.data,
            series.messagePath
          );

          if (value !== null) {
            // Initialize start time on first valid value
            if (startTimeRef.current === null) {
              startTimeRef.current = messageRecord.timestamp;
            }

            // Calculate relative timestamp in seconds
            const relativeTime =
              (messageRecord.timestamp - startTimeRef.current) / 1000;

            // Get or create data point for this timestamp
            if (!timestampMap.has(messageRecord.timestamp)) {
              timestampMap.set(messageRecord.timestamp, {
                timestamp: relativeTime,
              });
            }

            const dataPoint = timestampMap.get(messageRecord.timestamp)!;
            dataPoint[series.id] = value;
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    });

    // Convert map to sorted array and filter to only include active series
    const activeSeriesIds = new Set(activeSeries.map((s) => s.id));
    return Array.from(timestampMap.values())
      .map((dataPoint) => {
        // Only keep timestamp and data for active series
        const filteredPoint: PlotDataPoint = { timestamp: dataPoint.timestamp };
        Object.keys(dataPoint).forEach((key) => {
          if (key === "timestamp" || activeSeriesIds.has(key)) {
            filteredPoint[key] = dataPoint[key];
          }
        });
        return filteredPoint;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [activeSeries, config.maxDataPoints, subscriberMessageCounts]);

  const handleConfigChange = useCallback(
    (newConfig: LivePlotConfig) => {
      // If topics changed significantly, reset start time
      const oldTopics = activeSeries
        .map((s) => s.topic)
        .sort()
        .join(",");
      const newTopics =
        newConfig.series
          ?.filter((s) => s.enabled)
          .map((s) => s.topic)
          .sort()
          .join(",") || "";

      if (oldTopics !== newTopics) {
        startTimeRef.current = null;
      }

      onUpdatePanel(panel.id, {
        config: newConfig,
      });
    },
    [panel.id, activeSeries, onUpdatePanel]
  );

  const handleStop = useCallback(() => {
    // Reset the start time to clear the plot data
    startTimeRef.current = null;

    // Unsubscribe from all active topics to stop receiving data
    activeTopics.forEach((topicName) => {
      try {
        removeSubscriber(topicName);
      } catch (error) {
        console.error("Failed to unsubscribe from topic:", error);
      }
    });
  }, [activeTopics, removeSubscriber]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(panel.id);
    }
  }, [onDelete, panel.id]);

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
    );
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
            {activeSeries.map((s) => (
              <div key={s.id}>
                {s.label}: {s.topic} {s.messagePath}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
        <PlotChart chartData={chartData} activeSeries={activeSeries} />
      </div>
    </div>
  );
}
