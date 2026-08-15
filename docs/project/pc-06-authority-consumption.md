# PC-06 Notification Product — Authority Consumption

**Package:** PC-06  
**Date:** 2026-08-15

| Authority                         | How PC-06 uses it                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Notification Delivery             | **Owner** of preferences, routing, and recorded deliveries. REST/UI expose existing queries and upsert. |
| Reporting                         | **Not used as owner.** Optional `reportRunId` is a citation on a delivery record.                       |
| Telegram                          | **Transport status only.** No connect, test, or control plane.                                          |
| Dashboard                         | **Unchanged projection.**                                                                               |
| Trading Session / Orders / Ledger | **Not used.**                                                                                           |
| Runtime Enforcement               | **Not used.**                                                                                           |

`authorityClass` on notification views remains `notification-projection`. `generatesReports` is always `false`. `controlPlane` is always `false`. `deferredChannelsActivated` is always `false`.

---

**End of Authority Consumption.**
