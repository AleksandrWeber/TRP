# PC-17 AI Analytics Product — UX Audit

**Package:** PC-17  
**Date:** 2026-08-16  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — operator can generate and inspect existing analyses without false product claims.

---

## Screens

| Screen               | Path                        | Operator can                                      | Hidden / absent                      |
| -------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------ |
| AI Analytics Home    | `/ai-analytics`             | Browse analyses, generate from existing ReportRun | Manual AI authoring, new storage     |
| Analysis Browser     | Home                        | Filter by kind / report / strategy                | Semantic search redesign             |
| Generate             | Home                        | Explain / summarize / trends / narrative          | Order generation, autonomous actions |
| History              | `/ai-analytics/history`     | Browse existing analyses, newest first            | Persistence product                  |
| Narrative details    | `/ai-analytics/:analysisId` | Read text, disclaimer, metadata                   | Edit narrative as SoT                |
| Recommendations      | Detail                      | Review non-trading recommendations                | One-click trade                      |
| Reasoning            | Detail                      | Inspect model / method                            | Hidden provider claims               |
| Source viewer        | Detail                      | Follow existing sourceRefs                        | Invent sources                       |
| Comparison view      | Detail (when generated)     | Compare two existing reports                      | Own either report                    |
| Knowledge references | Detail                      | Follow cited Lake entries                         | Edit knowledge                       |
| Report references    | Detail                      | Follow cited ReportRuns                           | Generate reports from AI             |
| Strategy references  | Detail                      | Follow cited Library ids                          | Edit / certify strategies            |

---

## Policy checks

| Rule                                      | Result                                                                |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** — no trade / persist / report-own / notify / ingest controls |
| Never expose Coming Soon                  | **PASS**                                                              |
| Navigation represents actual capabilities | **PASS** — AI Analytics is operable today                             |
| Research tools identified                 | **PASS** — `/ai` remains “AI gateway”; AI Analytics is distinct       |
| Never imply Live Trading                  | **PASS** — “Explanation, not an order”; `forcesTrade: false`          |

`/ai` is not renamed. AI Analytics is a distinct product. Empty, loading, and error states are present. Disclosure: narrative only, not Source of Truth.

---

**End of AI Analytics UX Audit.**
