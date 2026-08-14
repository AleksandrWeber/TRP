# RC-27 Domain Model Contract — Multi-Exchange Scope

**Document:** RC-27 Domain Model Contract  
**Status:** APPROVED — Epic 2 domain factories materialized (awaiting review)  
**Date:** 2026-08-14  
**Nature:** Canonical domain model for Exchange Scope isolation artifacts. Epic 2 materializes immutable factories; Epic 3 activates ports; Epic 4 proves trading-path keying.

**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md)  
**API:** [RC-27 API Contract](./rc-27-api-contract.md)  
**Integration:** [Integration Diagram](./rc-27-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.10, §11  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

**Why required:** Architecture Spec v2.0 defines Exchange Scope as a first-class isolation boundary. This contract locks entities so Epics cannot invent a second Runtime, a per-exchange Risk Engine, a cloned Session stack, or a Lake-as-SoT under “multi-exchange.”

---

## 1. Purpose

Lock the **canonical domain model** for Multi-Exchange Scope before Epics implement ports or storage.

This contract answers:

- What Exchange Scope entities exist?
- What is isolation SoT vs policy-input vs execution SoT?
- How do accounts, adapter binding context, and risk policy inputs relate?
- What must never be owned by Exchange Scope?

---

## 2. Ownership boundaries

| Entity / fact                                       | Owner                         | Authority class                                  |
| --------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| **ExchangeScope**                                   | **Exchange Scope**            | Isolation SoT for venue identity                 |
| **ExchangeScopeConfig**                             | **Exchange Scope**            | Isolation config                                 |
| **ExchangeScopeLifecycle**                          | **Exchange Scope**            | Scope lifecycle                                  |
| **ExchangeRiskPolicy** (versioned inputs)           | **Exchange Scope**            | `exchange_policy_input` — not Risk Decision      |
| **TradingAccountBinding**                           | **Exchange Scope**            | Binding relationship; Account/Ledger remain SoT  |
| **AdapterBindingContext**                           | **Exchange Scope**            | Logical binding; Execution remains submit SoT    |
| Strategy certification / eligibility                | Strategy Library              | SoT — untouched                                  |
| EnforcementDecision                                 | Runtime Enforcement           | Gate — untouched                                 |
| QualificationRun / MarketProfile versions           | Qualification / Profile       | Research SoT — untouched                         |
| MarketState / OrchestrationRun                      | Market State / Orchestrator   | Current-condition / coordination SoT — untouched |
| Trading Session lifecycle                           | Trading Session               | SoT — untouched                                  |
| Risk Decision                                       | Risk Engine                   | SoT — untouched                                  |
| Orders / Fills / Execution                          | Orders / Execution / Ledger   | SoT — untouched                                  |
| Report aggregations / AI narratives / notifications | Reporting / AI / Notification | Projection / Narrative / Delivery — may read     |
| Knowledge Lake warehouse                            | Knowledge Lake                | Projection — optional scoped markers             |

**Hard rules:**

1. Exchange Scope never becomes a Runtime, Session implementation, Strategy Library, or Knowledge Lake.
2. Exchange Scope never produces Risk Decisions, Orders, Fills, or ledger mutations.
3. Exchange Scope never soft-passes Runtime Enforcement or certifies strategies.
4. Exchange Risk Policy is **input only** — never a second Risk Engine.
5. AdapterBindingContext is logical — never a transport product or direct Strategy→adapter path.
6. TradingAccountBinding never moves balances; Accounting remains SoT.
7. Multi-scope means concurrent isolation contexts — not cloned engines.
8. Provider credentials / wire protocols are out of domain truth for this RC.

---

## 3. Aggregate overview

```text
Workspace
  └── ExchangeScope[] (immutable identity; lifecycle transitions recorded)
        ├── ExchangeScopeConfig (capacity, allowlists, mode)
        ├── ExchangeScopeLifecycle (created|active|suspended|archived)
        ├── ExchangeRiskPolicy[] (immutable versions; append-only inputs)
        ├── TradingAccountBinding[]
        └── AdapterBindingContext
```

Logical retrieval keys:

- Scope: (`workspaceId`, `exchangeScopeId`) or (`workspaceId`, `venueCode`)
- Policy version: `exchangeRiskPolicyId` + `policyVersion`
- Account binding: `tradingAccountBindingId`
- Adapter binding context: `adapterBindingContextId`

---

## 4. ExchangeScope

Immutable **identity** of one venue isolation boundary within a workspace.

| Field               | Required | Meaning                                               |
| ------------------- | -------- | ----------------------------------------------------- |
| `exchangeScopeId`   | Yes      | Stable identity (e.g. `exchange-scope:binance`)       |
| `workspaceId`       | Yes      | Tenancy                                               |
| `venueCode`         | Yes      | `binance` \| `bybit` \| `kraken` \| `okx` \| …        |
| `displayName`       | Yes      | Human label (UI: Cluster)                             |
| `lifecycle`         | Yes      | `ExchangeScopeLifecycle`                              |
| `config`            | Yes      | `ExchangeScopeConfig`                                 |
| `authorityClass`    | Yes      | Always `exchange_scope_artifact`                      |
| `isRuntime`         | Yes      | Always `false`                                        |
| `isStrategyLibrary` | Yes      | Always `false`                                        |
| `isRiskEngine`      | Yes      | Always `false`                                        |
| `isExecutionEngine` | Yes      | Always `false`                                        |
| `isKnowledgeLake`   | Yes      | Always `false`                                        |
| `approvesRisk`      | Yes      | Always `false`                                        |
| `submitsOrders`     | Yes      | Always `false`                                        |
| `mutable`           | Yes      | Always `false` (identity immutable; config versioned) |

**Notes:**

- RC-19 default Binance scope remains a valid instance.
- Additional venues are additive isolation contexts under the same workspace.
- Scope identity never equals Trading Session identity (Bot ≠ Cluster).

### 4.1 ExchangeScopeConfig

| Field               | Required | Meaning                                |
| ------------------- | -------- | -------------------------------------- |
| `exchangeScopeId`   | Yes      | Parent scope                           |
| `maxActiveSessions` | Yes      | Capacity input (UI: max bots)          |
| `symbolAllowlist`   | No       | Allowed markets                        |
| `strategyAllowlist` | No       | Certified Library identities permitted |
| `modeContext`       | Yes      | `lab` \| `paper` \| `live`             |
| `updatedAt` / `By`  | Yes      | Provenance                             |
| `authorizesRuntime` | Yes      | Always `false`                         |
| `forcesTrade`       | Yes      | Always `false`                         |

### 4.2 ExchangeScopeLifecycle

| Field               | Required | Meaning                                            |
| ------------------- | -------- | -------------------------------------------------- |
| `status`            | Yes      | `created` \| `active` \| `suspended` \| `archived` |
| `updatedAt` / `By`  | Yes      | Transition provenance                              |
| `reason`            | Yes      | Transition rationale                               |
| `authorizesRuntime` | Yes      | Always `false`                                     |
| `executesActions`   | Yes      | Always `false`                                     |

### 4.3 Allowed lifecycle (normative)

```text
created → active | archived
active → suspended | archived
suspended → active | archived
archived → (terminal)
```

Transitions are **manual immutable record creation** only — no automatic trading.

- `suspended` / `archived` MUST block new Session capacity claims for that scope.
- Lifecycle transitions never approve risk, submit orders, or certify strategies.

---

## 5. ExchangeRiskPolicy

Immutable **versioned policy inputs** for one Exchange Scope. Consumed by the platform Risk Engine.

| Field                  | Required | Meaning                                 |
| ---------------------- | -------- | --------------------------------------- |
| `exchangeRiskPolicyId` | Yes      | Stable identity for this version record |
| `exchangeScopeId`      | Yes      | Parent scope                            |
| `workspaceId`          | Yes      | Tenancy                                 |
| `policyVersion`        | Yes      | Positive integer (append-only)          |
| `limits`               | Yes      | Platform-owned limit fields             |
| `publishedAt` / `By`   | Yes      | Provenance                              |
| `authorityClass`       | Yes      | Always `exchange_policy_input`          |
| `isRiskDecision`       | Yes      | Always `false`                          |
| `approvesRisk`         | Yes      | Always `false`                          |
| `mutable`              | Yes      | Always `false`                          |

### 5.1 Versioning rules

1. First publish for a scope must be version `1`.
2. Next publish must be `max(history)+1`.
3. Duplicate version numbers are rejected (overwrite protection).
4. Risk Engine reads the applicable policy version; Scope never decides risk.

### 5.2 Forbidden shape

```text
FORBIDDEN entity fields / behaviours:
  decideRisk()
  tripKillSwitch()
  submitOrder()
  cloneEngine: true
```

---

## 6. TradingAccountBinding

Immutable (or append-only revoked) relationship between a Trading Account and an Exchange Scope.

| Field                     | Required | Meaning                          |
| ------------------------- | -------- | -------------------------------- |
| `tradingAccountBindingId` | Yes      | Binding identity                 |
| `workspaceId`             | Yes      | Tenancy                          |
| `exchangeScopeId`         | Yes      | Owning scope                     |
| `tradingAccountId`        | Yes      | Account identity                 |
| `status`                  | Yes      | `bound` \| `unbound`             |
| `boundAt` / `By`          | Yes      | Provenance                       |
| `authorityClass`          | Yes      | Always `exchange_scope_artifact` |
| `ownsLedger`              | Yes      | Always `false`                   |
| `movesBalances`           | Yes      | Always `false`                   |

**Rules:**

1. Orders for scope A must reference accounts bound to A.
2. Unbinding does not delete Ledger history; Accounting remains SoT.
3. Binding never invents fills or positions.

---

## 7. AdapterBindingContext

Logical adapter binding owned by Exchange Scope. Not a transport product.

| Field                     | Required | Meaning                                   |
| ------------------------- | -------- | ----------------------------------------- |
| `adapterBindingContextId` | Yes      | Context identity                          |
| `workspaceId`             | Yes      | Tenancy                                   |
| `exchangeScopeId`         | Yes      | Owning scope                              |
| `adapterIdentity`         | Yes      | Logical adapter id (e.g. `binance-paper`) |
| `modeContext`             | Yes      | `lab` \| `paper` \| `live`                |
| `status`                  | Yes      | `configured` \| `cleared`                 |
| `updatedAt` / `By`        | Yes      | Provenance                                |
| `authorityClass`          | Yes      | Always `exchange_scope_artifact`          |
| `isExecutionEngine`       | Yes      | Always `false`                            |
| `submitsOrders`           | Yes      | Always `false`                            |
| `definesWireProtocol`     | Yes      | Always `false` (out of RC-27 domain)      |

**Rules:**

1. Execution Engine remains the sole submit/cancel entry (ADR-012).
2. Strategy / Orchestrator / UI must not call adapters directly.
3. Live mode remains label-only until a future ADR.

---

## 8. Distinctions (normative)

### 8.1 Exchange Scope vs Trading Session

| Aspect    | Exchange Scope                  | Trading Session                   |
| --------- | ------------------------------- | --------------------------------- |
| UI alias  | Cluster                         | Bot                               |
| Question  | Which venue isolation context?  | Which worker lifecycle?           |
| Capacity  | Provides max-session **inputs** | Owns lifecycle / active count SoT |
| Ownership | Isolation artifacts             | Session lifecycle SoT             |

### 8.2 Exchange Scope vs Runtime / Strategy Library

| Aspect     | Exchange Scope                | Runtime / Library                 |
| ---------- | ----------------------------- | --------------------------------- |
| Role       | Isolate venue resources       | Evaluate / certify strategies     |
| Clone?     | Many scopes, one engine model | Shared across scopes              |
| Allowlists | Scope may restrict production | Library remains certification SoT |

### 8.3 Exchange Risk Policy vs Risk Engine

| Aspect     | Exchange Risk Policy       | Risk Engine                       |
| ---------- | -------------------------- | --------------------------------- |
| Nature     | Per-scope **inputs**       | Platform **decision** authority   |
| Output     | Limits / allow constraints | Risk Decision                     |
| Alias trap | Not “Cluster Risk Engine”  | One engine consumes many policies |

### 8.4 AdapterBindingContext vs Execution Engine

| Aspect    | AdapterBindingContext       | Execution Engine                  |
| --------- | --------------------------- | --------------------------------- |
| Role      | Logical venue binding       | Submit/cancel via adapters        |
| Orders?   | Never                       | Yes (after Risk)                  |
| Transport | Out of this domain contract | Adapter implementations elsewhere |

---

## 9. Allowed / forbidden verbs

| Verb                               | Exchange Scope | Notes                |
| ---------------------------------- | -------------- | -------------------- |
| register / activate / suspend      | **Yes**        | Scope lifecycle      |
| update config / allowlists         | **Yes**        | Isolation config     |
| publish policy **inputs**          | **Yes**        | Not Risk Decisions   |
| bind / unbind trading accounts     | **Yes**        | Binding only         |
| set adapter binding context        | **Yes**        | Logical only         |
| certify strategy                   | **No**         | Library              |
| validateDeployment ownership       | **No**         | Enforcement          |
| classify Market State / select     | **No**         | State / Orchestrator |
| own Session lifecycle              | **No**         | Trading Session      |
| approve Risk / trip Kill Switch    | **No**         | Risk / safety        |
| submit Order / Execution           | **No**         | Orders / Execution   |
| mutate Ledger / invent Fill        | **No**         | Accounting           |
| clone Risk / Execution / Library   | **No**         | Forever              |
| force trade via profile confidence | **No**         | Forever              |

---

## 10. Authority labels

| Label                     | Meaning                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `exchange_scope_artifact` | Isolation identity / config / binding SoT                     |
| `exchange_policy_input`   | Per-scope Risk policy inputs — never Risk Decision            |
| `risk_decision`           | Risk Engine — **never** produced by Exchange Scope            |
| `execution_sot`           | Orders / Fills / Ledger — **never** claimed by Exchange Scope |
| `research_artifact`       | Qualification / Profile — consumed peer, not owned here       |
| `orchestration_artifact`  | Trading Orchestrator — peer, scope-keyed                      |
| `market_state_artifact`   | Market State — peer, scope-keyed                              |

---

## 11. Isolation invariants (domain-level)

Domain factories / ports MUST uphold:

1. No cross-scope account binding reuse for Orders.
2. Capacity inputs are per-scope; never authorize another scope’s Sessions.
3. Policy versions are per-scope; never silently apply Binance limits to Bybit.
4. Missing scope identity ⇒ reject.
5. Statistics / projections derived from scoped SoT — no shadow books in Scope domain.

---

## 12. STOP gate

Domain entities are locked. Epic 2 materializes factories. Application ports remain inactive until Epic 3.
