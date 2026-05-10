# Faculty Budget Dashboard

A financial dashboard for faculty research PIs to track budgets, burn rates, and personnel funding across research lab and core accounts.

**Live demo:** [faculty-dashboard.tophertech.org](https://faculty-dashboard.tophertech.org)

### Note from Chris

I vibe-coded this dashboard to show what a faculty financial dashboard could look like. All of the data/information is fake, but the structure reflects a real PI's funding setup. The focus is on graphical information that can be understood at a glance, though more detailed information is also provided. I haven't stress-tested this version excessively, so it's possible there are some bugs in the math or presentation. You'd need to provide actual data and confirm it looks correct.

*— Chris Morrison · [LinkedIn](https://www.linkedin.com/in/christopher-morrison-4b3315369/) · [tophertech.org](https://www.tophertech.org)*

## What it does

A PI typically manages several funding accounts at once — institutional support, federal grants, internal pilots — each with its own budget period, carry-forward rules, and personnel salary splits. Spreadsheets get this wrong constantly. This dashboard gives one source of truth across:

- **Overview** — health check across every area and account
- **Area detail** — drill into Research Lab or Research Core
- **Account detail** — burn rate, projections, NIH 25% carry-forward reserve
- **Personnel** — salary effort split by account, with funding-end-date awareness

The non-trivial bits live in [src/lib/finance.ts](./src/lib/finance.ts): unencumbered balance (raw balance minus future salary + 40% fringe obligations), pace ratio adjusted for carry-forward target, and projected end balance.

## Demo data

The data shipped in `src/data/` is fictional. Names, account labels, and dollar amounts were invented to mirror a typical PI workflow. The structure is real; the numbers are not.

## Quick start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Use your own data

Edit the four JSON files in `src/data/`:

1. `accounts.json` — funding accounts
2. `personnel.json` — employees
3. `salary-allocations.json` — who is paid from where
4. `transactions.json` — monthly spending

Or regenerate transactions from the first three: `node scripts/generate-transactions.mjs`. The dashboard recalculates everything automatically.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind · Recharts · JSON files (no database).

## Deploy

Railway auto-detects Next.js via Railpack — connect a repo, set no env vars, and you get a public URL. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.
