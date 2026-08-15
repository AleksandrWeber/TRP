# PC-07 Notification Channels Product — UX Audit

**Package:** PC-07  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Channels is a real customer product over existing catalog, routing, and Telegram transport. Reserved channels are visible as reserved, not as fake live transports.

This is not a visual redesign audit. The question is: **can the operator choose preferred channels, configure the offered channel, set routing and quiet hours, send a Telegram test, and inspect history/diagnostics — without implying SMTP, webhooks, digests, Bot API, or live capital?**

Telegram channel page evidence: [Telegram UX Audit](./pc-07-telegram-ux-audit.md).

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                                  | Answer                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Channels nav                             | **Yes** — `/notifications/channels` over `GET /v1/notification-channels/workspace`                                              |
| Channel cards                            | **Yes** — six catalog channels; Telegram offered; others reserved                                                               |
| Choose Telegram                          | **Yes** — enable toggle persists via existing preference upsert                                                                 |
| Configure Telegram                       | **Yes** — existing connect / verify / test / disconnect                                                                         |
| Configure Email/Slack/Discord/Teams/Push | **Disclosure only** — required fields listed, not forms, not saved                                                              |
| Routing matrix                           | **Yes** — 13 existing types; Telegram column editable; reserved columns not offered                                             |
| Delivery frequency                       | **Honest** — immediate-on-deliver + daily preference clock; hourly/weekly digest hidden as not offered copy, not fake selectors |
| Quiet hours                              | **Yes** — global only                                                                                                           |
| Send Test                                | **Telegram only** when connected; reserved Send Test **absent**                                                                 |
| History                                  | **Yes** — existing deliveries filtered by channel                                                                               |
| Diagnostics                              | **Yes** — connection/reserved state, last success/failure/skip; latency labeled not available                                   |
| Empty / loading / errors                 | **Yes**                                                                                                                         |
| SMTP / webhook inputs                    | **Absent**                                                                                                                      |
| Coming Soon                              | **Absent**                                                                                                                      |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                            |
| ----------------------------------------- | -------- | ------------------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No SMTP form, no webhook save, no digest scheduler, no Bot API      |
| Never expose disabled production buttons  | **PASS** | Reserved Send Test is hidden, not a greyed production button        |
| Never expose “Coming Soon”                | **PASS** | Channels UI contains none                                           |
| Never expose placeholder pages            | **PASS** | Workspace / detail / history call real REST                         |
| Hide unfinished functionality             | **PASS** | Live reserved transports stay out; required fields are disclosure   |
| Navigation represents actual capabilities | **PASS** | Channels is operable today (Telegram live; others reserved-visible) |
| Research-only tools clearly identified    | **PASS** | Copy states Delivery Layer / in-memory / not a control plane        |
| Never imply Live Trading                  | **PASS** | Telegram cannot trade, pause, or kill                               |

---

## Required UX surfaces

| Surface                  | Status                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Channel cards            | Present at `/notifications/channels`                                                      |
| Channel configuration    | Telegram at `/notifications/channels/telegram`; reserved at `/notifications/channels/:id` |
| Routing matrix           | Present on workspace                                                                      |
| History                  | Per channel at `/notifications/channels/:id/history`                                      |
| Diagnostics              | Telegram settings + reserved detail                                                       |
| Test delivery            | Telegram Send Test when connected                                                         |
| Connection state         | Telegram wizard + card status                                                             |
| Empty / loading / errors | Present                                                                                   |

---

## What was not redesigned

- Notification Delivery routing / skip catalog
- In-memory Telegram adapter
- Reporting / AI
- Digest scheduler (does not exist)
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Notification Channels UX Audit.**
