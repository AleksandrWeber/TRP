# RC-23 Implementation Plan — Runtime Enforcement

**Document:** RC-23 Implementation Plan  
**Status:** CLOSED — validation PASS · tag `v1.0.0-rc23`
**Date:** 2026-08-10  
**Nature:** Implementation underway after planning approval. **No architecture redesign.**

**Authority inputs:**

| Input                                                                       | Role                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.2 Strategy Library; §5.6 Session/Runtime; §8 lifecycle)             |
| [Authority Matrix](./v2-authority-matrix.md)                                | Library = certified algorithm SoT; Session = lifecycle SoT; Runtime does not certify |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Bot ≡ Session; Mission ≡ Deployment; no Bot aggregate as Library SoT                 |
| [Tactics Contract](./v2-tactics-contract.md)                                | Option B envelopes; Runtime must not invent strategy logic or expand envelopes       |
| [RC-22 Closure](./rc-22-closure-report.md) (**CLOSED**)                     | Strategy Library domain complete; Session/Deployment bind enforcement deferred       |
| [RC-21 Closure](./rc-21-closure-report.md) (**CLOSED**)                     | Knowledge Lake Projection available; never eligibility authority                     |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → thin Epics → review → validation → release                     |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | Historical RC-23 slot was Lake (delivered as RC-21) — see §0                         |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-23-epic-breakdown.md`](./rc-23-epic-breakdown.md)                                   |
| API Contract (ports)            | [`rc-23-api-contract.md`](./rc-23-api-contract.md)                                       |
| Runtime Enforcement Contract    | [`rc-23-runtime-enforcement-contract.md`](./rc-23-runtime-enforcement-contract.md)       |
| Integration Diagram             | [`rc-23-runtime-integration-diagram.md`](./rc-23-runtime-integration-diagram.md)         |
| Validation Summary              | [`rc-23-validation-summary.md`](./rc-23-validation-summary.md)                           |
| Architecture Consistency Report | [`rc-23-architecture-consistency-report.md`](./rc-23-architecture-consistency-report.md) |

---

## 0. Sequencing (governance)

| RC        | Theme                                         | Status                     |
| --------- | --------------------------------------------- | -------------------------- |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade   | **CLOSED**                 |
| **RC-20** | Command Center foundation                     | **CLOSED**                 |
| **RC-21** | Knowledge Lake (projection)                   | **CLOSED** (`v1.0.0-rc21`) |
| **RC-22** | Strategy Library + Tactical Envelope (domain) | **CLOSED** (`v1.0.0-rc22`) |
| **RC-23** | **Runtime Enforcement** (this package)        | **CLOSED** (`v1.0.0-rc23`) |

**Roadmap numbering note:** Baseline roadmap listed Knowledge Lake as RC-23. That theme was delivered early as **RC-21**. The vacated RC-23 integer is assigned here to **Runtime Enforcement** — the first implementation RC that connects the completed Strategy Library domain to the existing Paper Trading runtime.

| Effect                         | Disposition                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| Knowledge Lake                 | Already CLOSED as RC-21 — **do not re-implement**                      |
| Strategy Library domain        | CLOSED as RC-22 — RC-23 **consumes** Library SoT; does not redesign it |
| Runtime Enforcement            | **RC-23** theme (this package)                                         |
| Trading Orchestrator           | Remains later (baseline RC-26) — **not** RC-23                         |
| Market State / Selection       | Remains later with Orchestrator — **not** RC-23                        |
| Reporting / AI / IDE / Multi-X | Unchanged later themes                                                 |
| Architecture Spec v2.0         | **Unchanged** — Spec owns modules, not RC integers                     |
| Authority Matrix / Alias       | **Unchanged**                                                          |

---

## 1. Purpose

Introduce **Runtime Enforcement**: verification that a Trading Session may deploy only strategies that are certified and eligible according to the Strategy Library.

RC-23 answers:

> When the existing deployment flow asks Runtime to start a Trading Session, can the platform **prove** the requested strategy is a Library-permitted member — and refuse deterministically if not — without deciding _which_ strategy to run?

**RC-23 validates. RC-23 does not decide.**

Runtime continues to receive strategies exactly as before. The only new responsibility is verification against Strategy Library Source of Truth.

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                         | RC-23 delivers (after approval)                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Runtime Enforcement boundary | Distinct gate ownership: validates; never certifies; never selects                  |
| Library read consumption     | Activate/consume Lookup + Eligibility (+ related reads) as enforcement inputs       |
| Validation sequence          | Strategy → StrategyVersion → Active Certification → StrategyEligibility → Envelope  |
| Deployment refusal           | Fail-closed reject at bind/deploy when any check fails                              |
| Session start gate           | Trading Session starts only after PASS; FAIL ⇒ deployment rejected                  |
| Deterministic rejection      | Machine-readable reason codes; no ambiguous soft-fail                               |
| Paper path consumption       | Existing Paper Trading path **unchanged** except mandatory enforcement before start |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-23                             | Owner / later                   |
| ---------------------------------------------- | ------------------------------- |
| Strategy Selection                             | Trading Orchestrator (later)    |
| Trading Orchestrator product                   | RC-26 theme                     |
| Market State Engine                            | Later (with Orchestrator)       |
| Market Qualification                           | Later (RC-25 theme)             |
| Reporting / AI                                 | Later                           |
| Multi Exchange expansion                       | Later                           |
| Runtime optimisation                           | Out of scope                    |
| Adaptive Tactics beyond approved Option B      | Tactics Contract — no expansion |
| Live parameter mutation / hot-edit content     | Forbidden                       |
| Strategy Library domain redesign               | RC-22 CLOSED — consume only     |
| Knowledge Lake redesign / eligibility via Lake | RC-21 CLOSED — Projection only  |
| Paper Trading product redesign                 | Frozen path — enforce only      |
| Orders / Risk / Execution / Ledger rewrite     | Freeze ADR-012…018              |
| REST / UI / IDE as enforcement SoT             | Facades later; ports first      |

---

## 3. Runtime behaviour (normative)

```text
Deployment request (existing flow)
        ↓
