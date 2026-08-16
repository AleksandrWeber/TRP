# PC-17 AI Analytics Product — Authority Consumption

**Package:** PC-17  
**Date:** 2026-08-16

| Authority                       | How PC-17 uses it                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AI Analytics                    | **Owner** of analysis, summaries, narratives, comparisons, insights, recommendations. REST/UI expose existing generation. |
| Reporting                       | **Read** ReportRuns and `compareRuns`. Does not generate or mutate reports.                                               |
| Knowledge Lake                  | **Read** cited `lakeEventIds`. Does not admit or edit facts.                                                              |
| Strategy Library                | **Read** `getByLibraryEntryId` when a report already cites a library id. Does not certify or edit.                        |
| Qualification / Profile / State | **Cite** when Lake facts already name those owners. No classification.                                                    |
| Deployment / Session            | **Cite** existing ids on the ReportRun / fact. Read-only. Never start or trade.                                           |
| Notification                    | **Not used.** No `deliver()`.                                                                                             |
| Ledger / Fills / Orders         | **Not used as SoT.** Narratives remain `authorityClass: narrative`, `sourceOfTruth: false`, `forcesTrade: false`.         |
| Runtime Enforcement             | **Not used.**                                                                                                             |

AI never owns facts, reports, knowledge, strategies, market state, orders, risk, or execution.

Ownership chain shown to the operator: Source of Truth → Projection → Narrative. AI never mutates the source (`mutatesSource: false`).

---

**End of Authority Consumption.**
