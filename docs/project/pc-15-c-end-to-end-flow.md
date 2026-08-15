# PC-15 Slice 15-c — End-to-End Flow

**Package:** PC-15 slice 15-c  
**Date:** 2026-08-15

---

## Certified path

```text
Register ReportDefinition
  → requestReportRun (Reporting owner)
  → completed / empty ReportRun stored
  → generateNarrative (AI owner, via product-flow)
  → Analytical Narrative attached as projection
  → Reporting exposure reads narrativeId + text immediately
```

## Already completed run

```text
Existing ReportRun
  → narrateCompletedRun
  → same deterministic narrative
  → ReportRun JSON unchanged
```

## Unavailable path

```text
Missing / rejected Reporting
  → generateNarrative
  → existing unavailable narrative
  → no SoT queried
  → no ReportRun invented
```

## What the customer can observe (in-process)

- Completing a ReportRun produces an Analytical Narrative.
- The narrative is attached by id without rewriting the run.
- Repeating the same report yields the same narrative.
- Unavailable Reporting still shows the existing unavailable narrative.

No new screen. No new REST. PC-05 / PC-17 remain the later product surfaces.

---

**End of End-to-End Flow.**
