# RC-18 Stage 2 — Mandatory TD-036 Residuals Architecture Review

**Release:** RC-18 — Production Recovery & Operational Readiness  
**Review subject:** Mandatory TD-036 residual Story set (US290–US295 tentative)  
**Date:** 2026-07-30  
**Status:** COMPLETE — decision **PROCEED** (with recorded constraints)  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 (RC-18 mandatory residual class only)  
**Preceding authority:** [RC-18 TD036 Epic Planning](./rc-18-td036-epic-planning.md) (Stage 1)  
**Release authority:** [RC-18 Release Planning](./rc-18-release-planning.md) (**APPROVED**)  
**Does not introduce:** a new Epic, new bounded context, ADR change, implementation, API, schema, or database design

Related:

- [CANONICAL](../CANONICAL.md)
- [ADR Index](../adr/README.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md) — ADL-008 DEFERRED
- [RC-18 Release Planning](./rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](./rc-18-td036-epic-planning.md)
- [Technical Debt](./technical-debt.md) — TD-036 residual ownership
- [E17 Runtime Recovery Specification](./epics/e17-runtime-recovery-specification.md)
- [E17 Stage 4 Technical Review](./e17-stage-4-technical-review.md)
- [RC-17 Retrospective](./rc-17-retrospective.md)
- [RC-17 Development Process](./rc-17-development-process.md) — Stage 2 lifecycle
- [Roadmap](./roadmap.md)
- [Project Status](./project-status.md)
- [Architecture Snapshot](./architecture-snapshot.md)
- [Story ID Allocation](./story-id-allocation.md)

---

## 1. Review Objective

Validate that the mandatory TD-036 residual Stories planned in Stage 1
**preserve the frozen architecture** before Story specification and
implementation planning begin.

This review answers:

- Do US290–US295 (tentative) extend the RC-17 Session-owned recovery baseline
  without replacing it?
- Do ownership, dependency direction, recovery lifecycle, event flow, and
  Canonical Order Path remain intact?
- Are RecoveryState and Incident ownership clear and non-duplicative?
- Is Architecture Freeze preserved (no new BC, no ADR renegotiation)?
- May the residual workstream proceed to Story specification (post–Stage 2)?

**This document is Architecture Review only.** It is not implementation, not
technical design, not API specification, and not database design.

---

## 2. Scope of Review

### 2.1 In scope

| Item                                   | Source                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| Six mandatory TD-036 residuals (R1–R6) | Stage 1 Epic Planning §2.1; TD-036 residual ownership; RC-18 §3 |
| Tentative Stories US290–US295          | Stage 1 §5                                                      |
| Sequencing US290 → … → US295 → E18     | Stage 1 §6; RC-18 §7                                            |
| Confirmed E17 recovery shape           | RC-18 §4; Stage 1 §3; E17 Spec §4–§5                            |
| Architecture Freeze ADR-012…ADR-019    | CANONICAL; ADR Index; ADL-001                                   |
| RecoveryState / Incident ownership     | E17 Spec §5, §4.6 P0-1; Stage 1 R3/R4                           |

### 2.2 Explicitly out of review redesign

This review does **not** redesign or renegotiate:

- Orders, Risk, Execution Engine, Accounting, or Canonical Order Path
- A new RecoveryCoordinator / Recovery bounded context
- ADR-017 dependency direction
- Exact-once event redesign; Kafka / microservices
- E19 Kill Switch durable policy or operator recovery status/phase API
- Order proposal from recovery SignalIntent (future backlog)
- Broader in-process stage-cache durability beyond RecoveryState
- Real-capital / live broker adapters

### 2.3 Entry conditions (satisfied)

| Condition                                           | Evidence                                                |
| --------------------------------------------------- | ------------------------------------------------------- |
| RC-18 Release Planning APPROVED                     | Stage 0 Architecture Review PASS                        |
| Stage 1 Epic Planning for mandatory residuals filed | `rc-18-td036-epic-planning.md`                          |
| Architecture Freeze in effect                       | ADR-012…ADR-019 ACTIVE                                  |
| RC-17 E17 baseline available                        | US240–US249 + US244A; Stage 4 PASS WITH RECOMMENDATIONS |
| No production implementation claimed by this gate   | Process Stage 2 rule                                    |

---

## 3. Architecture Validation

### 3.1 Bounded contexts

