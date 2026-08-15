# Notification Product (`notification-product`)

**PC-06** settings/history + **PC-07** channel catalog/routing views over existing Notification Delivery.

Not a bounded context. Not a Source of Truth. Distinct from Command Center toasts and RCC `/settings`.

| Concern                                          | Owner                                                      |
| ------------------------------------------------ | ---------------------------------------------------------- |
| Preferences / routing / quiet hours / deliveries | **Notification Delivery** (`NotificationServicePort`)      |
| ReportRun                                        | **Reporting** (not this adapter)                           |
| Telegram connect / test / Bot                    | **PC-07** (`telegram-product`, not this adapter)           |
| Channel cards / reserved disclosure              | This adapter (catalog + prefs; no live reserved transport) |
| HTTP / product views                             | This adapter                                               |
| Operator UI                                      | `/notifications`, `/notifications/channels`                |

Forbidden: `deliver()`, Telegram connect/test in this adapter, Email/Slack/Discord/Teams/Push activation, cron, retry queues, report generation.

Domain Notification port posture remains `rest: false`. This module is transport only.
