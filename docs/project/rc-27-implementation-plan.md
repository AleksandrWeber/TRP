# RC-27 Implementation Plan — Multi-Exchange Scope

**Document:** RC-27 Implementation Plan  
**Status:** **CLOSED** (`v1.0.0-rc27`) — Epics 1–6 delivered; Validation PASS  
**Date:** 2026-08-14  
**Nature:** Multi-Exchange Scope complete. No Spec rewrite.

**Authority inputs:**

| Input                                                                       | Role                                                                                      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.10 Exchange Scope; §11 Future Evolution; Cluster isolation)              |
| [Authority Matrix](./v2-authority-matrix.md)                                | Exchange Scope + Exchange Risk Policy = config/policy inputs — not Risk/Execution engines |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Cluster → Exchange Scope; forbidden per-exchange Risk/Ledger/Execution clones             |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)        | Isolation of resources/policies; shared engines remain singleton                          |
| [RC-26 Closure](./rc-26-closure-report.md) (**CLOSED**)                     | Orchestrator + Market State certified; Multi-Exchange deferred into this RC               |
| [RC-19 Closure](./rc-19-closure-report.md) (**CLOSED**)                     | Thin Exchange Scope identity (default Binance) — expand, do not reinvent                  |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Plan → API Contract → Domain Model → thin Epics → review → validation → release           |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | RC-27 theme: Multi Exchange Scope expansion                                               |

**Companion deliverables (this package):**

| Deliverable                     | Document                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Epic Breakdown                  | [`rc-27-epic-breakdown.md`](./rc-27-epic-breakdown.md)                                             |
| API Contract (ports)            | [`rc-27-api-contract.md`](./rc-27-api-contract.md)                                                 |
| Domain Model Contract           | [`rc-27-domain-model-contract.md`](./rc-27-domain-model-contract.md)                               |
| Integration Diagram             | [`rc-27-integration-diagram.md`](./rc-27-integration-diagram.md)                                   |
| Validation Summary              | [`rc-27-validation-summary.md`](./rc-27-validation-summary.md)                                     |
| Architecture Consistency Report | [`rc-27-architecture-consistency-report.md`](./rc-27-architecture-consistency-report.md)           |
| Epic 1 Report                   | [`rc-27-epic1-exchange-scope-boundary.md`](./rc-27-epic1-exchange-scope-boundary.md)               |
| Epic 1 Boundary Diagram         | [`rc-27-epic1-boundary-diagram.md`](./rc-27-epic1-boundary-diagram.md)                             |
| Epic 2 Report                   | [`rc-27-epic2-domain-model.md`](./rc-27-epic2-domain-model.md)                                     |
| Epic 3 Report                   | [`rc-27-epic3-application-ports.md`](./rc-27-epic3-application-ports.md)                           |
| Epic 4 Report                   | [`rc-27-epic4-trading-path-scope-integration.md`](./rc-27-epic4-trading-path-scope-integration.md) |
| Epic 5 Report                   | [`rc-27-epic5-consumer-read-ports.md`](./rc-27-epic5-consumer-read-ports.md)                       |
| Epic 6 Report                   | [`rc-27-epic6-authority-conformance.md`](./rc-27-epic6-authority-conformance.md)                   |
| Epic 6 Internal Audit           | [`rc-27-epic6-internal-audit-report.md`](./rc-27-epic6-internal-audit-report.md)                   |
| Epic 6 Readiness                | [`rc-27-epic6-readiness-report.md`](./rc-27-epic6-readiness-report.md)                             |

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
| **RC-27** | **Multi-Exchange Scope**                        | **CLOSED** (`v1.0.0-rc27`) |

