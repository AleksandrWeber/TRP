# PC-17 AI Analytics Product — Release Notes

**Package:** PC-17 AI Analytics Product  
**Date:** 2026-08-16

AI Analytics is now a customer product. Operators can browse existing analyses, generate narratives from existing ReportRuns, compare reports, inspect reasoning and provenance, review non-trading recommendations, and follow Knowledge Lake / Reporting / Strategy references.

This is not a new Source of Truth. Research `/ai` is unchanged. Narratives remain explanations, never orders. AI Analytics remains the only owner of analysis.

---

## Added

- AI Analytics Home at `/ai-analytics`
- History at `/ai-analytics/history`
- Narrative detail at `/ai-analytics/:analysisId`
- `GET /v1/ai-analytics` list, history, provenance, and analysis reads
- `POST /v1/ai-analytics/generate` over existing `AIAnalyticsPort`

## Not in this release

- Manual AI authoring
- Report / knowledge / strategy ownership
- Notification sending
- New storage
- Product UX polish (PC-20)
- Live Trading

---

**STOP.** Wait for review before **PC-20 Product UX Polish**.

---

**End of Release Notes.**
