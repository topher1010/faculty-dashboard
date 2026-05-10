import {
  differenceInDays,
  parseISO,
  format,
} from "date-fns"
import { FRINGE_RATE } from "./constants"
import type {
  Account,
  AccountSummary,
  AreaSummary,
  MonthlySpending,
  Person,
  PersonSummary,
  SalaryAllocation,
  Transaction,
  AreaName,
} from "./types"

export const TODAY = new Date("2026-02-28")

// Risk threshold: 15% of budget
const RISK_THRESHOLD = 0.15

export function computeAccountSummary(
  account: Account,
  transactions: Transaction[],
  allocations: SalaryAllocation[],
  carryForwardOverride?: boolean,
  dollarThreshold: number = 5000
): AccountSummary {
  const periodStart = parseISO(account.periodStart)
  const periodEnd = parseISO(account.periodEnd)
  const acctTransactions = transactions.filter((t) => t.accountId === account.id)
  const acctAllocations = allocations.filter((a) => a.accountId === account.id)

  // Total spent
  const totalSpent = acctTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Raw balance
  const rawBalance = account.totalBudget - totalSpent

  // Time calculations
  const totalDays = differenceInDays(periodEnd, periodStart)
  const elapsedDays = Math.max(0, differenceInDays(TODAY, periodStart))
  const daysRemaining = Math.max(0, differenceInDays(periodEnd, TODAY))
  const monthsElapsed = Math.max(0.5, elapsedDays / 30.44)
  const monthsRemaining = Math.max(0, daysRemaining / 30.44)

  const percentTimeElapsed = Math.min(1, elapsedDays / totalDays)
  const percentSpent = totalSpent / account.totalBudget

  // Salary encumbrance (remaining salary + fringe obligations)
  const monthlySalaryTotal = acctAllocations.reduce(
    (sum, a) => sum + a.annualAmount / 12,
    0
  )
  const monthlyFringeTotal = monthlySalaryTotal * FRINGE_RATE
  const monthlySalaryFringe = monthlySalaryTotal + monthlyFringeTotal
  const salaryEncumbrance = monthlySalaryTotal * monthsRemaining
  const fringeEncumbrance = monthlyFringeTotal * monthsRemaining

  // Unencumbered balance
  const unencumberedBalance = rawBalance - salaryEncumbrance - fringeEncumbrance

  // NIH carry-forward: compute early so effectiveUnencumberedBalance can use it
  // Use override if provided, otherwise fall back to data default
  const isCarryForward = carryForwardOverride !== undefined
    ? carryForwardOverride
    : !!account.nihCarryForward
  const carryForwardAmount = isCarryForward
    ? account.totalBudget * 0.25
    : undefined

  // Effective unencumbered balance: when carry-forward is on, reserve 25% of budget
  const effectiveUnencumberedBalance = carryForwardAmount
    ? unencumberedBalance - carryForwardAmount
    : unencumberedBalance

  // Burn rate
  const burnRate = monthsElapsed > 0 ? totalSpent / monthsElapsed : 0

  // Trailing 3-month burn rate
  const threeMonthsAgo = new Date(TODAY)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recent = acctTransactions.filter(
    (t) => parseISO(t.date) >= threeMonthsAgo
  )
  const recentSpent = recent.reduce((sum, t) => sum + t.amount, 0)
  const burnRate3mo = recentSpent / 3

  // Projected end balance (day-based projection for consistency)
  const dailyBurnRate = elapsedDays > 0 ? totalSpent / elapsedDays : 0
  const projectedEndBalance = rawBalance - dailyBurnRate * daysRemaining

  // Pace ratio: for carry-forward accounts, pace is measured against 75% target
  const spendingTargetFraction = carryForwardAmount
    ? (account.totalBudget - carryForwardAmount) / account.totalBudget
    : 1
  const expectedPct = percentTimeElapsed * spendingTargetFraction
  const paceRatio = expectedPct > 0 ? percentSpent / expectedPct : 0

  // Status determination based on projected end balance
  // Overspend risk: projected to overspend by >15% of budget
  // Underspend risk: projected to underspend by >15% of budget
  // For carry-forward accounts, underspend up to 25% is normal
  let status: "on-track" | "overspend-risk" | "underspend-risk"
  let riskLabel: string | undefined

  const overspendThreshold = Math.min(
    account.totalBudget * RISK_THRESHOLD,
    dollarThreshold
  )
  const underspendThreshold = Math.min(
    account.totalBudget * RISK_THRESHOLD,
    dollarThreshold
  )

  // For carry-forward accounts, measure over/underspend relative to the reserve target
  // projectedEndVsTarget: negative = eating into reserve, positive = leaving more than reserve
  const projectedEndVsTarget = projectedEndBalance - (carryForwardAmount || 0)

  if (projectedEndVsTarget < -overspendThreshold) {
    status = "overspend-risk"
    riskLabel = "Overspend Risk"
  } else if (projectedEndVsTarget > underspendThreshold) {
    status = "underspend-risk"
    riskLabel = "Underspend Risk"
  } else {
    status = "on-track"
  }

  return {
    account,
    totalSpent,
    rawBalance,
    salaryEncumbrance,
    fringeEncumbrance,
    unencumberedBalance,
    effectiveUnencumberedBalance,
    burnRate,
    burnRate3mo,
    projectedEndBalance,
    paceRatio,
    status,
    riskLabel,
    carryForwardAmount,
    monthsElapsed,
    monthsRemaining,
    daysRemaining,
    percentSpent,
    percentTimeElapsed,
  }
}

