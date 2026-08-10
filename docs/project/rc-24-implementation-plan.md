# RC-24 Implementation Plan — Reporting & AI Analytics

**Document:** RC-24 Implementation Plan  
**Status:** CLOSED — validation PASS · tag `v1.0.0-rc24`
**Date:** 2026-08-10  
**Nature:** Implementation underway after planning approval. **No architecture redesign.**

**Authority inputs:**

| Input                                                                       | Role                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.13 Lake; §5.14 Reporting; §5.15 AI; §6 data flow; §10 AI responsibilities) |
| [Authority Matrix](./v2-authority-matrix.md)                                | Reporting & AI = Projection + Narrative; Lake never financial SoT                           |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Report / AI Analytics ≡ Reporting projections + AI narrative; no trading authority          |
| [RC-23 Closure](./rc-23-closure-report.md) (**CLOSED**)                     | Runtime Enforcement complete; Reporting / AI deferred into this RC                          |
| [RC-22 Closure](./rc-22-closure-report.md) (**CLOSED**)                     | Strategy Library SoT available for **read-only** report context                             |
| [RC-21 Closure](./rc-21-closure-report.md) (**CLOSED**)                     | Knowledge Lake Projection + Query Port ready for Reporting / AI consumers                   |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → thin Epics → review → validation → release                            |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | RC-24 theme: Reporting & AI Analytics                                                       |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-24-epic-breakdown.md`](./rc-24-epic-breakdown.md)                                   |
| API Contract (ports)            | [`rc-24-api-contract.md`](./rc-24-api-contract.md)                                       |
| Reporting Domain Model          | [`rc-24-reporting-domain-model.md`](./rc-24-reporting-domain-model.md)                   |
| Integration Diagram             | [`rc-24-reporting-integration-diagram.md`](./rc-24-reporting-integration-diagram.md)     |
| Validation Summary              | [`rc-24-validation-summary.md`](./rc-24-validation-summary.md)                           |
| Architecture Consistency Report | [`rc-24-architecture-consistency-report.md`](./rc-24-architecture-consistency-report.md) |

---

## 0. Sequencing (governance)

| RC        | Theme                                               | Status                     |
| --------- | --------------------------------------------------- | -------------------------- |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade         | **CLOSED**                 |
| **RC-20** | Command Center foundation                           | **CLOSED**                 |
| **RC-21** | Knowledge Lake (projection)                         | **CLOSED** (`v1.0.0-rc21`) |
| **RC-22** | Strategy Library + Tactical Envelope (domain)       | **CLOSED** (`v1.0.0-rc22`) |
| **RC-23** | Runtime Enforcement                                 | **CLOSED** (`v1.0.0-rc23`) |
| **RC-24** | **Reporting, AI Analytics & Notification Delivery** | **CLOSED** · `v1.0.0-rc24` |

| Effect                   | Disposition                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Knowledge Lake           | CLOSED as RC-21 — **consume** Query Port; do not redesign Lake                      |
| Strategy Library         | CLOSED as RC-22 — **read-only** context where appropriate                           |
| Runtime Enforcement      | CLOSED as RC-23 — **untouched**; Reporting never becomes a gate                     |
| Reporting + AI Analytics | **RC-24** theme (this package)                                                      |
| Trading Orchestrator     | Remains later (baseline RC-26) — **not** RC-24                                      |
| Market State / Selection | Remains later — **not** RC-24                                                       |
| Market Qualification     | Remains later (RC-25) — **not** RC-24                                               |
| Multi Exchange           | Remains later — **not** RC-24                                                       |
| Telegram control plane   | Forbidden; Telegram notification **delivery** activated in Epic 6 (projection only) |
| Architecture Spec v2.0   | **Unchanged**                                                                       |
| Authority Matrix / Alias | **Unchanged**                                                                       |

---

## 1. Purpose

Introduce the **Reporting & AI Analytics** layer on top of the completed Knowledge Lake.

RC-24 answers:

> Can operators and researchers obtain aggregations, comparisons, historical views, and explainable analytical narratives from Knowledge Lake (and approved read-only feeds) — without Reporting or AI becoming Source of Truth, authorizing capital, or replacing Runtime Enforcement / Strategy Library?

**Reporting consumes Knowledge Lake. Reporting never becomes Source of Truth.**  
**AI Analytics consumes Reporting and Knowledge Lake. AI never owns business decisions.**

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                         | RC-24 delivers (after approval)                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Reporting boundary           | Distinct module: aggregate / summarize / compare / visualize / explain — never authorize |
| Reporting domain model       | Report Definition, Report Run, Aggregation Slice, Historical Window, Narrative Artifact  |
| Reporting read models        | Projection read models over Lake (+ approved read-only history / Library context)        |
| Reporting services + queries | Application ports to request, resolve, and query reports                                 |
| Historical reporting         | Time-bounded report windows over Lake / history feeds                                    |
| AI analytical layer          | Explain, summarize, identify trends, generate narratives — gateway-mediated              |
| Explainable narratives       | Narratives cite Reporting / Lake source refs; labeled non-authoritative                  |
| Mode labeling                | Paper vs live (vs research/system) labeling mandatory on money-adjacent aggregations     |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-24                            | Owner / later                            |
| --------------------------------------------- | ---------------------------------------- |
| Trading Orchestrator product                  | RC-26 theme                              |
| Market State Engine                           | Later (with Orchestrator)                |
| Market Qualification                          | RC-25 theme                              |
| Strategy Selection                            | Trading Orchestrator (later)             |
| Multi Exchange expansion                      | Later                                    |
| Runtime Enforcement redesign                  | RC-23 CLOSED — untouched                 |
| Paper Trading product redesign                | Forbidden                                |
| Strategy Library domain redesign              | RC-22 CLOSED — read-only consume         |
| Knowledge Lake redesign / Lake-as-SoT         | RC-21 CLOSED — Projection only           |
| Orders / Risk / Execution / Ledger rewrite    | Freeze ADR-012…018                       |
| AI trading decisions / capital control        | Forever forbidden (Spec §10)             |
| AI replacing Runtime Enforcement              | Forever forbidden                        |
| AI replacing Strategy Library                 | Forever forbidden                        |
| Shadow accounting (ad-hoc ledger recompute)   | Authority Matrix rule 5                  |
| Telegram as control plane                     | Forbidden in V2                          |
| REST / transport / queue / persistence design | Out of this planning package             |
| Full Command Center report UI productization  | Ports first; UI Contract later if needed |

---

## 3. Behaviour (normative)

```text
Knowledge Lake (+ approved read-only history / Library context)
        ↓  (query / read)
