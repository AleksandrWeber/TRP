# US294 — Chaos / Restart Evidence

**Story ID:** US294  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R5)  
**Date:** 2026-08-01  
**Status:** Implemented — Stage 3 evidence complete  
**Tech Lead review:** **APPROVED WITH MINOR CORRECTIONS** (2026-08-01); corrections applied  
**Evidence Package:** [rc-18-us294-chaos-restart-evidence.md](../rc-18-us294-chaos-restart-evidence.md)

**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — Chaos/restart + fail-safe evidence suites  
**Closes:** E17 Stage 4 **TR-N4**; original US247 fail-safe suite evidence ACs;
original US248 chaos/restart evidence ACs (evidence package portion)  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Predecessor Stories:** [US290](./us290-force-confirm-recovering-on-discovery.md),
[US291](./us291-real-recovery-reconciliation-port-adapters.md),
[US292](./us292-durable-recovery-state-phase-machine.md),
[US293](./us293-durable-incident-on-recovery-ambiguity.md)  
**Integration predecessors:** [RIV-001](../rc-18-riv-001-recovery-integration-validation.md),
[SIG-001](../rc-18-sig-001-safety-integration-validation.md),
[Mid-Release Health Review](../rc-18-mid-release-health-review.md)  
**Does not introduce:** production feature redesign, Recovery/Runtime/Incident/
RecoveryState redesign, new Epic, new bounded context, or ADR change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-012 Execution Architecture](../../adr/ADR-012-execution-architecture.md)
- [ADR-013 Event Processing Model](../../adr/ADR-013-event-processing-model.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [ADR-018 Architectural Invariants](../../adr/ADR-018-architectural-invariants.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md) — ADL-008 DEFERRED
- [RC-18 Release Planning](../rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](../rc-18-td036-epic-planning.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md)
  — O1–O10, §4.4 idempotency, §7 failure scenarios, original US247/US248 ACs,
  §12 Exit Criteria #5–#9
- [Technical Debt](../technical-debt.md) — TD-036 residual ownership
- [RC-17 Retrospective](../rc-17-retrospective.md)
- [E17 Stage 4 Technical Review](../e17-stage-4-technical-review.md)
- [Residual Register](../rc-18-residual-register.md)
- [Story ID Allocation](../story-id-allocation.md)

---

## 1. Objective

Attach a **repeatable chaos / restart / fail-safe evidence package** that
proves the Session-owned recovery path (US290–US293 + E17 Stage 3 pipeline)
survives unexpected process termination, crash re-entry, duplicate
Intent/Order/Fill-class scenarios, and fail-closed ambiguity — without
redesigning Recovery, Runtime, Incident, or RecoveryState.

### Business value

Operators and release owners cannot treat “restart the API” as safe for
continuous paper sessions while crash and restart behaviour is proven only by
happy-path unit/integration tests. US294 closes **TR-N4 / R5** so the
production recovery claim has **attached evidence**, enabling credible
ADL-008 closure (US295) and release-level restart-safety language.

### Architectural purpose

Close the **evidence residual** under Architecture Freeze: exercise already
approved ADR-014 / E17 recovery behaviour under failure injection. US294 is
**evidence-only**. It does not invent architecture, expand product epic scope,
absorb unfinished R1–R4 work, close ADL-008 (US295), or deliver E19 operator /
Kill Switch productization.

US294 alone does **not** authorize final release PASS language without US295
governance sync (RC-18 exit; Stage 1 R5→R6 rule).

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

Stage 4 was **PASS WITH RECOMMENDATIONS**. Original E17 titles for **US247**
(fail-safe suite) and **US248** (chaos/restart evidence) were locally scoped
to deterministic evaluation / SignalIntent slices; their **evidence ACs**
remained residual (**TR-N4**).

RC-18 mandatory residuals US290–US293 closed the functional substrate:

| Story | Residual closed                                   |
| ----- | ------------------------------------------------- |
| US290 | Discovery → Session `RECOVERING` precondition     |
| US291 | Real reconcile ports (no stub false-green)        |
| US292 | Durable RecoveryState + phase machine             |
| US293 | Durable Incident + fail-closed block on ambiguity |

RIV-001 (**COHERENT**) and SIG-001 (**PASS WITH RESIDUALS**) confirm
integration coherence. Mid-release health accepts the foundation and forbids
production restart-safety PASS until **US294** evidence (+ **US295** ADL).

### Why TR-N4 / R5 exists

E17 Stage 4 recorded:

> **TR-N4** — Chaos/restart + fail-safe suites (original US247/US248 titles)
> residual.

Stage 1 R5 and Stage 2 US294 validate this as an **evidence-only** Story:
attach suites proving crash, duplicate Intent/Order/Fill-class scenarios, and
fail-safe behaviour; do not redefine architecture.

### Normative sources (do not redefine)

- ADR-014 Restart recovery algorithm + Incident-on-ambiguity rule
- ADR-013 at-least-once delivery with idempotent business effects
- ADR-012 single Execution Engine entry; idempotent submit; no recovery fork
- ADR-018 #2, #9, #11–18, #20–25, #35, #43–44, #52, enforcement (restart /
  failure-injection / duplicate tests required)
- E17 Objectives **O1–O10**; §4.4 idempotency; **§7** failure scenarios;
  original **US247** / **US248** evidence ACs; Exit Criteria #5–#9
- Stage 2 §4 US294 / §8.2 constraints 8–9 (evidence before PASS language)
- RIV-001 / SIG-001 residuals owned by US294 (cold-start chaos; process-crash
  fail-closed harness; mid-phase fencing restore evidence)

### Predecessor alignment

| Predecessor | What US294 consumes (does not redesign)                       |
| ----------- | ------------------------------------------------------------- |
| US290       | Production discovery → `RECOVERING` open                      |
| US291       | Trustworthy reconcile outcomes                                |
| US292       | Durable phase/progress; `resumeIntent` / re-entry rules       |
| US293       | Fail-closed Incident path; restart-blocked after `FAILED`     |
| RIV-001     | Pipeline coherence baseline; known fencing / chaos suite gaps |
| SIG-001     | Fail-closed order baseline; dedicated crash harness residual  |

