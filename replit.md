# NovaDoc EHR Financial & Queue Dashboard

## Overview

pnpm workspace monorepo. Primary artifact: `artifacts/ehr-dashboard` — a pure React+Vite EHR dashboard (no backend, all state is in-memory with cross-tab sync via BroadcastChannel + localStorage).

## EHR Dashboard Features

### Financial Transactions Dashboard (`/`)
- Transaction table with filters, search, export

### Queue Management (`/queue/token/*`)
- **Single Queue** (`/queue/token/single`) — walk-in, auto-increment tokens
- **Partitioned Queue** (`/queue/token/partitioned`) — per-doctor, multi-partition
- **Multi-Step Visit** (`/queue/token/multistep`) — hospital OPD with step-by-step patient flow. Uses shared state hook.
- **Front Desk User** (`/queue/frontdesk`) — registration counter view:
  - FIFO queue (only first token callable)
  - 30-second call window → Register (walk-in) or Billing (named patient)
  - Max 3 call attempts → auto-skip
  - Skipped tokens slide-up panel with Recall
  - **Right-hand drawer** (40% width default, full-screen toggle) replaces center modal for all three panels:
    - Registration drawer: search existing / register new patient
    - Billing drawer: payment method, quick-amount chips, mark complete
  - Real-time cross-tab sync with Multi-Step Visit via BroadcastChannel API
  - Rollback checkpoint: `ee11f519` (pre-drawer design)

### Admin Settings (`/admin`)
- Departments, doctors, billing types, branches, queue setup (visit types, counters, behavior, display screens)
- **Queue Behavior > Billing Settings**: dynamic per-counter billing toggles grouped by counter type (persisted to localStorage `ehr-billing-counters` as `Record<counterId, boolean>`; migrates from legacy `ehr-billing-reg` key automatically)
- **Service Pricing**: service list is entirely catalog-derived (Lab → `ehr-lab-sections-v1`, Procedures → `ehr-procedure-sections-v1`, Pharmacy → `ehr-formulary-catalogue-v1`, Consumables → `ehr-consumables-catalogue-v1`, Imaging → `ehr-imaging-catalogue-v1`, Vaccine → `ehr-vaccine-sections-v1`). Pricing overrides (providerPrices, active, taxable, dept assignment) persisted separately to `ehr-service-pricing-v1` as `Record<itemId, PricingOverride>`. No manual add/delete of services — catalog modules are the source of truth.

## Cross-Tab State Sync Architecture

Shared queue state: `src/hooks/useMultiStepQueue.ts`
- Channel name: `ehr-multistep-queue-v2`
- localStorage keys: `ehr-queue-v2` (queue), `ehr-queue-nums-v2` (token counters)
- Both `QueueTokenMultiStep` and `FrontDeskUser` import this hook — changes in one tab propagate instantly to the other

## Primary Accent Color: `#4982CF`
## Status Model: `"waiting" | "called" | "completed"`
- `called` = patient physically at counter (triggered by staff action)
- `skipped` = separate boolean field on each entry

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
