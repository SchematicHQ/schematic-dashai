# DashAI - Vue

A Vue 3 implementation of the Schematic DashAI reference app. Demonstrates how to integrate Schematic feature flags, entitlements, usage tracking, and embedded billing components into a modern Vue 3 application.

> **This is a reference implementation, not a standalone quickstart.** The app assumes a Schematic workspace configured with the specific features, plans, entitlements, and embedded components this demo expects. If you want to get Schematic running in your own app, follow the [Schematic quickstart](https://docs.schematichq.com) instead. What follows is for reading and referencing the code.

## Stack

- Built with **Vue 3** using the Composition API and `<script setup>` SFCs.
- **Vite** powers the dev server and production bundler.
- **Vue Router 4** handles client-side routing.
- Styling uses **Tailwind CSS v4**.
- Charts are rendered with **Chart.js** via **vue-chartjs**; icons come from **lucide-vue-next**.
- An **Express** backend runs alongside Vite to handle API routes.

## Schematic Integration

Frontend uses `@schematichq/schematic-vue`, which provides a Vue plugin and composables:

- `SchematicPlugin` (registered in `main.ts`)
- `useSchematicEvents()` for `identify()` and `track()`
- `useSchematicEntitlement(key)` for feature gating (seat limits, data source allocations)
- `useSchematicIsPending()` for SDK loading state

Backend (`server/server.ts`) uses `@schematichq/schematic-typescript-node` to issue embed access tokens and update traits when team members or data sources change.

The `/plan` and `/pricing` pages render `@schematichq/schematic-components` (a React library) inside a Vue component. `src/components/SchematicEmbed.vue` is a small bridge that mounts the React embed via `createRoot()` and tears it down on unmount. This is the same pattern used in the Angular app.

## What this port leaves out

This is a reference implementation focused on showing the Vue SDK integration. A few pieces of the full React app are intentionally stubbed or omitted to keep the code focused:

- **Auth.** No real auth provider. `App.vue` calls `identify()` with a hardcoded `id: 'demo'` on mount. Swap in your auth provider by replacing that call.
- **Persistent storage.** The server writes team members and data sources to JSON files in `data/`. There's no production storage backend (no blob storage, no database). Fine for local demo; replace `server/server.ts`'s file I/O with your storage of choice before deploying.
- **Daily usage cron.** The production app has a scheduled job that backfills usage events; this port does not include one. Events only fire from client `track()` calls.

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

## Reference

- [Schematic documentation](https://docs.schematichq.com)
- Vue SDK: [`@schematichq/schematic-vue`](https://www.npmjs.com/package/@schematichq/schematic-vue) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/vue))
- Node backend SDK: [`@schematichq/schematic-typescript-node`](https://www.npmjs.com/package/@schematichq/schematic-typescript-node) ([source](https://github.com/SchematicHQ/schematic-typescript-node))
- Embedded components: [`@schematichq/schematic-components`](https://www.npmjs.com/package/@schematichq/schematic-components) ([source](https://github.com/SchematicHQ/schematic-js/tree/main/components))
