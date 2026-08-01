# US291 — Real Recovery Reconciliation Port Adapters

**Story ID:** US291  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R2)  
**Date:** 2026-07-30  
**Status:** Implemented  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — Real `RECOVERY_RECONCILIATION_PORTS` adapters (retire production stub)  
**Closes:** E17 Stage 4 TR-N2  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Predecessor Story:** [US290](./us290-force-confirm-recovering-on-discovery.md)  
**Mid-release:** [RC-18 Mid-Release Health Review](../rc-18-mid-release-health-review.md) · [RIV-001](../rc-18-riv-001-recovery-integration-validation.md)  
**Does not introduce:** implementation design, API design, database schema, class/interface design, new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-012 Execution Architecture](../../adr/ADR-012-execution-architecture.md)
- [ADR-015 Accounting Model](../../adr/ADR-015-accounting-model.md)
- [ADR-017 Module Boundaries](../../adr/ADR-017-module-boundaries.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [US290 Story Specification](./us290-force-confirm-recovering-on-discovery.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md)
- [US243 Recovery State Reconciliation](../epics/e17-us243-reconciliation.md)
- [Technical Debt](../technical-debt.md)
- [RC-17 Retrospective](../rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](../e17-stage-4-technical-review.md)

---

## 1. Story Summary

### Objective

Bind production recovery reconciliation to real module reconcile/rebuild ports
so a `RECONCILED` outcome cannot false-green on empty stub foreign views.

### Business value

Production restart trust requires reconcile results that reflect real Orders,
Execution, and Accounting state. Stub-backed `RECONCILED` undermines the
ADR-014 production recovery claim and blocks credible RC-18 residual closure.

### Architectural purpose

Complete TR-N2 by **adapter binding + production stub retirement** over the
existing US243 `RECOVERY_RECONCILIATION_PORTS` contracts and M2
reconcile/rebuild surfaces. Session continues to orchestrate; foreign modules
retain aggregate ownership via ports (ADR-012 / ADR-015 / ADR-017).

Global Freeze, ownership, lifecycle shape, and Canonical Order Path rules are
binding as already recorded in [Stage 2](../rc-18-td036-stage2-architecture-review.md)
and [US290](./us290-force-confirm-recovering-on-discovery.md) — not restated here.

US291 does **not** redesign reconcile decide-gates, Orders, Accounting,
Execution Engine, or Session ownership.

---

## 2. Problem Statement

### Current limitation

US243 landed a Session-owned, read-only reconcile stage with pure decide-gates
and outcomes `RECONCILED` \| `RECONCILIATION_FAILED`. Foreign contexts are
reached only through `RECOVERY_RECONCILIATION_PORTS`. The Stage 3 composition
default is a stub that presents empty/consistent foreign views, so production
binding can yield `RECONCILED` without consulting real module state
([US243 note](../epics/e17-us243-reconciliation.md); Stage 2 AR-01).

### Why TR-N2 exists

E17 Stage 4 recorded:

> **TR-N2** — `StubRecoveryReconciliationPorts` can yield false-green
> `RECONCILED`. TD-036 — real adapters before production trust.

RC-17 Retrospective §5.5 / §8.2 and TD-036 residual ownership classify real
`RECOVERY_RECONCILIATION_PORTS` adapters as **RC-18 mandatory**.

### Why the production claim remains incomplete

Even with US290 closing discovery → `RECOVERING`, reconcile trust is still
stub-dependent. Downstream READY / resume / completion and later Incident /
chaos evidence (US292–US294) cannot be production-authoritative while
`RECONCILED` may mean “empty stub agreed with itself.” ADL-008 correctly
remains DEFERRED until this residual (among others) lands.

---

## 3. Scope

### In scope

- Bind production recovery reconcile to **real** adapters over existing module
  reconcile/rebuild / read surfaces for the foreign contexts already compared
  by US243 (Orders, Execution, Accounting; Risk as already scoped optional).
- Retire stub bindings from the **production** recovery path so empty-stub
  consistent views are not the production authority for `RECONCILED`.
- Preserve US243 decide-gate semantics and outcome vocabulary
  (`RECONCILED` \| `RECONCILIATION_FAILED`).
- Preserve Session-orchestrates / modules-own-aggregates via ports
  (no Session import of foreign persistence internals as ownership transfer).
- Ensure empty, missing, mismatched, or unknown real views cannot silently
  succeed as `RECONCILED` when US243 rules require failure (eliminate or
  fail-closed the false-green empty-view path — Stage 1 R2 expected outcome).

### Out of scope

- Redesign of US243 reconcile algorithm / finding priority / decide-gates
- Mutative exec reconcile commands beyond existing read-only Stage 3 boundary
  (US243 residual note)
- Durable RecoveryState phase machine (US292)
- Durable Incident productization (US293) — US291 may surface failure outcomes
  that later Stories correlating; it does not deliver Incident store
- Chaos/restart evidence (US294); ADL-008 closure (US295)
- Force/confirm `RECOVERING` (US290)
- Kill Switch durable policy / operator recovery API (E19)
- Order proposal from recovery SignalIntent; Canonical Order Path redesign
- New RecoveryCoordinator BC; live broker / real-capital adapters

### Dependencies

| Dependency                                           | Relationship                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| US290                                                | Preferred sequencing predecessor (Stage 2); lifecycle precondition before trusting full production open |
| US243 decide-gates + `RECOVERY_RECONCILIATION_PORTS` | **Required** — contracts preserved, not redesigned                                                      |
| M2 reconcile/rebuild surfaces                        | **Required** — consume existing ports; do not invent parallel semantics                                 |
| ADR-012 / ADR-015 / ADR-017                          | **Binding** — Execution entry, accounting rebuild/reconcile ownership, module boundaries                |
| Stage 2 PROCEED constraints                          | **Binding** — residual scope and module change envelope                                                 |
| US292 / US293                                        | **Successors** — durable progress / Incident consume trustworthy reconcile outcomes                     |

### Non-goals

| Non-goal                                                         | Rationale                                     |
| ---------------------------------------------------------------- | --------------------------------------------- |
| Reimplement reconcile inside Session without ports               | Stage 2 US291 risks; ADR-017                  |
| Mutate foreign aggregates during this Story’s production binding | US243 read-only boundary; ownership unchanged |
| Keep stub as production binding “for convenience”                | TR-N2 / Stage 1 R2                            |
| Claim full production restart-safety from US291 alone            | Requires US292–US294 (+ US295) per RC-18      |

---

## 4. Functional Requirements

Behaviour only.

### FR-1 — Production path uses real ports

The production recovery reconcile stage must obtain Orders, Execution, and
Accounting (and Risk where already in US243 scope) views through real module
port adapters, not through empty-consistent stub defaults.

### FR-2 — Stub is not production authority

`StubRecoveryReconciliationPorts` (or equivalent empty/consistent stub) must
not be the production binding for recovery reconciliation.

### FR-3 — Decide-gate outcomes preserved

Reconcile still yields only `RECONCILED` or `RECONCILIATION_FAILED` under
existing US243 rules. Real adapters must not invent alternate production
outcome vocabularies or bypass those gates.

### FR-4 — False-green empty views eliminated or fail-closed

When real foreign views are empty, missing, unknown, or mismatched in ways
US243 already treats as failure, the production path must not report
`RECONCILED` solely because a stub returned empty-consistent data.

### FR-5 — Ownership via ports unchanged

Trading Session orchestrates reconciliation. Orders, Execution Engine, and
Accounting modules remain owners of their aggregates. Session must not absorb
foreign persistence internals or redefine Order / Fill / Ledger / Portfolio
semantics.

### FR-6 — Read-only recovery compare boundary preserved

This Story does not authorize recovery-time mutation of Orders, Fills, Ledger,
or Portfolio as a shortcut around Canonical Order Path / ADR-015 rebuild rules.

### FR-7 — Downstream stages consume real outcomes

Later pipeline stages that require `RECONCILED` (US244+) must, on the
production path, depend on outcomes produced from real port views.

---

## 5. Acceptance Criteria

### AC-1 — Real adapters on production path

**Given** a recovery candidate that has `LEASE_ACQUIRED` + `VALID_CHECKPOINT`  
**When** production recovery reconcile runs  
**Then** foreign views for Orders / Execution / Accounting (and Risk if
in-scope) are obtained via real module port adapters  
**Authority:** Stage 2 US291; TD-036 R2; US243 port contract

### AC-2 — Production stub retired

**Given** production composition for recovery reconcile  
**When** the production binding is inspected / exercised  
**Then** empty-consistent stub ports are not the production authority for
`RECONCILED`  
**Authority:** TR-N2; Stage 1 R2; Stage 2 AR-01

### AC-3 — False-green empty-view path closed

**Given** real foreign views that are empty, missing, unknown, or mismatched
under existing US243 failure rules  
**When** production reconcile decides  
**Then** outcome is not a silent `RECONCILED` attributable to stub emptiness;
failure rules of US243 apply against real views  
**Authority:** TR-N2; US243 comparison matrix; Stage 1 R2 expected outcome

### AC-4 — Decide-gate vocabulary unchanged

**Given** production reconcile with real adapters  
**When** reconcile completes  
**Then** outcome is only `RECONCILED` or `RECONCILIATION_FAILED` as defined by
US243  
**Authority:** E17 Spec US243 contract; Stage 2 “does not redesign decide-gates”

### AC-5 — No foreign ownership transfer

**Given** US291 is delivered  
**When** architecture/boundary review is performed  
**Then** Session still orchestrates via ports; Orders / Execution / Accounting
ownership and ADR-017 dependency direction are unchanged; no RecoveryCoordinator
BC appears  
**Authority:** ADR-012; ADR-015; ADR-017; Stage 2 §3.2–§3.3, US291 validation

### AC-6 — No Canonical Order Path / accounting redesign

**Given** US291 is delivered  
**When** Freeze / path review is performed  
**Then** Canonical Order Path is unchanged; no recovery-only order types; no
compensating Ledger shortcut invented by this Story  
**Authority:** Stage 2 §3.6 / §8.2; ADR-012; ADR-015; E17 Spec forbidden paths

### AC-7 — Residual sequencing preserved

**Given** US291 closes TR-N2 adapter trust  
**When** residual planning is reviewed  
**Then** durable RecoveryState / Incident / chaos / ADL-008 remain later Stories
(US292–US295); US291 did not absorb them  
**Authority:** Stage 2 sequencing; TD-036 residual ownership

---

## 6. Architecture Invariants

US291-specific. Global Freeze / lifecycle / dual-status rules:
[Stage 2](../rc-18-td036-stage2-architecture-review.md) §3 and §8.2;
[US290](./us290-force-confirm-recovering-on-discovery.md) §4 / §7.

1. **Port boundary preserved** — foreign state enters reconcile only through
   `RECOVERY_RECONCILIATION_PORTS` (or equivalent Session-local port contract).
2. **Foreign ownership preserved** — Orders / Execution / Accounting own
   aggregates; Session does not reimplement their reconcile/rebuild semantics.
3. **Decide-gates unchanged** — US243 pure compare / outcome model remains the
   reconcile authority.
4. **No stub production authority** — empty-consistent stubs are not production
   truth for `RECONCILED`.
5. **Read-only compare boundary** — this Story does not introduce recovery-time
   mutative shortcuts around ADR-012 / ADR-015.
6. **No RecoveryCoordinator / path fork** — Stage 2 constraints remain binding.

---

## 7. Risks

Story-specific only. Cross-residual risks:
[Stage 2](../rc-18-td036-stage2-architecture-review.md) §6.

| ID   | Risk                                                                           | Severity | Mitigation                                                             |
| ---- | ------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------- |
| R-01 | Stub remains production binding → continued false-green `RECONCILED`           | High     | AC-1/AC-2; production stub retirement mandatory                        |
| R-02 | Reimplement reconcile inside Session / mutate foreign aggregates without ports | High     | AC-5; Stage 2 US291 architectural risks; ADR-017                       |
| R-03 | Redesign Orders / Accounting / Execution semantics under “adapter” work        | High     | Out of scope; AC-6; Freeze / Stage 2 module envelope                   |
| R-04 | Keep stub in tests mistaken for production trust evidence                      | Medium   | Production-path AC-2; distinguish test doubles from production binding |
| R-05 | Absorb Incident / RecoveryState durability into US291                          | Medium   | AC-7; successors US292–US293                                           |

---

## 8. Verification

1. **Production binding** — real adapters supply foreign views; stub is not
   production authority (AC-1, AC-2).
2. **False-green closure** — empty/missing/unknown/mismatch real views cannot
   silently `RECONCILED` via stub behaviour (AC-3).
3. **Contract stability** — US243 outcomes and decide-gates unchanged (AC-4).
4. **Ownership / Freeze** — ports-only orchestration; no BC; no Canonical path
   redesign (AC-5, AC-6); cite Stage 2 rather than re-auditing all Freeze ADRs
   from scratch.
5. **Scope discipline** — US292–US295 / E19 / mutative reconcile redesign not
   absorbed (AC-7).

---

## 9. Definition of Done

- [x] This Story Specification accepted as implementation authority for US291
- [x] Stage 3 planning cites this document + Stage 2 PROCEED + US243 port
      contracts + ADR-012 / ADR-015 / ADR-017
- [x] AC-1…AC-7 satisfied with reviewable evidence
- [x] TR-N2 closed for production reconcile trust (no production stub
      false-green path)
- [x] TD-036 residual row for real `RECOVERY_RECONCILIATION_PORTS` adapters
      updated when evidence lands
- [x] Architecture Freeze intact; no Orders / Accounting / Execution redesign;
      no RecoveryCoordinator
- [x] Scope not expanded into US292–US295 / E19 / future backlog
- [x] Docs sync as required by residual DoD practice
- [x] Quality gates green for the implementing change set

**Not required for US291 DoD alone:** RecoveryState durability; Incident store;
chaos evidence; ADL-008 closure; full restart-safety PASS language.

---

## 10. References

Ordered by authority. Architecture already decided in Stage 2 / US290 is
referenced, not duplicated.

| #   | Document                             | Path                                                                                                   |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1   | CANONICAL                            | [`../../CANONICAL.md`](../../CANONICAL.md)                                                             |
| 2   | ADR Index                            | [`../../adr/README.md`](../../adr/README.md)                                                           |
| 3   | ADR-012 Execution Architecture       | [`../../adr/ADR-012-execution-architecture.md`](../../adr/ADR-012-execution-architecture.md)           |
| 4   | ADR-015 Accounting Model             | [`../../adr/ADR-015-accounting-model.md`](../../adr/ADR-015-accounting-model.md)                       |
| 5   | ADR-017 Module Boundaries            | [`../../adr/ADR-017-module-boundaries.md`](../../adr/ADR-017-module-boundaries.md)                     |
| 6   | RC-18 Stage 2 Architecture Review    | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)         |
| 7   | US290 Story Specification            | [`./us290-force-confirm-recovering-on-discovery.md`](./us290-force-confirm-recovering-on-discovery.md) |
| 8   | E17 Runtime Recovery Specification   | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)     |
| 9   | US243 Recovery State Reconciliation  | [`../epics/e17-us243-reconciliation.md`](../epics/e17-us243-reconciliation.md)                         |
| 10  | Technical Debt (TD-036)              | [`../technical-debt.md`](../technical-debt.md)                                                         |
| 11  | RC-17 Retrospective                  | [`../rc-17-retrospective.md`](../rc-17-retrospective.md)                                               |
| 12  | E17 Stage 4 Technical Review (TR-N2) | [`../e17-stage-4-technical-review.md`](../e17-stage-4-technical-review.md)                             |

---

## Document lifecycle

```text
Implemented
        ↓
Stage 3 implementation COMPLETE
        ↓
RIV-001 / Mid-Release Health Review
        ↓
DoD COMPLETE → next residual US292 (Done)
```

---

## Sign-off

| Role                        | Name / Status                 | Date       |
| --------------------------- | ----------------------------- | ---------- |
| Story Specification (docs)  | Auto                          | 2026-07-30 |
| Engineering owner           | _(assign)_                    |            |
| Architecture owner          | _(assign)_                    |            |
| Stage 2 Architecture Review | PROCEED (binding constraints) | 2026-07-30 |

**Authority statement:** This document is the implementation authority for
US291. It defines WHAT must be achieved (real port binding + production stub
retirement under existing US243 contracts). It does not prescribe HOW.

**Next step:** Stage 3 implementation planning for US291, then coding under
Freeze — before US292.
