# Trading Research Platform — Architecture Specification v2.0

**Document:** Architecture Specification v2.0  
**Authority level:** **Canonical architectural constitution**  
**Status:** Approved  
**Date:** 2026-08-10  
**Nature:** Single coherent architectural description compiled from approved normative inputs  
**Does not redefine:** ADR-012…ADR-018 Freeze, Product Vision, UX Vision, or companion contracts

---

## Authority

This specification is the **canonical architectural constitution** of Trading Research Platform (TRP).

| Rule                                     | Binding                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Future implementation                    | Must derive module design, ownership, and boundaries from this Spec                                             |
| Future ADRs                              | May refine ownership only when a real gap appears; must not silently contradict this Spec or ACTIVE Freeze ADRs |
| Story Specs / Epics / Release Plans      | Must align with this Spec; cite companions for detailed contracts                                               |
| Conflicts with companions                | Companions remain authoritative for their domains (Authority Matrix, Tactics, Isolation, Alias, Glossary, C4)   |
| Conflicts with ACTIVE ADRs (ADR-012…018) | ADR Freeze wins until a new ADR supersedes it                                                                   |
| Conflicts with Product / UX Vision       | Vision owns product “what/why” and experience “how it feels”; this Spec owns system architecture                |
| Conflicts with CANONICAL                 | Stack, stages, MVP constraints, and reproducibility remain CANONICAL                                            |

This document **integrates** approved preparation artifacts. It does **not** redesign architecture, invent modules, change ownership, or introduce new terminology.

---

## 1. Purpose

Trading Research Platform is an engineering-first **Research Operating System** for discovering, validating, explaining, and—when earned—deploying quantitative trading strategies.

It exists to replace intuition-driven trading with evidence-driven decisions.

Core question:

> Does this strategy have a statistically significant edge under realistic assumptions?

**Knowledge is the primary product.** Trading is one controlled application of that knowledge.

Cryptocurrency (Binance) is the first market—not the product ceiling.

TRP is **not**:

- a trading bot product (UI may say “Bot”; canonical runtime remains Trading Session)
- an autonomous AI trader
- an HFT system
- a signal-selling or copy-trading service
- a consumer “get rich quick” product

Nothing reaches production without validation and human approval. Real-capital trading remains out of scope until a future ADR.

Product purpose authority: [Product Vision](./trp-product-vision.md).

---

## 2. Design Philosophy

These permanent philosophies govern every architectural choice. Engineering detail lives in [Architecture Principles](../00-architecture-principles.md).

### Research First

Every strategy begins in the laboratory. Production is the last step, never the first. Research creates knowledge; knowledge creates confidence; confidence enables production.

### Validated Knowledge

Profitability alone never justifies trust. A strategy earns production use only through evidence—historical testing, fees and slippage realism, walk-forward and related validation, risk evaluation, and certification into the Strategy Library. Runtime never invents strategy logic. Adaptive tactics are limited to pre-validated configuration (see [Tactics Contract](./v2-tactics-contract.md)).

### Mathematics Before AI

Deterministic logic decides. AI explains, summarizes, and assists research. AI never controls capital and never becomes the final authority for trading or finance.

### Information On Demand

Operators and researchers see what they need for the current task. Surfaces use progressive disclosure: summaries lead to evidence, evidence leads to provenance. Dashboards answer “what is happening now?” as projections—not as competing sources of truth. Experience rules: [UX Vision](./trp-ux-vision.md).

### Modular Architecture

The platform is a modular monolith of single-responsibility subsystems. Modules are replaceable at their boundaries (exchanges, AI providers, data sources) while the core path stays stable. Markets are plugins; the research OS core is not rewritten per venue.

### Explainable Decisions

Every important decision must answer _why_—why this strategy, why this tactic, why this trade, why this recommendation. Black-box decision making is unacceptable. Narrative (including AI) explains; it never overrides SoT.

### Evolution Instead Of Rewrite

