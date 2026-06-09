# MUHAMMADIYYA Permit Operations

A complete Next.js 15 permit tracker generated from the attached `temp permit.xlsx` workbook.

## Workbook logic preserved

The Excel file has one main sheet named `SHATEE PERMIT`, with headers on row 5 and permit rows starting on row 6. The application preserves the calculated business logic from the workbook:

- `F = TODAY()-K`: Muroor elapsed days
- `G = J-K`: Muroor permit duration
- `E = IFERROR(G-F,"")`: Muroor remaining days/status value
- `H/I = VLOOKUP(...Hijri-Gregorian...)`: Hijri-to-Gregorian conversion equivalent
- `N = TODAY()-Q`: elapsed work days
- `O = P-Q`: permit duration
- `M = O-N`: remaining days
- `Z = COUNTIF(...)`: dashboard status counts
- `AF = SUM(previous+1)`: serial numbering
- `AL = DATE(...) + MID(...) + ROUNDUP(...) + INT(...)`: Hijri date conversion helper
- `AQ = Q`, `AR = P`, `AS = T`, `AT = Y`, `AU = V`: reporting mirror fields

`TODAY()`-based fields are recalculated dynamically by the API so the dashboard does not freeze the workbook's import date.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Shadcn-style UI components
- Prisma
- SQLite
- ExcelJS for `.xlsx` import/export

## Current features

- Dashboard cards for total, active, expired, 7-day, 15-day, 30-day, and total length metrics
- Permit Alerts panel grouped by expired, expiring within 7 days, expiring within 15 days, expiring within 30 days, and active
- Permit table sorting by expiry date and remaining days
- Active, expired, expiring soon, contractor, and sector filters
- Clickable permit rows with a detailed permit page
- Linked document support for Google Drive, OneDrive, and direct PDF URLs
- Excel hyperlink preservation for column `Z` / `رقم التصريح`
- Export with permit links, expiry status, and remaining days
- Arabic-friendly typography and automatic dark mode

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

Open `http://localhost:3000`, import the workbook, then use the dashboard, filters, alerts, and export button.

## Project structure

```text
prisma/schema.prisma       Database schema
src/lib/formula-catalog.ts Auditable Excel formula mapping
src/lib/calculations.ts    Runtime formula recreation
src/lib/excel.ts           Excel import/export
src/app/api/*              Permit, import, and export APIs
src/components/*           Responsive UI
```
