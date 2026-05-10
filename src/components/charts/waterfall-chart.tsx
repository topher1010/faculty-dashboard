"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import { formatCurrency, formatCompactCurrency } from "@/lib/utils"
import { AREA_COLORS, type AreaName } from "@/lib/constants"

interface WaterfallChartProps {
  data: { name: string; amount: number; area: string }[]
  height?: number
}

export function WaterfallChart({ data, height = 300 }: WaterfallChartProps) {
  // Build waterfall segments
  let cumulative = 0
  const chartData = data.map((d) => {
    const start = cumulative
    cumulative += d.amount
    return {
      name: d.name.length > 15 ? d.name.substring(0, 13) + "..." : d.name,
      fullName: d.name,
      invisible: start,
      value: d.amount,
      total: cumulative,
      area: d.area,
    }
  })

  // Add total bar
  chartData.push({
    name: "Total",
    fullName: "Total Salary",
    invisible: 0,
    value: cumulative,
    total: cumulative,
    area: "total",
  })

  const getColor = (area: string) => {
    if (area === "total") return "#3B82F6"
    return AREA_COLORS[area as AreaName]?.primary || "#6B7280"
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={(v) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === "invisible") return ["", ""]
              return [formatCurrency(value), "Amount"]
            }}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(_, payload) => {
              if (payload?.[1]?.payload?.fullName) {
                return payload[1].payload.fullName
              }
              return ""
            }}
          />
          <Bar dataKey="invisible" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.area)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
