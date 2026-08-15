# PC-08 Qualification Product — Authority Consumption

**Package:** PC-08  
**Date:** 2026-08-15

| Authority                           | How PC-08 uses it                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Market Qualification                | **Owner** of target, run, lifecycle, confidence, and health. REST/UI expose existing methods. |
| Market Profile                      | **Not used as owner.** `latestProfileId` is displayed as a ref. Publish remains PC-15 15-b.   |
| Market State                        | **Not used.** Unchanged.                                                                      |
| Exchange Scope                      | Cluster picker on request uses existing Cluster list. Qualification does not own isolation.   |
| Risk / Orders / Execution / Session | **Not used.** `forcesTrade` / `authorizesSession` remain false.                               |

`authorityClass` on Qualification views remains `research_artifact`. `scoresMarket` and `calculatesConfidence` are always `false`.

---

**End of Authority Consumption.**
