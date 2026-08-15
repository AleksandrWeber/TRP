# PC-07 Notification Channels Product — Routing Matrix

**Package:** PC-07  
**Date:** 2026-08-15  
**Owner:** Existing Notification Delivery type routing. This package does not invent types or a second router.

The operator configures, for each **existing** notification type: Enabled, Channels, Critical (existing priority-like flag).

## Existing types (13) — product rows

| Type                        | Enabled  | Channels (offered)                      | Critical            | Notes                                                           |
| --------------------------- | -------- | --------------------------------------- | ------------------- | --------------------------------------------------------------- |
| `daily-report`              | Existing | Telegram editable; reserved not offered | Existing `critical` | Daily Report                                                    |
| `weekly-report`             | Existing | Telegram editable; reserved not offered | Existing `critical` | Weekly Report                                                   |
| `monthly-report`            | Existing | Telegram editable; reserved not offered | Existing `critical` | Monthly Report                                                  |
| `session-finished`          | Existing | Telegram editable; reserved not offered | Existing `critical` | Session finished (not started/stopped/failed as separate types) |
| `strategy-certified`        | Existing | Telegram editable; reserved not offered | Existing `critical` | Closest existing deployment-adjacent type                       |
| `strategy-deprecated`       | Existing | Telegram editable; reserved not offered | Existing `critical` | Existing catalog                                                |
| `runtime-validation-failed` | Existing | Telegram editable; reserved not offered | Existing `critical` | Runtime Validation Failed                                       |
| `emergency-stop`            | Existing | Telegram editable; reserved not offered | Existing `critical` | Critical Alerts family                                          |
| `kill-switch-activated`     | Existing | Telegram editable; reserved not offered | Existing `critical` | Critical Alerts family                                          |
| `critical-platform-error`   | Existing | Telegram editable; reserved not offered | Existing `critical` | Critical Alerts family                                          |
| `order-events`              | Existing | Telegram editable; reserved not offered | Existing `critical` | Existing catalog                                                |
| `fill-events`               | Existing | Telegram editable; reserved not offered | Existing `critical` | Existing catalog                                                |
| `debug-events`              | Existing | Telegram editable; reserved not offered | Existing `critical` | Existing catalog                                                |

## Requested names that are not catalog types

These were **not invented**. They are not rows.

| Requested name       | Mapping                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Critical Alerts      | Use existing `emergency-stop`, `kill-switch-activated`, `critical-platform-error` |
| Deployment Approved  | **Not in catalog**                                                                |
| Deployment Failed    | **Not in catalog**                                                                |
| Session Started      | **Not in catalog** (session outcome is `session-finished`)                        |
| Session Stopped      | **Not in catalog**                                                                |
| Session Failed       | **Not in catalog**                                                                |
| Research Finished    | **Not in catalog**                                                                |
| AI Narrative Ready   | **Not in catalog** (AI remains narrative only; PC-17)                             |
| System Notifications | **Not in catalog**                                                                |

Priority is the existing `critical` flag (quiet-hours bypass when that preference is on). There is no separate priority engine.

---

**End of Routing Matrix.**
