# PC-07 Notification Channels Product — Delivery Matrix

**Package:** PC-07  
**Date:** 2026-08-15  
**Owner:** Existing Notification Delivery `deliver()` + preference clock. This package does not redesign the scheduler.

| Requested frequency | Existing concept                                 | Offered in product                                      |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Immediately         | Producer invokes `deliver()`; routing runs then  | **Yes** — `producerTiming: immediate-on-deliver`        |
| Hourly digest       | None                                             | **Not offered** (`hourlyDigest: false`)                 |
| Daily digest        | Preference clock `dailyDeliveryTime` + timezone  | **Preference clock only** — not a digest engine or cron |
| Weekly digest       | None                                             | **Not offered** (`weeklyDigest: false`)                 |
| Disabled            | Type `enabled: false` or master `enabled: false` | **Yes**                                                 |

## Quiet hours

| Requested           | Existing                            | Offered                    |
| ------------------- | ----------------------------------- | -------------------------- |
| Global              | `schedule.quietHours`               | **Yes**                    |
| Per channel         | None                                | **Not offered**            |
| Timezone            | `schedule.timezone`                 | **Yes**                    |
| Daily delivery time | `schedule.dailyDeliveryTime`        | **Yes** (preference clock) |
| Weekend suppression | None                                | **Not offered**            |
| Critical bypass     | `schedule.criticalBypassQuietHours` | **Yes**                    |

## History / diagnostics outcomes

Existing attempt outcomes and skip reasons, filtered per channel:

| Status                | Source                                        |
| --------------------- | --------------------------------------------- |
| Delivered             | `outcome: delivered`                          |
| Skipped               | `outcome: skipped`                            |
| Channel not connected | `skipReason: channel-not-connected`           |
| Channel reserved      | `skipReason: channel-reserved`                |
| Failed                | `outcome: failed`                             |
| Timestamp             | `createdAt`                                   |
| Latency               | **Not available** (`latencyAvailable: false`) |

Test delivery exists only on Telegram when connected. Reserved channels hide Send Test.

---

**End of Delivery Matrix.**
