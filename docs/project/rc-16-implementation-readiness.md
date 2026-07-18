# RC-16 — Implementation Readiness

Date: 2026-07-18

Status: Approved

Overall Verdict: **READY FOR IMPLEMENTATION**

---

## Executive Summary

RC-16 Planning, Architecture Freeze, and the Frozen Architecture Audit are
complete.

The audit returned **PASS WITH MINOR RECOMMENDATIONS**. The recommendations do
not change module ownership, dependency direction, execution guarantees,
accounting, safety, recovery, or architectural invariants. They are contract
clarifications to resolve in the first relevant User Stories.

Implementation may begin with M1 — Live Market Data Foundation.

---

## Architecture Status

- Planning completed: YES
- Architecture Freeze completed: YES
- Frozen Architecture Audit passed: YES
- Audit verdict: PASS WITH MINOR RECOMMENDATIONS
- Architecture Approved: YES
- Implementation Approved: YES
- Architecture Frozen: YES
- Post-Freeze architectural changes: NEW ADR REQUIRED
- Production implementation completed: NO
- Current milestone: M1 — Live Market Data Foundation

TRP remains a NestJS modular monolith with React, PostgreSQL, and Docker
Compose. RC-16 is paper-only and cannot submit real-capital Orders.

---

## Approved ADRs

### ADR-012 — Execution Architecture

Freezes the single Execution Engine entry point, Paper Execution Adapter,
future broker-adapter port, idempotent execution, and Strategy Runtime
separation.

### ADR-013 — Event Processing Model

Freezes PostgreSQL Transactional Outbox/Inbox, durable events, at-least-once
delivery, idempotency, per-stream ordering, event versioning, consumer
checkpoints, retries, and dead letters.

### ADR-014 — Runtime Lifecycle

Freezes Strategy Deployment versus Trading Session, Session state machine,
fenced runtime leases, checkpoints, graceful shutdown, restart recovery, and
reconciliation-before-resume.

### ADR-015 — Accounting Model

Freezes Fill → Position → Ledger → Portfolio, decimal-safe arithmetic,
append-only Ledger, accounting invariants, valuation boundaries, and
rebuildable projections.

### ADR-016 — Risk & Safety Model

Freezes mandatory Risk approval, versioned Risk Policy, continuous safety
monitoring, durable Kill Switch, fail-safe behavior, and structural paper-only
execution.

### ADR-017 — Module Boundaries

Freezes responsibilities, inputs, outputs, dependencies, and prohibited
behavior for Live Market Data, Strategy Runtime, Trading Session, Risk, Orders,
Execution Engine, Paper Adapter, Positions, Ledger, Portfolio, Audit,
Dashboard, and Event Processing.

### ADR-018 — Architectural Invariants

Freezes sixty execution, event, runtime, accounting, safety, time,
determinism, ownership, and workspace-isolation rules.

ADR index: [`../adr/README.md`](../adr/README.md)

---

## Audit Outcome

The Frozen Architecture Audit confirmed:

- no blocking contradiction among ADR-012…ADR-018;
- no duplicate authoritative owner for a core domain object;
- no circular domain ownership;
- consistent dependency direction;
- one event durability path;
- explicit ordering and idempotency guarantees;
- mandatory Risk before execution;
- no Strategy-to-adapter bypass;
- no Execution-to-Portfolio/Position/Ledger write path;
- Ledger as the financial source of truth;
- checkpointed, fenced, reconciliation-first recovery;
- paper-only adapter binding.

---

## Minor Recommendations

These recommendations are non-blocking and must become acceptance criteria in
the first affected User Stories.

### 1. Orders ↔ Execution contract

Execution Engine records Fill/adapter facts and requests Order transitions
only through the Orders public port or durable events.

Execution Engine must not write Order persistence directly.

Target: M2 — Durable Paper Order and Accounting Core.

### 2. Reservation ownership

Cash reservation/release writes use the Ledger public port.

Portfolio remains a projection/read model for Risk and Dashboard; it is not
the cash source of truth.

Target: M2.

### 3. Strategy Deployment ownership

M3 stories must name one authoritative owner for immutable Strategy Deployment
configuration, separate from Trading Session runtime state.

Target: M3 — Strategy Trading Sessions.

### 4. Incident ownership

Before M4 implementation, select one authoritative Incident owner. Risk and
Trading Session may produce Incident facts but must not create parallel
Incident stores.

Target: M4 — Risk and Safety Controls.

---

## Remaining Implementation Risks

The architecture is approved, but implementation must actively mitigate:

1. **Parallel execution paths**
   - The Stage-1 manual production prototype and RC-15 simulation abstractions
     must converge on the ADR-012 canonical path.

