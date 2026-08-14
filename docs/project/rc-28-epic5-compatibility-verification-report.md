# RC-28 Epic 5 — Compatibility Verification Report

**Document:** Version 2 Compatibility Matrix  
**Status:** **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 5 Report](./rc-28-epic5-performance-resilience-compatibility.md)  
**Code:** `apps/api/src/platform-conformance/v2-compatibility-matrix.ts`

Verification only. Existing contracts are unchanged. Ownership never changes.

---

## 1. Closed-RC matrix

| RC    | Theme                                 | Spec §5            | Identity keys                                        | New in RC-28 |
| ----- | ------------------------------------- | ------------------ | ---------------------------------------------------- | ------------ |
| RC-19 | Bot Facade + Exchange Scope identity  | 5.6 / 5.10         | `workspaceId`, `tradingSessionId`, `exchangeScopeId` | **false**    |
| RC-20 | Command Center foundation             | 5.16               | `workspaceId`, `tradingSessionId`                    | **false**    |
| RC-21 | Knowledge Lake                        | 5.13               | `workspaceId`                                        | **false**    |
| RC-22 | Strategy Library                      | 5.2                | `workspaceId`, `libraryEntryId`                      | **false**    |
| RC-23 | Runtime Enforcement                   | 5.2 / 5.6          | `workspaceId`, `libraryEntryId`, `exchangeScopeId`   | **false**    |
| RC-24 | Reporting / AI / Notification         | 5.14 / 5.15 / 5.16 | `workspaceId`                                        | **false**    |
| RC-25 | Market Qualification + Market Profile | 5.3                | `workspaceId`, `exchangeScopeId`                     | **false**    |
| RC-26 | Trading Orchestrator + Market State   | 5.4 / 5.5          | `workspaceId`, `exchangeScopeId`                     | **false**    |
| RC-27 | Exchange Scope                        | 5.10               | `workspaceId`, `exchangeScopeId`                     | **false**    |

All rows: `paperFreeze = true`. Port tokens resolve to `V2_APPROVED_PORT_FILES` already locked by Epic 3.

---

## 2. Compatibility surfaces

| Surface                         | Result                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Architecture Specification v2.0 | **PASS** — catalogued Spec headings still present; twelve V2 surfaces remain the shipped owners             |
| Authority Matrix                | **PASS** — document unmodified; no extra SoT introduced by RC-28                                            |
| Alias Dictionary                | **PASS** — document unmodified; Bot Facade remains Session alias                                            |
| Single-scope                    | **PASS** — certified Library record + `binance-spot` Gate → `VALID` / `pass`                                |
| Multi-scope                     | **PASS** — Binance vs Bybit account bindings disjoint; `assertSameExchangeScope` rejects mixing             |
| Frozen paper path               | **PASS** — Command Center still pause/resume/stop only; V2 Nest modules do not import `live-trading-engine` |
| Existing contracts              | **PASS** — no new application ports, Nest modules, or ownership                                             |

---

## 3. Observed results

| Check                 | Evidence                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| RC list complete      | Matrix ids are exactly RC-19…RC-27                                                                   |
| Identity keys on disk | Each row's `identityFiles` contain the documented keys                                               |
| Spec headings         | Exact `### 5.x …` strings present in Spec v2.0                                                       |
| Paper freeze          | `session-commands.ts` has no `submitOrder` / `approveRisk`; no V2 Nest import of live-trading-engine |
| Default scope         | `validateDeployment` with certified `lib-entry-1` + `binance-spot` passes                            |
| Concurrent scopes     | Exchange Scope consumer reads do not leak accounts across venues                                     |

---

## 4. STOP

Compatibility matrix is **approved**. Epic 6 certified these same contracts without adding ports, modules, or ownership.
