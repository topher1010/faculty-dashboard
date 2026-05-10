"use client"

import Link from "next/link"
import {
  FlaskConical,
  Microscope,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SpendingPace } from "@/components/charts/spending-pace"
import { TimelineChart } from "@/components/charts/timeline-chart"
import {
  getAccounts,
  getTransactions,
  getSalaryAllocations,
} from "@/lib/data"
import {
  computeAccountSummary,
  computeAreaSummary,
  getStatusLabel,
} from "@/lib/finance"
import { formatCurrency, formatCompactCurrency, cn } from "@/lib/utils"
import { AREA_COLORS, type AreaName } from "@/lib/constants"
import type { AreaName as AreaNameType } from "@/lib/types"
import { useSettings, isCarryForwardEnabled } from "@/components/layout/settings-provider"

const areaIcons: Record<string, LucideIcon> = {
  "Research Lab": FlaskConical,
  "Research Core": Microscope,
}

const areaSlugs: Record<string, string> = {
  "Research Lab": "research-lab",
  "Research Core": "research-core",
}

export default function OverviewPage() {
  const { settings } = useSettings()
  const accounts = getAccounts()
  const transactions = getTransactions()
  const allocations = getSalaryAllocations()

  const piOwnedAccounts = accounts.filter((a) => a.isPiOwned)
  const allSummaries = piOwnedAccounts.map((a) => {
    const cf = a.fundingType === "Federal Grant"
      ? isCarryForwardEnabled(settings, a.id, !!a.nihCarryForward)
      : undefined
    return computeAccountSummary(a, transactions, allocations, cf, settings.riskDollarThreshold)
  })

  const areas: AreaNameType[] = ["Research Lab", "Research Core"]
  const areaSummaries = areas.map((area) =>
    computeAreaSummary(area, accounts, transactions, allocations, settings)
  )

  // Only show areas that have PI-owned accounts
  const activeAreaSummaries = areaSummaries.filter((as) => as.accountCount > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Budget Overview</h1>
        <p className="text-sm text-muted-foreground">
          As of February 28, 2026
        </p>
      </div>

      {/* Area Summary Cards - only show areas with accounts */}
      <div className={cn(
        "grid grid-cols-1 gap-4",
        activeAreaSummaries.length === 3 && "lg:grid-cols-3",
        activeAreaSummaries.length === 2 && "lg:grid-cols-2",
        activeAreaSummaries.length === 1 && "lg:grid-cols-1 max-w-lg",
      )}>
        {activeAreaSummaries.map((as) => {
          const colors = AREA_COLORS[as.area as AreaName]
          const Icon = areaIcons[as.area]
          return (
            <Link
              key={as.area}
              href={`/area/${areaSlugs[as.area]}`}
              className="group"
            >
              <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-lg p-1.5"
                        style={{ backgroundColor: colors.primary + "15" }}
                      >
                        <Icon
                          className="h-4 w-4"
                          color={colors.primary}
                        />
                      </div>
                      <CardTitle className="text-base">{as.area}</CardTitle>
                    </div>
                    {as.overspendCount === 0 && as.underspendCount === 0 ? (
                      <Badge variant="success">On Track</Badge>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        {as.overspendCount > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {as.overspendCount} overspend risk
                          </Badge>
                        )}
                        {as.underspendCount > 0 && (
                          <Badge variant="warning" className="text-[10px]">
                            {as.underspendCount} underspend risk
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Total Budget
                      </p>
                      <p className="tabular-nums text-sm font-semibold">
                        {formatCompactCurrency(as.totalBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Spent
                      </p>
                      <p className="tabular-nums text-sm font-semibold">
                        {formatCompactCurrency(as.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Available to Spend
                      </p>
                      <p
                        className={cn(
                          "tabular-nums text-sm font-semibold",
                          as.effectiveUnencumberedBalance < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {formatCurrency(as.effectiveUnencumberedBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Accounts
                      </p>
                      <p className="tabular-nums text-sm font-semibold">
                        {as.accountCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Spending Pace + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Spending Pace
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Actual % spent vs expected % by date. Colored bar = actual, gray =
              expected.
            </p>
          </CardHeader>
          <CardContent>
            <SpendingPace accounts={allSummaries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Period Timeline</CardTitle>
            <p className="text-xs text-muted-foreground">
              12-month view centered on today. Filled bar = % budget spent.
            </p>
          </CardHeader>
          <CardContent>
            <TimelineChart accounts={allSummaries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
