# RC-28 Epic Breakdown — Version 2 Stabilization & Conformance

**Document:** RC-28 Epic Breakdown  
**Status:** **CLOSED** (`v2.0.0`)  
**Date:** 2026-08-14  
**Nature:** Thin architectural epics. Each Epic must be independently reviewable. No new domains. No new APIs.

**Parent:** [RC-28 Implementation Plan](./rc-28-implementation-plan.md)  
**API:** [API Contract (conformance)](./rc-28-api-contract.md)  
**Integration:** [Integration Diagram](./rc-28-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md)  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessor:** [RC-27 CLOSED](./rc-27-closure-report.md)

---

## Release epic map

```text
Epic 1  Platform integration boundaries
  ↓
Epic 2  Cross-domain workflow verification
  ↓
Epic 3  Authority & ownership verification
  ↓
Epic 4  End-to-end scenario validation
  ↓
Epic 5  Performance, resilience, and compatibility
  ↓
Epic 6  Version 2 certification & release readiness
  ↓
Validation & Release  (separate task after Epics)
```

Each Epic must independently compile and pass its evidence/tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

RC-28 epics **verify**. They do not ship new product behaviour.

---

## Epic 1 — Platform integration boundaries

### Objective

Publish the frozen integration boundary map for the complete V2 platform: which modules own which edges, which ports are consumed, and which reverse edges are forbidden. No new modules. No ownership changes.

### Dependencies

- RC-19…RC-27 CLOSED
- Spec v2.0 §§5–7; Authority Matrix; Alias Dictionary; Cluster Isolation Invariants
- Implementation Plan §§3–5
- [API Contract](./rc-28-api-contract.md) frozen port inventory
- [Integration Diagram](./rc-28-integration-diagram.md)

### Definition of Done

- [x] Boundary catalog accepted: every RC-20…RC-27 module listed with owner, authority class, inbound consume, outbound consume.
- [x] Explicit: no new domain, SoT, or product port is introduced by this epic.
- [x] Forbidden reverse dependencies listed (Lake → Ledger; Reporting → cash SoT; AI → trade; Notification → control plane; Scope → Risk Decision; Orchestrator → Execution; Command Center cache → Session SoT).
- [x] Exchange Scope confirmed isolation-only; engines remain singleton.
- [x] Boundary tests / invariants compile and pass (docs + intended unit skeleton after kickoff).
- [x] Architecture Impact: none beyond already approved Spec modules.

**Epic 1 report:** [rc-28-epic1-platform-integration-boundaries.md](./rc-28-epic1-platform-integration-boundaries.md) (**approved**)  
**Boundary catalog:** [rc-28-epic1-integration-boundary-report.md](./rc-28-epic1-integration-boundary-report.md)  
**Boundary diagram:** [rc-28-epic1-boundary-diagram.md](./rc-28-epic1-boundary-diagram.md)

### Expected user value

Reviewers share one map of how V2 modules already connect — before any end-to-end scenario is run.

---

## Epic 2 — Cross-domain workflow verification

### Objective

Prove the declared consume edges actually compose: Library → Gate; Gate → Orchestrator / Deployment; Orchestrator → Session handoff intent; Session → Orders → Execution → Accounting; events → Lake; Lake → Reporting → AI → Notification; Command Center → Session / Risk command ports. No new orchestration logic.

### Dependencies

- Epic 1 accepted
- Closed ports from RC-21…RC-27 API contracts (inventory in [API Contract](./rc-28-api-contract.md))

### Definition of Done

- [x] Workflow matrix: each hop names the existing port, owner, and authority class.
- [x] Library eligibility / envelope consume verified without Library redesign.
- [x] Runtime Enforcement Gate consume verified fail-closed (no duplicate Gate).
- [x] Qualification / Profile / Market State / Orchestrator consume verified without ownership transfer.
- [x] Lake ingest/query consume verified projection-only.
- [x] Reporting / AI / Notification consume verified projection / narrative / delivery.
- [x] Command Center command routing verified via Session / Risk / Bot Facade — UI never SoT.
- [x] No REST / transport / persistence product; no new business rules.
- [x] Tests compile and pass independently of live exchange network.

