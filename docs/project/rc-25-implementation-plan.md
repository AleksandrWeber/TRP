# RC-25 Implementation Plan — Market Qualification & Market Profile

**Document:** RC-25 Implementation Plan  
**Status:** CLOSED — Validation PASS; tag `v1.0.0-rc25`  
**Date:** 2026-08-10  
**Nature:** RC-25 complete. Market Qualification + Market Profile certified. No architecture redesign.

**Authority inputs:**

| Input                                                                       | Role                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.3 Qualification/Profile; §5.17 Live Market Data; §6 data flow)        |
| [Authority Matrix](./v2-authority-matrix.md)                                | Profile = research SoT for _profile versions_; never execution SoT; never force trades |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Market Qualification = pipeline; Market Profile = versioned venue artifact             |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)        | Qualification is per venue; profiles adjust confidence only                            |
| [RC-24 Closure](./rc-24-closure-report.md) (**CLOSED**)                     | Reporting / AI / Notification complete; Qualification deferred into this RC            |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → Domain Model → thin Epics → review → validation → release        |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | RC-25 theme: Market Qualification + Market Profile                                     |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-25-epic-breakdown.md`](./rc-25-epic-breakdown.md)                                   |
| API Contract (ports)            | [`rc-25-api-contract.md`](./rc-25-api-contract.md)                                       |
| Domain Model Contract           | [`rc-25-domain-model-contract.md`](./rc-25-domain-model-contract.md)                     |
| Integration Diagram             | [`rc-25-integration-diagram.md`](./rc-25-integration-diagram.md)                         |
| Validation Summary              | [`rc-25-validation-summary.md`](./rc-25-validation-summary.md)                           |
| Architecture Consistency Report | [`rc-25-architecture-consistency-report.md`](./rc-25-architecture-consistency-report.md) |

---

## 0. Sequencing (governance)

| RC        | Theme                                           | Status                               |
| --------- | ----------------------------------------------- | ------------------------------------ |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade     | **CLOSED**                           |
| **RC-20** | Command Center foundation                       | **CLOSED**                           |
| **RC-21** | Knowledge Lake (projection)                     | **CLOSED** (`v1.0.0-rc21`)           |
| **RC-22** | Strategy Library + Tactical Envelope (domain)   | **CLOSED** (`v1.0.0-rc22`)           |
| **RC-23** | Runtime Enforcement                             | **CLOSED** (`v1.0.0-rc23`)           |
| **RC-24** | Reporting, AI Analytics & Notification Delivery | **CLOSED** (`v1.0.0-rc24`)           |
| **RC-25** | **Market Qualification + Market Profile**       | **Epic 3** (domain; awaiting review) |

| Effect                   | Disposition                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Live Market Data         | Existing ingress (§5.17) — **consume** as read inputs; do not redesign Runtime feed path |
| Research outputs         | Where approved — **read-only** inputs to qualification                                   |
| Reporting / AI Analytics | CLOSED as RC-24 — **future consumers** of profiles; do not redesign Reporting/AI         |
| Knowledge Lake           | CLOSED as RC-21 — optional projection markers only; never Lake-as-SoT                    |
| Strategy Library         | CLOSED as RC-22 — **untouched**; Qualification does not certify strategies               |
| Runtime Enforcement      | CLOSED as RC-23 — **untouched**; Qualification is not a Gate                             |
| Trading Orchestrator     | Remains later (RC-26) — **consumer** of confidence only; **not built** in RC-25          |
| Market State             | Remains later (with Orchestrator) — **not** RC-25; distinct from Profile                 |
| Strategy Selection       | Orchestrator later — **not** RC-25                                                       |
| Multi Exchange           | Remains later (RC-27) — Qualification prepares per-venue artifacts; no second adapter    |
| Architecture Spec v2.0   | **Unchanged**                                                                            |
| Authority Matrix / Alias | **Unchanged**                                                                            |

---

## 1. Purpose

Introduce the platform’s **Market Qualification** and **Market Profile** domains.

RC-25 answers:

> Can operators run a user-triggered venue/market qualification pipeline that produces versioned Market Profiles (volatility, liquidity, trend, structure) plus qualification state, confidence, and health — without deciding trades, selecting strategies, enforcing runtime eligibility, or executing orders?

**Qualification evaluates. Profiles describe. Neither executes. Neither authorizes trading.**

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                     | RC-25 delivers (after approval)                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Qualification boundary   | Distinct module: evaluate venue/market readiness — never select, enforce, or execute         |
| Profile boundary         | Distinct module: versioned structural/behavioural market description — confidence input only |
| Qualification lifecycle  | User-triggered runs; state transitions; requalification                                      |
| Qualification state      | Explicit lifecycle state per venue/market target                                             |
| Market confidence        | Confidence artifact derived from qualification — input only, not a trade force               |
| Market health            | Health indicators for the qualified target                                                   |
| Market Profile versions  | Immutable versioned artifacts keyed by venue/market                                          |
| Profile dimensions       | Volatility, liquidity, trend, structural characteristics                                     |
| Consume Live Market Data | Read-only market observations / characteristics via approved read ports                      |
| Consume Research outputs | Read-only where approved — no ownership transfer                                             |
| Consumer read surfaces   | Ports so future Orchestrator / Reporting / AI may **read** profiles and qualification        |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-25                            | Owner / later                            |
| --------------------------------------------- | ---------------------------------------- |
| Trading Orchestrator product                  | RC-26 theme                              |
| Market State Engine                           | Later (with Orchestrator)                |
| Strategy Selection / tactic selection         | Trading Orchestrator (later)             |
| Runtime Enforcement redesign                  | RC-23 CLOSED — untouched                 |
| Strategy Library domain redesign              | RC-22 CLOSED — untouched                 |
| Reporting / AI redesign                       | RC-24 CLOSED — future consumers only     |
| Knowledge Lake redesign / Lake-as-SoT         | RC-21 CLOSED                             |
| Direct Trading Session interaction            | Forbidden — no Session command/lifecycle |
| Orders / Risk / Execution / Ledger path       | Freeze ADR-012…018                       |
| Multi Exchange expansion (second adapter)     | RC-27                                    |
| Forcing exchange or strategy choice           | Forever forbidden (Alias / Matrix)       |
| Auto-spending heavy jobs without user confirm | Forever forbidden (Alias)                |
| Expanding Tactical Envelopes via Profile      | Forbidden (Tactics Contract)             |
| REST / transport / queue / persistence design | Out of this planning package             |
| UI / Command Center qualification screens     | Ports first; UI Contract later if needed |

---

## 3. Behaviour (normative)

```text
Live Market Data (+ approved Research outputs)
        ↓  (read)
