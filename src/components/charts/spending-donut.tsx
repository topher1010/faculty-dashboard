"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/constants"

interface SpendingDonutProps {
  data: { category: string; amount: number }[]
  height?: number
}

export function SpendingDonut({ data, height = 280 }: SpendingDonutProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={CATEGORY_COLORS[entry.category] || "#6B7280"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [
              `${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "var(--foreground)", fontSize: 11 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
