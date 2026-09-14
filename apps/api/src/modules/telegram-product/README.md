# Telegram Product (`telegram-product`)

**PC-07** — HTTP + UI product adapter over existing Telegram connection operations on `NotificationServicePort`.

Not a bounded context. Not a Source of Truth. Distinct from Notification Settings and Command Center toasts.

| Concern                                              | Owner                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Connection / verify / test / disconnect / deliveries | **Notification Delivery** (`NotificationServicePort`)                                     |
| Telegram send                                        | Bound `TELEGRAM_CHANNEL_ADAPTER` (production Bot API adapter; in-memory adapter in tests) |
| Chat id                                              | Adapter-supplied (never a user field)                                                     |
| HTTP / product views                                 | This adapter                                                                              |
| Operator UI                                          | `/notifications/channels/telegram` (legacy `/telegram` redirects)                         |

Forbidden: Telegram as control plane, Email/Slack/Discord/Teams/Push activation, cron, retry queues, trading commands, Notification Delivery redesign.

Domain Notification port posture remains `rest: false`. This module is transport only.
