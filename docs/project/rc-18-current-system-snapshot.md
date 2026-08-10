# RC-18 — Current System Snapshot

**Document:** RC-18 Current System Snapshot  
**Status:** Approved baseline (historical)  
**Date recorded:** 2026-08-10  
**Question answered:** _What does the platform actually look like today, immediately before Version 2 integration?_

This is a **historical baseline** for Version 2. It does not redesign architecture and does not authorize new modules.

Related:

- [Engineering Audit Report](./engineering-audit-report-v2-freeze.md)
- [V2 Freeze Preconditions](./v2-freeze-preconditions.md)
- [V2 Implementation Roadmap (RC-19…RC-28)](./v2-implementation-roadmap.md)
- [Module Maturity](./module-maturity.md)
- [RC-18 Residual Register](./rc-18-residual-register.md)
- [Release History](./release-history.md)
- [CANONICAL](../CANONICAL.md)

---

## Snapshot identity

| Field                  | Value                                          |
| ---------------------- | ---------------------------------------------- |
| Stable product release | `v1.0.0` (Research OS + paper foundation)      |
| Engineering phase      | **RC-18 IN PROGRESS** (closeout)               |
| Paper Trading          | Canonical path **BASELINE ACCEPTED** (RC-16)   |
| Runtime Recovery       | **BASELINED** (RC-17) + RC-18 R1–R5 **Closed** |
| Open RC-18 mandatory   | **US295 / ADL-008**                            |
| V2 code integration    | **Not started**                                |
| V2 concept docs        | **Approved** (Freeze Preconditions package)    |

---

## 1. Current implementation

### Completed (working in repo for current phase)

- Monorepo platform (pnpm / Turborepo / Docker Compose)
- Auth (JWT) + Workspace context
- Live Market Data (Binance-oriented M1 path)
- Durable Outbox / Inbox event processing spine
- Trading Session lifecycle (ADR-014) including recovery hardening (US290–US294)
- Strategy Deployment / Strategy Runtime / Signal Intent
- Orders → Risk Decision → Execution Engine → Paper Adapter → Fill
- Position → Ledger → Portfolio accounting (decimal)
- Research Campaign / Pipeline engine
- Backtesting + Walk-Forward campaign path
- Knowledge / Insight / Recommendation / Research Report foundations
- Jobs framework (campaign/replay background execution)
- Operator-facing pages for research, campaigns, paper trading, portfolio, orders, risk (non-IDE)

### Partially completed

- Risk / Kill Switch productization (decisions exist; ops policy/UX incomplete — E19)
- Runtime Recovery governance claim (**US295 open**)
- Auth hardening / durable credentials (TD-005 / TD-006)
- Research persistence durability (many domain stores still in-memory — TD-001/TD-003)
- Dashboard / ops projections (pages exist; not Command Center; non-authoritative by design)
- AI Gateway (present; not full AI Analyst product)
- Multi-dataset / comparison / performance analytics (foundation, not full productization)
- Frontend Research Control surfaces (useful, not Research IDE shell)

### Experimental / foundation-only (do not treat as V2 product)

- Replay services (foundation; not product Replay platform)
- Stage-1 production prototype path (**retired** — do not revive)
- Dual research analysis stacks (legacy analysis vs Insight/Recommendation — Accepted Legacy)
- In-memory job authoritative queue mirror (TD-002)

### Planned (approved V2 / future — not in RC-18 code)

- Exchange Scope (Cluster) as first-class isolation boundary
- Bot UI facade over Trading Session
- Strategy Library + Tactical Envelope enforcement
- Knowledge Lake (projection warehouse)
- Command Center
- Reporting & AI Analytics (ops-grade) + Telegram reports
- Market Qualification + Market Profile Library
- Trading Orchestrator
- Multi-exchange adapters (Bybit/OKX/…)
- Monte Carlo (Parking Lot)
- Live-capital execution (requires future ADR)

---

## 2. Current capabilities (what actually exists)

