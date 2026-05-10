"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts"
import { formatCurrency, formatCompactCurrency } from "@/lib/utils"
import type { PersonSummary } from "@/lib/types"

// Distinct colors for accounts
const ACCOUNT_COLORS = [
  "#6366F1", "#14B8A6", "#F59E0B", "#EC4899", "#3B82F6",
  "#10B981", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316",
]

interface SalaryBarsProps {
  personnel: PersonSummary[]
  height?: number
}

export function SalaryBars({ personnel, height = 400 }: SalaryBarsProps) {
  // Collect all unique account names
  const allAccounts = Array.from(
    new Set(
      personnel.flatMap((p) => p.allocations.map((a) => a.account.name))
    )
  )

  const data = personnel.map((ps) => {
    const row: Record<string, string | number> = {
      name:
        ps.person.name.length > 18
          ? ps.person.name.substring(0, 16) + "..."
          : ps.person.name,
      fullName: ps.person.name,
    }
    for (const alloc of ps.allocations) {
      row[alloc.account.name] = Math.round(alloc.annualAmount)
    }
    return row
  })

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barSize={20}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={130}
            tick={{ fontSize: 11, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
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
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.fullName) {
                return payload[0].payload.fullName
              }
              return ""
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value) => (
              <span style={{ color: "var(--foreground)", fontSize: 10 }}>
                {value.length > 22 ? value.substring(0, 20) + "..." : value}
              </span>
            )}
          />
          {allAccounts.map((acct, i) => (
            <Bar
              key={acct}
              dataKey={acct}
              stackId="stack"
              fill={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
