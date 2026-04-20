# DashAI - React (Next.js)

The reference implementation of Schematic DashAI. A Next.js app demonstrating how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components. This version is hosted at [schematic-dashai.vercel.app](https://schematic-dashai.vercel.app/) and is the canonical source for the Angular and Vue ports.

> **This is a reference implementation, not a standalone quickstart.** The app assumes a Schematic workspace configured with the specific features, plans, entitlements, and embedded components this demo expects. If you want to get Schematic running in your own app, follow the [Schematic quickstart](https://docs.schematichq.com) instead. What follows is for reading and referencing the code.

## Stack

- Built on **Next.js 16** (App Router) and **React 19**.
- Authentication is handled by **Clerk**.
- Styling uses **Tailwind CSS v4** with **shadcn/ui** components.
- Charts are rendered with **Recharts**; icons come from **lucide-react**.
- Persistent storage uses **Vercel Blob** in production and local JSON files in development.

## Schematic Integration

Frontend uses `@schematichq/schematic-react`, which provides a provider and hooks:

- `SchematicProvider` (wrapped around the app in `client-wrapper.tsx`)
- `useSchematicEvents()` for `identify()` and `track()`
- `useSchematicEntitlement(key)` for feature gating (seat limits, data source allocations)
- `useSchematicIsPending()` for SDK loading state
- `useSchematicFlag(key)` for boolean feature flags

Backend (Next.js API routes in `app/api/`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens, fetch credit balance, update traits, and run the daily usage cron.

The `/plan` and `/pricing` pages render `@schematichq/schematic-components` directly. Because the embedded components are themselves a React library, no bridge is needed here — the Angular and Vue ports each wrap these same components in a small `createRoot()` bridge.

## Project Structure

```
react/
  app/
    api/
      accessToken/             # Issue embed access tokens
      credit-balance/          # Fetch current credit usage
      data-sources/            # CRUD for data sources, updates trait
      users/                   # CRUD for team members, updates trait
      cron/seed-usage/         # Daily cron to backfill events
    dashboard/                 # Charts
    data-sources/              # CRUD UI + data-sources entitlement
    team/                      # CRUD UI + user-seat entitlement
    plan/                      # SchematicEmbed usage component
    pricing/                   # SchematicEmbed pricing table
    page.tsx                   # Home (prompt input)
    layout.tsx                 # Root layout with providers
    globals.css                # Tailwind + dark theme
  components/
    app-header.tsx             # Top nav, credits badge, loading state, Clerk user button
    client-wrapper.tsx         # ClerkProvider + SchematicProvider
    credits-badge.tsx          # Remaining credits display
    prompt-input.tsx           # Prompt UI with track() call
    generated-dashboard.tsx    # Recharts visualizations
    ui/                        # shadcn/ui components
  lib/
    json-store.ts              # Vercel Blob / local JSON abstraction
  middleware.ts                # Clerk auth protection
  scripts/                     # Seed scripts for demo data
  vercel.json                  # Cron schedule
```

## Notes

**Client Components.** All pages that call Schematic hooks (`useSchematicEntitlement`, `useSchematicEvents`, `useSchematicIsPending`) need the `"use client"` directive. Check existing pages as examples.

**SSR considerations.** The Schematic JS SDK is client-only: it accesses `window` and browser storage during initialization. Don't import the React provider or hooks from server components. If you use React Server Components (RSC) heavily, keep Schematic logic in a client boundary marked with `"use client"`.

**Data persistence.** In production the data routes write to Vercel Blob (configured via `BLOB_READ_WRITE_TOKEN`); locally they write to `data/*.json`. See `lib/json-store.ts` for the abstraction.

**Daily usage cron.** `app/api/cron/seed-usage/route.ts` runs daily (configured in `vercel.json`) to simulate usage events for the demo companies in `scripts/companies.json`. Protected by `CRON_SECRET`.

**Auth.** This is the only version of the app that uses real authentication (via Clerk). The Angular and Vue versions use a hardcoded demo identity instead.

## Reference

- [Schematic documentation](https://docs.schematichq.com)
- React SDK: [`@schematichq/schematic-react`](https://www.npmjs.com/package/@schematichq/schematic-react) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/react))
- Node backend SDK: [`@schematichq/schematic-typescript-node`](https://www.npmjs.com/package/@schematichq/schematic-typescript-node) ([source](https://github.com/SchematicHQ/schematic-typescript-node))
- Embedded components: [`@schematichq/schematic-components`](https://www.npmjs.com/package/@schematichq/schematic-components) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/components))
