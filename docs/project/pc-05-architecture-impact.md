# PC-05 Reporting Product — Architecture Impact

**Package:** PC-05  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Reporting remains report owner. AI remains narrative only. Notification remains delivery only. Dashboard remains projection. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after PC-05  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                         | Owner before            | Owner after                         |
| ----------------------------------------------- | ----------------------- | ----------------------------------- |
| ReportDefinition / ReportRun / AggregationSlice | Reporting               | Reporting                           |
| Analytical Narrative                            | AI Analytics            | AI Analytics (consumed)             |
| Delivery records                                | Notification Delivery   | Notification Delivery (consumed)    |
| Dashboard tiles                                 | Product-flow projection | Unchanged                           |
| Command Center                                  | Command UI              | Unchanged — additive ReportRun link |
| Research `/v1/reports`                          | Research Report         | Unchanged (not RC-24)               |

HTTP is transport. UI is not SoT. The product adapter does not generate reports, send notifications, or become ledger SoT.

---

## Ports

| Port                          | Before                            | After                                                      |
| ----------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `ReportingQueryPort`          | Active in-process (`rest: false`) | **Active** — same queries + HTTP                           |
| `ReportingServicePort`        | Active in-process (generation)    | **Unchanged** — not exposed by this adapter                |
| AI `generateNarrative`        | In-process via PC-15              | **Consumed** on detail via existing `getAttachedNarrative` |
| Notification `listDeliveries` | In-process via PC-15 15-f         | **Consumed** on list/detail                                |
| Persistence                   | Process-local Reporting store     | Unchanged (not a new SoT)                                  |

---

## What was not changed

- Report generation / aggregation math
- Report kinds and metric allowlist
- AI Analytics narrative owner
- Notification routing / `deliver()`
- Dashboard composition
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `REPORTING_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
