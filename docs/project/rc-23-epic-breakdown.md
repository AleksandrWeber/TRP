# RC-23 Epic Breakdown — Runtime Enforcement

**Document:** RC-23 Epic Breakdown  
**Status:** CLOSED — Epics 1–6 complete; validation PASS · tag `v1.0.0-rc23`
**Date:** 2026-08-10  
**Nature:** Thin architectural epics.

**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md)  
**API:** [API Contract](./rc-23-api-contract.md)  
**Enforcement:** [Runtime Enforcement Contract](./rc-23-runtime-enforcement-contract.md)  
**Integration:** [Integration Diagram](./rc-23-runtime-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §5.6, §8  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessor:** [RC-22 CLOSED](./rc-22-closure-report.md) — Library domain complete; bind enforcement deferred

---

## Release epic map

```text
Epic 1  Runtime Enforcement boundary + ownership
  ↓
Epic 2  Library read consumption (Lookup / Eligibility / related reads)
  ↓
Epic 3  Runtime Enforcement Gate (validation sequence)
  ↓
Epic 4  Strategy Deployment bind enforcement
  ↓
Epic 5  Trading Session start refusal on FAIL
  ↓
Epic 6  Fail-closed coverage + RC-23 close readiness
```

Each Epic must independently compile and pass tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Runtime Enforcement boundary + ownership

### Objective

Establish the Runtime Enforcement module boundary and publish hard ownership vs Strategy Library, Strategy Deployment, Trading Session, Knowledge Lake, and future Orchestrator.

### Dependencies

- RC-22 CLOSED; Spec §5.2 / §5.6; Authority Matrix; Alias Dictionary
- Implementation Plan §§3–6; Runtime Enforcement Contract § Ownership

### Definition of Done

- [x] Module/boundary named and documented (canonical: **Runtime Enforcement** — not Orchestrator, not Selector).
- [x] Ownership table accepted: Library remains certification/eligibility SoT; Enforcement = Gate only; Session = lifecycle SoT.
- [x] Explicit: Runtime never owns certification; Runtime never selects strategies.
- [x] Forbidden dependencies listed (no Lake-as-authority, no Library write from Session, no Orchestrator/Market State).
- [x] Boundary tests / invariants compile and pass (including “validates ≠ decides”).
- [x] Architecture Impact: no new Spec concepts beyond already approved modules.

**Epic 1 report:** [rc-23-epic1-runtime-enforcement-boundary.md](./rc-23-epic1-runtime-enforcement-boundary.md)

### Expected user value

Shared vocabulary: deployment may proceed only after Library-backed verification — without confusing validation with selection.

---

## Epic 2 — Library read consumption

### Objective

Activate the application-level **read** ports Runtime Enforcement needs to resolve Strategy Library SoT facts (Lookup, Eligibility, and related certification/envelope reads). No certification write. No Session wiring yet if gated behind Epic 3.

### Dependencies

- Epic 1 accepted
- RC-22 Domain Model (Strategy, Version, Certification, Envelope, Eligibility)
- RC-22 API Contract Lookup + Eligibility ports (read side)
- RC-23 API Contract § Library consumer ports

### Definition of Done

- [x] Read ports resolve: Strategy exists, StrategyVersion exists, Certification status, StrategyEligibility, Library Tactical Envelope.
- [x] Reads address **Library SoT** — not Knowledge Lake, not UI cache, not Session stub as authority.
- [x] No Registration / Certification / Lifecycle **write** ports required for RC-23 enforcement path.
- [x] Unit/integration tests for found / not-found / inactive certification / missing eligibility / missing envelope.
- [x] No change to Orders / Risk / Execution / Ledger / Recovery algorithms.
- [x] No Trading Orchestrator or Market State modules introduced.

**Epic 2 report:** [rc-23-epic2-strategy-library-read-integration.md](./rc-23-epic2-strategy-library-read-integration.md)

### Expected user value

Enforcement can ask the Library authoritative questions without inventing a second membership store.

---

## Epic 3 — Runtime Enforcement Gate

### Objective

Implement the Runtime Enforcement Gate per Enforcement Contract: ordered validation sequence, PASS/FAIL, deterministic rejection reasons. Still no Deployment/Session product hook if gated — gate must be callable and tested in isolation.

### Dependencies

- Epic 2 read ports
- Runtime Enforcement Contract (inputs / outputs / sequence / reasons)
- API Contract `RuntimeEnforcementPort`

### Definition of Done

- [x] `RuntimeEnforcementPort.validateDeployment(...)` (or equivalent) implements the locked sequence.
- [x] Checks all five requirements: Strategy, StrategyVersion, Active Certification, StrategyEligibility, Library Tactical Envelope.
- [x] PASS only when all requirements succeed.
- [x] FAIL returns deterministic machine-readable reason codes (contract catalog).
- [x] Tests: happy path; each single-point failure; ordered short-circuit or full reason policy as contracted.
- [x] Gate does not certify, deprecate, select, mutate envelopes, or call Risk/Orders.
- [x] Compiles and passes tests independently of Session start wiring.

**Epic 3 report:** [rc-23-epic3-runtime-validation-gate.md](./rc-23-epic3-runtime-validation-gate.md)

### Expected user value

One reusable fail-closed verifier: either the strategy is Library-permitted, or deployment is refused with a clear reason.

---

## Epic 4 — Strategy Deployment bind enforcement

### Objective

Hook the existing Strategy Deployment bind path so a new bind cannot complete without Runtime Enforcement PASS. On FAIL, deployment is rejected with contracted reasons. No Paper Trading redesign.

### Dependencies

- Epic 3 Gate
- Existing Strategy Deployment module (consume only)
- Alias: Mission ≡ Deployment

### Definition of Done

- [x] Deployment bind/create path invokes Runtime Enforcement before binding succeeds.
- [x] FAIL ⇒ bind rejected; no Session-startable deployment created (or equivalent fail-closed semantics).
- [x] PASS ⇒ existing bind behaviour continues (no selection logic added).
- [x] Tests: eligible certified member binds; each enforcement failure rejects bind.
- [x] Deployment still does not own certification or eligibility SoT.
- [x] No Orchestrator / Market State / Selection.

**Epic 4 report:** [rc-23-epic4-deployment-runtime-binding.md](./rc-23-epic4-deployment-runtime-binding.md)

### Expected user value

Uncertified or ineligible versions cannot enter the production binding surface.

---

## Epic 5 — Trading Session start refusal

### Objective

Ensure Trading Session start (arm/start on the existing flow) proceeds only when enforcement has PASSed for the bound deployment. FAIL or missing enforcement ⇒ deployment/start rejected. Session lifecycle ownership unchanged.

### Dependencies

- Epic 4 Deployment enforcement
- Existing Trading Session lifecycle (ADR-014)
- Alias: Bot ≡ Session

### Definition of Done

- [x] Session start path requires prior/current Runtime Enforcement PASS for the deployment under start.
- [x] FAIL ⇒ start refused; deterministic reasons surfaced to caller.
- [x] PASS ⇒ Session starts via existing lifecycle — no algorithm inventiveness.
- [x] Tests: PASS starts; FAIL refuses; deprecated/archived/missing eligibility refuse.
- [x] Session never writes Library certification; no reverse dependency introduced.
- [x] Paper adapter / Risk / Orders / Execution ownership unchanged.

**Epic 5 report:** [rc-23-epic5-trading-session-start-protection.md](./rc-23-epic5-trading-session-start-protection.md)

Note: deprecated/archived/missing eligibility are refused at **Deployment bind** (Epic 4 Gate). Epic 5 refuses start when the prior PASS stamp is missing/invalid — Session does not re-evaluate Library eligibility.

### Expected user value

Paper Trading Sessions run only Library-permitted strategies — Spec §8 “certified only” becomes runtime truth.

---

## Epic 6 — Fail-closed coverage + RC-23 close readiness

### Objective

Complete rejection-reason coverage, hardening tests, residual/deferred register, and readiness for Validation & Release (Validation & Release may remain a separate task if process requires).

### Dependencies

- Epics 1–5 Done
- Implementation Plan §8; Enforcement Contract reason catalog; Validation Summary gates

### Definition of Done

- [x] Full reason-code matrix covered by tests (contract catalog).
- [x] Soft-fail / warn-only paths absent (fail-closed proven).
- [x] Lake-as-authority and Runtime-owned-certification paths absent (forbidden-edge tests or boundary asserts).
- [x] Residual / deferred register: Orchestrator, Market State, Selection, Reporting, AI, Multi-X, Nest write ports beyond reads, REST/UI.
- [x] Architecture Impact statement: no Spec rewrite; no new global SoT.
- [x] RC-23 Closure Report + Validation PASS — **separate Validation & Release task** (not performed in Epic 6).
- [x] Implementation Plan DoD for enforcement path complete at epic level.

**Deliverables:** [Epic 6 Report](./rc-23-epic6-authority-conformance.md) · [Internal Audit](./rc-23-epic6-internal-audit-report.md) · [Readiness](./rc-23-epic6-readiness-report.md)

### Expected user value

Operators and reviewers can trust refusals: deterministic, complete, and constitutionally aligned.

---

## Cross-epic constraints

| Constraint                                         | Applies to |
| -------------------------------------------------- | ---------- |
| No architecture redesign / Spec rewrite            | All        |
| No Trading Orchestrator / Market State / Selection | All        |
| No Reporting / AI / Multi Exchange                 | All        |
| No Paper Trading product redesign                  | Epics 4–5  |
| No live parameter mutation / envelope expansion    | All        |
| No Lake as eligibility / enforcement authority     | Epics 2–5  |
| Runtime never owns certification                   | All        |
| Frozen path algorithms unchanged                   | Epics 4–6  |
| Each epic independently compiles + passes tests    | All        |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
