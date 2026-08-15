# PC-15 Slice 15-e — External Boundary

**Package:** PC-15 slice 15-e  
**Date:** 2026-08-15  
**Verdict:** The only external channel on this path is the **in-memory Telegram adapter**. There is no Telegram Bot API, no outbound HTTP to Telegram, and no deferred-channel network.

---

## Active transport

| Boundary                         | Status                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `InMemoryTelegramAdapter.send()` | In-process only. Records outbound messages in memory.                                             |
| Chat id                          | Supplied by existing `completeTelegramConnect` (platform/adapter). Never a user-typed form field. |
| Trading commands                 | Forbidden. Adapter is delivery transport only.                                                    |

---

## Not crossed

| Boundary                                     | Status                                  |
| -------------------------------------------- | --------------------------------------- |
| `api.telegram.org` / Bot API                 | **Not implemented**                     |
| Email provider                               | **Not activated** (`reserved-inactive`) |
| Slack / Discord / Teams / Push               | **Not activated** (`reserved-inactive`) |
| Control plane (pause / stop / kill / orders) | **Not this channel**                    |
| Scheduler / retry queue                      | **Not introduced**                      |

---

## Documented skip at the boundary

When a reserved channel appears in routing, Notification Delivery records `skipped` / `channel-reserved`. That is the external boundary for deferred channels in Version 2 paper-first product.

PC-07 may later place a production Telegram adapter **behind the existing channel port**. This slice does not do that.

---

**End of External Boundary.**
