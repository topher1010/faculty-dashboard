"use client"

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts"
import { formatCurrency, formatCompactCurrency } from "@/lib/utils"
import type { Transaction } from "@/lib/types"
import { format, parseISO, differenceInMonths } from "date-fns"

interface BurnRateChartProps {
  transactions: Transaction[]
  accountId: string
  totalBudget: number
  periodStart: string
  periodEnd: string
  color?: string
  height?: number
  spendingTarget?: number // For carry-forward accounts: budget * 0.75
}

export function BurnRateChart({
  transactions,
  accountId,
  totalBudget,
  periodStart,
  periodEnd,
  color = "#3B82F6",
  height = 300,
  spendingTarget,
}: BurnRateChartProps) {
  const effectiveTarget = spendingTarget ?? totalBudget
  const targetPercent = (effectiveTarget / totalBudget) * 100
  const acctTx = transactions.filter((t) => t.accountId === accountId)
  const pStart = parseISO(periodStart)
  const pEnd = parseISO(periodEnd)
  const today = new Date("2026-02-28")
  const todayMonth = format(today, "yyyy-MM")

  // Build spending by month
  const monthMap: Record<string, number> = {}
  for (const tx of acctTx) {
    const month = format(parseISO(tx.date), "yyyy-MM")
    monthMap[month] = (monthMap[month] || 0) + tx.amount
  }

  // Build all months from period start to end
  const allMonths: string[] = []
  const cursor = new Date(pStart)
  cursor.setDate(1)
  while (cursor <= pEnd) {
    allMonths.push(format(cursor, "yyyy-MM"))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Build data with cumulative spending, trend line, and percentage
  let cumulative = 0

  const data = allMonths.map((month, idx) => {
    const monthSpending = monthMap[month] || 0
    const isFuture = month > todayMonth

    if (!isFuture) {
      cumulative += monthSpending
    }

    // Trend line: linear from 0 to target % of budget over the budget period
    const trendPercent = ((idx + 1) / allMonths.length) * targetPercent

    return {
      month,
      label: format(parseISO(month + "-01"), "MMM yy"),
      actual: isFuture ? undefined : Math.round(cumulative),
      actualPercent: isFuture ? undefined : Math.round((cumulative / totalBudget) * 1000) / 10,
      trendPercent: Math.round(trendPercent * 10) / 10,
      isToday: month === todayMonth,
    }
  })

  // Find the today label for reference line
  const todayLabel = data.find((d) => d.isToday)?.label
  const maxYDollars = Math.max(totalBudget * 1.1, cumulative * 1.1)
  const maxPercent = Math.round((maxYDollars / totalBudget) * 100)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${accountId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          {/* Left Y-axis: Dollar amount */}
          <YAxis
            yAxisId="dollars"
            tickFormatter={(v) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={55}
            domain={[0, maxYDollars]}
          />
          {/* Right Y-axis: Percentage */}
          <YAxis
            yAxisId="percent"
            orientation="right"
            tickFormatter={(v) => `${Math.round(v)}%`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={42}
            domain={[0, maxPercent]}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              if (value == null) return ["-", name ?? ""]
              const v = Number(value)
              if (name === "trendPercent") {
                return [`${v.toFixed(1)}%`, spendingTarget ? "Spending Target Pace" : "Expected Pace"]
              }
              if (name === "actualPercent") {
                return [`${v.toFixed(1)}%`, "Actual %"]
              }
              if (name === "actual") {
                return [formatCurrency(v), "Actual Spending"]
              }
              return [String(value), String(name ?? "")]
            }}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          {/* Today reference line */}
          {todayLabel && (
            <ReferenceLine
              x={todayLabel}
              yAxisId="dollars"
              stroke="#000000"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: "Today",
                position: "top",
                fontSize: 10,
                fontWeight: "bold",
                fill: "#000000",
              }}
            />
          )}
          {/* Budget limit line */}
          <ReferenceLine
            y={totalBudget}
            yAxisId="dollars"
            stroke="#DC2626"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Budget: ${formatCompactCurrency(totalBudget)}`,
              position: "right",
              fontSize: 10,
              fill: "#DC2626",
            }}
          />
          {/* Spending target line for carry-forward accounts */}
          {spendingTarget && (
            <ReferenceLine
              y={effectiveTarget}
              yAxisId="dollars"
              stroke="#059669"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Target: ${formatCompactCurrency(effectiveTarget)}`,
                position: "right",
                fontSize: 10,
                fill: "#059669",
              }}
            />
          )}
          {/* Trend line (expected pace): dotted line from 0% to target */}
          <Line
            yAxisId="percent"
            type="linear"
            dataKey="trendPercent"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeOpacity={0.4}
            dot={false}
            name="trendPercent"
          />
          {/* Actual spending area in color */}
          <Area
            yAxisId="dollars"
            type="monotone"
            dataKey="actual"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${accountId})`}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            connectNulls={false}
            name="actual"
          />
          {/* Actual percentage (invisible line, for tooltip) */}
          <Line
            yAxisId="percent"
            type="monotone"
            dataKey="actualPercent"
            stroke="transparent"
            dot={false}
            name="actualPercent"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
