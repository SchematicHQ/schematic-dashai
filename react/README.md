# DashAI - React (Next.js)

The reference implementation of Schematic DashAI. A Next.js app demonstrating how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components. This version is hosted at [schematic-dashai.vercel.app](https://schematic-dashai.vercel.app/) and is the canonical source for the Angular and Vue ports.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Clerk** for authentication
- **Tailwind CSS v4** + **shadcn/ui** for styling
- **Recharts** for data visualization
- **lucide-react** for icons
- **Vercel Blob** for persistent storage in production (falls back to local JSON files in dev)

## Schematic Integration

Frontend uses `@schematichq/schematic-react`, which provides a provider and hooks:

- `SchematicProvider` (wrapped around the app in `client-wrapper.tsx`)
- `useSchematicEvents()` for `identify()` and `track()`
- `useSchematicEntitlement(key)` for feature gating (seat limits, data source allocations)
- `useSchematicIsPending()` for SDK loading state
- `useSchematicFlag(key)` for boolean feature flags

Backend (Next.js API routes in `app/api/`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens, update traits, and run the daily usage cron.

## Setup

```bash
yarn install
```

Copy `.env.example` to `.env.local` and fill in keys:

```
NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY=api_...
NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID=cmpn_...       # Usage component for /plan
NEXT_PUBLIC_SCHEMATIC_PRICING_TABLE_ID=cmpn_...   # Pricing table for /pricing
SCHEMATIC_SECRET_KEY=sch_dev_...

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

BLOB_READ_WRITE_TOKEN=                             # Optional, Vercel Blob
CRON_SECRET=                                        # Required for /api/cron routes
```

## Running

```bash
yarn dev
```

Opens `http://localhost:3000`.

## Building

```bash
yarn build
yarn start
```

## Project Structure

```
react/
  app/
    api/
      accessToken/             # Issue embed access tokens
      cron/seed-usage/         # Daily cron to backfill events
      data-sources/            # CRUD for data sources, updates trait
      users/                   # CRUD for team members, updates trait
    billing/                   # Billing related example code
    dashboard/                 # Charts
    data-sources/              # CRUD UI + data-sources entitlement
    plan/                      # SchematicEmbed component
    pricing/                   # Pricing table example code
    team/                      # CRUD UI + user-seat entitlement
    globals.css                # Tailwind + dark theme
    layout.tsx                 # Root layout with providers
    page.tsx                   # Home (prompt input)
  components/
    api/                       # OpenAPI clients
    invoices/                  # Example code to render an invoices list
    payment-method/            # Example code to show and update a Stripe payment method
    plan-manager/              # Example code to render billing information
    pricing-table/             # Example code to render a pricing table
    types/                     # TODO
    ui/                        # shadcn/ui components
    utils/                     # TODO
    app-header.tsx             # Top nav, credits badge, loading state, Clerk user button
    client-wrapper.tsx         # ClerkProvider + SchematicProvider
    credits-badge.tsx          # Remaining credits display
    generated-dashboard.tsx    # Recharts visualizations
    prompt-input.tsx           # Prompt UI with track() call
    theme-provider.tsx         # NextJS theme provider
  data/
    data-sources.json          # Local sources for the Data Sources page
    users.json                 # Local users for the teams page
  lib/
    checkout.ts                # Checkout API helpers
    constants.ts               # Shared constants
    json-store.ts              # Vercel Blob / local JSON abstraction
    utils.ts                   # Generic shared utility functions
  middleware.ts                # Clerk auth protection
  scripts/                     # Seed scripts for demo data
  styles/                      # Tailwind global CSS styles
  vercel.json                  # Cron schedule
```

## Notes

**Client Components.** All pages that call Schematic hooks (`useSchematicEntitlement`, `useSchematicEvents`, `useSchematicIsPending`) need the `"use client"` directive. Check existing pages as examples.

**SSR considerations.** The Schematic JS SDK is client-only: it accesses `window` and browser storage during initialization. Don't import the React provider or hooks from server components. If you use React Server Components (RSC) heavily, keep Schematic logic in a client boundary marked with `"use client"`.

**Data persistence.** In production the data routes write to Vercel Blob (configured via `BLOB_READ_WRITE_TOKEN`); locally they write to `data/*.json`. See `lib/json-store.ts` for the abstraction.

**Daily usage cron.** `app/api/cron/seed-usage/route.ts` runs daily (configured in `vercel.json`) to simulate usage events for the demo companies in `scripts/companies.json`. Protected by `CRON_SECRET`.

**Auth.** This is the only version of the app that uses real authentication (via Clerk). The Angular and Vue versions use a hardcoded demo identity instead.

## Reference

- [Schematic React SDK](https://github.com/SchematicHQ/schematic-js/tree/main/react)
- [Schematic documentation](https://docs.schematichq.com)
