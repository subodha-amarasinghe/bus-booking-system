# Production Deployment Guide

How to deploy the Bus Booking System to production — on a **single server** with
Docker Compose, or on **AWS** with managed services. Pick the section that
matches your target.

- **[Architecture recap](#architecture-recap)**
- **[Build artifacts](#build-artifacts)**
- **[Option 1 — Single VM with Docker Compose](#option-1--single-vm-with-docker-compose)**
- **[Option 2 — AWS with managed infrastructure](#option-2--aws-with-managed-infrastructure)**
- **[Frontends (Next.js) in production](#frontends-nextjs-in-production)**
- **[Configuration reference](#configuration-reference)**
- **[Operations checklist](#operations-checklist)**

---

## Architecture recap

| Layer | Component | Prod dependency |
| --- | --- | --- |
| Edge | `api-gateway` (HTTP + JWT) | public HTTPS entry |
| Services | `auth`, `user`, `route-maps`, `bus-seat`, `booking` (WS), `payment`, `modification`, `notification` | internal only |
| Broker | RabbitMQ | event bus between services |
| Cache/locks | Redis | seat-lock TTLs in `booking-service` |
| Databases | 8× Postgres (one per service) | persistent |
| Web | `dashboard-web`, `passenger-web` (Next.js 14) | public HTTPS |
| Mobile | `passenger-mobile` (Expo) | shipped via EAS/stores |

Only the **gateway** and the **two web apps** need to be internet-facing. The
booking service must be reachable over WebSocket by browsers (via the gateway or
a dedicated WSS route on port 3020).

---

## Build artifacts

Each backend `nx build` emits a self-contained `dist/apps/<service>` (bundled
`main.js` + pruned `package.json` / `pnpm-lock.yaml`). Each service also has a
multi-stage `Dockerfile` (build the workspace, then a slim Node 22 Alpine runner
that installs only pruned runtime deps).

```sh
# All backend services
pnpm build:backend

# A single service
npx nx build api-gateway

# Next.js apps (production output)
npx nx build dashboard-web
npx nx build passenger-web
```

> `passenger-mobile` is **not** built with `nx build`. Ship it with EAS
> (`eas build` / `eas submit`) or `expo export`.

---

## Option 1 — Single VM with Docker Compose

Simplest production-like deployment: one Linux VM (e.g. an EC2 instance,
Lightsail, or any VPS) running the full Compose stack. Good for staging or small
production loads. For scale/HA, use [Option 2](#option-2--aws-with-managed-infrastructure).

### 1. Provision the host

- Ubuntu 22.04+ (or Amazon Linux 2023), 4 vCPU / 8 GB RAM minimum (8 Postgres +
  RabbitMQ + Redis + 9 Node services are memory-hungry).
- Install Docker Engine + the Compose plugin.
- Open inbound **443** (and 80 for redirect) only. Keep DB/broker ports private.

### 2. Get the code and secrets

```sh
git clone <repo-url> && cd bus-booking-system
cp .env.production .env      # then EDIT — do not ship the committed sample secret
```

Set real values in `.env` (see [configuration reference](#configuration-reference)):

- `JWT_SECRET` — a fresh long random string (**never** reuse the committed one).
- Strong Postgres and RabbitMQ credentials (change the `bus:bus` defaults).
- `PAYMENT_PROVIDER_URL` / `PAYMENT_PROVIDER_KEY` — real gateway credentials.
- `SMTP_*` — a real mail provider.

> Compose currently defaults Postgres/RabbitMQ to `bus:bus`. For production,
> override the `POSTGRES_USER`/`POSTGRES_PASSWORD` and RabbitMQ env values in an
> override file and update the matching `*_DATABASE_URL` / `RABBITMQ_URL`.

### 3. Build and start

```sh
docker compose up --build -d
docker compose ps
```

### 4. Initialise databases (first deploy only)

Push schemas and seed reference data. Run from the host with a `.env` whose
`*_DATABASE_URL` values are reachable (either via published ports or by running
inside the network):

```sh
pnpm install
pnpm db:push          # schemas only
# seed reference/sample data if desired (idempotent):
pnpm db:seed
```

In real production you typically **push schemas but skip the sample seed** (or
seed only reference data like locations/routes). `db:seed` is safe to re-run.

### 5. Put a reverse proxy in front

Terminate TLS and route public traffic. Example responsibilities for Nginx /
Caddy / Traefik:

- `https://api.example.com` → `api-gateway:3000` (HTTP + WebSocket upgrade for
  `/socket.io`; proxy the booking WS on 3020 if you expose it directly).
- `https://dashboard.example.com` → dashboard-web (see [frontends](#frontends-nextjs-in-production)).
- `https://book.example.com` → passenger-web.

Enable WebSocket upgrade headers so seat-locking works over WSS.

### 6. Updates

```sh
git pull
docker compose up --build -d          # rebuild changed images, rolling restart
docker compose logs -f api-gateway
```

---

## Option 2 — AWS with managed infrastructure

Replace the self-hosted infra with managed services and run the containers on
ECS Fargate (or EKS). This is the recommended production topology.

### Managed service mapping

| Compose service | AWS replacement |
| --- | --- |
| 8× `postgres-*` | **Amazon RDS for PostgreSQL** (one instance, 8 databases, or 8 instances) |
| `redis` | **Amazon ElastiCache for Redis** |
| `rabbitmq` | **Amazon MQ for RabbitMQ** |
| service containers | **ECS Fargate** services (one task def per service) or **EKS** |
| image registry | **Amazon ECR** |
| secrets | **AWS Secrets Manager** / SSM Parameter Store |
| edge/TLS | **Application Load Balancer** + **ACM** cert |
| DNS | **Route 53** |
| web apps | **Amplify Hosting** / **Vercel** / ECS + CloudFront |

### 1. Build and push images to ECR

```sh
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com

for svc in api-gateway auth-service user-service route-maps-service \
           bus-seat-service booking-service payment-service \
           modification-service notification-service; do
  docker build -f apps/$svc/Dockerfile -t <acct>.dkr.ecr.<region>.amazonaws.com/bus/$svc:latest .
  docker push <acct>.dkr.ecr.<region>.amazonaws.com/bus/$svc:latest
done
```

(Automate this in CI — GitHub Actions / CodeBuild — using `nx affected` to build
only changed services.)

### 2. Provision managed infra

- **RDS PostgreSQL**: create the 8 databases (`auth_db`, `user_db`,
  `route_maps_db`, `bus_seat_db`, `booking_db`, `payment_db`, `modification_db`,
  `notification_db`). Enable Multi-AZ for production.
- **ElastiCache Redis**: single node or replication group; note the endpoint.
- **Amazon MQ (RabbitMQ)**: broker with credentials; note the AMQPS endpoint.
- Put everything in a **VPC** with private subnets; only the ALB is public.

### 3. Store configuration in Secrets Manager

Create secrets for `JWT_SECRET`, each `*_DATABASE_URL`, `RABBITMQ_URL` (use
`amqps://` for Amazon MQ), `REDIS_URL`, payment and SMTP credentials. Inject them
into task definitions via the `secrets` field (never bake into images).

### 4. Define ECS services

- One **task definition per service**, image from ECR, port from the
  [ports table](#configuration-reference), env/secrets injected.
- Use **AWS Cloud Map** (service discovery) so services resolve each other by
  name, matching the `*_SERVICE_URL` pattern (e.g. `http://auth-service:3001`).
- Health checks hit each service's health endpoint.
- Run schema migration as a **one-off ECS task** (`pnpm db:push`) before/at first
  deploy. Keep RDS security groups locked to the ECS tasks.

### 5. Expose the edge

- **ALB** with an **ACM** certificate → target group for `api-gateway` (3000).
- Enable **sticky sessions / WebSocket** support on the listener so the booking
  Socket.IO connection stays on one task (or run a single booking task, or use a
  Redis Socket.IO adapter if you scale it out).
- Point **Route 53** records at the ALB and the frontends.

### 6. Scaling notes

- Stateless services (`auth`, `user`, `route-maps`, `bus-seat`, `payment`,
  `modification`, `notification`, `api-gateway`) scale horizontally freely.
- **`booking-service`** holds seat locks in Redis (shared) but serves WebSockets.
  To run more than one replica, add a Socket.IO Redis adapter so lock/seat events
  fan out across instances; otherwise pin to a single task.

---

## Frontends (Next.js) in production

`dashboard-web` and `passenger-web` are standard Next.js 14 App Router apps.
They are **not** in `docker-compose.yml`, so choose a host:

**Option A — Managed (Amplify / Vercel)**

- Build command: `npx nx build dashboard-web` (or `passenger-web`).
- Set env vars in the host dashboard:
  - `API_GATEWAY_URL` — **server-only**, e.g. `https://api.example.com/api`.
  - `NEXT_PUBLIC_WS_URL` — public, e.g. `wss://api.example.com` (or the booking
    WS host). This is inlined into client JS, so it must be a browser-reachable URL.
- JWTs live in **HttpOnly cookies** set by the Next.js Route Handler proxy; the
  browser never sees the token.

**Option B — Container**

- Add a Dockerfile per web app (`node:22-alpine`, `nx build`, then
  `node .next/standalone/...` or `next start`) and run it on ECS behind the ALB.

> `API_GATEWAY_URL` is consumed only by server-side Route Handlers — keep it
> internal (e.g. the private ALB / Cloud Map name) so the gateway isn't exposed
> more than necessary. `NEXT_PUBLIC_*` values are public by definition.

### Mobile (`passenger-mobile`)

```sh
npx eas build --platform all        # cloud build
npx eas submit                      # to the stores
```

Set `EXPO_PUBLIC_API_GATEWAY_URL` and `EXPO_PUBLIC_BOOKING_WS_URL` to your public
HTTPS/WSS endpoints in the EAS build profile.

---

## Configuration reference

Every backend service reads these (see `.env.production` and each
`apps/<service>/.env.production`):

| Variable | Used by | Production value |
| --- | --- | --- |
| `JWT_SECRET` | all | long random secret (Secrets Manager) — **rotate the committed sample** |
| `JWT_EXPIRES_IN` | auth, gateway | e.g. `8h` |
| `RABBITMQ_URL` | all | `amqps://user:pass@<amazon-mq-host>:5671` |
| `REDIS_URL` | booking | `redis://<elasticache-host>:6379` (or `rediss://` with TLS) |
| `AUTH_DATABASE_URL` … `NOTIFICATION_DATABASE_URL` | each service | RDS connection strings |
| `<SVC>_SERVICE_URL` | gateway | internal service-discovery URLs |
| `API_GATEWAY_URL` | web (server) | internal gateway URL + `/api` |
| `NEXT_PUBLIC_WS_URL` | web (client) | public WSS booking endpoint |
| `PAYMENT_PROVIDER_URL` / `PAYMENT_PROVIDER_KEY` | payment | real gateway creds |
| `SMTP_HOST/PORT/USER/PASS` | notification | real mail provider |

### Port table

| Port | Service |
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
| 3100 | dashboard-web |
| 3200 | passenger-web |

---

## Operations checklist

**Before go-live**

- [ ] Fresh `JWT_SECRET` (not the committed value), stored in a secrets manager.
- [ ] Non-default Postgres and RabbitMQ credentials.
- [ ] TLS on all public endpoints; HTTP→HTTPS redirect.
- [ ] WebSocket upgrade allowed through the proxy/ALB for seat locking.
- [ ] Databases in private subnets; security groups restricted to services.
- [ ] `pnpm db:push` run against production DBs; sample seed skipped or curated.
- [ ] Payment + SMTP set to real providers.

**Ongoing**

- [ ] Automated RDS snapshots / backups; test restores.
- [ ] Centralised logs (CloudWatch) and health-check alarms per service.
- [ ] CI builds only affected services (`nx affected`) and pushes to ECR.
- [ ] Rolling deploys; migrations run as a gated pre-deploy step.
- [ ] Scale `booking-service` only with a Redis Socket.IO adapter configured.
