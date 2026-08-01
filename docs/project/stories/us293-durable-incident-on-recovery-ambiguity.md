# US293 — Durable Incident on Recovery Ambiguity

**Story ID:** US293  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R4)  
**Date:** 2026-08-01  
**Status:** Implemented  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — Durable Incident on ambiguity / corruption  
**Closes:** E17 Stage 4 TR-N3 (Incident productization portion); contributes to invariant R18  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Predecessor Stories:** [US290](./us290-force-confirm-recovering-on-discovery.md), [US291](./us291-real-recovery-reconciliation-port-adapters.md), [US292](./us292-durable-recovery-state-phase-machine.md)  
**Mid-release:** [RC-18 Mid-Release Health Review](../rc-18-mid-release-health-review.md) · [SIG-001](../rc-18-sig-001-safety-integration-validation.md)  
**Does not introduce:** implementation design, API design, database schema DDL, class/interface design, new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-012 Execution Architecture](../../adr/ADR-012-execution-architecture.md)
- [ADR-013 Event Processing Model](../../adr/ADR-013-event-processing-model.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [ADR-018 Architectural Invariants](../../adr/ADR-018-architectural-invariants.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md) — ADL-008 DEFERRED; ADL-013 PROPOSED (Incident)
- [RC-18 Release Planning](../rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](../rc-18-td036-epic-planning.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md) — §4.5, §4.6 P0-1 / P0-2, §5, §6 R18, §7, §8.3, ADL-013 draft
- [US290 Story Specification](./us290-force-confirm-recovering-on-discovery.md)
- [US291 Story Specification](./us291-real-recovery-reconciliation-port-adapters.md)
- [US292 Story Specification](./us292-durable-recovery-state-phase-machine.md)
- [US249 Recovery Completion](../epics/e17-us249-recovery-completion.md)
- [Technical Debt](../technical-debt.md) — TD-036 residual ownership
- [RC-17 Retrospective](../rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](../e17-stage-4-technical-review.md)
- [Story ID Allocation](../story-id-allocation.md)

---

## 1. Objective

Persist a **minimal durable Recovery Incident** when recovery encounters
**ambiguity or corruption**, and **fail closed**: block unsafe resume /
execution for that Session so the production recovery claim never silently
skips or heals uncertain state.

### Business value

Operators and release owners cannot claim production restart-safety while
ambiguous or corrupt recovery outcomes produce only logs, in-memory failure
flags, or a RecoveryState `FAILED` phase without durable Incident evidence.
US293 closes the ADR-014 / E17 R18 fail-closed evidence gap required before
chaos proof (US294) and credible ADL-008 closure (US295).

### Architectural purpose

Close the **R4 / TR-N3 Incident** residual under Architecture Freeze:
implement the already-approved **minimal Recovery Incident** path inside
Trading Session orchestration (E17 §5 / §8.3; Stage 2 §3.8), correlated with
US292 RecoveryState (`incidentId` / `phase = FAILED`), without inventing a
Safety Incident product BC, operator dashboard, resolve UX (E19), parallel
recovery lifecycle, or redesign of RecoveryState / Session lifecycle /
Runtime.

US293 is **Incident create + fail-closed block only**. It does not redesign
reconcile decide-gates (US291/US243), does not deliver chaos suites (US294),
and does not claim release-level restart-safety without US294 evidence.

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

Original E17 US249 Acceptance Criteria included durable RecoveryState,
**Incident on ambiguity**, and operator status. Stage 3 local scoping
delivered the **completion / Session-exit** slice under US249; RecoveryState
persistence moved to **US292**; Incident create + fail-closed semantics move
to **US293**; operator recovery status/phase API and richer Safety Incident
productization remain **E19**.

US249 remains valid for the completion / Session-exit work already delivered.
RC-18 does **not** replace or invalidate US249. It reassigns
**implementation responsibility** for the still-open Incident residual to
**US293** (Stage 1 R4; Stage 2 PROCEED), preserving E17 architectural intent
(ADR-014 Incident rule; O8; R18; §7 failure policies; ADL-013 draft).

### Why TR-N3 (Incident portion) exists

E17 Stage 4 recorded:

> **TR-N3** — Durable RecoveryState + Incident + operator status not
> implemented.

Stage 1 / Stage 2 split that residual:

| Portion                        | Story / owner |
| ------------------------------ | ------------- |
| RecoveryState + phase machine  | **US292**     |
| Durable Incident + fail-closed | **US293**     |
| Operator recovery status/phase | **E19**       |

RC-17 Retrospective §8 / TD-036 residual ownership classify durable Incident
on ambiguity / corruption as **RC-18 mandatory**.

### Normative sources (do not redefine)

- ADR-014 Restart recovery: _“Any ambiguity blocks execution and creates an
  Incident.”_
- ADR-018 #23–24 (reconcile-before-resume; no new execution while
  `RECOVERING` / `FAILED` / related non-executable statuses)
- ADR-018 #43, #48 (reject unreconciled state; safety overrides strategy)
- ADR-018 #18, #58–59 (no silent ack of failed durable delivery; Dashboard
  non-authoritative; Audit hygiene — no secrets)
- ADR-013 durability substrate for authoritative recovery / Incident writes
  (Outbox / transactional durable facts; no log-only authority)
- ADR-012 Canonical Order Path / single Execution Engine entry (no
  recovery-only execution fork; no silent heal via compensating shortcuts)
- E17 Spec O8, R18, §4.5 `FAILED`, §4.6 P0-1 Incident column, §5 ownership,
  §7 failure policies, §8.3 Minimal Recovery Incident, ADL-013 draft
- Stage 2 §3.8 / §4 US293 / §8.2 constraints 6–7

### Predecessor alignment

