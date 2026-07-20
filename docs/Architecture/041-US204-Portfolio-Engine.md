# US204 — Portfolio Engine

Status: Implemented  
Scope: Workspace-scoped trading account financial state (cash, equity, margin,
snapshots). Part of Trading Platform V1 (RC-1).

## Canonical documentation

Full architecture, API, persistence, migration, design, limitations, and
deployment coverage for US204–US210 lives in:

**[048-Trading-Platform-V1.md](./048-Trading-Platform-V1.md)**

Read the **US204 — Portfolio Engine** section there for implementation detail.

## Quick reference

| Item                 | Value                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Module               | `apps/api/src/modules/portfolio-engine`                            |
| REST prefix          | `/v1/portfolio`                                                    |
| Migration            | `apps/api/prisma/migrations/20260720120000_us204_portfolio_engine` |
| Default currency     | `USD`                                                              |
| Default initial cash | `100000`                                                           |
| Tables               | `portfolios`, `portfolio_snapshots`, `portfolio_events`            |

Portfolio financial mutations are not exposed on REST; they occur when
Position Engine syncs after order fills. `POST /v1/portfolio/reset` is
development-only.