Runtime Enforcement (RC-23)
        ↓
     PASS ──────────────────▶ Trading Session starts
        │
     FAIL ──────────────────▶ Deployment rejected
                              (deterministic reason codes)
```

Rules:

1. Runtime still receives deployment requests from the **existing** flow.
2. Enforcement is verification only — it does not choose strategies, envelopes, or tactic points.
3. Any failed requirement ⇒ refuse deployment (fail-closed).
4. Rejection reasons are deterministic and machine-readable.
5. Runtime **never** owns certification. Strategy Library remains Source of Truth.

---

## 4. Verification requirements

At enforcement time the Runtime must verify **all** of:

| #   | Requirement                           | SoT owner        |
| --- | ------------------------------------- | ---------------- |
| 1   | Strategy (family) exists              | Strategy Library |
| 2   | StrategyVersion exists                | Strategy Library |
| 3   | Certification is **Active**           | Strategy Library |
| 4   | StrategyEligibility exists (eligible) | Strategy Library |
| 5   | Library Tactical Envelope exists      | Strategy Library |

If any requirement fails → **FAIL** → deployment rejected.

Detail: [Runtime Enforcement Contract](./rc-23-runtime-enforcement-contract.md).

---

## 5. Responsibilities

| Responsibility                                               | RC-23 Runtime Enforcement? |
| ------------------------------------------------------------ | -------------------------- |
| Verify Library membership + eligibility before Session start | **Yes**                    |
| Produce deterministic PASS/FAIL + reason codes               | **Yes**                    |
| Refuse deployment on FAIL                                    | **Yes** (via bind/start)   |
| Certify / deprecate / archive strategies                     | **No** (Library)           |
| Create or mutate StrategyEligibility records as authority    | **No** (Library domain)    |
| Invent or expand Tactical Envelopes                          | **No**                     |
| Select strategy by Market State                              | **No**                     |
| Own Session lifecycle / Kill Switch                          | **No** (Session)           |
| Redesign Paper Trading / Risk / Orders / Execution           | **No**                     |
| Authorize eligibility from Knowledge Lake                    | **Forbidden**              |

---

## 6. Ownership

| Concern                                      | Owner after RC-23                                           |
| -------------------------------------------- | ----------------------------------------------------------- |
| Certified version + certification + envelope | **Strategy Library** (SoT) — unchanged                      |
| Eligibility decision records / domain gate   | **Strategy Library** (SoT) — unchanged                      |
| Runtime Enforcement PASS/FAIL                | **Runtime Enforcement** (Gate over Library reads)           |
| Strategy Deployment binding                  | Strategy Deployment (consumes enforcement; binds only PASS) |
| Session lifecycle                            | Trading Session (ADR-014); Bot = alias                      |
| Paper path algorithms                        | Unchanged Freeze owners                                     |
| Knowledge Lake                               | Projection only — never enforcement authority               |
| Strategy selection                           | Future Trading Orchestrator (not RC-23)                     |

**Anti-duplication rule:** Runtime must not cache a parallel “certified” list as SoT. Enforcement always resolves against Library.

---

## 7. Dependencies

| Dependency                            | Status / note                                                              |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Architecture Spec v2.0                | Approved constitution                                                      |
| Authority Matrix + Alias Dictionary   | Approved                                                                   |
| Tactics Contract Option B             | Approved                                                                   |
| RC-22 Strategy Library domain         | **CLOSED** — Strategy, Version, Certification, Envelope, Eligibility exist |
| RC-22 Nest application ports          | Deferred in RC-22 — RC-23 may activate **read** ports needed for gate      |
| Strategy Deployment + Trading Session | Existing bind/start surfaces — consume enforcement only                    |
| Paper Trading Freeze path             | Unchanged algorithms; enforcement precedes Session start                   |
| Knowledge Lake                        | **CLOSED** — not an enforcement input                                      |
| Trading Orchestrator / Market State   | **Not built** — out of RC-23                                               |

---

## 8. Definition of Done (RC-23 close)

RC-23 may close only when **all** are true:

### Architecture

1. Spec §5.2 “gate production use to library members only” is enforced at runtime bind/start — not docs-only.
2. Spec §5.6 Session still owns lifecycle; Runtime does not certify or select.
3. No Trading Orchestrator, Market State, Selection, Reporting, AI, or Multi-Exchange under RC-23.
4. Authority Matrix + Alias Dictionary honored; Lake never authorizes deployment.

### Gate & ports

5. Runtime Enforcement Contract validation sequence implemented end-to-end.
6. API Contract ports implemented for enforcement + required Library read consumption.
7. All five verification requirements checked; any failure ⇒ reject.
8. Rejection reasons deterministic and covered by tests.

### Integration

9. Existing deployment flow unchanged in shape: request → enforce → PASS/FAIL.
10. Trading Session starts only on PASS; FAIL rejects deployment.
11. No reverse dependency: Session/Runtime do not write Library certification.
12. Frozen path (Orders / Risk / Execution / Ledger / Recovery) algorithms unchanged.
13. No Paper Trading product redesign beyond mandatory enforcement hook.

### Hygiene

14. All epic DoDs met; Validation Standard (Workflow §5) PASS.
15. Closure report + residual/deferred register updated.
16. Explicit non-acceptance: soft-fail; Lake-as-authority; Runtime-owned certification; selection disguised as validation.

---

## 9. Architectural risks

| Risk                                    | Mitigation                                                       |
| --------------------------------------- | ---------------------------------------------------------------- |
| Soft-fail / warn-only gate              | Fail-closed DoD; reject tests mandatory                          |
| Runtime caches certified catalog as SoT | Contract: always read Library; no parallel membership SoT        |
| Eligibility via Knowledge Lake          | Forbidden; Consistency Report + tests                            |
| Scope creep into Orchestrator/Selection | Explicit non-goals; epic DoDs forbid selection                   |
| Paper path redesign creep               | Consume-only; no Risk/Orders/Execution changes                   |
| Duplicate eligibility logic in Session  | Single Runtime Enforcement port; Session/Deployment call it      |
| Library write from Session              | Ownership table + forbidden reverse edges on Integration Diagram |

---

## 10. Process compliance (Workflow v1.0)

```text
Vision (Validated Knowledge) → Architecture conformance → Planning (this package)
  → API Contract + Runtime Enforcement Contract → thin Epics → Review → Validation → Git Release
```

**STOP after planning.** No implementation until Implementation Plan + API Contract + Runtime Enforcement Contract are approved.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not absorb Orchestrator, Market State, Selection, Reporting, AI, or Paper redesign into RC-23.
