# DashAI - Angular

An Angular implementation of the Schematic DashAI reference app. Demonstrates how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components into a modern Angular application.

> **This is a reference implementation, not a standalone quickstart.** The app assumes a Schematic workspace configured with the specific features, plans, entitlements, and embedded components this demo expects. If you want to get Schematic running in your own app, follow the [Schematic quickstart](https://docs.schematichq.com) instead. What follows is for reading and referencing the code.

## Stack

- Built with **Angular 21** using standalone components and the **Angular CLI** build tooling.
- Styling uses **Tailwind CSS v4**.
- Charts are rendered with **Chart.js** via **ng2-charts**; icons come from **lucide-angular**.
- An **Express** backend runs alongside `ng serve` to handle API routes.

## Schematic Integration

Frontend uses `@schematichq/schematic-angular`, which provides an injectable service:

- `provideSchematic({ publishableKey })` registered in `app.config.ts`
- `SchematicService.identify()` / `.track()` for events
- `SchematicService.entitlement$(key)` returns an observable of `{ value, featureAllocation, featureUsage, ... }`
- `SchematicService.isPending$()` observable for SDK loading state
- `SchematicService.plan$()` for current plan info

The pricing and plan pages intentionally demonstrate *both* patterns side by side: observable with `async` pipe and `toSignal()` converted signal. Use whichever fits your codebase.

Backend (`server/server.ts`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens, fetch credit balance, and update traits when team members or data sources change.

The `/plan` and `/pricing` pages render `@schematichq/schematic-components` (a React library) inside an Angular component. `src/app/components/schematic-embed/` is a small bridge that mounts the React embed via `createRoot()` and tears it down on destroy.

## What this port leaves out

This is a reference implementation focused on showing the Angular SDK integration. A few pieces of the full React app are intentionally stubbed or omitted to keep the code focused:

- **Auth.** No real auth provider. `IdentityService.initialize()` calls `identify()` with a hardcoded `id: 'demo'` on bootstrap. Swap in your auth provider by replacing that call.
- **Persistent storage.** The server writes team members and data sources to JSON files in `data/`. There's no production storage backend (no blob storage, no database). Fine for local demo; replace `server/server.ts`'s file I/O with your storage of choice before deploying.
- **Daily usage cron.** The production app has a scheduled job that backfills usage events; this port does not include one. Events only fire from client `track()` calls.

## Project Structure

```
angular/
  src/app/
    app.ts                     # Root component
    app.config.ts              # provideSchematic registration
    app.routes.ts              # Route definitions
    components/
      header/                  # Top nav, plan display, isPending loading
      credits-badge/           # Remaining credits display
      prompt-input/            # Prompt UI with track() call
      generated-dashboard/     # 4 Chart.js charts
      schematic-embed/         # React-in-Angular bridge for embed components
    pages/
      home/                    # Prompt input
      dashboard/               # Charts
      team/                    # CRUD + user-seat entitlement
      data-sources/            # CRUD + data-sources entitlement
      plan/                    # SchematicEmbed usage component (observable pattern)
      pricing/                 # SchematicEmbed pricing table (signal pattern)
    services/
      identity.service.ts      # Wraps identify() call
      schematic-api.service.ts # HttpClient wrapper for /api endpoints
  server/
    server.ts                  # Express API
    package.json               # Server-only deps
  data/                        # JSON file storage for users and data sources
```

## Notes

**Observable vs signal patterns.** The Angular SDK exposes everything as RxJS observables. Components in this app demonstrate both conventions:
- Observables used directly with `async` pipe in templates (e.g., `header.component.ts`, `plan.component.ts`)
- Observables converted to signals via `toSignal()` (e.g., `pricing.component.ts`)

Both patterns work. Pick the one that matches your team's style.

## Reference

- [Schematic documentation](https://docs.schematichq.com)
- Angular SDK: [`@schematichq/schematic-angular`](https://www.npmjs.com/package/@schematichq/schematic-angular) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/angular))
- Node backend SDK: [`@schematichq/schematic-typescript-node`](https://www.npmjs.com/package/@schematichq/schematic-typescript-node) ([source](https://github.com/SchematicHQ/schematic-typescript-node))
- Embedded components: [`@schematichq/schematic-components`](https://www.npmjs.com/package/@schematichq/schematic-components) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/components))
