// Generate realistic transaction data for the faculty budget dashboard.
// Run: node scripts/generate-transactions.mjs

import { writeFileSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, "..", "src", "data")

const accounts = JSON.parse(readFileSync(join(dataDir, "accounts.json"), "utf-8"))
const personnel = JSON.parse(readFileSync(join(dataDir, "personnel.json"), "utf-8"))
const allocations = JSON.parse(readFileSync(join(dataDir, "salary-allocations.json"), "utf-8"))

const FRINGE_RATE = 0.40
const MONTHS = [
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02"
]

let transactions = []
let nextId = 1

// Seeded random for reproducibility
let seed = 42
function seededRandom() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

function rand(min, max) {
  return seededRandom() * (max - min) + min
}

function addTx(date, accountId, category, amount, description) {
  transactions.push({
    id: `tx-${String(nextId++).padStart(4, "0")}`,
    date: `${date}-01`,
    accountId,
    category,
    amount: Math.round(amount * 100) / 100,
    description
  })
}

function isInPeriod(month, accountId) {
  const acct = accounts.find(a => a.id === accountId)
  const monthDate = new Date(month + "-15")
  const start = new Date(acct.periodStart)
  const end = new Date(acct.periodEnd)
  return monthDate >= start && monthDate <= end
}

// Salary + fringe
for (const month of MONTHS) {
  for (const alloc of allocations) {
    if (!isInPeriod(month, alloc.accountId)) continue

    const person = personnel.find(p => p.id === alloc.personId)
    const monthlySalary = alloc.annualAmount / 12
    const monthlyFringe = monthlySalary * FRINGE_RATE

    addTx(month, alloc.accountId, "Salary", monthlySalary,
      `${person.name} - ${alloc.percent}% effort`)
    addTx(month, alloc.accountId, "Fringe", monthlyFringe,
      `${person.name} - fringe benefits (40%)`)
  }
}

// Per-account spending stories (target % spent at today = 2026-02-28):
//   Institutional Lab Funds  → ~75% (mild overspend, "watch this" baseline)
//   R01 #1                   → ~20% (underspend vs CF target — risk of leaving
//                                    money to the 25% reserve cap)
//   R01 #2                   → ~5%  (just started, naturally low)
//   Institutional Core Funds → ~80% (clear overspend, dollar-amount risk)
//   Center Grant #1          → ~38% (mild overspend vs CF target)
//   Center Grant #2          → ~58% (on pace, steady baseline)
//   F32 Fellowship (track)   → ~65% (steady)
//   Pilot Award (track)      → ~50% (mild overspend)

// Institutional Lab Funds — on pace, modest baseline
for (const month of MONTHS) {
  if (!isInPeriod(month, "lab-institutional")) continue
  addTx(month, "lab-institutional", "Supplies", rand(1500, 4000), "Lab reagents and consumables")
  if (seededRandom() > 0.6) {
    addTx(month, "lab-institutional", "Equipment", rand(2000, 8000), "Lab equipment maintenance/purchase")
  }
  addTx(month, "lab-institutional", "Other", rand(100, 500), "Core facility fees")
}

// R01 #1 — underspend story (started Nov 2025; PI is conservative on non-salary)
for (const month of MONTHS) {
  if (!isInPeriod(month, "lab-r01-1")) continue
  addTx(month, "lab-r01-1", "Supplies", rand(400, 1200), "Research reagents and assays")
  addTx(month, "lab-r01-1", "Animal Costs", rand(400, 1000), "Animal colony — research studies")
  if (seededRandom() > 0.75) {
    addTx(month, "lab-r01-1", "Travel", rand(300, 800), "Conference and collaboration travel")
  }
  addTx(month, "lab-r01-1", "Other", rand(50, 200), "Publication fees and core services")
}

