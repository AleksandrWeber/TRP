# PC-07 Notification Channels Product — Architecture Impact

**Package:** PC-07  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Notification Delivery remains delivery owner. Channel adapters remain transports only. Telegram remains the only active transport. Chat id remains adapter-supplied. No new SoT. No new authority. No Bot API. No SMTP/webhook SoT.

---

## Frozen artifacts

| Artifact                        | Status after PC-07  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                                  | Owner before                                | Owner after                                    |
| -------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Preferences / routing / quiet hours / deliveries         | Notification Delivery                       | Notification Delivery                          |
| Channel catalog                                          | Notification Delivery                       | Unchanged                                      |
| Telegram channel adapter                                 | Notification Delivery transport (in-memory) | Unchanged                                      |
| Telegram connect / complete / verify / disconnect / test | Port methods + Telegram REST                | **Unchanged** — still delegated                |
| Chat id                                                  | Adapter / platform bind                     | Unchanged (never a user field)                 |
| Reserved channels                                        | reserved-inactive                           | Unchanged (visible as reserved; not activated) |
| Reporting                                                | Report owner                                | Unchanged                                      |
| AI                                                       | Narrative only                              | Unchanged                                      |

HTTP is transport. UI is not SoT. Channel views do not redesign `deliver()`, routing, or become ledger SoT.

---

## Ports

| Port                                       | Before                           | After                                               |
| ------------------------------------------ | -------------------------------- | --------------------------------------------------- |
| `NotificationServicePort` queries / upsert | Exposed as PC-06 REST            | **Additive** channel workspace/detail/history views |
| `NotificationServicePort` Telegram methods | Exposed as `/v1/telegram/*`      | Unchanged                                           |
| Telegram adapter                           | In-memory send                   | Unchanged (no Bot API)                              |
| Persistence                                | Process-local Notification store | Unchanged (`persistence: false`)                    |

---

## What was not changed

- Notification Delivery routing / skip catalog / type set
- Telegram adapter implementation
- Report generation
- Email / Slack / Discord / Teams / Push activation
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `NOTIFICATION_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
