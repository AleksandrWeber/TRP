# US290 — Force/Confirm `RECOVERING` on Discovery

**Story ID:** US290  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R1)  
**Date:** 2026-07-30  
**Status:** Implemented  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — Force/confirm Session `RECOVERING` on discovery  
**Closes:** E17 Stage 4 TR-N1  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Mid-release:** [RC-18 Mid-Release Health Review](../rc-18-mid-release-health-review.md) · [RIV-001](../rc-18-riv-001-recovery-integration-validation.md)  
**Does not introduce:** implementation design, API design, database schema, class/interface design, new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md) — ADL-008 DEFERRED
- [RC-18 Release Planning](../rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](../rc-18-td036-epic-planning.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md)
- [Technical Debt](../technical-debt.md) — TD-036 residual ownership
- [RC-17 Retrospective](../rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](../e17-stage-4-technical-review.md)
- [US240 Startup Recovery Discovery](../epics/e17-us240-startup-recovery-discovery.md)
- [US249 Recovery Completion](../epics/e17-us249-recovery-completion.md)
- [Story ID Allocation](../story-id-allocation.md)

---

## 1. Story Summary

### Objective

On startup discovery of a recovery-eligible Trading Session, force or confirm
Session status into `RECOVERING` as an explicit, Session-owned lifecycle
precondition so the existing recovery pipeline (lease → checkpoint → reconcile →
READY → admission → arm → evaluate-only → SignalIntent → completion/exit) no
longer depends on an undocumented or test-injected status.

### Business value

Operators and release owners cannot claim production restart-safety while
discovery selects candidates that are not actually in `RECOVERING`, and
completion assumes they are. Closing this gap is the first mandatory step
toward a coherent ADR-014 production recovery claim under RC-18.

### Architectural purpose

Complete the discovery → `RECOVERING` binding required by ADR-014 restart
recovery step 1 and E17 Spec transition T7 / sequence S1, without inventing a
parallel recovery lifecycle, RecoveryCoordinator bounded context, or ownership
transfer away from Trading Session.

US290 is **lifecycle precondition only**. It does not reopen lease, checkpoint,
reconcile, Runtime arming, or completion algorithms beyond discovery → status
consistency.

---

## 2. Problem Statement

### Current behaviour

RC-17 baselined a Session-owned Stage 3 recovery reference pipeline
(US240–US249 + US244A):

```text
discover → lease → checkpoint → reconcile → READY
  → EVENT_ADMISSION_ENABLED → ARMED
  → evaluate-only → SignalIntent → Session exit / lease release
```

US240 delivers deterministic startup discovery: eligible non-terminal Sessions
are selected (`recovery_candidate` or `no_recovery_required`). That slice
intentionally **does not** transition Session status to `RECOVERING`.

US249 completion/exit requires Session status `RECOVERING` before committing
`RECOVERING → RUNNING|PAUSED` (and related completion gates). Stage 3 tests and
local scoping can force `RECOVERING` at the completion boundary when needed.

### Architecture gap

ADR-014 Restart recovery requires, for each discovered Session:

1. mark/confirm `RECOVERING`;
2. then acquire lease, load, reconcile, and only then resume.

E17 Spec makes the same rule normative (T7, S1, O2): every non-terminal Session
enters `RECOVERING` on process startup before any new evaluation. Discovery
without status force leaves the authoritative Session lifecycle out of sync
with the recovery pipeline that US249 exits.

Dual-status authority remains:

| Layer           | Field    | Authority                                        |
| --------------- | -------- | ------------------------------------------------ |
| Trading Session | `status` | Authoritative lifecycle (ADR-014)                |
| RecoveryState   | `phase`  | Progress **within** Session `RECOVERING` (US292) |

US290 closes the Session-status half of the discovery open; durable phase
machine persistence remains US292, with `resumeIntent` / `preRecoveryStatus`
alignment required between the two Stories (Stage 2 §3.7).

### Why TR-N1 exists

E17 Stage 4 Technical Review recorded:

