"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({
  data,
  width = 120,
  height = 30,
  color = "#8b5cf6",
  showDots = false,
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-gray-400"
      >
        No data
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });

  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="2" fill={color} />
        ))}
    </svg>
  );
}

interface DataDistributionProps {
  values: number[];
  width?: number;
  height?: number;
  bins?: number;
}

export function DataDistribution({
  values,
  width = 200,
  height = 60,
  bins = 10,
}: DataDistributionProps) {
  if (values.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-gray-400"
      >
        No data
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binSize = range / bins;

  // Create histogram
  const histogram = new Array(bins).fill(0);
  values.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
    histogram[binIndex]++;
  });

  const maxCount = Math.max(...histogram);
  const barWidth = width / bins;

  return (
    <svg width={width} height={height}>
      {histogram.map((count, index) => {
        const barHeight = (count / maxCount) * height;
        const x = index * barWidth;
        const y = height - barHeight;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth - 1}
            height={barHeight}
            fill="#8b5cf6"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}

interface MiniBarChartProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export function MiniBarChart({
  value,
  max,
  label,
  color = "#8b5cf6",
}: MiniBarChartProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-2 w-full">
      {label && (
        <span className="text-xs text-gray-600 min-w-[60px]">{label}</span>
      )}
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-xs text-gray-600 min-w-[40px] text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  unit,
  color = "purple",
  icon,
}: StatCardProps) {
  const colorClasses = {
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}`}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase font-semibold opacity-70">
          {label}
        </div>
        <div className="text-sm font-bold flex items-baseline gap-1">
          <span>{value}</span>
          {unit && (
            <span className="text-xs font-normal opacity-70">{unit}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
}

export function TrendIndicator({ value, previousValue }: TrendIndicatorProps) {
  if (previousValue === undefined) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const change = value - previousValue;
  const percentChange =
    previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <span
      className={`text-xs font-semibold ${
        isNeutral
          ? "text-gray-500"
          : isPositive
            ? "text-green-600"
            : "text-red-600"
      }`}
    >
      {isNeutral ? "→" : isPositive ? "↑" : "↓"}{" "}
      {Math.abs(percentChange).toFixed(1)}%
    </span>
  );
}
