# PC-06 Notification Product — Architecture Impact

**Package:** PC-06  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Notification Delivery remains delivery owner. Reporting remains report owner. Telegram remains transport only. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after PC-06  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                          | Owner before                    | Owner after             |
| ------------------------------------------------ | ------------------------------- | ----------------------- |
| Preferences / routing / quiet hours / deliveries | Notification Delivery           | Notification Delivery   |
| ReportRun                                        | Reporting                       | Reporting               |
| Telegram channel adapter                         | Notification Delivery transport | Unchanged (in-memory)   |
| Telegram connect / test                          | Port methods exist              | **Not exposed** (PC-07) |
| Reserved channels                                | reserved-inactive               | Unchanged               |

HTTP is transport. UI is not SoT. The product adapter does not call `deliver()`, connect Telegram, send tests, or become ledger SoT.

---

## Ports

| Port                      | Before                            | After                                   |
| ------------------------- | --------------------------------- | --------------------------------------- |
| `NotificationServicePort` | Active in-process (`rest: false`) | **Active** — same queries/upsert + HTTP |
| `listDeliveries`          | In-process via PC-15              | **Consumed** on history/detail          |
| `upsertPreferences`       | In-process                        | **Exposed** as PUT                      |
| Telegram connect / test   | In-process                        | **Unchanged** — not this adapter        |
| `deliver()`               | In-process via PC-15 15-d         | **Unchanged** — not this adapter        |
| Persistence               | Process-local Notification store  | Unchanged (`persistence: false`)        |

Timezone is applied by existing `extractLocalTimeHHmm` when evaluating quiet hours. That is a thin preference clock, not a scheduler domain.

---

## What was not changed

- Delivery routing math except timezone application on the existing clock
- Report generation
- Telegram Bot API / production adapter
- Email / Slack / Discord / Teams / Push
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `NOTIFICATION_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