> **TR-N1** — US240 discovery does not force Session → `RECOVERING`; US249
> assumes `RECOVERING`. Must resolve before production recovery claim / RC-18
> (TD-036).

RC-17 Retrospective §5.4 / §8.1 and TD-036 residual ownership classify the same
item as **RC-18 mandatory**.

### Why the production claim is incomplete

The Stage 3 baseline is an architecture/reference pipeline
(PASS WITH RECOMMENDATIONS), not full production ADR-014 algorithm closure.
Without an explicit discovery → `RECOVERING` precondition:

- completion/exit can succeed only when status was pre-forced outside the
  production discovery path;
- resume/completion before consistent `RECOVERING` remains a high release risk
  (RC-18 risk table; Stage 2 AR-02);
- ADL-008 correctly remains DEFERRED until this residual (among others) lands
  or is explicitly deferred with owner acceptance.

US290 alone does not finish the production claim (US291–US295 remain), but it
is the first sequenced mandatory residual that removes the lifecycle
precondition gap.

---

## 3. Scope

### In scope

- Force or confirm Session status `RECOVERING` for the recovery-eligible Session
  selected by existing US240 discovery, as part of startup recovery open.
- Preserve eligibility rules already established by US240 / E17 Spec:
  - Eligible: `STARTING`, `RUNNING`, `PAUSED`, `RECOVERING`, `STOPPING`
  - Not eligible: terminal `STOPPED` / `FAILED`; `CREATED` (not started);
    unknown non-ADR statuses
- Apply E17 §4.6 P0-2 for `STOPPING`:
  - `STOPPING` Sessions are discovered and enter recovery
  - transition `STOPPING` → `RECOVERING` is allowed
  - `resumeIntent` for that path is always `STOPPED` (never `RUNNING` or
    `PAUSED`)
- Establish, at discovery/`RECOVERING` open, the lifecycle facts required for
  later exit correctness:
  - prior safe status (`preRecoveryStatus` concept)
  - intended post-recovery Session status (`resumeIntent` concept:
    `RUNNING` \| `PAUSED` \| `STOPPED` per ADR-014 / E17 P0-2)
- Idempotent confirm when Session is already `RECOVERING`.
- Auditable lifecycle transition evidence for force/confirm into `RECOVERING`
  (consistent with Session Outbox / durable Session lifecycle event practice
  already used by the E17 baseline — without redesigning event semantics).
