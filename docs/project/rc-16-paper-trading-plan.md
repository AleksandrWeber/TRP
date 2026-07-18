# RC-16 — Paper Trading Platform Plan

Date: 2026-07-18

Status: Approved

Architecture status: Frozen by ADR-012…ADR-018

---

## Vision

RC-16 evolves TRP from bounded historical simulation into an always-on Paper
Trading Platform that executes approved strategies against live market data
without risking real capital.

Research answers how a strategy would have behaved on controlled historical
inputs. Paper trading evaluates whether the same approved strategy can operate
safely and consistently with unbounded live data, network failures, durable
runtime state, Orders, Fills, Positions, accounting, Risk, and recovery.

RC-16 remains paper-only. Real-capital execution requires a future ADR and
release.

---

## Scope

### Included

- Binance spot public live market data.
- Normalized closed candles and mark prices.
- Market health, staleness, gaps, reconnect, and backfill.
- Immutable approved Strategy Deployments.
- Durable Trading Sessions and runtime checkpoints.
- Continuous Strategy Runtime.
- Durable Order aggregate and lifecycle.
- Market and limit paper Orders plus cancellation.
- Internal deterministic Paper Execution Adapter.
- Immutable Fills.
- Long-only, unleveraged Position accounting.
- Decimal Ledger and Portfolio projections.
- Mandatory Risk approval and continuous safety monitoring.
- Manual/automatic durable Kill Switch.
- Transactional Outbox, Inbox, durable events, checkpoints, retry/dead-letter.
- Restart recovery and reconciliation.
- Workspace ownership and authorized operator commands.
- Audit trail, logging, metrics, health, incidents, and in-app alerts.
- REST command/query APIs and WebSocket/SSE live Dashboard projections.

### Excluded

- Real-money Orders and private trading credentials.
- Shorting, margin, leverage, futures, options, liquidation.
- Multi-exchange routing.
- High-frequency/sub-millisecond trading.
- Distributed microservices, Kafka, or Kubernetes without measured need.
- AI trading decisions or automatic Risk-policy changes.
- Autonomous strategy approval/deployment.
- External notification channels beyond a replaceable alert port.

---

## Architecture

TRP remains a NestJS modular monolith with React, PostgreSQL, and Docker
Compose. PostgreSQL is authoritative for runtime and financial state.

```text
Binance public REST/WebSocket
        ↓
Live Market Data
        ↓
Trading Session → Strategy Runtime
        ↓
Signal Intent → Orders → Risk
                         ↓ approved
                  Execution Engine
                         ↓
               Paper Execution Adapter
                         ↓
                        Fill
                         ↓
            Position → Ledger → Portfolio
                         ↓
              Risk / Audit / Dashboard
```

Durable event delivery uses PostgreSQL Transactional Outbox + Inbox initially.
The architecture guarantees at-least-once delivery with idempotent business
effects and ordering per aggregate/stream.

Frozen decisions:

- [ADR-012 — Execution Architecture](../adr/ADR-012-execution-architecture.md)
- [ADR-013 — Event Processing Model](../adr/ADR-013-event-processing-model.md)
- [ADR-014 — Runtime Lifecycle](../adr/ADR-014-runtime-lifecycle.md)
- [ADR-015 — Accounting Model](../adr/ADR-015-accounting-model.md)
- [ADR-016 — Risk & Safety Model](../adr/ADR-016-risk-safety-model.md)
- [ADR-017 — Module Boundaries](../adr/ADR-017-module-boundaries.md)
- [ADR-018 — Architectural Invariants](../adr/ADR-018-architectural-invariants.md)

---

## Critical dependency path

```text
Domain contracts / invariants / decimal / clock / IDs
        ↓
PostgreSQL schema + repositories + Outbox/Inbox
        ↓
Live market-data stream + health/checkpoints
        ↓
Trading Sessions + fenced runtime leases
        ↓
Orders + Paper Adapter + Fills
        ↓
Positions + Ledger + Portfolio
        ↓
Risk + Kill Switch
        ↓
Strategy execution coordination
        ↓
Recovery + reconciliation
        ↓
Dashboard + alerts + audit
        ↓
Release validation
```

---

## Milestones

### M0 — Architecture and Safety Freeze

ADR-012…ADR-018 accepted; boundaries, state machines, invariants, recovery,
and paper-only constraints frozen.

### M1 — Live Market Data Foundation

Usable increment: normalized Binance stream with reconnect/backfill,
checkpoints, market status, and observable health.

