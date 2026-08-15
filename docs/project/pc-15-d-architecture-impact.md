# PC-15 Slice 15-d — Architecture Impact

**Package:** PC-15 slice 15-d  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Reporting remains report owner. Notification Delivery remains delivery only. No new SoT. No new authority. No channel activation.

---

## Frozen artifacts

| Artifact                        | Status after 15-d   |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern                         | Owner before                                | Owner after                                         |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| ReportRun / aggregations        | Reporting                                   | Unchanged                                           |
| Notification delivery / routing | Notification Delivery                       | Unchanged                                           |
| Complete → deliver wiring       | Missing (manual e2e compose only)           | Product-flow composition (not a BC)                 |
| Telegram / Email / Slack        | Telegram active in catalog; others reserved | Unchanged (this slice does not connect or activate) |
| Trade / Gate / Session          | Never this slice                            | Still never                                         |

Reporting still must not import Notification. Notification still must not import Reporting. Product-flow may import both. Neither owner imports product-flow.

---

## Authority Consumption

| Authority             | How 15-d uses it                                                     |
| --------------------- | -------------------------------------------------------------------- |
| Reporting             | **Owner** of request / query. Adapter delegates `requestReportRun`.  |
| Notification Delivery | **Owner** of `deliver()`. Adapter never routes or records itself.    |
| Channel adapters      | **Not invoked for connect.** Eligibility remains inside `deliver()`. |

---

## Ports

| Port                      | Before                        | After                                                   |
| ------------------------- | ----------------------------- | ------------------------------------------------------- |
| Reporting request / query | Lifecycle + query             | **Same owner** — still does not deliver                 |
| Notification `deliver`    | Caller must invoke separately | **Same owner** — invoked by product-flow after complete |
| Attachment                | Not a product path            | Projection only — ReportRun not rewritten               |

---

## What was not changed

- Reporting domain or generation
- Notification Delivery `deliver()`, routing, or channel catalog
- Telegram connect / verify / disconnect workflow
- Spec, Authority Matrix, Alias Dictionary, RC history
- REST, UI, PC-05, PC-06, PC-07

---

**End of Architecture Impact.**