| Capability                              | Exists today?           | What the user/operator can do                                                      |
| --------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| Market Data (live)                      | **Yes**                 | Consume normalized live market events / status for paper path (Binance-oriented)   |
| Historical / research data              | **Yes**                 | Import/run research datasets and campaigns                                         |
| Strategy Lab (backtest)                 | **Yes**                 | Run deterministic backtests with fees/slippage assumptions in research path        |
| Walk-Forward                            | **Yes**                 | Run walk-forward campaigns / aggregates                                            |
| Strategy Runtime                        | **Yes**                 | Evaluate approved strategy deployments on session market events → Signal Intent    |
| Paper Trading                           | **Yes**                 | Durable paper orders/fills/accounting on canonical path                            |
| Orders                                  | **Yes**                 | Create/lifecycle paper orders with idempotency                                     |
| Risk Decisions                          | **Yes**                 | Mandatory risk approval before executable orders                                   |
| Ledger / Positions / Portfolio          | **Yes**                 | Durable accounting projections; Ledger is financial SoT                            |
| Runtime Recovery                        | **Yes (near-complete)** | Restart recovery pipeline + chaos evidence (R1–R5); governance closeout US295 open |
| Knowledge (research)                    | **Yes**                 | Search/store research knowledge extracts (limits: durability/product depth)        |
| Dashboard / trading UI                  | **Partial**             | Navigate research and paper trading pages; not a full ops Command Center           |
| AI assistance                           | **Partial**             | Gateway/page level assistance; not authoritative analytics product                 |
| Multi-exchange trading                  | **No**                  | Single-exchange practical scope                                                    |
| Strategy Library (certified + envelope) | **No**                  | Strategies exist; certified library product does not                               |
| Market Qualification / Profiles         | **No**                  | —                                                                                  |
| Knowledge Lake                          | **No**                  | —                                                                                  |
| Command Center                          | **No**                  | —                                                                                  |
| Telegram reporting                      | **No**                  | —                                                                                  |
| Live capital trading                    | **No**                  | Paper-only Freeze                                                                  |

---

## 3. Current limitations

- Effectively **one exchange** path for production-shaped paper trading.
- **No** product Strategy Library with certification + Tactical Envelope enforcement.
- **No** Market State / Trading Orchestrator product.
- **No** Market Qualification / Market Profile Library.
- **No** Knowledge Lake warehouse (Knowledge domain ≠ Lake).
- **No** Command Center; emergency/ops controls incomplete.
- **No** ops-grade Reporting / Telegram cadence.
- **No** Monte Carlo in validation ladder.
- **No** Research IDE shell (tabs / explorer / bottom jobs / side AI).
- Research durability gaps (in-memory stores) for some domains.
- UI is information-bearing but not the approved V2 professional IDE density.
- Production recovery **claim** not fully closed until US295.

---

## 4. Architecture maturity

| Layer                                                       | Maturity                         | Notes                                        |
| ----------------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| ADR-012…018 Paper path                                      | **Stable (Frozen)**              | Do not fork; extend via facades/scopes only  |
| Research Stage 0 pipeline                                   | **Stable / Mature**              | Core research loop trusted for current phase |
| Runtime Recovery algorithm shape                            | **Baselined; closeout evolving** | R1–R5 done; ADL-008/US295 open               |
| V2 product mapping (aliases, authority, tactics, isolation) | **Approved (docs)**              | Not yet Spec v2.0; not yet code              |
| V2 feature modules                                          | **Not started**                  | Planned RC-19+                               |
| Live capital architecture                                   | **Future**                       | Requires future ADR                          |

**Stable today:** canonical paper execution/accounting, session runtime shape, research campaign engine.  
**Evolving today:** ops readiness, recovery governance closeout, frontend shell, V2 integration surfaces.

---

## 5. Technical maturity labels

| Label                | Meaning in this snapshot                                                            | Examples                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Production Ready** | Safe to treat as durable platform spine for paper/research ops under current Freeze | Execution Engine path, Ledger, Orders, Outbox/Inbox, Trading Session core     |
| **Research Ready**   | Suitable for serious research workflows; may lack product polish/durability         | Campaigns, Backtest, Walk-Forward, Knowledge foundations                      |
| **Experimental**     | Present but not a product commitment; avoid expanding                               | Replay-as-platform ambitions, legacy dual analysis stacks                     |
| **Future**           | Approved direction or deferred; not RC-18 capability                                | Lake, Command Center, Orchestrator, multi-exchange, live capital, Monte Carlo |

### Quick map

| Area                          | Label                                                 |
| ----------------------------- | ----------------------------------------------------- |
| Paper Trading canonical path  | Production Ready (paper)                              |
| Ledger / accounting           | Production Ready (paper)                              |
| Live Market Data M1           | Production Ready (paper inputs)                       |
| Runtime Recovery              | Research/Ops Ready → Production claim pending US295   |
| Strategy Lab                  | Research Ready                                        |
| Knowledge domain              | Research Ready                                        |
| Frontend IDE / Command Center | Future (pages exist = Experimental UX relative to V2) |
| V2 modules                    | Future                                                |

---

## 6. One-sentence baseline

**Today TRP is a frozen paper-trading Research OS with durable sessions/orders/risk/ledger and strong recovery work-in-closeout — not yet the Version 2 operator/research product (Library, Lake, Command Center, Orchestrator, multi-exchange).**

Use this snapshot as the “before” picture when measuring Version 2 progress.
