# RC-17 — Release Planning

**Release Candidate 17 — Production Readiness & Operational Runtime**

Date: 2026-07-30

Status: **BASELINED** (Runtime Recovery reference — see Retrospective)

Architecture baseline: RC-16 **BASELINE ACCEPTED** (ADR-012…ADR-018 frozen;
ADR-019 event emission semantics; M3 canonical path US211–US223);
RC-17 E17 Stage 3 reference pipeline US240–US249 + US244A

Constraint: This document remains the accepted planning authority. Implementation
outcomes and residual ownership are recorded in the Retrospective and Release
History.

Related:

- [Release History](./release-history.md)
- [Story ID Allocation](./story-id-allocation.md) — **US240–US299**
- [RC-17 Roadmap](./rc-17-roadmap.md)
- [RC-17 Development Process](./rc-17-development-process.md)
- [RC-17 Retrospective](./rc-17-retrospective.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- [RC-16 Paper Trading Plan](./rc-16-paper-trading-plan.md)
- [RC-16 M3 Strategy Runtime Plan](./rc-16-m3-strategy-runtime-plan.md)
- [Templates](./templates/)
- [ADR Index](../adr/README.md)

---

## Executive Summary

RC-17 turns the RC-16 paper-trading architecture into an operationally ready
runtime. RC-16 established the canonical trading path, durable accounting,
Strategy Runtime through Signal Intent, and the Architecture Freeze. RC-17 does
not redesign those boundaries. It completes recovery, hardens event processing,
delivers operator-facing operations, strengthens live market-data readiness, and
enables safe multi-strategy operation on the same platform.

The release is an engineering playbook first: epics, process stages, health
reviews, and decision logging precede implementation User Stories. Future
stories should implement accepted scope rather than renegotiate architecture or
workflow.

---

## Mission Statement

Make the RC-16 Paper Trading Platform **restart-safe, event-correct,
operator-observable, market-data-resilient, and multi-strategy capable** while
preserving ADR-012…ADR-018 and the existing bounded contexts.

RC-17 answers: _Can approved strategies run continuously in paper mode with
recoverable sessions, trustworthy event delivery, and operable production
controls?_

---

## Business Goals

1. Operators can run paper trading sessions with confidence that process
   restarts do not duplicate Orders, Fills, or accounting.
2. Failures are visible: incidents, alerts, audit, and session/market health
   are first-class operator surfaces.
3. Multiple approved strategies can operate concurrently without crossing
   workspace or session ownership boundaries.
4. Live market-data gaps, staleness, and reconnects are handled without silent
   strategy drift.
5. Paper-only safety remains absolute; real-capital execution stays out of
   scope pending a future ADR.

---

## Technical Goals

1. Complete ADR-014 restart recovery and reconciliation-before-resume for
   non-terminal Trading Sessions.
2. Close ADR-013 gaps: every durable consumer uses Inbox idempotency; fan-out
   progress, retry, and dead-letter behavior are operationally complete.
3. Deliver operations surfaces (health, incidents, alerts, audit, dashboard
   projections) on public APIs/read models only (ADR-017 / ADR-018 #58–59).
4. Harden Live Market Data for sustained runtime: gap recovery, staleness
   fencing, subscription/checkpoint continuity under multi-session load.
5. Enable multi-strategy platform behavior: concurrent Deployments/Sessions,
   isolation, and capacity/observability without new execution paths.
6. Preserve the canonical flow:

   ```text
   Live Market Data
        ↓
   Trading Session → Strategy Runtime
        ↓
   Signal Intent → Orders → Risk → Execution Engine → Paper Adapter → Fill
        ↓
   Position → Ledger → Portfolio
   ```

7. Record architectural evolution in the Architecture Decision Log (ADL)
   without superseding ADR-012…ADR-018 unless a new ADR is explicitly accepted.

---

## Release Scope

### In scope

| Area                            | Scope                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **E17 Runtime Recovery**        | Full Session restart recovery; fence; checkpoint resume; reconciliation gate; chaos/restart validation                     |
| **E18 Event Processing**        | Durable consumer Inbox coverage; Outbox fan-out ops; retry/DLQ; consumer progress observability                            |
| **E19 Operations**              | Operator APIs/dashboard projections; incidents; alerts; audit; continuous Risk / Kill Switch productization within ADR-016 |
| **E20 Market Data**             | Production-grade live stream health, gap/backfill under concurrent sessions, operator market status                        |
| **E21 Multi-Strategy Platform** | Concurrent strategy sessions; isolation; capacity and fairness under fenced ownership                                      |
| **Process**                     | Epic planning, architecture review, technical review, architecture health, retrospectives                                  |
| **Governance**                  | ADL seeding; template reuse; RC-17 Definition of Done                                                                      |

### Explicitly included from unfinished RC-16 product milestones

RC-16 M3 delivered the strategy path through US223 (E2E candle → Fill →
accounting). Remaining RC-16 product intent that RC-17 owns as planning scope:

- M3 residual recovery hooks / validation (formerly sketched as RC-16 M3 “Epic
  E17” US224–US227) — absorbed into **RC-17 Epic E17**, not a parallel epic
  number in this release.
- M4 continuous Risk and durable Kill Switch — under **E19 Operations**
  (safety is an operational runtime concern).
- M5 Recovery and Reconciliation — under **E17 Runtime Recovery**.
- M6 Operations Experience — under **E19 Operations**.
- Sustained market-data operational hardening beyond M1 foundation — under
  **E20 Market Data**.
- Concurrent multi-strategy operation — under **E21 Multi-Strategy Platform**.

---

## Out of Scope

- Real-capital / live broker adapters (requires future ADR; ADR-012/016/018).
- Shorting, margin, leverage, futures, options, liquidation.
- Multi-exchange routing or HFT/sub-millisecond trading.
- Distributed microservices, Kafka, or Kubernetes without measured need.
- AI trading decisions or autonomous Risk-policy changes.
- Autonomous strategy approval/deployment.
- Changing bounded contexts or reversing ADR-017 dependency direction.
- Speculative redesign of Orders, Risk, Execution Engine, or Accounting.
- Database migrations or API changes in this planning package itself.
- Research OS / Campaign / Knowledge redesign.
- Playwright browser E2E suite (TD-043 remains deferred unless separately
  approved).

---

## Success Criteria

RC-17 succeeds when:

1. Non-terminal Sessions survive process restart without duplicate Signal
   Intents, Orders, or Fills (ADR-014 / ADR-018 #9, #23–25).
2. Every durable consumer uses Inbox idempotency; restart does not lose or
   double-apply consumer progress (ADR-013 / ADR-018 #11–18).
3. Operators can observe Session, market, Risk, Kill Switch, Order, Fill,
   Position, Portfolio, and incident state through authorized read models.
4. Active Kill Switch blocks new execution and survives restart (ADR-016 /
   ADR-018 #44–45).
5. Live market staleness/gaps fence strategy evaluation until recovered.
6. At least two concurrent strategy Sessions in one workspace operate without
   cross-session mutation or lease collision.
7. Deterministic recorded-stream replay still matches Orders, Fills,
   Positions, Ledger, Portfolio, and Risk outcomes (ADR-018 #52).
8. Architecture Health and Technical Reviews pass for each epic; ADL entries
   record decisions; no unresolved release blocker remains.
9. ADR-012…ADR-018 remain **ACTIVE** without silent supersession.

---

## Release Definition of Done

RC-17 is done only when all of the following are true:

- [ ] Epics E17–E21 complete with accepted exit criteria
- [ ] All committed User Stories for the release closed or explicitly deferred
      with TD owners
- [ ] Architecture Health checklist green (or accepted residual TD only)
- [ ] Technical Reviews complete for each epic
- [ ] Epic Retrospectives filed
- [ ] ADL updated for RC-17 decisions (placeholders closed or marked deferred)
- [ ] Quality gates green: format, lint, typecheck, build, tests
- [ ] Deterministic replay and restart/reconciliation evidence attached
- [ ] Kill Switch + continuous Risk evidence attached
- [ ] Operator flows validated (sessions, market health, incidents, audit)
- [ ] Multi-strategy isolation evidence attached
- [ ] `CHANGELOG`, project status, module maturity, and technical debt synced
- [ ] No open release blocker; paper-only invariant intact
- [ ] Final RC-17 Release Review published (pass / fail explicit)

---

## Risks

| Risk                                                          | Severity | Mitigation                                                           |
| ------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| Resume before reconciliation                                  | High     | ADR-014 algorithm; E17 exit requires RECOVERING gate                 |
| Incomplete Inbox coverage on a durable consumer               | High     | E18 audit of every consumer; architecture tests                      |
| Epic number collision with RC-16 M3 “E17”                     | Medium   | RC-17 owns E17–E21; absorb US224–US227 into E17; do not run two E17s |
| Scope creep into Execution/Accounting redesign                | High     | Process Stage 2 Architecture Review; ADL + ADR gate                  |
| Continuous Risk / Kill Switch overbuilt into Runtime          | Medium   | ADR-016 ownership; Runtime never owns Kill Switch                    |
| Multi-strategy contention on shared market streams            | Medium   | E20/E21: shared MD with per-session checkpoints; lease fencing       |
| Operator dashboard becoming authoritative                     | High     | ADR-018 #33, #58 — projections only                                  |
| Documentation drift vs living roadmap/status                  | Medium   | Stage 0/6 sync rules; one DoD checklist                              |
| Treating M2/M3 “PASS WITH RECOMMENDATIONS” as final readiness | High     | RC-17 DoD requires recovery/ops evidence                             |

---

## Dependencies

### Architecture (frozen)

- ADR-012 Execution Architecture
- ADR-013 Event Processing Model
- ADR-014 Runtime Lifecycle
- ADR-015 Accounting Model
- ADR-016 Risk & Safety Model
- ADR-017 Module Boundaries
- ADR-018 Architectural Invariants
- ADR-019 Event Emission Semantics (notifications vs durable facts)

### Implementation baseline (assumed complete before E17 implementation)

- RC-16 M1 Live Market Data Foundation
- RC-16 M2 Durable Paper Order and Accounting Core
- RC-16 M3 through US223: Strategy Deployment, Runtime, Signal Intent,
  CanonicalOrderPath, E2E candle → Fill → accounting
- Pre-M3 gates resolved: TD-034, TD-039, TD-040, TD-042

### Soft dependencies

- TD-036 Runtime Recovery (primary E17 owner)
- TD-002 durable scheduler/queue ownership (clarify under E17/E18; no second
  lifecycle model)
- TD-041 Ledger history pagination (prefer before heavy E19 history UIs)
- Existing operator/auth surfaces from RC-14 (extend, do not fork)

### Process dependencies

- [RC-17 Development Process](./rc-17-development-process.md) Stages 0–6
- Templates under [`templates/`](./templates/)
- Architecture Decision Log seeded before Epic Planning

---

## Recommended implementation order

```text
Stage 0  Release Planning          ← this document (complete when accepted)
Stage 1  Epic Planning             ← E17 → E18 → E19 → E20 → E21 specs
Stage 2  Architecture Review       ← per epic; ADL updates; no redesign
        │
        ▼
E17 Runtime Recovery               ← hard gate for all later always-on work
        │
E18 Event Processing               ← Inbox/Outbox correctness under recovery
        │
E19 Operations                     ← Kill Switch, incidents, operator surfaces
        │                            (may start thin read APIs earlier if gated)
E20 Market Data                    ← sustained MD under recovered multi-session
        │
E21 Multi-Strategy Platform        ← concurrency after single-session recovery
        │
Stage 4–6  Technical Review → Architecture Health → Retrospective (per epic)
        │
RC-17 Release Validation & Closeout
```

**Rationale**

1. **E17 first** — without reconciliation-before-resume, operations and
   multi-strategy amplify incorrect state.
2. **E18 next** — recovery proofs are only as strong as durable consumer
   progress and Inbox coverage.
3. **E19 after durable substrate** — Kill Switch and incidents must bind to
   recovered truth, not in-memory hope.
4. **E20 then E21** — market-data concurrency and multi-strategy isolation
   build on a recovered, event-correct single-session path.

Thin parallel work is allowed only when Architecture Review proves no
dependency on incomplete E17/E18 exit criteria (for example, read-only
dashboard shells that consume existing query APIs).
