# RC-1 — Dependency Validation

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 2096 ms

## Summary

Dependency install and lockfile validation succeeded.

## Metrics

| Metric          | Value |
| --------------- | ----- |
| installExitCode | 0     |

## Commands

```

pnpm install --frozen-lockfile

pnpm list -r --depth 0

```

## Install Output (truncated)

```

Scope: all 4 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

. prepare$ husky
. prepare: Done
apps/api postinstall$ prisma generate
apps/api postinstall: warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
apps/api postinstall: For more information, see: https://pris.ly/prisma-config
apps/api postinstall: Environment variables loaded from .env
apps/api postinstall: Prisma schema loaded from prisma/schema.prisma
apps/api postinstall: ✔ Generated Prisma Client (v6.19.3) to ./../../node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_magicast@0.3.5_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client in 139ms
apps/api postinstall: Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
apps/api postinstall: Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
apps/api postinstall: Done
Done in 1.8s

```

## Verdict

**PASS**
