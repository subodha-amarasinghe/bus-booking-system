# AGENT.md — Bus Booking System

Guidance for AI agents and contributors working in this Nx monorepo.

## Overview

Multi-service bus booking platform:

- **Backend**: NestJS microservices communicating over **RabbitMQ** events + HTTP via an API gateway.
- **Staff UI**: `dashboard-web` (Next.js 14 App Router).
- **Passenger apps**: `passenger-web` (Next.js 14) and `passenger-mobile` (Expo Router).
- **Shared libs**: `shared-types` (Zod SSOT), `shared-events` (event names), `shared-utils`, `passenger-core` (framework-agnostic passenger logic).

## Layout

| Path | Purpose |
| --- | --- |
| `apps/api-gateway` | HTTP entry, JWT auth, routing to services |
| `apps/auth-service` | Credentials / tokens (Postgres) |
| `apps/user-service` | User profiles (Postgres) |
| `apps/route-maps-service` | Routes & maps (Postgres) |
| `apps/bus-seat-service` | Buses, seat layouts, trips (Postgres) |
| `apps/booking-service` | Bookings, seat locks, Redis, WebSocket on 3020 |
| `apps/payment-service` | Payments (Postgres) |
| `apps/modification-service` | Cancellations / refunds (Postgres) |
| `apps/notification-service` | Email/SMS via SMTP (Postgres) |
| `apps/dashboard-web` | Staff dashboard (port 3100) |
| `apps/passenger-web` | Passenger web app |
| `apps/passenger-mobile` | Expo passenger app |
| `libs/shared-types` | Zod schemas + inferred types (single source of truth) |
| `libs/shared-events` | RabbitMQ routing keys / event name constants |
| `libs/shared-utils` | Shared helpers |
| `libs/passenger-core` | Framework-agnostic hooks/store/socket logic |

## Conventions (must follow)

### Dependency injection
- Constructor injection only in Nest services/controllers/repositories.
- No `@Inject()` property injection or `ModuleRef.get` for routine wiring.

### Validation & types
- **Zod is the single validation source of truth.** Define schemas in `libs/shared-types`, derive types with `z.infer`.
- Do not duplicate DTO/entity types outside `libs/shared-types`.
- Validate at boundaries (HTTP, RPC, events) with shared Zod schemas.
- Import `ZodValidationPipe` from `@bus-booking/shared-types/nest` only — never from the main entry (frontends must not pull Nest).

### Messaging
- RabbitMQ event names / routing keys must be imported from `@bus-booking/shared-events`. Never hard-code event strings.

### Data model
- UUID primary keys for all persisted entities.
- Isolate Prisma behind the **repository pattern** — no direct Prisma calls in application/domain code.
- Prisma 7 with the `PrismaPg` driver adapter; connection URL comes from `prisma.config.ts` (CLI) and `DATABASE_URL` at runtime.

### Frontend
- Dashboard and passenger apps consume Zod schemas from `@bus-booking/shared-types`.
- `passenger-web` / `passenger-mobile` share logic through `@bus-booking/passenger-core` (no `react-native` or `next/*` imports allowed in that lib).
- Auth uses HttpOnly cookies + Next.js Route Handler proxy; JWTs never reach client JS.

## Tooling

- **Package manager**: pnpm 10 (`packageManager: pnpm@10.34.5`). Node 20+ (Docker uses 22).
- Workspace settings (`overrides`, `allowBuilds`) live in `pnpm-workspace.yaml` (pnpm 10+ only).

## Common commands

```sh
pnpm install

# Infra (RabbitMQ, Redis, Postgres x8)
docker compose up -d rabbitmq redis postgres-auth postgres-user postgres-route-maps \
  postgres-bus-seat postgres-booking postgres-payment postgres-modification postgres-notification

# Backend service (repeat per app)
npx nx serve api-gateway

# Build all Nest apps
pnpm build:backend

# Frontends
pnpm dev:dashboard        # http://localhost:3100
pnpm dev:passenger-web
pnpm start:mobile         # Expo

# Full containerized stack
docker compose up --build
```

## Ports

| Port | Service |
| --- | --- |
| 3000 | api-gateway |
| 3001 | auth-service |
| 3002 | user-service |
| 3003 | route-maps-service |
| 3004 | bus-seat-service |
| 3006 | payment-service |
| 3007 | modification-service |
| 3008 | notification-service |
| 3020 | booking-service (HTTP + WS) |
| 3100 | dashboard-web |
| 5672 / 15672 | RabbitMQ / management UI |
| 6379 | Redis |
| 5433–5440 | Per-service Postgres |

## Environment

- Root `.env` = local dev (`localhost`, mapped Postgres ports); `.env.production` = Docker DNS names.
- Each app has its own `.env` / `.env.production` / `.env.example`.
- Only `*.env.example` files are committed; real `.env*` are gitignored.

## Docker build model

- Backend apps have a minimal `package.json` declaring only `tslib` (needed because `importHelpers: true` emits `require('tslib')`).
- Dockerfiles: install full workspace + `nx build` in a builder stage, then `pnpm install --prod --frozen-lockfile --ignore-scripts` against the pruned `dist/` manifest in the runner.
- `--ignore-scripts` in the runner avoids Prisma engine downloads the driver-adapter client never uses.

## Verification before finishing

- `nx run-many -t build` (backends) and `nx build dashboard-web` / `nx build passenger-web` should compile with no TS errors.
- `passenger-core` must contain zero `react-native` or `next/*` imports.
- Do not `nx build passenger-mobile` (Expo builds via EAS); use `nx start passenger-mobile`.
