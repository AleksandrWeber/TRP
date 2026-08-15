# PC-07 Notification Channels Product — Authority Consumption

**Package:** PC-07  
**Date:** 2026-08-15

| Authority                         | How PC-07 uses it                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification Delivery             | **Owner** of catalog, routing, preferences, quiet hours, Telegram connection, test send, and recorded deliveries. REST/UI expose existing methods. |
| Telegram adapter                  | **Transport only.** In-memory send. Chat id adapter-supplied.                                                                                      |
| Reserved channel adapters         | **Transports only, inactive.** Visible as reserved. Not activated.                                                                                 |
| Reporting                         | **Not used as owner.**                                                                                                                             |
| AI Analytics                      | **Narrative only. Not used as owner.**                                                                                                             |
| Dashboard                         | **Unchanged projection.**                                                                                                                          |
| Trading Session / Orders / Ledger | **Not used.**                                                                                                                                      |
| Runtime Enforcement               | **Not used.**                                                                                                                                      |

`authorityClass` on channel views remains `notification-projection`. `controlPlane` is always `false`. `botApiUsed` is always `false`. `liveTransportActivated` is always `false`. `deferredChannelsActivated` is always `false`. `scheduler` is always `false`.

---

**End of Authority Consumption.**