Reporting (read models + services)
        ↓  (aggregations / comparisons / historical views)
AI Analytics (narrative over Reporting + Lake)
        ↓
Human (operator / researcher)
```

Rules:

1. Reporting **aggregates, summarizes, compares, visualizes, and explains** projections.
2. Reporting **must not** authorize, trade, validate strategies, or modify business state.
3. AI **explains, summarizes, identifies trends, and generates narratives**.
4. AI **must not** become SoT, make trading decisions, replace Runtime Enforcement, or replace Strategy Library.
5. If Reporting / AI disagree with Ledger, Fills, Orders, Session, or Library — **SoT wins**.
6. Paper vs live labeling is mandatory for money-adjacent report outputs.
7. Optional report-run markers may append to Lake under category `Reporting` (projection only) — never feedback into SoT commands.

---

## 4. Responsibilities

| Responsibility                                                | RC-24 Reporting? | RC-24 AI?     |
| ------------------------------------------------------------- | ---------------- | ------------- |
| Aggregate / summarize / compare Lake & approved reads         | **Yes**          | No            |
| Produce historical reporting windows                          | **Yes**          | Consume       |
| Produce explainable analytical narratives                     | Provide inputs   | **Yes**       |
| Label paper vs live                                           | **Yes**          | Preserve      |
| Authorize capital / risk / kill                               | **No**           | **No**        |
| Trade / submit orders / mutate fills                          | **No**           | **No**        |
| Validate strategies / certify / eligibility SoT               | **No**           | **No**        |
| Replace Runtime Enforcement                                   | **No**           | **No**        |
| Replace Strategy Library                                      | **No**           | **No**        |
| Modify Session / Deployment / Library / Ledger business state | **No**           | **No**        |
| Recompute authoritative ledger balances with ad-hoc math      | **Forbidden**    | **Forbidden** |

---

## 5. Ownership

| Concern                                       | Owner after RC-24                                           |
| --------------------------------------------- | ----------------------------------------------------------- |
| Analytical facts warehouse                    | **Knowledge Lake** (Projection) — unchanged                 |
| Certified algorithm / eligibility / envelope  | **Strategy Library** (SoT) — read-only for report context   |
| Runtime Enforcement PASS/FAIL                 | **Runtime Enforcement** — untouched                         |
| Session lifecycle / Kill Switch               | **Trading Session** — untouched                             |
| Cash / fees / realized PnL                    | **Ledger** — Reporting may display labeled projections only |
| Fill facts                                    | **Execution → Fill records** — no recalculation in reports  |
| Report Definition / Report Run / Aggregations | **Reporting** (Projection owner of report artifacts)        |
| Analytical Narrative text                     | **AI Analytics** (Narrative class)                          |
| Strategy selection / Market State             | Future Orchestrator / Market State — not RC-24              |

**Anti-duplication rule:** Reporting must not invent a parallel financial ledger. Aggregations cite Lake / SoT-derived projections and preserve authority class.

---

## 6. Data sources (consume only)

| Source                | Access in RC-24                                                          | Ownership transfer? |
| --------------------- | ------------------------------------------------------------------------ | ------------------- |
| Knowledge Lake        | Primary analytical feed via `KnowledgeLakeQueryPort`                     | **No**              |
| Strategy Library      | Read-only membership / version context where needed                      | **No**              |
| Trading history       | Read-only SoT-derived / Lake-projected trading facts                     | **No**              |
| Paper Trading history | Read-only paper mode facts / projections                                 | **No**              |
| Runtime Enforcement   | Not a report authority; may appear as projected facts if Lake holds them | **No**              |

No direct ownership transfer. No Reporting write into Library, Session, Orders, Risk, Execution, or Ledger command ports.

---

## 7. Dependencies

| Dependency                          | Status / note                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| Architecture Spec v2.0              | Approved constitution                                           |
| Authority Matrix + Alias Dictionary | Approved                                                        |
| RC-21 Knowledge Lake                | **CLOSED** — Query Port exists for consumers                    |
| RC-22 Strategy Library              | **CLOSED** — optional read-only report context                  |
| RC-23 Runtime Enforcement           | **CLOSED** — must not be redesigned or replaced by Reporting/AI |
| Trading / Paper history projections | Available via Lake and/or existing read surfaces — consume only |
| Trading Orchestrator / Market State | **Not built** — out of RC-24                                    |
| AI Gateway (CANONICAL)              | Existing gateway-mediated AI access remains the access pattern  |

---

## 8. Definition of Done (RC-24 close)

RC-24 may close only when **all** are true:

### Architecture

1. Spec §5.14 Reporting and §5.15 AI Analyst responsibilities realized as application ports + domain — not docs-only.
2. Spec §6 data flow `Lake → Reporting → User` (with AI narrative beside Reporting) honored.
3. Spec §10 AI allow/deny lists enforced in ports and tests.
4. No Orchestrator, Market State, Selection, Qualification, Multi-Exchange, or Runtime redesign under RC-24.
5. Authority Matrix + Alias Dictionary honored; Reporting/AI never SoT for money or lifecycle.

### Ports & domain

6. Reporting Domain Model locked entities implemented as projections (Definition, Run, Aggregation, Window, Narrative).
7. API Contract ports implemented for Reporting queries/services and AI analytics.
8. Knowledge Lake consumed via Query Port; no Lake redesign; no Lake-as-SoT.
9. Paper vs live labeling present on money-adjacent aggregations.
10. Narratives cite source refs and declare `authorityClass: narrative`.

### Integration

11. No reverse dependency: Reporting/AI must not write Library certification, Session lifecycle, Orders, Risk, Execution, or Ledger.
12. No shadow accounting: reports do not recompute authoritative balances with ad-hoc math.
13. Runtime Enforcement remains Gate SoT path — Reporting does not authorize deployment.
14. Frozen path algorithms unchanged.

### Hygiene

15. All epic DoDs met; Validation Standard (Workflow §5) PASS.
16. Closure report + residual/deferred register updated (Reporting UI, production Telegram Bot network, Orchestrator, etc.).
17. Explicit non-acceptance: AI trading decisions; Reporting-as-SoT; Lake rewrite; soft substitution of Enforcement/Library.

---

## 9. Architectural risks

| Risk                                          | Mitigation                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Reports recompute money (shadow accounting)   | Domain + API forbid ad-hoc ledger math; cite Ledger/Fill projections only  |
| AI treated as decision authority              | Narrative class; Spec §10 deny list; forbidden ports                       |
| Reporting becomes eligibility / deploy gate   | Explicit non-goals; Enforcement untouched; forbidden edges on diagram      |
| Lake treated as financial SoT via reports     | Authority labels on every aggregation; Consistency Report + tests          |
| Scope creep into Orchestrator / Qualification | Explicit non-goals; epic constraints                                       |
| Telegram control-plane creep                  | Forbidden; Notification Delivery (Epic 6) is projection-only               |
| UI inventiveness before ports                 | Ports-first planning; UI Contract separate if product UI is approved later |

---

## 10. Process compliance (Workflow v1.0)

```text
Vision (explain, do not trade) → Architecture conformance → Planning (this package)
  → API Contract + Domain Model → thin Epics → Review → Validation → Git Release
```

UI Contract is **not** part of this planning package (ports-first). If a Reporting / AI UI surface is approved later, a UI Contract must precede frontend Epics.

**STOP after planning.** No implementation until Implementation Plan + API Contract + Domain Model are approved.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not absorb Orchestrator, Market State, Selection, Qualification, Multi-Exchange, Runtime redesign, or Paper Trading redesign into RC-24.
