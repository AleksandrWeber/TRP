# TRP — Trading Research Platform

Research Operating System for quantitative strategy development.

**Canonical docs:** [`docs/CANONICAL.md`](./docs/CANONICAL.md)

## Current Stable Release

| Field                              | Value            |
| ---------------------------------- | ---------------- |
| **Current Stable Release**         | `v1.0.0`         |
| **Release Status**                 | Production Ready |
| **Last Certification**             | PASS             |
| **Production branch**              | `main`           |
| **Release candidate (historical)** | `v1.0.0-rc1`     |

Completion report: [`docs/releases/V1-COMPLETION.md`](./docs/releases/V1-COMPLETION.md)  
Changelog: [`CHANGELOG.md`](./CHANGELOG.md)  
Architecture Index: [`docs/README.md`](./docs/README.md)

## Stack

pnpm · Turborepo · React/Vite · NestJS (Fastify) · Prisma · PostgreSQL · JWT · Docker Compose

## Release certification (RC-2 / RC-3 / RC-4)

The only supported release workflow:

```bash
pnpm release:rc          # full certification; commit+tag only on PASS
pnpm release:validate    # same pipeline without git (CI default)
```

Reports are written to `docs/releases/`. GitHub Actions workflows live under `.github/workflows/` (see `.github/README.md`).
Official stable tag: `v1.0.0`.

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
cp .env.example apps/api/.env

# 3. Start PostgreSQL
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 4. Migrations + seed user (Implementation 009)
pnpm --filter @trp/api prisma:migrate
pnpm --filter @trp/api prisma:seed

# 5. Run dev (web + api)
pnpm dev
```

- Web: http://localhost:5173 (login required)
- API: http://localhost:3000
- Health (public): http://localhost:3000/health

Default seed user (change after first login):

- Email: `admin@trp.local`
- Password: `trp-admin-change-me`

## Scripts

| Command                              | Description                   |
| ------------------------------------ | ----------------------------- |
| `pnpm dev`                           | Start web + api in watch mode |
| `pnpm build`                         | Build all apps                |
| `pnpm lint`                          | Lint all apps                 |
| `pnpm format`                        | Format with Prettier          |
| `pnpm --filter @trp/api prisma:seed` | Seed admin user               |

## Structure

```
apps/
  api/     NestJS backend
  web/     React + Vite frontend
docs/      Architecture & implementation guides
infrastructure/docker/   PostgreSQL for local dev
```

## Implementation progress

Follow [`docs/Implementation/`](./docs/Implementation/) in order.

Done: Bootstrap → Stage 0 → Stage 1 → 009 Auth → 010–017 → 018/019  
See [`docs/Implementation/019-MVP-Verification.md`](./docs/Implementation/019-MVP-Verification.md)
