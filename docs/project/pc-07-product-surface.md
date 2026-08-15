# PC-07 Notification Channels Product — Product Surface

**Package:** PC-07  
**Date:** 2026-08-15

Notification Channels is now a customer product over existing Notification Delivery. Telegram is the active channel. Reserved channels are visible as reserved.

| Surface                               | Location                                                        |
| ------------------------------------- | --------------------------------------------------------------- |
| Notification Channels                 | `/notifications/channels`                                       |
| Channel cards                         | `/notifications/channels`                                       |
| Routing matrix                        | `/notifications/channels`                                       |
| Delivery frequency / preference clock | `/notifications/channels`                                       |
| Quiet hours (global)                  | `/notifications/channels`                                       |
| Telegram configuration                | `/notifications/channels/telegram` + `/v1/telegram/*`           |
| Reserved channel disclosure           | `/notifications/channels/{email,slack,discord,teams,push}`      |
| Channel diagnostics                   | Channel pages + `GET /v1/notification-channels/:id/diagnostics` |
| Channel history                       | `/notifications/channels/:id/history`                           |
| Nav                                   | Administration → Channels                                       |
| Home                                  | Channels tile                                                   |
| Legacy Telegram URLs                  | Redirect into the Telegram channel page                         |

Notification Settings remain preference owner (PC-06). This surface is the channel product. It does not own deliveries, reports, or trading.

See [Channel Matrix](./pc-07-channel-matrix.md), [Routing Matrix](./pc-07-routing-matrix.md), [Delivery Matrix](./pc-07-delivery-matrix.md).

---

**End of Product Surface.**