| Check                                                    | Result   | Authority                             |
| -------------------------------------------------------- | -------- | ------------------------------------- |
| No new Recovery / RecoveryCoordinator BC                 | **PASS** | E17 Spec §5.1; Stage 1 §2.2; RC-18 §4 |
| Work stays inside existing Trading Session orchestration | **PASS** | ADR-014; E17 Spec §5                  |
| Module ports remain owners of their aggregates           | **PASS** | E17 Spec §5 ownership table           |
| Research session recovery remains isolated               | **PASS** | E17 Spec §10.2                        |

**Verdict:** Residuals complete production claim for the existing Session-owned
pipeline. They do not introduce a bounded context.

### 3.2 Ownership

| Responsibility                                                    | Owning context                                                                         | Residual Stories | Validation       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- | ---------------- |
| Force/confirm Session `RECOVERING` on discovery                   | Trading Session                                                                        | US290            | Preserved        |
| Bind real reconcile/rebuild ports (no foreign ownership transfer) | Trading Session orchestrates; Orders / Execution / Accounting own aggregates via ports | US291            | Preserved        |
| Durable RecoveryState + phase machine                             | Trading Session                                                                        | US292            | Preserved (P0-1) |
| Minimal durable Incident on ambiguity/corruption                  | Trading Session (provisional until E19 richer Safety Incident)                         | US293            | Preserved        |
| Chaos/restart + fail-safe evidence                                | Evidence only; no new owner BC                                                         | US294            | Preserved        |
| ADL-008 ACCEPTED or explicit accepted deferral                    | Architecture owner (governance)                                                        | US295            | Preserved        |

**Forbidden ownership shifts (confirmed not in Stage 1 scope):** Job/scheduler
owning recovery lifecycle (TD-002); Runtime owning Orders/accounting;
Dashboard becoming authoritative; `live-trading-engine.RecoveryManager` as
paper recovery path.

### 3.3 Dependency direction

| Check                                                                         | Result   | Authority                         |
| ----------------------------------------------------------------------------- | -------- | --------------------------------- |
| ADR-017 module dependency direction unchanged                                 | **PASS** | RC-18 §4; Stage 1 out-of-scope    |
| Session orchestrates via ports; does not absorb foreign persistence internals | **PASS** | E17 Spec §5; US243 shape          |
| Strategy Runtime remains behind `StrategyRuntimePort`                         | **PASS** | RC-18 §4 confirmed shape          |
| No reverse dependency from Accounting/Orders into Session internals           | **PASS** | ADR-017; boundary tests precedent |

**Verdict:** Residuals are completion work on existing edges, not dependency
inversions.

### 3.4 Recovery lifecycle

Confirmed binding sequence (do not renegotiate):

```text
discover → lease → checkpoint → reconcile → READY
  → EVENT_ADMISSION_ENABLED → ARMED
  → evaluate-only → SignalIntent → Session exit / lease release
```

| Check                                                                                    | Result            |
| ---------------------------------------------------------------------------------------- | ----------------- |
| Residuals fill production gaps on this sequence; they do not invent a parallel lifecycle | **PASS**          |
| US290 closes discovery → `RECOVERING` precondition (TR-N1)                               | **PASS**          |
| US291 closes real reconcile trust (TR-N2)                                                | **PASS**          |
| US292 closes durable phase progress (TR-N3 / P0-1)                                       | **PASS**          |
| US293 closes fail-closed ambiguity (R18 / ADR-014)                                       | **PASS**          |
| US294 evidences crash/fail-safe behaviour (TR-N4)                                        | **PASS**          |
| Dual status rule (Session status vs RecoveryState phase) remains                         | **PASS**          |
| Job queue must not become a second Session lifecycle                                     | **PASS** (TD-002) |

### 3.5 Event flow

| Check                                                                              | Result   | Authority                    |
| ---------------------------------------------------------------------------------- | -------- | ---------------------------- |
| SignalIntent remains the only downstream recovery artifact into the canonical path | **PASS** | RC-18 §4; Stage 1 §3         |
| Session recovery transitions continue to use transactional Outbox                  | **PASS** | E17 invariant R20; ADR-013   |
| Process-local Event Bus remains non-authoritative for durable facts                | **PASS** | ADR-013; ADR-019             |
| Residuals do not claim exact-once redesign                                         | **PASS** | Stage 1 / RC-18 out-of-scope |
| Order proposal from recovery SignalIntent remains future backlog                   | **PASS** | TD-036 residual table        |

### 3.6 Canonical Order Path