Market Qualification (user-triggered evaluate)
        ↓  (publish / version)
Market Profile (volatility / liquidity / trend / structure)
        ↓  (read only)
Future Trading Orchestrator / Reporting / AI Analytics
```

Rules:

1. Qualification **evaluates** markets (state, confidence, health, lifecycle).
2. Profiles **describe** markets (structural and behavioural characteristics).
3. Neither module **executes**, **selects strategies**, **enforces runtime**, or **authorizes** capital.
4. Qualification runs are **user-triggered** (or explicitly operator-confirmed) for heavy work.
5. Profile versions are **immutable**; corrections = new version.
6. Profiles are keyed by **venue/market** (Exchange Scope + market identity).
7. Profiles adjust **confidence** for future Orchestrator — they do **not** force trades or move balances.
8. Refreshing a Market Profile does **not** expand a strategy’s Tactical Envelope.
9. No direct Session lifecycle interaction from Qualification or Profile modules.
10. If Profile / Qualification disagree with Live Market Data facts under evaluation — inputs win for observation; Qualification owns only its evaluation artifacts.

---

## 4. Responsibilities

| Responsibility                                          | Market Qualification? | Market Profile? |
| ------------------------------------------------------- | --------------------- | --------------- |
| Own qualification lifecycle / runs                      | **Yes**               | No              |
| Own qualification state                                 | **Yes**               | Consume / cite  |
| Own market confidence                                   | **Yes**               | May cite        |
| Own market health                                       | **Yes**               | May cite        |
| Own volatility / liquidity / trend / structure profiles | Produce via pipeline  | **Yes** (store) |
| Version Market Profile artifacts                        | Trigger publish       | **Yes**         |
| Consume Live Market Data (read)                         | **Yes**               | Indirect        |
| Consume approved Research outputs (read)                | **Yes**               | Indirect        |
| Produce confidence inputs for future Orchestrator       | **Yes**               | **Yes**         |
| Produce readable artifacts for Reporting / AI           | **Yes**               | **Yes**         |
| Select strategies / tactics                             | **No**                | **No**          |
| Runtime Enforcement PASS/FAIL                           | **No**                | **No**          |
| Authorize Session start / Deployment                    | **No**                | **No**          |
| Submit orders / approve risk / mutate ledger            | **No**                | **No**          |
| Classify live Market State (regime engine)              | **No**                | **No**          |
| Redesign Reporting / AI / Lake / Library                | **No**                | **No**          |

---

## 5. Ownership

| Concern                               | Owner after RC-25                                                  |
| ------------------------------------- | ------------------------------------------------------------------ |
| Live market events / connectivity     | **Live Market Data** — unchanged                                   |
| Research experiment / campaign bodies | **Research / Campaign / Experiment** — read where approved         |
| QualificationRun / QualificationState | **Market Qualification** (research evaluation SoT for this family) |
| MarketConfidence / MarketHealth       | **Market Qualification**                                           |
| MarketProfile versions + dimensions   | **Market Profile** (research SoT for _profile versions_)           |
| Strategy certification / eligibility  | **Strategy Library** — untouched                                   |
| Runtime Enforcement Gate              | **Runtime Enforcement** — untouched                                |
| Session lifecycle / Kill Switch       | **Trading Session** — untouched                                    |
| Strategy / tactic selection           | **Trading Orchestrator** (future) — consumer only                  |
| Market State classification           | **Market State** (future) — distinct module; not Profile           |
| Report aggregations / AI narratives   | **Reporting / AI Analytics** — may later **read** profiles         |
| Analytical warehouse                  | **Knowledge Lake** — optional projection markers only              |
| Cash / fills / orders                 | **Ledger / Execution / Orders** — untouched                        |

**Anti-duplication rule:** Qualification must not invent a parallel Runtime Gate, Strategy Library, Market State engine, or Orchestrator. Profiles must not become execution or risk SoT.

---

## 6. Data sources (consume only)

| Source                  | Access in RC-25                                                        | Ownership transfer? |
| ----------------------- | ---------------------------------------------------------------------- | ------------------- |
| Live Market Data        | Primary observational feed via `LiveMarketDataReadPort`                | **No**              |
| Research outputs        | Approved read-only research artifacts via `ResearchOutputReadPort`     | **No**              |
| Exchange Scope identity | Venue keying (`exchangeScopeId`) — identity only                       | **No**              |
| Knowledge Lake          | Optional append of qualification/profile markers (projection)          | **No**              |
| Strategy Library        | **Not required** — Qualification does not certify or select strategies | N/A                 |
| Trading Session         | **Forbidden** as command target                                        | N/A                 |

No ownership transfer. No Qualification/Profile write into Session, Orders, Risk, Execution, Ledger, Library certification, Runtime Enforcement, Reporting generation, or AI decision ports.

---

## 7. Dependencies

| Dependency                          | Status / note                                                             |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Architecture Spec v2.0              | Approved constitution                                                     |
| Authority Matrix + Alias Dictionary | Approved                                                                  |
| Cluster Isolation Invariants        | Qualification per venue; confidence-only                                  |
| Live Market Data layer              | Exists (RC-16/§5.17) — consume read surface; do not redesign Runtime path |
| Research Lab / Campaign outputs     | Available where approved — consume only                                   |
| RC-21 Knowledge Lake                | Optional projection markers — do not redesign                             |
| RC-22 Strategy Library              | Untouched                                                                 |
| RC-23 Runtime Enforcement           | Untouched                                                                 |
| RC-24 Reporting / AI                | Future consumers of read ports — not redesigned                           |
| Trading Orchestrator / Market State | **Not built** — out of RC-25                                              |
| Multi Exchange second venue         | **Not built** — RC-27; RC-25 prepares per-venue model                     |

---

## 8. Definition of Done (RC-25 close)

RC-25 may close only when **all** are true:

### Architecture

1. Spec §5.3 Market Qualification and Market Profile responsibilities realized as application ports + domain — not docs-only.
2. Spec §5.17 Live Market Data consumed as input — not owned or redesigned by Qualification.
3. No Orchestrator, Market State, Strategy Selection, Runtime redesign, Reporting/AI redesign, Multi-Exchange adapter, or Session command path under RC-25.
4. Authority Matrix + Alias Dictionary honored; Profile never forces trades; Qualification never auto-spends heavy jobs without confirm.
5. Cluster Isolation: profiles keyed by venue/market; do not move balances.

### Ports & domain

6. Domain Model locked entities implemented (Qualification target/run/state, confidence, health, MarketProfile + dimensions).
7. API Contract ports implemented for Qualification lifecycle/query and Profile query/publish.
8. Live Market Data and approved Research outputs consumed via read ports only.
9. Profile versions immutable; dimensions include volatility, liquidity, trend, structural characteristics.
10. Consumer read ports available for future Orchestrator / Reporting / AI — read only.

### Integration

11. No reverse dependency into Session / Orders / Risk / Execution / Ledger / Library certification / Runtime Enforcement command ports.
12. No direct Session interaction from Qualification or Profile modules.
13. Profiles do not expand Tactical Envelopes or authorize Deployment.
14. Frozen path algorithms unchanged.

### Hygiene

15. All epic DoDs met; Validation Standard (Workflow §5) PASS.
16. Closure report + residual/deferred register updated (Orchestrator consumption, Market State, Multi-Exchange, UI).
17. Explicit non-acceptance: forcing trades; Profile-as-Risk; Qualification-as-Gate; Selection; execution.

---

## 9. Architectural risks

| Risk                                                 | Mitigation                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Profiles silently force exchange/strategy choice     | Alias forbidden usage; ports expose confidence only; no Selection APIs        |
| Qualification becomes Runtime Enforcement Gate       | Explicit non-goals; Enforcement untouched; forbidden diagram edges            |
| Profile confused with Market State                   | Domain separates Profile (versioned research) from State (future live regime) |
| Qualification writes Session / starts bots           | Forbidden Session interaction; no Bot aggregate                               |
| Auto-running expensive qualification without confirm | User-triggered / confirmed run commands only                                  |
| Profile refresh expands Tactical Envelope            | Tactics Contract rule locked; Domain forbids envelope mutation                |
| Scope creep into Orchestrator / Multi-Exchange / UI  | Explicit non-goals; epic constraints; ports-first                             |
| Shadow risk / shadow accounting via “health scores”  | Confidence/health are research artifacts — never Risk Decision or Ledger SoT  |

---

## 10. Process compliance (Workflow v1.0)

```text
Vision (evaluate markets, do not trade) → Architecture conformance → Planning (this package)
  → API Contract + Domain Model → thin Epics → Review → Validation → Git Release
```

UI Contract is **not** part of this planning package (ports-first). If a Qualification / Profile UI surface is approved later, a UI Contract must precede frontend Epics.

**STOP after planning.** No implementation until Implementation Plan + API Contract + Domain Model are approved.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not absorb Orchestrator, Market State, Selection, Runtime redesign, Reporting/AI redesign, Multi-Exchange, or Session command paths into RC-25.
