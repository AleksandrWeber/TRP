# PC-12 Exchange Scope Product — Authority Consumption

**Package:** PC-12  
**Date:** 2026-08-15

| Authority                      | How PC-12 uses it                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Exchange Scope                 | **Owner** of isolation identity, lifecycle, config versions, policy inputs, bindings, and metadata. REST/UI expose existing methods. |
| Runtime                        | **Not used as owner.** Unchanged.                                                                                                    |
| Trading Session                | **Not used as owner.** Unchanged.                                                                                                    |
| Strategy Deployment            | **Not used as owner.** Unchanged.                                                                                                    |
| Risk Engine                    | **Not used.** Policy records remain `exchange_policy_input`.                                                                         |
| Venue adapters / exchange APIs | **Not used.** `liveVenueAdapter` and `venueApiUsed` are always false.                                                                |
| Ledger / Orders / Execution    | **Not used.** Bindings `ownsLedger` / `movesBalances` are always false.                                                              |

`authorityClass` on Cluster views remains `exchange_scope_artifact`. `isRuntime`, `isTradingSession`, `isRiskEngine`, `isExecutionEngine`, `approvesRisk`, `submitsOrders`, `liveCapital` are always `false`.

---

**End of Authority Consumption.**
