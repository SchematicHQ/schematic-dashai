# lib/schematic — headless Schematic billing hooks

A self-contained, framework-agnostic (React-only, no Next.js imports) billing
layer over Schematic's consumer-facing APIs. This folder is the working draft
of a future published package (`@schematichq/schematic-react` or a successor to
`@schematichq/schematic-components`); keep it free of app-specific imports so
it can be lifted out wholesale.

## Architecture

```
SchematicBillingClient          one per app; owns auth + fetching
├── TokenManager                caches the 15-min temporary access token,
│                               refreshes proactively (60s margin) and on 401
├── Resource<T>                 external store: one shared fetch per endpoint,
│                               useSyncExternalStore-compatible snapshots
└── generated API clients       api/checkoutexternal + api/componentspublic
                                (openapi-generator typescript-fetch — do not
                                hand-edit; regenerate with ../../generate_openapi.sh)
```

Hooks subscribe to the client's resources, so any number of mounted hooks share
a single request:

- `useCatalog(client, { mode })` — plans/add-ons for a pricing table.
  `"public"` uses the publishable key (`GET /public/plans`); `"company"` uses
  the access token (`GET /components/hydrate`) and annotates plans with
  `current`/`valid`/`companyCanTrial`; `"auto"` (default) picks company mode
  when the client has a token.
- `useBilling(client)` — the customer's plan, subscription, payment method,
  upcoming invoice, feature usage, and credit grants. Token required; shares
  its fetch with company-mode `useCatalog`.
- `useInvoices(client, { limit, offset })` — invoice history. Token required;
  the company is resolved from the token.

All hooks return `{ data, isPending, isRefetching, error, refetch }`.

## Auth

The consumer's backend mints temporary access tokens with its secret key
(`POST /temporary-access-tokens`); the browser only ever sees the short-lived
`token_…` value. Supply a callback:

```ts
const client = new SchematicBillingClient({
  publishableKey: "api_…",                       // optional: public catalog
  getAccessToken: async () => {
    const res = await fetch("/api/accessToken"); // your backend route
    const { accessToken, expiredAt } = await res.json();
    return { token: accessToken, expiresAt: expiredAt };
  },
});
```

`client.invalidate()` marks all company-scoped data stale (mounted hooks
refetch immediately) — this is the hook point for the future `useCheckout`
mutations.

## Testing

`__tests__/` uses snake_case wire fixtures fed through the generated FromJSON
mappers and an injectable `fetchFn` — no network, no MSW. Run with
`yarn test` from the app root.
