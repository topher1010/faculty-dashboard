export type AreaName = "Research Lab" | "Research Core"

export type FundingType =
  | "Institutional"
  | "Federal Grant"
  | "Foundation"
  | "Internal Award"

export type RenewalType = "annual" | "multi-year" | "terminal" | "endowment"

export type TransactionCategory =
  | "Salary"
  | "Fringe"
  | "Supplies"
  | "Equipment"
  | "Travel"
  | "Animal Costs"
  | "Other"

export interface Account {
  id: string
  name: string
  area: AreaName
  fundingType: FundingType
  totalBudget: number
  periodStart: string  // ISO date
  periodEnd: string    // ISO date
  isPiOwned: boolean
  nihCarryForward?: boolean  // NIH grants allow 25% carry-forward
  renewalType?: RenewalType
  grantYear?: number
  grantTotalYears?: number
  categoryBudgets?: Record<string, number>
  description?: string
}

export interface Person {
  id: string
  name: string
  role: string
  area: AreaName
  annualSalary: number
}

export interface SalaryAllocation {
  personId: string
  accountId: string
  percent: number
  annualAmount: number
}

export interface Transaction {
  id: string
  date: string  // ISO date
  accountId: string
  category: TransactionCategory
  amount: number
  description: string
}

// Computed types
export interface AccountSummary {
  account: Account
  totalSpent: number
  rawBalance: number
  salaryEncumbrance: number
  fringeEncumbrance: number
  unencumberedBalance: number
  effectiveUnencumberedBalance: number  // unencumbered minus carry-forward reserve (if applicable)
  burnRate: number
  burnRate3mo: number
  projectedEndBalance: number
  paceRatio: number
  status: "on-track" | "overspend-risk" | "underspend-risk"
  riskLabel?: string  // e.g. "Overspend Risk" or "Underspend Risk"
  carryForwardAmount?: number  // 25% of budget for NIH grants
  monthsElapsed: number
  monthsRemaining: number
  daysRemaining: number
  percentSpent: number
  percentTimeElapsed: number
}

export interface AreaSummary {
  area: AreaName
  totalBudget: number
  totalSpent: number
  rawBalance: number
  unencumberedBalance: number
  effectiveUnencumberedBalance: number
  accountCount: number
  status: "on-track" | "overspend-risk" | "underspend-risk"
  overspendCount: number
  underspendCount: number
  accounts: AccountSummary[]
}

export interface PersonSummary {
  person: Person
  allocations: (SalaryAllocation & { account: Account })[]
  totalAllocated: number
  totalWithFringe: number
  fundingEndDates: { accountId: string; accountName: string; endDate: string }[]
}

export interface MonthlySpending {
  month: string  // YYYY-MM
  [category: string]: number | string
}
