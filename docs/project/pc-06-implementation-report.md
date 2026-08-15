# PC-06 Notification Product — Implementation Report

**Package:** PC-06 Notification Product  
**Wave:** E — evidence and delivery (Notification product UI)  
**Date:** 2026-08-15  
**Journey:** J-12 Notification — **COMPLETE**  
**Status:** Ready for review (stop before PC-07)  
**Readiness:** Notification declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes the certified RC-24 Notification Delivery capability as a customer product. It does not redesign Notification Delivery, Reporting, or Telegram, and does not introduce a scheduler, retry queue, or new channel.

---

## What was exposed

| Surface   | Change                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **REST**  | Existing Notification queries and preference upserts at `/v1/notification-settings`, `/v1/notification-preferences`, `/v1/notification-channels`, `/v1/notification-routing`, `/v1/notification-deliveries`. |
| **UI**    | Notification Settings, delivery history, delivery details, channel status, routing, quiet hours, timezone, daily delivery, master / per-type enable.                                                         |
| **Shell** | Notifications nav item in the PC-19 Administration band. Home tile. Reporting link into settings.                                                                                                            |

No new domain. No new Source of Truth. Notification Delivery remains the delivery owner. Reporting remains the report owner. Telegram remains transport only.

---

## Product path (not a redesign)

| File                                          | Role                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `apps/api/src/modules/notification-delivery/` | Existing owner: preferences, routing, deliveries, Telegram connection |
| `apps/api/src/modules/notification-product/`  | HTTP product adapter. Queries + preference upsert. No `deliver()`.    |
| `apps/web/src/notifications/`                 | Settings, history, detail                                             |

Ports used: existing `NotificationServicePort` (`listChannels`, `get/upsertPreferences`, `listDeliveries`, `getTelegramConnection`). Routing evaluation uses existing `resolveDeliveryRoutes`. UI and REST delegate. No shadow API. No Telegram connect / test. No reserved-channel activation.

Stored timezone is applied when evaluating quiet hours. Stored `dailyDeliveryTime` is shown on a preference clock. That clock is not a scheduler.

History is the existing delivery list, newest first. It is not a second delivery owner.

---

## REST contract

Existing Notification queries and preference operations (product transport):

- `GET /v1/notification-settings` — preferences, channels, Telegram status, routing, preference clock
- `GET /v1/notification-preferences` — existing preferences
- `PUT /v1/notification-preferences` — existing `upsertPreferences`
- `GET /v1/notification-channels` — catalog (Telegram offered; others reserved)
- `GET /v1/notification-routing` — existing type routing + current evaluation
- `GET /v1/notification-deliveries` — recorded deliveries. Optional `type`, `outcome`, `reportRunId`, `q`, `limit`
- `GET /v1/notification-deliveries/:deliveryId` — recorded attempts and skip reasons

Unchanged:

- Domain `NOTIFICATION_PORTS_ACTIVE.rest` remains `false`
- Telegram connect / complete / verify / disconnect / test (PC-07)
- `deliver()` (PC-15 15-d)
- Reporting REST (PC-05)

Missing workspace header is **400**. Foreign workspace is **403**. Unknown delivery is **404**. There is no send POST, no connect wizard, and no cron.

Chat id and connection tokens are never product fields.

---

## UI

- Notification Settings: master enable, per-type enable, Telegram channel enable, reserved channels listed not offered
- Quiet hours, timezone, daily delivery time
- Channel status and current routing evaluation / skip reasons
- Telegram connection status read-only (not-connected / pending / connected)
- Delivery history with search and type / outcome filters
- Delivery details with attempts and recorded skip reasons
- Empty, loading, and error states

No Telegram connection wizard. No test send. No Email / Slack / Discord / Teams / Push activation.

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

Notification domain `rest: false` posture is unchanged. HTTP is a sibling product adapter. Notification Delivery still does not import Reporting or product-flow.

---

## Definition of Done

| #   | Gate                               | Result                                                                                               |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — existing preferences, routing, deliveries, channel catalog operable                       |
| 2   | REST transport complete            | **TRUE** — existing Notification queries + preference upsert + product views                         |
| 3   | UI complete                        | **TRUE** — settings, history, detail, channel status, routing, quiet hours, timezone, daily delivery |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no `deliver()` / connect / test                                            |
| 5   | Integration wiring complete        | **TRUE** — PC-15 15-d/15-e already record deliveries; this package exposes them                      |
| 6   | Tests PASS                         | **TRUE** — web 184, api 3140                                                                         |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched                    |
| 8   | Release Notes written              | **TRUE** — [`pc-06-release-notes.md`](./pc-06-release-notes.md)                                      |
| 9   | CHANGELOG updated                  | **TRUE**                                                                                             |
| 10  | Backlog updated                    | **TRUE** — PC-06 Closed                                                                              |
| 11  | Canonical user journey works       | **TRUE** — J-12 Complete; UI Policy not violated                                                     |

```text
Package: PC-06
Journey steps enabled: J-12
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

---

## Companions

- [Architecture Impact](./pc-06-architecture-impact.md)
- [Compatibility Report](./pc-06-compatibility-report.md)
- [Notification UX Audit](./pc-06-notification-ux-audit.md)
- [User Value](./pc-06-user-value.md)
- [System Boundaries](./pc-06-system-boundaries.md)
- [Authority Consumption](./pc-06-authority-consumption.md)
- [Customer-visible Changes](./pc-06-customer-visible-changes.md)
- [Tests Summary](./pc-06-tests-summary.md)
- [Validation Report](./pc-06-validation-report.md)
- [Documentation Summary](./pc-06-documentation-summary.md)
- [Release Notes](./pc-06-release-notes.md)
- [Product Readiness Update](./pc-06-product-readiness-update.md)

**STOP.** Next package is PC-07 Telegram Product. Do not begin PC-07 until this package is reviewed.

---

**End of Implementation Report.**