Architecture expands through small, evidence-backed evolution. V2 extends the RC-16/RC-18 frozen execution path with facades and scopes—it does not create a parallel trading stack. Large rewrites are discouraged; stability is preferred over novelty.

---

## 3. High-Level Architecture

TRP is one **modular monolith**. Product surfaces (Bot, Cluster, Command Center, Knowledge Lake, Orchestrator) are **facades, scopes, projections, or orchestration**—not second engines.

Canonical container picture (approved): [C4 Container Diagram](./v2-c4-container-diagram.md).

### Building blocks (system view)

| Building block                            | Responsibility                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Research Lab**                          | Historical experimentation (campaigns, backtest, walk-forward, and related validation). Does not place paper or live orders. |
| **Strategy Library**                      | Store of certified strategy versions and their tactical envelopes. Only library members may enter the production path.       |
| **Market Qualification / Market Profile** | User-triggered venue research and versioned confidence artifacts. Never force trades.                                        |
| **Market State**                          | Classification of current conditions that informs selection. Does not execute.                                               |
| **Trading Orchestrator**                  | Coordinates strategy/tactic selection and handoff into the risk → orders → execution path. Not AI. Not the Execution Engine. |
| **Trading Session + Strategy Runtime**    | One autonomous trading worker lifecycle (UI: Bot). Runtime evaluates market events and emits Signal Intents.                 |
| **Risk Engine**                           | Single platform authority for risk decisions. Consumes platform limits and per–Exchange Scope policies.                      |
| **Orders → Execution Engine → Adapter**   | Sole order lifecycle and sole adapter entry (paper now; live later via ADR).                                                 |
| **Exchange Scope**                        | Isolation boundary for one exchange (UI: Cluster)—accounts, capacity, policies, adapter binding.                             |
| **Accounting**                            | Fill → Position → Ledger (financial SoT) → Portfolio (projection).                                                           |
| **Knowledge Lake**                        | Append-only analytical projection/warehouse from research and trading events. Never financial SoT.                           |
| **Reporting + AI**                        | Human-facing aggregations and narrative. Non-authoritative for money and lifecycle.                                          |
| **Command Center / Dashboard**            | Operations workspace and attention surfaces. Commands only through canonical ports.                                          |

### One execution path

V2 does not introduce a parallel path. All production trading follows:

```text
Market Event
  → Strategy Runtime
  → Signal Intent
  → Orders
  → Risk Engine (platform + Exchange Risk Policy inputs)
  → Execution Engine
  → Adapter (paper now; live later via ADR)
  → Fill
  → Position → Ledger → Portfolio
```

Trading Session remains the runtime lifecycle aggregate. “Bot” must not introduce a second runtime.

---

## 4. Architectural Principles

Permanent rules. Prefer references over restatement.

### Source of Truth

Every fact family has one owner. Surfaces that “know” something are **SoT**, **policy input**, **projection**, **narrative**, or **command UI**—never more than one primary role.

Normative detail: [Authority Matrix](./v2-authority-matrix.md).

Derived conflict rules:

1. Cash, positions, fills → Ledger / Fill / Orders win; Lake and UI lose.
2. Lifecycle disagreement → Trading Session wins; UI refreshes from owning Session interfaces.
3. AI tactic outside validated set → reject; require research pipeline.
4. Emergency stop → only through durable Kill Switch / Session commands.
5. Reporting may aggregate projections but must not recompute authoritative ledger balances with ad-hoc math.

### Boundaries

- Research never places production orders.
- Strategy Runtime never submits to exchanges.
- Trading Orchestrator never bypasses Risk or Execution Engine.
- Knowledge Lake never overrides Orders, Execution, or Ledger.
- Command Center never owns finance or lifecycle truth.

Module ownership Freeze: ADR-012…ADR-018 (see [ADR Index](../adr/README.md)).

### Module ownership

One responsibility per subsystem. Shared engines stay shared across exchanges. Ownership changes require a new ADR—not silent Spec drift.

### Read / Write responsibilities