**Epic 2 report:** [rc-28-epic2-cross-domain-workflow-verification.md](./rc-28-epic2-cross-domain-workflow-verification.md) (**approved**)  
**Workflow catalog:** [rc-28-epic2-workflow-verification-report.md](./rc-28-epic2-workflow-verification-report.md)

### Expected user value

Operators can trust that certified modules already call each other on the contracted edges — not through hidden bypasses.

---

## Epic 3 — Authority & ownership verification

### Objective

Prove every module remains the sole owner of its declared authority. Confirm Authority Matrix, Alias Dictionary, and Cluster Isolation Invariants without modifying those documents.

### Dependencies

- Epics 1–2 accepted
- Authority Matrix · Alias Dictionary · Isolation Invariants · Tactics Contract
- Closed predecessors RC-19…RC-27

### Definition of Done

- [x] Ownership table evidenced: Library ≠ Gate ≠ Session ≠ Orchestrator ≠ Risk ≠ Execution ≠ Ledger ≠ Lake ≠ Reporting ≠ AI ≠ Notification ≠ Command Center ≠ Scope.
- [x] Alias checks: Bot = Session; Cluster = Exchange Scope; Wallet = Trading Account; Brain = Orchestrator — no second aggregates.
- [x] Authority class checks: SoT / projection / policy input / narrative / command UI remain disjoint.
- [x] Isolation invariants 1–10 evidenced for ≥2 concurrent scopes (reuse RC-27 proof; do not redesign Scope).
- [x] Tactics Contract Option B: envelope still enforced at Gate / Deployment — not documentation-only.
- [x] No Authority Matrix or Alias Dictionary edits under this epic.
- [x] Conformance tests compile and pass.

**Epic 3 report:** [rc-28-epic3-authority-ownership-verification.md](./rc-28-epic3-authority-ownership-verification.md) (**approved**)  
**Authority catalog:** [rc-28-epic3-authority-verification-report.md](./rc-28-epic3-authority-verification-report.md)  
**Ownership catalog:** [rc-28-epic3-ownership-verification-report.md](./rc-28-epic3-ownership-verification-report.md)

### Expected user value

Reviewers can see that Version 2 did not grow a second brain, a second ledger, or a per-exchange engine farm.

---

## Epic 4 — End-to-end scenario validation

### Objective

Execute (at port/domain/test-harness level) the complete certified paths:

Research → Strategy Library → Runtime Enforcement → Trading Orchestrator → Trading Session → Orders → Execution → Accounting → Knowledge Lake → Reporting → AI Analytics → Notification Delivery → Command Center.

All paths remain within existing ownership boundaries.

### Dependencies

- Epics 1–3 accepted
- Implementation Plan §2.1 validation targets
- Integration Diagram §3

### Definition of Done

- [x] Trading-path scenario: certified strategy can be gated, coordinated, session-bound, and paper-executed without ownership steal.
- [x] Fail-closed scenario: uncertified / ineligible / missing-scope / Gate-reject paths never start Sessions or submit orders.
- [x] Reporting-path scenario: SoT events project to Lake and materialize as labeled report projections (no shadow balances).
- [x] Notification-path scenario: a completed report/alert can be delivered; no trading commands on the channel.
- [x] Knowledge Lake flow: append-only admit + query; Lake cannot override Orders / Ledger.
- [x] Command Center scenario: pause/stop/kill route to Session / Risk ports; UI cache never wins.
- [x] Isolation scenario: cross-scope fund / capacity / policy mixing rejected.
- [x] Scenarios use **existing** ports only; no new APIs.
- [x] Evidence recorded for Validation & Release (separate task).

**Epic 4 report:** [rc-28-epic4-end-to-end-scenario-validation.md](./rc-28-epic4-end-to-end-scenario-validation.md) (**approved**)  
**Scenario catalog:** [rc-28-epic4-scenario-validation-report.md](./rc-28-epic4-scenario-validation-report.md)

### Expected user value

