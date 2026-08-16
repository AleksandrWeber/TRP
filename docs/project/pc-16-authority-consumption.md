# PC-16 Knowledge Lake Product — Authority Consumption

**Package:** PC-16  
**Date:** 2026-08-16

| Authority                       | How PC-16 uses it                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Knowledge Lake                  | **Owner** of stored analytical facts. REST/UI expose existing queries.                   |
| Reporting                       | **Read** ReportRuns that cite `lakeEventIds`. Does not generate reports.                 |
| AI Analytics                    | **Cite** narrative availability on Reporting. Does not call `generateNarrative`.         |
| Strategy Library                | **Read** `getByLibraryEntryId` when a fact already cites a library id. Does not certify. |
| Research                        | **Cite** existing `sourceRef` (Experiment / Campaign / KnowledgeEntry). Not owned.       |
| Qualification / Profile / State | **Cite** when `sourceRef` already names those owners. No classification.                 |
| Ledger / Fills / Orders         | **Not used as SoT.** Facts remain `authorityClass: projection`, `ledgerSoT: false`.      |
| Runtime Enforcement             | **Not used.**                                                                            |

Ownership chain shown to the operator: Source of Truth → Projection → Knowledge Lake. Lake never mutates the source (`mutatesSource: false`).

---

**End of Authority Consumption.**
