"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatCurrency, cn } from "@/lib/utils"
import type { AccountSummary } from "@/lib/types"
import { AREA_COLORS, type AreaName } from "@/lib/constants"

interface SpendingPaceProps {
  accounts: AccountSummary[]
}

// Area ordering for grouping
const AREA_ORDER: AreaName[] = ["Research Lab", "Research Core"]

export function SpendingPace({ accounts }: SpendingPaceProps) {
  // Group by area, then sort within each area by pace ratio
  const piOwned = accounts.filter((a) => a.account.isPiOwned)

  const data = AREA_ORDER.flatMap((area) =>
    piOwned
      .filter((a) => a.account.area === area)
      .sort((a, b) => b.paceRatio - a.paceRatio)
      .map((a) => {
        // For carry-forward accounts, expected spending targets 75%, not 100%
        const targetFraction = a.carryForwardAmount
          ? (a.account.totalBudget - a.carryForwardAmount) / a.account.totalBudget
          : 1
        return {
          name:
            a.account.name.length > 20
              ? a.account.name.substring(0, 18) + "..."
              : a.account.name,
          fullName: a.account.name,
          area: a.account.area,
          spent: Math.round(a.percentSpent * 100),
          expected: Math.round(a.percentTimeElapsed * targetFraction * 100),
          paceRatio: a.paceRatio,
          color: AREA_COLORS[a.account.area as AreaName].primary,
        }
      })
  )

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          barSize={16}
        >
          <XAxis
            type="number"
            domain={[0, 120]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={150}
            tick={{ fontSize: 11, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              `${value}%`,
              name === "spent" ? "Actual Spent" : "Expected by Date",
            ]}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(label, payload) => {
              if (payload?.[0]?.payload?.fullName) {
                const p = payload[0].payload
                return `${p.fullName} (${p.area})`
              }
              return label
            }}
          />
          <Bar dataKey="spent" radius={[0, 4, 4, 0]} name="spent">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
          <Bar
            dataKey="expected"
            radius={[0, 4, 4, 0]}
            fill="var(--muted-foreground)"
            fillOpacity={0.4}
            name="expected"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
