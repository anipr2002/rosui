"use client";

import React, { useMemo, useCallback } from "react";
import { usePanelsStore, type PlotPanelConfig } from "@/store/panels-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeriesConfigComponent } from "./series-config";
import { Plus, TrendingUp, Settings, Eye, Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { parseNumericPath } from "@/lib/rosbag/message-path-parser";
import { timestampToSeconds } from "@/lib/rosbag/mcap-reader";

interface PlotPanelProps {
  panelConfig: PlotPanelConfig;
}

export function PlotPanel({ panelConfig }: PlotPanelProps) {
  const {
    metadata,
    currentTime,
    getMessagesForTopic,
    getDeserializedMessage,
    addSeries,
    removePanel,
  } = usePanelsStore();

  // Prepare chart data for entire duration
  const chartData = useMemo(() => {
    if (!metadata) return [];

    const dataPoints = new Map<number, any>();

    // Process each enabled series
    for (const series of panelConfig.series) {
      if (!series.enabled || !series.topic || !series.messagePath) continue;

      // Get all messages for this series (no time filtering)
      const messages = getMessagesForTopic(series.topic);

      for (const message of messages) {
        const deserializedMsg = getDeserializedMessage(message);
        const value = parseNumericPath(deserializedMsg, series.messagePath);

        if (value !== null) {
          const timeSeconds = timestampToSeconds(
            message.logTime - metadata.startTime
          );
          const timestamp = Math.floor(timeSeconds * 1000) / 1000; // Round to ms

          if (!dataPoints.has(timestamp)) {
            dataPoints.set(timestamp, { time: timestamp });
          }

          dataPoints.get(timestamp)![series.id] = value;
        }
      }
    }

    // Convert to array and sort by time
    return Array.from(dataPoints.values()).sort((a, b) => a.time - b.time);
  }, [
    metadata,
    panelConfig.series,
    getMessagesForTopic,
    getDeserializedMessage,
  ]);

  // Calculate current time position in seconds for the indicator line
  const currentTimeSeconds = metadata
    ? timestampToSeconds(currentTime - metadata.startTime)
    : 0;

  // Filter chart data to show only points up to current time for progressive drawing
  const visibleChartData = useMemo(() => {
    return chartData.filter((point) => point.time <= currentTimeSeconds);
  }, [chartData, currentTimeSeconds]);

  const handleAddSeries = useCallback(() => {
    const defaultTopic = metadata?.topics[0]?.name || "";
    addSeries(panelConfig.id, {
      topic: defaultTopic,
      messagePath: ".data",
      label: `Series ${panelConfig.series.length + 1}`,
      color: getRandomColor(),
      enabled: true,
    });
  }, [panelConfig.id, panelConfig.series.length, metadata, addSeries]);

  const handleRemovePanel = useCallback(() => {
    removePanel(panelConfig.id);
  }, [panelConfig.id, removePanel]);

  if (!metadata) return null;

  return (
    <Card className="shadow-none pt-0 rounded-xl border border-purple-300">
      <CardHeader className="bg-purple-50 border-purple-300 border-b rounded-t-xl pt-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-start">
          <TrendingUp className="h-5 w-5 mt-0.5 text-purple-600" />
          <div className="min-w-0">
            <CardTitle className="text-base text-purple-900">
              Plot Panel
            </CardTitle>
          </div>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs">
            {panelConfig.series.filter((s) => s.enabled).length} Series
          </Badge>
          <Button
            onClick={handleRemovePanel}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 h-7 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chart" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-0">
            <div className="space-y-4">
              {panelConfig.series.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    No Series Added
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a series to start visualizing data
                  </p>
                  <Button
                    onClick={handleAddSeries}
                    className="bg-purple-500 hover:bg-purple-600 text-white border-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Series
                  </Button>
                </div>
              ) : (
                <>
                  {chartData.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        No Data in Time Window
                      </h3>
                      <p className="text-sm text-gray-500">
                        Adjust the time window or check your series
                        configuration
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visibleChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="time"
                            label={{
                              value: panelConfig.xAxisLabel,
                              position: "insideBottom",
                              offset: -5,
                            }}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.toFixed(2)}
                            domain={["dataMin", "dataMax"]}
                          />
                          <YAxis
                            label={{
                              value: panelConfig.yAxisLabel,
                              angle: -90,
                              position: "insideLeft",
                            }}
                            tick={{ fontSize: 12 }}
                            domain={
                              panelConfig.yMin !== undefined &&
                              panelConfig.yMax !== undefined
                                ? [panelConfig.yMin, panelConfig.yMax]
                                : ["auto", "auto"]
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: any) => [value.toFixed(4), ""]}
                            labelFormatter={(value) =>
                              `Time: ${value.toFixed(2)}s`
                            }
                          />
                          {panelConfig.showLegend && (
                            <Legend
                              wrapperStyle={{ fontSize: "12px" }}
                              formatter={(value) => {
                                const series = panelConfig.series.find(
                                  (s) => s.id === value
                                );
                                return series?.label || value;
                              }}
                            />
                          )}
                          <ReferenceLine
                            x={currentTimeSeconds}
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            label={{
                              value: "Current",
                              position: "top",
                              fill: "#ef4444",
                              fontSize: 10,
                            }}
                          />
                          {panelConfig.series
                            .filter((s) => s.enabled)
                            .map((series) => (
                              <Line
                                key={series.id}
                                type="monotone"
                                dataKey={series.id}
                                stroke={series.color}
                                strokeWidth={2}
                                dot={false}
                                name={series.label}
                                connectNulls
                                isAnimationActive={false}
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Add Series Button - visible when there's already data */}
                  <Button
                    onClick={handleAddSeries}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white border-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Series
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="space-y-4">
              {/* Series List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Series
                  </h4>
                  <Button
                    onClick={handleAddSeries}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white border-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Series
                  </Button>
                </div>

                {panelConfig.series.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      No series configured. Click &quot;Add Series&quot; to get
                      started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {panelConfig.series.map((series) => (
                      <SeriesConfigComponent
                        key={series.id}
                        panelId={panelConfig.id}
                        series={series}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to generate random Tailwind-50 colors
function getRandomColor(): string {
  const colors = [
    "#fef2f2", // red-50
    "#fffbeb", // amber-50
    "#f7fee7", // lime-50
    "#ecfdf5", // emerald-50
    "#ecfeff", // cyan-50
    "#eff6ff", // blue-50
    "#eef2ff", // indigo-50
    "#faf5ff", // purple-50
    "#fdf2f8", // pink-50
    "#fff1f2", // rose-50
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
