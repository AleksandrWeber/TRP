# TRP — Canonical Source of Truth

**Version:** 1.0  
**Status:** Approved  
**Rule:** If any document conflicts with this file, this file wins.

---

## Stack

| Layer           | Choice                                |
| --------------- | ------------------------------------- |
| Package manager | pnpm                                  |
| Monorepo        | Turborepo                             |
| Frontend        | React + Vite + TypeScript             |
| UI              | Tailwind CSS + shadcn/ui              |
| Backend         | NestJS + TypeScript (Fastify adapter) |
| ORM             | Prisma                                |
| Database        | PostgreSQL                            |
| Queue           | BullMQ + Redis — only when needed     |
| Auth            | JWT                                   |
| AI              | OpenRouter Gateway                    |
| Deploy          | Docker Compose                        |
| Testing         | Vitest + Playwright                   |

**Not used in Version 1:** Python, FastAPI, Celery, VectorBT, Backtrader, Kafka, Kubernetes, GraphQL, Elasticsearch.

---

## Stages

```
Stage 0 — Research
    OHLCV → Strategy → Backtest → Validation → Report

Stage 1 — Production
    Signal → Exchange Adapter → Execution record

Future — everything else
    see docs/future/
```

No other stage numbering is canonical.

---

## MVP

One end-to-end loop that proves the architecture works.

| Constraint  | Value                       |
| ----------- | --------------------------- |
| Users       | 1                           |
| Exchange    | Binance                     |
| Symbol      | 1 (e.g. BTCUSDT)            |
| Strategy    | 1 (e.g. EMA/RSI/ATR family) |
| Timeframe   | 1                           |
| AI provider | OpenRouter (gateway only)   |

Profitability is **not** an MVP acceptance criterion.  
Integrity of the research → validation → (optional) production path is.

### Stage 0 exit

- Historical OHLCV imported and versioned
- Strategy interface runs a deterministic backtest
- Fees / slippage applied
- Validation produces a pass / fail / needs-review result
- Immutable experiment record + report

### Stage 1 exit

- Certified strategy can emit signals on live (or paper) data
- Exchange adapter places / simulates orders
- Execution history is stored and visible

---

## Out of Scope (V1)

Deferred to `docs/future/`:

- SHIELD
- AI Scientist / multi-agent research org
- Market State Engine
- Strategy Selector / auto rotation
- Multi-exchange
- Portfolio management
- Plugin marketplace
- RAG / vector database
- Kubernetes
- GraphQL
- Multi-user SaaS / RBAC teams
- Python research workers (revisit only if TypeScript is insufficient)

---

## Architecture (summary)

Modular monolith. Research before production. Humans approve production. AI never controls capital. Risk overrides profit.

Details live in:

- `00-architecture-principles.md` — immutable principles
- `Architecture/` — active subsystem specs for Stage 0–1
- `Implementation/` — sprint guides
- `future/` — deferred designs (reference only)

---

## Reproducibility (required)

Every experiment must record at least:

- dataset hash
- strategy hash / version
- config hash
- RNG seed (if any)
- git commit
- runtime image / dependency lockfile identity

If a result cannot be reproduced from these, it is not trusted.

---

## Documentation rules

1. Do not add new Architecture documents unless a real implementation need appears.
2. Prefer updating this file over inventing parallel “sources of truth”.
3. Implementation follows `Implementation/` in order after Sprint 0 (Bootstrap).

---

## Next steps

1. ~~Day Cleanup~~
2. ~~Sprint 0 — Bootstrap~~
3. ~~Stage 0 — Research pipeline~~
4. ~~Stage 1 — Production (paper)~~
5. ~~Implementation 009 — Authentication (JWT)~~
6. ~~010 Workflow · 011 Events · 014 Knowledge · 016 AI · 017 Dashboard~~
7. ~~018 First Strategy verification · 019 MVP Checklist~~
