# PC-15 Slice 15-f — Architecture Impact

**Package:** PC-15 slice 15-f  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Dashboard remains projection only. Command Center remains command UI. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after 15-f   |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern               | Owner before                      | Owner after                                               |
| --------------------- | --------------------------------- | --------------------------------------------------------- |
| ReportRun             | Reporting                         | Unchanged                                                 |
| Narrative             | AI Analytics                      | Unchanged                                                 |
| Delivery              | Notification Delivery             | Unchanged (`listDeliveries` is a query on the same owner) |
| Session lifecycle     | Trading Session                   | Unchanged                                                 |
| Runtime lifecycle     | Strategy Runtime                  | Unchanged (consumer read)                                 |
| Dashboard composition | Missing from operator projections | Product-flow composition (not a BC, not a SoT)            |
| Command Center        | Command UI over Session GET       | Unchanged owner; additive projection fields               |

---

## Authority Consumption

| Authority               | How 15-f uses it                                                  |
| ----------------------- | ----------------------------------------------------------------- |
| Reporting               | **Read** `listRuns` / `getRun`. Never mutate ReportRun.           |
| AI Analytics            | **Read** attached narrative via existing 15-c getter.             |
| Notification            | **Read** `listDeliveries`. Never `deliver()` from the projection. |
| Trading Session         | **Read** workspace sessions.                                      |
| Strategy Runtime        | **Read** `getLifecycle`.                                          |
| Qualification / Profile | **Read** latest where the existing target id is parseable.        |

---

## Ports

| Port                          | Before                     | After                                                 |
| ----------------------------- | -------------------------- | ----------------------------------------------------- |
| Notification `listDeliveries` | Not on the port            | **Additive query** — filters recorded deliveries      |
| Notification `deliver()`      | 15-d / 15-e owner method   | **Unchanged**                                         |
| Reporting query               | Existing                   | **Unchanged**                                         |
| Command Center GET            | Health / runtime / handoff | **Same resource** + report/delivery projection fields |

---

## What was not changed

- Spec, Authority Matrix, Alias Dictionary, RC history
- Dashboard redesign / Command Center redesign
- Reporting / Notification / Session ownership
- New REST resources
- `/reports` as RC-24 Reporting

---

**End of Architecture Impact.**
