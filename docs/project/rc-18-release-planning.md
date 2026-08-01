# RC-18 Release Planning

**Release Candidate 18 — Production Recovery & Operational Readiness**

Date: 2026-07-30 (living progress: 2026-08-01 mid-release)

Status: **APPROVED** · **IN PROGRESS** (US290–US293 Done; US294–US295 open)

Architecture baseline: RC-16 **BASELINE ACCEPTED** (ADR-012…ADR-018 frozen;
ADR-019 event emission semantics); RC-17 **BASELINED** Runtime Recovery
reference (E17 US240–US249 + US244A; Stage 4 PASS WITH RECOMMENDATIONS)

Constraint: This document is the authoritative planning authority for RC-18.
It consolidates existing repository decisions. It does not redesign architecture,
rename epics, or invent scope beyond what Roadmap, Technical Debt, ADL, and the
RC-17 Retrospective already record.

Related:

- [CANONICAL](../CANONICAL.md)
- [ADR Index](../adr/README.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- [Roadmap](./roadmap.md)
- [Architecture Snapshot](./architecture-snapshot.md)
- [Project Status](./project-status.md)
- [Technical Debt](./technical-debt.md) — TD-036 residual ownership
- [Release History](./release-history.md)
- [Story ID Allocation](./story-id-allocation.md) — **US240–US299** (US250–US299 remain for RC-18+)
- [RC-17 Release Planning](./rc-17-release-planning.md)
- [RC-17 Roadmap](./rc-17-roadmap.md)
- [RC-17 Retrospective](./rc-17-retrospective.md)
- [RC-17 Development Process](./rc-17-development-process.md)
- [RC-18 Development Process](./rc-18-development-process.md)
- [Residual Register](./rc-18-residual-register.md)
- [Tech Lead Decision Log](./rc-18-tech-lead-decision-log.md)
- [Mid-Release Health Review](./rc-18-mid-release-health-review.md)

---

## 1. Release Overview

| Field            | Value                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| RC name          | RC-18                                                                        |
| Release status   | **APPROVED**                                                                 |
| Previous release | RC-17 **BASELINED** (Runtime Recovery reference)                             |
| Next milestone   | US294 chaos/restart evidence → US295 ADL-008                                 |
| Release theme    | Production Recovery & Operational Readiness                                  |
| Mid-release      | [`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md) |

RC-17 established the Runtime Recovery baseline: a Session-owned Stage 3
recovery pipeline under ADR-014, with Stage 4 PASS WITH RECOMMENDATIONS.
Production restart-safety was left to RC-18.

RC-18 completes Production Recovery and Operational Readiness: it closes the
mandatory production-recovery residuals from that baseline, then delivers the
forwarded product epics E18–E21.

RC-18 is the direct continuation of RC-17. It does not reopen the Architecture
Freeze or renegotiate E17’s confirmed recovery shape.

---

## 2. Release Mission

Make the RC-17 Runtime Recovery reference **production-claimable**, then finish
the operational runtime work required for always-on paper trading: event-correct
delivery, operator-visible safety controls, resilient live market data under
load, and safe multi-strategy concurrency — while preserving ADR-012…ADR-019
and the existing bounded contexts.

RC-18 answers: _Can operators treat API restart as safe for continuous paper
sessions, with durable event progress, operable Kill Switch / Risk / incidents,
market-data fencing, and concurrent strategy Sessions on one canonical path?_

Mission alignment with the RC-17 Retrospective:

| Mission element                | Source                                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| Production Recovery completion | Mandatory TD-036 residuals; ADL-008 ACCEPTED or accepted deferral |
| Runtime hardening              | Production-claim evidence for the E17 recovery path (§3, §5)      |
| Operational readiness          | E19 Operations                                                    |
| Event durability completion    | E18 Event Processing                                              |
| Production evidence            | Chaos/restart suites; epic exits; Release Review PASS             |

---

## 3. Release Scope

### In scope

| Area                            | Scope                                                                                                                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mandatory TD-036 residuals**  | Force/confirm Session `RECOVERING` on discovery; real `RECOVERY_RECONCILIATION_PORTS` adapters; durable RecoveryState + phase machine; durable Incident on ambiguity; chaos/restart + fail-safe evidence; ADL-008 ACCEPTED or explicit accepted deferral |
| **E18 Event Processing**        | Durable consumer Inbox coverage; Outbox fan-out ops; retry/DLQ; consumer progress observability (ADR-013 / ADR-019)                                                                                                                                      |
| **E19 Operations**              | Operator APIs/dashboard projections; incidents; alerts; audit; continuous Risk / Kill Switch productization within ADR-016; recovery status API; auth hardening leftovers (TD-005 / TD-006)                                                              |
| **E20 Market Data**             | Production-grade live stream health; gap/backfill under concurrent sessions; staleness fencing; operator market status                                                                                                                                   |
| **E21 Multi-Strategy Platform** | Concurrent strategy sessions; isolation; capacity and fairness under fenced ownership                                                                                                                                                                    |
| **Process**                     | Release Planning → Architecture Review → per-epic Stage 1–6 lifecycle → Release Validation → Release Closure                                                                                                                                             |
| **Governance**                  | ADL updates (placeholders closed or marked deferred); documentation sync; RC-18 Definition of Done                                                                                                                                                       |

Mandatory TD-036 residuals complete the **production recovery claim** for the
E17 baseline. They are not a new epic and do not renumber E17–E21. Authoritative
item ownership: [`technical-debt.md`](./technical-debt.md) (TD-036 residual
ownership table).

### Soft dependencies carried forward

- TD-002 — durable scheduler/queue ownership clarification (E17/E18; no second lifecycle model)
- TD-041 — Ledger history pagination (prefer before heavy E19 history UIs)
- Existing operator/auth surfaces from RC-14 (extend, do not fork)

### Out of scope

Inherited from RC-17 Release Planning; unchanged:

- Real-capital / live broker adapters (requires future ADR; ADR-012/016/018)
- Shorting, margin, leverage, futures, options, liquidation
- Multi-exchange routing or HFT/sub-millisecond trading
- Distributed microservices, Kafka, or Kubernetes without measured need
- AI trading decisions or autonomous Risk-policy changes
- Autonomous strategy approval/deployment
- Changing bounded contexts or reversing ADR-017 dependency direction
- Speculative redesign of Orders, Risk, Execution Engine, or Accounting
- Research OS / Campaign / Knowledge redesign
- Playwright browser E2E suite (TD-043 remains deferred unless separately approved)
- Future backlog items explicitly deferred from TD-036 residuals (Order proposal from recovery SignalIntent; in-process stage cache durability beyond RecoveryState)

---

## 4. Architecture Context

**Architecture Freeze remains in effect.**

ADR-012 through ADR-019 remain authoritative:

| ADR     | Role in RC-18                                                                       |
| ------- | ----------------------------------------------------------------------------------- |
| ADR-012 | Single Execution Engine entry; paper adapter only                                   |
| ADR-013 | PostgreSQL Transactional Outbox/Inbox; at-least-once with idempotent effects        |
| ADR-014 | Trading Session lifecycle, fenced leases, checkpoints, reconciliation-before-resume |
| ADR-015 | Fill → Position → Ledger → Portfolio; Ledger as financial source of truth           |
| ADR-016 | Mandatory Risk approval; durable Kill Switch; fail-safe paper-only                  |
| ADR-017 | Module ownership, dependency direction, Dashboard/Audit as consumers                |
| ADR-018 | Immutable architectural invariants                                                  |
| ADR-019 | Event emission semantics (notifications ≠ durable facts)                            |

RC-18 **extends implementation** of the frozen architecture. It does **not**
redefine ownership, dependency direction, execution paths, durability
guarantees, or invariants. Architecture changes still require a new ADR
(ADR-018 #60). The Architecture Decision Log records chronological application
choices; it cannot silently supersede an ADR.

Confirmed E17 shape remains binding for recovery work:

- Trading Session remains the recovery orchestrator (no RecoveryCoordinator BC)
- Strategy Runtime remains isolated behind `StrategyRuntimePort`
- SignalIntent is the only downstream recovery artifact into the canonical path
- Canonical Order Path ownership unchanged

---

## 5. Carry-over from RC-17

### What RC-17 completed

RC-17 delivered and baselined:

- Session-owned recovery pipeline reference:
  discover → lease → checkpoint → reconcile → READY → EVENT_ADMISSION_ENABLED →
  ARMED → evaluate-only → SignalIntent → Session exit / lease release
- Stories US240–US249 + corrective US244A
- Stage 2 Architecture Review PROCEED; Stage 4 PASS WITH RECOMMENDATIONS
- Boundary preservation tests (Orders module bans; no RecoveryCoordinator)
- Accepted engineering baseline for RC-18 recovery/ops follow-through

### What intentionally moved into RC-18

Sources: [RC-17 Retrospective §8](./rc-17-retrospective.md),
[TD-036 residual ownership](./technical-debt.md),
[Release History scope transfer](./release-history.md).

| Forwarded work                  | Class           |
| ------------------------------- | --------------- |
| Mandatory TD-036 residuals (§3) | RC-18 mandatory |
| E18 Event Processing            | RC-18 epic      |
| E19 Operations                  | RC-18 epic      |
| E20 Market Data                 | RC-18 epic      |
| E21 Multi-Strategy Platform     | RC-18 epic      |

ADL-008 remains **DEFERRED** until mandatory residuals land or an explicit
accepted deferral is recorded. This planning document does not reinterpret that
conclusion.

---

## 6. Epic Overview

Detail lives in [RC-17 Roadmap](./rc-17-roadmap.md). Exact User Story titles are
assigned in Stage 1 Epic Planning. Soft ID guidance inside US240–US299:
E18 US250–US259 · E19 US260–US269 · E20 US270–US279 · E21 US280–US289 ·
spill/validation US290–US299. Mandatory TD-036 residual work uses free IDs in
that envelope as Stage 1 assigns them.

### E18 — Event Processing

|                      |                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**          | Close remaining ADR-013 operational gaps for durable consumers under recovery, fan-out, retry, and dead-letter conditions.                      |
| **Primary ADRs**     | ADR-013, ADR-018 #11–18, ADR-019 · ADL-009 (DEFERRED)                                                                                           |
| **Dependencies**     | Prefer production-recovery residuals far enough that restart exercises consumer progress; Event Processing module (US128–US130, US155, TD-042). |
| **Expected outcome** | Inbox coverage on every durable consumer; restart-safe fan-out; durable/queryable DLQ; duplicate-delivery proofs; no exact-once redesign.       |

### E19 — Operations

|                      |                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**          | Operator and safety experience: continuous Risk, durable Kill Switch, incidents, alerts, audit, dashboard projections, recovery status API, auth leftovers.           |
| **Primary ADRs**     | ADR-016, ADR-017 Dashboard/Audit, ADR-018 #41–48, #58–59 · ADL-010, ADL-012 · soft: TD-041                                                                            |
| **Dependencies**     | Residuals sufficient for Kill Switch / operator views on reconciled truth; E18 health/lag preferred; Risk Decisions (US165) present.                                  |
| **Expected outcome** | Kill Switch blocks execution and survives restart; fail-closed continuous Risk; durable workspace-scoped incidents/alerts; non-authoritative Dashboard; ops evidence. |

### E20 — Market Data

|                      |                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**          | Harden Live Market Data for sustained runtime: concurrent load, gap/backfill, staleness fencing, operator market health.                            |
| **Primary ADRs**     | M1 contracts + ADR-014 semantic ticks, ADR-018 #25, #49–53                                                                                          |
| **Dependencies**     | M1 complete (US126–US152); recovery continuity; E18 for durable MD projection consumers; no wall-clock business authority.                          |
| **Expected outcome** | Stale/gapped state cannot admit fenced strategy ticks; semantic continuity before READY; isolated multi-session checkpoints; replay fixtures green. |

### E21 — Multi-Strategy Platform

|                      |                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**          | Concurrent approved Deployments/Sessions under fenced ownership and isolation — one canonical execution path.                                  |
| **Primary ADRs**     | ADR-014 leases, ADR-017 isolation, ADR-018 #20, #54–55 · ADL-010, ADL-011                                                                      |
| **Dependencies**     | Production residuals + E18 + E20 exit (or accepted partial); E19 Kill Switch policy before concurrent RUNNING; CanonicalOrderPath unchanged.   |
| **Expected outcome** | ≥2 concurrent RUNNING Sessions without crossed effects; lease collision cannot commit; Kill Switch/Risk per ADL/ADR; no second execution path. |

---

## 7. Release Strategy

Implementation follows the RC-17 engineering lifecycle
([`rc-17-development-process.md`](./rc-17-development-process.md) Stages 0–6),
applied to RC-18 scope. Stages 1–6 repeat per epic. No production
implementation before Stage 2 Architecture Review exit for that epic.

Recommended sequence:

```text
Release Planning                    ← this document (Stage 0)
        ↓
Architecture Review                 ← release-level gate before first story
        ↓
Mandatory TD-036 residuals          ← production recovery claim (E17 completion)
        ↓
Architecture Review                 ← residual / epic gate as required
        ↓
Epic E18 Event Processing
        ↓
Architecture Review
        ↓
Epic E19 Operations
        ↓
Architecture Review
        ↓
Epic E20 Market Data
        ↓
Architecture Review
        ↓
Epic E21 Multi-Strategy Platform
        ↓
Release Validation
        ↓
Release Closure
```

**Rationale** (unchanged from RC-17 sequencing logic):

1. **TD-036 residuals first** — later always-on work must not amplify unproven
   recovery state; ADL-008 cannot close otherwise (§3).
2. **E18 next** — recovery proofs require durable consumer progress and Inbox coverage.
3. **E19 after durable substrate** — Kill Switch and incidents bind to recovered truth.
4. **E20 then E21** — market-data concurrency and multi-strategy isolation build on a
   recovered, event-correct single-session path.

Thin parallel work is allowed only when Architecture Review proves no
dependency on incomplete TD-036 / E18 exit criteria (for example, read-only
dashboard shells that consume existing query APIs).

---

## 8. Risks

Repository-supported risks only (RC-17 planning, Retrospective challenges, TD-036):

| Risk                                                             | Severity | Mitigation                                                                      |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| Recovery false-green (stub reconcile empty views → `RECONCILED`) | High     | RC-18 mandatory: real `RECOVERY_RECONCILIATION_PORTS`; no production stub       |
| Resume / completion before force-`RECOVERING`                    | High     | RC-18 mandatory: force/confirm `RECOVERING` on discovery                        |
| Incomplete Inbox coverage on a durable consumer                  | High     | E18 audit of every consumer; architecture tests; ADL-009                        |
| Event delivery gaps / silent DLQ ack                             | High     | E18 retry + durable DLQ; never silent acknowledge                               |
| Operator visibility gaps (recovery phase, incidents)             | Medium   | E19 recovery status/phase API; durable Incident model                           |
| Kill Switch consistency across restart / multi-session           | High     | E19 durable Kill Switch; ADL-010 before E21 concurrent RUNNING                  |
| Multi-session isolation / lease collision                        | Medium   | E20/E21: shared MD with per-session checkpoints; lease fencing                  |
| Operator dashboard becoming authoritative                        | High     | ADR-018 #33, #58 — projections only; ADL-012 transport choice non-authoritative |
| Scope creep into Execution/Accounting redesign                   | High     | Architecture Review per epic; ADL + ADR gate                                    |
| Documentation drift vs living roadmap/status                     | Medium   | Stage sync rules; one DoD checklist; Release Closure                            |
| Claiming production restart-safety before TD-036 close           | High     | Explicit release exit: mandatory residuals + evidence before PASS               |

---

## 9. Exit Criteria

RC-18 is complete only when all of the following are true:

- [ ] **Mandatory TD-036 residuals resolved** — all §3 residual items closed
      with attached chaos/restart + fail-safe evidence
- [ ] **Production Recovery claim justified** — operators may treat API restart
      as safe for continuous paper sessions under documented evidence; no open
      recovery blocker
- [ ] **ADL synchronized** — ADL-008 ACCEPTED or explicit accepted deferral
      recorded; E18–E21 related placeholders (ADL-009…012) closed or deferred
      with rationale
- [ ] **Architecture validated** — Architecture Health / Technical Reviews pass
      per epic; ADR-012…ADR-019 remain ACTIVE without silent supersession;
      Architecture Freeze intact
- [ ] **Epics E18–E21 complete** with accepted exit criteria (or explicitly
      deferred with TD owners and release-owner acceptance — not silent)
- [ ] **Release Review PASS** — explicit pass/fail published; no unresolved
      release blocker; paper-only invariant intact
- [ ] **Documentation synchronized** — `CHANGELOG`, project status, roadmap,
      architecture snapshot, module maturity, technical debt, release history,
      and story-id allocation reflect closure

Quality gates remain green: format, lint, typecheck, build, tests.
Deterministic replay evidence remains attached where applicable.

---

## 10. References

Ordered by authority. No reference removed.

| Document                          | Path                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| CANONICAL                         | [`../CANONICAL.md`](../CANONICAL.md)                                     |
| ADR Index                         | [`../adr/README.md`](../adr/README.md)                                   |
| Architecture Decision Log         | [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)               |
| Roadmap                           | [`./roadmap.md`](./roadmap.md)                                           |
| Architecture Snapshot             | [`./architecture-snapshot.md`](./architecture-snapshot.md)               |
| Project Status                    | [`./project-status.md`](./project-status.md)                             |
| Technical Debt (TD-036 residuals) | [`./technical-debt.md`](./technical-debt.md)                             |
| Release History                   | [`./release-history.md`](./release-history.md)                           |
| Story ID Allocation               | [`./story-id-allocation.md`](./story-id-allocation.md)                   |
| RC-17 Release Planning            | [`./rc-17-release-planning.md`](./rc-17-release-planning.md)             |
| RC-17 Roadmap                     | [`./rc-17-roadmap.md`](./rc-17-roadmap.md)                               |
| RC-17 Retrospective               | [`./rc-17-retrospective.md`](./rc-17-retrospective.md)                   |
| RC-17 Development Process         | [`./rc-17-development-process.md`](./rc-17-development-process.md)       |
| E17 Stage 4 Technical Review      | [`./e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md) |
| Templates                         | [`./templates/`](./templates/)                                           |

---

## Document lifecycle

```text
PLANNING
        ↓
Architecture Review
        ↓
APPROVED
        ↓
RC-18 implementation          ← current (US290–US293 Done)
        ↓
US294 → US295 → E18…E21
        ↓
Release Validation / Closure
```

### Mid-release progress (2026-08-01)

| Residual Story | Status      |
| -------------- | ----------- |
| US290          | **Done**    |
| US291          | **Done**    |
| US292          | **Done**    |
| US293          | **Done**    |
| US294          | Open (next) |
| US295          | Open        |

---

## Sign-off

| Role                    | Name / Status | Date       |
| ----------------------- | ------------- | ---------- |
| Release planning (docs) | Auto          | 2026-07-30 |
| Architecture Review     | **PASS**      | 2026-07-30 |
| Mid-release health      | Complete      | 2026-08-01 |
| Engineering owner       | _(assign)_    |            |
| Architecture owner      | _(assign)_    |            |

**Next step:** US294 chaos/restart + fail-safe evidence, then US295 ADL-008
closure. Do not claim production restart-safety PASS until both land.
