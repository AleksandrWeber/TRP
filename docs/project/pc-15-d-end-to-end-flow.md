# PC-15 Slice 15-d — End-to-End Flow

**Package:** PC-15 slice 15-d  
**Date:** 2026-08-15

---

## Certified path

```text
Register ReportDefinition
  → requestReportRun (Reporting owner)
  → completed / empty ReportRun stored
  → deliver() (Notification owner, via product-flow)
  → existing routing + channel eligibility
  → DeliveryResult recorded
  → consumer projection exposes deliveryId + outcome immediately
```

## Already completed run

```text
Existing ReportRun
  → deliverCompletedRun
  → same existing type + reportRunId
  → ReportRun JSON unchanged
```

## Unavailable path

```text
Missing / rejected Reporting
  → deliver() is not called
  → no report invented
  → projection invoked: false (report_not_completed)
```

## Channel posture on this path

Telegram remains the only active catalog channel. This slice does not connect Telegram. Default `deliver()` therefore records `skipped` with `channel-not-connected`. Email and Slack remain reserved-inactive.

---

## What the customer can observe (in-process)

- Completing a ReportRun invokes Notification Delivery.
- Routing rules and existing notification types are applied.
- A DeliveryResult is recorded even when every channel is skipped.
- The ReportRun itself is unchanged.
- Users still do not receive a Telegram message until 15-e / PC-07 connect.

No new screen. No new REST. PC-05 / PC-06 / PC-07 remain the later product surfaces.

---

**End of End-to-End Flow.**
