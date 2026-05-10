"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FlaskConical, Microscope, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AccountCard } from "@/components/dashboard/account-card"
import { MonthlySpendingBars } from "@/components/charts/monthly-spending-bars"
import { SpendingDonut } from "@/components/charts/spending-donut"
import { TimelineChart } from "@/components/charts/timeline-chart"
import {
  getAccounts,
  getTransactions,
  getSalaryAllocations,
} from "@/lib/data"
import {
  computeAccountSummary,
  computeAreaSummary,
  getMonthlySpending,
  getSpendingByCategory,
  getStatusLabel,
  getStatusColor,
  TODAY,
} from "@/lib/finance"
import { formatCurrency, formatCompactCurrency, cn } from "@/lib/utils"
import { AREA_COLORS, type AreaName } from "@/lib/constants"
import type { AreaName as AreaNameType, AccountSummary, Transaction } from "@/lib/types"
import { useSettings, isCarryForwardEnabled } from "@/components/layout/settings-provider"
import { format, parseISO, differenceInDays } from "date-fns"

const slugToArea: Record<string, AreaNameType> = {
  "research-lab": "Research Lab",
  "research-core": "Research Core",
}

const areaIcons: Record<string, LucideIcon> = {
  "Research Lab": FlaskConical,
  "Research Core": Microscope,
}