The platform can demonstrate one complete paper journey from research evidence to ops visibility without inventing a new path.

---

## Epic 5 — Performance, resilience, and compatibility

### Objective

Harden Version 2 by verifying resilience and compatibility of the **existing** platform: fail-closed behaviour under missing dependencies, Exchange Scope isolation under concurrent scopes, cross-module compatibility, dependency-graph integrity, and version compatibility of RC-19…RC-27 contracts. No new runtime. No performance product.

### Dependencies

- Epic 4 accepted
- Frozen paper path ADR-012…018
- Cluster Isolation Invariants

### Definition of Done

- [x] Resilience: missing Gate / missing scope / missing Library record / Lake query miss fail closed or empty — never invent SoT.
- [x] Isolation: concurrent scopes do not leak funds, capacity, or policy.
- [x] Compatibility: closed RC-19…RC-27 ports remain callable with documented keys (`workspaceId`, `exchangeScopeId`, `tradingSessionId`, `libraryEntryId`).
- [x] Dependency graph: declared consume edges present; forbidden reverse edges absent (static/contract tests).
- [x] Version compatibility: Spec v2.0 module list matches shipped owners; no orphan modules; no extra SoT.
- [x] Paper Freeze preserved; live capital still unauthorized.
- [x] No new orchestration, caching SoT, or transport product.
- [x] Suite compiles and passes independently of live venue networks.

**Epic 5 report:** [rc-28-epic5-performance-resilience-compatibility.md](./rc-28-epic5-performance-resilience-compatibility.md) (**approved**)  
**Compatibility catalog:** [rc-28-epic5-compatibility-verification-report.md](./rc-28-epic5-compatibility-verification-report.md)  
**Performance & resilience catalog:** [rc-28-epic5-performance-resilience-report.md](./rc-28-epic5-performance-resilience-report.md)

### Expected user value

Version 2 remains trustworthy when a dependency is absent or a second venue is active — it refuses unsafe work instead of guessing.

---

## Epic 6 — Version 2 certification & release readiness

### Objective

Produce internal audit, residual register, and Version 2 certification readiness. No Spec rewrite. No new capabilities under the label “conformance.”

### Dependencies

- Epics 1–5 accepted
- Engineering Workflow Standard v1.0 Validation stage
- Closed predecessors RC-19…RC-27

### Definition of Done

- [x] Internal audit: architecture / ownership / isolation / fail-closed / projection-non-SoT **PASS**.
- [x] Readiness report: paper-first Version 2 ready for Validation & Release (separate task).
- [x] Residual/deferred register updated (IDE shell, REST products, durable stores where still process-local, live capital, US295/ADL-008, additional venue adapters).
- [x] Confirmation: no new APIs, modules, domains, SoT, or ownership changes in RC-28.
- [x] Confirmation: Architecture Spec v2.0, Authority Matrix, and Alias Dictionary unmodified.
- [x] No implementation of forbidden items under “certification.”

**Epic 6 report:** [rc-28-epic6-version-2-certification.md](./rc-28-epic6-version-2-certification.md) (**approved**)  
**Internal audit:** [rc-28-epic6-internal-audit-report.md](./rc-28-epic6-internal-audit-report.md) (**PASS**)  
**Readiness:** [rc-28-epic6-readiness-report.md](./rc-28-epic6-readiness-report.md) (**READY**)

### Expected user value

Reviewers can approve Version 2 as a stable paper-first platform knowing RC-28 certified the assembled system instead of expanding it.

---

## Epic sequencing rules

1. No Epic starts before plan approval.
2. Epic _N+1_ does not start until Epic _N_ DoD is met (or explicitly gated by human review).
3. Each Epic must independently compile and pass its tests / evidence pack.
4. Story IDs allocated only after plan approval.
5. Validation & Release is a **separate** task after Epic 6 readiness.
6. Epics may add tests, fixtures, and evidence documents. They must not add product ports or modules.

---

## STOP gate

**STOP.** RC-28 is **CLOSED** at tag `v2.0.0`. Version 2 is officially complete (paper-first).