| Kind                                                     | May mutate trading / finance state?            |
| -------------------------------------------------------- | ---------------------------------------------- |
| SoT owners (Orders, Risk, Execution, Ledger, Session, …) | Yes, via owning module interfaces / ports only |
| Policy inputs (Exchange Risk Policy, Tactical Envelope)  | No as trade mutation; config change ≠ trade    |
| Projections (Lake, Portfolio view, Dashboard)            | No                                             |
| Narrative (AI Analyst / Assistant)                       | No                                             |
| Command UI (Command Center)                              | Only by calling SoT command ports / contracts  |

### Isolation principles

Exchange Scope isolates **resources and policies**, not engines.

Shared across scopes: Strategy Library, Research Lab, Strategy Runtime implementation, Orders, Risk Engine, Execution Engine, accounting modules, Knowledge Lake model, Trading Orchestrator.

Isolated per scope: accounts, session capacity, exchange risk policy, adapter credentials, allowlists, scoped journals/stats.

Normative invariants: [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md).

### Naming

Product language may differ from canonical names. Code, ADRs, and system interfaces use canonical names.

Binding: [Alias Dictionary](./v2-alias-dictionary.md). Definitions: [Architecture Glossary](./v2-architecture-glossary.md).

---

## 5. Core Modules

Architecture only—no interface catalogs, storage schemas, queues, or implementation detail.

Terminology definitions: [Architecture Glossary](./v2-architecture-glossary.md).

### 5.1 Research Lab

**Purpose.** Scientific experimentation for strategy hypotheses.

**Responsibilities.** Campaigns and experiments; historical backtesting; walk-forward and related validation evidence; research metrics and experiment records.

**Inputs.** Market data (historical), strategy definitions under test, experiment configuration, fee/slippage assumptions.

**Outputs.** Experiment results, validation evidence, reports feeding Knowledge and certification candidates.

**Interactions.** Feeds Strategy Library upon certification; contributes events/artifacts to Knowledge Lake; never calls Execution Engine for capital.

### 5.2 Strategy Library

**Purpose.** Authoritative store of strategies that earned certification.

**Responsibilities.** Hold certified strategy versions; expose tactical envelopes for those versions; gate production use to library members only.

**Inputs.** Certified strategy versions and envelopes from the validation pipeline.

**Outputs.** Certified algorithms and allowed tactic sets for Orchestrator, Deployment, and Runtime.

**Interactions.** Consumed by Trading Orchestrator and Session Deployment binding; expanded only through research + certification—not at runtime.

### 5.3 Market Qualification and Market Profile

**Purpose.** Assess venues/markets before trusting them for lab, paper, or live use.

**Responsibilities.** User-triggered qualification pipelines; versioned Market Profile artifacts; confidence inputs—not trade force.

**Inputs.** Venue/market data and historical characteristics; user confirmation to run heavy jobs.

**Outputs.** Versioned Market Profiles for Orchestrator confidence and AI explanation.

**Interactions.** Profiles inform selection confidence; they do not move balances, authorize orders, or expand tactical envelopes by themselves.

### 5.4 Market State

**Purpose.** Classify current market conditions for selection context.

**Responsibilities.** Produce market-condition classifications (for example regime signals) used as selection inputs.

**Inputs.** Live or recent market observations.

**Outputs.** Market State classifications for Trading Orchestrator / Strategy Selector logic.

**Interactions.** Informs tactic/strategy selection inside envelopes; does not execute or approve risk.

### 5.5 Trading Orchestrator

**Purpose.** Coordinate which certified strategy and tactics apply, and hand off into the canonical trading path.

**Responsibilities.** Selection among certified strategies; selection of tactics **inside** the Tactical Envelope; consumption of Market State, Market Profile confidence, and Exchange Scope policy; handoff into Session / Risk / Orders path.

**Inputs.** Strategy Library, envelopes, Market State, Market Profiles, Exchange Scope policies, operator commands.

