# PC-15 Slice 15-c — Integration Report

**Package:** PC-15  
**Slice:** 15-c Reporting → AI Analytics  
**Date:** 2026-08-15  
**Verdict:** Certified product flow is wired. Producer and consumer remain the existing owners.

---

## Flow

```text
Reporting
  → Completed ReportRun (owner lifecycle)
  → product-flow adapter
  → AI Analytics generateNarrative()
  → Analytical Narrative
  → attachment projection (Reporting UI exposure)
```

ReportRun remains immutable. Unavailable Reporting still produces the existing unavailable narrative.

---

## Producer

| Item                                      | Owner                             |
| ----------------------------------------- | --------------------------------- |
| `requestReportRun` / `registerDefinition` | Reporting                         |
| ReportRun + AggregationSlice records      | Reporting (immutable after write) |
| Knowledge Lake reads                      | Reporting (read-only consumer)    |

Reporting does not import AI. Request on the Reporting module still does not generate narratives. The certified product path is the product-flow adapter.

---

## Consumer

| Item                                               | Owner                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `generateNarrative` / explain / summarize / trends | AI Analytics                                                       |
| Narrative artifact                                 | AI Analytics (`authorityClass: narrative`)                         |
| Complete → narrate wiring                          | Product-flow adapter (not a BC)                                    |
| Attachment / UI exposure                           | Product-flow projection (`attached: true`, `reportMutated: false`) |

AI never writes ReportRuns. AI never reads Knowledge Lake directly. Deterministic narrator: identical report → identical narrative.

---

## History

| Record             | After narrate                                                   |
| ------------------ | --------------------------------------------------------------- |
| ReportRun          | Unchanged (frozen)                                              |
| Aggregation slices | Unchanged (frozen)                                              |
| Narrative          | Generated (or unavailable) and attached by id in the projection |

---

## Fail-closed

| Case                          | Result                                           |
| ----------------------------- | ------------------------------------------------ |
| Completed / empty ReportRun   | Narrative generated and attached                 |
| Missing / rejected Reporting  | Existing unavailable narrative                   |
| Repeat attach                 | Same narrative (deterministic)                   |
| Lake unavailable to Reporting | Reporting empty/rejected; AI does not query Lake |

---

**End of Integration Report.**
