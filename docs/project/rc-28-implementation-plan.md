# RC-28 Implementation Plan — Version 2 Stabilization & Conformance

**Document:** RC-28 Implementation Plan  
**Status:** **CLOSED** (`v2.0.0`)  
**Date:** 2026-08-14  
**Nature:** Final Version 2 stabilization and conformance. No Spec rewrite. No new business domains. No new platform capabilities.

**Authority inputs:**

| Input                                                                       | Role                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (complete V2 module set; §6 Data Flow; §7 Decision Flow; §11 Future Evolution) |
| [Authority Matrix](./v2-authority-matrix.md)                                | Unchanged SoT / projection / policy-input / narrative classes                               |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Unchanged product ↔ canonical mapping                                                       |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)        | Shared engines; isolated resources/policies; fail-closed ambiguity                          |
| [Tactics Contract](./v2-tactics-contract.md)                                | Envelope enforcement remains Option B; no tactics redesign                                  |
| [RC-27 Closure](./rc-27-closure-report.md) (**CLOSED**)                     | Multi-Exchange Scope certified; last capability RC before this package                      |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → thin Epics → review → validation → release                            |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | RC-28 theme: V2 stabilization / Version 2 release candidate                                 |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-28-epic-breakdown.md`](./rc-28-epic-breakdown.md)                                                                        |
| API Contract (conformance)      | [`rc-28-api-contract.md`](./rc-28-api-contract.md)                                                                            |
| Integration Diagram             | [`rc-28-integration-diagram.md`](./rc-28-integration-diagram.md)                                                              |
| Validation Summary              | [`rc-28-validation-summary.md`](./rc-28-validation-summary.md)                                                                |
| Architecture Consistency Report | [`rc-28-architecture-consistency-report.md`](./rc-28-architecture-consistency-report.md)                                      |
| Epic 1 Report                   | [`rc-28-epic1-platform-integration-boundaries.md`](./rc-28-epic1-platform-integration-boundaries.md) (**approved**)           |
| Epic 1 Boundary Catalog         | [`rc-28-epic1-integration-boundary-report.md`](./rc-28-epic1-integration-boundary-report.md)                                  |
| Epic 1 Boundary Diagram         | [`rc-28-epic1-boundary-diagram.md`](./rc-28-epic1-boundary-diagram.md)                                                        |
| Epic 2 Report                   | [`rc-28-epic2-cross-domain-workflow-verification.md`](./rc-28-epic2-cross-domain-workflow-verification.md) (**approved**)     |
| Epic 2 Workflow Catalog         | [`rc-28-epic2-workflow-verification-report.md`](./rc-28-epic2-workflow-verification-report.md)                                |
| Epic 3 Report                   | [`rc-28-epic3-authority-ownership-verification.md`](./rc-28-epic3-authority-ownership-verification.md) (**approved**)         |
| Epic 3 Authority Catalog        | [`rc-28-epic3-authority-verification-report.md`](./rc-28-epic3-authority-verification-report.md)                              |
| Epic 3 Ownership Catalog        | [`rc-28-epic3-ownership-verification-report.md`](./rc-28-epic3-ownership-verification-report.md)                              |
| Epic 4 Report                   | [`rc-28-epic4-end-to-end-scenario-validation.md`](./rc-28-epic4-end-to-end-scenario-validation.md) (**approved**)             |
| Epic 4 Scenario Catalog         | [`rc-28-epic4-scenario-validation-report.md`](./rc-28-epic4-scenario-validation-report.md)                                    |
| Epic 5 Report                   | [`rc-28-epic5-performance-resilience-compatibility.md`](./rc-28-epic5-performance-resilience-compatibility.md) (**approved**) |
| Epic 5 Compatibility Catalog    | [`rc-28-epic5-compatibility-verification-report.md`](./rc-28-epic5-compatibility-verification-report.md)                      |
| Epic 5 Performance & Resilience | [`rc-28-epic5-performance-resilience-report.md`](./rc-28-epic5-performance-resilience-report.md)                              |
| Epic 6 Report                   | [`rc-28-epic6-version-2-certification.md`](./rc-28-epic6-version-2-certification.md) (**approved**)                           |
| Epic 6 Internal Audit           | [`rc-28-epic6-internal-audit-report.md`](./rc-28-epic6-internal-audit-report.md) (**PASS**)                                   |
| Epic 6 Readiness                | [`rc-28-epic6-readiness-report.md`](./rc-28-epic6-readiness-report.md) (**READY** — consumed)                                 |
| Validation Report               | [`rc-28-validation-report.md`](./rc-28-validation-report.md) (**PASS**)                                                       |
| Version 2 Certification         | [`rc-28-version-2-certification.md`](./rc-28-version-2-certification.md) (**READY = YES**)                                    |
| Closure Report                  | [`rc-28-closure-report.md`](./rc-28-closure-report.md) (**CLOSED**)                                                           |

No Domain Model Contract is produced. RC-28 introduces **no** entities, **no** Source of Truth, and **no** ownership changes.

---

## 0. Sequencing (governance)

| RC        | Theme                                           | Status                     |
| --------- | ----------------------------------------------- | -------------------------- |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade     | **CLOSED**                 |
| **RC-20** | Command Center foundation                       | **CLOSED**                 |
| **RC-21** | Knowledge Lake (projection)                     | **CLOSED** (`v1.0.0-rc21`) |
| **RC-22** | Strategy Library + Tactical Envelope (domain)   | **CLOSED** (`v1.0.0-rc22`) |
| **RC-23** | Runtime Enforcement                             | **CLOSED** (`v1.0.0-rc23`) |
| **RC-24** | Reporting, AI Analytics & Notification Delivery | **CLOSED** (`v1.0.0-rc24`) |
| **RC-25** | Market Qualification + Market Profile           | **CLOSED** (`v1.0.0-rc25`) |
| **RC-26** | Trading Orchestrator + Market State             | **CLOSED** (`v1.0.0-rc26`) |
| **RC-27** | Multi-Exchange Scope                            | **CLOSED** (`v1.0.0-rc27`) |
| **RC-28** | **Version 2 Stabilization & Conformance**       | **CLOSED** (`v2.0.0`)      |

| Effect                                 | Disposition                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| Command Center                         | CLOSED as RC-20 — **verify** ops surface; do not redesign UI                         |
| Knowledge Lake                         | CLOSED as RC-21 — **verify** projection flow; never Lake-as-SoT                      |
| Strategy Library                       | CLOSED as RC-22 — **verify** certification / eligibility / envelope consume          |
| Runtime Enforcement                    | CLOSED as RC-23 — **verify** fail-closed Gate; do not replace or soft-fail           |
| Reporting / AI / Notify                | CLOSED as RC-24 — **verify** projection / narrative / delivery; no shadow accounting |
| Market Qualification                   | CLOSED as RC-25 — **verify** research SoT consume; confidence never forces trades    |
| Market Profile                         | CLOSED as RC-25 — **verify** versioned profiles; never execution SoT                 |
| Market State                           | CLOSED as RC-26 — **verify** current-condition SoT; not Qualification                |
| Trading Orchestrator                   | CLOSED as RC-26 — **verify** coordination SoT; never Orders / Risk / Execution       |
| Exchange Scope                         | CLOSED as RC-27 — **verify** isolation; never a business authority                   |
| Trading Session                        | Existing SoT — Sessions remain lifecycle SoT                                         |
| Risk / Orders / Execution / Accounting | Freeze ADR-012…018 — **untouched** engines; verify scoped path                       |
| Architecture Spec v2.0                 | **Unchanged**                                                                        |
| Authority Matrix / Alias               | **Unchanged**                                                                        |

---

## 1. Purpose

Validate, integrate, certify, and harden the **complete Version 2 platform** assembled across RC-19…RC-27.

RC-28 answers:

> Does the certified V2 module set interact as one platform — within existing ownership, existing ports, and existing isolation — so Version 2 can be declared stable (paper-first)?

**RC-28 certifies Version 2. It does not expand it.**

No new platform capabilities. Only:

- integration;
- validation;
- stabilization;
- certification.

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

RC-28 verifies the complete interaction of:

| Module                          | Closed owner RC | RC-28 action                                     |
| ------------------------------- | --------------- | ------------------------------------------------ |
| Command Center                  | RC-20           | Verify ops projection + command routing          |
| Knowledge Lake                  | RC-21           | Verify append-only projection + query consume    |
| Strategy Library                | RC-22           | Verify certification / eligibility / envelope    |
| Runtime Enforcement             | RC-23           | Verify fail-closed Gate                          |
| Reporting                       | RC-24           | Verify projection reports (no shadow ledger)     |
| AI Analytics                    | RC-24           | Verify narrative-only explanations               |
| Notification Delivery           | RC-24           | Verify delivery-only routing                     |
| Market Qualification            | RC-25           | Verify research pipeline consume                 |
| Market Profile                  | RC-25           | Verify versioned confidence artifacts            |
| Market State                    | RC-26           | Verify current-condition classification consume  |
| Trading Orchestrator            | RC-26           | Verify coordination + Session handoff **intent** |
| Exchange Scope                  | RC-27           | Verify isolation + scope keying                  |
| Trading Session                 | Existing        | Verify lifecycle SoT on the certified path       |
| Orders / Execution / Accounting | Existing        | Verify canonical paper path + scoped records     |

Validation targets (normative):

| Target                       | Meaning                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Complete trading path        | Research → Library → Gate → Orchestrator → Session → Orders → Execution → Accounting |
| Complete reporting path      | SoT events → Lake → Reporting → (optional) AI narrative                              |
| Complete notification path   | Report / alert projection → Notification Delivery → channel                          |
| Complete Knowledge Lake flow | Admit append-only; query read-only; never SoT                                        |
| Runtime fail-closed          | Missing / invalid Gate evidence rejects — never soft-pass                            |
| Exchange Scope isolation     | Cross-scope funds / capacity / policy fail-closed                                    |
| Cross-module compatibility   | Closed contracts still compose; no ownership steal                                   |
| Dependency graph             | Declared consume edges exist; forbidden reverse edges absent                         |
| Version compatibility        | RC-19…RC-27 artifacts remain compatible with Spec v2.0                               |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-28                             | Owner / later                |
| ---------------------------------------------- | ---------------------------- |
| New business domains                           | Forever forbidden in this RC |
| New Source of Truth                            | Existing owners remain       |
| Ownership changes                              | Authority Matrix unchanged   |
| Authority Matrix modifications                 | Forbidden                    |
| Alias Dictionary modifications                 | Forbidden                    |
| New APIs / new product ports                   | Existing contracts frozen    |
| New modules                                    | Forbidden                    |
| Runtime redesign                               | RC-23 CLOSED                 |
| Strategy Library / Envelope redesign           | RC-22 CLOSED                 |
| Reporting / AI / Notification redesign         | RC-24 CLOSED                 |
| Multi-Exchange redesign                        | RC-27 CLOSED                 |
| New orchestration logic / business rules       | RC-26 CLOSED                 |
| Live capital enablement                        | Future ADR                   |
| IDE shell + Bot fleet UX                       | Deferred (RC-21 Plan §0)     |
| REST / transport / queue / persistence product | Out of this planning package |
| Architecture Spec v2.0 rewrite                 | Forbidden                    |

---

## 3. Behaviour (normative)

```text
Research
  ↓
