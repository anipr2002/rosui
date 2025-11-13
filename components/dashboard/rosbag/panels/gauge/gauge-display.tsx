'use client'

import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { GaugePanelConfig } from '@/store/panels-store'

interface GaugeDisplayProps {
  value: number | null
  config: GaugePanelConfig
}

// Color preset definitions
const COLOR_PRESETS = {
  'red-to-green': ['#ef4444', '#fbbf24', '#22c55e'],
  'rainbow': ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6'],
  'turbo': ['#30123b', '#4777ef', '#1ac7c2', '#a2fc3c', '#fb9b06', '#7a0403']
}

export function GaugeDisplay({ value, config }: GaugeDisplayProps) {
  const { min, max, colorMode, colorMap, customGradient, reverseColors, reverseDirection } = config

  // Clamp value to min/max range
  const clampedValue = value !== null ? Math.max(min, Math.min(max, value)) : min

  // Calculate percentage and angle for the needle
  const percentage = value !== null ? ((clampedValue - min) / (max - min)) * 100 : 0
  
  // Calculate needle angle (180 degrees for semi-circle)
  // If reverseDirection, flip the angle
  const needleAngle = reverseDirection
    ? 180 - (percentage / 100) * 180
    : (percentage / 100) * 180

  // Get colors for the gauge
  const colors = useMemo(() => {
    let baseColors: string[]
    
    if (colorMode === 'preset') {
      baseColors = COLOR_PRESETS[colorMap]
    } else {
      baseColors = [customGradient.start, customGradient.end]
    }
    
    return reverseColors ? [...baseColors].reverse() : baseColors
  }, [colorMode, colorMap, customGradient, reverseColors])

  // Create segments for the gauge
  const segments = useMemo(() => {
    const numSegments = colors.length
    return colors.map((color, index) => ({
      value: 100 / numSegments,
      color
    }))
  }, [colors])

  // Needle data - invisible pie slice to position the needle
  const needleData = [{ value: 1 }]

  // Calculate needle position
  const cx = 200
  const cy = 200
  const iR = 100
  const oR = 170
  const needleLength = oR - 10

  // Convert angle to radians (adjusted for SVG coordinate system)
  const angleInRadians = reverseDirection
    ? ((180 - needleAngle) * Math.PI) / 180
    : ((180 - needleAngle) * Math.PI) / 180
  
  const needleX = cx + needleLength * Math.cos(angleInRadians)
  const needleY = cy - needleLength * Math.sin(angleInRadians)

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={segments}
              cx={cx}
              cy={cy}
              startAngle={reverseDirection ? 0 : 180}
              endAngle={reverseDirection ? 180 : 0}
              innerRadius={iR}
              outerRadius={oR}
              paddingAngle={0}
              dataKey="value"
            >
              {segments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* Needle */}
            <g>
              {/* Needle line */}
              <line
                x1={cx}
                y1={cy}
                x2={needleX}
                y2={needleY}
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Needle center circle */}
              <circle cx={cx} cy={cy} r="8" fill="#1f2937" />
              <circle cx={cx} cy={cy} r="5" fill="#fff" />
            </g>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Value display */}
      <div className="mt-4 text-center">
        <div className="text-4xl font-bold text-gray-900">
          {value !== null ? value.toFixed(2) : '---'}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Range: {min} to {max}
        </div>
      </div>

      {/* No data indicator */}
      {value === null && (
        <div className="mt-2 text-xs text-amber-600">
          No data at current time
        </div>
      )}
    </div>
  )
}

