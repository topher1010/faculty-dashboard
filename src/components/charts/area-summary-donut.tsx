"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { AreaSummary } from "@/lib/types"
import { AREA_COLORS, type AreaName } from "@/lib/constants"

interface AreaSummaryDonutProps {
  summary: AreaSummary
}

export function AreaSummaryDonut({ summary }: AreaSummaryDonutProps) {
  const colors = AREA_COLORS[summary.area as AreaName]
  const data = [
    { name: "Spent", value: summary.totalSpent },
    { name: "Remaining", value: Math.max(0, summary.rawBalance) },
  ]
  const chartColors = [colors.primary, colors.light + "40"]

  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-20 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={38}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={chartColors[index]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums">
          {formatPercent(summary.totalSpent / summary.totalBudget)}
        </p>
        <p className="text-[10px] text-muted-foreground">of budget used</p>
      </div>
    </div>
  )
}