| Predecessor | What US293 consumes (does not redesign)                                  |
| ----------- | ------------------------------------------------------------------------ |
| US290       | Session `RECOVERING` lifecycle precondition; `resumeIntent` established  |
| US291       | Trustworthy reconcile outcomes (`RECONCILED` \| `RECONCILIATION_FAILED`) |
| US292       | Durable RecoveryState; `phase`; nullable `incidentId` correlation slot   |

---

## 3. Architecture Decision Summary

This section records the Architecture Decision Check for US293. It consolidates
**already approved** decisions; it does not open a new ADR.

### Why is Incident required?

ADR-014 mandates that recovery ambiguity **blocks execution and creates an
Incident**. E17 elevates that to measurable objective **O8** and recovery
invariant **R18**: ambiguity / corruption must never silently resume or skip.
Without a durable Incident record, fail-closed behaviour is not operator- or
restart-evidencable (E17 §8.3 rejects log-only Incident).

### What architectural problem does Incident solve?

Recovery can detect states where continuing would risk **duplicate effects**
or **unsafe resume** (uncertain Orders, inconsistent projections, checkpoint
corruption, partial persistence pairs, split-brain lease evidence). Incident
is the durable **safety evidence + hard stop** concept that:

1. records that ambiguity/corruption was observed;
2. correlates to Session / RecoveryState;
3. **forbids** progression to READY / resume / new execution for that Session;
4. forbids silent auto-heal reconstructive writes in this residual scope.

### Why is RecoveryState insufficient?

RecoveryState (US292) is the source of truth for **recovery progress**
(`phase`, `resumeIntent`, attempt metadata) within Session `RECOVERING`.
A `FAILED` phase and `failureReason` describe progress termination; they are
**not** a substitute for the ADR-014-required **Incident** safety record.

P0-1 deliberately models `incidentId` as a **nullable correlation slot** on
RecoveryState — implying a referenced Incident entity, not Incident-as-phase.

### Why must Incident be a separate domain concept?

1. **Different concern** — progress (RecoveryState / RecoveryPhase) vs
   safety-blocking ambiguity evidence (Incident).
2. **Independent review** — Stage 1 kept R3 and R4 as separate Stories.
3. **E19 supersession path** — richer Safety Incident productization may
   absorb/wrap the minimal Recovery Incident **without** changing
   RecoveryState phase semantics or fail-closed rules (ADL-013 draft;
   Stage 2 §3.8).
4. **Provisional model** — minimal Session-owned Recovery Incident until E19;
   not a new bounded context.

### Who owns Incident?

**Trading Session** owns the **minimal durable Recovery Incident** for
recovery ambiguity / unrecoverable recovery, **provisionally until E19**
richer Safety Incident productization (E17 §5 ownership table; Stage 2
§3.2 / §3.8).

### Who is allowed to create Incident?

Only **Trading Session recovery orchestration** (Session Recovery
Orchestrator shape already accepted) may create a Recovery Incident when the
recovery pipeline detects an ambiguity / corruption / unrecoverable class
defined by E17 §4.5 failure transitions and §7 failure policies — consuming
existing stage outcomes (especially US291/US243 reconcile failure and US242
validation corruption classes).

Foreign modules (Orders, Execution, Accounting, Risk, Runtime, Dashboard,
Job/scheduler) **must not** become Incident owners or create Recovery
Incidents as a parallel authority.

### Who is allowed to resolve Incident?

**US293 does not deliver Incident resolution productization.**

Binding residual boundaries:

| Actor / system                         | Allowed in US293                                                                                                         | Forbidden in US293                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Trading Session recovery orchestration | Create Incident; correlate; fail-close / block                                                                           | Auto-resolve; silent heal; clear Incident to resume                       |
| Operator (human)                       | May observe durable evidence via existing/non-E19 means if already present; **no new resolve UX required by this Story** | Authoritative Dashboard resolve; auto-complete STOPPED on ambiguous drain |
| E19 Operations                         | Owns richer Safety Incident productization, operator incident UX, migration/wrap of minimal model                        | —                                                                         |
| Automated recovery re-entry            | Must not treat open Incident as cleared; must not skip reconcile                                                         | Use Incident absence as license to invent heal writes                     |

**Normative consequence already in E17 §4.5:** `FAILED` is terminal for this
recovery attempt **and** Session; a **new Session** is required for trading.
US293 preserves that terminality: resolving an Incident **must not** resurrect
the same Session into `RUNNING` / `PAUSED` inside this Story.

### Does Incident participate in Session lifecycle?

**Correlatively, yes; as a Session status, no.**

- Incident is **not** a Trading Session `status` value.
- On ambiguity/corruption, Session lifecycle must become **non-executable**
  per ADR-014 / E17 §4.5: Session `status = FAILED` when RecoveryState
  `phase = FAILED` with Incident recorded (normative dual-status table).
- Incident **blocks** lawful exit to `RUNNING` / `PAUSED` / happy-path
  `STOPPED` completion when evidence is ambiguous (P0-2 ambiguity path:
  no auto-complete to `STOPPED`).

### Does Incident participate in RecoveryPhase?

**Correlatively, yes; as a phase value, no.**

- Incident is **not** a RecoveryPhase enum member.
- Ambiguity/corruption paths drive RecoveryState to **`phase = FAILED`** and
  set RecoveryState **`incidentId`** to the durable Incident identity
  (P0-1 / US292 correlation slot).
- Incident must not invent alternate phases or replace the §4.5 machine.

### Which existing ADR / authority sections govern Incident?

