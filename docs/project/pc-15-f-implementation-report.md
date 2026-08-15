# PC-15 Slice 15-f — Implementation Report

**Package:** PC-15 Product Flow Integration  
**Slice:** 15-f Dashboard & Product Projections  
**Wave:** E / F — evidence into operator projections  
**Date:** 2026-08-15  
**Journey:** Completes dashboard wiring for J-14. Does not close PC-05 Reporting product UI.  
**Status:** Ready for review (PC-15 package **CLOSED**)  
**Readiness:** Slice 15-f complete. PC-15 package **Closed**. Overall Product Readiness remains **58%** (no invented overall score).

This slice wires existing certified products into existing operator read projections. No new business logic. No architecture redesign.

---

## What was wired

| Surface                  | Change                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard projection** | `OperatorProjectionService.projectDashboard` composes existing owner reads: ReportRuns, AI narratives, deliveries, paper sessions, runtime, Qualification/Profile latest where already available. |
| **Command Center GET**   | Existing `/v1/trading-sessions/:id` adds `latestReport` and `delivery` from the same composition. List endpoint stays `BotView[]`.                                                                |
| **Notification query**   | Additive `listDeliveries()` on the existing Notification port. Filters already-recorded deliveries. Does not send or retry.                                                                       |
| **Home**                 | Paper session count and runtime health from existing `listTradingSessions` / `getRuntimeHealth` only. No `/reports`.                                                                              |
| **RCC `/dashboard`**     | Unchanged research control center. Not relabeled as product ReportRuns.                                                                                                                           |

No new domain. No new Source of Truth. No new REST resource. No owner redesign.

---

## Product path (not a redesign)

| File                                                                    | Role                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/modules/product-flow/operator-projection.service.ts`      | Compose existing owner reads                   |
| `apps/api/src/modules/product-flow/operator-dashboard.view.ts`          | Frozen Dashboard / session consumer projection |
| `apps/api/src/modules/bot-facade/command-center-session.view.ts`        | Existing Command Center session GET fields     |
| `apps/api/src/modules/notification-delivery/ports/notification.port.ts` | Additive `listDeliveries` query                |

Ports used: existing Reporting query, AI `getAttachedNarrative` (via 15-c), Notification `listDeliveries`, Trading Session repository, Strategy Runtime `getLifecycle`, Qualification / Profile queries.

---

## Ownership held

| Invariant                             | Status   |
| ------------------------------------- | -------- |
| Dashboard remains projection only     | **Held** |
| Command Center remains command UI     | **Held** |
| Reporting remains report owner        | **Held** |
| Notification remains delivery owner   | **Held** |
| Trading Session remains Session owner | **Held** |
| No new SoT / authority                | **Held** |
| No new REST resource                  | **Held** |

---

## Definition of Done (slice)

| #   | Check                              | Result                                                                  |
| --- | ---------------------------------- | ----------------------------------------------------------------------- |
| 1   | Dashboard projections updated      | **TRUE**                                                                |
| 2   | Command Center projections updated | **TRUE**                                                                |
| 3   | Existing read models reused        | **TRUE**                                                                |
| 4   | Tests PASS                         | **TRUE** — see [`pc-15-f-tests-summary.md`](./pc-15-f-tests-summary.md) |
| 5   | Documentation updated              | **TRUE**                                                                |
| 6   | PC-15 completed                    | **TRUE**                                                                |

Package: PC-15 Product Flow Integration **CLOSED**.

---

**STOP.** Wait for review before **PC-05 Reporting Product**. Do not begin PC-05 in this slice.
