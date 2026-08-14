# RC-28 API Contract — Version 2 Conformance (Frozen Port Inventory)

**Document:** RC-28 API Contract  
**Status:** APPROVED (planning) — Epics 1–6 **approved**; RC-28 **CLOSED** (`v2.0.0`)  
**Date:** 2026-08-14  
**Nature:** Conformance contract. **No new ports. No REST. No database schema. No transport product. No queue. No event bus.**

**Parent:** [RC-28 Implementation Plan](./rc-28-implementation-plan.md)  
**Epics:** [Epic Breakdown](./rc-28-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-28-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md)  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

This document **freezes** the application ports already locked by RC-19…RC-27. RC-28 may call them from tests and verification harnesses. RC-28 must not add product capabilities.

---

## 1. Purpose

Lock the **existing** port surface of Version 2 so Epics verify one platform instead of inventing a second contract.

This document deliberately does **not** define:

- new application ports
- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- adapter wire protocols / credential vault products
- new UI widgets
- Strategy certification write APIs beyond RC-22
- Runtime Enforcement redesign
- Market Qualification / Profile / State / Orchestrator redesign
- Orders / Execution / Ledger APIs
- Risk Decision production APIs
- Reporting / AI / Notification redesign
- Exchange Scope redesign
- Live capital enablement

Verification adapters (test doubles, in-process harnesses) may wrap **existing** ports. They are not product APIs and must not become SoT.

---

## 2. Ownership of the contract

| Concern                              | Owner                                           | RC-28 role                   |
| ------------------------------------ | ----------------------------------------------- | ---------------------------- |
| Strategy certification / eligibility | Strategy Library (RC-22)                        | **Verify consume**           |
| Runtime Enforcement Gate             | Runtime Enforcement (RC-23)                     | **Verify consume**           |
| Qualification / Profile              | RC-25 modules                                   | **Verify consume**           |
| Market State / Orchestrator          | RC-26 modules                                   | **Verify consume**           |
| Reporting / AI / Notification        | RC-24 modules                                   | **Verify consume**           |
| Knowledge Lake ingest / query        | Knowledge Lake (RC-21)                          | **Verify consume**           |
| Exchange Scope ports                 | Exchange Scope (RC-27)                          | **Verify consume**           |
| Session lifecycle / Bot Facade       | Trading Session / RC-19 Bot Facade              | **Verify consume**           |
| Command Center commands              | Command Center (RC-20) via Session / Risk ports | **Verify consume**           |
| Risk Decisions                       | Risk Engine                                     | **Not produced here**        |
| Orders / fills                       | Orders / Execution                              | **Not in scope as new APIs** |
| Naming (Bot / Cluster / Wallet)      | Alias Dictionary                                | **Unchanged**                |

**Canonical names remain those already locked.** RC-28 introduces no new identity types.

---

## 3. Frozen port inventory (normative)

RC-28 owns **zero** of these ports. All remain owned by their closed RCs.

```text
RC-19  BotFacadeService                    (alias → Trading Session)
RC-21  KnowledgeLakeIngestionPort          (append-only admit)
       KnowledgeLakeQueryPort              (analytical read)
RC-22  StrategyLibraryRegistrationPort
       StrategyLibraryCertificationPort
       StrategyLibraryLookupPort
       StrategyLibraryEligibilityPort
       StrategyLibraryLifecyclePort
RC-23  RuntimeEnforcementPort              (validateDeployment — fail-closed)
RC-24  ReportingServicePort
       ReportingQueryPort
       AIAnalyticsPort
       NotificationServicePort
       TradingHistoryReadPort              (logical consume)
       PaperTradingHistoryReadPort         (logical consume)
RC-25  MarketQualificationServicePort
       MarketQualificationQueryPort
       MarketQualificationConsumerReadPort
       MarketProfileServicePort
       MarketProfileQueryPort
       MarketProfileConsumerReadPort
       LiveMarketDataReadPort              (consume)
       ResearchOutputReadPort              (consume)
RC-26  MarketStateServicePort
       MarketStateQueryPort
       MarketStateConsumerReadPort
       TradingOrchestratorServicePort
       TradingOrchestratorQueryPort
       TradingOrchestratorConsumerReadPort
       RiskPolicyReadPort                  (logical consume)
RC-27  ExchangeScopeServicePort
       ExchangeScopeQueryPort
       ExchangeScopeConsumerReadPort
```