| Check                                                                              | Result   | Authority                  |
| ---------------------------------------------------------------------------------- | -------- | -------------------------- |
| Canonical Order Path ownership unchanged                                           | **PASS** | RC-18 §4; ADR-012; ADL-003 |
| Recovery does not bypass Canonical Order Path / invent compensating Ledger entries | **PASS** | E17 Spec S5 forbidden path |
| No recovery-only order types                                                       | **PASS** | E17 Spec §10.7             |
| `canonical-order-path/` allowed change: none unless wiring bug                     | **PASS** | E17 Spec §10.7             |

### 3.7 RecoveryState ownership

| Rule                                                                                  | Validation                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Trading Session owns RecoveryState persistence and phase progress                     | **PASS** — US292 maps to R3 / original US249 Persistence ACs / P0-1 |
| RecoveryState is source of truth for phase/progress (Session summary may mirror only) | **PASS** — E17 Spec §4.6 P0-1                                       |
| `resumeIntent` persisted explicitly at discovery/`RECOVERING` open                    | **PASS** — US290 + US292 alignment                                  |
| In-process `lastResult` / Sets remain non-authoritative                               | **PASS** — ADR-018 #22; TR-N6; future backlog beyond RecoveryState  |
| Broader stage-cache durability beyond RecoveryState deferred                          | **PASS** — TD-036 future backlog; Stage 1 out-of-scope              |

### 3.8 Incident ownership

| Rule                                                                            | Validation                               |
| ------------------------------------------------------------------------------- | ---------------------------------------- |
| Ambiguity/corruption → durable Incident + blocked execution (never silent skip) | **PASS** — US293; ADR-014; invariant R18 |
| Minimal Recovery Incident owned by Trading Session until E19 productization     | **PASS** — E17 Spec §5; Stage 1 R4       |
| US293 does not deliver E19 incident dashboard/productization                    | **PASS** — Stage 1 §5 decomposition      |
| Operator recovery status/phase API remains E19                                  | **PASS** — TD-036 E19 operational class  |
| Kill Switch durable admission/arming policy remains E19                         | **PASS** — TR-N5; Stage 1 out-of-scope   |

### 3.9 Architecture Freeze summary

