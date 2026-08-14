# RC-27 API Contract — Multi-Exchange Scope

**Document:** RC-27 API Contract  
**Status:** APPROVED — Epic 5 consumer-read façades complete; persistence/REST/transport forbidden  
**Date:** 2026-08-14  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No queue. No event bus.** Epic 3 activates Nest façades over in-memory store.

**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md)  
**Domain:** [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-27-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.10, §11  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

**Upstream / peer ports (integrate, do not own):**

- [RC-22 API Contract](./rc-22-api-contract.md) — Library Lookup / Eligibility / Envelope
- [RC-23 API Contract](./rc-23-api-contract.md) — `RuntimeEnforcementPort`
- [RC-25 API Contract](./rc-25-api-contract.md) — Qualification / Profile consumer reads
- [RC-26 API Contract](./rc-26-api-contract.md) — Market State / Trading Orchestrator (scope-keyed)

---

## 1. Purpose

Lock the **application ports** Exchange Scope exposes, and the **integration keys** trading-path modules consume, so Epics implement one multi-venue isolation contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- Adapter wire protocols / credential vault products
- UI widgets or Command Center Cluster panels
- Strategy certification write APIs
- Runtime Enforcement redesign
- Market Qualification evaluation / Profile publish APIs
- Orders / Execution / Ledger APIs
- Risk Decision production APIs
- Reporting / AI / Notification redesign
- Live capital enablement

Transports and persistence are Epic implementation choices after approval — provided they preserve isolation authority classes and never become execution SoT.

---

## 2. Ownership of the contract

| Concern                              | Owner                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| Exchange Scope ports                 | Exchange Scope module (RC-27)                          |
| Exchange Risk Policy **inputs**      | Exchange Scope — Risk Engine consumes                  |
| Trading Account bindings             | Exchange Scope (binding); Accounting remains SoT       |
| Adapter binding **context**          | Exchange Scope (logical); Execution remains submit SoT |
| Strategy certification / eligibility | Strategy Library — **consume**                         |
| Runtime Enforcement Gate             | Runtime Enforcement — **consume**                      |
| Market State / Orchestrator          | RC-26 modules — **scope-keyed**, not owned here        |
| Session lifecycle                    | Trading Session — **untouched**                        |
| Risk Decisions                       | Risk Engine — **not produced** here                    |
| Orders / fills                       | Orders / Execution — **not in scope**                  |
| Naming (Cluster vs Exchange Scope)   | Alias Dictionary                                       |

**Canonical names:** `ExchangeScope`, `exchangeScopeId`, `exchangeRiskPolicyId`, `tradingAccountBindingId`, `adapterBindingContextId`, `venueCode` — never Cluster-as-microservice; never Scope-as-Risk-Engine; never Scope-as-Execution.

---

## 3. Port overview (locked)

```text
ExchangeScopeServicePort ──▶ register / activate / suspend / archive
                             update config / policy inputs / account bindings
ExchangeScopeQueryPort   ──▶ list / get scopes, config, policy, bindings
        │
        ▼  (integration keys — no ownership transfer)
Strategy Library · Runtime Enforcement · Qualification · Profile
Market State · Trading Orchestrator · Trading Session
Risk Engine (policy reads) · Orders / Execution / Accounting (scoped refs)
        │
        ▼
ExchangeScopeConsumerReadPort → Reporting / AI / Command Center / Lake / Notification
```

Locked capabilities:

| Capability                                | Port                            |
| ----------------------------------------- | ------------------------------- |
| Register / activate / suspend / archive   | `ExchangeScopeServicePort`      |
| Update config / capacity / allowlists     | `ExchangeScopeServicePort`      |
| Publish Exchange Risk Policy inputs       | `ExchangeScopeServicePort`      |
| Bind / unbind Trading Accounts            | `ExchangeScopeServicePort`      |
| Set adapter binding context (logical)     | `ExchangeScopeServicePort`      |
| Query scopes / config / policy / bindings | `ExchangeScopeQueryPort`        |
| Downstream scope reads                    | `ExchangeScopeConsumerReadPort` |

No Certification-write, Qualification-evaluate, Profile-publish, Risk-approve, Order-submit, Execution-submit, Session-state-ownership, Orchestrator-select, or Library-clone ports are owned by Exchange Scope.

---

## 4. ExchangeScopeServicePort

### 4.1 Interface (logical)

```text
ExchangeScopeServicePort
  registerExchangeScope(cmd: RegisterExchangeScope) → ExchangeScopeResult
  activateExchangeScope(cmd: ActivateExchangeScope) → ExchangeScopeResult
  suspendExchangeScope(cmd: SuspendExchangeScope) → ExchangeScopeResult
  archiveExchangeScope(cmd: ArchiveExchangeScope) → ExchangeScopeResult
  updateExchangeScopeConfig(cmd: UpdateExchangeScopeConfig) → ExchangeScopeResult
  publishExchangeRiskPolicy(cmd: PublishExchangeRiskPolicy) → ExchangeRiskPolicyResult
  bindTradingAccount(cmd: BindTradingAccount) → TradingAccountBindingResult
  unbindTradingAccount(cmd: UnbindTradingAccount) → TradingAccountBindingResult
  setAdapterBindingContext(cmd: SetAdapterBindingContext) → AdapterBindingContextResult
```

### 4.2 RegisterExchangeScope

| Field         | Required | Meaning                                                             |
| ------------- | -------- | ------------------------------------------------------------------- |
| `workspaceId` | Yes      | Tenancy                                                             |
| `venueCode`   | Yes      | Closed venue label (`binance` \| `bybit` \| `kraken` \| `okx` \| …) |
| `displayName` | Yes      | Human label (UI: Cluster name)                                      |
| `requestedBy` | Yes      | Actor                                                               |
| `notes`       | No       | Operator rationale                                                  |

**Rules:**

1. Registration creates an **Exchange Scope** isolation artifact — not a Runtime, Session, Library, or Risk Engine.
2. Duplicate active `venueCode` within a workspace is rejected (or explicitly versioned supersede — never silent merge).
3. Register never starts a Trading Session, certifies a strategy, approves risk, or submits orders.
4. Default Binance scope from RC-19 remains a valid first scope; additional venues are additive.

### 4.3 UpdateExchangeScopeConfig

| Field               | Required | Meaning                                     |
| ------------------- | -------- | ------------------------------------------- |
| `workspaceId`       | Yes      | Tenancy                                     |
| `exchangeScopeId`   | Yes      | Target scope                                |
| `maxActiveSessions` | No       | Capacity input (UI: max bots)               |
| `symbolAllowlist`   | No       | Venue symbol allowlist                      |
| `strategyAllowlist` | No       | Certified Library identities permitted      |
| `modeContext`       | No       | `paper` \| `lab` \| `live` (live still ADR) |
| `updatedBy`         | Yes      | Actor                                       |

**Rules:**

1. Config is isolation/policy input — never a Risk Decision and never an Order.
2. `strategyAllowlist` references Library identities only — never invents certification.
3. Capacity inputs constrain Session starts; Session remains lifecycle SoT.
4. `live` label does not enable live capital without future ADR.

### 4.4 PublishExchangeRiskPolicy

| Field             | Required | Meaning                      |
| ----------------- | -------- | ---------------------------- |
| `workspaceId`     | Yes      | Tenancy                      |
| `exchangeScopeId` | Yes      | Target scope                 |
| `policyVersion`   | Yes      | Positive integer / label     |
| `limits`          | Yes      | Platform-owned policy fields |
| `publishedBy`     | Yes      | Actor                        |

**Rules:**

1. Publishes **policy inputs** for the platform Risk Engine — never `approveRisk` / `tripKillSwitch`.
2. Policy applies only within the named scope (+ any tighter platform limits).
3. Forbidden: `BinanceRiskEngine.decide()` as a separate authority path.

### 4.5 BindTradingAccount / SetAdapterBindingContext

| Field              | Required | Meaning                               |
| ------------------ | -------- | ------------------------------------- |
| `workspaceId`      | Yes      | Tenancy                               |
| `exchangeScopeId`  | Yes      | Target scope                          |
| `tradingAccountId` | Yes*     | Account identity (*bind commands)     |
| `adapterIdentity`  | Yes*     | Logical adapter id (*binding context) |
| `requestedBy`      | Yes      | Actor                                 |

**Rules:**

1. Account bindings are scope-owned relationships; Ledger/Account balances remain accounting SoT.
2. Adapter binding context is logical Scope ownership — **not** transport/credential product design.
3. Orders in scope A must not reference accounts bound only to scope B (enforced with trading-path integration).
4. Binding never calls exchange APIs from Strategy / Orchestrator / UI.

### 4.6 ExchangeScopeResult (and related results)

| Field                     | Meaning                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `outcome`                 | `accepted` \| `unchanged` \| `rejected` \| `suspended` \| `archived` \| `failed` |
| `exchangeScopeId`         | Scope identity                                                                   |
| `exchangeScope`           | Snapshot after transition                                                        |
| `exchangeRiskPolicyId`    | Present after policy publish                                                     |
| `tradingAccountBindingId` | Present after bind                                                               |
| `adapterBindingContextId` | Present after set                                                                |
| `rejectionReasons[]`      | Present on reject/fail                                                           |

---

## 5. ExchangeScopeQueryPort

### 5.1 Interface (logical)

```text
ExchangeScopeQueryPort
  getExchangeScope(query: GetExchangeScope) → ExchangeScopeView | null
  listExchangeScopes(query: ListExchangeScopes) → ExchangeScopeSummary[]
  getExchangeScopeConfig(query: GetExchangeScopeConfig) → ExchangeScopeConfigView | null
  getExchangeRiskPolicy(query: GetExchangeRiskPolicy) → ExchangeRiskPolicyView | null
  listTradingAccountBindings(query: ListTradingAccountBindings) → TradingAccountBindingView[]
  getAdapterBindingContext(query: GetAdapterBindingContext) → AdapterBindingContextView | null
```

### 5.2 Common query keys

| Field             | Required | Meaning             |
| ----------------- | -------- | ------------------- |
| `workspaceId`     | Yes      | Tenancy             |
| `exchangeScopeId` | No*      | Identity-scoped     |
| `venueCode`       | No*      | Venue-scoped lookup |

### 5.3 View authority

All query views carry:

| Field               | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `authorityClass`    | `exchange_scope_artifact` (or `exchange_policy_input` for policy views) |
| `isRiskEngine`      | Always `false`                                                          |
| `isExecutionEngine` | Always `false`                                                          |
| `isStrategyLibrary` | Always `false`                                                          |
| `isRuntime`         | Always `false`                                                          |
| `approvesRisk`      | Always `false`                                                          |
| `submitsOrders`     | Always `false`                                                          |

---

## 6. Integration key contract (normative for peers)

Trading-path modules **already** key by `exchangeScopeId` (RC-19…RC-26). RC-27 locks the multi-scope expectations:

| Peer module          | Required keying behaviour                                 | Ownership change? |
| -------------------- | --------------------------------------------------------- | ----------------- |
| Strategy Library     | Eligibility / allowlist may filter by scope allowlist     | **No**            |
| Runtime Enforcement  | Gate requests include `exchangeScopeId`; fail-closed      | **No**            |
| Market Qualification | Runs / confidence keyed per venue/scope                   | **No**            |
| Market Profile       | Versions keyed per venue/market                           | **No**            |
| Market State         | Current state keyed by workspace + scope + market         | **No**            |
| Trading Orchestrator | Runs / selections keyed by scope                          | **No**            |
| Trading Session      | Capacity counted per scope; lifecycle remains Session SoT | **No**            |
| Risk Engine          | Reads Exchange Risk Policy for the scope                  | **No**            |
| Orders / Execution   | Account + adapter context must match scope                | **No**            |
| Accounting           | Records carry scope identity; no shadow books             | **No**            |

**Fail-closed rule:** If `exchangeScopeId` is missing or conflicts, reject — do not pick another exchange.

---

## 7. Consumed / peer ports (normative)

| Port / surface                                   | Direction    | RC-27 use                                      |
| ------------------------------------------------ | ------------ | ---------------------------------------------- |
| Strategy Library Lookup / Eligibility / Envelope | Peer consume | Allowlist references certified identities only |
| `RuntimeEnforcementPort`                         | Peer consume | Gate remains fail-closed with scope key        |
| Qualification / Profile consumer ports           | Peer consume | Per-venue confidence — not owned here          |
| Market State / Orchestrator query ports          | Peer consume | Prove scope keying; no redesign                |
| Trading Session capacity / lifecycle             | Peer         | Capacity inputs from Scope; Session SoT        |
| Risk policy consumption                          | Peer         | Risk Engine reads Scope policy inputs          |

---

## 8. Consumer read ports (downstream)

```text
ExchangeScopeConsumerReadPort  (Nest: ExchangeScopeConsumerReadService)
  listScopeProjections(query) → ExchangeScopeProjection[]
  getScopeProjection(query) → ExchangeScopeProjection | null
  getLifecycleProjection(query) → ExchangeScopeLifecycleProjection | null
  getConfigSummaryProjection(query) → ExchangeScopeConfigProjection | null
  getPolicyInputProjection(query) → ExchangeRiskPolicyProjection | null
  listAccountBindingProjections(query) → TradingAccountBindingProjection[]
  getMetadataProjection(query) → ExchangeScopeMetadataProjection | null
  getActiveStatusProjection(query) → ExchangeScopeActiveStatusProjection | null
  getWorkspaceAggregateProjection(query) → ExchangeScopeWorkspaceAggregateProjection | null
```

**Audience:** Reporting, AI Analytics, Command Center, Knowledge Lake, Notification Delivery, future Multi-Exchange UI — read only. No callbacks. No mutations.

**Query adapter:** `ExchangeScopeConsumerReadAdapter` maps process-local store → frozen projections.

**Rules:**

1. Projections never claim cash, fills, risk approval, or execution authority.
2. Cross-scope aggregate reads are explicit (`getWorkspaceAggregateProjection`) and read-only — never invent balances.
3. Notification Delivery may tag messages with scope identity — never become a control plane.
4. Consumers may depend on this port; reverse command dependencies into Scope are forbidden.

---

## 9. Explicit non-ports (forbidden)

| Forbidden capability                         | Why                                          |
| -------------------------------------------- | -------------------------------------------- |
| `certifyStrategy` / `expandEnvelope`         | Library ownership                            |
| `validateDeployment` ownership / soft-pass   | Enforcement ownership; fail-closed preserved |
| `requestQualificationRun` / `publishProfile` | Qualification / Profile ownership            |
| `classifyMarketState` / `proposeSelection`   | Market State / Orchestrator ownership        |
| `createTradingSession` ownership             | Session lifecycle ownership                  |
| `approveRisk` / `tripKillSwitch`             | Risk / safety ownership                      |
| `createOrder` / `submitExecution`            | Orders / Execution ownership                 |
| `mutateLedger` / `inventFill`                | Accounting ownership                         |
| `cloneRiskEngine` / `cloneExecutionEngine`   | Forever forbidden                            |
| `generateAiTradeDecision`                    | AI is not capital authority                  |
| REST / queue / transport product ports       | Out of this contract                         |

---

## 10. Tenancy & isolation

All ports require `workspaceId`. Venue-scoped operations require `exchangeScopeId` after registration. Cross-scope mixing of funds, capacity, or policy is forbidden. Cluster Isolation: policy inputs may differ per scope; engines remain platform-singleton.

Example concurrent scopes (illustrative):

```text
workspace W
  ├── exchange-scope:binance  (active)
  ├── exchange-scope:bybit    (active)
  ├── exchange-scope:kraken   (suspended)
  └── exchange-scope:okx      (created)
```

---

## 11. STOP gate

Ports are locked. Epic 5 completes Nest consumer-read façades over process-local store. REST / durable persistence remain unauthorized.