**Outputs.** Selection/coordination decisions and session binding intents—not orders, not fills, not ledger entries.

**Interactions.** May recommend or select envelope points. Must not invent envelope points, change strategy version silently, submit orders, or act as AI capital authority. Detail: [Tactics Contract](./v2-tactics-contract.md).

### 5.6 Trading Session and Strategy Runtime

**Purpose.** One autonomous trading worker lifecycle and its evaluation loop.

**Responsibilities.** Session lifecycle (ADR-014); bind immutable Strategy Deployment; evaluate market events; emit Signal Intents; honor pause/stop/kill and recovery semantics.

**Inputs.** Certified deployment, market events, lifecycle commands, recovery state.

**Outputs.** Signal Intents; durable session lifecycle state.

**Interactions.** UI may label Session as Bot. Runtime does not self-approve risk or call exchange adapters. Recovery remains fail-closed under existing Freeze.

### 5.7 Risk Engine and Exchange Risk Policy

**Purpose.** Single platform authority for executable risk decisions.

**Responsibilities.** Approve or reject risk for intended orders; apply platform limits; consume per–Exchange Scope policy inputs; durable safety controls (including Kill Switch semantics).

**Inputs.** Intended order context, platform limits, Exchange Risk Policy, session/deployment tactics, account/session state.

**Outputs.** Risk Decisions (SoT for risk approval/rejection).

**Interactions.** Strategy Runtime must not self-approve. Per-exchange shadow risk engines are forbidden. Policy ≠ engine: [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md).

### 5.8 Orders

**Purpose.** System of record for order lifecycle.

**Responsibilities.** Create and track orders only after required risk approval; remain authoritative for order state.

**Inputs.** Signal Intent path outcomes, Risk Decisions, execution reports.

**Outputs.** Order lifecycle facts for Execution Engine, audit, and projections.

**Interactions.** Consumed by Execution Engine; projected to Lake/UI; never invented by Dashboard or AI.

### 5.9 Execution Engine and Exchange Adapter

**Purpose.** Sole entry that submits or cancels orders through an adapter.

**Responsibilities.** Route approved orders to the bound adapter; produce Fill facts; isolate venue connectivity behind adapters.

**Inputs.** Approved orders; adapter binding from Exchange Scope.

**Outputs.** Execution results and immutable Fills.

**Interactions.** Strategy, UI, and Orchestrator must not call adapters directly. Paper adapter is current Freeze mode; live adapter requires a future ADR.

### 5.10 Exchange Scope (UI: Cluster)

**Purpose.** Isolation boundary for one exchange’s resources and policies.

**Responsibilities.** Bind adapter identity; own Trading Accounts for that venue; enforce session capacity; hold Exchange Risk Policy and allowlists; scope journals/statistics projections.

**Inputs.** Exchange configuration, credentials, policy values, account setup.

**Outputs.** Scoped accounts, capacity, policy inputs, adapter binding context.

**Interactions.** Does not clone Risk, Ledger, Portfolio, or Execution engines. Adding venues means new scope + adapter + policy—not forked stacks.

### 5.11 Trading Account (UI: Wallet)

**Purpose.** Account balances and reservations within one Exchange Scope.

**Responsibilities.** Hold account identity for orders/fills; participate in Ledger SoT movements.

**Inputs.** Accounting movements from fills/fees/reservations.

**Outputs.** Account state for Risk, Ledger, and projections.

**Interactions.** Orders in scope A must not consume accounts of scope B. UI must not treat Wallet as a second ledger.

### 5.12 Accounting — Fill, Position, Ledger, Portfolio

**Purpose.** Deterministic financial truth and rebuildable views.

**Responsibilities.** Consume Fills; maintain Positions; Ledger as SoT for cash, reservations, fees, realized movements; Portfolio as rebuildable equity/exposure projection.

**Inputs.** Immutable Fill facts and valuation inputs.

**Outputs.** Positions, Ledger entries, Portfolio projections.

**Interactions.** Reports and Lake may read; they must not become balance authority. Rebuild remains deterministic under ADR-015.

