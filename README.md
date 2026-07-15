# TRP — Trading Research Platform

Research Operating System for quantitative strategy development.

**Canonical docs:** [`docs/CANONICAL.md`](./docs/CANONICAL.md)

## Stack

pnpm · Turborepo · React/Vite · NestJS (Fastify) · Prisma · PostgreSQL · Docker Compose

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+
- Docker Desktop (for PostgreSQL)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Environment
cp .env.example .env

# 3. Start PostgreSQL
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 4. Database migrations (first time)
cp .env.example apps/api/.env   # Prisma reads from apps/api
pnpm --filter @trp/api prisma:migrate

# 5. Run dev (web + api)
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000
- Health: http://localhost:3000/health

## Scripts

| Command       | Description                   |
| ------------- | ----------------------------- |
| `pnpm dev`    | Start web + api in watch mode |
| `pnpm build`  | Build all apps                |
| `pnpm lint`   | Lint all apps                 |
| `pnpm format` | Format with Prettier          |

## Structure

```
apps/
  api/     NestJS backend
  web/     React + Vite frontend
docs/      Architecture & implementation guides
infrastructure/docker/   PostgreSQL for local dev
```

## Status

Sprint 0 — Bootstrap complete. Next: Stage 0 research pipeline.
