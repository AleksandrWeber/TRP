# PC-05 Reporting Product — Authority Consumption

**Package:** PC-05  
**Date:** 2026-08-15

| Authority               | How PC-05 uses it                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Reporting               | **Owner** of report projections. REST/UI expose existing queries.                     |
| AI Analytics            | **Read** attached narrative. Does not generate a new narrative owner. Does not trade. |
| Notification Delivery   | **Read** recorded deliveries. Does not send, retry, or route.                         |
| Dashboard               | **Unchanged projection.** Not consumed as a report owner.                             |
| Trading Session         | **Cite** `tradingSessionId` when present. Session remains lifecycle SoT.              |
| Strategy Library        | **Cite** optional `libraryEntryId`. Does not certify.                                 |
| Ledger / Fills / Orders | **Not used.** Money-adjacent slices stay labeled projections.                         |
| Runtime Enforcement     | **Not used.**                                                                         |

`authorityClass` on report views remains `projection`. `ledgerSoT` is always `false`. Narrative views remain `authorityClass: narrative`. Delivery views remain `notification-projection`.

---

**End of Authority Consumption.**