export function computeAreaSummary(
  area: AreaName,
  accounts: Account[],
  transactions: Transaction[],
  allocations: SalaryAllocation[],
  carryForwardSettings?: { carryForward: Record<string, boolean>; riskDollarThreshold?: number }
): AreaSummary {
  const areaAccounts = accounts.filter(
    (a) => a.area === area && a.isPiOwned
  )
  const dollarThreshold = carryForwardSettings?.riskDollarThreshold ?? 5000
  const summaries = areaAccounts.map((a) => {
    let override: boolean | undefined
    if (a.fundingType === "Federal Grant" && carryForwardSettings) {
      override = a.id in carryForwardSettings.carryForward
        ? carryForwardSettings.carryForward[a.id]
        : !!a.nihCarryForward
    }
    return computeAccountSummary(a, transactions, allocations, override, dollarThreshold)
  })

  const totalBudget = summaries.reduce(
    (sum, s) => sum + s.account.totalBudget,
    0
  )
  const totalSpent = summaries.reduce((sum, s) => sum + s.totalSpent, 0)
  const rawBalance = summaries.reduce((sum, s) => sum + s.rawBalance, 0)
  const unencumberedBalance = summaries.reduce(
    (sum, s) => sum + s.unencumberedBalance,
    0
  )
  const effectiveUnencumberedBalance = summaries.reduce(
    (sum, s) => sum + s.effectiveUnencumberedBalance,
    0
  )

  const overspendCount = summaries.filter(
    (s) => s.status === "overspend-risk"
  ).length
  const underspendCount = summaries.filter(
    (s) => s.status === "underspend-risk"
  ).length

  const status =
    overspendCount > 0
      ? "overspend-risk" as const
      : underspendCount > 0
      ? "underspend-risk" as const
      : "on-track" as const

  return {
    area,
    totalBudget,
    totalSpent,
    rawBalance,
    unencumberedBalance,
    effectiveUnencumberedBalance,
    accountCount: areaAccounts.length,
    status,
    overspendCount,
    underspendCount,
    accounts: summaries,
  }
}

export function computePersonSummary(
  person: Person,
  accounts: Account[],
  allocations: SalaryAllocation[]
): PersonSummary {
  const personAllocs = allocations.filter((a) => a.personId === person.id)
  const allocsWithAccounts = personAllocs.map((a) => ({
    ...a,
    account: accounts.find((acc) => acc.id === a.accountId)!,
  }))

  const totalAllocated = personAllocs.reduce(
    (sum, a) => sum + a.annualAmount,
    0
  )
  const totalWithFringe = totalAllocated * (1 + FRINGE_RATE)

  const fundingEndDates = allocsWithAccounts.map((a) => ({
    accountId: a.accountId,
    accountName: a.account.name,
    endDate: a.account.periodEnd,
  }))

  return {
    person,
    allocations: allocsWithAccounts,
    totalAllocated,
    totalWithFringe,
    fundingEndDates,
  }
}

export function getMonthlySpending(
  transactions: Transaction[],
  accountId?: string
): MonthlySpending[] {
  const filtered = accountId
    ? transactions.filter((t) => t.accountId === accountId)
    : transactions

  const monthMap: Record<string, Record<string, number>> = {}

  for (const tx of filtered) {
    const month = format(parseISO(tx.date), "yyyy-MM")
    if (!monthMap[month]) monthMap[month] = {}
    monthMap[month][tx.category] =
      (monthMap[month][tx.category] || 0) + tx.amount
    monthMap[month]["Total"] = (monthMap[month]["Total"] || 0) + tx.amount
  }

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, categories]) => ({
      month,
      ...categories,
    }))
}

export function getCumulativeSpending(
  transactions: Transaction[],
  accountId: string
): { month: string; cumulative: number; budget: number }[] {
  const acctTx = transactions.filter((t) => t.accountId === accountId)

  const monthMap: Record<string, number> = {}
  for (const tx of acctTx) {
    const month = format(parseISO(tx.date), "yyyy-MM")
    monthMap[month] = (monthMap[month] || 0) + tx.amount
  }

  const months = Object.keys(monthMap).sort()
  let cumulative = 0
  return months.map((month) => {
    cumulative += monthMap[month]
    return { month, cumulative, budget: 0 }
  })
}

export function getSpendingByCategory(
  transactions: Transaction[],
  accountId?: string
): { category: string; amount: number }[] {
  const filtered = accountId
    ? transactions.filter((t) => t.accountId === accountId)
    : transactions

  const catMap: Record<string, number> = {}
  for (const tx of filtered) {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount
  }

  return Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function getStatusColor(
  status: "on-track" | "overspend-risk" | "underspend-risk"
): string {
  switch (status) {
    case "on-track":
      return "#059669"
    case "overspend-risk":
      return "#DC2626"
    case "underspend-risk":
      return "#D97706"
  }
}

export function isRenewalSafe(account: Account): boolean {
  if (!account.renewalType) return false
  if (account.renewalType === "annual" || account.renewalType === "endowment") return true
  if (account.renewalType === "multi-year") {
    return (account.grantTotalYears ?? 0) > (account.grantYear ?? 0)
  }
  return false // terminal
}

export function getStatusLabel(
  status: "on-track" | "overspend-risk" | "underspend-risk"
): string {
  switch (status) {
    case "on-track":
      return "On Track"
    case "overspend-risk":
      return "Overspend Risk"
    case "underspend-risk":
      return "Underspend Risk"
  }
}