| Effect                   | Disposition                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Exchange Scope identity  | CLOSED as RC-19 thin hook — **expand** multi-scope lifecycle; do not invent a new module concept |
| Strategy Library         | CLOSED as RC-22 — **consume** Lookup / Eligibility / Envelope; do not certify per exchange clone |
| Runtime Enforcement      | CLOSED as RC-23 — **consume** Gate with `exchangeScopeId`; do not replace or soft-fail           |
| Market Qualification     | CLOSED as RC-25 — **consume** per-venue consumer reads; do not re-own evaluation                 |
| Market Profile           | CLOSED as RC-25 — **consume** per-venue profile projections; never force trades                  |
| Market State             | CLOSED as RC-26 — **consume** / key by scope; State remains current-condition SoT                |
| Trading Orchestrator     | CLOSED as RC-26 — **consume** / key by scope; Orchestrator remains coordination SoT              |
| Trading Session          | Existing SoT — Sessions remain lifecycle SoT; capacity counted **per scope**                     |
| Risk Engine              | Existing SoT — consumes per-scope **Exchange Risk Policy** inputs; never cloned                  |
| Orders / Execution       | Freeze ADR-012…018 — **untouched** engines; adapters bind via Scope context only                 |
| Accounting / Ledger      | Freeze ADR-015 — **untouched** modules; records remain scoped, not forked                        |
| Reporting / AI / Notify  | CLOSED as RC-24 — **future readers** of multi-scope projections; not redesigned                  |
| Knowledge Lake           | CLOSED as RC-21 — optional scoped projection markers only; never Lake-as-SoT                     |
| Command Center           | CLOSED as RC-20 foundation — may later surface multi-scope views; UI not in this RC              |
| Architecture Spec v2.0   | **Unchanged**                                                                                    |
| Authority Matrix / Alias | **Unchanged**                                                                                    |

---

## 1. Purpose

Scale the platform from a **single default Exchange Scope** (RC-19 Binance identity) to **multiple independent Exchange Scopes** simultaneously — without cloning Runtime, Strategy Library, Runtime Enforcement, Orders, Execution, Accounting, or Reporting.

RC-27 answers:

> Can the platform host Binance, Bybit, Kraken, OKX (and peers) as independent isolation contexts — while preserving one Strategy Library, one Runtime Enforcement Gate, one Orchestrator model, one Risk Engine, one Orders/Execution path, and one Ledger model?

**Exchange Scope isolates. It never becomes a business authority.**

---

## 2. Scope

### 2.1 In scope (planning contracts → later Epics)

| Area                        | RC-27 delivers (after approval)                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Exchange Scope boundary     | Distinct isolation module: identity, config, context, lifecycle — not a second Runtime    |
| Multi-scope registry        | Register / activate / suspend / archive multiple scopes under one workspace               |
| Scope configuration         | Venue identity, adapter binding **context**, capacity limits, allowlists, policy refs     |
| Exchange Risk Policy inputs | Per-scope policy artifacts consumed by Risk Engine — never a Risk Decision processor      |
| Trading Account binding     | Account identity **within** a scope (logical binding; no Ledger redesign)                 |
| Trading-path keying         | Prove Sessions / Orchestrator / State / Qualification / Enforcement remain keyed by scope |
| Isolation invariants        | Cross-scope fund / capacity / policy fail-closed tests at port/domain level               |
| Consumer read surfaces      | Ports so Reporting / AI / Command Center / Lake may **read** scope projections            |
| Second-venue proof intent   | Planning assumes ≥2 concurrent scopes (e.g. Binance + Bybit) as isolation proof target    |

### 2.2 Explicitly out of scope (forbidden)

| Forbidden in RC-27                            | Owner / later                            |
| --------------------------------------------- | ---------------------------------------- |
| Multi-runtime / per-exchange Runtime clone    | Forever forbidden (Isolation Invariants) |
| Duplicated Trading Session implementation     | Session SoT remains singleton model      |
| Duplicated Risk Engine / Orders / Execution   | Freeze ADR-012…018                       |
| Duplicated Accounting / Ledger / Portfolio    | Freeze ADR-015                           |
| Duplicated Strategy Library / Envelope store  | RC-22 CLOSED                             |
| Duplicated Runtime Enforcement Gate           | RC-23 CLOSED                             |
| Duplicated Reporting / AI / Notification      | RC-24 CLOSED                             |
| Knowledge Lake redesign / Lake-as-SoT         | RC-21 CLOSED                             |
| Strategy certification redesign               | RC-22 CLOSED — consume only              |
| Market Qualification evaluation ownership     | RC-25 CLOSED — consume only              |
| Market Profile version publish ownership      | RC-25 CLOSED — consume only              |
| Orchestrator / Market State redesign          | RC-26 CLOSED — consume / key by scope    |
| Live capital enablement                       | Future ADR                               |
| REST / transport / queue / persistence design | Out of this planning package             |
| UI / Command Center multi-cluster screens     | Ports first; UI Contract later if needed |
| Architecture Spec v2.0 rewrite                | Forbidden                                |

