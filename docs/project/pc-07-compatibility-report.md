# PC-07 Notification Channels Product — Compatibility Report

**Package:** PC-07  
**Date:** 2026-08-15  
**Verdict:** Additive channel REST and UI. Notification Delivery, routing, Reporting, and Telegram operations unchanged. Deferred channels stay reserved. No Bot API.

---

## REST

| Endpoint                                               | Compatibility                                            |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `GET /v1/notification-settings`                        | Unchanged (PC-06)                                        |
| `GET/PUT /v1/notification-preferences`                 | Unchanged (PC-06) — Channels UI upserts through this     |
| `GET /v1/notification-routing`                         | Unchanged (PC-06)                                        |
| `GET /v1/notification-deliveries`                      | Unchanged (PC-06)                                        |
| `GET /v1/notification-channels`                        | Unchanged catalog (PC-06)                                |
| `GET /v1/notification-channels/workspace`              | **New** — composed existing prefs + catalog + connection |
| `GET /v1/notification-channels/:channelId`             | **New** — composed existing catalog + prefs + deliveries |
| `GET /v1/notification-channels/:channelId/diagnostics` | **New** — composed existing deliveries                   |
| `GET /v1/notification-channels/:channelId/deliveries`  | **New** — existing `listDeliveries` filtered by channel  |
| `GET/POST /v1/telegram/*`                              | Unchanged Telegram product REST                          |
| Notification `deliver()` POST                          | Unchanged (none; PC-15 in-process)                       |
| AI HTTP                                                | Unchanged (none; PC-17)                                  |

No new API version. No renamed Notification domain fields. No SMTP/webhook body. No chat-id body. No cron.

---

## Frontend compatibility

| Path                                         | Compatibility                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/notifications/channels`                    | **New** channel cards, routing matrix, frequency, quiet hours                                   |
| `/notifications/channels/:channelId`         | **New** Telegram wizard or reserved disclosure                                                  |
| `/notifications/channels/:channelId/history` | **New** per-channel history                                                                     |
| `/telegram`                                  | **Redirect** to `/notifications/channels/telegram`                                              |
| `/telegram/history`                          | **Redirect** to `/notifications/channels/telegram/history`                                      |
| `/notifications`                             | Additive link to Channels                                                                       |
| `/settings`                                  | Unchanged RCC preferences                                                                       |
| Operator Shell bands                         | Same Research / Paper trading / Administration frame; Channels replaces standalone Telegram nav |
| Home                                         | Channels tile replaces Telegram tile                                                            |
| Command Center `NotificationCenter`          | Unchanged RC-20 in-app toasts                                                                   |

---

## Downstream

- Notification Delivery remains the delivery owner.
- Channel adapters remain transports only (in-memory Telegram unchanged).
- Chat id remains adapter-supplied.
- Deferred channels stay reserved-inactive.
- Reporting remains report owner. AI remains narrative only.
- PC-12 Exchange Scope Product is next after review.

---

**End of Compatibility Report.**
