"use client"

import { cn } from "@/lib/utils"
import { formatCompactCurrency } from "@/lib/utils"
import type { AccountSummary } from "@/lib/types"
import { AREA_COLORS, type AreaName } from "@/lib/constants"
import { getStatusColor, TODAY } from "@/lib/finance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO, differenceInDays } from "date-fns"

interface TimelineChartProps {
  accounts: AccountSummary[]
  detailed?: boolean
  areaColors?: typeof AREA_COLORS[AreaName]
}

export function TimelineChart({ accounts, detailed = false, areaColors }: TimelineChartProps) {
  // Fixed 12-month window centered on today
  const windowStart = new Date(TODAY)
  windowStart.setMonth(windowStart.getMonth() - 6)
  const windowEnd = new Date(TODAY)
  windowEnd.setMonth(windowEnd.getMonth() + 6)
  const totalRange = differenceInDays(windowEnd, windowStart)

  // Today is at center (50%) of the window
  const todayPct = (differenceInDays(TODAY, windowStart) / totalRange) * 100

  // Generate month markers
  const monthMarkers: { date: Date; pct: number }[] = []
  const cursor = new Date(windowStart)
  cursor.setDate(1)
  cursor.setMonth(cursor.getMonth() + 1)
  while (cursor < windowEnd) {
    const pct = (differenceInDays(cursor, windowStart) / totalRange) * 100
    monthMarkers.push({ date: new Date(cursor), pct })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const piOwned = accounts.filter((a) => a.account.isPiOwned)
  const labelWidth = detailed ? "200px" : "7.5rem"

  const content = (
    <div className="relative">
      <div className="space-y-2">
        {/* Date axis with month markers */}
        <div className="relative h-5 text-[10px] text-muted-foreground" style={{ marginLeft: labelWidth }}>
          {monthMarkers.map((m, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2"
              style={{ left: `${m.pct}%` }}
            >
              {format(m.date, "MMM")}
            </span>
          ))}
        </div>

        {/* Account bars */}
        <div className={cn("space-y-1.5", detailed && "space-y-3")}>
          {piOwned.map((a) => {
            const start = parseISO(a.account.periodStart)
            const end = parseISO(a.account.periodEnd)
            const clippedStart = new Date(Math.max(start.getTime(), windowStart.getTime()))
            const clippedEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()))
            if (clippedStart >= clippedEnd) return null

            const leftPct = (differenceInDays(clippedStart, windowStart) / totalRange) * 100
            const widthPct = (differenceInDays(clippedEnd, clippedStart) / totalRange) * 100
            const colors = areaColors || AREA_COLORS[a.account.area as AreaName]

            // New approach: absolute window positions
            // Time-elapsed portion ends at Today (or period end if earlier)
            const elapsedEndPct = Math.min(todayPct, leftPct + widthPct)
            const elapsedWidth = Math.max(0, elapsedEndPct - leftPct)

            // Spending bar = elapsed width * pace ratio (how fast spending vs time)
            // paceRatio > 1 = overspending, < 1 = underspending
            const targetFraction = a.carryForwardAmount
              ? (a.account.totalBudget - a.carryForwardAmount) / a.account.totalBudget
              : 1
            const paceRatio = a.percentTimeElapsed > 0
              ? (a.percentSpent / targetFraction) / a.percentTimeElapsed
              : 0
            const spentWidth = Math.min(widthPct, elapsedWidth * paceRatio)

            const overUnder =
              a.monthsRemaining > 0 ? a.effectiveUnencumberedBalance : 0

            return (
              <div key={a.account.id} className="flex items-center gap-2">
                {detailed ? (
                  <div className="w-[190px] flex-shrink-0 text-right">
                    <span className="text-[11px] font-medium block truncate">
                      {a.account.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {formatCompactCurrency(a.burnRate)}/mo
                      {" · "}
                      <span
                        className={cn(
                          overUnder < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {overUnder >= 0 ? "+" : ""}
                        {formatCompactCurrency(overUnder)} avail
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="w-28 truncate text-[11px] text-right flex-shrink-0">
                    {a.account.name}
                  </span>
                )}
                <div className={cn("relative flex-1 rounded bg-muted/50", detailed ? "h-6" : "h-5")}>
                  {/* Full period background (12% opacity) */}
                  <div
                    className="absolute h-full rounded transition-all"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: colors.primary,
                      opacity: 0.12,
                    }}
                  />
                  {/* Spending pace bar (status-colored) */}
                  <div
                    className="absolute h-full rounded-l transition-all"
                    style={{
                      left: `${leftPct}%`,
                      width: `${spentWidth}%`,
                      backgroundColor: detailed ? getStatusColor(a.status) : colors.primary,
                      opacity: detailed ? 0.7 : 0.8,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today line */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          left: `calc(${labelWidth} + 0.5rem + (100% - ${labelWidth} - 0.5rem) * ${todayPct / 100})`,
          height: "100%",
        }}
      >
        <div
          className="h-full border-l-[3px] border-dashed"
          style={{ borderLeftColor: "var(--foreground)" }}
        />
        <span
          className="absolute -top-4 left-1.5 text-[9px] font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Today
        </span>
      </div>
    </div>
  )

  if (detailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Period Timeline</CardTitle>
          <p className="text-xs text-muted-foreground">
            12-month view centered on today. Filled bar = spending pace.
            Past the dashed line = overspending vs. time elapsed.
          </p>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}
