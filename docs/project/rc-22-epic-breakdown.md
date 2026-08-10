# RC-22 Epic Breakdown — Strategy Library

**Document:** RC-22 Epic Breakdown  
**Status:** Epic 6 implemented — awaiting review (domain complete; Validation & Release separate)  
**Date:** 2026-08-10  
**Nature:** Implementation in progress (thin Epics). Planning package approved.

**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md)  
**Domain:** [Domain Model Contract](./rc-22-domain-model-contract.md)  
**API:** [API Contract](./rc-22-api-contract.md)  
**Integration:** [Integration Diagram](./rc-22-strategy-library-integration.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §8  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Epic 1:** [Strategy Library Boundary](./rc-22-epic1-strategy-library-boundary.md) · [Boundary Diagram](./rc-22-epic1-boundary-diagram.md)  
**Epic 2:** [Strategy Domain Model](./rc-22-epic2-strategy-domain-model.md) · [Ownership Decision Table](./rc-22-epic2-ownership-decision-table.md)  
**Epic 3:** [Certification & Evidence](./rc-22-epic3-strategy-certification.md) · [Certification Policy](./rc-22-epic3-certification-policy.md) · [Domain Model Evolution](./rc-22-epic3-domain-model-evolution.md)  
**Epic 4:** [Tactical Envelope Binding](./rc-22-epic4-tactical-envelope-binding.md) · [Envelope Contract](./rc-22-epic4-tactical-envelope-contract.md) · [Certification Coverage](./rc-22-epic4-certification-coverage-report.md)  
**Epic 5:** [Eligibility Gate](./rc-22-epic5-eligibility-gate.md) · [Eligibility Policy](./rc-22-epic5-eligibility-policy.md) · [Traceability](./rc-22-epic5-strategy-traceability-report.md)  
**Epic 6:** [Lifecycle / Audit](./rc-22-epic6-lifecycle-deprecation-archive.md) · [Lifecycle Policy](./rc-22-epic6-lifecycle-policy.md) · [Internal Audit](./rc-22-epic6-internal-audit-report.md) · [Readiness](./rc-22-epic6-strategy-readiness-report.md)

---

## Release epic map

Thin architectural epics (suggested direction retained; naming aligned to Spec):

```text
Epic 1  Library boundary + ownership
  ↓
Epic 2  Strategy model
  ↓
Epic 3  Certification & Evidence
  ↓
Epic 4  Tactical Envelope binding
  ↓
Epic 5  Eligibility Gate
  ↓
Epic 6  Deprecation / Archive / RC-22 close
```

Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Library boundary + ownership

**Status:** Implemented — awaiting review ([report](./rc-22-epic1-strategy-library-boundary.md))

### Objective

Establish the Strategy Library module boundary and publish hard ownership vs Strategy registry, Research Lab, Trading Session, Knowledge Lake, and future Orchestrator.

### Dependencies

- RC-19 CLOSED; RC-21 Knowledge Lake CLOSED
- Spec §5.1–5.2; Authority Matrix; Alias Dictionary
- Implementation Plan §§3–4

### Definition of Done

- [x] Module/boundary named and documented (canonical: Strategy Library — not “Bot library”).
- [x] Ownership table accepted: registry ≠ Library SoT; Lake ≠ Library SoT; Session ≠ certification authority.
- [x] Classification matrix published (research / experimental / certified / deprecated / archived).
- [x] Explicit: registry `active` ≠ certified.
- [x] Forbidden dependencies listed (no Orchestrator build, no Paper redesign, no Lake as eligibility SoT).
- [x] Architecture Impact: no new Spec concepts beyond §5.2 already approved.

### Expected user value

One shared vocabulary for trust: experiment vs certified membership — without mistaking Lab success for Library admission.

---

## Epic 2 — Strategy model

**Status:** Implemented — awaiting review ([report](./rc-22-epic2-strategy-domain-model.md))

### Objective

Realize the canonical Strategy + Strategy Version model per Domain Model Contract (identity, versioning, immutability invariants) as Library SoT — without certification admission yet if gated, or with dormant status fields ready for Epic 3.

### Dependencies

- Epic 1 accepted
- Domain Model Contract §§Strategy, Strategy Version
- RC-19 Exchange Scope identity for allowlist fields

### Definition of Done

- [x] Domain entities cover family identity, version, content hash, market/universe, exchange scopes, timeframes.
- [x] Uniqueness: `strategyFamilyId + version`; immutable `contentHash` after certification insert.
- [x] Persistence/port boundary owned by Library (no overload onto Session or Lake).
- [x] Unit tests for immutability invariants (no mutate-content APIs).
- [x] No change to Orders / Risk / Execution / Ledger / Recovery.

### Expected user value

The platform can identify “this exact algorithm version” independently of editable Lab configs.

---

## Epic 3 — Certification & Evidence

**Status:** Implemented — awaiting review ([report](./rc-22-epic3-strategy-certification.md))

### Objective

Implement admission: Validation evidence refs + human certification decision → Library membership. Lab never side-effects eligibility.

### Dependencies

- Epic 2 model
- Research Lab backtest + walk-forward result identities (Monte Carlo ref optional)
- API Contract: Registration + Certification ports
- Domain Model: Certification, Evidence

### Definition of Done

- [x] Domain certification creates Library admission records only with required evidence refs + frozen version identity.
- [x] Backtest and walk-forward refs required; Monte Carlo / paper-trading / statistical-validation allowed.
- [x] Lab modules remain evidence producers; they do not silently flip Library status (no Research ownership change).
- [x] Failed / incomplete validation cannot certify (missing required evidence rejected).
- [x] Human `certifiedBy` required (AI cannot auto-admit).
- [x] Tests: admit with valid refs; reject missing refs; reject duplicate active certification; never mutate StrategyVersion.
- [ ] Application CertificationPort / Registration workflow — **deferred** (Epic 3 = domain model per task).
- [ ] Envelope required at certify — **deferred** (Epic 4).
- [ ] Optional Lake admit of certification fact — **deferred** (no Lake ownership changes in Epic 3).
- [x] Lifecycle docs: status vocabulary reserved; transitions deferred to Epic 6; Spec §8 order preserved.

### Expected user value

Membership is earned through an explicit, evidence-linked gate — profitability alone never certifies.

---

## Epic 4 — Tactical Envelope binding

**Status:** Implemented — awaiting review ([report](./rc-22-epic4-tactical-envelope-binding.md))

### Objective

Bind a machine-readable Tactical Envelope to each certified version (Tactics Contract Option B). Library is SoT; RC-19 Session stub is non-authoritative.

### Dependencies

- Epics 2–3
- RC-19 Epic 3 envelope structural stub
- Tactics Contract; Domain Model envelope section

### Definition of Done

- [x] Certification requires structurally valid envelope.
- [x] Envelope covers allowlisted symbols/timeframes and certified tactical ranges/sets.
- [x] Library owns envelope body; Deployment/Session may ref/snapshot — never invent.
- [x] Envelope expansion ⇒ new certified version / new certification (no in-place enlarge).
- [x] Tests: reject certify without envelope; reject mutate in place.

### Expected user value

Operators know the allowed tactic space before any Session uses the strategy — tactics stay inside pre-validated limits.

---

## Epic 5 — Eligibility Gate

**Status:** Implemented — awaiting review ([report](./rc-22-epic5-eligibility-gate.md))

### Objective

Expose and enforce the Eligibility port: only Library members with status `certified` may enter **new** production bindings (Deployment / Session bind points). Reject experimental, unknown, deprecated, archived, and out-of-envelope tactic params.

### Dependencies

- Epics 2–4
- Existing Strategy Deployment + Trading Session bind surfaces (consume only)
- API Contract Eligibility port

### Definition of Done

- [x] Domain `evaluateStrategyEligibility` / `createStrategyEligibility` requires active certification + evidence + envelope.
- [x] Uncertified / missing certification ⇒ ineligible.
- [x] Deprecated and archived rejected.
- [x] Out-of-envelope tactic parameters rejected at domain eligibility check.
- [x] Risk Engine still mandatory conceptually — eligibility ≠ risk approval (documented).
- [x] Tests: certified happy path; reject uncertified / missing evidence / missing envelope / envelope violation; no certification mutation.
- [x] **No** Paper Trading redesign; **no** Orchestrator; **no** Session wiring in Epic 5 (domain gate only per task).
- [ ] Application EligibilityPort + Deployment/Session bind consumption — **deferred** (no runtime integration yet).

### Expected user value

The platform fails closed: unproven or withdrawn versions cannot enter the production path.

---

## Epic 6 — Deprecation / Archive / RC-22 close

**Status:** Implemented — awaiting review ([report](./rc-22-epic6-lifecycle-deprecation-archive.md)); Validation & Release = separate task

### Objective

Complete lifecycle controls (deprecate, archive) without history rewrite; close RC-22 against Implementation Plan acceptance criteria.

### Dependencies

- Epics 1–5 Done
- Implementation Plan §7; Domain Model lifecycle; API archive/deprecation ports

### Definition of Done

- [x] `certified → deprecated` with reason + actor + timestamp (lifecycle record + snapshot).
- [x] `deprecated → archived` (and `certified → archived`) with retention semantics.
- [x] Archived/deprecated readable for audit; content hash unchanged; no delete-as-deprecation.
- [x] Immutability tests for certified content and envelopes across transitions.
- [x] Lake projections for deprecate/archive — deferred optional; Lake remains non-authoritative.
- [x] Residual / deferred register documented (Internal Audit / Readiness).
- [ ] RC-22 Closure Report + Validation PASS — **separate Validation & Release task**.
- [x] Domain portion of Implementation Plan DoD for lifecycle complete; full RC close deferred.

### Expected user value

Trust compounds: certified history stays honest; withdrawals are explicit; the release closes without a fake Library that does not gate use.

---

## Cross-epic constraints

| Constraint                                      | Applies to        |
| ----------------------------------------------- | ----------------- |
| No architecture redesign / Spec rewrite         | All               |
| No new global modules beyond Strategy Library   | All               |
| No Bot aggregate / second runtime               | Especially Epic 5 |
| No Trading Orchestrator / Market State products | All               |
| No Paper Trading redesign                       | Epic 5            |
| No Reporting / AI                               | All               |
| No Lake as eligibility SoT                      | Epics 3, 5, 6     |
| Monte Carlo engine not in scope                 | Epic 3 (nullable) |
| Frozen path algorithms unchanged                | Epic 5–6          |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
