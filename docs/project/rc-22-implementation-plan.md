# RC-22 Implementation Plan — Strategy Library

**Document:** RC-22 Implementation Plan  
**Status:** Epic 6 implemented — awaiting review (domain complete; Validation & Release separate)  
**Date:** 2026-08-10  
**Nature:** Implementation in progress via thin Epics. Planning contracts remain authoritative.

**Authority inputs:**

| Input                                                                       | Role                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.2 Strategy Library, §5.4–5.6, §8 Research Lifecycle)        |
| [Authority Matrix](./v2-authority-matrix.md)                                | SoT vs Projection vs Policy; certified algorithm ownership                   |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Bot ≡ Session; Mission ≡ Deployment; Strategy / Tactical Envelope naming     |
| [Tactics Contract](./v2-tactics-contract.md)                                | Strategy vs tactics; Option B envelope; Orchestrator limits                  |
| [Knowledge Lake](./rc-21-closure-report.md) (RC-21 **CLOSED**)              | Certified projection warehouse available; Lake never owns Library membership |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → Domain/API contracts → thin Epics → review → validation → release     |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | Approved RC-22 theme: Strategy Library + Tactical Envelope                   |
| [RC-19 Closure](./rc-19-closure-report.md)                                  | Envelope stub inactive; Exchange Scope identity; Bot Facade                  |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-22-epic-breakdown.md`](./rc-22-epic-breakdown.md)                                   |
| Domain Model Contract           | [`rc-22-domain-model-contract.md`](./rc-22-domain-model-contract.md)                     |
| API Contract (ports)            | [`rc-22-api-contract.md`](./rc-22-api-contract.md)                                       |
| Integration Diagram             | [`rc-22-strategy-library-integration.md`](./rc-22-strategy-library-integration.md)       |
| Validation Summary              | [`rc-22-validation-summary.md`](./rc-22-validation-summary.md)                           |
| Architecture Consistency Report | [`rc-22-architecture-consistency-report.md`](./rc-22-architecture-consistency-report.md) |

---

## 0. Sequencing (governance)

| RC        | Theme                                       | Status                                   |
| --------- | ------------------------------------------- | ---------------------------------------- |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade | **CLOSED**                               |
| **RC-20** | Command Center foundation                   | **CLOSED**                               |
| **RC-21** | Knowledge Lake (projection)                 | **CLOSED** (`v1.0.0-rc21`)               |
| **RC-22** | Strategy Library + Tactical Envelope        | **Epic 6 implemented** — awaiting review |

IDE shell remains **deferred** (not RC-22). Trading Orchestrator / Market State Engine products remain later roadmap themes; RC-22 only defines **read/consume** contracts toward them.

---

## 1. Purpose

Introduce the **Strategy Library** as the first **business-core** module on top of completed research infrastructure and the certified Knowledge Lake.

RC-22 answers:

> Can the platform prove which strategy versions earned trust, bind their tactical envelopes, decide eligibility for the production path, and refuse uncertified use — without inventing strategy logic at runtime?

Mission (Spec §5.2): authoritative store of strategies that earned certification; expose envelopes; gate production use to library members only.

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                        | RC-22 delivers (after approval)                                    |
| --------------------------- | ------------------------------------------------------------------ |
| Library module boundary     | Distinct ownership from registry, Lab, Session, Lake               |
| Strategy / Version model    | Canonical domain entities (Domain Model Contract)                  |
| Certification & Evidence    | Admission gate; evidence refs; human authority                     |
| Tactical Envelope binding   | Library-owned SoT; RC-19 stub becomes non-authoritative            |
| Eligibility Gate            | Port: only `certified` members eligible for new production binds   |
| Deprecation / Archive       | Lifecycle transitions without history rewrite                      |
| Lake projection hooks       | Optional admit of certification/deprecation facts (Library → Lake) |
| Orchestrator / Market State | **Consume contracts only** — Library lookup + envelope read models |

### 2.2 Explicitly out of scope

| Forbidden in RC-22                          | Owner / later                                     |
| ------------------------------------------- | ------------------------------------------------- |
| Strategy execution / Signal Intent rewrite  | Strategy Runtime (unchanged)                      |
| Paper Trading product changes               | Frozen paper path — consumers of eligibility only |
| Trading Orchestrator implementation         | RC-26 theme                                       |
| Market State Engine implementation          | Later (with Orchestrator)                         |
| Reporting / AI                              | RC-24+                                            |
| Knowledge Lake redesign                     | RC-21 CLOSED — append consumers only              |
| IDE shell / Bot fleet UX                    | Deferred                                          |
| Live capital adapter                        | Future ADR                                        |
| Monte Carlo engine                          | Lab method when available; nullable evidence ref  |
| Orders / Risk / Execution / Ledger redesign | Freeze ADR-012…018                                |
| UI / REST product surface as SoT            | Facades later; ports first                        |
| Persistence schema in this planning task    | Epics after approval                              |

---

## 3. Responsibilities

Per Spec §5.2 and Domain Model Contract:

| Responsibility                                               | Library?                    |
| ------------------------------------------------------------ | --------------------------- |
| Hold certified immutable strategy versions                   | **Yes**                     |
| Bind and expose Tactical Envelope per certified version      | **Yes**                     |
| Gate production eligibility (`certified` only for new binds) | **Yes**                     |
| Record certification, deprecation, archive provenance        | **Yes**                     |
| Store research campaigns / raw backtests                     | **No**                      |
| Execute strategies or submit orders                          | **No**                      |
| Invent or mutate algorithm logic at runtime                  | **No**                      |
| Expand envelopes without re-certification                    | **No**                      |
| Own Session lifecycle / Kill Switch                          | **No**                      |
| Own analytical warehouse                                     | **No** (Lake)               |
| Select strategies by Market State                            | **No** (Orchestrator later) |

---

## 4. Ownership

| Concern                                        | Owner after RC-22                                      |
| ---------------------------------------------- | ------------------------------------------------------ |
| Editable experimental strategy config          | Existing Strategy registry (Lab-facing)                |
| Certified immutable version + eligibility      | **Strategy Library** (SoT)                             |
| Tactical Envelope body for a certified version | **Strategy Library** (SoT)                             |
| Evidence artifact bodies                       | Research Lab / Campaign / Experiment stores            |
| Immutable Deployment bound to Session          | Strategy Deployment                                    |
| Session lifecycle                              | Trading Session (ADR-014); Bot = alias                 |
| Analytical copies of certify/deprecate events  | Knowledge Lake (Projection)                            |
| Market State classification                    | Market State Engine (future SoT for classifications)   |
| Strategy / tactic selection                    | Trading Orchestrator (future; **consumer** of Library) |
| Risk / Orders / Fills / Ledger                 | Unchanged Freeze owners                                |

**Anti-duplication rule:** Registry `active` ≠ certified. Certification is not a registry status rename. Deployment binds Library ids only.

---

## 5. Dependencies

| Dependency                          | Status / note                                                           |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Architecture Spec v2.0              | Approved constitution                                                   |
| Authority Matrix + Alias Dictionary | Approved                                                                |
| Tactics Contract Option B           | Approved                                                                |
| RC-19 Exchange Scope + Bot Facade   | CLOSED                                                                  |
| RC-19 Tactical Envelope stub        | Exists, inactive — RC-22 makes Library SoT                              |
| RC-21 Knowledge Lake                | **CLOSED** — available for projection admits; never Library SoT         |
| Research Lab evidence identities    | Backtest + Walk-Forward required refs; Monte Carlo optional             |
| Strategy Deployment / Session       | Existing binding points for eligibility **queries** (no Paper redesign) |
| Trading Orchestrator / Market State | **Not built** — ports define future read consumption only               |

---

## 6. Classification vocabulary

| Class                     | Meaning                                                                 | Production path?            |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| **Research artifact**     | Campaigns, experiments, reports, metrics                                | Never directly              |
| **Experimental strategy** | Editable registry definition under test                                 | **No**                      |
| **Certified strategy**    | Immutable Library version + envelope + evidence                         | **Yes** (Paper; Live later) |
| **Deprecated strategy**   | Was certified; withdrawn from **new** eligibility                       | No new binds                |
| **Archived strategy**     | Terminal Library retention; hidden from default catalog; audit retained | No new binds                |

Normative lifecycle (Spec §8):

```text
Idea → Research → Validation → Certification → Strategy Library
  → Paper Trading (certified only) → Future Live / Execution
