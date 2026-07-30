# Local Setup Guide

How to run the Bus Booking System on your machine. Two paths are covered:

- **[Path A — Hybrid (recommended for development)](#path-a--hybrid-recommended)**: infrastructure (Postgres, Redis, RabbitMQ) in Docker, the apps on the host with Nx. Fast rebuilds, hot reload, easy debugging.
- **[Path B — Full Docker stack](#path-b--full-docker-stack)**: every backend service also runs in a container. Closest to production; no Node toolchain needed to run the services.
- **[Path C — No Docker at all](#path-c--no-docker-at-all)**: install Postgres, Redis and RabbitMQ natively. Use only if Docker is unavailable.

The frontends (`dashboard-web`, `passenger-web`) and the mobile app (`passenger-mobile`) are always run on the host with Nx/Expo — they are not part of the Docker Compose stack.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20+ (22 recommended) | Docker images use Node 22 |
| pnpm | 10.34.5 | run `corepack enable` to activate the pinned version |
| Docker + Docker Compose | latest | for infra and/or the full stack |
| Git | any | — |
| Expo Go | latest | only for `passenger-mobile` on a physical device |

Verify:

```sh
node -v      # v20+ 
corepack enable
pnpm -v      # 10.34.5
docker -v
```

---

## Path A — Hybrid (recommended)

### 1. Install dependencies

```sh
corepack enable
pnpm install
```

### 2. Create environment files

Environment templates are committed as `*.env.example`. The repo already ships
filled `.env` files for local dev, but if any are missing, copy them:

```sh
cp .env.example .env
# per-app examples exist too, e.g.
cp apps/auth-service/.env.example apps/auth-service/.env
```

- Root `.env` targets **localhost** with the mapped Postgres host ports (5433–5440), plus RabbitMQ and Redis on their default ports.
- Each backend app also loads its own `apps/<service>/.env`.

The default local `JWT_SECRET` is fine for development. **Change it for anything reachable from a network.**

### 3. Start infrastructure in Docker

Only the databases, broker and cache — not the services:

```sh
docker compose up -d rabbitmq redis \
  postgres-auth postgres-user postgres-route-maps postgres-bus-seat \
  postgres-booking postgres-payment postgres-modification postgres-notification
```

Check they are healthy:

```sh
docker compose ps
```

RabbitMQ management UI is at http://localhost:15672 (`bus` / `bus`).

### 4. Create schemas and seed data

Each service owns its own database, so schema push + seed run per service. The
helper does all eight in order:

```sh
pnpm db:setup      # push all Prisma schemas, then seed (first-time setup)
```

Individual steps:

| Script | Description |
| --- | --- |
| `pnpm db:push` | Sync every Prisma schema to its database |
| `pnpm db:seed` | Insert initial + sample data (idempotent, safe to re-run) |
| `pnpm db:reset` | Drop and recreate all tables (**destroys data**) |
| `pnpm db:setup` | `db:push` followed by `db:seed` |

**Seed logins** — all use password `Password123!`:

| Phone | Role |
| --- | --- |
| `0770000001` | `ADMIN_STAFF` |
| `0770000002` | `CUSTOMER_STAFF` |
| `0771111111` | `PASSENGER` |
| `0772222222` | `PASSENGER` |

### 5. Start the backend services

Serve all nine at once:

```sh
npx nx run-many -t serve --projects=api-gateway,auth-service,user-service,route-maps-service,bus-seat-service,booking-service,payment-service,modification-service,notification-service
```

Or serve one at a time (each in its own terminal) while debugging:

```sh
npx nx serve api-gateway
npx nx serve booking-service
# …etc
```

### 6. Start the frontends

```sh
pnpm dev:dashboard        # dashboard-web     → http://localhost:3100
pnpm dev:passenger-web    # passenger-web     → http://localhost:3200
pnpm start:mobile         # passenger-mobile  (Expo dev server)
```

### 7. Verify

- API gateway health: http://localhost:3000/api (or the service health endpoint).
- Dashboard: http://localhost:3100 — log in with `0770000001` / `Password123!`.
- Passenger web: http://localhost:3200 — log in with `0771111111` / `Password123!`, search a trip, pick seats.
- Seat locking is realtime over the booking WebSocket on port **3020**.

---

## Path B — Full Docker stack

Runs the eight domain services + gateway in containers alongside infra. You still
run the Next.js frontends on the host.

### 1. Set a JWT secret

Compose reads `${JWT_SECRET}` from the root `.env` (falls back to
`change-me-in-production`). Set a real value:

```sh
# in .env
JWT_SECRET=<a-long-random-string>
```

### 2. Build and start everything

```sh
docker compose up --build          # foreground
docker compose up --build -d       # detached
```

The first build is slow (each image installs the workspace once); later builds
reuse the pnpm store cache mount and Docker layer cache.

### 3. Seed the databases

The containers point at the in-network Postgres hosts, but the seed scripts run
from the host against the **mapped host ports** (5433–5440), which are the same
databases. So seeding is identical:

```sh
pnpm install        # only needed once, to run tsx locally
pnpm db:setup
```

### 4. Run the frontends on the host

```sh
pnpm dev:dashboard
pnpm dev:passenger-web
```

They talk to the gateway at `http://localhost:3000/api` (from the root `.env`),
which is published by the `api-gateway` container.

### Managing the stack

```sh
docker compose ps                  # status
docker compose logs -f booking-service
docker compose build               # build only, no run
docker compose down                # stop (keep DB volumes)
docker compose down -v             # stop + wipe all databases
```

Inside containers, services reach each other via Docker DNS names (`rabbitmq`,
`postgres-auth`, `auth-service`, …) as configured in `docker-compose.yml`.

---

## Path C — No Docker at all

Only if you cannot use Docker. You must provide Postgres 16, Redis 7 and
RabbitMQ 3 yourself.

### 1. Install the infrastructure natively

- **PostgreSQL 16**, **Redis 7**, **RabbitMQ 3** (with the management plugin).
- On macOS: `brew install postgresql@16 redis rabbitmq`.
- On Windows: use the official installers or WSL2.

### 2. Create the eight databases

Each service needs its own database. Create them with one Postgres instance
(default port 5432) and distinct database names:

```sql
CREATE ROLE bus WITH LOGIN PASSWORD 'bus' SUPERUSER;
CREATE DATABASE auth_db          OWNER bus;
CREATE DATABASE user_db          OWNER bus;
CREATE DATABASE route_maps_db    OWNER bus;
CREATE DATABASE bus_seat_db      OWNER bus;
CREATE DATABASE booking_db       OWNER bus;
CREATE DATABASE payment_db       OWNER bus;
CREATE DATABASE modification_db  OWNER bus;
CREATE DATABASE notification_db  OWNER bus;
```

### 3. Point the environment at your instance

Edit the root `.env` so every `*_DATABASE_URL` uses **your** host/port (a single
local Postgres is usually `localhost:5432`), and set `RABBITMQ_URL` / `REDIS_URL`
to your services:

```sh
AUTH_DATABASE_URL=postgresql://bus:bus@localhost:5432/auth_db
USER_DATABASE_URL=postgresql://bus:bus@localhost:5432/user_db
# …one line per database…
RABBITMQ_URL=amqp://bus:bus@localhost:5672
REDIS_URL=redis://localhost:6379
```

Make sure the matching `apps/<service>/.env` files agree.

### 4. Seed and run

```sh
pnpm install
pnpm db:setup
npx nx run-many -t serve --projects=api-gateway,auth-service,user-service,route-maps-service,bus-seat-service,booking-service,payment-service,modification-service,notification-service
pnpm dev:dashboard
pnpm dev:passenger-web
```

---

## Service ports

| Host port | Service |
| --- | --- |
| 3000 | api-gateway |
| 3001 | auth-service |
| 3002 | user-service |
| 3003 | route-maps-service |
| 3004 | bus-seat-service |
| 3020 | booking-service (HTTP + WebSocket) |
| 3006 | payment-service |
| 3007 | modification-service |
| 3008 | notification-service |
| 3100 | dashboard-web |
| 3200 | passenger-web |
| 5672 / 15672 | RabbitMQ / management UI |
| 6379 | Redis |
| 5433–5440 | Per-service Postgres |

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `pnpm` version mismatch | `corepack enable` then re-run; the repo pins `pnpm@10.34.5` |
| Service can't reach DB | Confirm the Postgres container is healthy (`docker compose ps`) and the port matches `.env` |
| `db:push` fails to connect | Infra not up yet — start it and wait for health, then retry |
| Gateway returns 502 for a route | The downstream service isn't running — start it via `nx serve` |
| Seat selection not updating live | Ensure `booking-service` (port 3020) is running and `NEXT_PUBLIC_WS_URL` points to it |
| RabbitMQ auth errors | Credentials are `bus` / `bus`; check `RABBITMQ_URL` |
| Ports already in use | Stop the conflicting process or change the mapped ports in `docker-compose.yml` / `.env` |
| Want a clean slate | `docker compose down -v` then `pnpm db:setup` |
