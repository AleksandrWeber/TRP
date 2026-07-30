# RC-18 Stage 1 — Mandatory TD-036 Residuals Epic Planning

**Release:** RC-18 — Production Recovery & Operational Readiness  
**Planning subject:** Mandatory TD-036 residual work (E17 production-recovery completion)  
**Date:** 2026-07-30  
**Status:** PLANNING (Stage 1)  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 (residual ownership — RC-18 mandatory class only)  
**Preceding authority:** [RC-18 Release Planning](./rc-18-release-planning.md) (**APPROVED**)  
**Does not introduce:** a new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../CANONICAL.md)
- [ADR Index](../adr/README.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md) — ADL-008 DEFERRED
- [Technical Debt](./technical-debt.md) — TD-036 residual ownership
- [RC-18 Release Planning](./rc-18-release-planning.md)
- [RC-17 Retrospective](./rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](./e17-stage-4-technical-review.md)
- [E17 Runtime Recovery Specification](./epics/e17-runtime-recovery-specification.md)
- [Story ID Allocation](./story-id-allocation.md)
- [Roadmap](./roadmap.md)
- [Project Status](./project-status.md)
- [Architecture Snapshot](./architecture-snapshot.md)
- [RC-17 Development Process](./rc-17-development-process.md) — Stage 1 lifecycle

---

## 1. Purpose

This document is the **Stage 1 planning authority** for the mandatory
TD-036 residual work that must complete before Epic E18 under the approved
RC-18 Release Strategy.

It explains:

- why the residuals exist;
- why they are planned before E18;
- work boundaries;
- dependencies;
- implementation sequence;
- Definition of Done;
- exit criteria for Stage 1 → Stage 2 Architecture Review.

**This is planning only.** It does not implement code, redesign architecture,
modify ADRs, change TD ownership, change RC-18 sequencing, introduce new
Epics, or introduce new bounded contexts.

---

## 2. Scope

### 2.1 In scope (RC-18 mandatory TD-036 residuals)

Authoritative item list:
[`technical-debt.md`](./technical-debt.md) (TD-036 residual ownership) and
[RC-18 Release Planning §3](./rc-18-release-planning.md).

| Residual                                                               | Class               |
| ---------------------------------------------------------------------- | ------------------- |
| Force/confirm Session `RECOVERING` on discovery                        | **RC-18 mandatory** |
| Real `RECOVERY_RECONCILIATION_PORTS` adapters (retire production stub) | **RC-18 mandatory** |
| Durable RecoveryState persistence + phase machine                      | **RC-18 mandatory** |
| Durable Incident on ambiguity / corruption                             | **RC-18 mandatory** |
| Chaos/restart + fail-safe evidence suites                              | **RC-18 mandatory** |
| ADL-008 promotion to ACCEPTED (or explicit accepted deferral)          | **RC-18 mandatory** |

These residuals complete the **production recovery claim** for the RC-17 E17
baseline (US240–US249 + US244A). They are **not** a new epic and do **not**
renumber E17–E21.

### 2.2 Explicitly out of scope (same TD-036 table; other classes)

| Item                                                                         | Class              | Deferred to              |
| ---------------------------------------------------------------------------- | ------------------ | ------------------------ |
| Durable Kill Switch policy for admission/arming                              | E19 operational    | E19 / RC-18+             |
| Operator recovery status / phase API                                         | E19 operational    | E19 / RC-18+             |
| Auth hardening / authorization leftovers (TD-005 / TD-006)                   | E19 operational    | E19 / RC-18+             |
| Order proposal from recovery SignalIntent                                    | Future backlog     | Future epic              |
| In-process stage cache durability (`lastResult` / Sets) beyond RecoveryState | Future backlog     | After RecoveryState      |
| Local vs original story-title dual scoping notes                             | Documentation only | Maintained in epic notes |
| E18 Event Processing epic delivery                                           | Future backlog     | E18                      |
| E20 Market Data / E21 Multi-Strategy epics                                   | Future backlog     | E20 / E21                |

Also out of scope (inherited RC-18 / RC-17 release out-of-scope):

- Real-capital / live broker adapters
- Redesign of Orders, Risk, Execution, Accounting, or Canonical Order Path
- New RecoveryCoordinator bounded context
- Changing bounded contexts or reversing ADR-017 dependency direction
- Exact-once event redesign; Kafka / microservices without measured need
- Playwright browser E2E (TD-043)

### 2.3 Planning boundary statement

