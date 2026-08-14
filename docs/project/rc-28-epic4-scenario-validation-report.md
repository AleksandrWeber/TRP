# RC-28 Epic 4 — End-to-End Scenario Validation Report

**Document:** Version 2 Scenario Catalog  
**Status:** **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 4 Report](./rc-28-epic4-end-to-end-scenario-validation.md)  
**Code:** `apps/api/src/platform-conformance/v2-e2e-scenarios.ts`

Verification only. Every scenario uses **existing** ports. Ownership never changes.

---

## 1. Certified sequence (executed at port/domain level)

```text
Research Lab / certified Library record
  ↓  STRATEGY_LIBRARY_LOOKUP_PORT
Strategy Library
  ↓  RUNTIME_ENFORCEMENT_PORT.validateDeployment (pass)
Runtime Enforcement
  ↓  TRADING_ORCHESTRATOR_SERVICE_PORT (handoff intent only)
Trading Orchestrator
  ↓  createTradingSession (Session remains lifecycle SoT)
Trading Session
  ↓  CANONICAL_ORDER_PATH_PORT (paper strategy order → executable)
Orders / Execution / Accounting
  ↓  KNOWLEDGE_LAKE_INGESTION_PORT (append-only)
Knowledge Lake
  ↓  REPORTING_SERVICE_PORT (paper-labeled projection)
Reporting
  ↓  AI_ANALYTICS_PORT.generateNarrative
AI Analytics
  ↓  NOTIFICATION_SERVICE_PORT.deliver
Notification Delivery
  ↓  Command Center session-commands → Trading Session APIs
Command Center
```

---

## 2. Scenario matrix

| Scenario                         | Path                                       | Ports                                                                           | Outcome                       |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------- |
| Certified strategy deployment    | Research → Library → Gate → Orchestrator   | Lookup + `validateDeployment` + Orchestrator service                            | **pass**                      |
| Successful paper trading session | Session → Orders → Execution → Accounting  | `createTradingSession` + Canonical Order Path                                   | **pass** (paper; Session SoT) |
| Rejected deployment (Gate fail)  | Library → Gate → Orchestrator / Deployment | `validateDeployment` fail; Orchestrator no handoff; Deployment `approve` throws | **fail-closed**               |
| Cross-exchange isolation         | Exchange Scope A vs B                      | Scope service + consumer read + `assertSameExchangeScope`                       | **isolation**                 |
| Reporting generation             | Lake → Reporting                           | Ingest + `requestReportRun` (`modes: paper`)                                    | **projection**                |
| AI narrative generation          | Reporting → AI                             | `AI_ANALYTICS_PORT` over Reporting query                                        | **projection** / narrative    |
| Notification delivery            | AI/report → Notification                   | `deliver({ type: 'daily-report', reportRunId })`                                | **delivery**                  |
| Command Center monitoring        | Notification → Command Center              | `session-commands.ts` pause/resume/stop only                                    | **command-route**             |

All rows: `ownershipTransfer = false`, `newApi = false`.

---

## 3. Observed results

| Check                                          | Evidence                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate pass on certified record                  | `validateDeployment` → `VALID` / `pass`                                                                                                      |
| Orchestrator does not create Session or orders | `createsSession === false`, `submitsOrders === false`                                                                                        |
| Bot alias                                      | `toBotView(session).id === session.id`                                                                                                       |
| Paper money path                               | Canonical Order Path `advanceToExecutable` on `mode: 'paper'` strategy order                                                                 |
| Lake never SoT                                 | query `authorityClass: 'projection'`; duplicate is first-wins                                                                                |
| Report labeled paper                           | `getRun(...).modes === ['paper']`; `sourceOfTruth: false`                                                                                    |
| AI does not query Lake                         | `sourceRefs` omit `knowledge-lake`; `knowledgeLakeRole: never-direct`                                                                        |
| Notification not a control plane               | deliver report alert; no Session/Orders imports                                                                                              |
| Gate fail                                      | missing identity / missing Library → `INVALID`; Orchestrator handoff `rejected`; Deployment approve throws `RuntimeEnforcementRejectedError` |
| Isolation                                      | Binance vs Bybit account bindings disjoint; mismatch throws                                                                                  |

---

## 4. STOP

Scenario catalog is **approved**. Epic 5 verified resilience of these same ports without new APIs or ownership.
