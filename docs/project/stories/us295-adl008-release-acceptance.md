# US295 — ADL-008 Closure / Release Acceptance

**Story ID:** US295  
**Release:** RC-18 — Production Recovery & Operational Readiness  
**Workstream:** Mandatory TD-036 residual (R6)  
**Date:** 2026-08-10  
**Status:** Spec drafted — awaiting Tech Lead review  
**Architecture baseline:** ADR-012…ADR-019 ACTIVE; Architecture Freeze in effect  
**Primary debt:** TD-036 — ADL-008 ACCEPTED or explicit accepted deferral  
**Closes:** Residual Register **R6**; E17 Stage 4 **TR-N9** (ADL sync portion);
E17 Exit Criteria #10 (ADL-008; related ADL-013 / ADL-014 disposition)  
**Preceding authority:** [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md) (**PROCEED**)  
**Predecessor Stories:** [US290](./us290-force-confirm-recovering-on-discovery.md),
[US291](./us291-real-recovery-reconciliation-port-adapters.md),
[US292](./us292-durable-recovery-state-phase-machine.md),
[US293](./us293-durable-incident-on-recovery-ambiguity.md),
[US294](./us294-chaos-restart-evidence.md)  
**Integration / evidence predecessors:** [RIV-001](../rc-18-riv-001-recovery-integration-validation.md),
[SIG-001](../rc-18-sig-001-safety-integration-validation.md),
[Mid-Release Health Review](../rc-18-mid-release-health-review.md),
[US294 Evidence Package](../rc-18-us294-chaos-restart-evidence.md)  
**Does not introduce:** production feature redesign, Recovery/Runtime/Incident/
RecoveryState redesign, new Epic, new bounded context, ADR change, or
runtime behaviour change

Related:

