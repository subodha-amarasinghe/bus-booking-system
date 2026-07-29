# syntax=docker/dockerfile:1

# Backend apps carry no package.json of their own — every dependency is declared
# in the root manifest — so the whole workspace is installed to build one app.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
# All nine images install the same NestJS dependency set. Pointing pnpm at a
# BuildKit cache mount lets the first build download it and the rest link from
# the store, instead of nine cold installs racing each other for bandwidth.
ENV npm_config_store_dir=/pnpm/store
# Defaults (16 sockets per install, 2 retries) time out when several builds run
# at once on a home connection.
ENV npm_config_network_concurrency=8
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_maxtimeout=180000
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile
# generate never opens a connection, but prisma.config.ts still resolves the var.
RUN cd apps/auth-service \
    && DATABASE_URL=postgresql://placeholder pnpm prisma generate
RUN pnpm nx build auth-service

# The build emits a self-contained dist: main.js plus a pruned package.json and
# pnpm-lock.yaml covering only the externals webpack left unbundled.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Same shared store and registry timeouts as the builder stage.
ENV npm_config_store_dir=/pnpm/store
ENV npm_config_network_concurrency=8
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_maxtimeout=180000
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
# The pruned lockfile inherits the workspace overrides, so the same settings must
# be readable here or the frozen install rejects it.
COPY pnpm-workspace.yaml ./
COPY --from=builder /app/dist/apps/auth-service ./
# The only lifecycle script left downloads Prisma engine binaries, which the
# Rust-free driver-adapter client never loads.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --prod --frozen-lockfile --ignore-scripts
EXPOSE 3001
CMD ["node", "main.js"]