---

## 3. Architecture Decision Summary

This section records the Architecture Decision Check for US294. It consolidates
**already approved** decisions; it does not open a new ADR.

### Why is Chaos Evidence required?

ADR-014 defines an explicit restart recovery algorithm. ADR-018 Enforcement
requires restart/reconciliation, duplicate/reordered-event, and
failure-injection tests — local unit pass is explicitly insufficient for
invariant compliance. E17 O1 / O7 / O8 / O9 and Exit Criteria #5–#9 make
crash/restart and fail-safe behaviour **release-measurable**.

Without US294, RC-18 cannot claim operators may treat API restart as safe:
functional residuals prove _capability_; chaos evidence proves _survival under
termination and duplication_.

### Which architectural guarantees are still unproven after US293?

After US290–US293 + RIV/SIG:

| Proven (substrate)                                      | Still unproven at release-evidence grade                        |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Discovery → `RECOVERING`                                | Cold-start / SIGKILL-class process crash end-to-end             |
| Real reconcile (no stub false-green)                    | Mid-path crash → zero duplicate Intent/Order/Fill/Ledger (O1)   |
| Durable RecoveryState + legal phases                    | Crash mid-`RECOVERING` re-entry idempotency under process death |
| Fail-closed Incident → Session `FAILED` → restart block | Dedicated process-crash fail-closed chaos harness               |
| Dual-status / ownership boundaries                      | Mid-phase fencing restore after re-entry (RIV residual)         |
| Boundary tests (Stage 3 / US248 portion)                | Attached chaos evidence package for release claim               |
| —                                                       | Deterministic replay remains green after recovery chaos paths   |
| —                                                       | Duplicate delivery / staleness fail-safe under recovery resume  |

US293 proves fail-closed _semantics_ under controlled ambiguity injection.
US294 must prove those semantics (and happy-path restart) under **process
termination**, **re-entry**, and **duplicate-effect** pressure.

### Why are unit/integration tests insufficient?

1. **ADR-018 Enforcement** — invariants require restart, failure-injection,
   and duplicate suites; unit-local green is non-compliant if invariants fail
   under crash.
