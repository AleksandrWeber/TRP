# RC-26 Implementation Plan — Trading Orchestrator & Market State

**Document:** RC-26 Implementation Plan  
**Status:** CLOSED — Validation PASS; tag `v1.0.0-rc26`  
**Date:** 2026-08-10  
**Nature:** Epic 6 consumer-read ports + authority conformance complete. No REST / persistence / execution. No architecture redesign.

**Authority inputs:**

| Input                                                                       | Role                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.4 Market State; §5.5 Trading Orchestrator; §7 Decision Flow)      |
| [Authority Matrix](./v2-authority-matrix.md)                                | Orchestrator = policy/orchestration consumer — not SoT for money or fills          |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Brain → Trading Orchestrator; not AI; not Execution Engine                         |
| [Tactics Contract](./v2-tactics-contract.md)                                | Selection only inside certified Tactical Envelope; no envelope invention           |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)        | Per–Exchange Scope selection; policy ≠ engine                                      |
| [RC-25 Closure](./rc-25-closure-report.md) (**CLOSED**)                     | Qualification + Profile certified; Orchestrator/Market State deferred into this RC |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → Domain Model → thin Epics → review → validation → release    |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | RC-26 theme: Trading Orchestrator (thin) + Market State inputs                     |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-26-epic-breakdown.md`](./rc-26-epic-breakdown.md)                                                                     |
| API Contract (ports)            | [`rc-26-api-contract.md`](./rc-26-api-contract.md)                                                                         |
| Domain Model Contract           | [`rc-26-domain-model-contract.md`](./rc-26-domain-model-contract.md)                                                       |
| Integration Diagram             | [`rc-26-integration-diagram.md`](./rc-26-integration-diagram.md)                                                           |
| Validation Summary              | [`rc-26-validation-summary.md`](./rc-26-validation-summary.md)                                                             |
| Architecture Consistency Report | [`rc-26-architecture-consistency-report.md`](./rc-26-architecture-consistency-report.md)                                   |
| Epic 1 Report                   | [`rc-26-epic1-trading-orchestrator-market-state-boundary.md`](./rc-26-epic1-trading-orchestrator-market-state-boundary.md) |
| Epic 1 Boundary Diagram         | [`rc-26-epic1-boundary-diagram.md`](./rc-26-epic1-boundary-diagram.md)                                                     |
| Epic 2 Report                   | [`rc-26-epic2-market-state-input-integration.md`](./rc-26-epic2-market-state-input-integration.md)                         |
| Epic 3 Report                   | [`rc-26-epic3-domain-model.md`](./rc-26-epic3-domain-model.md)                                                             |
| Epic 4 Report                   | [`rc-26-epic4-trading-orchestrator-domain-model.md`](./rc-26-epic4-trading-orchestrator-domain-model.md)                   |
| Epic 5 Report                   | [`rc-26-epic5-trading-orchestrator-workflow-ports.md`](./rc-26-epic5-trading-orchestrator-workflow-ports.md)               |
| Epic 6 Report                   | [`rc-26-epic6-consumer-read-authority.md`](./rc-26-epic6-consumer-read-authority.md)                                       |
| Epic 6 Internal Audit           | [`rc-26-epic6-internal-audit-report.md`](./rc-26-epic6-internal-audit-report.md)                                           |
| Epic 6 Readiness                | [`rc-26-epic6-readiness-report.md`](./rc-26-epic6-readiness-report.md)                                                     |

---

## 0. Sequencing (governance)

| RC        | Theme                                           | Status                                       |
| --------- | ----------------------------------------------- | -------------------------------------------- |
| **RC-19** | Spec skeleton + Exchange Scope + Bot Facade     | **CLOSED**                                   |
| **RC-20** | Command Center foundation                       | **CLOSED**                                   |
| **RC-21** | Knowledge Lake (projection)                     | **CLOSED** (`v1.0.0-rc21`)                   |
| **RC-22** | Strategy Library + Tactical Envelope (domain)   | **CLOSED** (`v1.0.0-rc22`)                   |
| **RC-23** | Runtime Enforcement                             | **CLOSED** (`v1.0.0-rc23`)                   |
| **RC-24** | Reporting, AI Analytics & Notification Delivery | **CLOSED** (`v1.0.0-rc24`)                   |
| **RC-25** | Market Qualification + Market Profile           | **CLOSED** (`v1.0.0-rc25`)                   |
| **RC-26** | **Trading Orchestrator + Market State**         | **Epic 6** (consumer reads; awaiting review) |

| Effect                   | Disposition                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Strategy Library         | CLOSED as RC-22 — **consume** Lookup / Eligibility / Envelope; do not certify                        |
| Runtime Enforcement      | CLOSED as RC-23 — **consume** Gate; do not replace or soft-fail                                      |
| Market Qualification     | CLOSED as RC-25 — **consume** consumer read ports; do not re-evaluate as Selection                   |
| Market Profile           | CLOSED as RC-25 — **consume** confidence / profile projections; do not force trades                  |
| Live Market Data         | Existing ingress (§5.17) — Market State **consumes** observations; Orchestrator does not own feed    |
| Trading Session          | Existing SoT — Orchestrator may issue **binding / mission intents**; Session remains lifecycle SoT   |
| Risk Engine              | Existing SoT — Orchestrator may **read** policy/constraint context for selection; never approve risk |
| Reporting / AI Analytics | CLOSED as RC-24 — **future readers** of Orchestrator / Market State read models; not redesigned      |
| Command Center           | CLOSED as RC-20 foundation — may later surface read models / operator confirm; UI not in this RC     |
| Knowledge Lake           | CLOSED as RC-21 — optional projection markers only; never Lake-as-SoT                                |
| Orders / Execution       | Freeze ADR-012…018 — **untouched**; Orchestrator never submits orders                                |
| Multi Exchange           | Remains later (RC-27)                                                                                |
| Architecture Spec v2.0   | **Unchanged**                                                                                        |
| Authority Matrix / Alias | **Unchanged**                                                                                        |

---

## 1. Purpose

Introduce the platform’s **Trading Orchestrator** and **Market State** domains.

RC-26 answers:

> Can the platform classify current market conditions and coordinate strategy/tactic selection plus handoff into the Session / Risk / Orders path — without becoming a second Qualification engine, a second Runtime Gate, an Execution Engine, or an AI capital authority?

**Market State describes. Trading Orchestrator coordinates. Neither executes. Neither replaces module ownership.**

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                         | RC-26 delivers (after approval)                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Market State boundary        | Distinct module: normalized current-market classification + lifecycle — not Qualification      |
| Market State lifecycle       | State transitions for current normalized market state                                          |
| Market State inputs          | Consume Live Market Data + Qualification + Profile read ports                                  |
| Orchestrator boundary        | Distinct module: workflow coordination, decision sequencing, orchestration lifecycle           |
| Strategy Selector capability | Select among **certified** Library members (via Library + Enforcement)                         |
| Tactical Engine capability   | Select tactics **only inside** certified Tactical Envelope                                     |
| Orchestration workflow       | Sequence: State → select strategy → select tactics → Gate → Session handoff intent             |
| Session handoff intents      | Propose bind / mission context; Session remains SoT                                            |
| Risk context consumption     | Read policy / constraint inputs that inform selection filters — never Risk Decisions           |
| Consumer read surfaces       | Ports so Reporting / AI Analytics / Command Center may **read** state + orchestration outcomes |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-26                            | Owner / later                            |
| --------------------------------------------- | ---------------------------------------- |
| Strategy certification / Library redesign     | RC-22 CLOSED — untouched                 |
| Runtime Enforcement redesign / soft-fail Gate | RC-23 CLOSED — untouched                 |
| Market Qualification evaluation ownership     | RC-25 CLOSED — consume only              |
| Market Profile version publish ownership      | RC-25 CLOSED — consume only              |
| Orders submit / Execution Engine / Adapter    | Freeze ADR-012…018                       |
| Risk Decision production / Kill Switch SoT    | Risk Engine / Session safety             |
| Reporting / AI redesign                       | RC-24 CLOSED — future consumers only     |
| Knowledge Lake redesign / Lake-as-SoT         | RC-21 CLOSED                             |
| Inventing tactics outside Envelope            | Forever forbidden (Tactics Contract)     |
| Silent strategy-version mutation              | Forever forbidden                        |
| AI as capital / trade authority               | Forever forbidden (Alias / Matrix)       |
| Multi Exchange expansion (second adapter)     | RC-27                                    |
| REST / transport / queue / persistence design | Out of this planning package             |
| UI / Command Center orchestration screens     | Ports first; UI Contract later if needed |
| Live capital enablement                       | Future ADR                               |

---

## 3. Behaviour (normative)

```text
Live Market Data (+ Qualification / Profile confidence reads)
        ↓  (read)
