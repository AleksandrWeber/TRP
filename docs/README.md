# Trading Research Platform (TRP) — Architecture Index

> A Research Operating System for quantitative strategy development.

**Source of truth:** [`docs/CANONICAL.md`](./CANONICAL.md)

## Release Status

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| Current Stable Release | `v1.0.0`                                                   |
| Release Status         | Production Ready                                           |
| Last Certification     | PASS                                                       |
| Production branch      | `main`                                                     |
| V1 Completion Report   | [`releases/V1-COMPLETION.md`](./releases/V1-COMPLETION.md) |
| Changelog              | [`../CHANGELOG.md`](../CHANGELOG.md)                       |

---

## Documentation Status

- **Version 1:** Officially complete (`v1.0.0`)
- Research/Simulation Architecture: Frozen (RC-15.1)
- Paper Trading Architecture: Frozen (RC-16, ADR-012…ADR-018)
- MVP Scope: Frozen
- Future Features: [`docs/future/`](./future/)
- Archive: [`docs/archive/`](./archive/)
- Architectural changes require a new ADR.

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

| Path                                                                           | Role                            |
| ------------------------------------------------------------------------------ | ------------------------------- |
| [`CANONICAL.md`](./CANONICAL.md)                                               | Source of truth                 |
| [`00-architecture-principles.md`](./00-architecture-principles.md)             | Immutable principles            |
| [`01-product-bible.md`](./01-product-bible.md)                                 | Product intent (slim)           |
| [`02-architecture.md`](./02-architecture.md)                                   | Architecture for Stage 0–1      |
| [`03-development-roadmap.md`](./03-development-roadmap.md)                     | Stages + Sprint 0               |
| [`04-cursor-master-prompt.md`](./04-cursor-master-prompt.md)                   | AI engineering rules            |
| [`05-uiux-guidelines.md`](./05-uiux-guidelines.md)                             | UI/UX                           |
| [`Architecture/`](./Architecture/)                                             | Active subsystem specs          |
| [`adr/`](./adr/)                                                               | Accepted architecture decisions |
| [`project/rc-16-paper-trading-plan.md`](./project/rc-16-paper-trading-plan.md) | RC-16 scope and milestones      |
| [`project/project-status.md`](./project/project-status.md)                     | Living project status           |
| [`project/roadmap.md`](./project/roadmap.md)                                   | Direction / future roadmap      |
| [`releases/`](./releases/)                                                     | Certification & release history |
| [`releases/V1-COMPLETION.md`](./releases/V1-COMPLETION.md)                     | Version 1 completion report     |
| [`Implementation/`](./Implementation/)                                         | Sprint guides                   |
| [`future/`](./future/)                                                         | Deferred designs                |
| [`archive/`](./archive/)                                                       | Pre-cleanup drafts              |

---

## Release History

| Version      | Date       | Status          | Notes                          |
| ------------ | ---------- | --------------- | ------------------------------ |
| `v1.0.0`     | 2026-07-20 | Official Stable | Production baseline on `main`  |
| `v1.0.0-rc1` | 2026-07-20 | Historical RC   | Engineering certification PASS |

Evidence: [`releases/RC-1-CERTIFICATION.md`](./releases/RC-1-CERTIFICATION.md),
[`releases/RC-1-RELEASE-NOTES.md`](./releases/RC-1-RELEASE-NOTES.md).

---

## Next

1. Maintain Version 1 on `main` (bugfixes / docs only unless a new ADR is accepted).
2. Plan Version 2 against [`project/roadmap.md`](./project/roadmap.md) and [`future/`](./future/).
3. Keep ADR-012…ADR-018 freeze until a new ADR supersedes it.

---

## Status

Phase: Version 1 complete · Production Ready (`v1.0.0`)  
Version: 1.0.0
