# PC-06 Notification Product — Compatibility Report

**Package:** PC-06  
**Date:** 2026-08-15  
**Verdict:** Additive Notification REST and UI. Reporting REST unchanged. Telegram connect REST remains PC-07. Deferred channels stay reserved.

---

## REST

| Endpoint                                      | Compatibility                                         |
| --------------------------------------------- | ----------------------------------------------------- |
| `GET /v1/report-runs`                         | Unchanged (PC-05)                                     |
| `GET /v1/notification-settings`               | **New** — composed existing queries                   |
| `GET /v1/notification-preferences`            | **New** — existing `getPreferences`                   |
| `PUT /v1/notification-preferences`            | **New** — existing `upsertPreferences`                |
| `GET /v1/notification-channels`               | **New** — existing `listChannels`                     |
| `GET /v1/notification-routing`                | **New** — existing `resolveDeliveryRoutes`            |
| `GET /v1/notification-deliveries`             | **New** — existing `listDeliveries` + product filters |
| `GET /v1/notification-deliveries/:deliveryId` | **New** — existing recorded delivery                  |
| Telegram connect / test HTTP                  | Unchanged (none; PC-07)                               |
| AI HTTP                                       | Unchanged (none; PC-17)                               |

No new API version. No renamed Notification domain fields. No `deliver()` POST. No cron.

---

## Frontend compatibility

| Path                                | Compatibility                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `/notifications`                    | **New** Notification Settings                                                               |
| `/notifications/history`            | **New** delivery history                                                                    |
| `/notifications/:deliveryId`        | **New** delivery detail                                                                     |
| `/settings`                         | Unchanged RCC preferences                                                                   |
| Operator Shell bands                | Same Research / Paper trading / Administration frame; Notifications added to Administration |
| Reporting                           | Additive link to Notification settings                                                      |
| Home                                | Additive Notifications tile                                                                 |
| Command Center `NotificationCenter` | Unchanged RC-20 in-app toasts                                                               |

---

## Downstream

- Notification Delivery remains the delivery owner.
- Reporting remains the report owner (PC-05).
- Telegram remains transport only (PC-07 product UI not started).
- Deferred channels stay reserved-inactive.
- PC-07 Telegram Product is next after review.

---

**End of Compatibility Report.**
