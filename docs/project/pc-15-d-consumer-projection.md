# PC-15 Slice 15-d — Consumer Projection

**Package:** PC-15 slice 15-d  
**Date:** 2026-08-15  
**Surface:** `ReportRunDeliveryView` (`apps/api/src/modules/product-flow/report-run-delivery.view.ts`)

This is not ReportRun SoT. This is not a Notification owner. It is the projection later Reporting / Notification UI will read.

---

## Shape

| Field                                     | Meaning                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `reportRunId` / `workspaceId` / `userId`  | Correlation only                                                          |
| `reportStatus` / `reportOutcome`          | Copied from Reporting; not rewritten                                      |
| `invoked`                                 | Whether `deliver()` was called                                            |
| `notInvokedReason`                        | `report_not_completed` / `user_id_required` / `unknown_notification_type` |
| `notificationType`                        | Existing catalog type (`daily-report` / `weekly-report`, …)               |
| `deliveryId` / `outcome`                  | Recorded DeliveryResult, or `not-invoked`                                 |
| `skipReasons` / `channelsAttempted`       | Routing / eligibility projection                                          |
| `attached: true`                          | Projection exists                                                         |
| `reportMutated: false`                    | ReportRun was not rewritten                                               |
| `generatesReports: false`                 | Notification did not generate a report                                    |
| `channelActivated: false`                 | Email / Slack / Telegram Bot not activated                                |
| `authorityClass: notification-projection` | Existing Notification authority class                                     |

---

## Ownership

| Artifact       | Owner                                        |
| -------------- | -------------------------------------------- |
| ReportRun      | Reporting                                    |
| DeliveryResult | Notification Delivery                        |
| This view      | Product-flow composition (not a BC, not SoT) |

PC-15 adds no REST and no UI. PC-06 / 15-f may later read this projection.

---

**End of Consumer Projection.**
