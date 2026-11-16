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
- `useSchematicCreditSpendPolicies()` for credit spend limits: a hover card on the credits badge, and a spend-limit banner instead of "Buy more credits" when a limit, not the balance, blocks the next prompt

Backend (Next.js API routes in `app/api/`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens, update traits, and run the daily usage cron, and sends inference events for the AI features.

## Inference pricing

The two AI features bill the model calls they make through [inference pricing](https://docs.schematichq.com/billing/inference-pricing). DashAI doesn't call a real model, so [lib/fake-inference.ts](lib/fake-inference.ts) invents the usage each call would report (in Anthropic's shape). Everything after that is what a real app would do: the API route sends one inference event per model call, with the secret key, after the response goes out.

| Feature | Where | Event name / flag key | How it burns credits |
|---|---|---|---|
| Dashboard Prompt (AI) | Builder, Generate ([app/api/generate](app/api/generate/route.ts)) | `dashboard-prompt` / `dashboard-prompt-ai` | Per token, with separate rates for each model. A generation is 2 to 5 calls (plan, build, one per analysis toggle), around 80k to 140k tokens, mostly cached context. |
| Validate Data Source | Data Sources, Validate ([app/api/data-sources/validate](app/api/data-sources/validate/route.ts)) | `validate-data-source` | A flat 5 credits per call (consumption rate only, token rates blank). It's one Sonnet call costing about 1¢, and Schematic still records the tokens and the cost. |

Things to know:

- Inference events need the **secret** key; the events API refuses them from a publishable key. So these features go through API routes, not `track()` in the browser.
- Schematic's `input_tokens` is the whole prompt, cache reads and writes included. Anthropic's leaves them out, so [lib/inference-events.ts](lib/inference-events.ts) adds them back.
- The event's `event` name is what ties it to a feature. An inference event without one is costed but burns nothing.
- [lib/inference-events.ts](lib/inference-events.ts) posts the event JSON itself rather than calling `events.createEvent`, because the Node SDK serializes an inference body that has an `event` name as a track event and drops the token fields.
- The older `Dashboard Prompt` feature (track events, flag `dashboard-prompt`) is still what the Vue and Angular apps and the usage cron use.

Schematic setup (DashAI dev environment): a `DashAI Credits` credit worth $0.01, both features on `Inference Pricing Plan` with a 2,000 credit monthly grant, and the `demo` company on that plan. Dashboard prompt rates are 3x Anthropic's list price. A default Sonnet generation costs about 15¢ in model calls and burns about 40 credits (Opus about 80, Haiku about 2). The events page shows cost per model call, so a generation's cost is split across its 3 to 5 events.

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
      data-sources/            # CRUD for data sources, updates trait
        validate/              # Validate a source (flat-rate inference feature)
      generate/                # Generate a dashboard (per-token inference feature)
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
    prompt-input.tsx           # Prompt UI, calls /api/generate
    generated-dashboard.tsx    # Recharts visualizations
    ui/                        # shadcn/ui components
  lib/
    json-store.ts              # Vercel Blob / local JSON abstraction
    models.ts                  # Model picker list, inference event names, flag keys
    fake-inference.ts          # Fake model usage for the AI features
    inference-events.ts        # Sends inference events to Schematic
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

- [Schematic React SDK](https://github.com/SchematicHQ/schematic-js/tree/main/react)
- [Schematic documentation](https://docs.schematichq.com)