### M2 — Durable Paper Order and Accounting Core

Usable increment: authorized manual paper Orders produce durable Fills,
Positions, Ledger entries, and Portfolio state.

Progress (2026-07-18): Epic E7-A / US153–US155 complete — decimal financial
contracts, durable paper-account foundation, and PostgreSQL Event Processing
runtime wiring. Orders, execution, Fills, Ledger, and projections remain in the
subsequent M2 epics.

Mini Validation 1: idempotency and accounting invariants.

### M3 — Strategy Trading Sessions

Usable increment: approved strategy runs continuously against live closed
candles through durable Session lifecycle and mandatory execution path.

### M4 — Risk and Safety

Usable increment: versioned Risk Policies, continuous limits, Incidents, and
durable Kill Switch protect all paper execution.

Mini Validation 2: complete strategy → risk → order → fill → accounting flow.

### M5 — Recovery and Reconciliation

Usable increment: active Sessions survive restart without duplicate execution;
Orders, accounting, events, leases, and projections reconcile before resume.

### M6 — Operations Experience

Usable increment: operator Dashboard exposes live health, Sessions, Orders,
Fills, Positions, Portfolio, Risk, Incidents, alerts, and audit controls.

Mini Validation 3: sustained runtime, failure injection, recovery, and operator
flows.

### M7 — RC-16 Validation and Closeout

Functional, deterministic replay, invariant, stress, recovery, security,
architecture, and documentation validation; release only with no blocker.

---

## Epic groups

1. Live Market Data Connectivity
2. Durable Event Processing
3. Strategy Deployment and Approval
4. Trading Session Runtime
5. Paper Order Management
6. Paper Broker and Fill Modeling
7. Positions and Portfolio Accounting
8. Risk Management and Kill Switch
9. Recovery and Reconciliation
10. Operations API and Live Dashboard
11. Observability, Alerts, and Audit
12. RC-16 Validation and Release

Individual User Stories are defined only after this Architecture Freeze.

---

## Principal risks

- Duplicate execution from retries or repeated market events.
- Missing/out-of-order/stale live data.
- Fill, Position, Ledger, and Portfolio divergence.
- Process failure between business write and event publication.
- Multiple workers owning one Session.
- Unsafe retry after uncertain adapter acknowledgement.
- Floating-point financial drift.
- Risk approval against stale projections.
- Recovery that resumes before reconciliation.
- Duplicate trading abstractions remaining in parallel.
- Missing workspace/role enforcement.
- Scope drift from paper toward real-capital execution.

Mitigation is frozen in ADR-012…ADR-018: stable identities, unique constraints,
Outbox/Inbox, per-stream sequence, fenced leases, decimal Ledger, mandatory
Risk, paper-only adapter binding, reconciliation-before-resume, and one
canonical execution path.

---

## Validation strategy

- Unit/state-machine tests with fake domain and operational clocks.
- Property/accounting invariant tests.
- PostgreSQL transaction/idempotency/lease integration tests.
- Recorded live-stream deterministic replay.
- Duplicate, missing, stale, and reordered market-event tests.
- Failure injection at connector, database, Outbox, consumer, execution, and
  accounting boundaries.
- Crash/restart and reconciliation tests.
- Workspace/RBAC and audit tests.
- Sustained stream/session performance and memory tests.
- Mini Validation after M2, M4, and M6.
- Final RC-16 Validation Sprint and Production Readiness Review.

---

## Definition of Done

RC-16 is complete only when:

- live data is normalized, checkpointed, recoverable, and health-monitored;
- approved strategies run through durable Sessions;
- every Order uses mandatory Risk and the single Execution Engine;
- paper Orders/Fills/Positions/Ledger/Portfolio are durable and invariant-safe;
- duplicate delivery cannot duplicate financial effects;
- restart recovery reconciles before resuming;
- Kill Switch survives restart and blocks execution;
- workspace and role isolation are enforced;
- Dashboard, incidents, alerts, audit, logs, metrics, and health are available;
- real-capital execution is impossible;
- all Mini Validation and Release Validation gates pass;
- architecture/documentation are synchronized;
- no unresolved release blocker remains.

---

## Complexity assessment

Overall complexity: **Very High**

Expected shape:

- 7 implementation/validation milestones after M0;
- 12 epics;
- approximately 35–50 bounded User Stories;
- highest-risk work in idempotency, event durability, accounting, runtime
  ownership, recovery, reconciliation, and safety.

Architecture changes after this Freeze require a new ADR.
