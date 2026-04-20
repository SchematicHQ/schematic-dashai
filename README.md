# Schematic DashAI

DashAI is a reference app that shows how to integrate [Schematic](https://schematichq.com) into a real application. It exists to give developers a working, end-to-end example they can copy from when adopting Schematic in their own product.

The **React version** is the one we use for Schematic demos and is hosted at [schematic-dashai.vercel.app](https://schematic-dashai.vercel.app/). The **Angular** and **Vue** versions are ports of the same app, provided as reference implementations for teams working on those stacks.

## What each implementation demonstrates

Every version wires up the same Schematic building blocks in the framework's native idioms:

- Calling **`identify()`** on login to associate the current user with a Schematic company and user record.
- Calling **`track()`** to send usage events from the client (credits consumed when a dashboard is generated).
- Using the framework SDK's **entitlement and flag API** to gate seat limits, data source allocations, and feature access.
- Rendering Schematic's **embedded components** (pricing table and usage / plan view) inline inside the app.
- Issuing **backend access tokens** from a Node server so embedded components can authenticate without exposing the secret key.

## Implementations

| Framework | Folder |
|-----------|--------|
| React (Next.js) | `react/` |
| Angular | `angular/` |
| Vue | `vue/` |

Each folder is a self-contained project with its own dependencies, build configuration, and README.

## These are reference implementations, not a quickstart

These apps aren't intended to be run standalone. They assume a specific Schematic workspace setup (features, plans, entitlements, and embedded components configured to match the demo data), so even with valid API keys the UI won't behave like the hosted demo without that matching configuration.

If you want to get hands-on with Schematic in your own app, start with the [Schematic quickstart](https://docs.schematichq.com) instead. This repo is here to be read and copied from.

## Schematic resources

[Schematic documentation](https://docs.schematichq.com) is the canonical reference for the concepts used in this repo (companies, users, traits, flags, entitlements, events, and embedded components).

Packages used across the three implementations:

| Purpose | Package | Source |
|---------|---------|--------|
| React frontend SDK | [`@schematichq/schematic-react`](https://www.npmjs.com/package/@schematichq/schematic-react) | [repo](https://github.com/SchematicHQ/schematic-js/tree/main/react) |
| Angular frontend SDK | [`@schematichq/schematic-angular`](https://www.npmjs.com/package/@schematichq/schematic-angular) | [repo](https://github.com/SchematicHQ/schematic-js/tree/main/angular) |
| Vue frontend SDK | [`@schematichq/schematic-vue`](https://www.npmjs.com/package/@schematichq/schematic-vue) | [repo](https://github.com/SchematicHQ/schematic-js/tree/main/vue) |
| Core JS SDK (framework-agnostic) | [`@schematichq/schematic-js`](https://www.npmjs.com/package/@schematichq/schematic-js) | [repo](https://github.com/SchematicHQ/schematic-js) |
| Node backend SDK | [`@schematichq/schematic-typescript-node`](https://www.npmjs.com/package/@schematichq/schematic-typescript-node) | [repo](https://github.com/SchematicHQ/schematic-typescript-node) |
| Embedded billing components | [`@schematichq/schematic-components`](https://www.npmjs.com/package/@schematichq/schematic-components) | [repo](https://github.com/SchematicHQ/schematic-js/tree/main/components) |
