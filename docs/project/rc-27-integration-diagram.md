# RC-27 — Multi-Exchange Scope Integration Diagram

**Document:** Multi-Exchange Scope Integration (RC-27)  
**Status:** APPROVED (planning) — Epic 1 boundary skeleton only; no trading-path wiring  
**Date:** 2026-08-14  
**Nature:** Architecture mapping. Epic 1 freezes isolation boundary; no implementation wiring beyond Nest module skeleton.

**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md)  
**API:** [API Contract](./rc-27-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.10, §11  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)  
**Isolation:** [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

---

## 1. Integration principle

Exchange Scope **isolates** venue resources and policies. Platform engines remain **shared**. Multi-exchange means concurrent scopes — never cloned stacks.

```text
Workspace
  ├── Exchange Scope: Binance
  ├── Exchange Scope: Bybit
  ├── Exchange Scope: Kraken
  └── Exchange Scope: OKX
           │
           │  identity / config / policy inputs / account bindings / adapter context
           ▼
┌──────────────────────────────────────────────────────────────┐
│ SHARED PLATFORM ENGINES (singleton models)                   │
│ Strategy Library · Runtime Enforcement · Qualification       │
│ Market Profile · Market State · Trading Orchestrator         │
│ Trading Session · Risk Engine · Orders · Execution           │
│ Accounting · Reporting · AI · Notification · Knowledge Lake  │
└──────────────────────────────────────────────────────────────┘
```

**There must be no reverse dependency that steals SoT.**

- Scope must not own Session lifecycle, Risk Decisions, Orders, Execution, Library certification, or Gate validation.
- Scope must not become a second Runtime or Knowledge Lake.
- Confidence / profiles never force trades; engines never fork per venue.

**Exchange Scope isolates. Modules remain authoritative.**

---

## 2. Authority classes on this diagram

| Element                 | Class                                 | Role in RC-27                                        |
| ----------------------- | ------------------------------------- | ---------------------------------------------------- |
| Exchange Scope          | **Isolation SoT**                     | Identity, config, lifecycle, bindings, policy inputs |
| Exchange Risk Policy    | **Policy input**                      | Consumed by Risk Engine — not a decision processor   |
| Strategy Library        | **SoT** (certification)               | Shared; allowlists reference certified members       |
| Runtime Enforcement     | **Gate**                              | Shared fail-closed Gate keyed by scope               |
| Market Qualification    | **Research artifact SoT**             | Per-venue; consumed — not redesigned                 |
| Market Profile          | **Research SoT** (versions)           | Per-venue; consumed — not redesigned                 |
| Market State            | **Current-condition SoT**             | Scope-keyed — untouched ownership                    |
| Trading Orchestrator    | **Coordination SoT**                  | Scope-keyed — untouched ownership                    |
| Trading Session         | **SoT** (lifecycle)                   | Capacity counted per scope                           |
| Risk Engine             | **SoT** (Risk Decisions)              | One engine; many policy inputs                       |
| Orders / Execution      | **SoT**                               | One path; scoped accounts + adapter context          |
| Accounting              | **SoT**                               | Scoped records; no shadow books                      |
| Reporting / AI / Notify | **Projection / Narrative / Delivery** | Read multi-scope projections                         |
| Knowledge Lake          | **Projection**                        | Optional scoped markers only                         |
| Command Center          | **Ops UI + projection**               | Future Cluster views — UI deferred                   |

---

## 3. Required topology (normative)

### 3.1 Multi-scope isolation (primary)

```text
┌─────────────────────────────────────────────┐
│                 WORKSPACE                   │
└───────┬─────────────┬─────────────┬─────────┘
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ SCOPE A │   │ SCOPE B │   │ SCOPE N │
   │ Binance │   │ Bybit   │   │ …       │
   └───┬─────┘   └───┬─────┘   └───┬─────┘
       │             │             │
       │  config · policy inputs · accounts · adapter context
       └─────────────┼─────────────┘
                     ▼
        ┌────────────────────────────┐
        │  SHARED ENGINES (1 each)   │
        │  Library / Gate / Qual     │
        │  Profile / State / Orch.   │
        │  Session / Risk / Orders   │
        │  Execution / Accounting    │
        └────────────────────────────┘
```

### 3.2 Trading-path keying (no ownership transfer)

```text
Exchange Scope (isolation)
        │ provides exchangeScopeId + policy/capacity/allowlist/bindings
        ▼
┌──────────────┐   ┌──────────────────┐   ┌────────────────┐
│ LIBRARY      │   │ ENFORCEMENT Gate │   │ QUAL / PROFILE │
│ allowlist    │   │ fail-closed      │   │ per venue      │
└──────┬───────┘   └────────┬─────────┘   └────────┬───────┘
       │                    │                      │
       └────────────────────┼──────────────────────┘
                            ▼
                 ┌────────────────────┐
                 │ MARKET STATE       │  scope-keyed
                 │ TRADING ORCHESTRATOR│ scope-keyed
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ TRADING SESSION    │  capacity per scope
                 └─────────┬──────────┘
                           ▼
         Risk Decision ← Exchange Risk Policy (inputs)
                           ▼
                 Orders → Execution → Accounting
                 (scoped accounts + adapter binding context)
```

### 3.3 Consumer fan-out (read only)

```text
Exchange Scope
        │ ExchangeScopeConsumerReadPort
        ▼
┌─────────────────────────────────────┐
│ Reporting (RC-24)                   │
│ AI Analytics (RC-24)                │
│ Notification Delivery (RC-24)       │
│ Knowledge Lake (RC-21)              │
│ Command Center (RC-20 foundation)   │
└─────────────────────────────────────┘
```

### 3.4 Explicit non-edges (forbidden)

```text
FORBIDDEN:
  Exchange Scope ──clone──▶ Runtime / Session / Library / Gate
  Exchange Scope ──clone──▶ Risk Engine / Orders / Execution / Ledger
  Exchange Scope ──clone──▶ Reporting / Orchestrator / Knowledge Lake
  Exchange Scope ──approve──▶ Risk Decision
  Exchange Scope ──submit──▶ Orders / Execution / Adapter APIs
  Exchange Scope ──certify──▶ Strategy Library
  Exchange Scope ──soft-pass──▶ Runtime Enforcement Gate
  Exchange Scope ──own──▶ Trading Session lifecycle
  Exchange Scope ──mutate──▶ Ledger / Fills / Positions
  Exchange Scope ──replace──▶ Market Qualification / Profile / State
  Confidence ──force──▶ trade / cross-scope fund move
  Cross-scope account reference without reject
  Missing exchangeScopeId ──pick──▶ another venue
```

---

## 4. Interaction notes

### 4.1 Exchange Scope → Strategy Library

- Allowlists reference certified Library identities only.
- Library remains certification SoT; Scope never clones eligibility engines.

### 4.2 Exchange Scope → Runtime Enforcement

- Gate continues to validate deployment/session bind prerequisites with `exchangeScopeId`.
- Fail closed. Scope must not implement a second validation product.

### 4.3 Exchange Scope → Qualification / Profile / Market State / Orchestrator

- Per-venue research and current-condition artifacts remain owned by their closed modules.
- Multi-scope means concurrent keyed instances — not module forks.
- Profile confidence never forces trades or moves balances.

### 4.4 Exchange Scope → Trading Session

- Scope provides capacity inputs (max bots) and venue context.
- Session accepts/rejects starts; Session remains lifecycle SoT.
- Suspended/archived scopes block new capacity claims.

### 4.5 Exchange Scope → Risk Engine

- Exchange Risk Policy versions are **inputs**.
- Risk Decisions remain exclusively Risk Engine.
- Forbidden: per-exchange shadow Risk Engine.

### 4.6 Exchange Scope → Orders / Execution / Accounting

- Account bindings and adapter binding context constrain the shared path.
- Cross-scope fund use is rejected.
- Engines remain singleton; records remain scoped.

### 4.7 Exchange Scope → Reporting / AI / Notification / Lake / Command Center

- Read-only projections.
- Consumers must not treat scope config as cash, fills, or risk approval.
- Notification may tag scope identity — never become a trading control plane.

---

## 5. Spec alignment

| Spec section                                | Diagram coverage                                  |
| ------------------------------------------- | ------------------------------------------------- |
| §5.10 Exchange Scope                        | Primary multi-scope isolation nodes               |
| §11 Future Evolution                        | Add scope + binding + policy; keep shared engines |
| Cluster Isolation Invariants                | Shared vs isolated lists; no duplicate engines    |
| §5.2 Strategy Library                       | Shared; allowlist integration                     |
| §5.3 Qualification / Profile                | Per-venue; not replaced                           |
| §5.4 / §5.5 State / Orchestrator            | Scope-keyed; ownership unchanged                  |
| §5.6 Trading Session / Runtime              | Capacity per scope; Session SoT                   |
| §5.7 Risk Engine                            | Policy inputs; decisions untouched                |
| §5.8 / §5.9 Orders / Execution              | Scoped refs; engines untouched                    |
| §5.11 / §5.12 Accounts / Accounting         | Bindings + scoped records                         |
| §5.13 / §5.14 / §5.15 Lake / Reporting / AI | Consumer fan-out                                  |

---

## 6. STOP gate

Diagram is normative for planning. No implementation wiring is authorized until the RC-27 planning package is approved and Epic 1 starts.