---

## 3. Behaviour (normative)

```text
Workspace
  └── Exchange Scope[] (Binance | Bybit | Kraken | OKX | …)
        ├── identity + lifecycle + config
        ├── Exchange Risk Policy (inputs only)
        ├── Trading Account bindings (scoped)
        └── adapter binding context (logical — not transport product)
              │
              ▼  (all platform engines remain singleton)
        Strategy Library · Runtime Enforcement · Market Qualification · Market Profile
        Market State · Trading Orchestrator · Trading Session · Risk · Orders · Execution
        Accounting · Reporting · Knowledge Lake · Notification Delivery
```

**Scaling rule (Spec §11):**

```text
Add Exchange Scope + adapter binding context + accounts + Exchange Risk Policy
  + per-venue Qualification/Profile consumption
→ Keep one Risk Engine, one Execution entry, one Ledger model, one Strategy Library
```

Reading under this plan:

1. **Exchange Scope** owns venue identity, configuration, scoped context, and scope lifecycle.
2. **Platform engines** remain shared; they **key** work by `exchangeScopeId`.
3. **Exchange Risk Policy** supplies inputs to the platform Risk Engine — never a second decision authority.
4. **Trading Session** capacity and lifecycle remain Session SoT, counted per scope.
5. **Orchestrator / Market State / Qualification / Profile** remain their closed owners; multi-scope means concurrent keyed instances of their artifacts, not cloned modules.
6. **Orders / Execution / Accounting** remain untouched SoT owners with scoped records.
7. **Reporting / Lake / Notification** may read multi-scope projections — never invent balances.

### 3.1 Hard behaviour rules

1. Exchange Scope is an **isolation boundary** — not another Runtime, Session implementation, Strategy Library, or Knowledge Lake.
2. Exchange Scope **never owns** strategies, runtime validation, orchestration, orders, execution, or accounting.
3. Adding a venue **must not** clone Risk, Orders, Execution, Ledger, Library, Enforcement, Orchestrator, Reporting, or Session engines.
4. Cross-scope fund, capacity, and policy leakage is **fail-closed**.
5. Missing / ambiguous `exchangeScopeId` rejects the command — never “pick another exchange.”
6. Adapter binding context is logical Scope ownership; transport/credentials product design is out of this package.
7. Per-venue Qualification / Profile confidence never forces trades and never moves balances.
8. Scope lifecycle transitions never certify strategies, soft-pass the Gate, approve risk, or submit orders.

---

## 4. Responsibility matrix

| Behaviour                                             | Exchange Scope | Platform engines (shared)     |
| ----------------------------------------------------- | -------------- | ----------------------------- |
| Own exchange identity / venue key                     | **Yes**        | Consume `exchangeScopeId`     |
| Own scope configuration + lifecycle                   | **Yes**        | No                            |
| Own adapter binding **context** (logical)             | **Yes**        | Execution consumes binding    |
| Own Exchange Risk Policy **inputs**                   | **Yes**        | Risk Engine consumes          |
| Bind Trading Accounts to a venue                      | **Yes**        | Ledger/Orders key by account  |
| Enforce max concurrent Sessions (capacity inputs)     | **Yes** (cap)  | Session enforces lifecycle    |
| Hold strategy allowlists for the venue                | **Yes** (list) | Library / Gate consume        |
| Certify strategies / expand Envelope                  | **No**         | Strategy Library              |
| Runtime Enforcement PASS/FAIL                         | **No**         | Runtime Enforcement           |
| Classify Market State / run Orchestration             | **No**         | Market State / Orchestrator   |
| Own Trading Session lifecycle                         | **No**         | Trading Session               |
| Produce Risk Decisions / Kill Switch SoT              | **No**         | Risk / Session safety         |
| Submit orders / produce Fills                         | **No**         | Orders / Execution            |
| Mutate Ledger / invent Positions                      | **No**         | Accounting                    |
| Own report generation / AI narratives / notifications | **No**         | Reporting / AI / Notification |
| Own Knowledge Lake warehouse                          | **No**         | Knowledge Lake (projection)   |