Locked capabilities for RC-28:

| Capability                                    | Port / surface                        | New in RC-28? |
| --------------------------------------------- | ------------------------------------- | ------------- |
| Certify / lookup / eligibility / lifecycle    | RC-22 Library ports                   | **No**        |
| Fail-closed deployment validation             | `RuntimeEnforcementPort`              | **No**        |
| Classify market state / orchestrate / handoff | RC-26 State / Orchestrator ports      | **No**        |
| Session / Bot lifecycle commands              | Session ports + `BotFacadeService`    | **No**        |
| Report / narrative / notification             | RC-24 ports                           | **No**        |
| Lake admit / query                            | RC-21 ports                           | **No**        |
| Qualification / Profile                       | RC-25 ports                           | **No**        |
| Exchange Scope lifecycle / consumer reads     | RC-27 ports                           | **No**        |
| Kill Switch / pause / stop                    | Existing Risk / Session command ports | **No**        |

---

## 4. Integration key contract (normative)

Trading-path and consumer modules **already** key by the following. RC-28 verifies they remain required and fail-closed.

| Key                    | Required where                                              | Fail-closed rule                                          |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `workspaceId`          | All ports                                                   | Missing ⇒ reject                                          |
| `exchangeScopeId`      | Venue-scoped trading / research / orchestration / scope ops | Missing or conflicting ⇒ reject; never pick another venue |
| `tradingSessionId`     | Session / Bot Facade / Command Center session commands      | Bot id === session id; no second aggregate                |
| `libraryEntryId`       | Library lookup / eligibility / Gate / Orchestrator select   | Unknown ⇒ Gate reject / selection reject                  |
| `reportRunId`          | Reporting query / AI narrative citation                     | Missing ⇒ reject; never invent ledger                     |
| `qualificationRunId`   | Qualification query / Profile publish gate                  | Missing ⇒ reject                                          |
| `marketProfileVersion` | Profile by-version reads                                    | Unknown ⇒ empty/null; never invent profile                |

Peer keying expectations (ownership unchanged):

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
| Knowledge Lake       | Optional scoped markers; never SoT                        | **No**            |
| Reporting / AI       | May filter by scope / session; projection / narrative     | **No**            |
| Notification         | May tag scope identity; never control plane               | **No**            |
| Command Center       | Projects scope/session; commands via canonical ports      | **No**            |

---

## 5. Consumed ports by path (verification only)

### 5.1 Complete trading path

```text
StrategyLibraryLookupPort / EligibilityPort
        → RuntimeEnforcementPort.validateDeployment
        → TradingOrchestratorServicePort (selection + Session handoff intent)
        → Trading Session / BotFacadeService
        → Orders → Execution → Accounting
```

Rules:

1. Gate fail-closed. Orchestrator must not soft-pass `validateDeployment`.
2. Orchestrator emits **handoff intent** only; Session remains lifecycle SoT.
3. Orders / Execution / Accounting remain Freeze owners.
4. Exchange Scope supplies identity / policy inputs / bindings — never Risk Decisions or order submit.

### 5.2 Complete Knowledge Lake flow

```text
SoT events / research outputs
        → KnowledgeLakeIngestionPort   (append-only)
        → KnowledgeLakeQueryPort       (read)
```

Rules:

1. Ingest never mutates Orders / Ledger.
2. Query never becomes cash / fill / position SoT.
3. Duplicate admit is idempotent per RC-21 contract; never a second ledger.

### 5.3 Complete reporting path

```text
KnowledgeLakeQueryPort (+ history read ports)
        → ReportingServicePort / ReportingQueryPort
        → AIAnalyticsPort (optional narrative over ReportRun)
```

Rules:

1. Reports carry `authorityClass: projection`.
2. AI narratives carry narrative class; never trading decisions.
3. No `recomputeLedgerBalance`.

### 5.4 Complete notification path

```text
Report / alert projection
        → NotificationServicePort.deliver
        → channel adapter (Telegram active; others reserved)
```

Rules:

1. Delivery Layer only. Authority none.
2. Forbidden: pause / resume / stop / kill / trade commands on any channel.

