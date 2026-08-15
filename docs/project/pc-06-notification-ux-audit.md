# PC-06 Notification Product — Notification UX Audit

**Package:** PC-06  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Notification is a real customer product over existing delivery preferences and recorded deliveries

This is not a visual redesign audit. The question is: **can the operator configure existing preferences, inspect routing and channel status, and read recorded delivery outcomes — without implying a Telegram wizard, a scheduler, reserved-channel activation, or live capital?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                                 | Answer                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| Notifications nav                       | **Yes** — opens `/notifications` over `GET /v1/notification-settings` |
| Master enable                           | **Yes** — existing `enabled` via PUT                                  |
| Per-type enable                         | **Yes** — existing `typeRouting`                                      |
| Per-channel Telegram enable             | **Yes** — existing `channels.telegram`                                |
| Reserved channels                       | **Visible as reserved, not offered**                                  |
| Quiet hours / timezone / daily delivery | **Yes** — existing schedule                                           |
| Channel status                          | **Yes** — catalog + Telegram connection status (read-only)            |
| Routing                                 | **Yes** — stored rules + current evaluation / skip reasons            |
| Delivery history                        | **Yes** — existing `listDeliveries`                                   |
| Delivery details                        | **Yes** — recorded attempts and skip reasons                          |
| Empty / loading / errors                | **Yes**                                                               |
| Telegram connect / test                 | **Absent** (PC-07)                                                    |
| Send / retry / cron                     | **Absent**                                                            |

---

## Policy rules

| Rule                                      | Result   | Evidence                                        |
| ----------------------------------------- | -------- | ----------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No connect wizard, no test send, no Email/Slack |
| Never expose disabled production buttons  | **PASS** | No send/retry/force                             |
| Never expose “Coming Soon”                | **PASS** | Notification UI contains none                   |
| Never expose placeholder pages            | **PASS** | Settings / history / detail call real REST      |
| Hide unfinished functionality             | **PASS** | PC-07 stays out of this page as a product       |
| Navigation represents actual capabilities | **PASS** | Notifications is operable today                 |
| Research-only tools clearly identified    | **PASS** | Copy states Delivery Layer, not a control plane |
| Never imply Live Trading                  | **PASS** | No trading commands                             |

---

## Required UX surfaces

| Surface               | Status                                  |
| --------------------- | --------------------------------------- |
| Notification Settings | Present at `/notifications`             |
| Delivery History      | Present at `/notifications/history`     |
| Delivery Details      | Present at `/notifications/:deliveryId` |
| Channel Status        | Present on settings                     |
| Routing               | Present on settings                     |
| Quiet Hours           | Present on settings                     |
| Timezone              | Present on settings                     |
| Daily delivery        | Present on settings                     |
| Master Enable         | Present                                 |
| Per-type enable       | Present                                 |
| Per-channel status    | Present                                 |
| Skip reasons          | Present on history and detail           |
| Empty state           | Present                                 |
| Loading               | Present                                 |
| Errors                | Present                                 |

---

## What was not redesigned

- Notification Delivery routing / skip catalog
- Reporting product (PC-05)
- Telegram connection wizard (PC-07)
- Command Center toasts
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Notification UX Audit.**