- [CANONICAL](../../CANONICAL.md)
- [ADR Index](../../adr/README.md)
- [ADR-012 Execution Architecture](../../adr/ADR-012-execution-architecture.md)
- [ADR-013 Event Processing Model](../../adr/ADR-013-event-processing-model.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [ADR-018 Architectural Invariants](../../adr/ADR-018-architectural-invariants.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md) — ADL-008 DEFERRED;
  ADL-013 PROPOSED
- [RC-18 Release Planning](../rc-18-release-planning.md)
- [RC-18 TD036 Epic Planning](../rc-18-td036-epic-planning.md)
- [RC-18 Stage 2 Architecture Review](../rc-18-td036-stage2-architecture-review.md)
- [E17 Runtime Recovery Specification](../epics/e17-runtime-recovery-specification.md)
  — O1–O10, §5 ownership, §11 ADL Impact, Exit Criteria #10
- [Technical Debt](../technical-debt.md) — TD-036 residual ownership
- [Residual Register](../rc-18-residual-register.md)
- [Tech Lead Decision Log](../rc-18-tech-lead-decision-log.md)
- [Story ID Allocation](../story-id-allocation.md)

---

## 1. Objective

Close **ADL-008** chronologically as **ACCEPTED** (preferred), or record an
**explicit accepted deferral** with rationale and owner, using the completed
US290–US294 residual chain and the **US294 Evidence Package** as mandatory
inputs — without redesigning Recovery, Runtime, RecoveryState, Incident, or
any prior Story behaviour.

### Business value

Operators and release owners cannot treat “API restart is safe for continuous
paper sessions” as an authorized release claim while ADL-008 remains an
unexamined DEFERRED placeholder. US294 attached chaos/restart proof; US295 is
the **governance / release-acceptance** gate that either records production
algorithm ownership as ACCEPTED or explicitly accepts deferral — enabling
credible production-recovery claim language for the E17 baseline.

### Architectural purpose

Close the **R6 / TR-N9** residual under Architecture Freeze: synchronize the
Architecture Decision Log with implemented Session-owned ADR-014 recovery
ownership (US240–US249 + US290–US294), without superseding ADR-014, inventing
runtime features, absorbing E19 productization, or claiming full RC-18 Release
Review PASS.

US295 is **governance + documentation + release-acceptance evidence sync
only**. It does not implement recovery behaviour.

---

## 2. Background

### Residual chain (complete through R5)

RC-17 baselined the Session-owned Stage 3 recovery reference pipeline
(US240–US249 + US244A) with Stage 4 **PASS WITH RECOMMENDATIONS**. Production
restart-safety was intentionally left to RC-18.

RC-18 mandatory residuals closed functional substrate and evidence:

| Story     | Residual closed                                                 | Status         |
| --------- | --------------------------------------------------------------- | -------------- |
| US290     | Discovery → Session `RECOVERING` precondition                   | Implemented    |
| US291     | Real reconcile ports (no stub false-green)                      | Implemented    |
| US292     | Durable RecoveryState + phase machine                           | Implemented    |
| US293     | Durable Incident + fail-closed block                            | Implemented    |
| US294     | Chaos/restart + fail-safe evidence (M-01…M-12 Evidence Package) | Implemented    |
| **US295** | **ADL-008 ACCEPTED or explicit accepted deferral**              | **This Story** |

RIV-001 (**COHERENT**), SIG-001 (**PASS WITH RESIDUALS**), Mid-Release Health
Review (**AMBER → GREEN** foundation), and Tech Lead Decision Log
**TL-010** hand US294 Evidence Package to US295.

### Why R6 / US295 exists after US294

Stage 1 R5→R6 and Stage 2 AR-04 / constraint 9 require:

1. **Evidence before claim language** — US294 attaches chaos/restart proof.
2. **ADL synchronization** — US295 records ownership chronologically so
   ADL-008 is no longer a placeholder.
3. **Release acceptance discipline** — production restart-safety PASS for the
   E17 recovery claim is forbidden until both evidence and ADL governance
   close (or explicit accepted deferral is recorded).

US294 §6.8 and Evidence Package claim-language limits explicitly forbid
ADL-008 ACCEPTED and production restart-safety PASS from US294 alone.

### Normative sources (do not redefine)

- ADR-014 Restart recovery algorithm + Incident-on-ambiguity rule
- ADR-013 at-least-once delivery with idempotent business effects
- ADR-012 single Execution Engine entry; no recovery fork
- ADR-018 #19–25, #60 (recovery invariants; ADL cannot override ADR)
- ADL.md ADL-008 DEFERRED placeholder; ADL-013 PROPOSED (US293)
- E17 Spec §5 ownership; §11 ADL-008 draft decision; Exit Criteria #10
- Stage 1 R6; Stage 2 US295 / AR-04 / constraints 2, 8–9
- RC-18 Release Planning §3 / §9 (residuals + ADL sync; full RC-18 exit is broader)
- Residual Register R6; Tech Lead TL-010 handoff

---

## 3. Architecture Decision Summary

This section records the Architecture Decision Check for US295. It consolidates
**already approved** decisions; it does not open a new ADR.

### Why is US295 required after US294?

| Layer          | US294 delivers                         | Still missing without US295                                     |
| -------------- | -------------------------------------- | --------------------------------------------------------------- |
| Evidence       | M-01…M-12 PASS; R5 / TR-N4 closed      | Chronological ADL ownership record                              |
| Governance     | Explicit non-delivery of ADL-008 write | ADL-008 ACCEPTED **or** explicit accepted deferral              |
| Claim language | May say “chaos evidence attached”      | May say “production restart-safety PASS” for E17 recovery claim |
| Release gate   | Residual proof input                   | Residual workstream R6 close; E18 sequencing gate for residuals |

**Verdict:** Capability + survival under chaos are evidenced. **Ownership
acceptance and release-claim authorization** remain a separate Architecture
owner gate. Closing them inside US294 would violate Stage 2 US295 validation
(“governance/docs gate only”) and AR-04.

### Which architectural decisions can now be closed?

Given R1–R5 closed and Evidence Package COMPLETE:

| Decision                                                          | Closable in US295?   | Target disposition                                                                 |
| ----------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| **ADL-008** Full ADR-014 recovery algorithm ownership             | **Yes (primary)**    | **ACCEPTED** preferred; fill Decision from E17 §11 draft + US290–US294 evidence    |
| **ADL-013** Minimal Session-owned Recovery Incident (provisional) | **Yes (related)**    | **ACCEPTED** as provisional→E19 (SIG-001 / Residual Register governance residual)  |
| **ADL-014** Graceful shutdown recoverability interpretation       | **Disposition only** | **ACCEPTED** if already evidenced sufficiently, else **explicit deferred** with TD |
| ADR-012…ADR-019 Freeze                                            | **No change**        | Remain ACTIVE; US295 must not redefine                                             |
| ADL-009…ADL-012                                                   | **No**               | Remain E18/E19/E21 placeholders                                                    |

Preferred path with current evidence: **ADL-008 ACCEPTED**. Explicit accepted
deferral remains a lawful alternative only with Architecture/Release owner
rationale — not as silent skip.

### Which residuals are eligible for closure?

| Residual / item                                                              | Eligible? | Condition                                               |
| ---------------------------------------------------------------------------- | --------- | ------------------------------------------------------- |
| Residual Register **R6** (ADL-008)                                           | **Yes**   | ADL-008 ACCEPTED or explicit accepted deferral recorded |
| TD-036 mandatory row “ADL-008 promotion…”                                    | **Yes**   | Same as R6                                              |
| Integration residual “ADL-013 formal registration + ADL-008 promotion”       | **Yes**   | ADL-008 + ADL-013 dispositions recorded                 |
| E17 Stage 4 **TR-N9** (ADL sync portion for recovery ownership)              | **Yes**   | ADL-008 closed as above                                 |
| Mandatory TD-036 residual **class R1–R6** as production-recovery workstream  | **Yes**   | R1–R5 already Closed; R6 closes with this Story         |
| Production-recovery claim justification (RC-18 §9 bullet for recovery claim) | **Yes**   | Only if ADL-008 **ACCEPTED** (not mere deferral)        |

### Which residuals must remain deferred?

| Residual / item                                                      | Owner                            | Must remain open / deferred   |
| -------------------------------------------------------------------- | -------------------------------- | ----------------------------- |
| Durable Kill Switch policy for admission/arming                      | E19 Operations                   | **Yes**                       |
| Operator recovery status / phase API                                 | E19 Operations                   | **Yes**                       |
| Richer Safety Incident productization (resolve/ack/dashboard/alerts) | E19 Operations                   | **Yes**                       |
| Auth hardening leftovers (TD-005 / TD-006)                           | Platform / Auth                  | **Yes**                       |
| Reconcile `readRisk` real view (currently null)                      | E19 / Risk                       | **Yes**                       |
| US293 Incident model provisional supersession                        | E19                              | **Yes** (semantics preserved) |
| Full E18 Inbox coverage / DLQ productization / ADL-009               | E18                              | **Yes**                       |
| ADL-010 Kill Switch scope; ADL-011 fairness; ADL-012 transport       | E19 / E21                        | **Yes**                       |
| Order proposal from recovery SignalIntent                            | Future backlog                   | **Yes**                       |
| In-process stage cache durability beyond RecoveryState               | Future backlog                   | **Yes**                       |
| Unused Incident `reasonClass` first-class call-sites                 | Runtime Recovery (opportunistic) | **Yes** (non-blocker)         |
| Full RC-18 Release Review PASS / E18–E21 epic exits                  | Release / epic owners            | **Yes**                       |
| Real-capital / live broker adapters                                  | Future ADR                       | **Yes**                       |

### Which evidence is mandatory before ADL-008 may become ACCEPTED?

All of the following are **mandatory inputs**. Missing any blocks ACCEPTED
(Architecture owner may only choose **explicit accepted deferral** instead —
never silent ACCEPTED):

1. **US290–US293 Implemented** (Residual Register R1–R4 Closed).
2. **US294 Evidence Package COMPLETE** with **M-01…M-12 PASS**
   ([`rc-18-us294-chaos-restart-evidence.md`](../rc-18-us294-chaos-restart-evidence.md)).
3. **RIV-001** verdict **COHERENT** (or successor equivalent still valid).
4. **SIG-001** verdict **PASS WITH RESIDUALS** (or successor equivalent still valid).
5. **Mid-Release Health Review** acceptance of US290–US293 foundation +
   Architecture Freeze intact.
6. **Tech Lead Decision Log** handoff (**TL-010** or successor) confirming
   Evidence Package ready for US295.
7. **Architecture Freeze intact** — ADR-012…ADR-019 unchanged by residual
   Stories; no silent ADR override.
8. **No open RC-18 mandatory recovery blocker** in Residual Register R1–R5
   (R5 Closed).
9. **Explicit claim-language limits** from US294 §6.8 acknowledged and replaced
   only by this Story’s allowed claims after ACCEPTED.

US294’s process-boundary method (SIGKILL-class simulation via durable-store
restart boundary under Architecture Freeze) is **accepted as mandatory evidence
quality** for ACCEPTED unless Architecture owner rejects it with a new residual
— do not reopen harness redesign inside US295.

### Which release claims are allowed after US295?

**If ADL-008 is ACCEPTED** (and DoD satisfied):

| Claim                                                                                          | Allowed? |
| ---------------------------------------------------------------------------------------------- | -------- |
| ADL-008 ACCEPTED; Session-owned ADR-014 recovery algorithm ownership recorded                  | **Yes**  |
| Mandatory TD-036 residuals R1–R6 closed for production recovery claim                          | **Yes**  |
| TR-N4 / R5 chaos evidence attached **and** governance synced                                   | **Yes**  |
| Production restart-safety **PASS** for continuous **paper** Sessions under documented evidence | **Yes**  |
| Operators may treat API restart as safe for continuous paper sessions (E17 recovery claim)     | **Yes**  |
| Residual workstream complete; E18 product epic may proceed under RC-18 sequencing              | **Yes**  |
| ADL-013 ACCEPTED as provisional→E19 (if dispositioned in this Story)                           | **Yes**  |

**If only explicit accepted deferral is recorded** (DoD still satisfiable for R6):

| Claim                                                                  | Allowed? |
| ---------------------------------------------------------------------- | -------- |
| ADL-008 no longer unexamined placeholder; deferral rationale + owner   | **Yes**  |
| R6 Closed as “accepted deferral”                                       | **Yes**  |
| Production restart-safety PASS / “operators may treat restart as safe” | **No**   |
| Full production-recovery claim justified                               | **No**   |

### Which release claims remain forbidden after US295?

Even after ADL-008 ACCEPTED:

| Claim                                                                  | Forbidden because                            |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| Full **RC-18 Release Review PASS**                                     | Needs E18–E21 (+ RC-18 §9 remaining bullets) |
| E19 Kill Switch policy / recovery status API / Incident dashboard done | E19 residual class                           |
| Exact-once delivery / full consumer Inbox audit complete               | E18 / ADL-009                                |
| ADL-009…ADL-012 ACCEPTED by implication                                | Separate epics                               |
| Real-capital / live broker readiness                                   | Out of RC-18 scope                           |
| Recovery / Runtime / RecoveryState / Incident **redesign** completed   | Forbidden; Freeze                            |
| Dashboard / UI is authoritative for recovery or finance                | ADR-018 #33, #58                             |
| Job/scheduler owns Session lifecycle                                   | TD-002 / ADL-008 consequences                |
| ADL supersedes ADR-014 or Freeze                                       | ADR-018 #60; Stage 2 constraint 2            |
| Graceful-shutdown product completeness if ADL-014 deferred             | Explicit deferred residual                   |
| Multi-strategy concurrent RUNNING readiness                            | E21 / ADL-010–011                            |

### Architecture Decision Check verdict

**No blocking architectural ambiguity that requires a new ADR or redesign.**
US295 is authorized as governance/docs / release-acceptance under Stage 2
PROCEED. Residual clarifications are recorded in §Architectural Ambiguities
and resolved by binding recommendations below — not by redesigning Recovery,
Runtime, RecoveryState, Incident, or prior Story behaviour.

---

## 4. Scope IN

- Promote **ADL-008** from DEFERRED to **ACCEPTED**, **or** record an
  **explicit accepted deferral** with rationale, owner, and residual pointer
  (Architecture/Release owner decision).
- Fill ADL-008 Decision text from already approved ownership (E17 §11 draft +
  US290–US294 evidence chain); chronological table + entry body updated.
- Disposition related recovery governance:
  - **ADL-013** formal registration / promotion (ACCEPTED provisional→E19
    preferred; else explicit deferred with owner — never silent).
  - **ADL-014** ACCEPTED or explicit deferred with TD pointer (E17 Exit #10).
- Define and apply **Release Acceptance Criteria** for the **production
  recovery claim** (not full RC-18 closure).
- Consume **Mandatory Evidence Package inputs** (US294 package + RIV/SIG /
  mid-release / TL handoff).
- Update Residual Register R6; TD-036 ADL-008 row; Tech Lead Decision Log;
  living docs required by Documentation Requirements.
- State **allowed** and **forbidden** release claims explicitly.
- Preserve Architecture Freeze and prior Story behaviour unchanged.

---

## 5. Scope OUT

Hard-stop boundaries (must not be absorbed into US295):

| Out of scope                                                                            | Owner / later                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------- |
| Any Recovery / Runtime / RecoveryState / Incident / Session lifecycle **code redesign** | Forbidden                                 |
| Changing US290–US294 behaviour or re-running chaos as a feature Story                   | US294 already closed; evidence-only reuse |
| Operator recovery status / phase API                                                    | **E19**                                   |
| Richer Safety Incident productization, resolve/ack/dashboard, alerts UX                 | **E19**                                   |
| Durable Kill Switch **policy productization**                                           | **E19**                                   |
| Auth hardening leftovers (TD-005 / TD-006)                                              | **E19**                                   |
| Full E18 Inbox coverage audit / DLQ / ADL-009 closure                                   | **E18**                                   |
| ADL-010 / ADL-011 / ADL-012 product decisions                                           | E19 / E21                                 |
| Order proposal from recovery SignalIntent; broader stage-cache durability               | Future backlog                            |
| New RecoveryCoordinator / Recovery BC                                                   | Forbidden                                 |
| Canonical Order Path / Orders / Risk / Execution / Accounting redesign                  | Freeze                                    |
| Real-capital / live broker adapters                                                     | RC-18 out of scope                        |
| Full RC-18 Release Review PASS / E18–E21 epic delivery                                  | Release / epic owners                     |
| New ADR (unless Architecture owner proves Freeze change — not expected)                 | ADR-018 #60                               |

### Non-goals

| Non-goal                                                         | Rationale                             |
| ---------------------------------------------------------------- | ------------------------------------- |
| Treat US294 alone as ADL-008 ACCEPTED                            | Stage 1 R5→R6; US294 §6.8             |
| Silent ACCEPTED while R1–R5 incomplete                           | AR-04; evidence gates                 |
| Use ADL to override ADR-014                                      | Stage 2 constraint 2; ADR-018 #60     |
| Absorb E19 under “release acceptance” cover                      | Explicit E19 residual class           |
| Claim full RC-18 exit from residual workstream alone             | RC-18 §9; Stage 1 residual exit notes |
| Redesign Recovery / Runtime / RecoveryState / Incident to “pass” | Governance Story only                 |

---

## 6. Architecture Constraints

### 6.1 Governance-only mandate

- US295 delivers **ADL / docs / residual / claim-language** outcomes.
- Production recovery behaviour changes are **forbidden**.
- Test/harness changes are out of scope unless Architecture owner rejects
  Evidence Package quality and opens a corrective residual (re-enter review).

### 6.2 Do not redesign

US295 must not redesign:

- Recovery pipeline algorithms (US240–US249; US290–US294);
- Runtime admission / arming / evaluation model;
- Incident create / fail-closed model (US293);
- RecoveryState schema or phase machine (US292);
- Session lifecycle dual-status rule;
- Canonical Order Path.

### 6.3 ADL vs ADR authority

1. ADL records chronological application choices.
2. ADL **cannot** silently supersede ADR-012…ADR-019 (ADR-018 #60).
3. ADL-008 ACCEPTED means: Session-owned orchestration ownership is accepted
   as implemented under existing ADR-014 — **not** a new recovery architecture.
4. Accepted deferral must name owner + rationale + what remains blocked.

### 6.4 Dual-status model (binding, unchanged)

```text
TradingSession.status      = lifecycle authority (incl. RECOVERING / FAILED)
SessionRecoveryState.phase = recovery progress within RECOVERING
SessionRecoveryIncident    = durable fail-closed evidence (provisional → E19)
```

### 6.5 Explicit boundaries with E19

| Boundary  | US295 delivers                                                      | Does **not** deliver                                                                        |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **E19**   | May record ADL-013 as provisional ACCEPTED pending E19 supersession | Kill Switch durable policy; operator Incident UX; recovery status/phase API; auth leftovers |
| **E19**   | May state fail-closed semantics must survive E19 migration          | Dashboard/alerts productization                                                             |
| **E18**   | May note M-10 recovery-adjacent Outbox proof already attached       | Full consumer Inbox audit / ADL-009                                                         |
| **US294** | Consumes Evidence Package as mandatory ACCEPTED input               | Re-opens chaos matrix or redesigns harness                                                  |

### 6.6 Sequencing

```text
US290 → US291 → US292 → US293 → US294 → US295 → E18 → E19 → E20 → E21
```

Thin parallel E18 work remains governed by RC-18 Release Planning (Architecture
Review proof required) — US295 does not invent parallelization rights.

### 6.7 Production claim language rule

| Language                                                      | After US295 ACCEPTED? | After US295 accepted deferral only? |
| ------------------------------------------------------------- | --------------------- | ----------------------------------- |
| R6 closed; ADL synchronized                                   | **Yes**               | **Yes**                             |
| Production restart-safety PASS (paper; E17 recovery claim)    | **Yes**               | **No**                              |
| Operators may treat API restart as safe (documented evidence) | **Yes**               | **No**                              |
| Full RC-18 Release Review PASS                                | **No**                | **No**                              |
| E19 / E18 product completeness                                | **No**                | **No**                              |

---

## 7. Functional Requirements

Behaviour / governance outcomes only. No implementation prescription.

### FR-1 — ADL-008 disposition

Architecture owner must record ADL-008 as **ACCEPTED** or **explicit accepted
deferral** (never leave as unexamined DEFERRED placeholder after US295 DoD).

### FR-2 — ACCEPTED prerequisites

ADL-008 may become ACCEPTED only when all Mandatory Evidence Package inputs
(§Evidence Requirements) are present and reviewable.

### FR-3 — Decision text completeness

If ACCEPTED, ADL-008 Decision must state at minimum:

1. Trading Session owns recovery **orchestration**.
2. Modules expose reconcile/recovery ports; no Recovery BC.
3. Dual-status model (Session status vs RecoveryState phase).
4. Fail-closed Incident on ambiguity (provisional→E19).
5. Job/scheduler must not become second Session lifecycle (TD-002).
6. Evidence basis: US240–US249 baseline + US290–US294 + Evidence Package +
   RIV/SIG.

### FR-4 — Explicit accepted deferral shape

If deferral is chosen, record: rationale, owner, blocked claims, residual/TD
id, and what evidence is still missing — suitable for RC closeout audit.

### FR-5 — Related ADL dispositions

Disposition ADL-013 and ADL-014 per Residual Closure / Deferred Residual Rules
(ACCEPTED or explicit deferred; never silent).

### FR-6 — Residual Register / TD sync

Close R6 (and related governance residual row) consistent with chosen
disposition; update TD-036 ADL-008 ownership row.

### FR-7 — Release claim publication

Publish allowed vs forbidden claims (§6.7 / Release Acceptance Criteria) in
living release/status docs.

### FR-8 — Hard-stop successors

US295 must not implement E19 productization, E18 Inbox audit, or recovery
redesign.

### FR-9 — Prior Story immutability

US295 must not change US290–US294 functional behaviour or invalidate Evidence
Package PASS rows without Architecture re-entry.

### FR-10 — Freeze preservation

ADR-012…ADR-019 remain ACTIVE; no ADR edit from this Story.

---

## 8. Non-Functional Requirements

### NFR-1 — Auditability

ADL entries, Residual Register, and Decision Log updates must be reviewable
chronologically with dates and authority links.

### NFR-2 — Non-silent governance

No placeholder left “DEFERRED” without explicit accepted-deferral rationale
after this Story’s DoD for items in US295 Scope IN.

### NFR-3 — Claim discipline

Status docs must not over-claim RC-18 full exit or E19 completeness.

### NFR-4 — Traceability

Every ACCEPTED claim must cite Evidence Package path + RIV/SIG + Story IDs.

### NFR-5 — Secrets hygiene

Governance artifacts must not store secrets (ADR-018 #59).

### NFR-6 — Scope-bounded change envelope

Docs / ADL / residual / TD / status only — no production module redesign.

---

## 9. Acceptance Criteria

Every AC is testable. Architecture citations are normative.

### AC-1 — ADL-008 closed

**Given** US295 delivery  
**When** `docs/Architecture/ADR/ADL.md` is inspected  
**Then** ADL-008 status is **ACCEPTED** or an **explicit accepted deferral**
entry (rationale + owner) — not an unexamined DEFERRED placeholder  
**Authority:** Stage 1 R6; Stage 2 US295; RC-18 §9 ADL sync; E17 Exit #10

### AC-2 — ACCEPTED evidence gate

**Given** a proposal to mark ADL-008 ACCEPTED  
**When** Evidence Requirements are checked  
**Then** all mandatory inputs are present (US290–US293 Done; US294 M-01…M-12
PASS package; RIV-001; SIG-001; mid-release; TL handoff; Freeze intact)  
**Authority:** Stage 2 AR-04; US294 §11 handoff; Residual Register R1–R5

### AC-3 — Decision text / non-override

**Given** ADL-008 ACCEPTED  
**When** Decision text is reviewed  
**Then** it records Session-owned orchestration under ADR-014 without claiming
to supersede ADR Freeze; alternatives rejected remain Recovery BC / Runtime-owned
full recovery / `live-trading-engine.RecoveryManager`  
**Authority:** E17 §11 ADL-008 draft; Stage 2 constraint 2; ADR-018 #60

### AC-4 — ADL-013 disposition

**Given** US295 DoD  
**When** ADL.md is inspected  
**Then** ADL-013 is ACCEPTED (provisional→E19) or explicitly deferred with
owner — Residual Register governance residual closed accordingly  
**Authority:** SIG-001; Residual Register integration residual; US293 provisional model

### AC-5 — ADL-014 disposition

**Given** US295 DoD  
**When** ADL.md / TD are inspected  
**Then** ADL-014 is ACCEPTED or explicitly deferred with TD pointer  
**Authority:** E17 Exit Criteria #10

### AC-6 — Residual Register R6

**Given** US295 DoD  
**When** Residual Register is inspected  
**Then** R6 status matches ADL-008 disposition (Closed) with evidence links  
**Authority:** Residual Register; TD-036 ownership table

### AC-7 — Claim language discipline

**Given** US295 DoD  
**When** project status / release docs are reviewed  
**Then** allowed vs forbidden claims match §6.7 / Release Acceptance Criteria;
full RC-18 PASS and E19 completeness are not claimed  
**Authority:** RC-18 §9; Stage 2 constraint 9; Mid-Release claim posture

### AC-8 — Production restart-safety language

**Given** ADL-008 ACCEPTED and DoD  
**When** release language is reviewed  
**Then** production restart-safety PASS for paper continuous Sessions **may**
be stated with Evidence Package citation  
**But if** only accepted deferral  
**Then** that PASS language remains **forbidden**  
**Authority:** US294 §6.8; RC-18 risk table; Stage 1 R5→R6

### AC-9 — Scope / Freeze preserved

**Given** US295 change set  
**When** architecture review is performed  
**Then** no Recovery/Runtime/Incident/RecoveryState redesign; no new BC; no
E19/E18 absorption; ADR-012…ADR-019 unchanged by this Story  
**Authority:** Stage 2 US295; Freeze; user constraints

### AC-10 — Documentation Requirements satisfied

**Given** US295 DoD  
**When** Documentation Requirements checklist is inspected  
**Then** all required docs are updated and mutually consistent  
**Authority:** Stage 1 residual DoD docs sync; RC-18 §9 documentation bullet
(for residual scope)

### AC-11 — Tech Lead / Architecture gate recorded

**Given** US295 completion  
**When** Tech Lead Decision Log is inspected  
**Then** a decision records US295 outcome (ACCEPTED vs accepted deferral) and
claim posture  
**Authority:** RC-18 Development Process; Decision Log rules

---

## 10. Release Acceptance Criteria

These criteria define **production recovery release acceptance** for the E17
baseline residual workstream. They are **necessary** for residual exit and
**not sufficient** for full RC-18 Release Review PASS.

### RAC-1 — Mandatory residuals closed

R1–R6 Closed in Residual Register (R1–R5 already Closed; R6 by this Story).

### RAC-2 — Evidence attached

US294 Evidence Package M-01…M-12 PASS linked from Residual Register / ADL /
status docs.

### RAC-3 — ADL synchronized for recovery ownership

ADL-008 ACCEPTED (preferred) **or** explicit accepted deferral recorded.

### RAC-4 — Integration gates remain valid

RIV-001 and SIG-001 verdicts remain the baseline (no new mandatory blocker
opened against them without owner).

### RAC-5 — Architecture Freeze intact

ADR-012…ADR-019 ACTIVE; dual-status model unchanged; Canonical Order Path
unchanged.

### RAC-6 — Claim posture published

Allowed and forbidden claims (§6.7) published; no over-claim of E18/E19/RC-18
full exit.

### RAC-7 — E18 sequencing gate

Residual workstream may be treated complete for RC-18 sequencing toward E18
only when RAC-1…RAC-6 hold. Thin parallel remains Architecture Review governed.

### RAC-8 — Full RC-18 exit not implied

Satisfaction of RAC-1…RAC-7 does **not** alone satisfy RC-18 §9 epic exits or
Release Review PASS.

---

## 11. Evidence Requirements

### Mandatory Evidence Package inputs (blocking for ADL-008 ACCEPTED)

| #   | Input                                                             | Authority path                                                                                            |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| E1  | US290–US293 Implemented / R1–R4 Closed                            | Residual Register; Mid-Release Health Review                                                              |
| E2  | US294 Evidence Package COMPLETE (M-01…M-12 PASS)                  | [`rc-18-us294-chaos-restart-evidence.md`](../rc-18-us294-chaos-restart-evidence.md)                       |
| E3  | US294 Story DoD complete; claim-language limits acknowledged      | [`us294-chaos-restart-evidence.md`](./us294-chaos-restart-evidence.md) §6.8 / §14                         |
| E4  | RIV-001 **COHERENT**                                              | [`rc-18-riv-001-recovery-integration-validation.md`](../rc-18-riv-001-recovery-integration-validation.md) |
| E5  | SIG-001 **PASS WITH RESIDUALS**                                   | [`rc-18-sig-001-safety-integration-validation.md`](../rc-18-sig-001-safety-integration-validation.md)     |
| E6  | Mid-Release Health Review complete; Freeze intact                 | [`rc-18-mid-release-health-review.md`](../rc-18-mid-release-health-review.md)                             |
| E7  | Tech Lead TL-010 (or successor) Evidence Package COMPLETE handoff | [`rc-18-tech-lead-decision-log.md`](../rc-18-tech-lead-decision-log.md)                                   |
| E8  | Stage 2 PROCEED constraints still binding                         | [`rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)               |

### Required engineering evidence (governance reuse; no new suites)

1. Cite Evidence Package suite command and aggregate 12/12 PASS.
2. Cite RIV/SIG verdicts and residual ownership for anything still open.
3. Cite dual-status / fail-closed / ownership statements already accepted.
4. Do **not** require new chaos scenarios for US295 DoD unless Architecture
   owner rejects E2 quality.

### Evidence for accepted deferral (if chosen)

Must include: missing prerequisite id(s), owner, blocked claims list, and TD /
Residual Register pointer. Prefer ACCEPTED given current E1–E8 completeness.

---

## 12. Residual Closure Rules

A residual may be **Closed** by US295 only when:

1. It is in the eligible list (Architecture Decision Summary), and
2. Matching ADL / docs / register rows are updated in the same change set, and
3. Closure does not silently imply E19/E18 product delivery, and
4. For R6 specifically: ADL-008 disposition is recorded (ACCEPTED or explicit
   accepted deferral).

**Binding closures expected on preferred path (ADL-008 ACCEPTED):**

- Residual Register **R6**
- TD-036 mandatory ADL-008 promotion row
- Integration residual “ADL-013 formal registration + ADL-008 promotion”
- TR-N9 ADL sync portion for recovery algorithm ownership
- Mandatory TD-036 residual workstream R1–R6 (production recovery claim class)

---

## 13. Deferred Residual Rules

A residual must **remain deferred / open** when:

1. Owner is E18, E19, E20, E21, or Future backlog, or
2. Closing it would require productization beyond governance, or
3. Evidence is explicitly insufficient and Architecture owner chooses deferral,
   or
4. It is listed in Architecture Decision Summary “must remain deferred”.

**Binding keep-open set:**

- All E19 operational residuals (Kill Switch policy; recovery status API;
  Incident productization; auth leftovers; `readRisk` view)
- E18 / ADL-009 consumer coverage
- ADL-010 / ADL-011 / ADL-012
- Future backlog Order-proposal and stage-cache durability
- Opportunistic unused Incident `reasonClass` call-sites (non-blocker)
- Full RC-18 Release Review / epic exits

**ADL-014 rule:** If graceful-shutdown interpretation lacks dedicated mandatory
evidence beyond optional exploratory notes, US295 must **explicitly defer**
ADL-014 with TD pointer rather than imply ACCEPTED from US294 M-01…M-12 alone
(unless Architecture owner documents sufficiency).

**Provisional Incident rule:** Closing ADL-013 as ACCEPTED must retain
“provisional → E19 supersession without weakening fail-closed semantics”.

---

## 14. Documentation Requirements

US295 DoD requires consistent updates to:

| Document                                                                                    | Required update                                                        |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`docs/Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                             | ADL-008 disposition; ADL-013/ADL-014 dispositions; chronological table |
| [`rc-18-residual-register.md`](../rc-18-residual-register.md)                               | R6 Closed; related governance residual Closed; sequencing reminder     |
| [`technical-debt.md`](../technical-debt.md)                                                 | TD-036 ADL-008 row; header progress note                               |
| [`rc-18-tech-lead-decision-log.md`](../rc-18-tech-lead-decision-log.md)                     | US295 gate decision                                                    |
| [`project-status.md`](../project-status.md)                                                 | US295 status; allowed claim posture                                    |
| [`rc-18-release-planning.md`](../rc-18-release-planning.md)                                 | Progress table; next milestone; claim note                             |
| [`module-maturity.md`](../module-maturity.md)                                               | Recovery claim maturity language if present                            |
| [`story-id-allocation.md`](../story-id-allocation.md)                                       | US295 status                                                           |
| [`release-history.md`](../release-history.md) / roadmap / architecture snapshot / CHANGELOG | As required by residual DoD practice for governance close              |

Optional but recommended: short **US295 Release Acceptance note** linking
Evidence Package + ADL-008 ACCEPTED (or deferral) + claim matrix.

---

## 15. Technical Notes

Planning notes for Stage 3 governance execution. These cite existing authority;
they do **not** approve schema, APIs, or redesigns.

1. **Authority stack**  
   Stage 2 PROCEED → this specification → US294 Evidence Package → RIV/SIG →
   Mid-Release → E17 §11 ADL drafts → ADR-014 / ADR-018 #60.

2. **Preferred disposition**  
   With E1–E8 complete, **ADL-008 ACCEPTED** is the expected outcome. Accepted
   deferral is for Architecture/Release owner exception only.

3. **ADL-008 Decision source**  
   Start from E17 Spec §11 draft; update Story references to US240–US249 +
   US290–US294; cite Evidence Package; keep “no new BC” consequences.

4. **ADL-013**  
   Promote PROPOSED → ACCEPTED provisional→E19 per SIG-001 ownership, without
   inventing E19 UX.

5. **ADL-014**  
   Do not silently ACCEPTED from chaos matrix alone; apply Deferred Residual
   Rules unless Architecture owner documents sufficiency.

6. **No HOW prescription for docs tooling**  
   Exact markdown formatting follows existing ADL entry style.

7. **Living docs drift**  
   Some mid-release docs may still say “US294 open”; US295 docs sync corrects
   residual progress language — that is in Scope IN.

8. **No production code**  
   If a docs-only PR accidentally includes production code, reject for scope.

---

## 16. Testing Requirements

US295 is governance/docs; verification is review-based:

1. **Evidence gate checklist** — E1–E8 present before ACCEPTED.
2. **ADL consistency** — chronological table status matches entry bodies.
3. **Residual Register consistency** — R6 and related rows match ADL.
4. **Claim-language review** — status/release docs match §6.7.
5. **Scope discipline review** — no E19/E18/redesign absorption (AC-9).
6. **Regression of prior Stories** — no production behaviour change required;
   if any code touched, quality gates must pass and Architecture re-entry
   required (unexpected).
7. **Decision Log entry** — Tech Lead / Architecture outcome recorded.

No new chaos suite is required for US295 DoD.

---

## 17. Definition of Done

Story-level DoD only (not full RC-18 exit).

- [ ] This Story Specification accepted as governance/implementation authority
      for US295 (Tech Lead / Architecture owner approval)
- [ ] Architecture Decision Check (§3) accepted; ambiguities dispositioned
- [ ] AC-1…AC-11 satisfied with reviewable evidence
- [ ] Release Acceptance Criteria RAC-1…RAC-8 applied and documented
- [ ] Evidence Requirements E1–E8 verified (for ACCEPTED path)
- [ ] ADL-008 ACCEPTED **or** explicit accepted deferral recorded
- [ ] ADL-013 and ADL-014 dispositioned per Residual / Deferred rules
- [ ] Residual Register R6 Closed; related governance residual Closed
- [ ] TD-036 ADL-008 row updated
- [ ] Documentation Requirements completed
- [ ] Tech Lead Decision Log records US295 outcome + claim posture
- [ ] Allowed / forbidden release claims published
- [ ] Architecture Freeze intact (ADR-012…ADR-019 unchanged by this Story)
- [ ] No Recovery / Runtime / Incident / RecoveryState redesign
- [ ] No new bounded context / RecoveryCoordinator introduced
- [ ] Scope not expanded into E18 product delivery / E19 productization /
      future backlog
- [ ] Prior Story behaviour (US290–US294) unchanged
- [ ] Quality gates green for any docs/governance change set

**Not required for US295 DoD alone:** full RC-18 Release Review PASS; E18–E21
epic exits; E19 Kill Switch / Incident dashboard / recovery status API; new
chaos suites; Recovery/Runtime redesign.

---

## Architectural Ambiguities

Recorded before Story drafting; binding recommendations below. None reopen
Architecture Freeze.

| #   | Ambiguity                                                              | Recommendation                                                                                                                                |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | With R1–R5 Closed, is ACCEPTED mandatory or is deferral still allowed? | **ACCEPTED preferred.** Deferral remains lawful only as Architecture/Release owner explicit exception with blocked-claims list — not default. |
| A2  | Does US295 also close ADL-013 (SIG-001) or only ADL-008 (Stage 1 R6)?  | **Both:** ADL-008 primary; ADL-013 formal disposition required (ACCEPTED provisional→E19 preferred).                                          |
| A3  | Does US295 ACCEPTED imply ADL-014 ACCEPTED (E17 Exit #10)?             | **No auto-implication.** ACCEPTED only if Architecture owner documents sufficiency; otherwise **explicit defer** with TD.                     |
| A4  | Does US295 authorize full RC-18 PASS?                                  | **No.** Only production-recovery residual claim / R6 + sequencing toward E18.                                                                 |
| A5  | Is US294 SIGKILL-sim durable-store boundary sufficient for ACCEPTED?   | **Yes**, under already approved US294 NFR-2 / §10.2 — unless Architecture owner opens a new evidence residual.                                |
| A6  | Can production restart-safety PASS be claimed after accepted deferral? | **No** (§6.7).                                                                                                                                |
| A7  | Does closing R6 allow E18 start unconditionally?                       | **Residual sequencing gate yes** under RAC-7; thin parallel still needs Architecture Review proof per RC-18 §7.                               |
| A8  | Living docs still showing US294 “Open” — blocker for Spec?             | **No** for Spec drafting; **Yes** for US295 DoD docs sync.                                                                                    |
| A9  | Unused Incident `reasonClass` — must close in US295?                   | **No** — remains opportunistic non-blocker.                                                                                                   |
| A10 | Does ACCEPTED rewrite US248 historical AC #4 ownership?                | **No redesign of history.** Document that RC-18 reassigned ADL closure responsibility to US295 (already stated in US294 Technical Notes).     |

**Conclusion:** No new ADR required. Story Specification is ready for Tech Lead
review as governance authority after approval.

---

## References

Ordered by authority. This specification consolidates existing decisions; it
does not invent architecture.

| #   | Document                           | Path                                                                                                         |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | CANONICAL                          | [`../../CANONICAL.md`](../../CANONICAL.md)                                                                   |
| 2   | ADR Index                          | [`../../adr/README.md`](../../adr/README.md)                                                                 |
| 3   | ADR-012 Execution Architecture     | [`../../adr/ADR-012-execution-architecture.md`](../../adr/ADR-012-execution-architecture.md)                 |
| 4   | ADR-013 Event Processing Model     | [`../../adr/ADR-013-event-processing-model.md`](../../adr/ADR-013-event-processing-model.md)                 |
| 5   | ADR-014 Runtime Lifecycle          | [`../../adr/ADR-014-runtime-lifecycle.md`](../../adr/ADR-014-runtime-lifecycle.md)                           |
| 6   | ADR-018 Architectural Invariants   | [`../../adr/ADR-018-architectural-invariants.md`](../../adr/ADR-018-architectural-invariants.md)             |
| 7   | Architecture Decision Log          | [`../../Architecture/ADR/ADL.md`](../../Architecture/ADR/ADL.md)                                             |
| 8   | RC-18 Release Planning             | [`../rc-18-release-planning.md`](../rc-18-release-planning.md)                                               |
| 9   | RC-18 TD036 Epic Planning          | [`../rc-18-td036-epic-planning.md`](../rc-18-td036-epic-planning.md)                                         |
| 10  | RC-18 Stage 2 Architecture Review  | [`../rc-18-td036-stage2-architecture-review.md`](../rc-18-td036-stage2-architecture-review.md)               |
| 11  | E17 Runtime Recovery Specification | [`../epics/e17-runtime-recovery-specification.md`](../epics/e17-runtime-recovery-specification.md)           |
| 12  | US290–US294 Story Specs            | [`./`](.)                                                                                                    |
| 13  | US294 Evidence Package             | [`../rc-18-us294-chaos-restart-evidence.md`](../rc-18-us294-chaos-restart-evidence.md)                       |
| 14  | RIV-001                            | [`../rc-18-riv-001-recovery-integration-validation.md`](../rc-18-riv-001-recovery-integration-validation.md) |
| 15  | SIG-001                            | [`../rc-18-sig-001-safety-integration-validation.md`](../rc-18-sig-001-safety-integration-validation.md)     |
| 16  | Mid-Release Health Review          | [`../rc-18-mid-release-health-review.md`](../rc-18-mid-release-health-review.md)                             |
| 17  | Residual Register                  | [`../rc-18-residual-register.md`](../rc-18-residual-register.md)                                             |
| 18  | Tech Lead Decision Log             | [`../rc-18-tech-lead-decision-log.md`](../rc-18-tech-lead-decision-log.md)                                   |
| 19  | Technical Debt                     | [`../technical-debt.md`](../technical-debt.md)                                                               |
| 20  | Story ID Allocation                | [`../story-id-allocation.md`](../story-id-allocation.md)                                                     |

---

## Document lifecycle

```text
Architecture Decision Check
        ↓
Story Specification drafted (this document)
        ↓
Tech Lead / Architecture review
        ↓
APPROVED (possibly WITH MINOR CORRECTIONS)
        ↓
Stage 3 governance execution (ADL + docs + residual close)
        ↓
DoD COMPLETE → residual workstream exit → E18 sequencing
```

---

## Sign-off

| Role                        | Name / Status                 | Date       |
| --------------------------- | ----------------------------- | ---------- |
| Story Specification (docs)  | Drafted                       | 2026-08-10 |
| Architecture Decision Check | Complete (no new ADR)         | 2026-08-10 |
| Tech Lead review            | _(pending)_                   |            |
| Architecture owner          | _(assign)_                    |            |
| Stage 2 Architecture Review | PROCEED (binding constraints) | 2026-07-30 |

**Authority statement:** This document is the governance / release-acceptance
authority for US295 after Tech Lead / Architecture approval. Stage 3 execution
must realize the WHAT defined here under Architecture Freeze and Stage 2
PROCEED constraints. It does not prescribe HOW beyond ADL/docs/residual sync
patterns already used in RC-18, and it does not authorize Recovery, Runtime,
RecoveryState, or Incident redesign.

**Next step:** Tech Lead review of this Story Specification — then Stage 3
governance execution (ADL-008 ACCEPTED preferred).
