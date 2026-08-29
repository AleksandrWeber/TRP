# W5-N03-a Slack / Discord / Teams Notification Inventory & Honest Product Baseline

**Slice:** W5-N03-a — Slack / Discord / Teams Notification Inventory & Honest Product Baseline  
**Package:** W5-N03 Slack / Discord / Teams (V3-N03 · CM-13, CM-14, CM-15)  
**Wave:** 5 — Notification Platform  
**Date:** 2026-08-29  
**Nature:** Discovery and classification only. Not webhook implementation. Not outbound production notifications. Not runtime delivery to Slack / Discord / Microsoft Teams APIs.  
**Machine inventory:** `apps/api/src/platform-conformance/w5-n03-a-slack-discord-teams-notification-inventory.ts`  
**Conformance:** `apps/api/src/platform-conformance/w5-n03-a-slack-discord-teams-notification.ts`

```text
This inventory does NOT implement production webhooks.
This inventory does NOT send outbound Slack / Discord / Teams notifications.
This inventory does NOT wire Vault webhook credentials into delivery.
This inventory does NOT declare Slack / Discord / Microsoft Teams implemented.
This inventory does NOT declare W5-N03 COMPLETE or Wave 5 COMPLETE.
Customer-visible webhook real delivery remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Slack / Discord / Teams notification artifact required to implement W5-N03: webhook surfaces, delivery pipeline, PC-06 routing, PC-07 reserved channel UX, persistence, vault credential gaps, workspace isolation, user preferences, durable queue, retry metadata, Platform Readiness dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Notification Delivery / Vault / Connection / Queue owners. |
| **EPHEMERAL** | Transient, stub, reserved-inactive transport, UI-only, process-local, or missing — must not be treated as production webhook truth.   |

---

## Binding finding

**Production Slack / Discord / Teams webhooks are NOT implemented. Team chat notifications do NOT function after this slice.**

- Slack, Discord, and Microsoft Teams channels are **reserved-inactive** — `ReservedInactiveChannelAdapter` always returns `channel-reserved`.
- PC-07 / notification channels UI shows Slack / Discord / Teams as **reserved** — disclosure-only fields; not collected.
- Vault has **no** Slack / Discord / Teams webhook secret types — only Telegram, SMTP, exchange keys, OpenRouter today.
- PC-06 routing and user preferences are **implemented** — they decide routes/skips but do not send via production webhooks.
- W3-O02 durable notification queue exists on `notification-delivery` owner — delivery work can survive restart; webhook transport is still reserved-inactive.
- **No** durable Slack / Discord / Teams notification anchors yet — W5-N03-b planned (mirrors W5-N01/W5-N02 patterns).
- W5-N01 Telegram and W5-N02 Email foundations are **reference only** — consumed not reopened.
- Exchange Adapter / Wave 4 exchange I/O is **reference only** — untouched by this inventory.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Implemented today**   | None — no customer-visible production Slack / Discord / Teams notification functionality.                                                                                                                          |
| **Infrastructure only** | Reserved-inactive webhook adapters, sync delivery pipeline with skip path, PC-06 routing, PC-07 reserved channel UX, preferences, durable history/queue on existing owner, PC-07 channel matrix disclosure fields. |
| **Planned**             | W5-N03-b — Durable webhook notification anchors + production webhook connect / test / disconnect.                                                                                                                  |
| **Not implemented**     | Provider webhook round-trip, vault webhook secret types, webhook connect product, durable anchors, honest Connected/Delivering from webhook round-trip, team chat Platform Readiness projection.                   |
| **Future roadmap**      | W5-N03-c…e, W5-N04 Push, Wave 6 Live Trading.                                                                                                                                                                      |

---

## Required ownership inventory (summary)

| Artifact ID                                 | Owner                 | Class     | Role                                                       |
| ------------------------------------------- | --------------------- | --------- | ---------------------------------------------------------- |
| `own-slack-discord-teams-webhook-transport` | notification-delivery | SURVIVE   | Combined webhook transport owner (reserved-inactive today) |
| `own-secret-vault-webhook`                  | secret-vault          | SURVIVE   | Vault substrate — Slack/Discord/Teams types absent         |
| `own-connection-management-webhook`         | connection-management | SURVIVE   | Connect product facade — not consumed for webhooks yet     |
| `own-notification-delivery-domain`          | notification-delivery | SURVIVE   | Delivery domain owner — extend adapters only               |
| `own-delivery-pipeline`                     | notification-delivery | SURVIVE   | Sync deliver() pipeline — no webhook round-trip            |
| `own-notification-persistence`              | notification-delivery | SURVIVE   | DurableNotificationStore history + queue snapshot          |
| `own-workspace-isolation-notifications`     | workspace-isolation   | SURVIVE   | A↛B notification credentials and delivery state            |
| `own-user-notification-preferences`         | notification-delivery | SURVIVE   | Master enable, routing, schedule inputs                    |
| `own-notification-durable-queue`            | notification-delivery | SURVIVE   | W3-O02 queue on existing owner                             |
| `own-honest-product-boundaries`             | wave-5-documentation  | EPHEMERAL | Frozen honesty rules for W5-N03                            |

Full row detail: `W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY` and helpers `rowsSurvive()`, `rowsEphemeral()`, `rowsSlackDiscordTeamsNotificationSurvive()`, `rowsSlackDiscordTeamsNotificationEphemeral()`.

---

## Per-channel coverage (summary)

| Channel             | Binding                          | Credentials                              | Mapping                 | Endpoint                      | Delivery metadata          |
| ------------------- | -------------------------------- | ---------------------------------------- | ----------------------- | ----------------------------- | -------------------------- |
| **Slack**           | Workspace disclosure (EPHEMERAL) | Bot token vault absent (EPHEMERAL)       | Routing prefs (SURVIVE) | Transport missing (EPHEMERAL) | Attempt metadata (SURVIVE) |
| **Discord**         | Guild disclosure (EPHEMERAL)     | Bot token vault absent (EPHEMERAL)       | Routing prefs (SURVIVE) | Transport missing (EPHEMERAL) | Attempt metadata (SURVIVE) |
| **Microsoft Teams** | Tenant disclosure (EPHEMERAL)    | Bot credentials vault absent (EPHEMERAL) | Routing prefs (SURVIVE) | Transport missing (EPHEMERAL) | Attempt metadata (SURVIVE) |

---

## Slack / Discord / Teams notification SURVIVE artifacts (summary)

PC-06 routing substrate, durable notification store, delivery queue, user preferences, delivery metadata (`DeliveryResult` / `ChannelDeliveryAttempt`), workspace isolation consumption, security dependencies, and verified ownership rows on existing Notification Delivery / Connection / Vault owners.

## Slack / Discord / Teams notification EPHEMERAL artifacts (summary)

`ReservedInactiveChannelAdapter` for slack/discord/teams, missing webhook transports, missing vault webhook secret types, missing webhook anchors, missing connect/test product, and honesty blockers for fake Connected/Delivering labels.

---

## Honesty blockers (explicit)

| Blocker                               | Status                   |
| ------------------------------------- | ------------------------ |
| Missing production webhook transports | Active — TD-050 deferred |
| Missing runtime webhook delivery      | Active — skip path only  |
| Missing restart recovery              | W5-N03-c deferred        |
| Missing operational continuity        | W5-N03-d deferred        |
| Missing durable webhook anchors       | W5-N03-b deferred        |
| Missing webhook delivery execution    | W5-N03-b deferred        |

---

**STOP.** W5-N03-a inventory only. Slack / Discord / Teams notifications do **not** function. Do not declare Slack implemented. Do not declare Discord implemented. Do not declare Microsoft Teams implemented. Do not declare W5-N03 COMPLETE or Wave 5 COMPLETE.