---

## 5. Ownership

| Concern                              | Owner after RC-27                                                     |
| ------------------------------------ | --------------------------------------------------------------------- |
| **ExchangeScope** + lifecycle        | **Exchange Scope** (isolation SoT for scope identity/config)          |
| **ExchangeScopeConfig**              | **Exchange Scope**                                                    |
| **ExchangeRiskPolicy** (inputs)      | **Exchange Scope** (policy inputs — Risk Engine remains decision SoT) |
| **TradingAccountBinding** (scoped)   | **Exchange Scope** (binding); Account/Ledger remain accounting SoT    |
| Adapter binding context              | **Exchange Scope** (logical); Execution Engine remains submit SoT     |
| Strategy certification / eligibility | **Strategy Library** — untouched                                      |
| Runtime Enforcement Gate             | **Runtime Enforcement** — untouched                                   |
| Qualification / Profile versions     | **Market Qualification / Profile** — untouched                        |
| MarketState / OrchestrationRun       | **Market State / Trading Orchestrator** — untouched                   |
| Session lifecycle / Kill Switch      | **Trading Session / Risk safety** — untouched                         |
| Risk Decisions                       | **Risk Engine** — untouched                                           |
| Orders / Fills / Execution           | **Orders / Execution / Ledger** — untouched                           |
| Report aggregations / AI narratives  | **Reporting / AI Analytics** — may **read** scope projections         |
| Notification delivery                | **Notification Delivery** — may **read** scope-tagged events          |
| Analytical warehouse                 | **Knowledge Lake** — optional scoped markers only                     |

**Anti-duplication rule:** Exchange Scope must not invent a parallel Library, Gate, Qualification pipeline, Orchestrator, Session engine, Risk Decision processor, Orders module, Execution Engine, Ledger, Reporting stack, or Knowledge Lake.

---

## 6. Data sources (consume / integrate only)

| Source                        | Access in RC-27                                                  | Ownership transfer? |
| ----------------------------- | ---------------------------------------------------------------- | ------------------- |
| Strategy Library              | Eligibility / allowlist checks keyed by scope                    | **No**              |
| Runtime Enforcement           | Gate validation includes `exchangeScopeId`                       | **No**              |
| Market Qualification          | Per-venue consumer reads                                         | **No**              |
| Market Profile                | Per-venue consumer reads                                         | **No**              |
| Market State                  | Current-condition artifacts remain keyed by scope                | **No**              |
| Trading Orchestrator          | Orchestration runs remain keyed by scope                         | **No**              |
| Trading Session               | Capacity / lifecycle remain Session SoT; scope provides capacity | **No**              |
| Risk Engine                   | Consumes Exchange Risk Policy inputs                             | **No**              |
| Orders / Execution / Ledger   | Consume scoped account + adapter binding context                 | **No**              |
| Reporting / AI / Notification | Read scope projections                                           | **No**              |
| Knowledge Lake                | Optional append of scope markers (projection)                    | **No**              |

No ownership transfer. No Scope write into Library certification, Enforcement decisions, Qualification evaluation, Profile publish, Orchestrator selection, Session lifecycle ownership, Risk Decisions, Orders, Execution, Ledger mutations, Reporting generation, or AI decision ports.

---

## 7. Dependencies