2. **False-green risk** — Stage 3 / early residual tests can mock phase
   progress or avoid process boundaries (RIV residual #3).
3. **At-least-once reality** — ADR-013 duplicates appear at process/delivery
   boundaries, not in single-process happy paths.
4. **Authority hierarchy** — in-memory caches die on crash; only durable
   Session / RecoveryState / Incident / Outbox-Inbox facts may authorize
   resume (ADR-018 #22).
5. **Release claim rule** — RC-18 exit and Stage 2 AR-03 forbid PASS language
   without attached chaos/restart evidence.

### Which invariants must survive unexpected process termination?

| ID / rule                      | Must survive process death / re-entry                                      |
| ------------------------------ | -------------------------------------------------------------------------- |
| ADR-014 Session identity       | Same Session ID retained; no auto-replacement Session                      |
| ADR-014 restart steps 1–7      | Discover → `RECOVERING` → lease → load → reconcile → continuity → resume   |
| ADR-018 #20–21                 | At most one fenced owner; stale lease cannot commit                        |
| ADR-018 #22                    | In-memory state non-authoritative after restart                            |
| ADR-018 #23–24                 | Reconcile-before-resume; no new execution while `RECOVERING` / `FAILED`    |
| ADR-018 #9, #35 / E17 O1       | No duplicate Orders/Fills/Ledger effects from crash mid-path               |
| ADR-018 #2 / Intent uniqueness | No second SignalIntent for same evaluated semantic event                   |
| ADR-013 Inbox / at-least-once  | Duplicate delivery → idempotent effects                                    |
| E17 §4.4 / US292               | Crash re-entry restarts algorithm; `lastAttemptedPhase` does not skip work |
| E17 P0-2 / US290–US292         | `resumeIntent` (esp. `STOPPED`) survives restart                           |
| E17 R18 / US293                | Open Incident + `FAILED` continues to block unsafe resume                  |
| E17 O10 / ADR-012              | No recovery-only Canonical Order Path fork                                 |

### Which failures belong to US294 and not US293?

| Belongs to **US293** (already closed)                        | Belongs to **US294** (this Story)                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Create durable Incident on ambiguity/corruption              | Crash the process during/after Incident path and prove block survives       |
| Fail-closed Session/`FAILED` + correlation                   | Cold-start / SIGKILL / mid-`RECOVERING` chaos harnesses                     |
| Controlled ambiguity injection in integration tests          | Duplicate Intent/Order/Fill-class fail-safe evidence under restart          |
| Persist-order semantics (Incident → RecoveryState → Session) | Evidence that re-entry does not clear Incident / invent resume              |
| Provisional Incident model (not E19 UX)                      | Attached release evidence package; TR-N4 closure                            |
| —                                                            | Mid-phase fencing restore evidence (prove re-lease / stale fence rejection) |
| —                                                            | Deterministic replay green after recovery chaos paths                       |

US294 **must not** redesign Incident create rules, invent new ambiguity
classes, or weaken fail-closed semantics. It **exercises** US293 behaviour
under chaos.

### Which ADR / authority sections govern Chaos Evidence?

| Authority                       | Governing content                                                           |
| ------------------------------- | --------------------------------------------------------------------------- |
| **ADR-014** Restart recovery    | Full algorithm; ambiguity → Incident + block                                |
| **ADR-013**                     | At-least-once + idempotent effects; consumer progress durability            |
| **ADR-012**                     | Idempotent execution submit; single engine entry; no recovery fork          |
| **ADR-018 #2, #9, #35**         | Deduped Intents; no duplicate Orders/Fills; Fill-at-most-once accounting    |
| **ADR-018 #11–18**              | Outbox/Inbox; no silent ack; progress survives restart                      |
| **ADR-018 #20–25**              | Fence; non-authoritative memory; reconcile-before-resume; checkpoint cursor |
| **ADR-018 #43–44, #52**         | Reject unreconciled; Kill Switch durable (exercise if present); determinism |
| **ADR-018 Enforcement**         | Explicit restart / failure-injection / duplicate test requirements          |
| **E17 O1–O10 / §7 / Exit #5–9** | Measurable crash/restart/fail-safe objectives and original US247/US248 ACs  |
| **Stage 2 US294 / AR-03**       | Evidence-only; no architecture redefine; evidence before PASS language      |
| **RC-18 §8 / §9**               | Claiming restart-safety before TD-036 close is High risk / exit-blocked     |

### Architecture Decision Check verdict

**No blocking architectural ambiguity that requires a new ADR or redesign.**
US294 is authorized as evidence-only under Stage 2 PROCEED. Residual
clarifications (fencing evidence expectation; E18/E19 depth boundaries;
graceful-stop residual; Order-path chaos depth) are recorded in
§Architectural Ambiguities and resolved by binding recommendations below —
not by redesigning Recovery/Runtime/Incident/RecoveryState.

---

## 4. Scope IN

- Attach a **documented, repeatable** chaos/restart + fail-safe evidence
  package for the production recovery claim (TR-N4 / R5).
- Prove **restart scenarios** (cold start after crash; crash mid-`RECOVERING`;
  crash after successful `READY`/completion path; STOPPING/`resumeIntent =
STOPPED` survive restart).
- Prove **chaos / process-termination scenarios** (unexpected shutdown /
  SIGKILL-class process death; crash during recovery stages).
- Prove **crash evidence** for mid-path classes scoped by original US247 /
  E17 §7: mid-evaluate, mid-Intent, mid-Order, mid-Fill / accounting where
  the existing Canonical Order Path + idempotency substrate already exists
  (exercise, do not redesign).
- Prove **fail-safe / idempotency**:
  - zero duplicate Signal Intents, Orders, Fills, or Ledger entries (O1);
  - duplicate event delivery → Inbox no-op / idempotent effect where
    recovery-adjacent consumers are already in scope;
  - stale checkpoint / Risk or market evidence cannot authorize new execution;
  - crash re-entry does not skip validate/reconcile;
  - US293 fail-closed path survives process death (Incident + `FAILED` block).
- Prove **fencing restore** after mid-phase re-entry: new lease generation;
  stale fence cannot commit (ADR-018 #20–21; E17 §7.8–§7.9; RIV residual).
- Keep **boundary / dependency tests** green (original US248 AC #1 intent) as
  part of the evidence package gate — do not invent new ownership model.
- Attach evidence artifacts to residual / release documentation; file any new
  defects found as TD with owner (original US248 AC #3 intent).
- Close Residual Register rows owned by US294 (cold-start chaos; process-crash
  fail-closed harness; mid-phase fencing restore evidence).

---

## 5. Scope OUT

Hard-stop boundaries (must not be absorbed into US294):

| Out of scope                                                                                          | Owner / later Story                           |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| ADL-008 ACCEPTED or explicit accepted deferral                                                        | **US295**                                     |
| Operator recovery status / phase API                                                                  | **E19**                                       |
| Richer Safety Incident productization, resolve/ack/dashboard, alerts UX                               | **E19**                                       |
| Durable Kill Switch **policy productization** / admission-arming product gates                        | **E19**                                       |
| Full E18 Inbox coverage audit across every durable consumer; DLQ productization                       | **E18**                                       |
| Force/confirm `RECOVERING` / real ports / RecoveryState / Incident **feature** delivery               | **US290–US293** (predecessors; do not reopen) |
| Redesign of Recovery pipeline, Runtime arming/evaluation, Incident model, RecoveryState phase machine | Forbidden redesign                            |
| Redesign of Session lifecycle / dual-status rule                                                      | Forbidden redesign                            |
| Order proposal from recovery SignalIntent                                                             | Future backlog                                |
| Broader in-process stage-cache durability beyond RecoveryState                                        | Future backlog                                |
| New RecoveryCoordinator / Recovery / Chaos bounded context                                            | Forbidden                                     |
| Canonical Order Path, Orders, Risk, Execution, Accounting redesign                                    | Freeze / Stage 2                              |
| Real-capital / live broker adapters                                                                   | RC-18 out of scope                            |
| Exact-once event redesign; Kafka / microservices                                                      | Freeze / RC-18 out of scope                   |
| Playwright browser E2E (TD-043)                                                                       | Deferred unless separately approved           |

### Non-goals

| Non-goal                                                         | Rationale                          |
| ---------------------------------------------------------------- | ---------------------------------- |
| Treat unit-only green as chaos evidence                          | ADR-018 Enforcement; TR-N4         |
| Redesign Recovery / Runtime / Incident / RecoveryState to “pass” | Evidence-only Story; Stage 2       |
| Claim full production restart-safety PASS from US294 alone       | Requires US295 ADL sync per RC-18  |
| Absorb unfinished R1–R4 into “tests”                             | Stage 2 US294 architectural risk   |
| Invent new ambiguity classes beyond E17 §7 / US293               | Freeze — exercise approved classes |
| Productize Kill Switch or operator Incident UX under chaos cover | E19                                |
| Close ADL-008 inside this Story                                  | US295                              |

---

## 6. Architecture Constraints

Binding for evidence planning and any narrowly scoped harness code. Summarized
from Stage 2 PROCEED, frozen ADRs, and E17 Spec — not renegotiated here.

### 6.1 Evidence-only mandate

- US294 delivers **evidence**, not architecture.
- Harness / fixture / test / documentation work is allowed.
- Production recovery behaviour changes are **forbidden** unless a chaos run
  reveals a **defect against already approved invariants** — then fix is a
  corrective under Freeze (preserve semantics; do not redesign), with TD if
  scope expands beyond residual envelope.
- If corrective work would touch more than three modules or redefine ownership,
  re-enter Architecture Review (Stage 2 §7 hard stop).

### 6.2 Do not redesign

US294 must not redesign:

- Recovery pipeline algorithms (US240–US249);
- Runtime admission / arming / evaluation model;
- Incident create / fail-closed model (US293);
- RecoveryState schema or phase machine (US292);
- Session lifecycle dual-status rule;
- Canonical Order Path.

### 6.3 Idempotency rules (binding for evidence)

1. Crash mid-sequence re-enters at discovery / `RECOVERING` for that Session
   (E17 §4.4); `lastAttemptedPhase` is diagnostic only.
2. At-least-once delivery must yield **idempotent business effects**
   (ADR-013): no duplicate SignalIntent / Order / Fill / Ledger entry for the
   same business identity.
3. Duplicate recovery re-entry must not invent resume authority over open
   Incident / Session `FAILED` (US293 FR-7).
4. Confirm-idempotent rediscovery must not rewrite `resumeIntent`
   contradictorily (US290 / US292).
5. Stale lease owner must not commit after new fence acquisition
   (ADR-018 #20–21).
6. No silent heal reconstructive writes during chaos recovery (E17 §7.6).

### 6.4 Required invariants under chaos

See Architecture Decision Summary invariant table. Evidence MUST demonstrate
survival of those invariants under the Chaos Test Matrix (§10).

### 6.5 Module / ownership envelope

| Module                 | Allowed for US294                                          | Forbidden                                        |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `trading-session/`     | Evidence harness hooks; fixtures; corrective bugfixes only | Redesign of RecoveryState / Incident / lifecycle |
| Test / evidence docs   | Chaos suites; evidence package; residual register updates  | Claiming E19/US295 delivery                      |
| Foreign modules        | Exercise existing idempotency / reconcile ports            | Ownership transfer; semantic redesign            |
| `live-trading-engine/` | **None** for paper recovery path                           | Parallel recovery evidence path                  |
| Dashboard / UI         | Non-authoritative observation only                         | Authoritative recovery / Incident UX             |

### 6.6 Explicit boundaries with US295 and E19

| Boundary  | US294 delivers                                                        | Does **not** deliver                                                                                              |
| --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **US295** | Evidence package needed for credible ADL-008 ACCEPTED decision        | ADL-008 ACCEPTED / accepted deferral governance write                                                             |
| **E19**   | May _exercise_ existing Kill Switch durable state if present          | Kill Switch durable **policy** productization; operator Incident resolve/ack/dashboard; recovery status/phase API |
| **E18**   | Recovery-adjacent duplicate-delivery proofs needed for O1 / US247 ACs | Full consumer Inbox coverage audit / DLQ productization for all consumers                                         |

### 6.7 Global Freeze constraints (still binding)

1. No new bounded context.
2. No ADR change — evidence implements claim proof; does not redefine Freeze.
3. Confirmed recovery shape preserved.
4. Canonical Order Path unchanged; SignalIntent remains the only recovery
   downstream artifact into that path.
5. ADR-017 dependency direction unchanged.
6. Sequencing: US290 → US291 → US292 → US293 → **US294** → US295 → E18.
7. Do not redesign Recovery, Runtime, Incident, or RecoveryState.

### 6.8 Production claim language rule

| Language                                               | Allowed after US294 alone? |
| ------------------------------------------------------ | -------------------------- |
| TR-N4 / R5 closed; chaos evidence attached             | **Yes** (if ACs pass)      |
| Operators may treat API restart as safe (release PASS) | **No** — requires US295    |
| ADL-008 ACCEPTED                                       | **No** — US295             |

---

## 7. Functional Requirements

Behaviour / evidence outcomes only. No implementation prescription.

### FR-1 — Evidence package exists

A documented, repeatable chaos/restart + fail-safe evidence package must be
attached to residual/release documentation and runnable via project quality
gates / dedicated evidence commands as Stage 3 planning defines.

### FR-2 — Unexpected process termination

SIGKILL-class / hard process death must leave last committed durable state as
authority; subsequent boot must run ADR-014 restart recovery for eligible
Sessions (E17 §7.1).

### FR-3 — Crash mid-`RECOVERING`

Crash during recovery must be re-entry safe: rediscover, re-lease (new
generation), restart algorithm from step 1; never skip validate/reconcile
(E17 §7.8 / §4.4).

### FR-4 — No duplicate business effects

Crash mid-evaluate / mid-Intent / mid-Order / mid-Fill fixtures must produce
**zero** duplicate Signal Intents, Orders, Fills, or Ledger entries (O1;
original US247 AC #1).

### FR-5 — Duplicate delivery fail-safe

Duplicate event delivery on recovery-adjacent durable consumers must no-op /
apply at most once (original US247 AC #2; ADR-013).

### FR-6 — Staleness fail-safe

Stale Risk/market checkpoint evidence must not authorize new execution
(original US247 AC #3; ADR-018 #43).

### FR-7 — Determinism after recovery chaos

Recorded-stream deterministic replay remains green after exercised recovery
chaos paths (O4; original US247 AC #4; Exit Criteria #7).

### FR-8 — Fail-closed survives process death

After US293 Incident-bearing failure, process restart must keep unsafe resume
blocked; Incident evidence remains durable; re-entry must not clear Incident
to authorize trading (SIG-001 residual harness).

### FR-9 — `resumeIntent` / STOPPING survive restart

`resumeIntent = STOPPED` and non-STOPPING intents established at open must
survive crash and re-entry (P0-2; US290/US292).

### FR-10 — Fencing restore evidence

Mid-phase re-entry must re-acquire lease; stale fence commits must fail;
evidence must document fencing restore behaviour (RIV residual; ADR-018
#20–21).

### FR-11 — Boundary conformance remains green

Dependency/boundary tests remain green: Runtime ↛ Execution/Accounting;
recovery orchestrator does not bypass CanonicalOrderPath (original US248 AC
#1).

### FR-12 — Residuals / defects filed

Any defect found by chaos suites is filed as TD with owner/milestone; Residual
Register US294 rows updated (original US248 AC #3 intent).

### FR-13 — Hard-stop successors

US294 must not implement ADL-008 closure (US295) or E19 operator / Kill Switch
productization.

### FR-14 — No architecture redefine

Evidence must not introduce RecoveryCoordinator, parallel lifecycle, or
recovery-only execution fork.

---

## 8. Non-Functional Requirements

### NFR-1 — Repeatability

Evidence suites must be deterministic/repeatable under CI or documented
manual-but-scripted procedure with fixed fixtures.

### NFR-2 — Process-boundary realism

At least the core crash/restart scenarios must cross a real process or
equivalent durable-store restart boundary — not solely in-memory mocks of
phase progress (addresses RIV residual).

### NFR-3 — Reviewable artifacts

Evidence package must be reviewable by Tech Lead / Release owner: scenario
matrix results, pass/fail, residual TD links, and explicit claim language
limits (§6.8).

### NFR-4 — Non-destructive authority

Chaos harnesses must not become a second lifecycle owner or production
authority path.

### NFR-5 — Secrets hygiene

Evidence fixtures and dumps must not store secrets (ADR-018 #59).

### NFR-6 — Scope-bounded change envelope

Prefer test/evidence modules; production code only for Freeze-compatible
defect fixes discovered by evidence.

### NFR-7 — Time-bounded evidence capture

Suites must complete within reasonable CI budgets; long soak is out of scope
unless separately approved.

---

## 9. Acceptance Criteria

Every AC is testable. Architecture citations are normative.

### AC-1 — Evidence package attached

**Given** US294 delivery  
**When** residual / release documentation is inspected  
**Then** a chaos/restart + fail-safe evidence package is attached and
references the Chaos Test Matrix results  
**Authority:** TR-N4; Stage 1 R5; original US248 AC #2; RC-18 exit evidence rule

### AC-2 — Unexpected shutdown / cold start

**Given** a non-terminal Session with durable recovery substrate (US290–US292)  
**When** the API process is hard-killed and cold-started  
**Then** discovery forces/confirms `RECOVERING`, lease is acquired, validate +
reconcile run before any new evaluation, and resume follows prior safe intent
(or fail-closed if ambiguous)  
**Authority:** ADR-014 Restart recovery; E17 §7.1; O2

### AC-3 — Crash mid-`RECOVERING` idempotent re-entry

**Given** recovery in progress with durable RecoveryState mid-phase  
**When** process dies and recovery re-enters  
**Then** algorithm restarts at discovery/`RECOVERING`; validate/reconcile are
not skipped due to `lastAttemptedPhase`; `resumeIntent` preserved  
**Authority:** E17 §4.4 / §7.8; US292 AC-6 / AC-7

### AC-4 — Zero duplicates (mid-path crash classes)

**Given** fixtures for crash mid-evaluate / mid-Intent / mid-Order / mid-Fill
as scoped in §10  
**When** crash + recover completes  
**Then** there are zero duplicate Signal Intents, Orders, Fills, or Ledger
entries for the same business identities  
**Authority:** E17 O1; original US247 AC #1; ADR-018 #2, #9, #35

### AC-5 — Duplicate delivery / Inbox no-op

**Given** duplicate delivery of a recovery-adjacent durable event  
**When** consumers process the duplicate  
**Then** business effects apply at most once (Inbox no-op or equivalent
idempotent handler behaviour)  
**Authority:** ADR-013; original US247 AC #2; ADR-018 #12–13

### AC-6 — Staleness cannot authorize execution

**Given** stale Risk/market checkpoint evidence relative to resume gates  
**When** recovery/resume is attempted  
**Then** new execution is not authorized by stale evidence  
**Authority:** original US247 AC #3; ADR-018 #43; E17 O8

### AC-7 — Deterministic replay remains green

**Given** recorded-stream deterministic replay fixtures  
**When** recovery chaos paths have been exercised  
**Then** replay remains green for identical semantic inputs  
**Authority:** E17 O4; ADR-018 #52; Exit Criteria #7

### AC-8 — Fail-closed chaos harness

**Given** an Incident-bearing recovery failure (US293 path)  
**When** process is crashed and restarted  
**Then** Session remains non-executable; Incident + RecoveryState `FAILED` +
`incidentId` remain durable; unsafe resume/SignalIntent remain blocked  
**Authority:** US293 AC-7; SIG-001 residual; E17 R18; ADR-014 Incident rule

### AC-9 — Fencing restore

**Given** mid-phase crash re-entry  
**When** recovery re-acquires lease  
**Then** a new fencing generation is active and stale fence commits cannot
succeed; evidence documents restore behaviour  
**Authority:** ADR-018 #20–21; E17 §7.8–§7.9; RIV-001 residual

### AC-10 — Boundary tests green

**Given** US294 evidence gate  
**When** architecture/boundary suites run  
**Then** Runtime ↛ Execution/Accounting and no CanonicalOrderPath recovery
bypass remain enforced  
**Authority:** original US248 AC #1; ADR-012; ADR-017; Stage 2

### AC-11 — Claim language discipline

**Given** US294 DoD  
**When** release/status language is reviewed  
**Then** TR-N4/R5 may be marked closed with evidence; production restart-safety
PASS and ADL-008 ACCEPTED are **not** claimed by US294 alone  
**Authority:** RC-18 §9; Stage 2 AR-03 / constraint 9; Stage 1 R5→R6

### AC-12 — Scope / Freeze preserved

**Given** US294 change set  
**When** architecture review is performed  
**Then** no Recovery/Runtime/Incident/RecoveryState redesign; no new BC; no
E19/US295 absorption; ADR-012…ADR-019 unchanged by this Story  
**Authority:** Stage 2 US294; Freeze; ADR-018 #60

### AC-13 — Residual Register / TD hygiene

**Given** chaos runs complete  
**When** Residual Register and TD are inspected  
**Then** US294-owned residual rows are updated; new defects filed with owners  
**Authority:** original US248 AC #3; Residual Register; TD-036

---

## 10. Chaos Test Matrix

This matrix is **normative**. The twelve scenarios below are **mandatory
acceptance evidence** for US294. Every row MUST be executed, recorded in the
US294 Evidence Package (§11), and result in **PASS** (or an explicit accepted
residual with owner — never a silent skip).

Expected behaviour cites existing ADR-014 / E17 / US290–US293 authority only.
US294 does **not** redesign Recovery, Runtime, Incident, or RecoveryState.

| ID   | Scenario (mandatory)                 | Inject (normative intent)                                             | Expected behaviour (existing authority)                                                                                                                 | Primary invariants / refs                          |
| ---- | ------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| M-01 | Crash after Discovery                | Kill after US240 discovery selects candidate, before/at open          | On restart: rediscover eligible Session; no evaluation admitted from discovery alone; proceed into recovery open                                        | ADR-014 step 1; E17 S1; US240; O2                  |
| M-02 | Crash after Recovery Open            | Kill after US290 force/confirm `RECOVERING` + RecoveryState open      | Session remains / reconfirms `RECOVERING`; `preRecoveryStatus` / `resumeIntent` durable; re-entry does not invent contradictory intent; no SignalIntent | US290; US292; P0-1/P0-2; ADR-018 #23–24            |
| M-03 | Crash after Lease                    | Kill after lease acquired (fencing token committed)                   | Re-entry re-acquires lease (new generation); stale fence cannot commit; algorithm continues without skipping validate/reconcile                         | US241; E17 §7.8–§7.9; ADR-018 #20–21; RIV residual |
| M-04 | Crash after Checkpoint               | Kill after checkpoint/assembly load / validation progress             | Durable checkpoint authority retained; re-entry does not skip validation/reconcile; corrupt/illegal pairs fail closed per US242/US293                   | US242; E17 §7.6–§7.7; US292 §4.4                   |
| M-05 | Crash during Reconciliation          | Kill while reconcile in progress (real ports)                         | Re-entry restarts reconcile path; no silent `RECONCILED` from partial work; mismatch/ambiguity → Incident + block (US291/US293)                         | US243; US291; US293; O8; ADR-018 #23               |
| M-06 | Crash before Resume                  | Kill after reconcile OK / continuity path, before Session exit resume | No premature evaluation or SignalIntent; must complete remaining gates or fail closed; in-memory caches non-authoritative                               | ADR-018 #22–24; US244; E17 R9                      |
| M-07 | Crash after READY                    | Kill after RecoveryState `phase = READY`, before/during completion    | Re-entry safe; no skip of required exit gates; completion or fail-closed per US249/US293; no new execution while still `RECOVERING`                     | US244; US249; US292; ADR-018 #23–24                |
| M-08 | Double Restart                       | Two successive hard process deaths during/after recovery              | Second restart remains idempotent; Session identity retained; no duplicate Intent/Order/Fill/Ledger; fencing restore each successful re-lease           | O1; O3; E17 §4.4 / §7.8; ADR-018 #9, #20–21        |
| M-09 | Duplicate Recovery Attempt           | Concurrent or back-to-back recovery open/re-entry for same Session    | Idempotent confirm; no second lifecycle authority; no duplicate recovery side effects; `resumeIntent` not silently rewritten                            | US290 FR-5/FR-10; US292 NFR-4; E17 §4.4            |
| M-10 | Lost Outbox Delivery                 | Session recovery Outbox event not delivered / redelivered             | At-least-once safe: redelivery does not duplicate business effects; no silent ack of failed durable delivery                                            | ADR-013; ADR-018 #11–13, #18; E17 R20              |
| M-11 | Database unavailable during Recovery | Durable store unavailable mid-recovery stage                          | No false-green resume; fail closed or safe retry without inventing heal writes; last committed durable state remains authority when DB returns          | ADR-018 #22–23; E17 O8; §7.1                       |
| M-12 | Process SIGKILL                      | Hard kill (SIGKILL-class) of API process                              | Last committed durable state is authority; cold start runs ADR-014 recovery for eligible Sessions; zero duplicate business effects for exercised path   | E17 §7.1; O1; O2; ADR-014 Restart recovery         |

### 10.1 Normative completion rule

1. **All M-01…M-12 are mandatory** acceptance evidence for US294 DoD.
2. Each scenario MUST produce one Evidence Package record (§11).
3. **PASS** requires expected behaviour observed and listed invariants verified.
4. **FAIL** requires residual/TD with owner; US294 DoD cannot close on open
   mandatory FAILs without Architecture/Release owner acceptance of an
   **explicit** residual (not silent).
5. Additional exploratory chaos beyond M-01…M-12 is allowed but does **not**
   replace any mandatory row.

### 10.2 Process-boundary note

M-08, M-12, and at least one mid-pipeline crash among M-02…M-07 MUST cross a
real process or equivalent durable-store restart boundary (NFR-2). M-10 may
use controlled Outbox loss/redelivery injection without full process death if
delivery semantics are otherwise equivalent and documented in the Evidence
Package.

---

## 11. US294 Evidence Package

### Purpose

The **US294 Evidence Package** is a required **implementation artifact**. It
records every executed chaos scenario from the normative Chaos Test Matrix
(§10) and becomes an **input for US295** (ADL-008 closure / governance sync).

US294 does not close ADL-008; US295 consumes this package as evidence that
R5/TR-N4 chaos/restart proof exists.

### Required record fields

Every executed chaos scenario **MUST** produce a record containing all of the
following fields:

| Field                                | Requirement                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- |
| **Scenario**                         | Matrix ID + scenario name (e.g. `M-05 Crash during Reconciliation`)         |
| **Expected behaviour**               | Normative expectation from §10 / existing ADR–E17–Story authority           |
| **Actual behaviour**                 | Observed outcome from the executed run                                      |
| **Architecture invariants verified** | Explicit list of invariants/ADR sections confirmed by this run              |
| **Evidence collected**               | Links/paths to tests, logs, dumps, commands, or fixtures supporting the run |
| **PASS / FAIL**                      | Single verdict for the scenario                                             |
| **Residuals (if any)**               | TD/Residual Register references, owner, and disposition if not clean PASS   |

### Package rules

1. One record per mandatory matrix row (M-01…M-12) at minimum.
2. Package MUST be durable and reviewable (committed doc/artifact under
   project docs or evidence path discoverable from Residual Register).
3. Exact file path/name is Stage 3 choice; contents above are binding.
4. Aggregate package summary MUST state §6.8 claim-language limits (US294 does
   not alone authorize production restart-safety PASS or ADL-008 ACCEPTED).
5. On US294 DoD, the package is handed to US295 as chronological evidence
   input — US295 remains the governance Story.

### Record template (normative shape)

```text
Scenario:                      M-XX <name>
Expected behaviour:            <from §10>
Actual behaviour:              <observed>
Architecture invariants verified:
  - <invariant / ADR / E17 ref>
Evidence collected:
  - <path or command>
PASS / FAIL:                   PASS | FAIL
Residuals (if any):            none | <TD/residual + owner>
```

---

## 12. Technical Notes

Planning notes for Stage 3 evidence work. These cite existing authority; they
do **not** approve harness frameworks, schema DDL, or API designs.

1. **Authority stack**  
   Stage 2 PROCEED → this specification → E17 O1–O10 / §7 / original
   US247–US248 evidence ACs → ADR-014 / ADR-013 / ADR-012 / ADR-018
   Enforcement. Do not invent a parallel chaos architecture.

2. **US247 / US248 implementation responsibility**  
   Local Stage 3 slices under those IDs remain valid for evaluation /
   SignalIntent work. RC-18 reassigns **evidence AC responsibility** to
   **US294**. US295 owns ADL-008 (historically listed under US248 AC #4) and
   consumes the US294 Evidence Package (§11).

3. **Evidence artifact**  
   The binding evidence artifact is the **US294 Evidence Package** (§11),
   covering all mandatory Chaos Test Matrix rows (§10 M-01…M-12). Residual
   Register must link to it.

4. **RIV fencing residual interpretation**  
   Clearing in-memory fencing until re-lease is **compatible** with E17 §7.8
   **only if** M-03 / M-08 evidence proves re-lease restores fence and stale
   commits fail. A window where stale owner can commit durable work is a
   **defect**, not acceptable residual.

5. **E18 boundary**  
   M-10 (Lost Outbox Delivery) covers recovery-adjacent Outbox/at-least-once
   proof needed for the recovery claim. Exhaustive Inbox coverage of every
   durable consumer remains **E18**.

6. **E19 boundary**  
   Kill Switch durable **policy** productization and operator Incident UX
   remain **E19**. Not required as a separate mandatory matrix row by Tech
   Lead corrections; do not absorb E19 into US294.

7. **Mandatory matrix supersedes prior exploratory lists**  
   Tech Lead review made §10 M-01…M-12 the mandatory acceptance evidence
   minimum. Additional exploratory scenarios remain optional (§10.1 rule 5).

8. **Incident reasonClass coverage**  
   SIG-001 unused reasonClasses remain opportunistic/non-blocker unless a
   mandatory matrix run surfaces a defect.

9. **No HOW prescription**  
   Choice of chaos harness (process fork, Nest app teardown, testcontainers,
   etc.) is Stage 3 engineering — provided NFR-2 / §10.2 process-boundary
   realism and Evidence Package fields are met.

---

## 13. Testing Requirements

What must be verified for US294. This Story _is_ primarily testing/evidence;
requirements below define the verification envelope.

1. **Mandatory matrix execution** — all §10 rows M-01…M-12 executed with
   Evidence Package records (§11).
2. **Process-boundary crashes** — per §10.2 (incl. M-08, M-12, and at least
   one of M-02…M-07) (NFR-2).
3. **Duplicate accounting** — assert counts/identities for Intent/Order/Fill/
   Ledger where scenarios exercise those paths (AC-4, AC-5; esp. M-08, M-09,
   M-10, M-12).
4. **Fail-closed persistence** — where ambiguity/DB failure paths apply
   (M-05, M-11): Incident + RecoveryState + Session status loadable after
   restart when fail-closed commits (AC-8).
5. **Fence assertions** — M-03 / M-08: stale token rejected after re-lease
   (AC-9).
6. **Boundary suite** — existing architecture/boundary tests green (AC-10).
7. **Determinism** — recorded-stream replay green post-chaos (AC-7).
8. **Regression** — US290–US293 / RIV/SIG critical paths remain green; quality
   gates (format, lint, typecheck, build, tests) pass for the change set.
9. **Scope discipline review** — US295 / E19 / redesign not absorbed (AC-11,
   AC-12).
10. **Docs sync** — Residual Register links Evidence Package; TD-036 row,
    project status / release history / module maturity as required by residual
    DoD practice (AC-13).
11. **US295 handoff** — Evidence Package marked ready as US295 input.

---

## 14. Definition of Done

Story-level DoD only (not full RC-18 exit).

- [x] This Story Specification accepted as implementation/evidence authority
      for US294 (Tech Lead / Architecture owner approval)
- [x] Stage 3 evidence planning cites this document + Stage 2 PROCEED + E17
      O1–O10 / §7 / original US247–US248 evidence ACs + ADR-012/013/014/018
- [x] AC-1…AC-13 satisfied with reviewable evidence
- [x] Chaos Test Matrix mandatory rows **M-01…M-12** all executed and recorded
- [x] **US294 Evidence Package** (§11) complete for every mandatory scenario
      and linked from Residual Register
- [x] Evidence Package handed as input for US295
- [x] TR-N4 closed for mandatory chaos/restart + fail-safe evidence class
- [x] TD-036 residual row “Chaos/restart + fail-safe evidence suites” updated
- [x] Residual Register US294-owned rows updated
- [x] Architecture Freeze intact (ADR-012…ADR-019 unchanged by this Story)
- [x] No Recovery / Runtime / Incident / RecoveryState redesign
- [x] No new bounded context / RecoveryCoordinator introduced
- [x] Canonical Order Path and SignalIntent recovery boundary unchanged
- [x] Scope not expanded into US295 / E19 productization / future backlog
- [x] Claim language respects §6.8 (no release PASS / ADL-008 ACCEPTED from
      US294 alone)
- [x] Docs sync for this Story as required by residual DoD practice
- [x] Quality gates green for the change set that delivers this Story

**Not required for US294 DoD alone:** ADL-008 ACCEPTED (US295); E19 Kill Switch
policy / Incident dashboard / recovery status API; full RC-18 Release Review
PASS; redesign of recovery substrate.

---

## Architectural Ambiguities

Recorded from pre-correction ADC; Tech Lead mandatory matrix (§10) and
Evidence Package (§11) supersede exploratory lists where they conflict.
None reopen Architecture Freeze.

| #   | Ambiguity                                                                      | Recommendation                                                                                                                          |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | RIV: mid-phase re-entry may clear fencing until re-lease — expected vs defect? | **Expected only if** M-03 / M-08 prove re-lease + stale commit rejection. Unfenced durable commits = defect.                            |
| A2  | Mid-Order/Fill depth vs future Order-proposal backlog                          | Not a separate mandatory matrix row; if exercised under M-06…M-12 paths, pair existing fixtures — do not invent Order-proposal feature. |
| A3  | Duplicate Inbox coverage vs E18 full consumer audit?                           | M-10 covers recovery-claim Outbox/at-least-once proof; E18 = exhaustive consumer coverage.                                              |
| A4  | Kill Switch across restart (E17 §7.10) vs E19 policy ownership?                | Remains **E19** productization; not added as mandatory §10 row by Tech Lead corrections.                                                |
| A5  | Original US246 graceful-shutdown ACs residual                                  | Optional exploratory only; mandatory minimum is §10 M-01…M-12.                                                                          |
| A6  | Evidence artifact exact path?                                                  | Binding contents = §11 Evidence Package; path is Stage 3 choice if linked from Residual Register.                                       |
| A7  | Unused Incident `reasonClass` call-sites (SIG-001)?                            | Non-blocker unless mandatory matrix surfaces a defect.                                                                                  |
| A8  | Does US294 authorize “production restart-safety PASS”?                         | **No** — Evidence Package closes R5/TR-N4 proof input; PASS language requires US295 (+ residual DoD).                                   |

**Post-correction conclusion:** Tech Lead mandatory matrix + Evidence Package
are binding. Story Specification is Stage 3 implementation/evidence authority
after corrections applied.

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
| 7   | Architecture Decision Log (ADL-008) | [`../../Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                                                 |
| 8   | RC-18 Release Planning              | [`../rc-18-release-planning.md`](../rc-18-release-planning.md)                                                   |
| 9   | RC-18 TD036 Epic Planning (Stage 1) | [`../rc-18-td036-epic-planning.md`](../rc-18-td036-epic-planning.md)                                             |
| 10  | RC-18 Stage 2 Architecture Review   | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)                   |
| 11  | E17 Runtime Recovery Specification  | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)               |
| 12  | US290 Story Specification           | [`./us290-force-confirm-recovering-on-discovery.md`](./us290-force-confirm-recovering-on-discovery.md)           |
| 13  | US291 Story Specification           | [`./us291-real-recovery-reconciliation-port-adapters.md`](./us291-real-recovery-reconciliation-port-adapters.md) |
| 14  | US292 Story Specification           | [`./us292-durable-recovery-state-phase-machine.md`](./us292-durable-recovery-state-phase-machine.md)             |
| 15  | US293 Story Specification           | [`./us293-durable-incident-on-recovery-ambiguity.md`](./us293-durable-incident-on-recovery-ambiguity.md)         |
| 16  | RIV-001                             | [`../rc-18-riv-001-recovery-integration-validation.md`](../rc-18-riv-001-recovery-integration-validation.md)     |
| 17  | SIG-001                             | [`../rc-18-sig-001-safety-integration-validation.md`](../rc-18-sig-001-safety-integration-validation.md)         |
| 18  | Mid-Release Health Review           | [`../rc-18-mid-release-health-review.md`](../rc-18-mid-release-health-review.md)                                 |
| 19  | Technical Debt (TD-036 residuals)   | [`../technical-debt.md`](../technical-debt.md)                                                                   |
| 20  | E17 Stage 4 Technical Review        | [`../e17-stage-4-technical-review.md`](../e17-stage-4-technical-review.md)                                       |
| 21  | Residual Register                   | [`../rc-18-residual-register.md`](../rc-18-residual-register.md)                                                 |
| 22  | Story ID Allocation                 | [`../story-id-allocation.md`](../story-id-allocation.md)                                                         |

---

## Document lifecycle

```text
APPROVED WITH MINOR CORRECTIONS (Tech Lead)
        ↓
Corrections applied → Stage 3 implementation/evidence authority
        ↓
Evidence execution (mandatory matrix M-01…M-12 + Evidence Package)
        ↓
DoD COMPLETE → US295 (consumes Evidence Package)
```

---

## Sign-off

| Role                        | Name / Status                                     | Date       |
| --------------------------- | ------------------------------------------------- | ---------- |
| Story Specification (docs)  | Auto                                              | 2026-08-01 |
| Tech Lead review            | **APPROVED WITH MINOR CORRECTIONS**               | 2026-08-01 |
| Tech Lead corrections       | **Applied** (normative matrix + Evidence Package) | 2026-08-01 |
| Architecture owner          | _(assign)_                                        |            |
| Stage 2 Architecture Review | PROCEED (binding constraints)                     | 2026-07-30 |

**Authority statement:** This document is the Stage 3 implementation/evidence
authority for US294. Stage 3 planning and evidence execution must realize the
WHAT defined here under Architecture Freeze and Stage 2 PROCEED constraints,
including mandatory Chaos Test Matrix rows M-01…M-12 and the US294 Evidence
Package (§11). It does not prescribe HOW (harness framework, exact file paths
beyond Evidence Package field requirements, or module-internal design).

**Next step:** Stage 3 evidence planning/execution under Freeze — then US295
using the Evidence Package as input.
