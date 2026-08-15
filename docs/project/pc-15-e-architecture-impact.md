# PC-15 Slice 15-e — Architecture Impact

**Package:** PC-15 slice 15-e  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Notification Delivery remains delivery only. Channel adapters remain transports only. Deferred channels remain deferred. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after 15-e   |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern                                | Owner before                    | Owner after                              |
| -------------------------------------- | ------------------------------- | ---------------------------------------- |
| Notification delivery / routing        | Notification Delivery           | Unchanged                                |
| Telegram in-memory adapter             | Notification Delivery transport | Unchanged (now on the product-flow path) |
| Email / Slack / Discord / Teams / Push | reserved-inactive               | Unchanged                                |
| Complete → channel dispatch wiring     | Manual e2e compose only         | Product-flow composition (not a BC)      |
| Telegram Bot API / control plane       | Never this product              | Still never                              |

Notification still must not import Reporting or product-flow. Product-flow may import Notification. No owner imports a Bot API.

---

## Authority Consumption

| Authority             | How 15-e uses it                                                            |
| --------------------- | --------------------------------------------------------------------------- |
| Notification Delivery | **Owner** of `deliver()` / connect / complete. Adapter never routes itself. |
| Telegram adapter      | **Transport only.** In-memory `send()`.                                     |
| Reserved channels     | **Not activated.** Documented skip only.                                    |

---

## Ports

| Port                        | Before                                                   | After                                                         |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `deliver()`                 | Caller must connect Telegram separately for adapter send | **Same owner** — product-flow may bind in-memory then deliver |
| Telegram connect / complete | Existing workflow                                        | **Same owner** — chat id still platform/adapter-supplied      |
| Reserved channel ports      | Inactive                                                 | **Still inactive**                                            |

---

## What was not changed

- Notification Delivery `deliver()` internals
- Telegram Bot API (not implemented)
- Email / Slack / Discord / Teams / Push catalog status
- Spec, Authority Matrix, Alias Dictionary, RC history
- REST, UI, PC-06, PC-07

---

**End of Architecture Impact.**