| Dependency                          | Status / note                                          |
| ----------------------------------- | ------------------------------------------------------ |
| Architecture Spec v2.0              | Approved constitution (§5.10 / §11)                    |
| Authority Matrix + Alias Dictionary | Approved                                               |
| Cluster Isolation Invariants        | Binding for multi-scope proof                          |
| RC-19 Exchange Scope identity       | Default Binance thin hook — expand                     |
| RC-22 Strategy Library              | Shared certification — consume                         |
| RC-23 Runtime Enforcement           | Fail-closed Gate — consume with scope key              |
| RC-25 Qualification + Profile       | Per-venue confidence — consume                         |
| RC-26 Orchestrator + Market State   | Scope-keyed coordination / classification — consume    |
| Trading Session / Deployment        | Capacity counted per scope — Session remains SoT       |
| Risk Engine                         | Policy inputs from Scope — Risk remains decision SoT   |
| RC-24 Reporting / AI / Notification | Future consumers of multi-scope reads — not redesigned |
| RC-21 Knowledge Lake                | Optional scoped markers — never SoT                    |
| RC-20 Command Center                | Future multi-Cluster surface — UI deferred             |
| Live capital / live adapters        | **Not enabled** — paper Freeze until future ADR        |

---

## 8. Definition of Done (RC-27 close)

RC-27 may close only when **all** are true:

### Architecture

1. Spec §5.10 Exchange Scope responsibilities realized as application ports + domain — multi-scope capable.
2. Spec §11 scaling rule preserved: new scopes + bindings + policies; **no** forked engines.
3. Cluster Isolation Invariants 1–10 enforceable at port/domain level for ≥2 concurrent scopes.
4. Authority Matrix + Alias Dictionary honored (Cluster ≠ microservice; no per-exchange Risk Engine).
5. Exchange Scope remains isolation context and never becomes a new business authority.

### Ports & domain

6. Domain Model locked entities implemented (ExchangeScope, Config, Lifecycle, RiskPolicy, AccountBinding, AdapterBindingContext).
7. API Contract ports implemented for scope lifecycle/query and consumer reads.
8. Trading-path modules continue to key by `exchangeScopeId` without ownership transfer.
9. Consumer read ports available for Reporting / AI / Command Center / Lake — read only.

### Integration

10. No reverse dependency into Library certification, Gate ownership, Qualification evaluation, Profile publish, Orchestrator selection ownership, Session lifecycle ownership, Orders, Execution, Ledger, or Risk Decision production.
11. Cross-scope isolation tests PASS (funds, capacity, policy, fail-closed ambiguity).
12. Frozen path algorithms unchanged.

### Hygiene

13. All epic DoDs met; Validation Standard (Workflow §5) PASS.
14. Closure report + residual/deferred register updated (UI, REST, live capital, additional venue adapters beyond proof).

---

## 9. Non-goals reminder (permanent for this RC)

- Do not implement REST product, persistence product, queue, or transport design.
- Do not clone Runtime, Session, Risk, Orders, Execution, Accounting, Library, Enforcement, Reporting, or Orchestrator.
- Do not implement live-capital adapters as capital authority.
- Do not redesign Architecture Spec v2.0.
- Do not implement Command Center multi-Cluster UI in this RC.

---

## 10. STOP gate

**CLOSED.** RC-27 Validation PASS / Closure (`v1.0.0-rc27`). Proceed to RC-28 Planning under a separate task.

---

## Approval

| Checkpoint                               | Status                     |
| ---------------------------------------- | -------------------------- |
| Planning package complete                | **Approved**               |
| Epic 1 boundary                          | **Approved**               |
| Epic 2 domain model                      | **Approved**               |
| Epic 3 application ports                 | **Approved**               |
| Epic 4 trading path integration          | **Approved**               |
| Epic 5 consumer read ports               | **Approved**               |
| Epic 6 authority conformance + readiness | **Approved**               |
| Human approval for Validation & Release  | **Approved**               |
| Validation / Certification / Closure     | **CLOSED** (`v1.0.0-rc27`) |
