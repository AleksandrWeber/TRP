# Notification Delivery (`notification-delivery`)

**RC-24 Epic 6** — Notification projection delivery (Architecture Spec v2.0 §5.16 / Authority Matrix).

## Authority

| Concern                        | Class                                               |
| ------------------------------ | --------------------------------------------------- |
| Channel messages (Telegram, …) | **Notification projection**                         |
| Report generation              | Projection (owned by Reporting — not this module)   |
| AI narratives                  | Narrative (owned by AI Analytics — not this module) |

Delivery only. Never Source of Truth. Never a Telegram control plane.

## Surfaces

- `NotificationDeliveryService` / `NOTIFICATION_SERVICE_PORT`
- Channels: **Telegram active**; Email / Slack / Discord / Teams / Push **reserved-inactive**
- Telegram connection: Not Connected → Connect → (adapter binds chat id) → Connected
- Preferences: master enable, per-channel, per-type routing, schedule / quiet hours
- Test notification + delivery routing
- W3-O02-b: Notification Durable Queue work items on this owner snapshot (internal only; not REST)
- W3-O02-c: integrity-gated hydrate restores queue after normal process restart (not retry execution)
- W3-O02-d: derived Recovering | Ready | Degraded | Unavailable on Platform readiness (limited fields; not retry)

## Forbidden

Trading commands, pause/resume/stop, runtime control, strategy/session management, report generation, Strategy Library coupling, REST on this module, second Outbox, Wave 5 production transports, operator Queue UI.

HTTP product transport lives in sibling `notification-product` (PC-06). Telegram connection HTTP lives in sibling `telegram-product` (PC-07). Domain `rest: false` is unchanged.
