"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { formatCurrency, formatCompactCurrency } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"
import type { MonthlySpending } from "@/lib/types"
import { format, parseISO } from "date-fns"

interface MonthlySpendingBarsProps {
  data: MonthlySpending[]
  categories?: string[]
  height?: number
  stacked?: boolean
}

export function MonthlySpendingBars({
  data,
  categories,
  height = 300,
  stacked = true,
}: MonthlySpendingBarsProps) {
  const cats =
    categories ||
    Array.from(
      new Set(
        data.flatMap((d) =>
          Object.keys(d).filter((k) => k !== "month" && k !== "Total")
        )
      )
    )

  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.month + "-01"), "MMM yy"),
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-45}
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
            formatter={(value: any, name: any) => [
              formatCurrency(value),
              name,
            ]}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(label) => label}
          />
          <Legend
            verticalAlign="top"
            height={30}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "var(--foreground)", fontSize: 11 }}>
                {value}
              </span>
            )}
          />
          {cats.map((cat) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId={stacked ? "stack" : undefined}
              fill={CATEGORY_COLORS[cat] || "#6B7280"}
              radius={stacked ? undefined : [2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
