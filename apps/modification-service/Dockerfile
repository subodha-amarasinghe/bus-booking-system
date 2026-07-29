# syntax=docker/dockerfile:1

# Backend apps carry no package.json of their own — every dependency is declared
# in the root manifest — so the whole workspace is installed to build one app.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
COPY . .
RUN pnpm install --frozen-lockfile
# generate never opens a connection, but prisma.config.ts still resolves the var.
RUN cd apps/modification-service \
    && DATABASE_URL=postgresql://placeholder pnpm prisma generate
RUN pnpm nx build modification-service

# The build emits a self-contained dist: main.js plus a pruned package.json and
# pnpm-lock.yaml covering only the externals webpack left unbundled.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
# The pruned lockfile inherits the workspace overrides, so the same settings must
# be readable here or the frozen install rejects it.
COPY pnpm-workspace.yaml ./
COPY --from=builder /app/dist/apps/modification-service ./
# The only lifecycle script left downloads Prisma engine binaries, which the
# Rust-free driver-adapter client never loads.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
EXPOSE 3007
CMD ["node", "main.js"]
