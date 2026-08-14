# RC-28 Epic 3 — Authority Verification Report

**Document:** Version 2 Authority Graph  
**Status:** Epic 3 **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 3 Report](./rc-28-epic3-authority-ownership-verification.md)  
**Code:** `apps/api/src/platform-conformance/v2-authority-graph.ts`  
**Constitution:** [Authority Matrix](./v2-authority-matrix.md) (**unmodified**)

Verification only. Every row composes an existing RC-20…RC-27 boundary. No new authority classes.

---

## 1. Matrix primary classes (disjoint)

| Module                | Closed RC | Authority class (module)  | Matrix primary class | Mutates trading/finance? |
| --------------------- | --------- | ------------------------- | -------------------- | ------------------------ |
| Command Center        | RC-20     | `command_ui_projection`   | `command_ui`         | No                       |
| Knowledge Lake        | RC-21     | `projection`              | `projection`         | No                       |
| Strategy Library      | RC-22     | `source_of_truth`         | `source_of_truth`    | No                       |
| Runtime Enforcement   | RC-23     | `gate`                    | `gate`               | No                       |
| Reporting             | RC-24     | `projection`              | `projection`         | No                       |
| AI Analytics          | RC-24     | `narrative`               | `narrative`          | No                       |
| Notification Delivery | RC-24     | `notification-projection` | `projection`         | No                       |
| Market Qualification  | RC-25     | `research_artifact`       | `research_artifact`  | No                       |
| Market Profile        | RC-25     | `research_artifact`       | `research_artifact`  | No                       |
| Market State          | RC-26     | `market_state_artifact`   | `research_artifact`  | No                       |
| Trading Orchestrator  | RC-26     | `orchestration_artifact`  | `orchestration`      | No                       |
| Exchange Scope        | RC-27     | `exchange_scope_artifact` | `policy_input`       | No                       |

Only Strategy Library is Matrix **SoT** among the twelve. Gate, research artifacts, and Orchestrator are specialized classes already locked by closed RCs — they are not money SoT.

---

## 2. Per-module authority (owned / forbidden / consumers / ports)

| Module                | Owned responsibilities                 | Forbidden (selected)                       | Allowed consumers                             | Forbidden consumers                                 | Approved ports              |
| --------------------- | -------------------------------------- | ------------------------------------------ | --------------------------------------------- | --------------------------------------------------- | --------------------------- |
| Command Center        | ops projections / command entry        | submit-order, ui-only-kill, become-SoT     | — (UI leaf)                                   | —                                                   | `BotFacadeService`          |
| Knowledge Lake        | analytical warehouse                   | mutate-orders/ledger, command-sot-feedback | Reporting, Qualification                      | Reporting reverse, Library, Gate                    | Ingestion + Query           |
| Strategy Library      | certified lifecycle / envelope binding | execute, invent-envelope, own Session      | Gate, Orchestrator                            | Gate reverse, Orchestrator reverse                  | Lookup + Eligibility        |
| Runtime Enforcement   | pass/fail Gate                         | certify, mutate-envelope, soft-fail        | Orchestrator                                  | Orchestrator reverse, Lake                          | `RUNTIME_ENFORCEMENT_PORT`  |
| Reporting             | report generation                      | shadow-accounting, trade, become-SoT       | AI, Command Center                            | AI reverse, Orchestrator                            | Service + Query             |
| AI Analytics          | analytical narrative                   | execute-trades, query-Lake-directly        | —                                             | Lake, Library, Gate                                 | `AI_ANALYTICS_PORT`         |
| Notification Delivery | channel delivery / preferences         | telegram-control-plane, pause-trading      | Command Center                                | Reporting, Library, Gate                            | `NOTIFICATION_SERVICE_PORT` |
| Market Qualification  | qualification-run / confidence         | force-trade, expand-envelope               | Orchestrator, Profile, State                  | Profile/State/Orchestrator reverse                  | Service / Query / Consumer  |
| Market Profile        | profile versions / dimensions          | force-trade, replace Risk                  | Orchestrator, State                           | State/Orchestrator reverse                          | Service / Query / Consumer  |
| Market State          | current-state snapshot                 | run-qualification, submit-order            | Orchestrator, Command Center                  | Orchestrator reverse                                | Service / Query / Consumer  |
| Trading Orchestrator  | orchestration-run / handoff intent     | own Session, duplicate Gate, submit-order  | Command Center                                | Reporting, AI                                       | Service / Query / Consumer  |
| Exchange Scope        | identity / policy inputs               | clone-risk/execution, certify-strategy     | Orchestrator, Reporting, Lake, Command Center | Library, Gate, Orchestrator, Reporting, Lake, State | Service / Query / Consumer  |

Consume direction is the Epic 1 allowed-edge set. Reverse of an allowed consume remains forbidden.

---

## 3. Authority leaks checked

| Leak class                                                         | Evidence                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Reverse Nest imports                                               | `v2-authority-dependency.spec.ts` — none observed                               |
| Hidden command path (Lake / AI / Notification → Session or Orders) | production import scan empty                                                    |
| UI-only kill                                                       | Command Center `emergency-controls.ts` — no UI-only kill                        |
| Telegram control plane                                             | Notification forbidden capabilities + no Session imports                        |
| Duplicate Gate                                                     | Orchestrator forbids `duplicate-validation-gate` / `soft-pass-enforcement-gate` |
| Envelope mutation at Gate                                          | `mutate-envelope` forbidden; `validateEnvelope` still required                  |

---

## 4. Constitution documents (unmodified)

| Document                     | Check                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Authority Matrix             | Status still **Approved (2026-08-10)**; cash disagreement still Ledger/Fill/Orders win |
| Alias Dictionary             | Bot / Cluster / Wallet / Brain rows unchanged                                          |
| Cluster Isolation Invariants | Checklist 1–10 still present                                                           |
| Tactics Contract             | Option B still normative                                                               |

---

## 5. STOP

Authority graph is frozen. Epic 4 may execute scenarios on these owners — it must not add authority classes or ports.
