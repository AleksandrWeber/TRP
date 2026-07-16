# Trading Research Platform (TRP)

> A Research Operating System for quantitative strategy development.

**Source of truth:** [`docs/CANONICAL.md`](./CANONICAL.md)

---

## Documentation Status

- Architecture: Frozen
- MVP Scope: Frozen
- Future Features: [`docs/future/`](./future/)
- Archive: [`docs/archive/`](./archive/)
- New architecture documents require a new product requirement.

---

## What TRP is

TRP is not a trading bot, not an AI trader, and not an HFT system.

It is a platform to **research → validate → explain → (optionally) deploy** strategies with evidence.

```
Research creates knowledge.
Knowledge creates confidence.
Confidence enables production.
```

---

## Stages

| Stage              | Focus                                             |
| ------------------ | ------------------------------------------------- |
| **0 — Research**   | OHLCV → Strategy → Backtest → Validation → Report |
| **1 — Production** | Signal → Exchange Adapter → Execution record      |
| **Future**         | See [`future/`](./future/)                        |

---

## MVP

- 1 user · 1 exchange (Binance) · 1 symbol · 1 strategy · 1 timeframe · OpenRouter gateway

Profitability is not required for acceptance. Pipeline integrity is.

---

## Stack (canonical)

pnpm · Turborepo · React/Vite/TS · NestJS/TS · Prisma · PostgreSQL · JWT · OpenRouter · Docker Compose · Vitest/Playwright

BullMQ + Redis only when a real queue is needed.

Full table: [`CANONICAL.md`](./CANONICAL.md)

---

## Principles (short)

- Research before production
- Validation before trust
- Knowledge is the product
- Risk overrides profit
- Human remains responsible
- AI never controls capital
- Everything important is explainable, reproducible, and versioned

Full list: [`00-architecture-principles.md`](./00-architecture-principles.md)

---

## Docs map

| Path                                                               | Role                       |
| ------------------------------------------------------------------ | -------------------------- |
| [`CANONICAL.md`](./CANONICAL.md)                                   | Source of truth            |
| [`00-architecture-principles.md`](./00-architecture-principles.md) | Immutable principles       |
| [`01-product-bible.md`](./01-product-bible.md)                     | Product intent (slim)      |
| [`02-architecture.md`](./02-architecture.md)                       | Architecture for Stage 0–1 |
| [`03-development-roadmap.md`](./03-development-roadmap.md)         | Stages + Sprint 0          |
| [`04-cursor-master-prompt.md`](./04-cursor-master-prompt.md)       | AI engineering rules       |
| [`05-uiux-guidelines.md`](./05-uiux-guidelines.md)                 | UI/UX                      |
| [`Architecture/`](./Architecture/)                                 | Active subsystem specs     |
| [`Implementation/`](./Implementation/)                             | Sprint guides              |
| [`future/`](./future/)                                             | Deferred designs           |
| [`archive/`](./archive/)                                           | Pre-cleanup drafts         |

---

## Next

1. Run the manual MVP acceptance path in [`Implementation/019-MVP-Verification.md`](./Implementation/019-MVP-Verification.md)
2. Promote Future scope only by updating [`CANONICAL.md`](./CANONICAL.md) after a concrete need appears

---

## Status

Phase: Architecture closed · MVP implementation complete · Manual acceptance in progress
Version: 1.0