2. **Duplicate execution**
   - Repeated market events, retries, concurrent workers, and uncertain adapter
     acknowledgement must not duplicate Orders or Fills.

3. **Event durability**
   - Domain writes and Outbox events must commit atomically; failed consumers
     must retry without duplicate effects.

4. **Runtime ownership**
   - Fenced leases must reject stale workers and survive restart.

5. **Recovery uncertainty**
   - Sessions must not resume until Orders, Fills, accounting, events,
     checkpoints, and market state reconcile.

6. **Financial migration**
   - Existing floating-point prototype fields must not become the canonical
     RC-16 financial model; decimal Ledger accounting is required.

7. **Projection freshness**
   - Risk decisions require explicit Position, Portfolio, market, and
     reconciliation checkpoint versions.

8. **Workspace and authorization**
   - Every trading aggregate and command must be workspace-scoped and
     role-authorized.

9. **Live data quality**
   - Duplicate, delayed, missing, reordered, and stale events require explicit
     detection and fail-safe behavior.

10. **Paper/live boundary**
    - No private trading credentials or real-capital adapter may enter RC-16.

These risks are implementation/test concerns within the frozen architecture.
They are not unresolved architectural blockers.

---

## Current Milestone

### M1 — Live Market Data Foundation

M1 begins after bounded User Stories are defined.

M1 objective:

Deliver normalized, validated, observable Binance public market data with
subscription lifecycle, reconnect/backfill, sequence/gap handling, semantic
timestamps, durable checkpoints, and market-health status.

M1 must preserve:

- Live Market Data ownership from ADR-017;
- event envelope/durability from ADR-013;
- domain versus operational time from ADR-018;
- no strategy, Order, Risk, execution, Position, Ledger, or Portfolio logic
  inside Live Market Data.

M1 exit should provide a usable live stream and health projection, not paper
execution.

M1 Epic E1 progress:

- ✓ US126 — Live Market Data Domain Contracts
- ✓ US127 — Market Event Identity and Timestamp Semantics
- ✓ US128 — Transactional Outbox Persistence
- ✓ US129 — Consumer Inbox and Checkpoints
- ✓ US130 — Outbox Dispatcher, Retry, and Dead Letters

Epic E1 complete. Epic E2-A progress:

- ✓ US131 — Live Market Connector Port and Registry
- ✓ US132 — Binance REST Metadata and Backfill Adapter
- ✓ US133 — Binance WebSocket Connection Lifecycle

Epic E2-A complete. Epic E2-B progress:

- ✓ US134 — Connector Reconnect and Rate-Limit Resilience

Epic E2 complete (US131–US134). Epic E3-A progress:

- ✓ US135 — Closed-Candle Normalization
- ✓ US136 — Mark-Price Normalization
- ✓ US137 — Data Validation and Quarantine

Epic E3-A complete. Epic E3-B progress:

- ✓ US138 — Duplicate and Stream-Ordering Control
- ✓ US139 — Gap Detection and REST Recovery

Epic E3 complete (US135–US139). Epic E4-A progress:

- ✓ US140 — Workspace-Scoped Subscription Registry
- ✓ US141 — Durable Market Stream Checkpoints

Epic E4-A complete. Next: Epic E4-B startup recovery/projection (not started).

---

## Definition of Implementation Readiness

RC-16 is ready for implementation when:

1. The release vision, scope, exclusions, milestones, and epics are approved.
2. Module owners and dependency direction are frozen.
3. Execution, event, runtime, accounting, recovery, and safety models are
   explicit.
4. Architectural invariants are immutable and testable.
5. Every core domain object has one authoritative owner.
6. The Frozen Architecture Audit returns PASS or PASS WITH MINOR
   RECOMMENDATIONS.
7. No blocker remains.
8. Minor recommendations have target milestones and can become User Story
   acceptance criteria.
9. Canonical project documentation is synchronized.
10. Architecture changes after Freeze require a new ADR.

All ten conditions are satisfied.

---

## Implementation Guardrails

- Define User Stories by milestone and epic; do not reopen architecture inside
  a story.
- Cite the relevant ADRs and ADR-018 invariants in each story.
- Stop and create a new ADR if implementation requires changed ownership,
  reversed dependency, another execution/event/accounting path, or weaker
  safety/recovery guarantees.
- Keep lint, standalone typecheck, build, and tests continuously green.
- Synchronize documentation and Technical Debt with each story.
- Run Mini Validation after M2, M4, and M6.

---

## Overall Verdict

**READY FOR IMPLEMENTATION**

RC-16 may proceed to bounded M1 User Story definition and implementation under
ADR-012…ADR-018.
