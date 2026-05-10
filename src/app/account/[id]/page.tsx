"use client"

import { use, useState, Fragment } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BurnRateChart } from "@/components/charts/burn-rate-chart"
import { SpendingDonut } from "@/components/charts/spending-donut"
import { MonthlySpendingBars } from "@/components/charts/monthly-spending-bars"
import {
  getAccounts,
  getTransactions,
  getSalaryAllocations,
  getPersonnel,
} from "@/lib/data"
import {
  computeAccountSummary,
  getSpendingByCategory,
  getMonthlySpending,
  getStatusLabel,
} from "@/lib/finance"
import { formatCurrency, formatCompactCurrency, formatPercent, cn } from "@/lib/utils"
import { AREA_COLORS, FRINGE_RATE, type AreaName } from "@/lib/constants"
import { useSettings, isCarryForwardEnabled } from "@/components/layout/settings-provider"
import type { Transaction } from "@/lib/types"
import { format, parseISO } from "date-fns"

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const accounts = getAccounts()
  const transactions = getTransactions()
  const allocations = getSalaryAllocations()
  const personnel = getPersonnel()

  const account = accounts.find((a) => a.id === id)
  if (!account) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Account not found</p>
      </div>
    )
  }

  const { settings } = useSettings()
  const isFederalGrant = account.fundingType === "Federal Grant"
  const carryForward = isFederalGrant
    ? isCarryForwardEnabled(settings, account.id, !!account.nihCarryForward)
    : undefined

  const summary = computeAccountSummary(
    account,
    transactions,
    allocations,
    carryForward,
    settings.riskDollarThreshold
  )
  const colors = AREA_COLORS[account.area as AreaName]
  const categoryData = getSpendingByCategory(transactions, account.id)
  const acctTransactions = transactions.filter((t) => t.accountId === account.id)
  const monthlyData = getMonthlySpending(acctTransactions)

  // Personnel on this account
  const acctAllocations = allocations.filter((a) => a.accountId === account.id)
  const personnelOnAccount = acctAllocations.map((alloc) => {
    const person = personnel.find((p) => p.id === alloc.personId)
    return {
      name: person?.name || alloc.personId,
      role: person?.role || "",
      percent: alloc.percent,
      annualSalary: alloc.annualAmount,
      annualFringe: alloc.annualAmount * FRINGE_RATE,
      monthlySalary: alloc.annualAmount / 12,
    }
  })

  const areaSlugs: Record<string, string> = {
    "Research Lab": "research-lab",
    "Research Core": "research-core",
  }

  const encumbered = summary.salaryEncumbrance + summary.fringeEncumbrance

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/area/${areaSlugs[account.area]}`}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {account.name}
            </h1>
            {!account.isPiOwned && (
              <Badge variant="outline" className="border-dashed">
                Tracking Only
              </Badge>
            )}
            {summary.status !== "on-track" && (
              <Badge
                variant={summary.status === "overspend-risk" ? "destructive" : "warning"}
              >
                {getStatusLabel(summary.status)}
              </Badge>
            )}
            {isFederalGrant && carryForward && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                25% Carry-Fwd
              </Badge>
            )}
            {account.renewalType === "annual" && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Renews Annually
              </Badge>
            )}
            {account.renewalType === "endowment" && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Endowment
              </Badge>
            )}
            {account.renewalType === "multi-year" && account.grantYear && account.grantTotalYears && (
              <Badge variant="outline" className={cn(
                account.grantYear >= account.grantTotalYears
                  ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {account.grantYear >= account.grantTotalYears
                  ? "Final Year"
                  : `Year ${account.grantYear} of ${account.grantTotalYears}`}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            <Badge variant="secondary">{account.fundingType}</Badge>
            <span>{account.area}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(account.periodStart), "MMM d, yyyy")} –{" "}
              {format(parseISO(account.periodEnd), "MMM d, yyyy")}
            </span>
            <span>{summary.daysRemaining} days remaining</span>
          </div>
        </div>
      </div>

      {/* Compact KPI Row - single row table-style */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-1 pr-4 font-medium">Total Budget</th>
                  <th className="pb-1 pr-4 font-medium">Spent to Date</th>
                  <th className="pb-1 pr-4 font-medium">Raw Balance</th>
                  <th className="pb-1 pr-4 font-medium">Encumbered</th>
                  <th className="pb-1 pr-4 font-medium">Available to Spend</th>
                  <th className="pb-1 pr-4 font-medium">Burn Rate</th>
                  <th className="pb-1 font-medium">Projected End</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 pr-4 tabular-nums font-semibold">
                    {formatCompactCurrency(account.totalBudget)}
                  </td>
                  <td className="py-1 pr-4 tabular-nums font-semibold">
                    {formatCompactCurrency(summary.totalSpent)}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({formatPercent(summary.percentSpent)})
                    </span>
                  </td>
                  <td className="py-1 pr-4 tabular-nums font-semibold">
                    {formatCurrency(summary.rawBalance)}
                  </td>
                  <td className="py-1 pr-4 tabular-nums font-semibold">
                    {formatCurrency(encumbered)}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({Math.round(summary.monthsRemaining)}mo)
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-1 pr-4 tabular-nums font-bold",
                      summary.effectiveUnencumberedBalance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {formatCurrency(summary.effectiveUnencumberedBalance)}
                    {summary.carryForwardAmount && (
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        ({formatCompactCurrency(summary.carryForwardAmount)} reserved)
                      </span>
                    )}
                  </td>
                  <td className="py-1 pr-4 tabular-nums font-semibold">
                    {formatCompactCurrency(summary.burnRate)}/mo
                  </td>
                  <td
                    className={cn(
                      "py-1 tabular-nums font-semibold",
                      (() => {
                        // For carry-forward, projected end near the reserve is ideal
                        // Red if overspending (negative), amber if eating into reserve
                        const reserve = summary.carryForwardAmount || 0
                        if (summary.projectedEndBalance < 0) return "text-red-600 dark:text-red-400"
                        if (reserve > 0 && summary.projectedEndBalance < reserve) return "text-amber-600 dark:text-amber-400"
                        return "text-emerald-600 dark:text-emerald-400"
                      })()
                    )}
                  >
                    {formatCurrency(summary.projectedEndBalance)}
                    {summary.carryForwardAmount && (
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        (target: {formatCompactCurrency(summary.carryForwardAmount)})
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Spending Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingDonut data={categoryData} />
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Spending</CardTitle>
            <p className="text-xs text-muted-foreground">
              Stacked by category
            </p>
          </CardHeader>
          <CardContent>
            <MonthlySpendingBars data={monthlyData} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* Burn Rate Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cumulative Spending vs Expected Pace
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Colored area = actual spending. Dotted line = expected linear pace
            {summary.carryForwardAmount ? " (0–75%, excluding carry-forward reserve)" : " (0–100%)"}.
            Above the trend line = overspending. Below = underspending.
          </p>
        </CardHeader>
        <CardContent>
          <BurnRateChart
            transactions={transactions}
            accountId={account.id}
            totalBudget={account.totalBudget}
            periodStart={account.periodStart}
            periodEnd={account.periodEnd}
            color={colors?.primary || "#3B82F6"}
            height={350}
            spendingTarget={summary.carryForwardAmount
              ? account.totalBudget - summary.carryForwardAmount
              : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Detailed Spending Table */}
      <AccountSpendingTable transactions={acctTransactions} />

      {/* Personnel on this Account */}
      {personnelOnAccount.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Personnel on This Account
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Salary + 40% fringe encumbrances
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Role</th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      % Effort
                    </th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Annual Salary
                    </th>
                    <th className="pb-2 pr-4 text-right font-medium">
                      Annual Fringe
                    </th>
                    <th className="pb-2 text-right font-medium">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {personnelOnAccount.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.role}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {p.percent.toFixed(1)}%
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(p.annualSalary)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(p.annualFringe)}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {formatCurrency(p.annualSalary + p.annualFringe)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-2" colSpan={3}>
                      Total
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatCurrency(
                        personnelOnAccount.reduce(
                          (s, p) => s + p.annualSalary,
                          0
                        )
                      )}
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatCurrency(
                        personnelOnAccount.reduce(
                          (s, p) => s + p.annualFringe,
                          0
                        )
                      )}
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatCurrency(
                        personnelOnAccount.reduce(
                          (s, p) => s + p.annualSalary + p.annualFringe,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AccountSpendingTable({ transactions }: { transactions: Transaction[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (transactions.length === 0) return null

  const categories = ["Salary", "Fringe", "Supplies", "Equipment", "Travel", "Animal Costs", "Other"]
  const monthSet = new Set<string>()
  for (const tx of transactions) {
    monthSet.add(format(parseISO(tx.date), "yyyy-MM"))
  }
  const months = Array.from(monthSet).sort()

  type RowData = { category: string; monthlyAmounts: Record<string, number>; total: number }
  const rows: RowData[] = []
  for (const cat of categories) {
    const catTx = transactions.filter((t) => t.category === cat)
    if (catTx.length === 0) continue
    const monthlyAmounts: Record<string, number> = {}
    let total = 0
    for (const tx of catTx) {
      const month = format(parseISO(tx.date), "yyyy-MM")
      monthlyAmounts[month] = (monthlyAmounts[month] || 0) + tx.amount
      total += tx.amount
    }
    rows.push({ category: cat, monthlyAmounts, total })
  }

  const grandTotal = rows.reduce((s, r) => s + r.total, 0)

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <CardTitle className="text-base">Detailed Spending</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly breakdown by category
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
                  <th className="pb-2 pr-3 text-left font-medium sticky left-0 bg-card min-w-[100px]">
                    Category
                  </th>
                  {months.map((m) => (
                    <th key={m} className="pb-2 px-2 text-right font-medium whitespace-nowrap">
                      {format(parseISO(m + "-01"), "MMM yy")}
                    </th>
                  ))}
                  <th className="pb-2 pl-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 sticky left-0 bg-card font-medium">
                      {row.category}
                    </td>
                    {months.map((m) => (
                      <td key={m} className="py-1.5 px-2 text-right tabular-nums">
                        {row.monthlyAmounts[m]
                          ? formatCompactCurrency(row.monthlyAmounts[m])
                          : "—"}
                      </td>
                    ))}
                    <td className="py-1.5 pl-3 text-right tabular-nums font-medium">
                      {formatCompactCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t-2">
                  <td className="pt-2 pr-3 sticky left-0 bg-card">Total</td>
                  {months.map((m) => {
                    const monthTotal = rows.reduce((s, r) => s + (r.monthlyAmounts[m] || 0), 0)
                    return (
                      <td key={m} className="pt-2 px-2 text-right tabular-nums">
                        {monthTotal > 0 ? formatCompactCurrency(monthTotal) : "—"}
                      </td>
                    )
                  })}
                  <td className="pt-2 pl-3 text-right tabular-nums">
                    {formatCompactCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