| ADR     | Role relative to residuals                                      | Freeze impact                       |
| ------- | --------------------------------------------------------------- | ----------------------------------- |
| ADR-012 | Single Execution Engine entry; paper adapter                    | Unchanged                           |
| ADR-013 | Outbox/Inbox durability substrate                               | Consumed, not redesigned            |
| ADR-014 | Session lifecycle, leases, reconcile-before-resume              | Implemented further; not redefined  |
| ADR-015 | Accounting truth / rebuild ports                                | Ports consumed; semantics unchanged |
| ADR-016 | Risk / Kill Switch (read during recovery; durable policy → E19) | Preserved                           |
| ADR-017 | Ownership and dependency direction                              | Preserved                           |
| ADR-018 | Immutable invariants (esp. #20–25, #23–24, #33, #58)            | Preserved                           |
| ADR-019 | Event emission ≠ durable facts                                  | Preserved                           |

**Overall Architecture Validation:** **PASS** — residuals are architecture-preserving completion of the E17 baseline under Architecture Freeze.

---

## 4. Story-by-Story Review

Tentative IDs US290–US295 per Stage 1. Final ID confirmation remains inside
US240–US299 per story-id allocation; scope and sequencing are binding.

### US290 — Force/confirm `RECOVERING` on discovery

| Field                          | Content                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture objective**     | Make discovery → Session `RECOVERING` an explicit, Session-owned lifecycle precondition so completion/exit does not depend on an undocumented state.          |
| **Architectural dependencies** | Existing US240 discovery selection; ADR-014 Session transitions; E17 P0-2 `STOPPING` → `RECOVERING` with `resumeIntent = STOPPED`; US249 completion contract. |
| **Architectural risks**        | Premature arming/resume before status consistency; inventing a second discovery owner; expanding into lease/checkpoint/reconcile redesign.                    |
| **Validation result**          | **PASS** — lifecycle precondition only; no new BC; ownership stays on Trading Session (TR-N1 closure path).                                                   |

### US291 — Real recovery reconciliation port adapters

| Field                          | Content                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Architecture objective**     | Bind production recovery reconcile to real module ports so `RECONCILED` cannot false-green on empty stub views.                                        |
| **Architectural dependencies** | Existing US243 decide-gates and `RECOVERY_RECONCILIATION_PORTS` contracts; M2 reconcile/rebuild surfaces; ADR-012/015 ownership.                       |
| **Architectural risks**        | Reimplementing reconcile inside Session; mutating foreign aggregates without ports; redesigning Orders/Accounting; keeping stub as production binding. |
| **Validation result**          | **PASS** — adapter binding + stub retirement only; foreign ownership unchanged (TR-N2 closure path).                                                   |

### US292 — Durable RecoveryState + phase machine

| Field                          | Content                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture objective**     | Persist Session-owned RecoveryState and durable phase progress across restart so recovery authority is not in-memory stage cache.                   |
| **Architectural dependencies** | E17 §4.5 phase machine; §4.6 P0-1; US290 lifecycle consistency preferred; ADR-013 durability patterns; TD-002 (no Job-queue lifecycle).             |
| **Architectural risks**        | Encoding a second lifecycle in Job payloads; making Session JSON the sole unauditable authority; absorbing E19 operator status API into this Story. |
| **Validation result**          | **PASS** — persistence/phase durability only; operator API remains E19 (TR-N3 / P0-1).                                                              |

### US293 — Durable Incident on ambiguity / corruption

| Field                          | Content                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture objective**     | Persist minimal Recovery Incident on ambiguity/corruption and block unsafe resume/execution (fail closed).                                                                 |
| **Architectural dependencies** | US291 real reconcile outcomes; US292 RecoveryState correlation (`incidentId` / failed phase); ADR-014 Incident rule; E19 may later supersede richer Safety Incident model. |
| **Architectural risks**        | Inventing a parallel Incident product BC; silent heal that duplicates effects; expanding into E19 ops dashboard; treating logs as Incident authority.                      |
| **Validation result**          | **PASS** — minimal durable path under Trading Session; E19 productization out of scope (R18 / TR-N3).                                                                      |

### US294 — Chaos/restart + fail-safe evidence

| Field                          | Content                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture objective**     | Provide repeatable chaos/restart and fail-safe evidence for the production recovery claim without expanding product epic scope.                         |
| **Architectural dependencies** | Meaningful R1–R4 behaviour (US290–US293); boundary tests remain green; original US247/US248 evidence intent; RC-18 exit evidence rule.                  |
| **Architectural risks**        | False-green evidence before real ports/durability; absorbing unfinished R1–R4 into “tests”; claiming production restart-safety without attached suites. |
| **Validation result**          | **PASS** — evidence-only Story; must not redefine architecture (TR-N4).                                                                                 |

### US295 — ADL-008 closure (ACCEPTED or accepted deferral)

| Field                          | Content                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture objective**     | Close ADL-008 chronologically: ACCEPTED when residuals + evidence justify ownership record, or explicit accepted deferral with rationale/owner — without superseding ADR-014. |
| **Architectural dependencies** | US290–US294 closed **or** Architecture/Release owner acceptance of explicit deferral; ADL vs ADR authority rules.                                                             |
| **Architectural risks**        | Silent ACCEPTED while TR-N1…N4 open; using ADL to override ADR Freeze; treating this as a runtime feature Story.                                                              |
| **Validation result**          | **PASS** — governance/docs gate only; Freeze preserved (TR-N9).                                                                                                               |

---

## 5. Cross-Story Validation

| Cross-check                     | Result   | Notes                                                                                                                     |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| No duplicated responsibility    | **PASS** | One primary residual per Story (R1–R6); R3/R4 split deliberately for independent review of progress vs Incident semantics |
| No circular dependency          | **PASS** | Linear sequence US290→US291→US292→US293→US294→US295 matches residual dependency rules                                     |
| No hidden architecture          | **PASS** | No new orchestration model, event bus, or parallel recovery stack introduced in Stage 1                                   |
| No new bounded contexts         | **PASS** | Explicitly rejected RecoveryCoordinator BC remains rejected                                                               |
| E19 scope not absorbed          | **PASS** | Kill Switch durable policy, operator recovery status/phase API, auth leftovers remain E19                                 |
| Future backlog not absorbed     | **PASS** | SignalIntent→Order proposal; broader cache durability deferred                                                            |
| Canonical path not forked       | **PASS** | SignalIntent-only downstream; no recovery-only execution path                                                             |
| Sequencing before E18 preserved | **PASS** | RC-18 Release Strategy §7                                                                                                 |

**Cross-Story verdict:** **PASS** — decomposition is architecture-safe for Story specification.

---

## 6. Architecture Risks

Repository-supported risks only (Stage 1 §7, RC-18 §8, Stage 4 TR-N*, Retrospective, TD-036):

| ID    | Risk                                                      | Severity | Architectural mitigation                                                   |
| ----- | --------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| AR-01 | Stub reconcile false-green → `RECONCILED`                 | High     | US291 mandatory; production stub retirement                                |
| AR-02 | Completion/resume without force-`RECOVERING`              | High     | US290 mandatory; Session lifecycle precondition                            |
| AR-03 | Claiming production restart-safety without chaos evidence | High     | US294 evidence gate; RC-18 exit criteria                                   |
| AR-04 | ADL-008 ACCEPTED while RecoveryState/Incident incomplete  | High     | US292–US293 before US295; ACCEPTED only with evidence or explicit deferral |
| AR-05 | Scope creep into Execution/Accounting redesign            | High     | Freeze; this Stage 2 gate; Stage 1 out-of-scope list                       |
| AR-06 | Absorbing E19 Kill Switch / operator API into residuals   | Medium   | Explicit E19 ownership; US292/US293 boundary statements                    |
| AR-07 | Expanding Incident into full E19 ops product              | Medium   | Minimal Session-owned Incident only                                        |
| AR-08 | Second lifecycle via Job queue / in-memory authority      | Medium   | TD-002 clarification; RecoveryState as phase authority                     |
| AR-09 | Story-ID band collision with E18 soft IDs                 | Medium   | Prefer US290–US299 spill/validation; update allocation on assignment       |
| AR-10 | Documentation drift vs TD / roadmap / status              | Medium   | Residual DoD docs sync; US295/ADL alignment                                |

No risk in this table requires a new ADR. All are completion/governance risks
under existing Freeze.

---

## 7. Stage 2 Exit Criteria

Stage 2 for the mandatory TD-036 residual Story set exits when:

- [x] Architecture Validation (§3) PASS for bounded contexts, ownership,
      dependency direction, recovery lifecycle, event flow, Canonical Order Path,
      RecoveryState ownership, and Incident ownership
- [x] Story-by-Story Review (§4) PASS for US290–US295 (tentative) without
      implementation design
- [x] Cross-Story Validation (§5) PASS — no duplicated responsibility, circular
      dependency, hidden architecture, or new BC
- [x] Architecture Risks (§6) recorded with Freeze-preserving mitigations
- [x] Architecture Freeze intact — ADR-012…ADR-019 unchanged; no ADR opened
- [x] Decision recorded: **PROCEED** with constraints (§8)
- [x] Modules allowed / forbidden for residual implementation listed (§8)
- [x] Ready for Story specification / AC finalization — **not** for silent
      Stage 3 production coding without per-Story ACs citing ADRs

**Hard stop (process):** if a later Story specification would touch more than
three modules or exceed residual scope, re-enter Architecture Review before
implementation.

---

## 8. Recommendations

### 8.1 Architecture Review decision

**PROCEED** — mandatory TD-036 residual Stories may advance to Story
specification and subsequent Stage 3 implementation **under the constraints
below**.

### 8.2 Constraints (binding)

1. **No new bounded context** — Session-owned orchestrator only.
2. **No ADR change** — residuals implement ADR-014 production claim; they do
   not redefine Freeze ADRs. ADL-008 may ACCEPTED or explicitly defer; ADL
   cannot override ADR.
3. **Preserve confirmed recovery shape** — discover → lease → checkpoint →
   reconcile → READY → admission → arm → evaluate-only → SignalIntent → exit.
4. **Canonical Order Path unchanged** — SignalIntent is the only recovery
   downstream artifact into that path.
5. **RecoveryState ownership** — Trading Session; durable phase authority per
   E17 P0-1 intent (specification may detail persistence later; this review
   does not prescribe schema).
6. **Incident ownership** — minimal durable Recovery Incident under Trading
   Session; E19 owns richer Safety Incident productization.
7. **Out of residual scope remains out** — E19 Kill Switch/operator API; Order
   proposal from SignalIntent; broader cache durability; Execution/Accounting
   redesign.
8. **Sequencing** — US290→US291→US292→US293→US294→US295 before E18 product
   epic production implementation (thin parallel only with separate Architecture
   Review proof per RC-18 §7).
9. **Evidence before production claim language** — US294 required before
   release-level restart-safety PASS language.
10. **Story IDs** — confirm US290–US295 (or accepted reassignment in
    US240–US299) in story-id allocation at specification entry.

### 8.3 Modules allowed to change (inherited E17 gate; residual completion)

| Module                                                                                             | Allowed for residuals                                                                                                                                      | Forbidden                                                                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `trading-session/`                                                                                 | Force/confirm `RECOVERING`; RecoveryState durability/phase; minimal Incident; discovery/completion consistency; recovery Outbox events already in baseline | Owning Order/Fill/Ledger mutations; new BC                                   |
| Foreign reconcile surfaces (`orders/`, `execution-engine/`, `positions/`, `ledger/`, `portfolio/`) | Expose/consume **existing** reconcile/rebuild ports for real adapters                                                                                      | New accounting/execution semantics; recovery-only order types                |
| `strategy-runtime/`                                                                                | Recovery-safe gates already defined; no new Order submit                                                                                                   | Order submit; accounting writes                                              |
| `risk/`                                                                                            | Read Kill Switch / decisions for existing gates                                                                                                            | Durable Kill Switch policy redesign (E19); clear Kill Switch during recovery |
| `event-processing/`                                                                                | Existing Session recovery Outbox usage                                                                                                                     | Exact-once redesign; new bus                                                 |
| `canonical-order-path/`                                                                            | None unless wiring bug                                                                                                                                     | New execution semantics                                                      |
| `live-trading-engine/`                                                                             | **None** for paper recovery path                                                                                                                           | Parallel recovery path                                                       |
| Dashboard / UI                                                                                     | Optional non-authoritative reads only if already scoped elsewhere                                                                                          | Authoritative ledger; E19 operator API delivery via residual Stories         |
| ADL / project docs                                                                                 | US295 closure sync                                                                                                                                         | Silent ADR supersession                                                      |

### 8.4 Next step

Proceed to **Story specification** (Acceptance Criteria finalization citing
ADRs/invariants) for US290–US295 in sequence, then Stage 3 implementation per
Story — still under Architecture Freeze.

Do **not** begin Epic E18 Stage 1 product planning as the next sequenced epic
until residual workstream exit criteria (Stage 1 §9.2 / RC-18 §9 mandatory
residuals) are met or explicitly deferred with owner acceptance.

---

## 9. References

Ordered by authority. This review consolidates existing decisions; it does not
invent architecture.

| Document                            | Path                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| CANONICAL                           | [`../CANONICAL.md`](../CANONICAL.md)                                                             |
| ADR Index                           | [`../adr/README.md`](../adr/README.md)                                                           |
| Architecture Decision Log (ADL-008) | [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)                                       |
| RC-18 Release Planning              | [`./rc-18-release-planning.md`](./rc-18-release-planning.md)                                     |
| RC-18 TD036 Epic Planning (Stage 1) | [`./rc-18-td036-epic-planning.md`](./rc-18-td036-epic-planning.md)                               |
| Technical Debt (TD-036 residuals)   | [`./technical-debt.md`](./technical-debt.md)                                                     |
| E17 Runtime Recovery Specification  | [`./epics/e17-runtime-recovery-specification.md`](./epics/e17-runtime-recovery-specification.md) |
| E17 Stage 4 Technical Review        | [`./e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md)                         |
| RC-17 Retrospective                 | [`./rc-17-retrospective.md`](./rc-17-retrospective.md)                                           |
| RC-17 Development Process (Stage 2) | [`./rc-17-development-process.md`](./rc-17-development-process.md)                               |
| Roadmap                             | [`./roadmap.md`](./roadmap.md)                                                                   |
| Project Status                      | [`./project-status.md`](./project-status.md)                                                     |
| Architecture Snapshot               | [`./architecture-snapshot.md`](./architecture-snapshot.md)                                       |
| Story ID Allocation                 | [`./story-id-allocation.md`](./story-id-allocation.md)                                           |
| Release History                     | [`./release-history.md`](./release-history.md)                                                   |

---

## 10. Sign-off

| Role                               | Name / Status                       | Date       |
| ---------------------------------- | ----------------------------------- | ---------- |
| Stage 2 Architecture Review (docs) | Auto                                | 2026-07-30 |
| Architecture Review decision       | **PROCEED** (with §8.2 constraints) | 2026-07-30 |
| Engineering owner                  | _(assign)_                          |            |
| Architecture owner                 | _(assign)_                          |            |
| Release lead                       | _(assign)_                          |            |

**Authority statement:** This document is the formal Stage 2 Architecture
Review authority for the mandatory TD-036 residual Story set. Implementation
planning and Stage 3 coding for US290–US295 must cite this review’s
constraints and the frozen ADRs. Architecture Freeze remains in effect.

**Next step:** Story specification / AC finalization for US290 (first in
sequence), then Stage 3 under PROCEED constraints — before Epic E18 as the next
sequenced product epic.
