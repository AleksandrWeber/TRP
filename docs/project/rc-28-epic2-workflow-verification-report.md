# RC-28 Epic 2 — Workflow Verification Report

**Document:** Version 2 Cross-Domain Workflow Catalog  
**Status:** Epic 2 **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 2 Report](./rc-28-epic2-cross-domain-workflow-verification.md)  
**Code:** `apps/api/src/platform-conformance/v2-workflow-graph.ts`

Verification only. Every hop uses an **existing** contract. Ownership never changes.

---

## 1. Certified sequence

```text
Research Lab
  ↓  STRATEGY_LIBRARY_LOOKUP_PORT (Library SoT)
Strategy Library
  ↓  RUNTIME_ENFORCEMENT_PORT.validateDeployment (fail-closed Gate)
Runtime Enforcement
  ↓  TRADING_ORCHESTRATOR_SERVICE_PORT (consumes Gate)
Trading Orchestrator
  ↓  Session handoff intent (Session remains lifecycle SoT)
Trading Session
  ↓  CANONICAL_ORDER_PATH_PORT
Orders
  ↓  CANONICAL_ORDER_PATH_PORT
Execution
  ↓  CANONICAL_ORDER_PATH_PORT (Fill → Ledger)
Accounting
  ↓  KNOWLEDGE_LAKE_INGESTION_PORT (append-only)
Knowledge Lake
  ↓  KNOWLEDGE_LAKE_QUERY_PORT
Reporting
  ↓  REPORTING_QUERY_PORT
AI Analytics
  ↓  NOTIFICATION_SERVICE_PORT.deliver
Notification Delivery
  ↓  BotFacadeService → Trading Session commands
Command Center
```

---

## 2. Hop matrix

| Hop | From → To                                  | Port / contract                                      | Owner (unchanged)     | Authority class           | Role                  |
| --- | ------------------------------------------ | ---------------------------------------------------- | --------------------- | ------------------------- | --------------------- |
| 1   | Research Lab → Strategy Library            | `STRATEGY_LIBRARY_LOOKUP_PORT`                       | Strategy Library      | `source_of_truth`         | certification-support |
| 2   | Strategy Library → Runtime Enforcement     | `RUNTIME_ENFORCEMENT_PORT`                           | Runtime Enforcement   | `gate`                    | read-consume          |
| 3   | Runtime Enforcement → Trading Orchestrator | `TRADING_ORCHESTRATOR_SERVICE_PORT`                  | Trading Orchestrator  | `orchestration_artifact`  | read-consume          |
| 4   | Trading Orchestrator → Trading Session     | `TRADING_ORCHESTRATOR_SERVICE_PORT` (handoff intent) | Trading Session       | `session_lifecycle`       | handoff-intent        |
| 5   | Trading Session → Orders                   | `CANONICAL_ORDER_PATH_PORT`                          | Orders                | SoT                       | canonical-path        |
| 6   | Orders → Execution                         | `CANONICAL_ORDER_PATH_PORT`                          | Execution Engine      | SoT                       | canonical-path        |
| 7   | Execution → Accounting                     | `CANONICAL_ORDER_PATH_PORT`                          | Accounting            | SoT                       | canonical-path        |
| 8   | Accounting → Knowledge Lake                | `KNOWLEDGE_LAKE_INGESTION_PORT`                      | Knowledge Lake        | `projection`              | append-projection     |
| 9   | Knowledge Lake → Reporting                 | `KNOWLEDGE_LAKE_QUERY_PORT`                          | Reporting             | `projection`              | read-consume          |
| 10  | Reporting → AI Analytics                   | `REPORTING_QUERY_PORT`                               | AI Analytics          | `narrative`               | read-consume          |
| 11  | AI Analytics → Notification Delivery       | `NOTIFICATION_SERVICE_PORT`                          | Notification Delivery | `notification-projection` | delivery              |
| 12  | Notification Delivery → Command Center     | `BotFacadeService`                                   | Command Center        | `command_ui_projection`   | command-route         |

All hops: `ownershipTransfer = false`, `hiddenDependency = false`.

---

## 3. Contract usage (observed)

| Consumer                           | Approved contract used                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Runtime Enforcement Nest module    | Injects `STRATEGY_LIBRARY_LOOKUP_PORT` + `ELIGIBILITY_PORT`; exposes `RUNTIME_ENFORCEMENT_PORT` |
| Trading Orchestrator Nest module   | Imports `RuntimeEnforcementModule` + `StrategyLibraryModule`                                    |
| Orchestration workflow coordinator | `this.gate.validateDeployment` **before** `createSessionHandoffIntent({`                        |
| Strategy Deployment                | Injects `RUNTIME_ENFORCEMENT_PORT`; does **not** import Strategy Library                        |
| Trading Session                    | Imports **neither** Library nor Enforcement (stamp / lifecycle only)                            |
| Reporting Nest module              | Imports `KnowledgeLakeModule` / `KNOWLEDGE_LAKE_QUERY_PORT`                                     |
| AI Analytics Nest module           | Imports `ReportingModule` / `REPORTING_QUERY_PORT`; no Lake / Library / Gate                    |
| Notification Delivery Nest module  | No Reporting / AI / Session / Library / Gate imports                                            |
| Command Center UI                  | `pauseTradingSession` / `resumeTradingSession` / `stopTradingSession` only                      |
| Bot Facade                         | Delegates to `TradingSessionService`; Bot id === Session id                                     |

---

## 4. Fail-closed

| Check                       | Evidence                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| Missing Gate identity       | `validateDeployment` returns `fail` / `INVALID` / `identity_ambiguous` |
| Missing Library record      | `validateDeployment` returns `fail` / `INVALID`                        |
| Soft-fail                   | Forbidden capability + absent from Enforcement production sources      |
| Orchestrator on Gate reject | Coordinator requires `enforcement.outcome === 'pass'` before handoff   |
| Session bypass              | Session production has no Library / Enforcement imports                |
| Deployment bypass           | Deployment consumes Gate; no Library import                            |

---

## 5. Consumer isolation

| Consumer              | Isolation                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| Reporting             | `sourceOfTruth: false`; no Orders / Gate / Library / Session production imports      |
| AI Analytics          | `knowledgeLakeRole: never-direct`; narrative class; no Lake / SoT production imports |
| Notification Delivery | `sourceOfTruth: false`; no pause/stop/kill/trade; no Reporting/Session imports       |
| Command Center        | Session API commands only; emergency kill remains unavailable until durable ports    |

---

## 6. STOP

Workflow catalog is frozen. Epic 3 may verify authority documents — it must not add hops, ports, or ownership changes.
