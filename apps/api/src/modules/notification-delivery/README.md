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

## Forbidden

Trading commands, pause/resume/stop, runtime control, strategy/session management, report generation, Strategy Library coupling, REST product, durable persistence product.
