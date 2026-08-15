# PC-15 Slice 15-d — Integration Report

**Package:** PC-15  
**Slice:** 15-d Reporting → Notification Delivery  
**Date:** 2026-08-15  
**Verdict:** Certified product flow is wired. Producer and consumer remain the existing owners.

---

## Flow

```text
Reporting
  → Completed ReportRun (owner lifecycle)
  → product-flow adapter
  → Notification Delivery deliver()
  → existing routing rules
  → channel eligibility
  → DeliveryResult recorded
  → consumer projection (Reporting UI exposure later)
```

ReportRun remains immutable. Missing / rejected Reporting does not invent a report and does not call `deliver()`.

---

## Producer

| Item                                      | Owner                             |
| ----------------------------------------- | --------------------------------- |
| `requestReportRun` / `registerDefinition` | Reporting                         |
| ReportRun + AggregationSlice records      | Reporting (immutable after write) |

Reporting does not import Notification. Request on the Reporting module still does not deliver. The certified product path is the product-flow adapter.

---

## Consumer

| Item                              | Owner                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `deliver` / routing / preferences | Notification Delivery                                                                         |
| DeliveryResult                    | Notification Delivery (`authorityClass: notification-projection`)                             |
| Complete → deliver wiring         | Product-flow adapter (not a BC)                                                               |
| Attachment / UI exposure          | Product-flow projection (`attached: true`, `reportMutated: false`, `generatesReports: false`) |

Notification never writes ReportRuns. Notification never generates report text as SoT. Subject/body on `deliver()` is a delivery envelope, not a new report.

---

## History

| Record             | After deliver                                      |
| ------------------ | -------------------------------------------------- |
| ReportRun          | Unchanged (frozen)                                 |
| Aggregation slices | Unchanged (frozen)                                 |
| DeliveryResult     | Recorded by Notification Delivery; projected by id |

---

## Fail-closed

| Case                         | Result                                                   |
| ---------------------------- | -------------------------------------------------------- |
| Completed / empty ReportRun  | `deliver()` invoked; result recorded                     |
| Telegram not connected       | Existing skip: `channel-not-connected`                   |
| Type disabled in preferences | Existing skip: `type-disabled`                           |
| Missing / rejected Reporting | No `deliver()`; `notInvokedReason: report_not_completed` |
| Email / Slack                | Remain reserved-inactive                                 |

---

**End of Integration Report.**
