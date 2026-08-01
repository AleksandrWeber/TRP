# US292 — Durable RecoveryState + Phase Machine

**Story ID:** US292  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R3)  
**Date:** 2026-08-01  
**Status:** Implemented  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — Durable RecoveryState persistence + phase machine  
**Closes:** E17 Stage 4 TR-N3 (RecoveryState / phase durability portion); contributes to TR-N6  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Predecessor Stories:** [US290](./us290-force-confirm-recovering-on-discovery.md), [US291](./us291-real-recovery-reconciliation-port-adapters.md)  
**Mid-release:** [RC-18 Mid-Release Health Review](../rc-18-mid-release-health-review.md) · [RIV-001](../rc-18-riv-001-recovery-integration-validation.md)  
**Does not introduce:** implementation design, API design, database schema DDL, class/interface design, new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-013 Event Processing Model](../../adr/ADR-013-event-processing-model.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [ADR-018 Architectural Invariants](../../adr/ADR-018-architectural-invariants.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md) — ADL-008 DEFERRED
- [RC-18 Release Planning](../rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](../rc-18-td036-epic-planning.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md) — §4.5, §4.6 P0-1 / P0-2
- [US290 Story Specification](./us290-force-confirm-recovering-on-discovery.md)
- [US291 Story Specification](./us291-real-recovery-reconciliation-port-adapters.md)
- [US249 Recovery Completion](../epics/e17-us249-recovery-completion.md)
- [Technical Debt](../technical-debt.md) — TD-036 residual ownership
- [RC-17 Retrospective](../rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](../e17-stage-4-technical-review.md)
- [Story ID Allocation](../story-id-allocation.md)

---

## 1. Objective

Persist Session-owned **RecoveryState** and advance a **durable RecoveryPhase
machine** across process restart so recovery progress authority is not an
in-memory stage cache.

### Business value

Operators and release owners cannot claim production restart-safety while
recovery progress lives only in process-local `lastResult` / Sets. Durable
phase evidence is required for crash re-entry diagnostics, Incident
correlation (US293), chaos/restart proof (US294), and credible ADL-008 closure
(US295).

### Architectural purpose

Close the **R3 / TR-N3 RecoveryState durability** gap under Architecture
Freeze: implement E17 Spec §4.5 phase machine + §4.6 **P0-1** persistence
rules inside Trading Session orchestration, without inventing a parallel
lifecycle, RecoveryCoordinator BC, Job-queue Session state machine, or
operator recovery status API (E19).

US292 is **persistence + phase durability only**. It does not redesign the
recovery pipeline (`discover → lease → checkpoint → reconcile → READY →
admission → arm → evaluate-only → SignalIntent → exit`), does not deliver
durable Incident productization (US293), and does not claim release-level
restart-safety without US294 evidence.

---

## 2. Background

### RC-17 baseline and residual

RC-17 baselined a Session-owned Stage 3 recovery reference pipeline
(US240–US249 + US244A):

```text
discover → lease → checkpoint → reconcile → READY
  → EVENT_ADMISSION_ENABLED → ARMED
  → evaluate-only → SignalIntent → Session exit / lease release
```

That baseline is architecture/reference completeness, not full production
ADR-014 claim ([RC-17 Retrospective](../rc-17-retrospective.md);
[E17 Stage 4](../e17-stage-4-technical-review.md) PASS WITH RECOMMENDATIONS).

Original E17 US249 Acceptance Criteria included durable RecoveryState
persistence, Incident on ambiguity, and operator status. Stage 3 local
scoping delivered the **completion / Session-exit** slice under US249
([US249 note](../epics/e17-us249-recovery-completion.md)); RecoveryState
persistence, Incident, and operator status remained residual (TR-N3).

US249 remains valid and authoritative for the completion / Session-exit work
already delivered. RC-18 does **not** replace or invalidate US249. It
reassigns **implementation responsibility** for the still-open durable
RecoveryState + phase machine residual to **US292** (Stage 1 R3; Stage 2
PROCEED), while preserving the architectural intent defined in E17 (§4.5 /
P0-1). Operator recovery status/phase API remains **E19**. Durable Incident
remains **US293**.

### Why TR-N3 / TR-N6 exist

E17 Stage 4 recorded:

> **TR-N3** — Durable RecoveryState + Incident + operator status not
> implemented.
>
> **TR-N6** — In-process `lastResult` / Sets are not crash-durable.

RC-17 Retrospective §8 / TD-036 residual ownership classify durable
RecoveryState persistence + phase machine as **RC-18 mandatory**.

### Authoritative dual-status model (already decided)

| Layer           | Field     | Authority                                                              |
| --------------- | --------- | ---------------------------------------------------------------------- |
| Trading Session | `status`  | Authoritative **lifecycle** (ADR-014)                                  |
| RecoveryState   | `phase`   | Authoritative **progress within** Session `RECOVERING` (E17 §4.5/P0-1) |
| Runtime worker  | in-memory | Non-authoritative (ADR-018 #22)                                        |

US290 closes Session-status force/confirm and establishes
`preRecoveryStatus` / `resumeIntent` at discovery open. US291 makes reconcile
outcomes trustworthy. US292 makes **phase/progress durable** and binds those
lifecycle facts into RecoveryState so they survive restart without becoming a
second Session lifecycle.

### Normative sources (do not redefine)

- E17 Spec §4.2 algorithm steps 1 and 8 (open / finalize RecoveryState)
- E17 Spec §4.4 sequence (phase column; crash re-entry; `lastAttemptedPhase`
  diagnostic-only)
- E17 Spec **§4.5** Recovery State Machine (phases, legal/illegal transitions,
  dual-status rule)
- E17 Spec **§4.6 P0-1** RecoveryState persistence; **P0-2** STOPPING /
  `resumeIntent = STOPPED` (intent honored on RecoveryState)
- ADR-013 durability substrate (Outbox/transactional write patterns; no
  Job-queue lifecycle)
- ADR-014 Session lifecycle + restart recovery ownership
- ADR-018 #22–24 (non-authoritative memory; reconcile-before-resume; no new
  execution while `RECOVERING`)
- Stage 2 §3.7 / §4 US292 / §8.2 constraints

---

## 3. Scope IN

- Implement durable **RecoveryState** persistence for Session-owned recovery
  progress per E17 §4.6 **P0-1** (logical store requirements), via the
  existing `RecoveryStateRepository` contract ownership under Trading Session.
- Advance and enforce the **RecoveryPhase** machine defined in E17 **§4.5**:
  `RECOVERING` → `VALIDATING` → `RECONCILING` → `READY`, with `FAILED` as the
  failure terminal for a recovery attempt, and successful completion
  finalization from `READY`.
- Persist, on RecoveryState open (aligned with US290 discovery /
  `RECOVERING` open), at minimum the lifecycle facts required by P0-1 /
  Stage 2 §3.7:
  - `preRecoveryStatus`
  - `resumeIntent` (`RUNNING` \| `PAUSED` \| `STOPPED`)
  - `phase = RECOVERING` at open
- Persist phase advances only through **legal** §4.5 transitions; reject and
  audit **illegal** transitions.
- Survive process death: after restart, RecoveryState remains readable and is
  the source of truth for phase/progress (Session row may mirror a summary
  only — P0-1).
- Preserve dual-status separation: Session `status` remains lifecycle
  authority; RecoveryState `phase` remains progress-within-`RECOVERING`
  authority.
- Keep ownership inside Trading Session orchestration (Session Recovery
  Orchestrator shape already accepted — E17 §5.1; Stage 2 §3.2).
- Use ADR-013 durability patterns for authoritative recovery writes (durable
  store + transactional Outbox practice for Session recovery lifecycle
  evidence already in the E17 baseline — without redesigning event semantics).
- Honor P0-2: when `resumeIntent = STOPPED`, RecoveryState must retain that
  intent across restart so later exit cannot resurrect trading.
- On successful S7-class completion path, finalize RecoveryState as
  completed (retain for audit or soft-clear per P0-1 retention — never destroy
  evidence required by later chaos/US248-class claims).
- Treat `lastAttemptedPhase` as **diagnostic only**; crash re-entry still
  restarts the recovery algorithm at discovery/`RECOVERING` and does **not**
  skip validate/reconcile (E17 §4.4 idempotency rule).
- Provide a durable correlation slot for later Incident linkage
  (`incidentId` nullable per P0-1) **without** delivering Incident
  productization (US293).

---

## 4. Scope OUT

Hard-stop boundaries (must not be absorbed into US292):

| Out of scope                                                                                                | Owner / later Story                      |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Durable Incident on ambiguity / corruption (create/block semantics productization)                          | **US293**                                |
| Chaos/restart + fail-safe evidence suites                                                                   | **US294**                                |
| ADL-008 ACCEPTED or explicit accepted deferral                                                              | **US295**                                |
| Operator recovery status / phase API                                                                        | **E19**                                  |
| Durable Kill Switch admission/arming policy                                                                 | **E19**                                  |
| Broader in-process stage-cache durability (`lastResult` / Sets) beyond RecoveryState                        | **Future backlog** (after RecoveryState) |
| Order proposal from recovery SignalIntent                                                                   | **Future backlog**                       |
| Force/confirm Session `RECOVERING` on discovery                                                             | **US290** (predecessor; do not re-open)  |
| Real `RECOVERY_RECONCILIATION_PORTS` adapters / stub retirement                                             | **US291** (predecessor; do not re-open)  |
| Redesign of US240–US249 pipeline algorithms (lease, checkpoint, reconcile decide-gates, arming, completion) | Existing story authorities               |
| New RecoveryCoordinator / Recovery bounded context                                                          | Forbidden (Stage 2)                      |
| Job/scheduler as second Session or recovery lifecycle                                                       | Forbidden (TD-002; E17 §5)               |
| Canonical Order Path, Orders, Risk, Execution, Accounting redesign                                          | Freeze / Stage 2                         |
| Research session recovery; `live-trading-engine/` paper recovery path                                       | E17 Spec / Stage 2                       |
| Real-capital / live broker adapters                                                                         | RC-18 out of scope                       |
| Exact-once event redesign; Kafka / microservices                                                            | Freeze / RC-18 out of scope              |

### Non-goals

| Non-goal                                                        | Rationale                                |
| --------------------------------------------------------------- | ---------------------------------------- |
| Encode Session lifecycle solely in Job payloads or logs         | P0-1; TD-002; ADR-018 #22                |
| Make Session JSON blob the sole unauditable recovery authority  | E17 §8.3 rejected alternative            |
| Skip validate/reconcile based on persisted `lastAttemptedPhase` | E17 §4.4                                 |
| Deliver operator-facing recovery phase API in this Story        | E19                                      |
| Claim full production restart-safety from US292 alone           | Requires US293–US294 (+ US295) per RC-18 |
| Invent new RecoveryPhase vocabulary beyond E17 §4.5             | Architecture Freeze                      |

---

## 5. Architecture Constraints

Binding for Stage 3 planning and coding. Summarized from Stage 2 PROCEED,
frozen ADRs, and E17 Spec — not renegotiated here.

### 5.1 TradingSession lifecycle ownership

- Trading Session is the **sole owner** of Session `status` transitions,
  including force/confirm into `RECOVERING` (US290) and exit from
  `RECOVERING` (US249 completion contract).
- Recovery phases run **under** Session status `RECOVERING` (except after
  successful exit or terminal failure) — E17 §4.5.
- Phase advance while Session status ∉ {`RECOVERING`} is **illegal**
  (§4.5 illegal transitions).
- No new bounded context; no RecoveryCoordinator BC; no Job-queue-owned
  Session lifecycle.

### 5.2 RecoveryState ownership

- Trading Session owns RecoveryState persistence and phase progress
  (Stage 2 §3.7; E17 §5 ownership table).
- RecoveryState row (dedicated durable store implementing
  `RecoveryStateRepository`) is **source of truth** for phase/progress.
- Session summary fields may mirror for query convenience only (P0-1).
- In-process stage caches remain **non-authoritative** (ADR-018 #22; TR-N6).

### 5.3 RecoveryPhase responsibilities

Normative meanings (E17 §4.5). US292 enforces durability and legal
transition of these phases; it does not redefine stage algorithms owned by
US241–US246 / US249.

| Phase         | Responsibility (progress meaning)                                                 | Session status       | Execution / evaluate                   |
| ------------- | --------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| `RECOVERING`  | Discovery done (or re-entered); lease acquire + assembly load in progress         | `RECOVERING`         | Forbidden                              |
| `VALIDATING`  | Assembly loaded; schema, checkpoint, Intent legality, Kill Switch, cursor checks  | `RECOVERING`         | Forbidden                              |
| `RECONCILING` | Order/Exec reconcile + accounting rebuild/reconcile + market continuity restore   | `RECOVERING`         | Forbidden                              |
| `READY`       | Validate + reconcile + market continuity succeeded; safe to exit Session recovery | `RECOVERING` (brief) | Forbidden until S7 commits             |
| `FAILED`      | Unrecoverable or ambiguous; Incident recorded (Incident delivery → US293)         | `FAILED`             | Forbidden permanently for this Session |

### 5.4 Dual-status rule

1. Session `status` = authoritative **lifecycle** (ADR-014).
2. RecoveryState `phase` = authoritative **progress within** `RECOVERING`.
3. Neither may silently override the other:
   - Phase machine does not invent Session status transitions.
   - Session status force/confirm (US290) does not replace durable phase
     authority (this Story).
4. Runtime worker maps / in-memory caches are never authoritative for either
   layer (ADR-018 #22).

### 5.5 Legal RecoveryPhase transitions

**Legal** (E17 §4.5 — deterministic):

| From          | To            | Trigger                                                                                                 |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| _(none)_      | `RECOVERING`  | S1 discovery / re-entry after crash during recovery                                                     |
| `RECOVERING`  | `VALIDATING`  | Lease acquired + assembly load committed to RecoveryState                                               |
| `VALIDATING`  | `RECONCILING` | Validation passed (cursor candidate + legality OK)                                                      |
| `RECONCILING` | `READY`       | Orders/accounting reconcile OK **and** market continuity READY                                          |
| `RECOVERING`  | `FAILED`      | Lease acquire impossible; missing Deployment; hard I/O corruption                                       |
| `VALIDATING`  | `FAILED`      | Checkpoint corruption; illegal Intent/checkpoint pair; schema mismatch                                  |
| `RECONCILING` | `FAILED`      | Reconcile mismatch; uncertain Order cannot be reconciled; market continuity unrecoverable within policy |
| `READY`       | `FAILED`      | Exit commit fails after READY (rare); re-entry starts at `RECOVERING`                                   |
| `READY`       | _(completed)_ | S7 Session transition + Runtime arm committed; RecoveryState finalized                                  |

**Illegal** (must reject and audit — E17 §4.5):

| Illegal transition                                         | Reason                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `VALIDATING` → `RECOVERING`                                | No backward phase moves; crash re-enters via new attempt at `RECOVERING` only        |
| `RECONCILING` → `VALIDATING` or `RECOVERING`               | Same                                                                                 |
| `READY` → `RECONCILING` / `VALIDATING` / `RECOVERING`      | Same                                                                                 |
| `FAILED` → any non-terminal phase                          | Terminal for this recovery attempt **and** Session; new Session required for trading |
| `FAILED` → `READY`                                         | Never skip failure                                                                   |
| Any phase → `READY` skipping `VALIDATING` or `RECONCILING` | Reconcile-before-resume                                                              |
| `RECOVERING` → `READY`                                     | Skips validate/reconcile                                                             |
| `VALIDATING` → `READY`                                     | Skips reconcile / market continuity                                                  |
| Phase advance while Session status ∉ {`RECOVERING`}        | Phase machine only under Session `RECOVERING`                                        |
| `READY` → accept events / evaluate                         | Events only after Session exits `RECOVERING` (S7/S8)                                 |
| Any phase → emit Signal Intent / submit Order              | ADR-018 #24                                                                          |

### 5.6 RecoveryState persistence responsibilities

Logical requirements from E17 §4.6 **P0-1** (binding intent; Stage 2 does not
prescribe DDL):

| Decision                    | Normative rule                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Store**                   | Dedicated durable PostgreSQL-backed implementation of `RecoveryStateRepository` (additive; ownership under Trading Session / US292 — see Technical Notes on US249 / US292 implementation responsibility)                                                                                                                               |
| **Do not**                  | Rely solely on ephemeral in-memory maps, Job queue payloads, or log lines as recovery authority                                                                                                                                                                                                                                        |
| **May**                     | Mirror a summary on the Session row; RecoveryState remains SoT for phase/progress                                                                                                                                                                                                                                                      |
| **Required logical fields** | `sessionId`, `workspaceId`, `recoveryId`, `recoveryAttempt`, `phase`, `preRecoveryStatus`, `resumeIntent`, `fencingToken` (current), `lastSemanticEventId` (cursor checkpoint ref), `lastAttemptedPhase` (diagnostic), `startedAt`, `updatedAt`, `completedAt` \| `failedAt`, `failureReason`, `incidentId` (nullable), schema/version |
| **`resumeIntent`**          | Persisted explicitly at open; do not infer solely from live Session status after `RECOVERING`                                                                                                                                                                                                                                          |
| **Incident column**         | Nullable `incidentId` correlation slot only in this Story; Incident row/productization is US293                                                                                                                                                                                                                                        |
| **Clearing**                | On successful completion: mark completed (retain for audit) or soft-clear per retention — never delete evidence required by chaos/US248-class claims                                                                                                                                                                                   |

### 5.7 Separation: lifecycle state vs recovery progress

| Concern                                                            | Authority                                                          | Established by                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------ |
| Is the Session in recovery lifecycle?                              | Session `status == RECOVERING`                                     | ADR-014; US290                                   |
| How far has recovery progressed?                                   | RecoveryState `phase`                                              | E17 §4.5; **US292**                              |
| Where should Session exit to?                                      | RecoveryState `resumeIntent` (+ Kill Switch adjust at S7 per P0-3) | US290 open + US292 persist; S7 consumer          |
| What was status before recovery open?                              | RecoveryState `preRecoveryStatus`                                  | US290 open + US292 persist                       |
| Stage pipeline decide outcomes (`LEASE_ACQUIRED`, `RECONCILED`, …) | Existing stage contracts                                           | US241–US244 / US249 — not replaced by phase enum |

US292 must not collapse Session `status` and RecoveryState `phase` into one
field, and must not treat stage-cache outcomes as durable phase authority.

### 5.8 Module ownership boundaries

Inherited Stage 2 §8.3 envelope (residual completion):

| Module                                 | Allowed for US292                                                                                | Forbidden                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `trading-session/`                     | RecoveryState durability/phase machine; discovery/completion consistency for phase open/finalize | Owning Order/Fill/Ledger mutations; new BC; E19 operator API |
| Foreign reconcile / accounting modules | None required for US292 beyond existing ports already used by pipeline                           | New accounting/execution semantics                           |
| `strategy-runtime/`                    | No new Order submit; no phase ownership transfer                                                 | Order submit; accounting writes                              |
| `risk/`                                | Read-only as already gated elsewhere                                                             | Durable Kill Switch policy (E19)                             |
| `event-processing/`                    | Existing Session recovery Outbox usage patterns                                                  | Exact-once redesign; new bus                                 |
| `canonical-order-path/`                | None unless wiring bug                                                                           | New execution semantics                                      |
| `live-trading-engine/`                 | **None** for paper recovery path                                                                 | Parallel recovery path                                       |
| Dashboard / UI                         | Optional non-authoritative reads only if already scoped elsewhere                                | Authoritative recovery phase API via this Story              |

**Hard stop (Stage 2 §7):** if implementation planning would touch more than
three modules or exceed residual scope, re-enter Architecture Review before
coding.

### 5.9 Global Freeze constraints (still binding)

1. No new bounded context.
2. No ADR change — residuals implement claim; they do not redefine Freeze ADRs.
3. Confirmed recovery shape preserved (no parallel lifecycle).
4. Canonical Order Path unchanged; SignalIntent remains the only recovery
   downstream artifact into that path.
5. ADR-017 dependency direction unchanged.
6. Sequencing: US290 → US291 → **US292** → US293 → US294 → US295 → E18.

---

## 6. Functional Requirements

Behaviour only. No implementation prescription.

### FR-1 — Durable RecoveryState open

When a recovery-eligible Session is forced/confirmed into `RECOVERING`
(US290), Trading Session must open (or confirm) durable RecoveryState with
`phase = RECOVERING`, explicit `preRecoveryStatus`, and explicit
`resumeIntent`, persisted per P0-1 — not only in memory.

### FR-2 — Phase machine advances legally

As existing pipeline stages commit the triggers defined in §4.5 (lease +
assembly load → `VALIDATING`; validation passed → `RECONCILING`; reconcile +
market continuity OK → `READY`; failure classes → `FAILED`; S7 success →
completed), RecoveryState `phase` must advance only via legal transitions and
must be durably recorded.

### FR-3 — Illegal transitions rejected

Attempts to apply illegal §4.5 transitions must be rejected and audited.
Illegal transitions must not become durable authority.

### FR-4 — Dual-status integrity

While phases `RECOVERING`…`READY` are active, Session status remains
`RECOVERING`. Phase advancement must not itself emit SignalIntent or admit
new strategy evaluation (ADR-018 #23–24; E17 R9).

### FR-5 — Source of truth across restart

After process restart, durable RecoveryState for an in-progress recovery must
remain loadable and authoritative for phase/progress. In-memory stage caches
must not be treated as the recovery progress authority.

### FR-6 — Diagnostic-only `lastAttemptedPhase`

Persisted `lastAttemptedPhase` may aid diagnostics but must not authorize
skipping validate/reconcile on crash re-entry. Re-entry remains full algorithm
from S1 / `phase = RECOVERING` (E17 §4.4).

### FR-7 — `resumeIntent` / `preRecoveryStatus` durability

Values established at US290 open must be persisted on RecoveryState and must
survive restart. For `STOPPING` paths, `resumeIntent` remains `STOPPED`
(P0-2). Do not re-infer solely from live Session status after transition to
`RECOVERING`.

### FR-8 — Completion finalization

On successful Session exit from `RECOVERING` under existing US249 rules,
RecoveryState must be finalized as completed (audit retain or soft-clear per
P0-1). On unrecoverable/ambiguous failure paths already decided by the
pipeline, phase may become `FAILED` with durable failure metadata; creating
the Incident **record** remains US293 (nullable `incidentId` may exist).

### FR-9 — No second lifecycle authority

Job/scheduler systems, Dashboard, Runtime worker maps, and log lines must not
become owners of RecoveryState phase or Session lifecycle for this Story.

### FR-10 — Pipeline compatibility without redesign

Existing US241–US249 stage contracts remain the stage authorities. US292
persists progress consistent with those stages and §4.5; it does not replace
decide-gate vocabularies (`LEASE_ACQUIRED`, `RECONCILED`, …) with a new
parallel pipeline.

### FR-11 — Hard-stop successors

US292 must not implement durable Incident productization (US293), chaos
evidence suites (US294), ADL-008 closure (US295), or E19 operator recovery
API.

---

## 7. Non-Functional Requirements

### NFR-1 — Crash durability

RecoveryState phase/progress and open-time intent fields must survive process
death and be readable on the next boot for the same Session identity
(ADR-014 Session identity retained).

### NFR-2 — Authority hierarchy

Durable RecoveryState outranks in-memory caches for phase/progress. Logs are
observability, not authority (P0-1; ADR-018 #22).

### NFR-3 — Auditable transitions

Legal phase advances, illegal rejection, open, failure, and completion
finalization must leave reviewable durable evidence consistent with Session
recovery Outbox / lifecycle audit practice in the E17 baseline (ADR-013 /
E17 R20) — without redesigning event semantics.

### NFR-4 — Idempotent open / confirm

Re-running discovery open for an already-`RECOVERING` Session (US290
idempotent confirm) must not invent a contradictory RecoveryState authority
(conflicting `resumeIntent` / silent phase reset that would skip required
work). New recovery **attempts** after failed exit follow §4.5
(`READY` → `FAILED` then re-entry at `RECOVERING`; `FAILED` Session is
terminal).

### NFR-5 — Workspace / Session isolation

RecoveryState is keyed to Session (and workspace as required by P0-1 logical
fields); persistence must not conflate Sessions.

### NFR-6 — Secrets hygiene

RecoveryState / failure payloads must not store secrets (aligned with
original US249 AC #6 intent for recovery metadata).

### NFR-7 — Scope-bounded change envelope

Implementation remains within Stage 2 module envelope; prefer Trading Session
(+ existing event-processing substrate usage) without foreign ownership
transfer.

---

## 8. Acceptance Criteria

Every AC is testable. Architecture citations are normative.

### AC-1 — Durable open at `RECOVERING`

**Given** US290 discovery/`RECOVERING` open succeeds for a recovery candidate  
**When** RecoveryState open is committed  
**Then** durable RecoveryState exists with `phase = RECOVERING`, explicit
`preRecoveryStatus`, and explicit `resumeIntent`, loadable after process
restart  
**Authority:** E17 §4.2 step 1; §4.4 S1; §4.6 P0-1; Stage 2 US292

### AC-2 — Legal phase advances persist

**Given** Session status is `RECOVERING` and RecoveryState is open  
**When** a legal §4.5 trigger is committed (e.g. lease + assembly load →
`VALIDATING`; validation OK → `RECONCILING`; reconcile + market continuity OK
→ `READY`)  
**Then** durable `phase` equals the legal target and survives restart  
**Authority:** E17 §4.5 legal transitions; P0-1

### AC-3 — Illegal transitions rejected

**Given** RecoveryState at a known phase  
**When** an illegal §4.5 transition is attempted (including backward moves,
skip-to-`READY`, phase advance while Session status ≠ `RECOVERING`, or
`FAILED` → non-terminal phase)  
**Then** the transition is rejected, audited, and durable phase is unchanged
by the illegal attempt  
**Authority:** E17 §4.5 illegal transitions

### AC-4 — Dual-status rule held

**Given** RecoveryState phases `RECOVERING`…`READY`  
**When** progress is inspected  
**Then** Session `status` remains `RECOVERING` until lawful exit/failure;
`phase` is the progress authority; in-memory caches are not treated as SoT  
**Authority:** E17 §4.5 dual-status rule; ADR-018 #22; Stage 2 §3.7

### AC-5 — No evaluation / SignalIntent from phase machinery

**Given** Session is `RECOVERING` with any active recovery phase  
**When** phase open/advance/finalize runs  
**Then** no new SignalIntent is emitted and no new strategy evaluation is
admitted as a consequence of phase persistence  
**Authority:** ADR-018 #23–24; E17 R9; §4.5 illegal “any phase → Intent/Order”

### AC-6 — `lastAttemptedPhase` does not skip work

**Given** a crash mid-recovery with durable `lastAttemptedPhase` set  
**When** recovery re-enters after restart  
**Then** algorithm re-enters at discovery/`RECOVERING` and does not skip
validate/reconcile solely because `lastAttemptedPhase` was advanced  
**Authority:** E17 §4.4 idempotency rule

### AC-7 — STOPPING intent preserved

**Given** RecoveryState opened with `resumeIntent = STOPPED` (P0-2 / US290)  
**When** process restarts mid-recovery  
**Then** loaded RecoveryState still has `resumeIntent = STOPPED` (not
re-inferred to `RUNNING`/`PAUSED`)  
**Authority:** E17 §4.6 P0-2; Stage 2 §3.7 alignment US290↔US292

### AC-8 — Completion finalizes RecoveryState

**Given** a Session reaches successful completion/exit under existing US249
rules after `READY`  
**When** S7-class success commits  
**Then** RecoveryState is finalized completed (retained or soft-cleared per
P0-1) and is not left as an ambiguous in-progress authority  
**Authority:** E17 §4.2 step 8; §4.5 `READY` → completed; P0-1 clearing rule

### AC-9 — Failure path can record `FAILED` without absorbing US293

**Given** a pipeline failure class that §4.5 maps to `FAILED`  
**When** that failure is committed to RecoveryState  
**Then** durable `phase = FAILED` with failure metadata; `incidentId` may be
null until US293; unsafe resume is not authorized by phase alone  
**Authority:** E17 §4.5; Stage 1 R3/R4 split; Stage 2 US292 vs US293

### AC-10 — Ownership / Freeze preserved

**Given** US292 is delivered  
**When** architecture/boundary review is performed  
**Then** Trading Session remains RecoveryState owner; no RecoveryCoordinator
BC; no Job-queue lifecycle; Canonical Order Path unchanged; ADR-012…ADR-019
unchanged by this Story  
**Authority:** Stage 2 §3 / §8.2; E17 §5; ADR-017; ADR-018 #60

### AC-11 — Hard-stop: successors not absorbed

**Given** US292 change set and Story DoD  
**When** scope review is performed  
**Then** durable Incident productization (US293), chaos/restart evidence
suites (US294), ADL-008 closure (US295), and E19 operator recovery API are
absent from this Story’s delivery claim  
**Authority:** Stage 1 §5; Stage 2 §4–§5; TD-036 residual table

---

## 9. Technical Notes

Planning notes for Stage 3. These cite existing authority; they do **not**
approve schema DDL, class designs, or APIs.

1. **Authority stack for this Story**  
   Stage 2 PROCEED constraints → this specification → E17 §4.5 / P0-1 →
   ADR-014 / ADR-013 / ADR-018. Do not invent alternate phase vocabularies.

2. **US249 and US292 (implementation responsibility)**  
   E17 Spec P0-1 originally named the additive RecoveryState store under
   **US249**. That naming records architectural intent; it does **not** mean
   US249 is replaced or invalidated. US249 remains the authority for the
   completion / Session-exit slice already delivered. RC-18 Stage 1/2
   reassigns **implementation responsibility** for the still-open durable
   RecoveryState + phase machine residual to **US292**, preserving E17
   architectural intent (§4.5 / P0-1). Stage 3 planning implements that
   residual under US292 without reopening or superseding US249’s completed
   scope.

3. **Existing port**  
   `RecoveryStateRepository` (`save` / `load` / `clear`) already exists as a
   persistence-agnostic contract under Trading Session. US292 is the Story
   that makes durable infrastructure real under P0-1 rules. Prefer
   implementing that contract over inventing a second recovery store.

4. **Alignment with US290**  
   US290 establishes `preRecoveryStatus` / `resumeIntent` at lifecycle open.
   US292 persists them on RecoveryState. Do not invent a competing intent
   authority. Confirm-idempotent rediscovery must not silently rewrite intent
   (US290 FR-10 / Stage 2 §3.7).

5. **Alignment with US291**  
   Phase `RECONCILING` → `READY` / `FAILED` consumes trustworthy reconcile
   outcomes. US292 does not re-bind ports or redesign decide-gates.

6. **Recovery Pipeline milestones ↔ RecoveryPhase (E17 authority)**  
   The recovery pipeline is unchanged. §4.4.1 stage outcomes remain stage
   contracts. RecoveryPhase (§4.5) is durable progress only. The following
   mapping is derived from E17 §4.4 sequence phase column and §4.5 legal
   transition triggers — no new phases, no pipeline redesign.

   | Pipeline milestone (E17 §4.4 / §4.4.1)                                                   | RecoveryPhase begins                                                     | RecoveryPhase holds until                                     | RecoveryPhase ends / next                                                                                          |
   | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
   | S0 Bootstrap                                                                             | — (no Session phase)                                                     | —                                                             | —                                                                                                                  |
   | S1 Discover Session; RecoveryState open (`recovery_candidate` / US290 `RECOVERING` open) | `RECOVERING`                                                             | S1–S2 in progress; lease acquire underway                     | Ends when S3 assembly load is committed with lease acquired → `VALIDATING`                                         |
   | S2 Acquire Lease (`LEASE_ACQUIRED`)                                                      | — (already `RECOVERING`)                                                 | Remains `RECOVERING`                                          | Same end as row above; `LEASE_DENIED` → may enter `FAILED`                                                         |
   | S3 Load Checkpoint complete (lease + assembly load committed to RecoveryState)           | `VALIDATING`                                                             | S4 validation in progress                                     | Ends when validation passed → `RECONCILING`; `NO_CHECKPOINT` / `INVALID_CHECKPOINT` / corruption → `FAILED`        |
   | S4 Validate State (incl. `VALID_CHECKPOINT` path)                                        | — (already `VALIDATING`)                                                 | Remains `VALIDATING` until legality/cursor OK                 | Validation passed → `RECONCILING`; failure classes → `FAILED`                                                      |
   | S5 Reconcile Orders (`RECONCILED`)                                                       | `RECONCILING` (entered when validation passed; reconcile work runs here) | Remains `RECONCILING` through reconcile                       | `RECONCILIATION_FAILED` / mismatch → `FAILED`; success continues holding `RECONCILING` until S6 continuity also OK |
   | S6 Resume Market Feed (continuity READY **and** reconcile OK; US244 `READY`)             | `READY`                                                                  | Brief hold while Session still `RECOVERING`, before S7 commit | Ends on S7 success → completed/finalized; exit commit failure → `FAILED`                                           |
   | S7 Resume Runtime / Session exit + RecoveryState finalize                                | — (exit `READY`)                                                         | —                                                             | RecoveryPhase completed/finalized (not a new phase value)                                                          |
   | S8 Accept Events                                                                         | — (post-recovery; no active recovery phase)                              | —                                                             | —                                                                                                                  |
   | Failure shortcut any S1–S6 (ambiguity/corruption)                                        | `FAILED`                                                                 | Terminal for this recovery attempt / Session                  | No advance to `READY` / S7 / S8                                                                                    |

   **Begin/end rule (normative restatement of E17 §4.5):** a phase **begins**
   when its legal entry trigger commits to RecoveryState; it **holds** while
   work for that phase runs; it **ends** only on a legal exit transition
   (next phase, `FAILED`, or completed finalization from `READY`). Do not
   invent a third progress model beyond pipeline stage contracts and
   RecoveryPhase.

7. **`RecoveryStatus` and `RecoveryPhase` relationship**  
   The Stage 3 Trading Session aggregate already carries `RecoveryStatus`
   (`NOT_REQUIRED` \| `ELIGIBLE` \| `RECOVERING` \| `RECOVERED` \|
   `FAILED`). E17 §4.5 defines `RecoveryPhase`
   (`RECOVERING` \| `VALIDATING` \| `RECONCILING` \| `READY` \| `FAILED`)
   on durable RecoveryState.

   - **`RecoveryStatus` is not replaced in US292.** Existing aggregate
     `RecoveryStatus` remains; this Story does not remove, rename, or
     redefine it as the Session lifecycle.
   - **`RecoveryPhase` is introduced solely for durable recovery progress
     tracking** within Session `RECOVERING`, per E17 §4.5 / P0-1.
   - **`RecoveryPhase` does not become a second lifecycle authority.**
     Session `status` (ADR-014) remains the sole lifecycle authority;
     `RecoveryPhase` is progress-within-`RECOVERING` only (dual-status
     rule). Do not collapse Session lifecycle status, aggregate
     `RecoveryStatus`, and durable `RecoveryPhase` into one ambiguous
     field. Architecture authority for the phase machine is E17 §4.5.

8. **`incidentId` vs US293**  
   P0-1 lists nullable `incidentId`. US292 may persist the column/slot.
   Creating durable Incident records and fail-closed product semantics is
   **US293**.

9. **Operator reads**  
   Original US249 AC #4 (operator query of recovery status/phase) is
   classified **E19 operational** in TD-036 / Stage 2. US292 must not expand
   into operator API delivery.

10. **Broader cache durability**  
    Making all in-process `lastResult` / Sets crash-durable remains **future
    backlog after RecoveryState** (TD-036). US292 closes RecoveryState
    authority, not every stage cache.

11. **Kill Switch adjust at S7 (P0-3)**  
    If S7 forces `resumeIntent` `RUNNING` → `PAUSED`, the adjustment is
    persisted on RecoveryState per P0-3. US292 must allow that durable update
    without owning Kill Switch policy productization (E19 / TR-N5).

12. **No HOW prescription**  
    Exact table DDL, ORM mapping, repository class names, and internal
    service decomposition are Stage 3 planning/coding concerns under Freeze —
    provided they realize P0-1 logical requirements and §4.5 transitions.

---

## 10. Testing Requirements

What must be verified for US292. No test implementation in this document.
Chaos/restart **release evidence suites** remain US294; US292 still requires
focused durability tests sufficient for its ACs.

1. **Persistence round-trip** — save/load RecoveryState across process
   boundary (or equivalent durable store restart) for open fields and each
   legal phase (AC-1, AC-2, AC-7).
2. **Legal transition matrix** — each legal §4.5 transition accepted and
   persisted (AC-2).
3. **Illegal transition matrix** — each illegal §4.5 transition rejected;
   durable phase unchanged; audit/evidence present (AC-3).
4. **Dual-status** — phase advances while Session remains `RECOVERING`; no
   phase advance when Session status is not `RECOVERING` (AC-4).
5. **No execution side effects** — phase open/advance/finalize does not emit
   SignalIntent or admit evaluation (AC-5).
6. **Re-entry rule** — with `lastAttemptedPhase` set mid-pipeline, restart
   re-enters at `RECOVERING` / full algorithm and does not skip
   validate/reconcile (AC-6).
7. **STOPPING intent** — `resumeIntent = STOPPED` survives restart (AC-7).
8. **Completion finalize** — successful exit finalizes RecoveryState (AC-8).
9. **Failure phase** — `FAILED` can be durably recorded without requiring
   US293 Incident row (AC-9).
10. **Boundary / ownership** — Trading Session remains owner; no
    RecoveryCoordinator; no Job-queue lifecycle encoding as authority
    (AC-10).
11. **Scope discipline review** — confirm US293–US295 / E19 / future backlog
    items not absorbed (AC-11).
12. **Regression** — existing US240–US249 stage contracts and US290/US291
    behaviours remain green; quality gates (format, lint, typecheck, build,
    tests) pass for the implementing change set.

---

## 11. Definition of Done

Story-level DoD only (not residual workstream exit).

- [x] This Story Specification accepted as implementation authority for US292
- [x] Stage 3 implementation planning cites this document + Stage 2 PROCEED
      constraints + E17 Spec §4.5 / §4.6 P0-1 + ADR-013 / ADR-014 / ADR-018
- [x] AC-1…AC-11 satisfied with reviewable evidence
- [x] TR-N3 closed for the **RecoveryState / phase durability** portion
      (Incident productization remains US293; operator API remains E19)
- [x] TR-N6 addressed for RecoveryState authority (broader stage-cache
      durability may remain future backlog explicitly)
- [x] TD-036 residual row “Durable RecoveryState persistence + phase machine”
      updated when implementation evidence lands
- [x] Architecture Freeze intact (ADR-012…ADR-019 unchanged by this Story)
- [x] No new bounded context / RecoveryCoordinator introduced
- [x] Dual-status rule preserved; lifecycle vs progress separation explicit in
      implementation evidence
- [x] Canonical Order Path and SignalIntent recovery boundary unchanged
- [x] Scope not expanded into US293–US295 / E19 / future backlog items
- [x] Docs sync for this Story: CHANGELOG / project status / roadmap /
      architecture snapshot / module maturity / technical debt / story-id
      allocation as required by residual DoD practice
- [x] Quality gates green for the change set that implements this Story
      (format, lint, typecheck, build, tests) — verified at implementation time

**Not required for US292 DoD alone:** durable Incident productization
(US293); chaos/restart release evidence (US294); ADL-008 ACCEPTED (US295);
E19 operator recovery API; full production restart-safety PASS language;
broader in-process cache durability beyond RecoveryState.

---

## References

Ordered by authority. This specification consolidates existing decisions; it
does not invent architecture.

| #   | Document                            | Path                                                                                                             |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | CANONICAL                           | [`../../CANONICAL.md`](../../CANONICAL.md)                                                                       |
| 2   | ADR Index                           | [`../../adr/README.md`](../../adr/README.md)                                                                     |
| 3   | ADR-013 Event Processing Model      | [`../../adr/ADR-013-event-processing-model.md`](../../adr/ADR-013-event-processing-model.md)                     |
| 4   | ADR-014 Runtime Lifecycle           | [`../../adr/ADR-014-runtime-lifecycle.md`](../../adr/ADR-014-runtime-lifecycle.md)                               |
| 5   | ADR-018 Architectural Invariants    | [`../../adr/ADR-018-architectural-invariants.md`](../../adr/ADR-018-architectural-invariants.md)                 |
| 6   | Architecture Decision Log (ADL-008) | [`../../Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                                                 |
| 7   | RC-18 Release Planning              | [`../rc-18-release-planning.md`](../rc-18-release-planning.md)                                                   |
| 8   | RC-18 TD036 Epic Planning (Stage 1) | [`../rc-18-td036-epic-planning.md`](../rc-18-td036-epic-planning.md)                                             |
| 9   | RC-18 Stage 2 Architecture Review   | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)                   |
| 10  | E17 Runtime Recovery Specification  | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)               |
| 11  | US290 Story Specification           | [`./us290-force-confirm-recovering-on-discovery.md`](./us290-force-confirm-recovering-on-discovery.md)           |
| 12  | US291 Story Specification           | [`./us291-real-recovery-reconciliation-port-adapters.md`](./us291-real-recovery-reconciliation-port-adapters.md) |
| 13  | US249 Recovery Completion           | [`../epics/e17-us249-recovery-completion.md`](../epics/e17-us249-recovery-completion.md)                         |
| 14  | Technical Debt (TD-036 residuals)   | [`../technical-debt.md`](../technical-debt.md)                                                                   |
| 15  | RC-17 Retrospective                 | [`../rc-17-retrospective.md`](../rc-17-retrospective.md)                                                         |
| 16  | E17 Stage 4 Technical Review        | [`../e17-stage-4-technical-review.md`](../e17-stage-4-technical-review.md)                                       |
| 17  | Story ID Allocation                 | [`../story-id-allocation.md`](../story-id-allocation.md)                                                         |

---

## Document lifecycle

```text
Implemented
        ↓
Stage 3 implementation COMPLETE
        ↓
RIV-001 / SIG-001 / Mid-Release Health Review
        ↓
DoD COMPLETE → next residual US293 (Done)
```

---

## Sign-off

| Role                        | Name / Status                 | Date       |
| --------------------------- | ----------------------------- | ---------- |
| Story Specification (docs)  | Auto                          | 2026-08-01 |
| Engineering owner           | _(assign)_                    |            |
| Architecture owner          | _(assign)_                    |            |
| Stage 2 Architecture Review | PROCEED (binding constraints) | 2026-07-30 |

**Authority statement:** This document is the implementation authority for
US292. Stage 3 planning and coding must realize the WHAT defined here under
Architecture Freeze and Stage 2 PROCEED constraints. It does not prescribe HOW
(APIs, schema DDL, classes, or module-internal design).

**Next step:** Stage 3 implementation planning for US292 (after US290/US291
delivery evidence as sequenced), then coding under Freeze — before US293.
