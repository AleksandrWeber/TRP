# PC-07 Telegram Product — Telegram UX Audit

**Package:** PC-07  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Telegram is a real customer product over existing connect / verify / test / disconnect

This is not a visual redesign audit. The question is: **can the operator connect Telegram, complete bind, verify, send a test, disconnect, and inspect Telegram deliveries — without implying Bot API, a chat-id form, reserved-channel activation, or live capital?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                  | Answer                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Telegram nav             | **Yes** — opens `/notifications/channels/telegram` over `GET /v1/telegram/connection` |
| Connect                  | **Yes** — existing `connectTelegram` → pending + deep link                            |
| Complete bind            | **Yes** — adapter-supplied chat id; no form field                                     |
| Pending state            | **Yes** — deep link shown; complete / verify / disconnect                             |
| Verify                   | **Yes** — existing `verifyTelegramConnection`                                         |
| Connected state          | **Yes** — status, test, disconnect                                                    |
| Send test                | **Yes** — existing `sendTestNotification`                                             |
| Disconnect               | **Yes** — existing `disconnectTelegram`                                               |
| History                  | **Yes** — existing Telegram deliveries                                                |
| Diagnostics              | **Yes** — transport, last delivery, adapter reached                                   |
| Empty / loading / errors | **Yes**                                                                               |
| Chat id input            | **Absent**                                                                            |
| Bot API / Email / Slack  | **Absent**                                                                            |

---

## Policy rules

| Rule                                      | Result   | Evidence                                           |
| ----------------------------------------- | -------- | -------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No Bot API, no Email/Slack, no production network  |
| Never expose disabled production buttons  | **PASS** | Connect / test / disconnect run existing ports     |
| Never expose “Coming Soon”                | **PASS** | Telegram UI contains none                          |
| Never expose placeholder pages            | **PASS** | Settings / history call real REST                  |
| Hide unfinished functionality             | **PASS** | Reserved live transports stay out of Telegram page |
| Navigation represents actual capabilities | **PASS** | Telegram channel is operable today                 |
| Research-only tools clearly identified    | **PASS** | Copy states channel only, not a control plane      |
| Never imply Live Trading                  | **PASS** | Explicit: cannot trade, pause, or kill             |

---

## Required UX surfaces

| Surface             | Status                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Telegram Settings   | Present at `/notifications/channels/telegram`                         |
| Connection Wizard   | Present (not-connected → pending → connected)                         |
| Connection Status   | Present                                                               |
| Verification status | Present                                                               |
| Test Notification   | Present when connected                                                |
| Disconnect          | Present when pending or connected                                     |
| History             | Present at `/notifications/channels/telegram/history` and on settings |
| Diagnostics         | Present on settings                                                   |
| Empty state         | Present                                                               |
| Loading             | Present                                                               |
| Errors              | Present                                                               |

---

## What was not redesigned

- Notification Delivery routing / skip catalog
- In-memory Telegram adapter
- Notification product (PC-06) except an additive link
- Command Center toasts
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Telegram UX Audit.**
