# Bus Booking System

Nx monorepo for a multi-service bus booking platform: NestJS backends, a Next.js staff dashboard, and an Expo passenger app.

## Prerequisites

- **Node.js 20+** (Docker images use Node 22)
- **pnpm 10** (`packageManager: pnpm@10.34.5`; enable with `corepack enable`)
- **Docker** / Docker Compose (infra + optional full stack)
- **Expo Go** (for `passenger-mobile` on a device)

## Architecture (brief)

| Layer | Projects |
| --- | --- |
| API edge | `api-gateway` (HTTP entry, JWT, routing) |
| Domain services | `auth-service`, `user-service`, `route-maps-service`, `bus-seat-service`, `booking-service` (WS), `payment-service`, `modification-service`, `notification-service` |
| Staff UI | `dashboard-web` (Next.js 14 App Router, port 3100) |
| Passenger web | `passenger-web` (Next.js 14 App Router) |
| Passenger app | `passenger-mobile` (Expo Router) |
| Shared libs | `shared-types` (Zod SSOT), `shared-events` (RabbitMQ event names), `shared-utils`, `passenger-core` (framework-agnostic passenger logic) |

Services communicate over **RabbitMQ** events and HTTP via the gateway. **Booking** also uses **Redis** and exposes a WebSocket on **3020**. Each domain service owns its own **Postgres** database.

## Shared libs — Zod as SSOT

Request/response shapes and domain enums live in `@bus-booking/shared-types` as Zod schemas. Do not redeclare parallel TypeScript interfaces elsewhere. Import RabbitMQ routing keys / event names from `@bus-booking/shared-events` only.

## Local development

Run the databases/broker in Docker and the apps on the host with Nx.

### 1. Install & environment

```sh
corepack enable          # ensures pnpm 10
pnpm install
```

Environment files are committed as `*.env.example`. Copy the ones you need
(the repo already ships filled `.env` files for local dev):

```sh
cp .env.example .env                       # root (compose + Nx serve)
# per-app examples exist too, e.g.
cp apps/auth-service/.env.example apps/auth-service/.env
```

- Root `.env` targets **localhost** with the mapped Postgres host ports (5433–5440).
- Each backend app loads its own `apps/<service>/.env`.

### 2. Infrastructure only

```sh
docker compose up -d rabbitmq redis postgres-auth postgres-user postgres-route-maps postgres-bus-seat postgres-booking postgres-payment postgres-modification postgres-notification
```

### 3. Create schemas & seed data

Each service owns its own database, so schema push and seeding run per service.
The helper script does all eight in order:

```sh
pnpm db:setup     # push schemas + seed (first-time setup)
```

Or run the steps individually:

| Script | Description |
| --- | --- |
| `pnpm db:push` | Sync every Prisma schema to its database |
| `pnpm db:seed` | Insert initial + sample data (idempotent, safe to re-run) |
| `pnpm db:reset` | Drop and recreate all tables (**destroys data**) |
| `pnpm db:setup` | `db:push` followed by `db:seed` |

To wipe and re-seed from scratch:

```sh
pnpm db:reset && pnpm db:seed
```

Single service only:

```sh
cd apps/auth-service
npx prisma db push
npx prisma db seed
```

#### What gets seeded

Fixtures live in `tools/seed/seed-data.ts` and use fixed UUIDs so records line
up across service databases (a booking's `userId` matches a real auth user, a
trip's `routeId` matches a real route).

| Service | Sample data |
| --- | --- |
| auth / user | 4 accounts: 1 admin, 1 customer staff, 2 passengers |
| route-maps | 5 locations (Colombo, Kandy, Galle, Jaffna, Matara), 4 routes |
| bus-seat | 3 buses + 2+2 seat layouts, 4 upcoming trips |
| booking | 4 bookings (3 confirmed, 1 cancelled) |
| payment | 4 payments (succeeded / pending / refunded) |
| modification | 1 cancellation + 1 completed refund |
| notification | 3 notification log entries |

**Seed logins** — all use password `Password123!`:

| Phone | Role |
| --- | --- |
| `0770000001` | `ADMIN_STAFF` |
| `0770000002` | `CUSTOMER_STAFF` |
| `0771111111` | `PASSENGER` |
| `0772222222` | `PASSENGER` |

Trip departures are generated relative to the current date, so seeded trips are
always in the future and show up in search.

### 4. Backend services

Serve individually (each in its own terminal):

```sh
npx nx serve api-gateway
npx nx serve auth-service
npx nx serve user-service
npx nx serve route-maps-service
npx nx serve bus-seat-service
npx nx serve booking-service
npx nx serve payment-service
npx nx serve modification-service
npx nx serve notification-service
```

Or serve several at once:

```sh
npx nx run-many -t serve --projects=api-gateway,auth-service,user-service,route-maps-service,bus-seat-service,booking-service,payment-service,modification-service,notification-service
```

### 5. Frontends

```sh
pnpm dev:dashboard        # dashboard-web  → http://localhost:3100
pnpm dev:passenger-web    # passenger-web
pnpm start:mobile         # passenger-mobile (Expo)
```

## Production build

### Build artifacts locally

```sh
# All backend services (self-contained dist/apps/<svc> with pruned package.json)
pnpm build:backend

# Or a single project
npx nx build api-gateway

# Next.js apps (production output)
npx nx build dashboard-web
npx nx build passenger-web
```

> `passenger-mobile` is not built with `nx build` — Expo apps ship via EAS.
> Use `npx nx start passenger-mobile` for local runs.

Each backend `build` emits a self-contained `dist/apps/<service>` (bundled
`main.js` plus a pruned `package.json` / `pnpm-lock.yaml`). Run one directly:

```sh
node dist/apps/api-gateway/main.js
```

### Full Docker stack

Each service has a multi-stage `Dockerfile` (build with the full workspace,
then a slim runner installing only the pruned runtime deps).

```sh
# Build images + start everything (uses root .env for ${JWT_SECRET} etc.)
docker compose up --build

# Detached
docker compose up --build -d

# Build only, no run
docker compose build

# Tear down (keep volumes)
docker compose down
# Tear down + wipe databases
docker compose down -v
```

The first build is slow (each image installs the workspace once); later builds
reuse layer cache. Inside containers, services reach each other via Docker DNS
names (`rabbitmq`, `postgres-auth`, `auth-service`, …) as configured in
`docker-compose.yml` and `*.env.production`.

## Service ports

| Host port | Service |
| --- | --- |
| 3000 | api-gateway |
| 3001 | auth-service |
| 3002 | user-service |
| 3003 | route-maps-service |
| 3004 | bus-seat-service |
| 3020 | booking-service (HTTP + WS) |
| 3006 | payment-service |
| 3007 | modification-service |
| 3008 | notification-service |
| 5672 / 15672 | RabbitMQ / management UI |
| 6379 | Redis |
| 5433–5440 | Per-service Postgres |

## Useful scripts

| Script | Description |
| --- | --- |
| `pnpm build:backend` | Build all Nest apps |
| `pnpm dev:dashboard` | Next.js dashboard on 3100 |
| `pnpm dev:passenger-web` | Next.js passenger web app |
| `pnpm start:mobile` | Expo start for passenger app |
| `pnpm db:setup` | Push all Prisma schemas, then seed |
| `pnpm db:push` | Sync all Prisma schemas |
| `pnpm db:seed` | Seed initial + sample data (idempotent) |
| `pnpm db:reset` | Drop/recreate all tables (destroys data) |