| Authority                    | Governing content                                                            |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **ADR-014** Restart recovery | Ambiguity → block execution + create Incident                                |
| **ADR-018 #23–24**           | Reconcile-before-resume; no new execution in `RECOVERING` / `FAILED`         |
| **ADR-018 #43, #48**         | Reject unreconciled state; safety overrides strategy                         |
| **ADR-018 #18, #58–59**      | No silent durable-failure ack; Dashboard non-authoritative; Audit/no secrets |
| **ADR-013**                  | Durable write/Outbox substrate for authoritative recovery evidence           |
| **ADR-012**                  | Single Execution Engine entry; no recovery-only execution / heal fork        |
| **E17 R18 / O8 / §7 / §8.3** | Fail-closed policy; Minimal Recovery Incident component                      |
| **E17 §4.5 / P0-1 / §5**     | `FAILED` + `incidentId`; Session ownership of minimal Incident               |
| **ADL-013 (PROPOSED)**       | Minimal durable Recovery Incident provisional pending E19                    |
| **Stage 2 §3.8 / §8.2 #6**   | Minimal Session-owned Incident; E19 productization out of residual scope     |

---

## 4. Scope IN

- Create a **minimal durable Recovery Incident** when recovery detects
  **ambiguity**, **corruption**, or **unrecoverable** classes already defined
  by E17 §4.5 failure transitions and §7 failure policies (including, at
  minimum):
  - reconcile mismatch / uncertain Order that cannot be reconciled
    (`RECONCILIATION_FAILED` and related §7.1–§7.2 classes);
  - checkpoint corruption / schema mismatch / impossible cursor (§7.7);
  - ambiguous Intent/checkpoint partial-persistence pairs (§7.6);
  - detected partial accounting rows / data corruption class (§7.4–§7.5);
  - lease dual-owner / split-brain durable evidence (§7.9);
  - `STOPPING` mid-drain ambiguity / contradictory checkpoint evidence (P0-2);
  - other §4.5 `→ FAILED` triggers that E17 marks as Incident-bearing
    (lease acquire impossible with hard I/O corruption; missing Deployment
    hard-fail classes as already specified).
- Persist Incident as durable evidence (not log-only): workspace-scoped,
  Session-correlated, secret-free payloads (E17 US249 AC #5–#6 intent;
  ADL-013 draft).
- Correlate Incident to RecoveryState via **`incidentId`** (US292 slot) when
  failure is committed.
- Drive fail-closed Session/recovery outcome:
  - RecoveryState `phase = FAILED` (legal §4.5 transition);
  - Session `status = FAILED` per dual-status table;
  - **blocked execution** — no READY → resume, no SignalIntent, no new
    evaluation, no Canonical Order Path fork for “recovery heal”.
- Ensure ambiguity/corruption **never** yields silent skip, silent
  `RECONCILED`, or silent resume.
- Keep ownership inside Trading Session orchestration (minimal Incident;
  provisional pending E19).
- Use ADR-013 durability patterns for authoritative Incident + correlated
  RecoveryState / Session failure evidence (transactional Outbox practice
  already used by E17 Session recovery transitions — without redesigning
  event semantics).
- Document the minimal Incident model as **provisional** pending E19 Safety
  Incident productization (Stage 2 / ADL-013).

---

## 5. Scope OUT

Hard-stop boundaries (must not be absorbed into US293):

| Out of scope                                                                                          | Owner / later Story                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Chaos/restart + fail-safe evidence suites                                                             | **US294**                               |
| ADL-008 ACCEPTED or explicit accepted deferral                                                        | **US295**                               |
| Operator recovery status / phase API                                                                  | **E19**                                 |
| Richer Safety Incident productization, incident dashboard, alerts UX, resolve/acknowledge workflows   | **E19**                                 |
| Durable Kill Switch admission/arming policy                                                           | **E19**                                 |
| Durable RecoveryState + phase machine                                                                 | **US292** (predecessor; do not re-open) |
| Real `RECOVERY_RECONCILIATION_PORTS` adapters / stub retirement                                       | **US291** (predecessor; do not re-open) |
| Force/confirm Session `RECOVERING` on discovery                                                       | **US290** (predecessor; do not re-open) |
| Redesign of US240–US249 pipeline algorithms (lease, checkpoint, reconcile decide-gates, arming, exit) | Existing story authorities              |
| Redesign of RecoveryState schema beyond correlating `incidentId` / failure metadata already in P0-1   | Forbidden redesign                      |
| Redesign of Session lifecycle states / dual-status rule                                               | Forbidden redesign                      |
| Redesign of Runtime arming / evaluation model                                                         | Forbidden redesign                      |
| Silent auto-heal / reconstructive writes that could duplicate effects                                 | Forbidden (E17 risk mitigation)         |
| New RecoveryCoordinator / Recovery / Incident bounded context                                         | Forbidden (Stage 2)                     |
| Job/scheduler as Incident or Session lifecycle owner                                                  | Forbidden (TD-002; E17 §5)              |
| Canonical Order Path, Orders, Risk, Execution, Accounting redesign                                    | Freeze / Stage 2                        |
| Research session recovery; `live-trading-engine/` paper recovery path                                 | E17 Spec / Stage 2                      |
| Real-capital / live broker adapters                                                                   | RC-18 out of scope                      |
| Exact-once event redesign; Kafka / microservices                                                      | Freeze / RC-18 out of scope             |

### Non-goals

| Non-goal                                              | Rationale                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Treat logs as Incident authority                      | E17 §8.3 rejected alternative                                                                           |
| Collapse Incident into RecoveryPhase enum             | Separate domain concept; Stage 1 R3/R4 split                                                            |
| Deliver operator resolve / clear / acknowledge API    | E19                                                                                                     |
| Auto-create a replacement Session on Incident         | ADR-014 / R19 — identity retained; FAILED terminal requires **new** Session for trading, not auto-spawn |
| Claim full production restart-safety from US293 alone | Requires US294 (+ US295) per RC-18                                                                      |
| Invent new ambiguity classes beyond E17 §4.5 / §7     | Architecture Freeze — apply approved classes                                                            |

---

## 6. Architecture Constraints

Binding for Stage 3 planning and coding. Summarized from Stage 2 PROCEED,
frozen ADRs, and E17 Spec — not renegotiated here.