Strategy Library
  ↓
Runtime Enforcement
  ↓
Trading Orchestrator
  ↓
Trading Session
  ↓
Orders
  ↓
Execution
  ↓
Accounting
  ↓
Knowledge Lake
  ↓
Reporting
  ↓
AI Analytics
  ↓
Notification Delivery
  ↓
Command Center
```

All hops remain inside **existing** ownership. Exchange Scope **keys** the trading path; it never becomes a hop that owns money, fills, risk, or strategy certification.

Reading under this plan:

1. **Research** produces evidence. It does not deploy capital.
2. **Strategy Library** is the sole certification / eligibility / envelope SoT.
3. **Runtime Enforcement** is the sole fail-closed Gate between Library and Deployment/Session.
4. **Trading Orchestrator** coordinates selection and Session handoff **intent** — never Orders, Risk Decisions, or Execution.
5. **Trading Session** remains lifecycle SoT (UI: Bot via Bot Facade).
6. **Orders → Execution → Accounting** remain the frozen canonical money path (ADR-012…018).
7. **Knowledge Lake** projects events; never overrides Ledger / Fills / Orders.
8. **Reporting** aggregates projections; never invents balances.
9. **AI Analytics** narrates; never trades.
10. **Notification Delivery** delivers; never becomes a control plane.
11. **Command Center** projects and routes operator commands to Session / Risk ports; never a second SoT.
12. **Exchange Scope** isolates venue identity, config, policy inputs, and bindings.

### 3.1 Hard behaviour rules

1. RC-28 must not add a module, port, SoT, or business rule.
2. Every module remains the **sole owner** of its declared authority.
3. Runtime Enforcement remains fail-closed. Soft-pass is forbidden.
4. Exchange Scope remains isolation-only. Cross-scope leakage is fail-closed.
5. Knowledge Lake, Reporting, AI, Notification, and Command Center caches never win against Orders / Fills / Ledger / Session.
6. Confidence / profiles / narratives never force trades or move balances.
7. Missing `workspaceId` / `exchangeScopeId` (where required) rejects — never silent pick.
8. Verification work may add **tests and evidence**, not product capabilities.

---

## 4. Responsibility matrix (unchanged)

| Behaviour                                     | Owner                   | RC-28 verifies                      |
| --------------------------------------------- | ----------------------- | ----------------------------------- |
| Certify strategies / expand Envelope          | Strategy Library        | Consume-only by peers               |
| Runtime Enforcement PASS/FAIL                 | Runtime Enforcement     | Fail-closed; no duplicate Gate      |
| Classify Market State                         | Market State            | Current-condition SoT preserved     |
| Propose selection / Session handoff intent    | Trading Orchestrator    | Coordination only                   |
| Own Trading Session lifecycle                 | Trading Session         | Bot Facade remains alias            |
| Produce Risk Decisions / Kill Switch SoT      | Risk / Session safety   | Command Center routes; does not own |
| Submit orders / produce Fills                 | Orders / Execution      | Canonical path intact               |
| Mutate Ledger / Positions                     | Accounting              | No shadow books                     |
| Own report generation                         | Reporting               | Projection class preserved          |
| Own AI narratives                             | AI Analytics            | Narrative class preserved           |
| Own notification routing                      | Notification Delivery   | Delivery-only                       |
| Own Knowledge Lake warehouse                  | Knowledge Lake          | Projection; never SoT               |
| Own ops workspace projections + command entry | Command Center          | Commands via Session / Risk ports   |
| Own venue identity / config / policy inputs   | Exchange Scope          | Isolation; not business authority   |
| Own Qualification runs / Profile versions     | Qualification / Profile | Confidence never forces trades      |

**Anti-expansion rule:** RC-28 must not invent a parallel Library, Gate, Qualification pipeline, Orchestrator, Session engine, Risk Decision processor, Orders module, Execution Engine, Ledger, Reporting stack, Lake, or Exchange Scope.

---

## 5. Ownership

Ownership after RC-28 is **identical** to ownership after RC-27.

| Concern                              | Owner (unchanged)                                      |
| ------------------------------------ | ------------------------------------------------------ |
| Strategy certification / eligibility | **Strategy Library**                                   |
| Runtime Enforcement Gate             | **Runtime Enforcement**                                |
| Qualification / Profile versions     | **Market Qualification / Profile**                     |
| MarketState / OrchestrationRun       | **Market State / Trading Orchestrator**                |
| Session lifecycle / Kill Switch      | **Trading Session / Risk safety**                      |
| Risk Decisions                       | **Risk Engine**                                        |
| Orders / Fills / Execution           | **Orders / Execution / Ledger**                        |
| Report aggregations / AI narratives  | **Reporting / AI Analytics**                           |
| Notification delivery                | **Notification Delivery**                              |
| Analytical warehouse                 | **Knowledge Lake** (projection)                        |
| Ops UI + command routing             | **Command Center** (Command UI + projection)           |
| ExchangeScope + lifecycle            | **Exchange Scope** (isolation SoT for identity/config) |

No ownership transfer. No new owner. No shared SoT.

---

## 6. Data sources (verify / integrate only)

| Source                        | Access in RC-28                                  | Ownership transfer? |
| ----------------------------- | ------------------------------------------------ | ------------------- |
| Strategy Library              | Verify Lookup / Eligibility / Envelope consume   | **No**              |
| Runtime Enforcement           | Verify Gate fail-closed with scope key           | **No**              |
| Market Qualification          | Verify consumer reads                            | **No**              |
| Market Profile                | Verify consumer reads                            | **No**              |
| Market State                  | Verify current-condition consume                 | **No**              |
| Trading Orchestrator          | Verify coordination + handoff intent             | **No**              |
| Trading Session               | Verify lifecycle SoT + Bot Facade alias          | **No**              |
| Risk Engine                   | Verify policy-input consume; decisions untouched | **No**              |
| Orders / Execution / Ledger   | Verify scoped canonical path                     | **No**              |
| Knowledge Lake                | Verify ingest + query projection                 | **No**              |
| Reporting / AI / Notification | Verify projection / narrative / delivery         | **No**              |
| Command Center                | Verify projection + command routing              | **No**              |
| Exchange Scope                | Verify isolation + consumer reads                | **No**              |

No RC-28 write into Library certification, Enforcement decisions, Qualification evaluation, Profile publish, Orchestrator selection ownership, Session lifecycle ownership, Risk Decisions, Orders, Execution, Ledger mutations, Reporting generation ownership, AI decision ports, or Scope identity ownership.

---

## 7. Dependencies

| Dependency                          | Status / note                                         |
| ----------------------------------- | ----------------------------------------------------- |
| Architecture Spec v2.0              | Approved constitution                                 |
| Authority Matrix + Alias Dictionary | Approved — **must not be modified**                   |
| Cluster Isolation Invariants        | Binding for multi-scope proof                         |
| Tactics Contract                    | Binding for envelope enforcement                      |
| RC-19…RC-27 closures                | **CLOSED** — critical path complete                   |
| Frozen paper path (ADR-012…018)     | Untouched engines                                     |
| Live capital / live adapters        | **Not enabled** — paper Freeze until future ADR       |
| IDE shell                           | **Deferred** — not a V2 certification blocker         |
| US295 / ADL-008                     | Parallel governance residual; not an RC-28 capability |

---

## 8. Definition of Done (RC-28 close)

RC-28 may close only when **all** are true:

### Architecture

1. Architecture Specification v2.0 remains the unchanged constitution.
2. Authority Matrix and Alias Dictionary remain unmodified and honored.
3. Every module remains the sole owner of its declared authority.
4. No new domain, SoT, port, or business rule was introduced.
5. Exchange Scope remains isolation context and never a business authority.

### Integration & validation

6. Complete trading path scenario PASS within existing ownership.
7. Complete reporting path scenario PASS (no shadow accounting).
8. Complete notification path scenario PASS (delivery-only).
9. Complete Knowledge Lake flow PASS (append-only ingest; query never SoT).
10. Runtime Enforcement fail-closed suite PASS.
11. Exchange Scope isolation suite PASS (funds, capacity, policy, ambiguity).
12. Cross-module compatibility + dependency-graph checks PASS.
13. Version compatibility of RC-19…RC-27 contracts with Spec v2.0 PASS.

### Hygiene

14. All epic DoDs met; Validation Standard (Workflow §5) PASS.
15. Version 2 certification + readiness recorded (paper-first).
16. Residual/deferred register updated (IDE, REST products, live capital, US295).

---

## 9. Non-goals reminder (permanent for this RC)

- Do not implement new APIs, modules, or business rules.
- Do not redesign Runtime, Strategy Library, Reporting, Orchestrator, or Multi-Exchange.
- Do not modify Authority Matrix or Alias Dictionary.
- Do not implement live-capital adapters as capital authority.
- Do not implement IDE shell.
- Do not rewrite Architecture Spec v2.0.
- Do not declare Version 2 “done” without the validation targets in §8.

---

## 10. STOP gate

**STOP.** RC-28 is **CLOSED** at tag `v2.0.0`. Version 2 is officially complete (paper-first).

---

## Approval

| Checkpoint                                    | Status                          |
| --------------------------------------------- | ------------------------------- |
| Planning package complete                     | **Approved**                    |
| Epic 1 platform integration boundaries        | **Approved**                    |
| Epic 2 cross-domain workflow verification     | **Approved**                    |
| Epic 3 authority & ownership verification     | **Approved**                    |
| Epic 4 end-to-end scenario validation         | **Approved**                    |
| Epic 5 performance, resilience, compatibility | **Approved**                    |
| Epic 6 Version 2 certification & readiness    | **Approved**                    |
| Human approval for Validation & Release       | **Approved**                    |
| Validation / Certification / Closure          | **PASS / READY = YES / CLOSED** |