// R01 #2 — just started (Feb 2026); minimal setup spending only
for (const month of MONTHS) {
  if (!isInPeriod(month, "lab-r01-2")) continue
  addTx(month, "lab-r01-2", "Supplies", rand(1000, 2000), "Initial supplies and setup")
  addTx(month, "lab-r01-2", "Animal Costs", rand(500, 1500), "Animal colony — initial setup")
  addTx(month, "lab-r01-2", "Other", rand(50, 200), "Misc setup costs")
}

// F32 — postdoc fellowship (tracking only); steady baseline
for (const month of MONTHS) {
  if (!isInPeriod(month, "lab-fellowship")) continue
  addTx(month, "lab-fellowship", "Supplies", rand(200, 700), "Research allowance spending")
  if (seededRandom() > 0.8) {
    addTx(month, "lab-fellowship", "Travel", rand(200, 500), "Conference attendance")
  }
}

// Pilot Award — started Oct 2025 (tracking only); mild overspend
for (const month of MONTHS) {
  if (!isInPeriod(month, "lab-pilot")) continue
  addTx(month, "lab-pilot", "Supplies", rand(500, 1500), "Pilot study reagents")
  addTx(month, "lab-pilot", "Animal Costs", rand(300, 900), "Pilot study animal costs")
  if (seededRandom() > 0.85) {
    addTx(month, "lab-pilot", "Other", rand(100, 400), "Core facility services")
  }
}

// Institutional Core Funds — clear overspend (small budget, stretched)
for (const month of MONTHS) {
  if (!isInPeriod(month, "core-institutional")) continue
  addTx(month, "core-institutional", "Supplies", rand(150, 350), "Core operational supplies")
  addTx(month, "core-institutional", "Animal Costs", rand(100, 250), "Animal housing — core facility")
  if (seededRandom() > 0.7) {
    addTx(month, "core-institutional", "Equipment", rand(200, 500), "Core equipment maintenance")
  }
}

// Center Grant #1 — mild overspend vs CF target (started Dec 2025)
for (const month of MONTHS) {
  if (!isInPeriod(month, "core-grant-1")) continue
  addTx(month, "core-grant-1", "Supplies", rand(150, 450), "Core supplies")
  addTx(month, "core-grant-1", "Animal Costs", rand(250, 650), "Core-funded animal studies")
  if (seededRandom() > 0.85) {
    addTx(month, "core-grant-1", "Equipment", rand(400, 1000), "Core equipment")
  }
}

// Center Grant #2 — on pace (started Aug 2025); steady baseline
for (const month of MONTHS) {
  if (!isInPeriod(month, "core-grant-2")) continue
  addTx(month, "core-grant-2", "Supplies", rand(800, 2200), "Core research supplies")
  addTx(month, "core-grant-2", "Animal Costs", rand(1100, 2700), "Core-funded animal studies")
  if (seededRandom() > 0.65) {
    addTx(month, "core-grant-2", "Equipment", rand(500, 2000), "Core equipment and upgrades")
  }
  if (seededRandom() > 0.75) {
    addTx(month, "core-grant-2", "Travel", rand(200, 800), "Center meeting and workshop travel")
  }
  addTx(month, "core-grant-2", "Other", rand(200, 500), "Software, services, misc")
}

// Sort by date then account
transactions.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  return a.accountId.localeCompare(b.accountId)
})

writeFileSync(
  join(dataDir, "transactions.json"),
  JSON.stringify(transactions, null, 2)
)

console.log(`Generated ${transactions.length} transactions`)

// Summary per account
const summary = {}
for (const tx of transactions) {
  if (!summary[tx.accountId]) summary[tx.accountId] = 0
  summary[tx.accountId] += tx.amount
}
const acctMap = Object.fromEntries(accounts.map(a => [a.id, a]))
for (const [id, spent] of Object.entries(summary)) {
  const a = acctMap[id]
  const pct = ((spent / a.totalBudget) * 100).toFixed(1)
  console.log(`  ${a.name}: $${Math.round(spent).toLocaleString()} of $${a.totalBudget.toLocaleString()} (${pct}%)`)
}