### 6.1 Incident ownership

- Trading Session owns minimal durable Recovery Incident persistence and
  creation on recovery ambiguity/corruption (E17 §5; Stage 2 §3.8).
- E19 may later supersede with richer Safety Incident **without weakening**
  fail-closed create + block semantics (ADL-013 draft).
- No new Incident / Safety / Recovery bounded context in US293.

### 6.2 Incident lifecycle (minimal)

US293 defines a **minimal** lifecycle only:

```text
(none)
   → OPEN / ACTIVE   (created on ambiguity/corruption; blocking)
   → (terminal for this Session’s trading life)
```

- **Create:** on approved ambiguity/corruption detection during recovery.
- **Open/Active:** blocks resume/execution; correlated to RecoveryState
  `FAILED` + Session `FAILED`.
- **Resolve / close / acknowledge / migrate:** **out of scope** (E19). US293
  must not implement auto-resolve or operator clear-to-resume.
- Incident records remain durable evidence for audit / US294 chaos claims
  (retention policy may align with RecoveryState retention; default keep
  until E19 migration — E17 open question #5, non-blocking).

### 6.3 Relationship: Incident ↔ TradingSession

| Rule                                                                | Normative effect                                   |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| Incident is Session-correlated (`sessionId`, `workspaceId`)         | Required                                           |
| Incident is not a Session `status`                                  | Dual-status / lifecycle purity                     |
| Create on ambiguity ⇒ Session becomes non-executable (`FAILED`)     | E17 §4.5 dual-status table                         |
| Open Incident must not allow `RECOVERING` → `RUNNING`/`PAUSED` exit | Fail closed                                        |
| `FAILED` Session remains terminal for trading                       | New Session required for future trading (E17 §4.5) |
| US249 completion happy-path must not succeed over open Incident     | Block unsafe completion                            |

### 6.4 Relationship: Incident ↔ RecoveryState

| Rule                                                                            | Normative effect                                                      |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| RecoveryState remains SoT for phase/progress                                    | US292 / P0-1                                                          |
| On Incident create, set RecoveryState `incidentId`                              | Correlation mandatory when failure commits                            |
| RecoveryState `phase = FAILED` with failure metadata                            | Legal §4.5 transition                                                 |
| RecoveryState alone is not Incident authority                                   | Separate durable Incident record required                             |
| Clearing RecoveryState must not erase required Incident evidence                | Chaos / audit retention                                               |
| **RecoveryState may reference Incident** (`incidentId`)                         | One-way correlation only                                              |
| **Incident must not own or reference RecoveryState as its lifecycle authority** | Incident is safety evidence; not progress owner                       |
| **Avoid cyclic ownership**                                                      | No Incident → RecoveryState lifecycle dependency; no mutual ownership |

### 6.5 Relationship: Incident ↔ RecoveryPhase

| Rule                                                                          | Normative effect                   |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| Incident is not a RecoveryPhase value                                         | No enum redesign                   |
| Ambiguity paths end in `FAILED`                                               | §4.5                               |
| No skip to `READY` after Incident                                             | Illegal transitions remain illegal |
| Phase machine does not invent Session status; Incident does not invent phases | Separation of concerns             |

### 6.6 Incident creation rules

1. Create **only** when recovery detects an approved ambiguity / corruption /
   unrecoverable class (Scope IN; E17 §4.5 / §7).
2. Creation is a Trading Session recovery-orchestration responsibility.
3. Creation must be **durable** before or atomically with the fail-closed
   Session/`FAILED` phase commit (ADR-013 transactional durability practice).
4. Creation must be **idempotent under re-entry**: re-running recovery after
   crash must not invent contradictory clear/resume authority; duplicate
   create attempts must not weaken block semantics (at-least-once safe).
5. Do **not** create Incident for ordinary recoverable progress that still
   follows legal happy-path phase advances without ambiguity.
6. Do **not** create Incident solely because discovery selected a candidate
   (US290) or because reconcile is still in progress without a failure
   decision.

### 6.7 Ambiguity detection rules

Ambiguity/corruption is detected from **existing pipeline authorities**, not
from a new parallel detector BC:

| Source                          | Detection signal (examples)                                                               | Incident? |
| ------------------------------- | ----------------------------------------------------------------------------------------- | --------- |
| US242 / validation              | Checkpoint corruption; schema mismatch; illegal Intent/checkpoint pair; impossible cursor | **Yes**   |
| US243 / US291 reconcile         | Mismatch; uncertain Order cannot be reconciled; inconsistent projections vs facts         | **Yes**   |
| Accounting integrity classes    | Partial rows outside transaction; non-atomic apply observed                               | **Yes**   |
| Lease / fencing                 | Durable split-brain / dual-owner write evidence                                           | **Yes**   |
| P0-2 STOPPING path              | Incomplete/contradictory drain or checkpoint evidence                                     | **Yes**   |
| Market continuity (in-scope)    | Continuity unrecoverable within existing E17 policy → `FAILED` class                      | **Yes**   |
| Happy-path `RECONCILED`/`READY` | No ambiguity                                                                              | **No**    |

**Hard rule:** if uncertain whether state is safe to resume, treat as
ambiguity → Incident + block (O8 / R18). Do not guess a reconstructive heal.

### 6.8 Incident persistence responsibilities

Logical requirements (binding intent; Stage 2 does not prescribe DDL):

| Decision           | Normative rule                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Durability**     | PostgreSQL-backed durable record under Trading Session ownership                                                                                                                 |
| **Do not**         | Rely on logs, metrics, or ephemeral maps as Incident authority                                                                                                                   |
| **Correlation**    | `incidentId` on RecoveryState; Session + workspace identity on Incident                                                                                                          |
| **Minimal fields** | Identity; workspace; session; recovery attempt/correlation; reason/class; createdAt; blocking flag/status; schema/version as needed                                              |
| **Secrets**        | Must not store secrets (credentials, provider payloads) — ADR-018 #59                                                                                                            |
| **Storage shape**  | Dedicated Recovery Incident table **or** thin durable row referenced by RecoveryState — **implementation choice** (E17 open question #1); fail-closed semantics fixed either way |
| **Provisional**    | Document model as provisional pending E19 (ADL-013)                                                                                                                              |

### 6.9 Operator responsibility boundaries

| Operator concern                        | US293                                       | E19 / later                        |
| --------------------------------------- | ------------------------------------------- | ---------------------------------- |
| Durable evidence that ambiguity blocked | **In scope** (create + persist + correlate) | Consume / display / dashboard      |
| Recovery status / phase query API       | Out of scope                                | **E19**                            |
| Acknowledge / resolve / assign Incident | Out of scope                                | **E19**                            |
| Clear Kill Switch / re-enable trading   | Out of scope; must not bypass via Incident  | **E19** (+ ADR-018 #47)            |
| Manual data repair / new Session start  | Outside this Story’s product surface        | Ops policy; architecture unchanged |
| Authoritative Dashboard ledger/recovery | Forbidden                                   | ADR-018 #33, #58                   |

Operators are **not** required by US293 to perform a productized resolve
action for the Story DoD. The system must fail closed **without** waiting for
an operator click.

### 6.10 Hard-stop conditions

Hard-stop (fail closed) when any of the following hold:

1. Ambiguity or corruption class detected (Scope IN / §6.7).
2. Open Recovery Incident exists for the Session’s current recovery failure.
3. RecoveryState `phase = FAILED` with correlated `incidentId`.
4. Session `status = FAILED` after Incident-bearing failure commit.

Under hard-stop, the system **MUST NOT**:

- advance to `READY` / S7 resume / accept new strategy evaluation;
- emit new SignalIntent for that Session;
- submit Orders via any recovery heal path;
- invent compensating Ledger entries as a recovery shortcut;
- auto-complete `STOPPING` → `STOPPED` when evidence is ambiguous (P0-2);
- clear or ignore Incident because a later crash re-entered discovery;
- treat Dashboard or logs as override authority.

**Process hard-stop (Stage 2 §7):** if implementation planning would touch
more than three modules or exceed residual scope, re-enter Architecture
Review before coding.

### 6.11 Module ownership

Inherited Stage 2 §8.3 envelope:

| Module                                 | Allowed for US293                                                                                              | Forbidden                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `trading-session/`                     | Minimal durable Incident create/persist/correlate; fail-closed Session/`FAILED` consistency with RecoveryState | Owning Order/Fill/Ledger mutations; new BC; E19 operator API    |
| Foreign reconcile / accounting modules | Provide existing failure signals via ports already used by pipeline                                            | New accounting/execution semantics; Incident ownership          |
| `strategy-runtime/`                    | No evaluate / Intent while blocked                                                                             | Order submit; Incident ownership                                |
| `risk/`                                | Read-only as already gated elsewhere                                                                           | Durable Kill Switch policy (E19); clear Kill Switch in recovery |
| `event-processing/`                    | Existing Session recovery Outbox usage patterns for durable failure evidence                                   | Exact-once redesign; new bus                                    |
| `canonical-order-path/`                | None unless wiring bug                                                                                         | New execution semantics / heal path                             |
| `live-trading-engine/`                 | **None** for paper recovery path                                                                               | Parallel recovery / Incident path                               |
| Dashboard / UI                         | Optional non-authoritative reads only if already scoped elsewhere                                              | Authoritative Incident resolve / E19 product delivery           |

### 6.12 Explicit boundaries with US294, US295, and E19

| Boundary  | US293 delivers                                            | Does **not** deliver                                                                                                                                |
| --------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US294** | Fail-closed Incident behaviour that evidence can exercise | Chaos/restart suites; release PASS language                                                                                                         |
| **US295** | Incident residual needed for ADL-008 evidence chain       | ADL-008 ACCEPTED / accepted deferral governance                                                                                                     |
| **E19**   | Minimal provisional Recovery Incident + block             | Incident dashboard, alerts productization, resolve UX, richer Safety Incident model, operator recovery status/phase API, Kill Switch durable policy |

### 6.13 Global Freeze constraints (still binding)

1. No new bounded context.
2. No ADR change — residuals implement claim; they do not redefine Freeze ADRs.
3. Confirmed recovery shape preserved (no parallel lifecycle).
4. Canonical Order Path unchanged; SignalIntent remains the only recovery
   downstream artifact into that path.
5. ADR-017 dependency direction unchanged.
6. Sequencing: US290 → US291 → US292 → **US293** → US294 → US295 → E18.
7. Do not redesign Recovery, Runtime, RecoveryState, or Session lifecycle.

### 6.14 Persistence order on ambiguity

When ambiguity is detected, the required durable commit sequence is:

```text
Ambiguity detected
        ↓
Incident persisted
        ↓
RecoveryState updated (FAILED + incident reference)
        ↓
TradingSession transitioned to FAILED
```

The implementation **must never** leave a `FAILED` TradingSession without a
persisted Incident. Persistence order above is binding for Stage 3; partial
commits that mark Session `FAILED` before Incident durability are forbidden.

---

## Forbidden Behaviour

US293 must not:

- resolve Incident;
- retry Recovery;
- restart Runtime;
- clear Incident;
- modify RecoveryState ownership;
- bypass Recovery Pipeline;
- implement any E19 functionality.

---

## 7. Functional Requirements

Behaviour only. No implementation prescription.

### FR-1 — Durable Incident on ambiguity/corruption

When recovery detects an approved ambiguity/corruption/unrecoverable class,
Trading Session must create a durable Recovery Incident (not log-only).

### FR-2 — Fail closed / blocked execution

While an Incident-bearing recovery failure is committed for a Session, that
Session must not resume trading execution, emit SignalIntent, or admit new
strategy evaluation.

### FR-3 — Correlate with RecoveryState

Incident creation must set RecoveryState `incidentId` and advance/commit
`phase = FAILED` via legal §4.5 transition (US292 machine).

### FR-4 — Session lifecycle consistency

Incident-bearing failure must leave Session `status = FAILED` consistent with
E17 §4.5 dual-status table (non-executable; terminal for trading on this
Session).

### FR-5 — No silent skip / silent heal

Ambiguous or corrupt state must not be treated as success (`RECONCILED` /
`READY` / resumed) and must not be auto-repaired by reconstructive writes in
this Story.

### FR-6 — STOPPING ambiguity policy

When `resumeIntent = STOPPED` but drain/checkpoint evidence is incomplete or
contradictory, create Incident + `FAILED` — do **not** auto-complete to
`STOPPED` (P0-2).

### FR-7 — Idempotent / re-entry safe block

Crash re-entry after Incident-bearing failure must preserve fail-closed
authority: open Incident + `FAILED` must continue to block unsafe resume;
re-discovery must not clear Incident as a side effect.

### FR-8 — Provisional model documentation

The minimal Recovery Incident model must be documented as provisional pending
E19 Safety Incident productization (ADL-013 intent), without inventing E19 UX.

### FR-9 — No ownership transfer

Incident creation/persistence remains Trading Session responsibility. Job
queue, Dashboard, Runtime, and foreign modules must not become Incident
owners.

### FR-10 — Pipeline compatibility without redesign

US293 consumes existing stage failure outcomes and §4.5/`FAILED` transitions.
It does not replace US243 decide-gate vocabulary, US292 phase machine, or
US249 completion contracts for non-Incident paths.

### FR-11 — Hard-stop successors

US293 must not implement chaos evidence suites (US294), ADL-008 closure
(US295), or E19 operator Incident / recovery status productization.

### FR-12 — Secrets hygiene

Incident payloads must not store secrets.

---

## 8. Non-Functional Requirements

### NFR-1 — Crash durability

Incident records and RecoveryState `incidentId` correlation must survive
process death and remain loadable on next boot for the same Session identity.

### NFR-2 — Authority hierarchy

Durable Incident + RecoveryState outrank logs and in-memory caches for
fail-closed authority (ADR-018 #22; E17 §8.3).

### NFR-3 — Auditable create

Incident creation and correlated Session/`FAILED` phase commit must leave
reviewable durable evidence consistent with Session recovery Outbox /
lifecycle audit practice (ADR-013 / E17 R20) — without redesigning event
semantics.

### NFR-4 — At-least-once safe create

Duplicate delivery / re-entry must not weaken block semantics or invent
resume authority (ADR-013 at-least-once with idempotent effects).

### NFR-5 — Workspace / Session isolation

Incidents are workspace-scoped and Session-correlated; must not leak across
workspaces (ADR-018 #54–55).

### NFR-6 — Scope-bounded change envelope

Implementation remains within Stage 2 module envelope; prefer Trading Session
(+ existing event-processing substrate usage) without foreign ownership
transfer.

### NFR-7 — Provisional supersession readiness

Minimal field set and correlation must be sufficient for E19 to migrate or
wrap without changing fail-closed create + block semantics.

---

## 9. Acceptance Criteria

Every AC is testable. Architecture citations are normative.

### AC-1 — Durable Incident created on ambiguity

**Given** a recovery candidate in Session `RECOVERING` with RecoveryState open  
**When** an approved ambiguity/corruption class is detected (e.g. reconcile
mismatch / `RECONCILIATION_FAILED`, checkpoint corruption, ambiguous
Intent/checkpoint pair)  
**Then** a durable Recovery Incident exists (loadable after process restart),
not merely a log line  
**Authority:** ADR-014 Incident rule; E17 O8 / R18 / §8.3; Stage 2 US293

### AC-2 — Fail closed: no resume / no SignalIntent

**Given** an Incident-bearing recovery failure has been committed for a Session  
**When** resume, evaluation admission, or SignalIntent emission would otherwise
occur  
**Then** those actions are blocked for that Session  
**Authority:** ADR-018 #23–24; E17 R9 / R18; Stage 2 §3.8

### AC-3 — RecoveryState correlation

**Given** AC-1 create path  
**When** failure is committed  
**Then** RecoveryState has `phase = FAILED` and non-null `incidentId`
referencing the durable Incident  
**Authority:** E17 §4.5 / P0-1; US292 correlation slot; Stage 2 US293 deps

### AC-4 — Session status `FAILED`

**Given** AC-1 create path  
**When** failure is committed  
**Then** Session `status = FAILED` and remains non-executable for trading on
that Session identity  
**Authority:** E17 §4.5 dual-status table; ADR-014 terminal `FAILED`

### AC-5 — No silent success on corrupt/ambiguous state

**Given** real views or durable evidence that are ambiguous or corrupt under
E17 §7 / US243 failure rules  
**When** recovery decides  
**Then** outcome is not silent `RECONCILED` / `READY` / resumed trading; Incident

- block path applies  
  **Authority:** TR-N2/TR-N3 intent; US291 trust; E17 O8; Stage 1 R4

### AC-6 — STOPPING ambiguity does not auto-STOP

**Given** RecoveryState with `resumeIntent = STOPPED` and incomplete or
contradictory drain/checkpoint evidence  
**When** recovery evaluates that path  
**Then** Incident is created, Session/`phase` fail closed (`FAILED`), and the
system does **not** auto-complete to `STOPPED`  
**Authority:** E17 §4.6 P0-2 ambiguity rule

### AC-7 — Re-entry preserves block

**Given** a Session already failed with durable Incident + `phase = FAILED`  
**When** process restarts and discovery/recovery re-enters  
**Then** unsafe resume remains blocked; Incident evidence remains durable;
re-entry does not clear Incident as a side effect to authorize trading  
**Authority:** E17 §4.4 / §7.8 idempotency; R18; ADR-018 #22

### AC-8 — Provisional model / E19 boundary

**Given** US293 delivery  
**When** scope review is performed  
**Then** the Incident model is documented as provisional pending E19; no
Incident dashboard / resolve UX / operator recovery status API is claimed as
delivered by US293  
**Authority:** Stage 2 §3.8 / §5; ADL-013 draft; TD-036 E19 class

### AC-9 — Ownership / Freeze preserved

**Given** US293 is delivered  
**When** architecture/boundary review is performed  
**Then** Trading Session remains minimal Incident owner; no RecoveryCoordinator
/ Incident BC; no Job-queue lifecycle; Canonical Order Path unchanged;
ADR-012…ADR-019 unchanged by this Story  
**Authority:** Stage 2 §3 / §8.2; E17 §5; ADR-017; ADR-018 #60

### AC-10 — Hard-stop: successors not absorbed

**Given** US293 change set and Story DoD  
**When** scope review is performed  
**Then** chaos/restart evidence suites (US294), ADL-008 closure (US295), and
E19 Incident/ops productization are absent from this Story’s delivery claim  
**Authority:** Stage 1 §5; Stage 2 §4–§5; TD-036 residual table

### AC-11 — No secrets in Incident payloads

**Given** an Incident is persisted  
**When** payload/fields are inspected  
**Then** no secrets (credentials, provider secrets) are stored  
**Authority:** ADR-018 #59; E17 US249 AC #6 intent

---

## 10. Technical Notes

Planning notes for Stage 3. These cite existing authority; they do **not**
approve schema DDL, class designs, or APIs.

1. **Authority stack for this Story**  
   Stage 2 PROCEED constraints → this specification → E17 R18 / §7 / §8.3 /
   P0-1 Incident rule → ADR-014 / ADR-013 / ADR-018. Do not invent a parallel
   Safety Incident product model.

2. **US249 and US293 (implementation responsibility)**  
   E17 Spec originally named Incident under **US249**. That naming records
   architectural intent; it does **not** mean US249 is replaced. US249 remains
   authority for the completion / Session-exit slice already delivered. RC-18
   Stage 1/2 reassigns **implementation responsibility** for the still-open
   Incident residual to **US293**, preserving E17 fail-closed intent. Operator
   status API remains **E19**.

3. **US292 `incidentId` slot**  
   US292 may already persist a nullable `incidentId` column/slot. US293 is
   the Story that creates the referenced durable Incident and binds fail-closed
   product semantics. Prefer correlating to that slot over inventing a second
   correlation mechanism.

4. **Storage shape (non-blocking open question)**  
   E17 Open Architectural Question #1 allows dedicated Recovery Incident table
   **or** thin durable row referenced by RecoveryState. Fail-closed semantics
   are fixed either way. Stage 3 chooses one additive shape under Trading
   Session; this Story Spec does not mandate DDL.

5. **Ambiguity classes**  
   Do not invent new detector vocabulary beyond E17 §4.5 / §7 and existing
   stage outcomes. Map stage failures → Incident create + `FAILED`.

6. **“Remain RECOVERING or FAILED” softness**  
   E17 §7.7 historically allowed “Remain `RECOVERING` or transition `FAILED`”
   for checkpoint corruption. Normative dual-status table (§4.5) and US292
   make **`phase = FAILED` + Session `FAILED` + Incident** the binding
   fail-closed commit for Incident-bearing corruption/ambiguity. US293 adopts
   that binding interpretation; temporary hold in `RECOVERING` during detection
   is allowed **before** commit, but durable authority after commit is
   `FAILED` + Incident.

7. **Resolution**  
   No resolve API in US293. E19 owns productized resolution/migration. Terminal
   `FAILED` Session is not resurrected by clearing Incident in this residual.

8. **ADL-013 pointer**  
   ADL-013 draft still cites US249 historically. Governance sync (US295 /
   docs) should retarget implementation pointer to US293 without treating ADL
   as an ADR override. US293 itself does not close ADL-008.

9. **Alignment with US291**  
   Incident create on reconcile failure depends on trustworthy real port
   outcomes. Stub false-green paths must remain retired on production binding.

10. **No HOW prescription**  
    Exact table DDL, ORM mapping, repository names, and internal service
    decomposition are Stage 3 planning/coding concerns under Freeze — provided
    they realize durable create, correlation, and fail-closed ACs.

---

## 11. Testing Requirements

What must be verified for US293. No test implementation in this document.
Chaos/restart **release evidence suites** remain US294; US293 still requires
focused tests sufficient for its ACs.

1. **Incident persistence** — create/load Incident across process boundary
   (or equivalent durable store restart) (AC-1, AC-11).
2. **Fail-closed matrix** — for representative ambiguity/corruption classes
   (reconcile mismatch, checkpoint corruption, ambiguous Intent/checkpoint,
   STOPPING contradiction), verify Incident + block (AC-1, AC-2, AC-5, AC-6).
3. **Correlation** — RecoveryState `incidentId` + `phase = FAILED` (AC-3).
4. **Session terminality** — Session `status = FAILED`; no SignalIntent /
   evaluation (AC-2, AC-4).
5. **Re-entry** — restart after Incident-bearing failure preserves block and
   durable evidence (AC-7).
6. **Negative happy path** — successful `RECONCILED` → `READY` path does **not**
   spuriously create Incident.
7. **Boundary / ownership** — Trading Session remains owner; no
   RecoveryCoordinator / Incident BC; no Job-queue Incident authority (AC-9).
8. **Scope discipline review** — confirm US294 / US295 / E19 not absorbed
   (AC-8, AC-10).
9. **Regression** — existing US240–US249 stage contracts and US290–US292
   behaviours remain green; quality gates (format, lint, typecheck, build,
   tests) pass for the implementing change set.

---

## 12. Definition of Done

Story-level DoD only (not residual workstream exit).

- [x] This Story Specification accepted as implementation authority for US293
      (Tech Lead / Architecture owner approval)
- [x] Stage 3 implementation planning cites this document + Stage 2 PROCEED
      constraints + E17 R18 / §7 / §8.3 / P0-1 Incident rule + ADR-014 /
      ADR-013 / ADR-018
- [x] AC-1…AC-11 satisfied with reviewable evidence
- [x] TR-N3 closed for the **Incident productization** portion (RecoveryState
      durability remains US292; operator API remains E19)
- [x] TD-036 residual row “Durable Incident on ambiguity / corruption” updated
      when implementation evidence lands
- [x] Architecture Freeze intact (ADR-012…ADR-019 unchanged by this Story)
- [x] No new bounded context / RecoveryCoordinator / Incident BC introduced
- [x] Dual-status rule preserved; Incident ↔ Session ↔ RecoveryState ↔
      RecoveryPhase relationships explicit in implementation evidence
- [x] Canonical Order Path and SignalIntent recovery boundary unchanged
- [x] Scope not expanded into US294–US295 / E19 / future backlog items
- [x] Docs sync for this Story: CHANGELOG / project status / roadmap /
      architecture snapshot / module maturity / technical debt / story-id
      allocation as required by residual DoD practice
- [x] Quality gates green for the change set that implements this Story
      (format, lint, typecheck, build, tests) — verified at implementation time

**Not required for US293 DoD alone:** chaos/restart release evidence (US294);
ADL-008 ACCEPTED (US295); E19 Incident dashboard / resolve UX / recovery
status API; full production restart-safety PASS language; redesign of
RecoveryState or Session lifecycle.

---

## References

Ordered by authority. This specification consolidates existing decisions; it
does not invent architecture.

| #   | Document                            | Path                                                                                                             |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | CANONICAL                           | [`../../CANONICAL.md`](../../CANONICAL.md)                                                                       |
| 2   | ADR Index                           | [`../../adr/README.md`](../../adr/README.md)                                                                     |
| 3   | ADR-012 Execution Architecture      | [`../../adr/ADR-012-execution-architecture.md`](../../adr/ADR-012-execution-architecture.md)                     |
| 4   | ADR-013 Event Processing Model      | [`../../adr/ADR-013-event-processing-model.md`](../../adr/ADR-013-event-processing-model.md)                     |
| 5   | ADR-014 Runtime Lifecycle           | [`../../adr/ADR-014-runtime-lifecycle.md`](../../adr/ADR-014-runtime-lifecycle.md)                               |
| 6   | ADR-018 Architectural Invariants    | [`../../adr/ADR-018-architectural-invariants.md`](../../adr/ADR-018-architectural-invariants.md)                 |
| 7   | Architecture Decision Log (ADL-013) | [`../../Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                                                 |
| 8   | RC-18 Release Planning              | [`../rc-18-release-planning.md`](../rc-18-release-planning.md)                                                   |
| 9   | RC-18 TD036 Epic Planning (Stage 1) | [`../rc-18-td036-epic-planning.md`](../rc-18-td036-epic-planning.md)                                             |
| 10  | RC-18 Stage 2 Architecture Review   | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)                   |
| 11  | E17 Runtime Recovery Specification  | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)               |
| 12  | US290 Story Specification           | [`./us290-force-confirm-recovering-on-discovery.md`](./us290-force-confirm-recovering-on-discovery.md)           |
| 13  | US291 Story Specification           | [`./us291-real-recovery-reconciliation-port-adapters.md`](./us291-real-recovery-reconciliation-port-adapters.md) |
| 14  | US292 Story Specification           | [`./us292-durable-recovery-state-phase-machine.md`](./us292-durable-recovery-state-phase-machine.md)             |
| 15  | US249 Recovery Completion           | [`../epics/e17-us249-recovery-completion.md`](../epics/e17-us249-recovery-completion.md)                         |
| 16  | Technical Debt (TD-036 residuals)   | [`../technical-debt.md`](../technical-debt.md)                                                                   |
| 17  | RC-17 Retrospective                 | [`../rc-17-retrospective.md`](../rc-17-retrospective.md)                                                         |
| 18  | E17 Stage 4 Technical Review        | [`../e17-stage-4-technical-review.md`](../e17-stage-4-technical-review.md)                                       |
| 19  | Story ID Allocation                 | [`../story-id-allocation.md`](../story-id-allocation.md)                                                         |

---

## Document lifecycle

```text
Implemented
        ↓
Stage 3 implementation COMPLETE
        ↓
SIG-001 / Mid-Release Health Review
        ↓
DoD COMPLETE → next residual US294
```

---

## Sign-off

| Role                        | Name / Status                 | Date       |
| --------------------------- | ----------------------------- | ---------- |
| Story Specification (docs)  | Auto                          | 2026-08-01 |
| Tech Lead review            | **APPROVED**                  | 2026-08-01 |
| Stage 3 implementation      | Complete                      | 2026-08-01 |
| SIG-001                     | **PASS WITH RESIDUALS**       | 2026-08-01 |
| Stage 2 Architecture Review | PROCEED (binding constraints) | 2026-07-30 |
| Engineering owner           | _(assign)_                    |            |
| Architecture owner          | _(assign)_                    |            |

**Authority statement:** This document is the implementation authority for
US293. Stage 3 coding realized the WHAT defined here under Architecture Freeze
and Stage 2 PROCEED constraints.

**Next step:** US294 chaos/restart + fail-safe evidence (do not claim
production restart-safety PASS from US293 alone).
before US294.
