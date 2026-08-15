# PC-15 Slice 15-c — Architecture Impact

**Package:** PC-15 slice 15-c  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Reporting remains report owner. AI remains narrative only. Lake unchanged. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after 15-c   |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern                   | Owner before                      | Owner after                                              |
| ------------------------- | --------------------------------- | -------------------------------------------------------- |
| ReportRun / aggregations  | Reporting                         | Unchanged                                                |
| Analytical Narrative      | AI Analytics                      | Unchanged                                                |
| Complete → narrate wiring | Missing (manual e2e compose only) | Product-flow composition (not a BC)                      |
| Knowledge Lake            | Projection warehouse              | Unchanged (Reporting still the only reader on this path) |
| Trade / Gate / Session    | Never this slice                  | Still never                                              |

Reporting still must not import AI. AI may still read Reporting. Product-flow may import both. Neither owner imports product-flow. Lake never depends on Reporting or product-flow.

---

## Authority Consumption

| Authority      | How 15-c uses it                                                             |
| -------------- | ---------------------------------------------------------------------------- |
| Reporting      | **Owner** of request / query. Adapter delegates `requestReportRun`.          |
| AI Analytics   | **Owner** of `generateNarrative`. Adapter never builds narrative text.       |
| Knowledge Lake | **Not imported** by product-flow. Reporting continues read-only consumption. |

---

## Ports

| Port                      | Before                        | After                                                   |
| ------------------------- | ----------------------------- | ------------------------------------------------------- |
| Reporting request / query | Lifecycle + query             | **Same owner** — still does not generate narratives     |
| AI `generateNarrative`    | Caller must invoke separately | **Same owner** — invoked by product-flow after complete |
| Attachment                | Not a product path            | Projection only — ReportRun not rewritten               |

---

## What was not changed

- Reporting domain, generation, or Lake consumption
- AI domain, narrator, or unavailable path
- Knowledge Lake admission / query
- Spec, Authority Matrix, Alias Dictionary, RC history
- REST, UI, PC-05, PC-17

---

**End of Architecture Impact.**