```

Pre-cert “paper-like” Lab simulation ≠ Trading Session Paper Trading.

---

## 7. Definition of Done (RC-22 close)

RC-22 may close only when **all** are true:

### Architecture

1. Spec §5.2 Library boundary exists as a distinct module/SoT — no Spec rewrite.
2. Research / experimental / certified / deprecated / archived are distinguishable.
3. No duplicate certification SoT; registry is not production eligibility authority.
4. Authority Matrix + Alias Dictionary honored (Bot ≡ Session; Lake ≠ Library SoT).

### Domain & ports

5. Domain Model Contract entities realized with immutability invariants.
6. API Contract ports implemented: registration, certification, lookup, eligibility, archive/deprecation.
7. Certified content + envelope immutable after admit; status transitions only as contracted.

### Integration & enforcement

8. Lab feeds **evidence refs**; Lab does not mint membership without Certification port.
9. Eligibility Gate rejects experimental, unknown, deprecated, and archived for **new** binds.
10. Envelope SoT on Library; out-of-envelope tactic parameters rejected at bind/eligibility check (not docs-only).
11. Knowledge Lake may receive certification lifecycle projections; Lake never authorizes eligibility.
12. Frozen path (Orders / Risk / Execution / Ledger / Recovery) algorithms unchanged.
13. No Trading Orchestrator or Market State Engine product shipped under RC-22.
14. No Paper Trading product redesign; Session/Deployment only **consume** eligibility ports.

### Hygiene

15. All epic DoDs met; Validation Standard (Workflow §5) PASS.
16. Closure report + residual/deferred register updated.
17. Explicit non-acceptance: UI-only Library; registry rename-as-certification; AI auto-certify; Orchestrator/Lake absorption of Library SoT.

---

## 8. Architectural risks

| Risk                         | Mitigation                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Duplicate strategy storage   | Split SoT: registry vs Library; Deployment binds Library ids                   |
| Uncertified execution        | Eligibility port mandatory at bind; reject tests                               |
| Docs-only envelope           | Envelope required at certification; reject on out-of-envelope (Epic 4–5)       |
| Lake as second Library       | Lake = Projection only; eligibility never reads Lake as authority              |
| Orchestrator invents tactics | Ports expose envelope; Orchestrator deferred; rules locked in Tactics Contract |
| AI auto-certification        | Certification requires human operator admission                                |
| Paper path redesign creep    | Explicit non-goal; consume ports only                                          |

---

## 9. Process compliance (Workflow v1.0)

```text
Vision (Validated Knowledge) → Architecture conformance → Planning (this package)
  → Domain Model + API Contract → thin Epics → Review → Validation → Git Release
```

**STOP after planning.** No implementation until Implementation Plan + Domain Model Contract + API Contract are approved.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not absorb Orchestrator, Reporting, AI, or IDE into RC-22.