### 5.5 Command Center

```text
Command Center projections  ← Session / Risk / Scope / Orchestrator / Reporting consumer reads
Command Center commands     → Session ports / BotFacadeService / durable Kill Switch ports
```

Rules:

1. UI cache never wins against Session / Ledger / Risk SoT.
2. Emergency Stop only through durable Kill Switch / Session commands.

---

## 6. Authority labels (must remain on existing views)

Verification must assert existing contracts still stamp:

| Surface                      | `authorityClass` (existing)                         | Forbidden flags        |
| ---------------------------- | --------------------------------------------------- | ---------------------- |
| Library records              | `source_of_truth` (Library-owned fields)            | Not Gate / not Session |
| Enforcement Gate result      | Gate / validation — not a Risk Decision             | Not `approvesRisk`     |
| Lake / Reporting projections | `projection`                                        | Not ledger SoT         |
| AI narratives                | `narrative`                                         | Not capital authority  |
| Notification                 | `notification-projection`                           | Not control plane      |
| Exchange Scope views         | `exchange_scope_artifact` / `exchange_policy_input` | `isRiskEngine` false   |
| Market State                 | current-condition SoT                               | Not Qualification      |
| Orchestrator                 | coordination SoT                                    | Not Execution          |
| Qualification / Profile      | research artifact SoT                               | Never force trades     |

---

## 7. Explicit non-ports (forbidden in RC-28)

| Forbidden capability                         | Why                                          |
| -------------------------------------------- | -------------------------------------------- |
| Any **new** `*Port` / `*Service` product API | RC-28 certifies; it does not expand          |
| `certifyStrategy` ownership transfer         | Library ownership                            |
| `validateDeployment` ownership / soft-pass   | Enforcement ownership; fail-closed preserved |
| `requestQualificationRun` ownership transfer | Qualification ownership                      |
| `publishProfile` ownership transfer          | Profile ownership                            |
| `classifyMarketState` ownership transfer     | Market State ownership                       |
| `proposeSelection` ownership transfer        | Orchestrator ownership                       |
| `createTradingSession` ownership transfer    | Session lifecycle ownership                  |
| `approveRisk` / `tripKillSwitch` as new API  | Risk / safety ownership                      |
| `createOrder` / `submitExecution` as new API | Orders / Execution ownership                 |
| `mutateLedger` / `inventFill`                | Accounting ownership                         |
| `cloneRiskEngine` / `cloneExecutionEngine`   | Forever forbidden                            |
| `generateAiTradeDecision`                    | AI is not capital authority                  |
| `telegramTradeCommand`                       | Control plane forbidden                      |
| REST / queue / transport product ports       | Out of this contract                         |

---

## 8. Tenancy & isolation

All existing ports require `workspaceId`. Venue-scoped operations require `exchangeScopeId` after RC-19/RC-27. Cross-scope mixing of funds, capacity, or policy remains forbidden. Cluster Isolation: policy inputs may differ per scope; engines remain platform-singleton.

Example concurrent scopes (illustrative, already valid after RC-27):

```text
workspace W
  ├── exchange-scope:binance  (active)
  ├── exchange-scope:bybit    (active)
  ├── exchange-scope:kraken   (suspended)
  └── exchange-scope:okx      (created)
```

---

## 9. Compatibility

| Rule                   | Detail                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Additive product ports | **Forbidden** in RC-28                                         |
| Required field removal | Requires the owning RC’s contract revision — not this document |
| Alias Dictionary       | Unmodified; Bot / Cluster / Wallet mappings unchanged          |
| Authority Matrix       | Unmodified                                                     |
| RC-19…RC-27 contracts  | Remain authoritative for their ports                           |
| REST / DB / transport  | Out of this document                                           |

If a verification test needs a helper, it must be a **test fixture**, not a new application port.

---

## 10. Acceptance for this contract

Reviewers agree:

1. RC-28 adds **no** product APIs.
2. The frozen inventory in §3 is the complete V2 application-port surface for certification.
3. Integration keys in §4 remain fail-closed.
4. Path compositions in §5 stay inside existing ownership.
5. Forbidden ports in §7 are enforceable in review.

---

## 11. STOP gate

**STOP.** Ports remain frozen. Epic 4 complete for review — wait before Epic 5.
