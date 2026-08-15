# PC-09 Market Profile Product — Authority Consumption

**Package:** PC-09  
**Date:** 2026-08-15

| Authority                           | How PC-09 uses it                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Market Profile                      | **Owner** of versions, latest, history, dimensions, and metadata. REST/UI expose existing query methods.  |
| Market Qualification                | **Not used as owner.** `qualificationRunId` is displayed as published source. Publish remains PC-15 15-b. |
| Market State                        | **Not used.** Unchanged.                                                                                  |
| Exchange Scope                      | Cluster id is displayed from the profile row. Profile does not own isolation.                             |
| Risk / Orders / Execution / Session | **Not used.** `forcesTrade` / `authorizesSession` remain false.                                           |

`authorityClass` on Profile views remains `research_artifact`. `calculatesProfile` and `scoresMarket` are always `false`.

---

**End of Authority Consumption.**