function AccountSummaryTable({
  summaries,
  colors,
}: {
  summaries: AccountSummary[]
  colors: typeof AREA_COLORS[AreaName]
}) {
  const [excludedAccounts, setExcludedAccounts] = useState<Set<string>>(new Set())

  const toggleAccount = (id: string) => {
    setExcludedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const includedSummaries = summaries.filter(
    (s) => !excludedAccounts.has(s.account.id)
  )

  const totals = {
    totalBudget: includedSummaries.reduce((s, a) => s + a.account.totalBudget, 0),
    totalSpent: includedSummaries.reduce((s, a) => s + a.totalSpent, 0),
    encumbered: includedSummaries.reduce(
      (s, a) => s + a.salaryEncumbrance + a.fringeEncumbrance,
      0
    ),
    availableToSpend: includedSummaries.reduce(
      (s, a) => s + a.effectiveUnencumberedBalance,
      0
    ),
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Account Summary</CardTitle>
          {excludedAccounts.size > 0 && (
            <button
              onClick={() => setExcludedAccounts(new Set())}
              className="text-xs text-primary hover:underline"
            >
              Show all
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Click account names to include/exclude from totals.
          {summaries.some((s) =>
            summaries.some(
              (s2) =>
                s2.account.id !== s.account.id &&
                s2.account.periodEnd !== s.account.periodEnd
            )
          ) && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400">
              Note: Accounts have different end dates, so aggregated totals span different time periods.
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Account</th>
                <th className="pb-2 pr-4 text-right font-medium">Total Budget</th>
                <th className="pb-2 pr-4 text-right font-medium">Spent</th>
                <th className="pb-2 pr-4 text-right font-medium">
                  <span className="hidden sm:inline">Future </span>Encumbrances
                </th>
                <th className="pb-2 pr-4 text-right font-medium">Available to Spend</th>
                <th className="pb-2 text-right font-medium">Period Ends</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const excluded = excludedAccounts.has(s.account.id)
                const encumbered =
                  s.salaryEncumbrance + s.fringeEncumbrance
                return (
                  <tr
                    key={s.account.id}
                    className={cn(
                      "border-b last:border-0 transition-opacity",
                      excluded && "opacity-40"
                    )}
                  >
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggleAccount(s.account.id)}
                        className="flex items-center gap-2 text-left hover:underline"
                      >
                        <div
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: excluded ? "var(--muted)" : getStatusColor(s.status) }}
                        />
                        <span className={cn("text-sm", excluded && "line-through")}>
                          {s.account.name}
                        </span>
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(s.account.totalBudget)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(s.totalSpent)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(encumbered)}
                    </td>
                    <td
                      className={cn(
                        "py-2 pr-4 text-right tabular-nums font-medium",
                        s.effectiveUnencumberedBalance < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {formatCurrency(s.effectiveUnencumberedBalance)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-muted-foreground">
                      {format(parseISO(s.account.periodEnd), "MMM d, yyyy")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2">
                <td className="pt-2 pr-4">
                  {excludedAccounts.size > 0
                    ? `Total (${includedSummaries.length} of ${summaries.length})`
                    : "Total"}
                </td>
                <td className="pt-2 pr-4 text-right tabular-nums">
                  {formatCurrency(totals.totalBudget)}
                </td>
                <td className="pt-2 pr-4 text-right tabular-nums">
                  {formatCurrency(totals.totalSpent)}
                </td>
                <td className="pt-2 pr-4 text-right tabular-nums">
                  {formatCurrency(totals.encumbered)}
                </td>
                <td
                  className={cn(
                    "pt-2 pr-4 text-right tabular-nums",
                    totals.availableToSpend < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatCurrency(totals.availableToSpend)}
                </td>
                <td className="pt-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function RawDataTable({
  transactions,
  accountSummaries,
}: {
  transactions: Transaction[]
  accountSummaries: AccountSummary[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get all months from transactions
  const monthSet = new Set<string>()
  for (const tx of transactions) {
    monthSet.add(format(parseISO(tx.date), "yyyy-MM"))
  }
  const months = Array.from(monthSet).sort()

  // Build data: rows = accounts × categories, columns = months
  const categories = [
    "Salary",
    "Fringe",
    "Supplies",
    "Equipment",
    "Travel",
    "Animal Costs",
    "Other",
  ]

  type RowData = {
    accountName: string
    accountId: string
    category: string
    monthlyAmounts: Record<string, number>
    total: number
  }

  const rows: RowData[] = []
  for (const summary of accountSummaries) {
    const acctTx = transactions.filter(
      (t) => t.accountId === summary.account.id
    )
    for (const cat of categories) {
      const catTx = acctTx.filter((t) => t.category === cat)
      if (catTx.length === 0) continue
      const monthlyAmounts: Record<string, number> = {}
      let total = 0
      for (const tx of catTx) {
        const month = format(parseISO(tx.date), "yyyy-MM")
        monthlyAmounts[month] = (monthlyAmounts[month] || 0) + tx.amount
        total += tx.amount
      }
      rows.push({
        accountName: summary.account.name,
        accountId: summary.account.id,
        category: cat,
        monthlyAmounts,
        total,
      })
    }
  }

  // Group rows by account for subtotals
  const accountGroups = accountSummaries.map((s) => ({
    account: s.account,
    rows: rows.filter((r) => r.accountId === s.account.id),
    total: rows
      .filter((r) => r.accountId === s.account.id)
      .reduce((sum, r) => sum + r.total, 0),
  }))

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <CardTitle className="text-base">Detailed Spending Data</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly breakdown by account and category
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-3 text-left font-medium sticky left-0 bg-card min-w-[140px]">
                    Account / Category
                  </th>
                  {months.map((m) => (
                    <th
                      key={m}
                      className="pb-2 px-2 text-right font-medium whitespace-nowrap"
                    >
                      {format(parseISO(m + "-01"), "MMM yy")}
                    </th>
                  ))}
                  <th className="pb-2 pl-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {accountGroups.map((group) => (
                  <Fragment key={group.account.id}>
                    {/* Account header row */}
                    <tr className="bg-muted/30 font-semibold">
                      <td
                        className="py-1.5 pr-3 sticky left-0 bg-muted/30"
                        colSpan={1}
                      >
                        {group.account.name}
                      </td>
                      {months.map((m) => {
                        const monthTotal = group.rows.reduce(
                          (s, r) => s + (r.monthlyAmounts[m] || 0),
                          0
                        )
                        return (
                          <td
                            key={m}
                            className="py-1.5 px-2 text-right tabular-nums"
                          >
                            {monthTotal > 0
                              ? formatCompactCurrency(monthTotal)
                              : "—"}
                          </td>
                        )
                      })}
                      <td className="py-1.5 pl-3 text-right tabular-nums">
                        {formatCompactCurrency(group.total)}
                      </td>
                    </tr>
                    {/* Category rows */}
                    {group.rows.map((row) => (
                      <tr
                        key={`${row.accountId}-${row.category}`}
                        className="border-b border-muted/50 last:border-0"
                      >
                        <td className="py-1 pr-3 pl-4 text-muted-foreground sticky left-0 bg-card">
                          {row.category}
                        </td>
                        {months.map((m) => (
                          <td
                            key={m}
                            className="py-1 px-2 text-right tabular-nums"
                          >
                            {row.monthlyAmounts[m]
                              ? formatCompactCurrency(row.monthlyAmounts[m])
                              : "—"}
                          </td>
                        ))}
                        <td className="py-1 pl-3 text-right tabular-nums font-medium">
                          {formatCompactCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Need Fragment for the raw data table
import { Fragment } from "react"

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { settings } = useSettings()
  const area = slugToArea[slug]

  if (!area) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Area not found</p>
      </div>
    )
  }

  const accounts = getAccounts()
  const transactions = getTransactions()
  const allocations = getSalaryAllocations()

  const areaAccounts = accounts.filter((a) => a.area === area)
  const piOwned = areaAccounts.filter((a) => a.isPiOwned)
  const tracking = areaAccounts.filter((a) => !a.isPiOwned)

  const allAccountSummaries = areaAccounts.map((a) => {
    const cf = a.fundingType === "Federal Grant"
      ? isCarryForwardEnabled(settings, a.id, !!a.nihCarryForward)
      : undefined
    return computeAccountSummary(a, transactions, allocations, cf, settings.riskDollarThreshold)
  })
  const piOwnedSummaries = allAccountSummaries.filter(
    (s) => s.account.isPiOwned
  )
  const trackingSummaries = allAccountSummaries.filter(
    (s) => !s.account.isPiOwned
  )

  const colors = AREA_COLORS[area as AreaName]
  const Icon = areaIcons[area]

  // Transactions for this area (PI-owned only)
  const areaTransactions = transactions.filter((t) =>
    piOwned.some((a) => a.id === t.accountId)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          <Icon className="h-5 w-5" color={colors.primary} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{area}</h1>
          <p className="text-sm text-muted-foreground">
            {piOwned.length} account{piOwned.length !== 1 ? "s" : ""}
            {tracking.length > 0 &&
              ` + ${tracking.length} tracked`}
          </p>
        </div>
      </div>

      {/* Account Summary Table (replaces KPI cards) */}
      <AccountSummaryTable summaries={piOwnedSummaries} colors={colors} />

      {/* Account Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Accounts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {piOwnedSummaries.map((s) => (
            <AccountCard key={s.account.id} summary={s} />
          ))}
        </div>
      </div>

      {/* Tracking Only accounts */}
      {trackingSummaries.length > 0 && (
        <div>
          <h2 className="mb-1 text-lg font-semibold text-muted-foreground">
            Tracked Accounts
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Not your funds — monitoring only
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trackingSummaries.map((s) => (
              <AccountCard key={s.account.id} summary={s} />
            ))}
          </div>
        </div>
      )}

      {/* Spending by Category - filterable by account */}
      <SpendingByCategorySection
        transactions={areaTransactions}
        accountSummaries={piOwnedSummaries}
        colors={colors}
      />

      {/* Budget Period Timeline */}
      {piOwnedSummaries.length > 1 && (
        <TimelineChart accounts={piOwnedSummaries} detailed areaColors={colors} />
      )}

      {/* Raw Data Table */}
      <RawDataTable
        transactions={areaTransactions}
        accountSummaries={piOwnedSummaries}
      />
    </div>
  )
}

function SpendingByCategorySection({
  transactions,
  accountSummaries,
  colors,
}: {
  transactions: Transaction[]
  accountSummaries: AccountSummary[]
  colors: typeof AREA_COLORS[AreaName]
}) {
  const [selectedAccount, setSelectedAccount] = useState<string>("all")

  const filteredTransactions =
    selectedAccount === "all"
      ? transactions
      : transactions.filter((t) => t.accountId === selectedAccount)

  const monthlyData = getMonthlySpending(filteredTransactions)
  const categoryData = getSpendingByCategory(filteredTransactions)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">
              Monthly Spending by Category
            </CardTitle>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            >
              <option value="all">All Accounts</option>
              {accountSummaries.map((s) => (
                <option key={s.account.id} value={s.account.id}>
                  {s.account.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlySpendingBars data={monthlyData} height={350} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by Category</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedAccount === "all"
              ? "All PI-owned accounts"
              : accountSummaries.find((s) => s.account.id === selectedAccount)
                  ?.account.name}
          </p>
        </CardHeader>
        <CardContent>
          <SpendingDonut data={categoryData} height={350} />
        </CardContent>
      </Card>
    </div>
  )
}