### 5.13 Knowledge Lake

**Purpose.** Analytical memory of research and trading activity.

**Responsibilities.** Append-only warehouse/projection of research and trading events; feed reporting, AI context, and future ML features.

**Inputs.** Research outputs and trading/ops events derived from SoT paths.

**Outputs.** Analytical datasets and queryable history for non-authoritative consumers.

**Interactions.** Never financial SoT; never rewrites Orders or Ledger.

### 5.14 Reporting

**Purpose.** Human-facing aggregations and scheduled reports.

**Responsibilities.** Summarize projections; label paper vs live; present evidence without inventing finance.

**Inputs.** Knowledge Lake and other projections; SoT-derived facts via approved read models.

**Outputs.** Reports for users and operators.

**Interactions.** Must not recompute authoritative ledger balances with ad-hoc math; must not approve risk.

### 5.15 AI Analyst / AI Assistant

**Purpose.** Narrative research and explanation support.

**Responsibilities.** Explain results; summarize; recommend hypotheses for humans to consider; assist knowledge search and documentation.

**Inputs.** Projections, reports, research artifacts (via gateway).

**Outputs.** Narrative only.

**Interactions.** Never autonomous capital actions; never silent config changes; never out-of-envelope tactic application. AI access remains gateway-mediated only under current CANONICAL scope.

### 5.16 Command Center and Dashboard

**Purpose.** Operator attention and command entry.

**Responsibilities.** Show health and status projections; accept pause/stop/kill/tactic-select intents; route commands to Session / Risk ports.

**Inputs.** Projections from SoT-backed read models / ports; operator intent.

**Outputs.** Commands into canonical ports; non-authoritative displays.

**Interactions.** Not a financial or lifecycle state machine. Telegram (when used) is notification projection only—not a control plane in V2.

### 5.17 Live Market Data

**Purpose.** Connectivity and market event ingress for runtime and qualification.

**Responsibilities.** Provide market events and connectivity health; keep provider payloads from leaking as domain truth.

**Inputs.** Exchange/market feeds via adapters/providers.

**Outputs.** Market events for Runtime, Qualification, and Market State.

**Interactions.** Consumed by research and runtime; domain models remain platform-owned.

---

## 6. Data Flow

How knowledge and facts move through the platform:

```text
Research
  ↓
Validation
  ↓
Paper Trading
  ↓
Execution
  ↓
Knowledge Lake
  ↓
Reporting
  ↓
User
```

**Research.** Hypotheses and strategy variants are tested in the Research Lab against historical data under realistic assumptions.

**Validation.** Evidence determines robustness. Passing work becomes certified Strategy Library members with tactical envelopes. Failures remain searchable knowledge.

**Paper Trading.** Certified deployments run in Trading Sessions under paper Freeze—same canonical path as future live, different adapter/mode.

**Execution.** Signal Intent → Orders → Risk → Execution Engine → Adapter → Fill → accounting. One path only.

**Knowledge Lake.** Research and trading events project into the analytical warehouse.

**Reporting.** Humans receive aggregations and narratives built from projections.

**User.** Researchers and operators interpret evidence, approve next research, and issue commands through Command Center—not by editing SoT caches.

Production outcomes feed new research hypotheses. The loop does not stop learning.

---

## 7. Decision Flow

How a trading decision is made at runtime:

```text
Market State
  ↓
Strategy Selector
  ↓
Tactical Engine
  ↓
Trading Orchestrator
  ↓
Risk Engine
  ↓
Execution
  ↓
Exchange
```

Reading of this flow under approved architecture:

