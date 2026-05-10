"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SpendingDonut } from "@/components/charts/spending-donut"
import {
  getAccounts,
  getSalaryAllocations,
  getPersonnel,
} from "@/lib/data"
import { computePersonSummary, isRenewalSafe } from "@/lib/finance"
import { formatCurrency, formatPercent, cn } from "@/lib/utils"
import { FRINGE_RATE, AREA_COLORS, type AreaName } from "@/lib/constants"
import { format, parseISO, differenceInDays } from "date-fns"
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import type { AreaName as AreaNameType } from "@/lib/types"

// Distinct colors for accounts in charts - more than CATEGORY_COLORS provides
const ACCOUNT_CHART_COLORS = [
  "#6366F1", "#14B8A6", "#F59E0B", "#EC4899", "#3B82F6",
  "#10B981", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316",
]

export default function PersonnelPage() {
  const accounts = getAccounts()
  const allocations = getSalaryAllocations()
  const personnel = getPersonnel()

  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)
  const [areaFilter, setAreaFilter] = useState<AreaNameType | "All">("All")

  const personSummaries = personnel.map((p) =>
    computePersonSummary(p, accounts, allocations)
  )

  const filteredSummaries =
    areaFilter === "All"
      ? personSummaries
      : personSummaries.filter((ps) => ps.person.area === areaFilter)

  const areas: (AreaNameType | "All")[] = [
    "All",
    "Research Lab",
    "Research Core",
  ]

  // Build a stable color map for account names across all charts
  const allAccountNames = Array.from(
    new Set(
      personSummaries.flatMap((ps) =>
        ps.allocations.map((a) => a.account.name)
      )
    )
  )
  const accountColorMap: Record<string, string> = {}
  allAccountNames.forEach((name, i) => {
    accountColorMap[name] = ACCOUNT_CHART_COLORS[i % ACCOUNT_CHART_COLORS.length]
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personnel</h1>
        <p className="text-sm text-muted-foreground">
          How everyone is funded across accounts
        </p>
      </div>

      {/* Area Filter */}
      <div className="flex flex-wrap gap-2">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setAreaFilter(area)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              areaFilter === area
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Salary Distribution Bars - Percentage-based */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Salary Distribution by Account
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Percentage of each person{"'"}s salary from each funding source.
            Hover for dollar amounts.
          </p>
        </CardHeader>
        <CardContent>
          <SalaryPercentageBars
            personnel={filteredSummaries}
            accountColorMap={accountColorMap}
            allAccountNames={allAccountNames}
          />
        </CardContent>
      </Card>

      {/* Individual Person Details */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Individual Details</h2>
        <div className="space-y-2">
          {filteredSummaries.map((ps) => {
            const isExpanded = expandedPerson === ps.person.id
            const areaColors =
              AREA_COLORS[ps.person.area as AreaName]

            // Check for funding ending soon (within 6 months), excluding renewal-safe
            const today = new Date("2026-02-28")
            const endingSoon = ps.fundingEndDates.filter((f) => {
              const days = differenceInDays(parseISO(f.endDate), today)
              if (days <= 0 || days >= 180) return false
              const acct = accounts.find((a) => a.id === f.accountId)
              return acct ? !isRenewalSafe(acct) : true
            })

            // Only show warning if SOME (not all) funding sources are ending soon
            // If all funding ends at the same time, that's normal grant lifecycle
            const totalFunding = ps.fundingEndDates.length
            const showWarning =
              endingSoon.length > 0 && endingSoon.length < totalFunding

            return (
              <div
                key={ps.person.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedPerson(isExpanded ? null : ps.person.id)
                  }
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: areaColors.primary }}
                    >
                      {ps.person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ps.person.name}</span>
                        {showWarning && (
                          <span className="inline-flex items-center gap-0.5 text-amber-500 text-[10px] font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {endingSoon.length} funding ending soon
                            </span>
                            <span className="sm:hidden">Ending soon</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {ps.person.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-semibold">
                        {formatCurrency(ps.totalAllocated)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        + {formatCurrency(ps.totalAllocated * FRINGE_RATE)}{" "}
                        fringe
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t p-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Salary split donut - using account-specific colors */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Funding Sources
                        </h4>
                        <PersonDonut
                          allocations={ps.allocations}
                          accountColorMap={accountColorMap}
                        />
                      </div>

                      {/* Detail table */}
                      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <h4 className="mb-2 text-sm font-medium">
                          Allocation Detail
                        </h4>
                        <table className="w-full text-xs min-w-[400px]">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="pb-1.5 pr-2 text-left font-medium">
                                Account
                              </th>
                              <th className="pb-1.5 pr-2 text-right font-medium">
                                %
                              </th>
                              <th className="pb-1.5 pr-2 text-right font-medium">
                                Salary
                              </th>
                              <th className="pb-1.5 pr-2 text-right font-medium">
                                Fringe
                              </th>
                              <th className="pb-1.5 text-right font-medium">
                                Ends
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ps.allocations.map((a, i) => {
                              const daysToEnd = differenceInDays(
                                parseISO(a.account.periodEnd),
                                today
                              )
                              return (
                                <tr key={i} className="border-b last:border-0">
                                  <td className="py-1.5 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="h-2 w-2 rounded-full flex-shrink-0"
                                        style={{
                                          backgroundColor:
                                            accountColorMap[a.account.name] ||
                                            "#6B7280",
                                        }}
                                      />
                                      <span className="truncate max-w-[120px]">
                                        {a.account.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1.5 pr-2 text-right tabular-nums">
                                    {a.percent.toFixed(1)}%
                                  </td>
                                  <td className="py-1.5 pr-2 text-right tabular-nums">
                                    {formatCurrency(a.annualAmount)}
                                  </td>
                                  <td className="py-1.5 pr-2 text-right tabular-nums">
                                    {formatCurrency(
                                      a.annualAmount * FRINGE_RATE
                                    )}
                                  </td>
                                  <td
                                    className={cn(
                                      "py-1.5 text-right tabular-nums",
                                      daysToEnd < 180 && !isRenewalSafe(a.account) &&
                                        "text-amber-600 dark:text-amber-400 font-medium"
                                    )}
                                  >
                                    {format(
                                      parseISO(a.account.periodEnd),
                                      "MMM yy"
                                    )}
                                    {daysToEnd < 180 && isRenewalSafe(a.account) ? (
                                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                                        (renews)
                                      </span>
                                    ) : daysToEnd < 180 ? (
                                      <span className="ml-1">
                                        ({daysToEnd}d)
                                      </span>
                                    ) : null}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>

                        {/* Total */}
                        <div className="mt-2 flex justify-between border-t pt-2 text-xs font-semibold">
                          <span>Total annual cost (salary + fringe)</span>
                          <span className="tabular-nums">
                            {formatCurrency(ps.totalWithFringe)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Custom donut chart for individual person using consistent account colors
 */
function PersonDonut({
  allocations,
  accountColorMap,
}: {
  allocations: { account: { name: string }; annualAmount: number; percent: number }[]
  accountColorMap: Record<string, string>
}) {
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = require("recharts")

  const data = allocations.map((a) => ({
    category: a.account.name,
    amount: a.annualAmount,
    percent: a.percent,
  }))

  const total = data.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0)

  return (
    <div style={{ height: 220 }}>
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
            {data.map((entry: { category: string }, index: number) => (
              <Cell
                key={index}
                fill={accountColorMap[entry.category] || "#6B7280"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
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
            formatter={(value: string) => (
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

/**
 * Salary Distribution Bars showing percentages with hover for dollar amounts
 */
function SalaryPercentageBars({
  personnel,
  accountColorMap,
  allAccountNames,
}: {
  personnel: ReturnType<typeof computePersonSummary>[]
  accountColorMap: Record<string, string>
  allAccountNames: string[]
}) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
  } = require("recharts")

  // Collect all unique account names from filtered personnel
  const usedAccounts = Array.from(
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
      totalSalary: ps.totalAllocated,
    }
    for (const alloc of ps.allocations) {
      row[alloc.account.name] = Number(alloc.percent.toFixed(1))
      row[`${alloc.account.name}_amount`] = Math.round(alloc.annualAmount)
    }
    return row
  })

  // Extra height for legend at bottom
  const legendHeight = Math.ceil(usedAccounts.length / 2) * 20 + 10
  const height = Math.max(300, personnel.length * 45 + legendHeight + 60)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 0, bottom: legendHeight }}
          barSize={20}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
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
            formatter={(value: number, name: string, props: { payload: Record<string, number | string> }) => {
              const amount = props.payload[`${name}_amount`]
              return [
                `${value}%${amount ? ` (${formatCurrency(amount as number)})` : ""}`,
                name,
              ]
            }}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(_: string, payload: { payload: Record<string, string> }[]) => {
              if (payload?.[0]?.payload?.fullName) {
                const total = payload[0].payload.totalSalary
                return `${payload[0].payload.fullName} — ${formatCurrency(Number(total))} total`
              }
              return ""
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value: string) => (
              <span style={{ color: "var(--foreground)", fontSize: 10 }}>
                {value.length > 22 ? value.substring(0, 20) + "..." : value}
              </span>
            )}
          />
          {usedAccounts.map((acct) => (
            <Bar
              key={acct}
              dataKey={acct}
              stackId="stack"
              fill={accountColorMap[acct] || "#6B7280"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
