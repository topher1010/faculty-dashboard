"use client"

import Link from "next/link"
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import type { AccountSummary } from "@/lib/types"

interface AlertCardProps {
  alerts: AccountSummary[]
}

export function AlertCard({ alerts }: AlertCardProps) {
  const overspendAlerts = alerts.filter((a) => a.status === "overspend-risk")
  const underspendAlerts = alerts.filter((a) => a.status === "underspend-risk")
  const sortedAlerts = [...overspendAlerts, ...underspendAlerts]

  if (sortedAlerts.length === 0) {
    return (
      <div className="rounded-xl border bg-emerald-50 p-4 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">All accounts on track</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        Accounts Needing Attention
      </h3>
      <div className="space-y-1.5">
        {sortedAlerts.map((alert) => (
          <Link
            key={alert.account.id}
            href={`/account/${alert.account.id}`}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              alert.status === "overspend-risk"
                ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  alert.status === "overspend-risk" ? "bg-red-500" : "bg-amber-500"
                )}
              />
              <span className="font-medium truncate max-w-[180px]">
                {alert.account.name}
              </span>
            </div>
            <div className="flex items-center gap-1 tabular-nums">
              {alert.status === "overspend-risk" ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-amber-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  alert.status === "overspend-risk"
                    ? "text-red-700 dark:text-red-400"
                    : "text-amber-700 dark:text-amber-400"
                )}
              >
                {alert.riskLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