Stage 1 defines **logical Story boundaries** and sequencing for the six
mandatory residuals. Exact User Story IDs are assigned from the free
**US240–US299** envelope ([story-id-allocation.md](./story-id-allocation.md));
RC-18 soft guidance prefers spill/validation **US290–US299** for this
completion work so E18–E21 soft sub-bands remain available. Final ID
assignment is confirmed at Stage 1 acceptance / Stage 2 entry — not as
implementation detail in this document’s Story bodies.

---

## 3. Architectural Context

**Architecture Freeze remains in effect.**

RC-17 baselined a Session-owned Stage 3 recovery reference under ADR-014:

```text
discover → lease → checkpoint → reconcile → READY
  → EVENT_ADMISSION_ENABLED → ARMED
  → evaluate-only → SignalIntent → Session exit / lease release
```

Confirmed shape (binding; do not renegotiate):

- Trading Session remains the recovery orchestrator (**no** RecoveryCoordinator BC)
- Strategy Runtime remains isolated behind `StrategyRuntimePort`
- SignalIntent is the only downstream recovery artifact into the canonical path
- Canonical Order Path ownership unchanged
- ADR-012…ADR-019 remain ACTIVE; changes require a new ADR (ADR-018 #60)

Why residuals exist:

| Cause                                                                                  | Evidence                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| RC-17 delivered architecture/reference completeness, not full production ADR-014 claim | [RC-17 Retrospective §1, §10](./rc-17-retrospective.md)                        |
| Stage 4 PASS WITH RECOMMENDATIONS classified production blockers under TD-036          | [E17 Stage 4 Technical Review](./e17-stage-4-technical-review.md) TR-N1…N4, N9 |
| Discovery selects candidates without forcing `RECOVERING`; completion assumes it       | US240 residual / TR-N1                                                         |
| Stub reconcile ports can false-green `RECONCILED` on empty foreign views               | US243 residual / TR-N2                                                         |
| Durable RecoveryState + Incident not implemented                                       | US249 residual / TR-N3                                                         |
| Chaos/restart + fail-safe evidence suites not in Stage 3 evidence package              | TR-N4                                                                          |
| ADL-008 correctly remains DEFERRED until residuals land or accepted deferral           | ADL.md ADL-008                                                                 |

Why planned **before** E18:

RC-18 Release Strategy ([§7](./rc-18-release-planning.md)):

1. **TD-036 residuals first** — later always-on work must not amplify unproven
   recovery state; ADL-008 cannot close otherwise.
2. **E18 next** — recovery proofs require durable consumer progress and Inbox
   coverage.
3. Thin parallel work only when Architecture Review proves no dependency on
   incomplete TD-036 / E18 exit criteria.

Mission alignment: make the RC-17 Runtime Recovery reference
**production-claimable** so operators may treat API restart as safe for
continuous paper sessions under documented evidence.

---

## 4. Residual Work Breakdown

### R1 — Force/confirm Session `RECOVERING` on discovery

| Field                | Content                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**        | On startup discovery, force or confirm eligible Sessions into `RECOVERING` so the completion/exit path has a consistent lifecycle precondition.                 |
| **Rationale**        | US240 discovers candidates without status force; US249 assumes `RECOVERING`. Gap blocks a coherent production recovery claim (TR-N1; Retrospective §5.4, §8.1). |
| **Dependencies**     | Existing US240 discovery selection; US249 completion contract; Session lifecycle ownership under ADR-014.                                                       |
| **Expected outcome** | Discovery → `RECOVERING` is explicit and testable; completion no longer depends on an undocumented precondition.                                                |

### R2 — Real `RECOVERY_RECONCILIATION_PORTS` adapters

| Field                | Content                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**        | Replace production use of stub reconcile ports with real adapters over existing module reconcile/rebuild surfaces.                                                   |
| **Rationale**        | `StubRecoveryReconciliationPorts` can yield false-green `RECONCILED` on empty foreign views (TR-N2; Retrospective §5.5, §8.2). Production trust requires real views. |
| **Dependencies**     | Existing US243 reconcile decide-gates and port contracts; M2 reconciliation/rebuild surfaces; no new BC.                                                             |
| **Expected outcome** | Production path uses real ports; stub is not the production binding; false-green empty-view path is eliminated or explicitly fail-closed.                            |

### R3 — Durable RecoveryState persistence + phase machine

| Field                | Content                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objective**        | Persist RecoveryState and advance a durable phase machine across restart for Session-owned recovery progress.                                                                        |
| **Rationale**        | In-process `lastResult` / Sets are not crash-durable (TR-N3, TR-N6). Original US249 ACs and ADL-008 expect durable recovery progress for the production claim.                       |
| **Dependencies**     | Session-owned orchestration shape; R1 lifecycle consistency preferred; ADR-013 durability patterns for persistence (no second lifecycle model via Job queue — TD-002 clarification). |
| **Expected outcome** | Recovery phase/progress survives process death; operators and later evidence suites can reason about durable phase, not only in-memory stage caches.                                 |

### R4 — Durable Incident on ambiguity / corruption

| Field                | Content                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**        | Persist an Incident when reconciliation encounters ambiguity or corruption, and block unsafe resume/execution on that path.                                                                                                 |
| **Rationale**        | ADR-014 / E17 spec require block-on-ambiguity with Incident; Stage 3 left this residual (TR-N3; TD-036 table). Owner note: E17 / Runtime Recovery (+ E19 Incident model alignment).                                         |
| **Dependencies**     | R2 real reconcile outcomes that can surface mismatch/ambiguity; R3 RecoveryState for correlating phase with Incident; E19 may later productize operator Incident UX — not required to invent a second Incident system here. |
| **Expected outcome** | Ambiguity/corruption creates durable Incident evidence and blocks unsafe progression; no silent reconcile success on corrupt state.                                                                                         |

### R5 — Chaos/restart + fail-safe evidence suites

| Field                | Content                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**        | Attach chaos/restart and fail-safe evidence proving the recovery path under crash, duplicate Intent/Order/Fill-class scenarios, and fail-safe behaviour as scoped by original US247/US248 evidence ACs and Stage 4 recommendations. |
| **Rationale**        | Stage 3 evidence package did not include restart/chaos suites (TR-N4). Release-level production restart-safety claim is forbidden until evidence exists (RC-18 risk table; Retrospective §8.4).                                     |
| **Dependencies**     | R1–R4 sufficiently landed that exercises are meaningful (not false-green); boundary tests remain green.                                                                                                                             |
| **Expected outcome** | Documented, repeatable evidence package supporting the production recovery claim; residual TR-N4 closed for mandatory class.                                                                                                        |

### R6 — ADL-008 ACCEPTED or explicit accepted deferral

| Field                | Content                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**        | Promote ADL-008 from DEFERRED placeholder to ACCEPTED, **or** record an explicit accepted deferral with rationale and owner.                               |
| **Rationale**        | ADL-008 is blocked on force-`RECOVERING`, real adapters, RecoveryState/Incident, and chaos evidence (ADL.md; TR-N9). RC-18 exit requires ADL synchronized. |
| **Dependencies**     | R1–R5 closed **or** Architecture/Release owner acceptance of an explicit deferral (not silent).                                                            |
| **Expected outcome** | ADL-008 no longer an unexamined placeholder; production algorithm ownership recorded chronologically without superseding ADR-014.                          |

---

## Planning assumptions

- Story IDs in this document are tentative.
- Stage 2 Architecture Review may refine decomposition.
- Stories may split or merge if Architecture Review requires.
- No implementation design is approved by this document.
- Architecture Freeze remains authoritative.
- Acceptance Criteria are finalized during Stage 2.

---

## 5. Proposed User Story decomposition

Logical Story boundaries only. No implementation design, API shapes, schema
DDL, or code structure. Tentative IDs from **US290–US299** (spill/validation)
are proposed so E18–E21 soft bands stay clear; Stage 1 acceptance may adjust
assignment inside US240–US299 without changing residual scope.

| Tentative ID | Logical Story                                   | Residual(s) | Boundary                                                                                                                |
| ------------ | ----------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| US290        | Force/confirm `RECOVERING` on discovery         | R1          | Lifecycle precondition only; does not re-open lease/checkpoint/reconcile algorithms beyond discovery→status consistency |
| US291        | Real recovery reconciliation port adapters      | R2          | Adapter binding + production stub retirement; does not redesign reconcile decide-gates or foreign module ownership      |
| US292        | Durable RecoveryState + phase machine           | R3          | Persistence and phase durability for Session-owned recovery progress; does not add operator status API (E19)            |
| US293        | Durable Incident on ambiguity / corruption      | R4          | Incident persistence + block-on-ambiguity path; does not deliver E19 incident productization/dashboard                  |
| US294        | Chaos/restart + fail-safe evidence              | R5          | Evidence suites and release-claim support; does not expand product epic scope                                           |
| US295        | ADL-008 closure (ACCEPTED or accepted deferral) | R6          | Architecture Decision Log + docs sync gate; not a runtime feature story                                                 |

**Decomposition rules**

- One primary residual responsibility per Story where practical.
- R3 and R4 remain separate Stories so persistence of progress and Incident
  semantics can be reviewed independently at Stage 2.
- R5 is evidence-only after functional residuals; it must not silently absorb
  unfinished R1–R4 scope.
- R6 is a governance/docs Story gated on R1–R5 (or explicit deferral).
- Corrective/split Stories, if needed later, prefer remaining US296–US299
  per story-id allocation policy.

**Not proposed as Stories in this Stage 1**

- Kill Switch durable policy (E19)
- Operator recovery status/phase API (E19)
- Order proposal from recovery SignalIntent (future backlog)
- Broader in-process cache durability beyond RecoveryState (future backlog)

---

## 6. Story sequencing

Recommended order (matches residual dependency and RC-18 strategy):

```text
US290  Force/confirm RECOVERING on discovery
   ↓
US291  Real RECOVERY_RECONCILIATION_PORTS adapters
   ↓
US292  Durable RecoveryState + phase machine
   ↓
US293  Durable Incident on ambiguity / corruption
   ↓
US294  Chaos/restart + fail-safe evidence
   ↓
US295  ADL-008 ACCEPTED or explicit accepted deferral
   ↓
Epic E18 Event Processing   ← RC-18 Release Strategy next
```

| Rule                                                                       | Rationale                                                         |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R1 before completion-dependent claims                                      | Removes discovery/completion precondition gap                     |
| R2 before trusting reconcile outcomes                                      | Eliminates false-green stub risk before Incident/evidence         |
| R3 before or with R4                                                       | Incident/phase correlation needs durable RecoveryState            |
| R4 before R5                                                               | Evidence must exercise fail-closed ambiguity, not only happy path |
| R5 before production claim / R6 ACCEPTED                                   | Chaos evidence is the release-level proof package                 |
| R6 last among residuals                                                    | ADL reflects completed algorithm or accepted deferral             |
| No E18 production implementation until residuals exit Stage 2+ as required | RC-18 §7; thin parallel only with Architecture Review proof       |

Thin parallel work (e.g. read-only dashboard shells on existing query APIs) remains
governed by RC-18 Release Planning — not by this residual plan expanding scope.

---

## 7. Risks

Repository-supported risks only (RC-18 §8, Stage 4, Retrospective, TD-036):

| Risk                                                                 | Severity | Mitigation                                                                 |
| -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Recovery false-green (stub reconcile → `RECONCILED`)                 | High     | US291 mandatory: real ports; no production stub                            |
| Resume / completion before force-`RECOVERING`                        | High     | US290 mandatory: force/confirm on discovery                                |
| Claiming production restart-safety before TD-036 close               | High     | US294 evidence + residual DoD before PASS language                         |
| Durable RecoveryState / Incident incomplete → ADL-008 false ACCEPTED | High     | US292–US293 before US295; ACCEPTED only with evidence or explicit deferral |
| Scope creep into Execution/Accounting redesign                       | High     | Architecture Freeze; Stage 2 gate; out-of-scope list                       |
| Absorbing E19 Kill Switch / operator API into residual Stories       | Medium   | Explicit out-of-scope; E19 remains owner                                   |
| Expanding Incident into full E19 ops product                         | Medium   | US293 limited to durable ambiguity/corruption path                         |
| Story-ID dual naming / band collision with E18 soft IDs              | Medium   | Prefer US290–US299; update story-id-allocation on assignment               |
| Documentation drift vs living status/roadmap/TD                      | Medium   | Stage sync on residual exit; one DoD checklist                             |

---

## 8. Definition of Done

Mandatory TD-036 residual Stage 1 planning (this document) is done when:

- [ ] Scope matches RC-18 §3 mandatory residuals and TD-036 residual ownership
      **RC-18 mandatory** rows only
- [ ] Out-of-scope preserves E19/future backlog classes and Architecture Freeze
- [ ] Logical Stories US290–US295 (or accepted reassignment in US240–US299)
      cover R1–R6 without implementation design
- [ ] Sequencing places residuals before E18 per RC-18 Release Strategy
- [ ] Risks and mitigations cite repository sources only
- [ ] Ready for **Stage 2 Architecture Review** (no unresolved planning blocker)

Mandatory residual **implementation** DoD (for later Stages 3–5; recorded here
as planning target, not Stage 1 completion):

- [ ] All six mandatory residuals closed with evidence
- [ ] Chaos/restart + fail-safe evidence attached
- [ ] Production Recovery claim justified under documented evidence
- [ ] ADL-008 ACCEPTED or explicit accepted deferral recorded
- [ ] TD-036 residual ownership updated for closed mandatory rows
- [ ] Architecture Health / Technical Review pass for residual Stories
- [ ] ADR-012…ADR-019 unchanged except via new ADR if ever required
- [ ] Docs sync: CHANGELOG, project status, roadmap, architecture snapshot,
      module maturity, technical debt, release history, story-id allocation
- [ ] Quality gates green: format, lint, typecheck, build, tests

---

## 9. Exit Criteria

### 9.1 Stage 1 exit (this planning document)

Stage 1 exits when engineering/architecture owners accept that:

- [ ] Planning boundary for mandatory TD-036 work is unambiguous
- [ ] Story decomposition is sufficient for Stage 2 Architecture Review
- [ ] No new Epic / BC / ADR redesign was introduced
- [ ] RC-18 sequencing (residuals → E18) is preserved
- [ ] Tentative Story IDs reserved in story-id allocation (or explicitly
      deferred to Stage 2 entry with owner)

**Next step after Stage 1 acceptance:** Stage 2 Architecture Review for the
mandatory TD-036 residual Story set — **before** production implementation.

### 9.2 Residual workstream exit (gates Epic E18)

The mandatory residual workstream may be treated complete (and E18 may proceed
as the next product epic under RC-18 strategy) only when:

- [ ] R1–R6 Definition of Done items for implementation are satisfied
- [ ] No open **RC-18 mandatory** TD-036 residual remains without owner-accepted
      deferral
- [ ] Production restart-safety language is allowed only with attached evidence
- [ ] Release-level residual checklist in RC-18 §9 remains the overarching
      release authority (this workstream is necessary but not sufficient for
      full RC-18 exit)

---

## 10. References

Ordered by authority. Planning consolidates existing decisions; it does not
invent architecture.

| Document                            | Path                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| CANONICAL                           | [`../CANONICAL.md`](../CANONICAL.md)                                                             |
| ADR Index                           | [`../adr/README.md`](../adr/README.md)                                                           |
| Architecture Decision Log (ADL-008) | [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)                                       |
| RC-18 Release Planning              | [`./rc-18-release-planning.md`](./rc-18-release-planning.md)                                     |
| RC-17 Retrospective                 | [`./rc-17-retrospective.md`](./rc-17-retrospective.md)                                           |
| Technical Debt (TD-036 residuals)   | [`./technical-debt.md`](./technical-debt.md)                                                     |
| E17 Stage 4 Technical Review        | [`./e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md)                         |
| E17 Runtime Recovery Specification  | [`./epics/e17-runtime-recovery-specification.md`](./epics/e17-runtime-recovery-specification.md) |
| Roadmap                             | [`./roadmap.md`](./roadmap.md)                                                                   |
| Project Status                      | [`./project-status.md`](./project-status.md)                                                     |
| Architecture Snapshot               | [`./architecture-snapshot.md`](./architecture-snapshot.md)                                       |
| Story ID Allocation                 | [`./story-id-allocation.md`](./story-id-allocation.md)                                           |
| Release History                     | [`./release-history.md`](./release-history.md)                                                   |
| RC-17 Development Process (Stage 1) | [`./rc-17-development-process.md`](./rc-17-development-process.md)                               |
| Epic Specification Template         | [`./templates/epic-specification-template.md`](./templates/epic-specification-template.md)       |

---

## Document lifecycle

```text
PLANNING                    ← current (Stage 1)
        ↓
Stage 2 Architecture Review
        ↓
ACCEPTED (planning authority for residual Stories)
        ↓
Stages 3–5 per residual Story
        ↓
Residual workstream exit → Epic E18
```

---

## Sign-off

| Role                        | Name / Status | Date       |
| --------------------------- | ------------- | ---------- |
| Stage 1 planning (docs)     | Auto          | 2026-07-30 |
| Engineering owner           | _(assign)_    |            |
| Architecture owner          | _(assign)_    |            |
| Stage 2 Architecture Review | _(pending)_   |            |

**Next step:** Stage 2 Architecture Review for mandatory TD-036 residual
Stories (US290–US295 tentative), before any residual production
implementation and before Epic E18 Stage 1 product planning begins as the
next sequenced epic.