- Ensure no new strategy evaluation / SignalIntent emission is admitted for a
  Session while it is entering or remaining in `RECOVERING` as a result of this
  Story’s precondition (ADR-018 #23–24; E17 O2).
- Keep ownership inside Trading Session orchestration.

### Out of scope

- Redesign of US240 candidate selection / determinism algorithm
- Lease acquisition, heartbeat, or fencing redesign (US241 remains authority)
- Checkpoint validation redesign (US242)
- Real reconcile port adapters or stub retirement (US291)
- Durable RecoveryState phase machine persistence and full P0-1 store (US292)
- Durable Incident on ambiguity/corruption (US293)
- Chaos/restart + fail-safe evidence suites (US294)
- ADL-008 ACCEPTED / accepted deferral (US295)
- Kill Switch durable admission/arming policy (E19)
- Operator recovery status / phase API (E19)
- Order proposal from recovery SignalIntent (future backlog)
- Broader in-process stage-cache durability beyond RecoveryState (future backlog)
- Canonical Order Path, Orders, Risk, Execution, Accounting redesign
- New RecoveryCoordinator / Recovery bounded context
- Research session recovery; live-trading-engine parallel recovery path
- Real-capital / live broker adapters

### Dependencies

| Dependency                               | Relationship                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| US240 discovery selection                | **Required predecessor** — US290 applies force/confirm to the selected eligible candidate (or confirms `no_recovery_required` needs no status force) |
| ADR-014 Session state machine            | **Binding** — `RECOVERING` transitions and resume intents                                                                                            |
| E17 Spec §4.1 T7/T15, §4.4 S1, §4.6 P0-2 | **Binding** — discovery → `RECOVERING` and `STOPPING` policy                                                                                         |
| US249 completion contract                | **Downstream consumer** — completion already assumes `RECOVERING`; US290 makes that precondition production-real                                     |
| US292 Durable RecoveryState              | **Aligned successor** — persists phase/`resumeIntent`/`preRecoveryStatus` durably; US290 must not invent a competing lifecycle authority             |
| Architecture Freeze (ADR-012…ADR-019)    | **Constraint** — no ADR renegotiation                                                                                                                |
| Stage 2 PROCEED constraints              | **Constraint** — residual sequencing and ownership                                                                                                   |

### Non-goals

| Non-goal                                                                                               | Rationale                                            |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Re-implement the full restart algorithm in this Story                                                  | Residuals are sequenced; US290 is precondition only  |
| Create a second Session lifecycle via Job/scheduler payloads                                           | TD-002; E17 Spec ownership table                     |
| Auto-create a replacement Session on restart                                                           | ADR-014                                              |
| Resume or arm Runtime as part of discovery status force                                                | Arming remains US246+; exit remains US249            |
| Infer `resumeIntent` solely from live Session status after `RECOVERING` without recording prior intent | E17 P0-1 / P0-2 — intent must be established at open |
| Claim full production restart-safety from US290 alone                                                  | Requires US291–US294 (+ US295 governance) per RC-18  |

---

## 4. Architecture Constraints

Summarized from Stage 2 PROCEED constraints and frozen ADRs. Binding for
implementation planning and Stage 3 coding.

1. **Session owns lifecycle** — Trading Session is the recovery orchestrator and
   the sole owner of Session status transitions into `RECOVERING` (ADR-014;
   E17 Spec §5).
2. **No new bounded context** — no Recovery / RecoveryCoordinator BC; work stays
   inside existing Trading Session orchestration.
3. **No RecoveryCoordinator** — boundary tests and E17 invariants remain in
   force; residual work must not introduce a parallel coordinator type as a new
   owner.
4. **ADR-014 preserved** — residuals implement the production claim for the
   existing state model; they do not redefine frozen Session states or restart
   algorithm ownership.
5. **Dependency direction unchanged** — ADR-017 module dependency direction is
   not inverted; Session orchestrates via existing ports and does not absorb
   foreign aggregate persistence internals.
6. **Architecture Freeze remains active** — ADR-012…ADR-019 ACTIVE; changes
   require a new ADR (ADR-018 #60). ADL cannot override ADR. ADL-008 stays
   DEFERRED until later residual/governance Stories.
7. **Confirmed recovery shape preserved** — residuals fill gaps on
   `discover → lease → checkpoint → reconcile → READY → admission → arm →
evaluate-only → SignalIntent → exit`; they do not invent a parallel
   lifecycle.
8. **Canonical Order Path unchanged** — SignalIntent remains the only recovery
   downstream artifact into that path; no recovery-only order types or path
   fork.
9. **Dual status rule preserved** — Session `status` is authoritative lifecycle;
   RecoveryState `phase` (US292) is authoritative progress within
   `RECOVERING`; in-memory worker/stage caches remain non-authoritative
   (ADR-018 #22).
10. **Module change envelope** — Stage 2 §8.3 allows Trading Session changes for
    force/confirm `RECOVERING` and discovery/completion consistency; forbids
    Session ownership of Order/Fill/Ledger mutations and forbids
    `live-trading-engine/` as a paper recovery path.
11. **Hard stop** — if later implementation planning would touch more than three
    modules or exceed residual scope, re-enter Architecture Review before
    coding (Stage 2 §7).

---

## 5. Functional Requirements

Describe expected behaviour only. No implementation prescription.

### FR-1 — Discovery open forces or confirms `RECOVERING`

When process startup discovery yields a `recovery_candidate`, the Trading
Session lifecycle for that Session must be forced or confirmed into
`RECOVERING` before subsequent recovery stages treat the Session as recoverable
under ADR-014.

When discovery yields `no_recovery_required`, no Session is forced into
`RECOVERING` by this Story.

### FR-2 — Eligible statuses only

Only recovery-eligible non-terminal statuses participate. Terminal
`STOPPED` / `FAILED` Sessions are never transitioned into `RECOVERING` by
discovery. `CREATED` Sessions remain outside recovery eligibility as already
defined by US240.

### FR-3 — `STOPPING` policy

A discovered `STOPPING` Session enters `RECOVERING` with `resumeIntent =
STOPPED`. Success of later recovery stages for that Session must not resurrect
trading (`RUNNING` / `PAUSED`) when intent is `STOPPED` (E17 P0-2). US290 is
responsible for establishing that intent at open; later Stories honor it.

### FR-4 — Prior safe intent for non-`STOPPING` paths

For eligible Sessions discovered from `STARTING`, `RUNNING`, or `PAUSED`, the
recovery open must establish a prior-safe `resumeIntent` consistent with
ADR-014 (`RUNNING` or `PAUSED` as applicable to the pre-recovery lifecycle).
For Sessions already `RECOVERING`, confirm is idempotent and must not invent a
contradictory resume intent that would silently change operator-visible
lifecycle meaning without recorded prior status.

### FR-5 — Idempotent confirm

If the selected Session is already `RECOVERING`, discovery open confirms that
status without requiring a second conflicting transition, and without admitting
new evaluation solely because discovery re-ran.

### FR-6 — No evaluation while entering recovery

While a Session is being forced/confirmed into `RECOVERING`, and while it
remains `RECOVERING` under this precondition, the Session must not admit new
strategy evaluation or emit new SignalIntent for that Session (ADR-018 #23–24;
E17 O2). Existing later-stage gates remain responsible for ordered resume; US290
must not create a path that evaluates before status consistency.

### FR-7 — Auditable transition

Force/confirm into `RECOVERING` must leave durable, auditable evidence that the
lifecycle transition (or confirm) occurred, consistent with Session-owned
recovery transition practice in the E17 baseline. Logs alone are not a
substitute for Session lifecycle authority.

### FR-8 — No ownership transfer

Force/confirm remains a Trading Session responsibility. Foreign modules do not
become owners of Session status. Job/scheduler systems do not become a second
lifecycle authority for this transition.

### FR-9 — Pipeline compatibility

After US290, US241–US249 stage contracts that assume Session `RECOVERING` for a
selected recovery candidate must be satisfiable without test-only status
injection for the happy path of a freshly discovered eligible Session.

### FR-10 — Alignment with RecoveryState (without absorbing US292)

US290 must establish the lifecycle facts (`preRecoveryStatus`, `resumeIntent`)
needed so US292 can persist RecoveryState progress without inventing a second
source of truth for Session status. US290 does not deliver the full durable
phase machine store.

---

## 6. Acceptance Criteria

Every AC is testable. Architecture citations are normative.

### AC-1 — Force `RECOVERING` for discovered candidate

**Given** startup discovery selects a recovery-eligible Session whose status is
`STARTING`, `RUNNING`, `PAUSED`, or `STOPPING`  
**When** discovery/`RECOVERING` open completes for that candidate  
**Then** Session status is `RECOVERING`  
**Authority:** ADR-014 Restart recovery step 1; E17 Spec T7 / S1; Stage 2 US290

### AC-2 — Confirm already-`RECOVERING` Session

**Given** discovery selects a Session already in `RECOVERING`  
**When** discovery/`RECOVERING` open runs  
**Then** Session remains `RECOVERING` (idempotent confirm); no illegal
transition is recorded; no new evaluation is admitted solely due to re-discovery  
**Authority:** E17 Spec US240 AC #5; ADR-014 invalid transitions rejected

### AC-3 — Terminal Sessions untouched

**Given** only terminal Sessions (`STOPPED` / `FAILED`) exist, or discovery
outcome is `no_recovery_required`  
**When** startup discovery completes  
**Then** no Session is transitioned into `RECOVERING` by US290  
**Authority:** ADR-014 terminal rules; US240 eligibility; E17 Spec S1 forbidden
path

### AC-4 — `STOPPING` → `RECOVERING` with `resumeIntent = STOPPED`

**Given** a `STOPPING` Session is the recovery candidate  
**When** discovery/`RECOVERING` open completes  
**Then** Session status is `RECOVERING` and recorded `resumeIntent` is `STOPPED`
(not `RUNNING` or `PAUSED`)  
**Authority:** E17 Spec §4.6 P0-2; T15

### AC-5 — Non-`STOPPING` resume intent established

**Given** a candidate discovered from `RUNNING` or `PAUSED` (or other eligible
non-`STOPPING` path per ADR-014 / E17)  
**When** discovery/`RECOVERING` open completes  
**Then** `preRecoveryStatus` reflects the pre-transition status and
`resumeIntent` is a legal ADR-014 post-recovery target (`RUNNING` or `PAUSED`
as applicable), recorded explicitly rather than left undocumented  
**Authority:** ADR-014 resume to prior safe intent; E17 Spec S1 / P0-1 intent
rule; Stage 2 §3.7 US290↔US292 alignment

### AC-6 — No SignalIntent / evaluation during force/confirm

**Given** a Session is undergoing force/confirm into `RECOVERING`  
**When** that open completes and while Session status remains `RECOVERING` due
to this precondition  
**Then** no new SignalIntent is emitted and no new strategy evaluation is
admitted for that Session as a consequence of discovery open  
**Authority:** ADR-018 #23–24; E17 Spec O2 / R9; E17 US240 AC #4

### AC-7 — Completion precondition becomes production-real

**Given** a Session became `RECOVERING` via US290 discovery open (not via
test-only status injection) and later Stage 3 pipeline stages reach a terminal
completion-eligible outcome under existing US249 rules  
**When** completion is evaluated  
**Then** the Session satisfies the `RECOVERING` lifecycle precondition required
by US249 without relying on undocumented discovery-side status force  
**Authority:** TR-N1; US249 completion contract; RC-17 Retrospective §5.4

### AC-8 — No new bounded context / coordinator owner

**Given** US290 behaviour is present in the system  
**When** architecture/boundary verification is performed  
**Then** recovery force/confirm ownership remains Trading Session; no
RecoveryCoordinator BC or Job-queue-owned Session lifecycle is introduced  
**Authority:** E17 Spec §5 / §8; Stage 2 §3.1–§3.2; TD-002 clarification

### AC-9 — Canonical path and dependency direction unchanged

**Given** US290 is delivered  
**When** architecture review checks Canonical Order Path and ADR-017 direction  
**Then** Canonical Order Path ownership is unchanged; SignalIntent remains the
only recovery downstream artifact into that path; no foreign-module ownership
transfer of Session lifecycle occurred  
**Authority:** Stage 2 §3.5–§3.6, §8.2; ADR-012; ADR-017

### AC-10 — Architecture Freeze intact

**Given** US290 Story specification and subsequent implementation planning  
**When** ADR Index / Freeze ADRs are inspected  
**Then** ADR-012…ADR-019 remain ACTIVE without modification by this Story; no
new ADR was required to redefine recovery ownership  
**Authority:** CANONICAL conflict rule for stack/stages; Stage 2 §3.9 / §8.2;
ADR-018 #60

---

## 7. Architecture Invariants

The following must remain true after US290 implementation:

1. **Session remains recovery owner** — Trading Session owns lifecycle transitions
   into and out of `RECOVERING`.
2. **Canonical Order Path unchanged** — no recovery-only execution fork; no
   recovery-only order types.
3. **SignalIntent unchanged as sole recovery downstream artifact** into the
   canonical path (generation still belongs to later pipeline stages, not to
   discovery force/confirm).
4. **No ownership transfer** — Orders, Risk, Execution, Accounting, Market Data,
   and Dashboard do not become Session lifecycle owners.
5. **No parallel lifecycle** — Job/scheduler queue must not encode a second
   Session state machine for recovery open.
6. **No RecoveryCoordinator BC** — orchestration remains inside Trading Session.
7. **Dual status rule** — Session `status` remains authoritative lifecycle;
   RecoveryState `phase` (US292) remains progress-within-`RECOVERING`;
   in-memory caches remain non-authoritative.
8. **ADR-014 state model preserved** — frozen states and terminal rules remain;
   `STOPPING` → `RECOVERING` and `RECOVERING` → `STOPPED` (only when
   `resumeIntent = STOPPED`) remain the allowed extensions already decided in
   E17 P0-2.
9. **No evaluation while `RECOVERING`** — ADR-018 #23–24 continue to hold.
10. **Dependency direction preserved** — ADR-017 unchanged.
11. **Architecture Freeze preserved** — residuals implement claim; they do not
    renegotiate Freeze ADRs.
12. **Sequencing preserved** — US290 precedes US291–US295 and remains before E18
    as the next sequenced product epic under RC-18 strategy.

---

## 8. Risks

Architecture risks only (repository-supported).

| ID   | Risk                                                                                   | Severity | Mitigation                                                                                        |
| ---- | -------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| R-01 | Completion/resume proceeds without consistent discovery → `RECOVERING` (TR-N1 / AR-02) | High     | This Story is mandatory first residual; AC-1/AC-7 bind production open to US249 precondition      |
| R-02 | Premature arming/resume before status consistency                                      | High     | FR-6 / AC-6; later stages retain ordered gates; US290 does not arm Runtime                        |
| R-03 | Inventing a second discovery or recovery owner                                         | High     | Stage 2 ownership table; AC-8; no RecoveryCoordinator BC                                          |
| R-04 | Expanding US290 into lease/checkpoint/reconcile redesign                               | High     | Stage 1/2 boundary: lifecycle precondition only; hard-stop re-review rule                         |
| R-05 | Conflicting `resumeIntent` vs later US292 RecoveryState authority                      | Medium   | Stage 2 §3.7 alignment; FR-10; US292 owns durable phase store                                     |
| R-06 | `STOPPING` path resurrects trading via wrong resume intent                             | High     | P0-2; AC-4; illegal `STOPPED` intent → `RUNNING`/`PAUSED` remains forbidden                       |
| R-07 | Claiming full production restart-safety after US290 alone                              | High     | RC-18 exit requires US291–US294 evidence + US295 governance; Story non-goals                      |
| R-08 | Documentation / Story-ID drift vs TD-036 residual table                                | Medium   | US290 assigned in US240–US299 spill band; keep TD / allocation / Stage 2 refs synchronized at DoD |

No risk in this table requires a new ADR.

---

## 9. Verification

What must be verified during review. No test implementation here.

1. **Behavioural** — force/confirm/`STOPPING`/`idempotent` paths satisfy AC-1…AC-6
   with observable Session status and recorded resume intent facts.
2. **Pipeline consistency** — a discovered eligible candidate reaches
   `RECOVERING` via production discovery open such that US249’s lifecycle
   precondition is no longer an undocumented assumption (AC-7 / TR-N1 closure).
3. **Ownership** — Trading Session remains sole lifecycle owner; boundary /
   architecture checks still forbid RecoveryCoordinator BC and foreign
   ownership of Session status (AC-8).
4. **Freeze** — ADR-012…ADR-019 unchanged; no silent redesign of Canonical Order
   Path or ADR-017 direction (AC-9, AC-10).
5. **Scope discipline** — review confirms lease/checkpoint/reconcile/RecoveryState
   phase store/Incident/chaos/ADL-008 were not absorbed into US290.
6. **Sequencing** — US290 remains first mandatory residual before US291+ and
   before E18 as sequenced product epic.
7. **Docs authority** — this Story Specification is cited as implementation
   authority in Stage 3 planning; Stage 2 constraints remain referenced.

---

## 10. Definition of Done

Story-level DoD only (not residual workstream exit).

- [x] This Story Specification accepted as implementation authority for US290
- [x] Stage 3 implementation planning cites this document + Stage 2 PROCEED
      constraints + ADR-014 / E17 Spec S1 / P0-2
- [x] AC-1…AC-10 satisfied with reviewable evidence
- [x] TR-N1 closed for the discovery → `RECOVERING` precondition gap (US249
      no longer depends on undocumented status force for the production open path)
- [x] TD-036 residual row “Force/confirm Session `RECOVERING` on discovery”
      updated when implementation evidence lands
- [x] Architecture Freeze intact (ADR-012…ADR-019 unchanged by this Story)
- [x] No new bounded context / RecoveryCoordinator introduced
- [x] Canonical Order Path and SignalIntent recovery boundary unchanged
- [x] Scope not expanded into US291–US295 / E19 / future backlog items
- [x] Docs sync for this Story: CHANGELOG / project status / roadmap /
      architecture snapshot / module maturity / technical debt / story-id
      allocation as required by residual DoD practice
- [x] Quality gates green for the change set that implements this Story
      (format, lint, typecheck, build, tests) — verified at implementation time

**Not required for US290 DoD alone:** full production restart-safety PASS
language; US291 real adapters; US292–US293 durability; US294 chaos evidence;
US295 ADL-008 closure.

---

## 11. References

Ordered by authority. This specification consolidates existing decisions; it
does not invent architecture.

| #   | Document                             | Path                                                                                                   |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1   | CANONICAL                            | [`../../CANONICAL.md`](../../CANONICAL.md)                                                             |
| 2   | ADR Index                            | [`../../adr/README.md`](../../adr/README.md)                                                           |
| 3   | ADR-014 Runtime Lifecycle            | [`../../adr/ADR-014-runtime-lifecycle.md`](../../adr/ADR-014-runtime-lifecycle.md)                     |
| 4   | Architecture Decision Log (ADL-008)  | [`../../Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                                       |
| 5   | RC-18 Release Planning               | [`../rc-18-release-planning.md`](../rc-18-release-planning.md)                                         |
| 6   | RC-18 TD036 Epic Planning (Stage 1)  | [`../rc-18-td036-epic-planning.md`](../rc-18-td036-epic-planning.md)                                   |
| 7   | RC-18 Stage 2 Architecture Review    | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)         |
| 8   | E17 Runtime Recovery Specification   | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)     |
| 9   | Technical Debt (TD-036 residuals)    | [`../technical-debt.md`](../technical-debt.md)                                                         |
| 10  | RC-17 Retrospective                  | [`../rc-17-retrospective.md`](../rc-17-retrospective.md)                                               |
| 11  | E17 Stage 4 Technical Review (TR-N1) | [`../e17-stage-4-technical-review.md`](../e17-stage-4-technical-review.md)                             |
| 12  | US240 Startup Recovery Discovery     | [`../epics/e17-us240-startup-recovery-discovery.md`](../epics/e17-us240-startup-recovery-discovery.md) |
| 13  | US249 Recovery Completion            | [`../epics/e17-us249-recovery-completion.md`](../epics/e17-us249-recovery-completion.md)               |
| 14  | ADR-018 Architectural Invariants     | [`../../adr/ADR-018-architectural-invariants.md`](../../adr/ADR-018-architectural-invariants.md)       |
| 15  | Story ID Allocation                  | [`../story-id-allocation.md`](../story-id-allocation.md)                                               |

---

## Document lifecycle

```text
Implemented
        ↓
Stage 3 implementation COMPLETE
        ↓
RIV-001 / SIG-001 / Mid-Release Health Review
        ↓
DoD COMPLETE → next residual US291 (Done)
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
US290. Stage 3 planning and coding must realize the WHAT defined here under
Architecture Freeze and Stage 2 PROCEED constraints. It does not prescribe HOW
(APIs, schema, classes, or module-internal design).

**Next step:** Stage 3 implementation planning for US290, then coding under
Freeze — before US291 and before Epic E18 as the next sequenced product epic.
