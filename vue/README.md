# DashAI - Vue

A Vue 3 implementation of the Schematic DashAI reference app. Demonstrates how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components into a modern Vue 3 application.

## Stack

- **Vue 3** with Composition API and `<script setup>` SFCs
- **Vite** dev server and bundler
- **Vue Router 4** for client-side routing
- **Tailwind CSS v4** for styling
- **Chart.js** + `vue-chartjs` for data visualization
- **lucide-vue-next** for icons
- **Express** backend for API routes (runs alongside Vite)

## Schematic Integration

Frontend uses `@schematichq/schematic-vue`, which provides a Vue plugin and composables:

- `SchematicPlugin` (registered in `main.ts`)
- `useSchematicEvents()` for `identify()` and `track()`
- `useSchematicEntitlement(key)` for feature gating (seat limits, data source allocations)
- `useSchematicIsPending()` for SDK loading state

Backend (`server/server.ts`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens, fetch credit balance, and update traits when team members or data sources change.

The `/plan` and `/pricing` pages render `@schematichq/schematic-components` (a React library) inside a Vue component. `src/components/SchematicEmbed.vue` is a small bridge that mounts the React embed via `createRoot()` and tears it down on unmount. This is the same pattern used in the Angular app.

## Setup

Install dependencies for both the app and the server:

```bash
yarn install
cd server && yarn install && cd ..
```

Copy the env templates and fill them in with keys from your Schematic dashboard:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Frontend (`.env`):

```
VITE_SCHEMATIC_PUBLISHABLE_KEY=api_...
VITE_SCHEMATIC_COMPONENT_ID=cmpn_...       # Usage component for /plan page
VITE_SCHEMATIC_PRICING_TABLE_ID=cmpn_...   # Pricing table for /pricing page
```

Backend (`server/.env`):

```
SCHEMATIC_SECRET_KEY=sch_dev_...
SCHEMATIC_API_URL=                          # Optional, leave blank for default
```

## Running

```bash
yarn dev
```

This starts two processes via `concurrently`:
- Vite dev server on `http://localhost:5173`
- Express API server on `http://localhost:3001`

Vite proxies `/api/*` to the Express server (see `vite.config.ts`).

## Building

```bash
yarn build
```

Outputs to `dist/`. Note that `yarn build` only builds the frontend. To deploy, you also need to host the `server/` directory as a standalone Node process (or port it to your platform's serverless runtime).

## Project Structure

```
vue/
  src/
    main.ts                    # Vue app entry, registers SchematicPlugin
    App.vue                    # Root: AppHeader + RouterView, calls identify()
    router/                    # Vue Router config
    composables/useApi.ts      # fetch wrappers for /api endpoints
    components/
      AppHeader.vue            # Top nav, credits badge, loading state
      CreditsBadge.vue         # Remaining credits display
      PromptInput.vue          # Prompt UI with track() call
      GeneratedDashboard.vue   # 4 Chart.js charts
      SchematicEmbed.vue       # React-in-Vue bridge for embed components
    pages/
      HomePage.vue             # Prompt input
      DashboardPage.vue        # Charts
      TeamPage.vue             # CRUD + user-seat entitlement
      DataSourcesPage.vue      # CRUD + data-sources entitlement
      PlanPage.vue             # SchematicEmbed usage component
      PricingPage.vue          # SchematicEmbed pricing table
  server/
    server.ts                  # Express API
    package.json               # Server-only deps
  data/                        # JSON file storage for users and data sources
```

## Notes

**Composition API only.** This app uses Vue 3's Composition API (`<script setup>` with `ref`, `computed`, `onMounted`). The Schematic SDK composables return reactive refs, so they also work from the Options API if you call them inside `setup()`. If you need Options API examples, the composables compose cleanly into `data()` and `computed` via their returned refs.

**Nuxt / SSR.** The Schematic SDK is client-only: it accesses `window` and browser storage during initialization. If you're using Nuxt or another SSR framework, wrap Schematic-using components in `<ClientOnly>` or register the plugin from a `client`-only plugin file (`~/plugins/schematic.client.ts`). The embed components from `@schematichq/schematic-components` are React-based and also must render client-side.

**No auth.** Unlike the React version (which uses Clerk), this demo uses a hardcoded identify call to `id: 'demo'` on mount. Swap in your auth provider by replacing the `identify()` call in `App.vue`.

## Reference

- [Schematic Vue SDK](https://github.com/SchematicHQ/schematic-js/tree/main/vue)
- [Schematic documentation](https://docs.schematichq.com)
