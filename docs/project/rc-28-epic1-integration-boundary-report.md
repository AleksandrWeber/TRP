# RC-28 Epic 1 — Integration Boundary Report

**Document:** Version 2 Integration Boundary Catalog  
**Status:** **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 1 Report](./rc-28-epic1-platform-integration-boundaries.md)  
**Diagram:** [rc-28-epic1-boundary-diagram.md](./rc-28-epic1-boundary-diagram.md)  
**Code:** `apps/api/src/platform-conformance/`

This report freezes **existing** integration boundaries. It does not add behaviour.

---

## 1. Surfaces (twelve)

| Module                | Closed RC | Authority class           | Isolation role | Nest module                  | Location                                     |
| --------------------- | --------- | ------------------------- | -------------- | ---------------------------- | -------------------------------------------- |
| Command Center        | RC-20     | `command_ui_projection`   | command-ui     | — (web ops surface)          | `apps/web/src/command-center`                |
| Knowledge Lake        | RC-21     | `projection`              | projection     | `KnowledgeLakeModule`        | `apps/api/src/modules/knowledge-lake`        |
| Strategy Library      | RC-22     | `source_of_truth`         | engine         | `StrategyLibraryModule`      | `apps/api/src/modules/strategy-library`      |
| Runtime Enforcement   | RC-23     | `gate`                    | engine         | `RuntimeEnforcementModule`   | `apps/api/src/modules/runtime-enforcement`   |
| Reporting             | RC-24     | `projection`              | projection     | `ReportingModule`            | `apps/api/src/modules/reporting`             |
| AI Analytics          | RC-24     | `narrative`               | narrative      | `AiAnalyticsModule`          | `apps/api/src/modules/ai-analytics`          |
| Notification Delivery | RC-24     | `notification-projection` | delivery       | `NotificationDeliveryModule` | `apps/api/src/modules/notification-delivery` |
| Market Qualification  | RC-25     | `research_artifact`       | engine         | `MarketQualificationModule`  | `apps/api/src/modules/market-qualification`  |
| Market Profile        | RC-25     | `research_artifact`       | engine         | `MarketProfileModule`        | `apps/api/src/modules/market-profile`        |
| Market State          | RC-26     | `market_state_artifact`   | engine         | `MarketStateModule`          | `apps/api/src/modules/market-state`          |
| Trading Orchestrator  | RC-26     | `orchestration_artifact`  | engine         | `TradingOrchestratorModule`  | `apps/api/src/modules/trading-orchestrator`  |
| Exchange Scope        | RC-27     | `exchange_scope_artifact` | isolation      | `ExchangeScopeModule`        | `apps/api/src/modules/exchange-scope`        |

External Freeze owners (not among the twelve; still sole): Trading Session, Risk Engine, Orders, Execution Engine, Accounting.

---

## 2. Sole ownership

| Concern                            | Sole owner                      |
| ---------------------------------- | ------------------------------- |
| Ops workspace projections          | Command Center                  |
| Ops command entry                  | Command Center                  |
| Analytical warehouse               | Knowledge Lake                  |
| Certified strategy lifecycle       | Strategy Library                |
| Tactical envelope binding          | Strategy Library                |
| Enforcement PASS/FAIL              | Runtime Enforcement             |
| Report generation                  | Reporting                       |
| Analytical narrative               | AI Analytics                    |
| Notification delivery              | Notification Delivery           |
| Qualification run                  | Market Qualification            |
| Market profile versions            | Market Profile                  |
| Current-state snapshot             | Market State                    |
| Orchestration run / handoff intent | Trading Orchestrator            |
| Exchange Scope identity            | Exchange Scope                  |
| Exchange Risk Policy inputs        | Exchange Scope                  |
| Session lifecycle                  | Trading Session                 |
| Risk Decisions                     | Risk Engine                     |
| Orders / Execution / Ledger        | Orders / Execution / Accounting |

No duplicated responsibilities among the twelve. No ownership transfer in this epic.

---

## 3. Allowed consume edges

`from` may depend on / read `to`. Reverse is forbidden unless listed the other way.