Market State (classify current conditions)
        ↓  (read)
Trading Orchestrator
  ├── Strategy Library (certified candidates + envelopes)
  ├── Runtime Enforcement (Gate — fail-closed)
  ├── Market Qualification / Profile (confidence inputs)
  ├── Risk Engine (policy/constraint reads only)
  └── Trading Session (handoff / binding intents)
        ↓  (read models)
Reporting / AI Analytics / Command Center
```

**Decision Flow alignment (Spec §7):**

```text
Market State → Strategy Selector → Tactical Engine → Trading Orchestrator
  → (Session / Signal Intent path) → Risk Engine → Execution → Exchange
```

Reading under this plan:

1. **Market State** classifies current conditions — selection input only.
2. **Strategy Selector** (Orchestrator capability) chooses only a **certified** strategy version.
3. **Tactical Engine** (Orchestrator capability) selects parameters **only inside** the certified Envelope.
4. **Trading Orchestrator** coordinates sequencing and Session handoff intents. It does **not** submit orders.
5. **Runtime Enforcement** remains the sole Gate before Deployment/Session bind.
6. **Risk Engine** remains the sole Risk Decision authority after executable intents exist.
7. **Execution / Orders** remain untouched SoT owners.

### 3.1 Hard behaviour rules

1. Orchestrator **coordinates**; it never replaces Library, Enforcement, Qualification, Profile, Session, Risk, Orders, or Execution ownership.
2. Market State **describes** current market; it never becomes a second Market Qualification pipeline.
3. Selection never invents envelope points or changes strategy version silently.
4. Confidence from Profile / Qualification informs selection weight — never forces trades.
5. Gate validation remains fail-closed; Orchestrator must not soft-pass Enforcement.
6. Orchestrator never calls Execution Engine or creates Orders.
7. Risk Decisions are never produced by Orchestrator.
8. Provider payloads from Live Market Data never become Market State domain truth without platform-owned mapping.

---

## 4. Responsibility matrix

| Behaviour                                               | Market State | Trading Orchestrator |
| ------------------------------------------------------- | ------------ | -------------------- |
| Normalize / classify current market conditions          | **Yes**      | Consume              |
| Own market-state lifecycle / transitions                | **Yes**      | No                   |
| Select certified strategy version                       | No           | **Yes** (Selector)   |
| Select tactics inside Envelope                          | No           | **Yes** (Tactical)   |
| Sequence decision workflow + orchestration lifecycle    | No           | **Yes**              |
| Consume Library / Enforcement / Qualification / Profile | Qual+Profile | **Yes**              |
| Consume Live Market Data                                | **Yes**      | Indirect via State   |
| Issue Session binding / mission intents                 | No           | **Yes** (handoff)    |
| Read Risk policy / constraint context                   | No           | **Yes** (read only)  |
| Produce consumer read models (Reporting / AI / CC)      | **Yes**      | **Yes**              |
| Run Qualification evaluation / publish Profile versions | **No**       | **No**               |
| Certify strategies / expand Envelope                    | **No**       | **No**               |
| Runtime Enforcement PASS/FAIL ownership                 | **No**       | Consume Gate only    |
| Approve risk / submit orders / mutate ledger            | **No**       | **No**               |
| Generate AI trading decisions                           | **No**       | **No**               |

---

## 5. Ownership

| Concern                                  | Owner after RC-26                                                     |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Live market events / connectivity        | **Live Market Data** — unchanged                                      |
| Qualification runs / confidence / health | **Market Qualification** — unchanged (consumed)                       |
| Market Profile versions + dimensions     | **Market Profile** — unchanged (consumed)                             |
| **MarketState** + lifecycle              | **Market State** (current-condition SoT for classifications)          |
| Strategy certification / eligibility     | **Strategy Library** — untouched                                      |
| Runtime Enforcement Gate                 | **Runtime Enforcement** — untouched                                   |
| **OrchestrationRun / SelectionDecision** | **Trading Orchestrator** (coordination SoT — not money/fills)         |
| Session lifecycle / Kill Switch          | **Trading Session** — untouched (accepts handoff intents)             |
| Risk Decisions                           | **Risk Engine** — untouched                                           |
| Orders / Fills / Execution               | **Orders / Execution / Ledger** — untouched                           |
| Report aggregations / AI narratives      | **Reporting / AI Analytics** — may **read** Orchestrator/State models |
| Command Center projections / commands    | **Command Center** — may later surface reads / operator confirm       |
| Analytical warehouse                     | **Knowledge Lake** — optional projection markers only                 |

**Anti-duplication rule:** Orchestrator must not invent a parallel Library, Gate, Qualification, Profile, Risk, Orders, or Execution engine. Market State must not invent a parallel Qualification pipeline or Profile store.

---

## 6. Data sources (consume only)

| Source                        | Access in RC-26                                               | Ownership transfer? |
| ----------------------------- | ------------------------------------------------------------- | ------------------- |
| Live Market Data              | Market State primary observational feed                       | **No**              |
| Market Qualification          | Consumer read ports (lifecycle / confidence / health)         | **No**              |
| Market Profile                | Consumer read ports (latest / version metadata / dimensions)  | **No**              |
| Strategy Library              | Lookup / Eligibility / Envelope reads                         | **No**              |
| Runtime Enforcement           | `validateDeployment` (or equivalent Gate) before bind intents | **No**              |
| Risk Engine / Exchange Policy | Constraint / policy **reads** informing selection filters     | **No**              |
| Trading Session               | Handoff / binding **intents** into Session-owned lifecycle    | **No**              |
| Knowledge Lake                | Optional append of orchestration/state markers (projection)   | **No**              |

No ownership transfer. No Orchestrator/State write into Library certification, Enforcement decisions, Qualification evaluation, Profile publish, Orders, Execution, Ledger, Reporting generation, or AI decision ports.

---

## 7. Dependencies

| Dependency                          | Status / note                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| Architecture Spec v2.0              | Approved constitution                                           |
| Authority Matrix + Alias Dictionary | Approved                                                        |
| Tactics Contract                    | Binding for Selector / Tactical Engine                          |
| Cluster Isolation Invariants        | Per-venue selection; no cloned engines                          |
| RC-22 Strategy Library              | Certified members + envelopes — consume                         |
| RC-23 Runtime Enforcement           | Fail-closed Gate — consume                                      |
| RC-25 Qualification + Profile       | Confidence inputs — consume                                     |
| Live Market Data (§5.17)            | Market State consume                                            |
| Trading Session / Deployment        | Handoff target — Session remains SoT                            |
| Risk Engine                         | Policy/constraint reads — Risk remains decision SoT             |
| RC-24 Reporting / AI                | Future consumers of read ports — not redesigned                 |
| RC-20 Command Center                | Future surface for read models / operator confirm — UI deferred |
| Multi Exchange second venue         | **Not built** — RC-27                                           |

---

## 8. Definition of Done (RC-26 close)

RC-26 may close only when **all** are true:

### Architecture

1. Spec §5.4 Market State and §5.5 Trading Orchestrator responsibilities realized as application ports + domain — not docs-only.
2. Spec §7 Decision Flow preserved: State → Selector → Tactical → Orchestrator → Risk → Execution (Orchestrator never skips Risk/Execution).
3. No Qualification ownership transfer, no Gate replacement, no Orders/Execution path under Orchestrator.
4. Authority Matrix + Alias Dictionary + Tactics Contract honored.
5. Market State never equals Market Qualification; Profile confidence never equals Market State.

### Ports & domain

6. Domain Model locked entities implemented (MarketState, transitions, OrchestrationRun, SelectionDecision, TacticSelection, SessionHandoffIntent).
7. API Contract ports implemented for Market State lifecycle/query and Orchestrator workflow/query.
8. Upstream modules consumed via approved read / Gate / Session-intent ports only.
9. Consumer read ports available for Reporting / AI Analytics / Command Center — read only.

### Integration

10. No reverse dependency into Library certification, Qualification evaluation, Profile publish, Orders, Execution, Ledger, or Risk Decision production.
11. Envelope selection only; no invented tactics.
12. Frozen path algorithms unchanged.

### Hygiene

13. All epic DoDs met; Validation Standard (Workflow §5) PASS.
14. Closure report + residual/deferred register updated (UI, Multi-Exchange, REST, live capital).

---

## 9. Non-goals reminder (permanent for this RC)

- Do not implement execution logic, order submission, or adapter calls.
- Do not implement strategy certification or Runtime Enforcement redesign.
- Do not implement Qualification evaluation or Profile publishing inside Orchestrator/State.
- Do not implement Reporting / AI / Notification redesign.
- Do not implement multi-exchange, REST product, persistence product, or UI.
- Do not redesign Architecture Spec v2.0.

---

## 10. STOP gate

**CLOSED.** RC-26 Validation **PASS**; tag `v1.0.0-rc26`.

Next: **RC-27 Planning** under a separate task.

---

## Approval

| Checkpoint                              | Status       |
| --------------------------------------- | ------------ |
| Planning package complete               | **Approved** |
| Epic 1 boundary                         | **Approved** |
| Epic 2 Market State input reads         | **Approved** |
| Epic 3 Market State domain model        | **Approved** |
| Epic 4 Trading Orchestrator domain      | **Approved** |
| Epic 5 Trading Orchestrator workflow    | **Approved** |
| Epic 6 Consumer reads + conformance     | **Approved** |
| Human approval for Validation & Release | **Approved** |
| Validation / Certification / Closure    | **CLOSED**   |
