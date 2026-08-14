# RC-28 Epic 5 — Performance & Resilience Report

**Document:** Version 2 Performance / Resilience Catalog  
**Status:** **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 5 Report](./rc-28-epic5-performance-resilience-compatibility.md)  
**Code:** `apps/api/src/platform-conformance/v2-resilience-matrix.ts`

Verification only. No optimizations. No runtime changes. Fail-closed behaviour is preserved, not redesigned.

---

## 1. Performance (stability, not optimization)

| Check                                    | Result   | Evidence                                                                                                |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| No unnecessary cross-module dependencies | **PASS** | Observed V2 Nest imports ⊆ `V2_ALLOWED_CONSUME_EDGES`                                                   |
| No duplicate graph traversal             | **PASS** | Allowed consume pairs are unique; forbidden reverse pairs are unique; no allowed/forbidden overlap      |
| No hidden coupling                       | **PASS** | Product Nest modules and Command Center do not import `platform-conformance`                            |
| Startup dependency integrity             | **PASS** | Each V2 Nest symbol imported once in `AppModule`; representative graphs compile with in-memory adapters |
| Compile consistency                      | **PASS** | Catalog files remain non-`@Module`; no `PlatformConformanceModule`                                      |

No caching SoT, no extra graph engine, no transport product.

---

## 2. Resilience matrix

| Case                         | Missing                  | Expected              | Invents SoT |
| ---------------------------- | ------------------------ | --------------------- | ----------- |
| `missing-library`            | Strategy Library record  | fail-closed           | **false**   |
| `missing-gate-identity`      | Gate identity            | fail-closed           | **false**   |
| `missing-scope`              | Exchange Scope match     | fail-closed           | **false**   |
| `lake-query-miss`            | Knowledge Lake fact      | empty-projection      | **false**   |
| `unavailable-knowledge-lake` | Lake facts for Reporting | empty-projection      | **false**   |
| `unavailable-reporting`      | ReportRun                | narrative-unavailable | **false**   |
| `unavailable-ai`             | AI Analytics             | commands-still-route  | **false**   |
| `unavailable-notification`   | Notification channel     | delivery-skipped      | **false**   |

---

## 3. Observed results

| Check                          | Evidence                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Missing identity               | `validateDeployment` without Library id → `INVALID` / `fail`                                      |
| Missing Library                | unknown `libraryEntryId` → `INVALID` / `fail`                                                     |
| Missing scope                  | certified record + `exchange-scope:unknown` → `scope_not_allowed`                                 |
| Lake miss                      | `getByEventId('missing')` → `null`; empty `list` stays `authorityClass: projection`               |
| Unavailable Lake for Reporting | `requestReportRun` with no facts → `outcome: empty`                                               |
| Unavailable Reporting          | `ai.summarize({ reportRunId: 'missing-run' })` → narrative `unavailable`                          |
| Unavailable Notification       | `deliver` without Telegram connect → `channel-not-connected`; nothing sent                        |
| Unavailable AI                 | Command Center `session-commands.ts` still routes pause/resume/stop and does not import AI / Lake |
| Projection class               | empty ReportRun remains `authorityClass: projection`; Reporting `sourceOfTruth: false`            |

---

## 4. Startup integrity

Compiled in-process (Outbox dispatcher stubbed; no live venue network):

- `StrategyLibraryModule`
- `RuntimeEnforcementModule`
- `ExchangeScopeModule`
- `TradingOrchestratorModule`
- `NotificationDeliveryModule`
- `AiAnalyticsModule` (pulls Reporting + Knowledge Lake)

Market Qualification / Profile / State remain AppModule-registered; they are not compiled here because they pull Live Market Data / Prisma — the suite stays independent of live venues.

---

## 5. STOP

Performance and resilience evidence is **approved**. Epic 6 did not turn these checks into a new runtime, cache, or orchestration product.
