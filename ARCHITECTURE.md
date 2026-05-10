# Architecture

## Why this exists

A faculty research PI typically manages several funding accounts at once — institutional support, federal grants, internal pilots — each with its own budget period, carry-forward rules, and personnel salary splits. Institutional reporting tools (Power BI, Excel exports) struggle to keep these views coherent. This dashboard is one source of truth for budget health across two areas (Lab + Core) and the accounts inside them.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — push to GitHub, Railway auto-deploys
- **Tailwind CSS** + manually-created shadcn/ui-style components
- **Recharts** for all interactive charts
- **JSON files** as the data layer — no database

The data layer choice is deliberate: a PI swapping in real numbers should not need to learn SQL, set up a database, or manage migrations. Edit four JSON files, the dashboard recalculates.

## Directory layout

```
src/
├── app/
│   ├── page.tsx              # Overview
│   ├── area/[slug]/page.tsx  # Area detail (research-lab, research-core)
│   ├── account/[id]/page.tsx # Account deep dive
│   ├── personnel/page.tsx    # Salary breakdown by person
│   └── settings/page.tsx     # Carry-forward toggles, risk thresholds
├── lib/
│   ├── finance.ts            # All financial calculations
│   ├── data.ts               # JSON loaders
│   ├── types.ts              # Domain types
│   └── constants.ts          # Fringe rate, area colors, status thresholds
├── components/
│   ├── charts/               # Recharts wrappers
│   ├── dashboard/            # Account cards, alert cards, value boxes
│   ├── layout/               # Sidebar, theme provider, settings provider
│   └── ui/                   # Card, badge, progress
└── data/
    ├── accounts.json         # 8 accounts
    ├── personnel.json        # 7 employees
    ├── salary-allocations.json
    └── transactions.json     # ~324 monthly transactions, generated
```

## Data model

**accounts.json** — 8 funding accounts:

| Account | Area | Type | Budget | Period |
|---------|------|------|--------|--------|
| Institutional Lab Funds | Research Lab | Institutional | $168K | annual |
| R01 #1 | Research Lab | Federal Grant | $250K | multi-year (Y3/5) |
| R01 #2 | Research Lab | Federal Grant | $250K | multi-year (Y2/5) |
| F32 Fellowship | Research Lab | Federal Grant | $72K | tracking only |
| Pilot Award | Research Lab | Internal Award | $35K | tracking only |
| Institutional Core Funds | Research Core | Institutional | $50K | annual |
| Center Grant #1 | Research Core | Federal Grant | $50K | multi-year (Y4/5) |
| Center Grant #2 | Research Core | Federal Grant | $280K | multi-year (Y2/5) |

**personnel.json** — 7 people: PI, 2 lab technicians, 1 postdoc, 1 core manager, 1 core technician, 1 core surgeon.

**salary-allocations.json** — each person's effort split across accounts. PI is split: 18% Institutional Lab, 30% R01 #1, 30% R01 #2, 7% Center #1, 15% Center #2. Institutional Lab is sized at 60% of PI salary plus fringe ($120K + $48K = $168K).

**transactions.json** — 8 months of mock spending. Categories: Salary, Fringe, Supplies, Equipment, Travel, Animal Costs, Other. Salary and fringe are first-class — fringe is 40% of every salary draw, posted to the same account in the same month.

## Key financial calculations (`lib/finance.ts`)

| Metric | Formula |
|--------|---------|
| Raw balance | totalBudget − sum(transactions) |
| Salary encumbrance | sum(monthly salary × monthsRemaining) per allocation |
| Fringe encumbrance | salaryEncumbrance × 0.40 |
| **Unencumbered balance** | rawBalance − salaryEncumbrance − fringeEncumbrance |
| Burn rate | totalSpent / monthsElapsed |
| Projected end balance | rawBalance − (burnRate × monthsRemaining) |
| Pace ratio | actualPctSpent / expectedPctByTime |

`FRINGE_RATE = 0.40` is configurable in `lib/constants.ts`.

### NIH 25% carry-forward

NIH grants allow up to 25% of the budget to roll into the next period. When `nihCarryForward: true` on an account (toggleable in Settings):

- Spending target = 75% of total budget, not 100%
- Pace ratio measures against the target
- Projected end balance compared against the reserve, not zero
- Overspend risk = projected to eat into reserve; underspend risk = projected to leave more than the reserve

The carry-forward principle is load-bearing across cards, charts, and timeline bars — every percentage and reference line that mentions "expected" or "target" is computed against the reduced target when carry-forward is enabled.

## Pages

- **Overview** — area summary cards (donut + balance + burn-rate badge), spending pace bullet chart, alerts panel, PI salary donut, budget timeline Gantt
- **Area detail** — account summary table with click-to-exclude rows, account cards, monthly spending bars, spending-by-category donut, raw transactions table
- **Account detail** — value boxes, monthly spending breakdown, burn rate projection with safe-zone band, personnel allocations table
- **Personnel** — stacked bar of salary effort by account, individual detail on click, funding-end-date awareness for renewal-aware accounts
- **Settings** — global and per-account carry-forward toggle, risk dollar threshold, "today" date override

## Visual design

- Area colors: Lab = Teal, Core = Amber, Tracking = Muted Gray
- Status: Green (`#059669`) on-track, Amber (`#D97706`) warning, Red (`#DC2626`) danger
- Inter font, tabular numbers for currency
- Dark mode toggle persisted in localStorage
- Mobile: sidebar collapses to a hamburger menu; grids stack to one column under `sm`

## Deployment

Railway auto-detects Next.js via Railpack — no Dockerfile needed. Push to `main`, Railway runs `npm install`, `npm run build`, `npm start`, and serves the result behind a public URL.

## Replacing the demo data

The data shipped in `src/data/` is fictional. To use real numbers:

1. Edit the four JSON files
2. Optionally regenerate `transactions.json` from the first three with `node scripts/generate-transactions.mjs`
3. The dashboard recalculates everything — no code changes required
