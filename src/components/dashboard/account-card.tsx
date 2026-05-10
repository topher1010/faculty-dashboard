"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency, formatPercent, formatCompactCurrency } from "@/lib/utils"
import { getStatusLabel } from "@/lib/finance"
import type { AccountSummary } from "@/lib/types"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"

interface AccountCardProps {
  summary: AccountSummary
  showArea?: boolean
}

export function AccountCard({ summary, showArea = false }: AccountCardProps) {
  const {
    account,
    percentSpent,
    status,
    unencumberedBalance,
    rawBalance,
    daysRemaining,
    burnRate,
    monthsRemaining,
  } = summary

  const isTracking = !account.isPiOwned
  const hasCarryForward = !!summary.carryForwardAmount

  // Spending target: for carry-forward accounts, the target is 75% of budget
  const spendingTarget = hasCarryForward
    ? account.totalBudget - summary.carryForwardAmount!
    : account.totalBudget
  const percentOfTarget = summary.totalSpent / spendingTarget

  // Future needed burn rate: spending needed per month to hit the target by period end
  const futureNeededBurnRate =
    monthsRemaining > 0
      ? (rawBalance - (summary.carryForwardAmount || 0)) / monthsRemaining
      : 0

  return (
    <Link
      href={`/account/${account.id}`}
      className={cn(
        "group block rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        isTracking && "opacity-60 hover:opacity-80 border-dashed"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{account.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {account.fundingType}
            </Badge>
            {isTracking && (
              <Badge variant="outline" className="text-[10px] border-dashed">
                Tracking Only
              </Badge>
            )}
            {status !== "on-track" && (
              <Badge
                variant={status === "overspend-risk" ? "destructive" : "warning"}
                className="text-[10px]"
              >
                {getStatusLabel(status)}
              </Badge>
            )}
            {summary.carryForwardAmount && (
              <Badge variant="outline" className="text-[10px]">
                25% Carry-Fwd
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground">
            {hasCarryForward ? "Target Used" : "Budget Used"}
          </span>
          <span className="tabular-nums text-xs font-medium">
            {formatPercent(percentOfTarget)}
            {hasCarryForward && (
              <span className="text-muted-foreground ml-1">
                ({formatPercent(percentSpent)} of budget)
              </span>
            )}
          </span>
        </div>
        <Progress
          value={percentOfTarget * 100}
          className="mt-1"
          indicatorClassName={cn(
            status === "on-track" && "bg-emerald-500",
            status === "underspend-risk" && "bg-amber-500",
            status === "overspend-risk" && "bg-red-500"
          )}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {summary.carryForwardAmount ? "Spendable (excl. reserve)" : "Available to Spend"}
          </p>
          <p
            className={cn(
              "tabular-nums text-sm font-semibold",
              summary.effectiveUnencumberedBalance < 0
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatCurrency(summary.effectiveUnencumberedBalance)}
          </p>
          {summary.carryForwardAmount && (
            <p className="text-[9px] text-muted-foreground">
              {formatCompactCurrency(summary.carryForwardAmount)} reserved
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Raw Balance
          </p>
          <p className="tabular-nums text-sm font-semibold">
            {formatCurrency(rawBalance)}
          </p>
        </div>
      </div>

      {/* Burn Rate Section */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Past Burn Rate
          </p>
          <p className="tabular-nums text-xs font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            {formatCompactCurrency(burnRate)}/mo
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Needed Burn Rate
          </p>
          <p className="tabular-nums text-xs font-medium flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
            {monthsRemaining > 0
              ? `${formatCompactCurrency(futureNeededBurnRate)}/mo`
              : "Period ended"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          {daysRemaining} days remaining
          {account.renewalType === "annual" && " (renews annually)"}
          {account.renewalType === "endowment" && " (endowment)"}
          {account.renewalType === "multi-year" && account.grantYear && account.grantTotalYears && (
            account.grantYear >= account.grantTotalYears
              ? " (final year)"
              : ` (Yr ${account.grantYear} of ${account.grantTotalYears})`
          )}
        </span>
      </div>
    </Link>
  )
}
