"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings, isCarryForwardEnabled } from "@/components/layout/settings-provider"
import { getAccounts } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const accounts = getAccounts()

  // PI-owned Federal Grant accounts that support carry-forward
  const nihAccounts = accounts.filter(
    (a) => a.isPiOwned && a.fundingType === "Federal Grant"
  )

  const toggleCarryForward = (accountId: string) => {
    const current = isCarryForwardEnabled(
      settings,
      accountId,
      !!accounts.find((a) => a.id === accountId)?.nihCarryForward
    )
    updateSettings({
      carryForward: {
        ...settings.carryForward,
        [accountId]: !current,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure dashboard behavior. Changes apply immediately across all pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">NIH 25% Carry-Forward</CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            NIH grants allow up to 25% of the total budget to be carried forward into the
            next period. When enabled for an account, leaving up to 25% unspent is considered
            on-track rather than flagged as an underspend risk.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nihAccounts.map((account) => {
              const enabled = isCarryForwardEnabled(
                settings,
                account.id,
                !!account.nihCarryForward
              )
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(account.totalBudget)}
                      {" · "}
                      {format(parseISO(account.periodStart), "MMM yyyy")} – {format(parseISO(account.periodEnd), "MMM yyyy")}
                      {" · "}{account.area}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {enabled ? "25% carry-forward" : "Full budget"}
                    </span>
                    <button
                      onClick={() => toggleCarryForward(account.id)}
                      className={
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 " +
                        (enabled
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30")
                      }
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Toggle carry-forward for ${account.name}`}
                    >
                      <span
                        className={
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 " +
                          (enabled
                            ? "translate-x-5"
                            : "translate-x-0")
                        }
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Dollar Threshold</CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Accounts are flagged as at-risk if the projected overspend or underspend exceeds
            either 15% of the budget or this fixed dollar amount, whichever is smaller.
            Lower values catch smaller discrepancies sooner.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">$</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={settings.riskDollarThreshold}
              onChange={(e) =>
                updateSettings({
                  riskDollarThreshold: Math.max(0, Number(e.target.value) || 5000),
                })
              }
              className="w-32 rounded-md border bg-card px-3 py-1.5 text-sm tabular-nums"
            />
            <span className="text-xs text-muted-foreground">Default: $5,000</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
