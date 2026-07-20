# RC-1.1 — Build Fix Report

**Date:** 2026-07-20  
**Task:** Production Build Recovery  
**Command:** `pnpm build`

## Root cause

1. **Broken dependency graph** — `node_modules` symlinks pointed at missing pnpm store paths (including Nest packages). Manifested as cascading `TS2307 Cannot find module` during Nest/tsc compile.
2. **Genuine Nest compile errors** — After `pnpm install`, `@trp/api` still failed with production-reachable TypeScript defects (chaos-testing factories, async candle providers, architecture readiness verifier typing).

## Fixes applied

| Action                                                                   | Result                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm install`                                                           | Restored package resolution for Nest, Prisma, class-validator, vitest, `@types/node` |
| Chaos / historical-replay / smoke-backtest / live-readiness typing fixes | Nest compilation graph clean                                                         |
| No compiler options disabled                                             | `strict` / `noImplicitAny` unchanged                                                 |
| No `@ts-ignore` / `any` workarounds for build                            | Root-cause typing fixes only                                                         |

## Verification

```text
pnpm build
→ Tasks: 3 successful, 3 total
→ @trp/research PASS
→ @trp/web PASS (Vite)
→ @trp/api PASS (nest build)
→ Exit Code 0
```

## Verdict

**PASS**