1. **Market State** classifies conditions and informs selection.
2. **Strategy Selector** (capability of Trading Orchestrator) chooses only a **certified** strategy version appropriate to context and Exchange Scope allowlists.
3. **Tactical Engine** (capability of Trading Orchestrator / Session config) selects parameters **only inside** the certified Tactical Envelope—Option B. Normative rules: [Tactics Contract](./v2-tactics-contract.md).
4. **Trading Orchestrator** coordinates selection and handoff into the Session / Signal Intent path. It generates the executable decision context for Risk. It does not submit orders and does not replace Risk or Execution Engine.
5. **Risk Engine** evaluates those executable decisions against platform limits ∩ Exchange Risk Policy ∩ account/session state and produces a Risk Decision.
6. **Execution** acts only after Risk approval, through Orders → Execution Engine → Adapter.
7. **Exchange** interaction occurs solely via the scoped adapter (paper now).

Strategy Runtime evaluation produces Signal Intents on the Session path; those intents still cannot bypass Risk or Execution.

Necessary but not sufficient: being inside the tactical envelope. Risk and policy may still deny.

---

## 8. Research Lifecycle

Complete lifecycle of a strategy:

```text
Idea
  ↓
Research
  ↓
Validation
  ↓
Strategy Library
  ↓
Paper Trading
  ↓
Live Validation
  ↓
Execution
```

| Stage                | Meaning                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idea**             | Hypothesis formed by human researcher (AI may suggest; humans decide).                                                                                                              |
| **Research**         | Lab experiments, backtests, parameter studies under versioned data.                                                                                                                 |
| **Validation**       | Evidence gate—robustness under fees, slippage, walk-forward and related methods; risk evaluation.                                                                                   |
| **Strategy Library** | Validated strategy repository: certified immutable strategy version + tactical envelope + provenance. Only library members may enter the production path.                           |
| **Paper Trading**    | Certified Strategy Library deployment on the canonical path with paper adapter; proves operational behavior without real capital. Paper Trading must use only certified strategies. |
| **Live Validation**  | Future stage under a live-capital ADR—controlled live proof of already certified strategies; still subordinate to validation and human approval.                                    |
| **Execution**        | Ongoing production use of certified Strategy Library members via Trading Session / Orchestrator selection on the single path.                                                       |

Production never self-modifies strategy logic. Envelope expansion requires returning to research and re-certification—not hot-reload.

---

## 9. Operational Model

Conceptual operating structure—no implementation detail.

### Projects

A **Project** is the highest-level organizational entity. It contains research, strategies, experiments, reports, and production configurations for a coherent body of work.

### Exchange Scopes

An **Exchange Scope** (UI: Cluster) isolates one venue’s accounts, session capacity, policies, and adapter binding. Operators manage scopes independently without forking platform engines. See [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md).

### Trading Sessions

A **Trading Session** (UI: Bot) is one autonomous worker lifecycle bound to a certified Strategy Deployment (UI: Mission). Capacity is counted per Exchange Scope. Lifecycle truth lives in Session—not in UI cards.

### Research Workspace

Researchers operate in a **Research Workspace** context: campaigns, experiments, validation evidence, and knowledge review. UX organizes activity by workspace, not by disconnected pages ([UX Vision](./trp-ux-vision.md)).

### Reporting

Reporting presents scheduled and on-demand views of research and trading projections. It informs humans; it does not authorize capital.

### Command Center

**Command Center** is the operations workspace for monitoring and issuing pause/stop/kill/tactic-select commands through canonical ports. **Dashboard** answers “what is happening now?” as attention-oriented projection. Neither is financial SoT.

---

## 10. AI Responsibilities

Authority classes: [Authority Matrix](./v2-authority-matrix.md). Product rule: AI never controls capital ([Product Vision](./trp-product-vision.md)).

### AI is allowed to

- Analyze and interpret research and production results
- Explain decisions, metrics, and reports
- Summarize Knowledge Lake and projection content
- Recommend hypotheses, experiments, and _candidate_ tactics for human review
- Assist documentation, search, and research productivity
- Produce narrative for Reporting / AI Analytics surfaces

### AI is not allowed to