| From                 | To                    | Kind         |
| -------------------- | --------------------- | ------------ |
| Runtime Enforcement  | Strategy Library      | read-consume |
| Trading Orchestrator | Strategy Library      | read-consume |
| Trading Orchestrator | Runtime Enforcement   | read-consume |
| Trading Orchestrator | Market State          | read-consume |
| Trading Orchestrator | Market Qualification  | read-consume |
| Trading Orchestrator | Market Profile        | read-consume |
| Trading Orchestrator | Exchange Scope        | identity-key |
| Reporting            | Knowledge Lake        | read-consume |
| Reporting            | Exchange Scope        | identity-key |
| AI Analytics         | Reporting             | read-consume |
| Market Qualification | Knowledge Lake        | read-consume |
| Market Profile       | Market Qualification  | read-consume |
| Market State         | Market Qualification  | read-consume |
| Market State         | Market Profile        | read-consume |
| Knowledge Lake       | Exchange Scope        | identity-key |
| Command Center       | Exchange Scope        | read-consume |
| Command Center       | Reporting             | read-consume |
| Command Center       | Trading Orchestrator  | read-consume |
| Command Center       | Market State          | read-consume |
| Command Center       | Notification Delivery | read-consume |

Command Center **commands** continue to route to Trading Session / Risk ports (external Freeze owners) — never via Notification, AI, Lake, or Scope.

---

## 4. Forbidden reverse / steal edges

| From                  | To                                    | Why                                            |
| --------------------- | ------------------------------------- | ---------------------------------------------- |
| Knowledge Lake        | Reporting                             | Lake is warehouse; Reporting consumes Lake     |
| Knowledge Lake        | Strategy Library                      | Lake never authorizes certification            |
| Knowledge Lake        | Runtime Enforcement                   | Lake never authorizes the Gate                 |
| Strategy Library      | Runtime Enforcement                   | Library is SoT; Gate consumes Library          |
| Strategy Library      | Trading Orchestrator                  | Library does not orchestrate                   |
| Runtime Enforcement   | Trading Orchestrator                  | Gate does not depend on Orchestrator           |
| Runtime Enforcement   | Knowledge Lake                        | Lake is never Gate authority                   |
| AI Analytics          | Knowledge Lake                        | Narratives cite ReportRun only                 |
| AI Analytics          | Strategy Library                      | AI does not certify                            |
| AI Analytics          | Runtime Enforcement                   | AI does not replace the Gate                   |
| Notification Delivery | Reporting                             | Delivery does not generate reports             |
| Notification Delivery | Strategy Library                      | Not a control plane                            |
| Notification Delivery | Runtime Enforcement                   | Not a control plane                            |
| Exchange Scope        | Strategy Library                      | Isolation ≠ certification                      |
| Exchange Scope        | Runtime Enforcement                   | Isolation ≠ Gate                               |
| Exchange Scope        | Trading Orchestrator                  | Isolation ≠ coordination                       |
| Exchange Scope        | Reporting / Lake / State              | Isolation does not own projections or state    |
| Market Qualification  | Market Profile / State / Orchestrator | Qual evaluates; others consume                 |
| Market Profile        | Market State / Orchestrator           | Profiles describe; they do not classify/select |
| Market State          | Trading Orchestrator                  | State describes; Orchestrator consumes         |
| Reporting             | AI Analytics                          | Reporting does not own narratives              |
| Trading Orchestrator  | Reporting / AI                        | Orchestrator does not generate reports         |

Also forbidden (engines outside the twelve): Lake → Ledger; Reporting → cash SoT; AI → trade; Notification → pause/stop/kill; Scope → Risk Decision / order submit; Orchestrator → Execution submit; Command Center cache → Session SoT.

---

## 5. Observed Nest production imports (subset of §3)

Verified by `v2-dependency-graph.spec.ts` (production `.ts`, excluding specs):

| From                  | Observed V2 imports                       |
| --------------------- | ----------------------------------------- |
| Runtime Enforcement   | Strategy Library                          |
| Trading Orchestrator  | Strategy Library, Runtime Enforcement     |
| Reporting             | Knowledge Lake, Exchange Scope (identity) |
| AI Analytics          | Reporting                                 |
| Market Qualification  | Knowledge Lake                            |
| Market Profile        | Market Qualification                      |
| Market State          | Market Qualification, Market Profile      |
| Knowledge Lake        | Exchange Scope (identity)                 |
| Strategy Library      | none of the twelve                        |
| Notification Delivery | none of the twelve                        |
| Exchange Scope        | none of the twelve                        |

No cycles. Allowed-but-unwired edges (e.g. Orchestrator → Market State module) remain **allowed** for later consume; they are not required by this epic.

---

## 6. Isolation confirmation

- Exchange Scope `isolationRole = isolation-boundary`; `isRuntime` / `isRiskEngine` / `isExecutionEngine` / `isStrategyLibrary` remain `false`.
- Shared engines remain singleton models (Library, Gate, Orchestrator, Risk, Orders, Execution, Ledger, Lake schema).
- Ambiguous / missing `exchangeScopeId` remains fail-closed (existing contracts).

---

## 7. STOP

Catalog is frozen. Epic 2 verifies workflow composition on these edges — it must not add ports or reverse them.
