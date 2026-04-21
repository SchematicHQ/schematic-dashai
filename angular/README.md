# DashAI - Angular

An Angular implementation of the Schematic DashAI reference app. Demonstrates how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components into a modern Angular application.

## Stack

- **Angular 21** with standalone components
- **Angular CLI** build tooling
- **Tailwind CSS v4** for styling
- **ng2-charts** / Chart.js for data visualization
- **lucide-angular** for icons
- **Express** backend for API routes (runs alongside `ng serve`)

## Schematic Integration

Frontend uses `@schematichq/schematic-angular`, which provides an injectable service:

- `provideSchematic({ publishableKey })` registered in `app.config.ts`
- `SchematicService.identify()` / `.track()` for events
- `SchematicService.entitlement$(key)` returns an observable of `{ value, featureAllocation, featureUsage, ... }`
- `SchematicService.isPending$()` observable for SDK loading state
- `SchematicService.plan$()` for current plan info

The pricing and plan pages intentionally demonstrate *both* patterns side by side: observable with `async` pipe and `toSignal()` converted signal. Use whichever fits your codebase.

Backend (`server/server.ts`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens and update traits when team members or data sources change.

The `/plan` and `/pricing` pages render `@schematichq/schematic-components` (a React library) inside an Angular component. `src/app/components/schematic-embed/` is a small bridge that mounts the React embed via `createRoot()` and tears it down on destroy.

## Setup

Install dependencies for both the app and the server:

```bash
yarn install
cd server && yarn install && cd ..
```

Fill in `src/environments/environment.development.ts` with keys from your Schematic dashboard:

```ts
export const environment = {
  schematicPublishableKey: 'api_...',
  schematicComponentId: 'cmpn_...',       // Usage component for /plan page
  schematicPricingTableId: 'cmpn_...',     // Pricing table for /pricing page
};
```

For production builds, populate `environment.ts` the same way.

Copy the server env template:

```bash
cp server/.env.example server/.env
```

Then fill in:

```
SCHEMATIC_SECRET_KEY=sch_dev_...
SCHEMATIC_API_URL=                          # Optional, leave blank for default
```

## Running

```bash
yarn dev
```

This starts two processes via `concurrently`:
- Angular dev server on `http://localhost:4200`
- Express API server on `http://localhost:3001`

The Angular dev server proxies `/api/*` to the Express server (see `proxy.conf.json`).

## Building

```bash
yarn build
```

Outputs to `dist/`. Note that `yarn build` only builds the frontend. To deploy, you also need to host the `server/` directory as a standalone Node process (or port it to your platform's serverless runtime).

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

**No auth.** Unlike the React version (which uses Clerk), this demo uses a hardcoded identify call to `id: 'demo'` on app bootstrap. Swap in your auth provider by replacing the `IdentityService.initialize()` call.

## Reference

- [Schematic Angular SDK](https://github.com/SchematicHQ/schematic-js/tree/main/angular)
- [Schematic documentation](https://docs.schematichq.com)