- Execute or approve trades autonomously
- Mutate Orders, Fills, Positions, or Ledger
- Apply tactics outside the certified Tactical Envelope
- Change strategy algorithm or version at runtime
- Act as balance, portfolio, or recovery authority
- Bypass Risk Engine or Execution Engine
- Silently change configuration or Kill Switch state
- Serve as a Telegram (or other channel) control plane for trading commands in V2

If AI and SoT disagree, SoT wins. If AI proposes unvalidated logic, the proposal returns to Research—not to Runtime.

---

## 11. Future Evolution

Only already approved directions. No new concepts.

The architecture expands by **plugging new markets and adapters into shared engines**, not by cloning the stack.

Approved expansion posture (Architecture Principles — markets as plugins):

- Crypto (current first application; additional venues via new Exchange Scopes + adapters)
- Stocks
- Forex
- ETF
- Commodities

How expansion works without breaking architecture:

1. Add Exchange Scope + adapter + accounts + Exchange Risk Policy + qualification/profile for the venue.
2. Keep one Risk Engine, one Execution Engine entry, one Ledger model, one Strategy Library.
3. Research once; produce under scope allowlists and Risk approval.
4. Live capital for any venue requires an explicit future ADR; paper Freeze remains until then.
5. Deferred productization (for example replay-as-platform, Experiment Registry productization) stays Future / V3 per [V2 Architecture Decision Log](./v2-architecture-decision-log.md)—outside this Spec’s invention surface.

Evolution rule: extend facades and scopes over the frozen path; never open a parallel execution architecture.

---

## 12. References

Supporting documents remain authoritative for their domains. This Spec references them rather than replacing them.

| Document                                                             | Role                                               |
| -------------------------------------------------------------------- | -------------------------------------------------- |
| [Product Vision](./trp-product-vision.md)                            | Level-0 product purpose and non-goals              |
| [UX Vision](./trp-ux-vision.md)                                      | Level-0 experience authority                       |
| [Architecture Principles](../00-architecture-principles.md)          | Immutable engineering principles                   |
| [CANONICAL](../CANONICAL.md)                                         | Level-1 stack, stages, MVP, reproducibility        |
| [V2 Freeze Preconditions](./v2-freeze-preconditions.md)              | Pre-Spec marriage hub and binding “one path” rule  |
| [Alias Dictionary](./v2-alias-dictionary.md)                         | Product ↔ canonical naming                         |
| [Architecture Glossary](./v2-architecture-glossary.md)               | Short V2 term definitions                          |
| [Authority Matrix](./v2-authority-matrix.md)                         | SoT vs projection vs narrative vs command UI       |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md) | Exchange Scope isolation without duplicate engines |
| [Tactics Contract](./v2-tactics-contract.md)                         | Option B strategy vs tactics boundary              |
| [Architecture Decision Log (V2)](./v2-architecture-decision-log.md)  | Approved V2 mapping decisions                      |
| [C4 Container Diagram](./v2-c4-container-diagram.md)                 | Approved container picture and primary flow        |
| [Engineering Audit Report](./engineering-audit-report-v2-freeze.md)  | Compatibility audit baseline (not Spec content)    |
| [RC-18 Current System Snapshot](./rc-18-current-system-snapshot.md)  | As-is engineering baseline before V2 integration   |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)          | Delivery sequencing (not Spec content)             |
| [Final Readiness Assessment](./v2-final-readiness-assessment.md)     | Pre-Spec readiness gate                            |
| [ADR Index](../adr/README.md)                                        | Normative Freeze ADRs (ADR-012…018 and successors) |
| [Architecture Glossary (broader)](../Architecture/021-Glossary.md)   | Wider historical domain glossary                   |

---

## Maintenance

1. Change this Spec only to correct integration errors or to reflect a newly approved ADR / V2 decision log entry.
2. Do not expand this Spec into release plans, technical debt registers, interface catalogs, storage schemas, or event designs.
3. Prefer linking companions over copying their tables.
4. If prose conflicts with the approved C4 diagram or companion contracts, update Spec and companion together under explicit approval.
5. This file is **Approved** and is the constitution for all subsequent implementation.
