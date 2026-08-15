# PC-15 Slice 15-e — Flow Ownership

**Package:** PC-15 slice 15-e  
**Date:** 2026-08-15

This slice does not transfer ownership. It names who produces, who transports, and who remains SoT.

---

## Certified Notification → Channel flow (15-e)

| Step                    | Owner                                                                 | Role                          |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------- |
| `deliver()` / routing   | Notification Delivery                                                 | Producer                      |
| In-memory Telegram bind | Notification Delivery (`connectTelegram` / `completeTelegramConnect`) | Existing workflow             |
| Telegram `send()`       | In-memory Telegram adapter                                            | Transport only                |
| Reserved channel skip   | Notification Delivery routing                                         | Documented `channel-reserved` |
| Record DeliveryResult   | Notification Delivery                                                 | Delivery projection SoT       |
| Expose channel outcome  | Product-flow projection                                               | Not a channel owner           |

---

## Invariants

| Invariant                              | Status   |
| -------------------------------------- | -------- |
| Notification Delivery is delivery only | **Held** |
| Telegram adapter is transport only     | **Held** |
| No Telegram Bot API                    | **Held** |
| Deferred channels remain deferred      | **Held** |
| No control plane / scheduler / retries | **Held** |
| No channel ownership changes           | **Held** |
| No new SoT                             | **Held** |

---

## Not this slice

- Reporting → Notification (15-d, already Closed)
- Dashboard tiles (15-f)
- PC-06 Notification product UI
- PC-07 Telegram product UI / production Bot adapter

---

**End of Flow Ownership.**
