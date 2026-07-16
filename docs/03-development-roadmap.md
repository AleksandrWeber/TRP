# Development Roadmap & Engineering Playbook

**Version:** 1.1  
**Status:** Approved (slim)  
**Source of truth:** [`CANONICAL.md`](./CANONICAL.md)

---

## Purpose

Define **what to build**, **in what order**, and **when to stop planning**.

After this document: no new Architecture specs without a concrete implementation need.

---

## Philosophy

- Working software after every slice
- Research before automation
- Simplest solution that meets the current stage
- Definition of Done includes tests + docs touch if behavior changes

---

## Canonical stages

```
Sprint 0 — Bootstrap
     ↓
Stage 0 — Research
     ↓
Stage 1 — Production
     ↓
Future — docs/future/
```

---

## Sprint 0 — Bootstrap (1–2 days)

**Goal:** empty but runnable platform.

- Monorepo: pnpm + Turborepo
- `apps/web` — React + Vite + TypeScript
- `apps/api` — NestJS + TypeScript (Fastify adapter)
- Prisma + PostgreSQL via Docker Compose
- ESLint, Prettier, Husky
- Health check + hello API + blank UI shell

**Done when:** `pnpm install`, `docker compose up`, web + api start cleanly.

---

## Stage 0 — Research

**Goal:** answer “does this idea have a measurable edge?” with a reproducible pipeline.

```
OHLCV → Strategy → Backtest → Validation → Report
```

### In scope

- Dataset import / versioning (hash)
- Strategy interface (EMA / RSI / ATR class is enough)
- Backtest + fees + slippage
- Validation verdict (pass / fail / needs review)
- Immutable experiment record + report
- Optional: AI Gateway summary of the report

### Out of scope

- Live trading, multi-strategy selector, Market State Engine, SaaS, SHIELD, RAG

### Exit criteria

- Reproducible backtest from recorded hashes + git commit
- Validation report generated
- Automated tests for core research path
- Demo of one symbol / one timeframe / one strategy

---

## Stage 1 — Production

**Goal:** thin, safe execution path for an **approved** strategy.

```
Signal → Risk check → Exchange Adapter → Execution record
```

### In scope

- Binance adapter (paper and/or live with tiny capital)
- Signal generation from certified strategy version
- Minimal risk limits (size, daily loss, kill switch)
- Execution journal + simple dashboard visibility

### Out of scope

- Auto strategy rotation, portfolio construction, multi-exchange

### Exit criteria

- End-to-end: research → approve → signal → adapter → history visible
- Secrets not in repo; JWT auth works
- Matches [`Implementation/019-MVP-Checklist.md`](./Implementation/019-MVP-Checklist.md) known limitations

---

## Future

All other roadmap ideas (AI Scientist, plugins marketplace, K8s, GraphQL, multi-user, etc.) live in [`future/`](./future/).  
Promote only by updating [`CANONICAL.md`](./CANONICAL.md).

---

## Implementation order

Follow [`Implementation/`](./Implementation/) after Sprint 0:

Foundation → DB/API/Auth → Workflow/Events → Research → Validation → Knowledge (minimal) → Production → AI Gateway → Dashboard → First Strategy → MVP Checklist

Skip inventing new Architecture documents between these sprints.

---

## Definition of Done (every slice)

- Feature works
- Tests pass
- Errors handled
- Important actions logged
- Docs updated only if behavior/contracts changed
- No speculative scope slipped in

---

## Stop rule

Architecture is closed. Implementation follows [`Implementation/`](./Implementation/) in order.
After Stage 0–1 vertical slices, fill remaining foundation gaps (Auth → Workflow → Events → Knowledge → AI Gateway → Dashboard → MVP Checklist) without inventing scope.
