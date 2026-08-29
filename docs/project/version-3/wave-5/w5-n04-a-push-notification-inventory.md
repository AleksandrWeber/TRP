# W5-N04-a Push Notification Inventory & Honest Product Baseline

**Slice:** W5-N04-a — Push Notification Inventory & Honest Product Baseline  
**Package:** W5-N04 Push (V3-N04 · CM-16)  
**Wave:** 5 — Notification Platform  
**Date:** 2026-08-29  
**Nature:** Discovery and classification only. Not Push implementation. Not Web Push implementation. Not FCM implementation. Not browser delivery. Not device token persistence.  
**Machine inventory:** `apps/api/src/platform-conformance/w5-n04-a-push-notification-inventory.ts`  
**Conformance:** `apps/api/src/platform-conformance/w5-n04-a-push-notification.ts`

```text
This inventory does NOT implement Push delivery.
This inventory does NOT implement Web Push or FCM.
This inventory does NOT persist device tokens.
This inventory does NOT wire Vault VAPID/FCM credentials into delivery.
This inventory does NOT declare Push implemented.
This inventory does NOT declare W5-N04 COMPLETE or Wave 5 COMPLETE.
Customer-visible push real delivery remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Push notification artifact required to implement W5-N04: transport surfaces, delivery pipeline, PC-06 routing, PC-07 reserved channel UX, device token registry (planned), browser registration, Web Push / FCM endpoints, persistence, vault credential gaps, workspace isolation, user preferences, durable queue, Platform Readiness dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Notification Delivery / Vault / Connection / Queue owners. |
| **EPHEMERAL** | Transient, stub, reserved-inactive transport, UI-only, process-local, or missing — must not be treated as production Push truth.      |

---

## Binding finding

**Production Push notifications are NOT implemented. Push does NOT function after this slice.**

- Push channel is **reserved-inactive** — `channelStatus('push')` returns `reserved-inactive`; `deliver()` records `channel-reserved` skip.
- PC-07 / notification channels UI shows Push as **reserved** — Device/Browser disclosure-only fields; not collected.
- Vault has **no** VAPID/FCM/Push secret types — only Telegram, SMTP, exchange keys, OpenRouter today.
- **No** device token registry, browser registration, Web Push adapter, or FCM adapter exists.
- PC-06 routing and user preferences are **implemented** — they decide routes/skips but do not send via production push transport.
- W3-O02 durable notification queue exists on `notification-delivery` owner — delivery work can survive restart; push transport is still reserved-inactive.
- W5-N01, W5-N02, and W5-N03 foundations are **reference only** — consumed not reopened.
- Exchange Adapter / Wave 4 exchange I/O is **reference only** — untouched by this inventory.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented today**   | None — no customer-visible production Push notification functionality.                                                                                                                                              |
| **Infrastructure only** | Reserved-inactive push adapter path, sync delivery pipeline with skip path, PC-06 routing, PC-07 reserved channel UX, preferences, durable history/queue on existing owner, PC-07 channel matrix disclosure fields. |
| **Planned**             | W5-N04-b — Durable push notification anchors + device token registry + production push connect / test / disconnect.                                                                                                 |
| **Not implemented**     | Web Push / FCM round-trip, vault VAPID/FCM secret types, browser registration, device token store, push connect product, durable anchors, honest Connected/Delivering from push round-trip.                         |
| **Future roadmap**      | W5-N04-c…e, Wave 6 Live Trading.                                                                                                                                                                                    |

---

## Required ownership inventory (summary)

| Artifact ID                             | Owner                 | Class     | Role                                               |
| --------------------------------------- | --------------------- | --------- | -------------------------------------------------- |
| `own-push-transport`                    | notification-delivery | SURVIVE   | Push transport owner (reserved-inactive today)     |
| `own-secret-vault-push`                 | secret-vault          | SURVIVE   | Vault substrate — VAPID/FCM types absent           |
| `own-connection-management-push`        | connection-management | SURVIVE   | Connect product facade — not consumed for Push yet |
| `own-notification-delivery-domain`      | notification-delivery | SURVIVE   | Delivery domain owner — extend adapters only       |
| `own-delivery-pipeline`                 | notification-delivery | SURVIVE   | Sync deliver() pipeline — no push round-trip       |
| `own-notification-persistence`          | notification-delivery | SURVIVE   | DurableNotificationStore history + queue snapshot  |
| `own-workspace-isolation-notifications` | workspace-isolation   | SURVIVE   | A↛B notification credentials and delivery state    |
| `own-user-notification-preferences`     | notification-delivery | SURVIVE   | Master enable, routing, schedule inputs            |
| `own-device-token-registry`             | notification-delivery | EPHEMERAL | Planned — no registry today                        |
| `own-notification-durable-queue`        | notification-delivery | SURVIVE   | W3-O02 queue on existing owner                     |
| `own-honest-product-boundaries`         | wave-5-documentation  | EPHEMERAL | Frozen honesty rules for W5-N04                    |

Full row detail: `W5_N04_A_PUSH_NOTIFICATION_INVENTORY` and helpers `rowsSurvive()`, `rowsEphemeral()`, `rowsPushNotificationSurvive()`, `rowsPushNotificationEphemeral()`.

---

## Push artifact coverage (summary)

| Surface                   | Binding                | Credentials                        | Routing                 | Endpoints                        | Delivery metadata          |
| ------------------------- | ---------------------- | ---------------------------------- | ----------------------- | -------------------------------- | -------------------------- |
| **Device/Browser**        | Disclosure (EPHEMERAL) | VAPID/FCM vault absent (EPHEMERAL) | Routing prefs (SURVIVE) | Web Push/FCM missing (EPHEMERAL) | Attempt metadata (SURVIVE) |
| **Device token registry** | Missing (EPHEMERAL)    | N/A                                | N/A                     | N/A                              | N/A                        |
| **Browser registration**  | Missing (EPHEMERAL)    | N/A                                | N/A                     | No PushManager capture           | N/A                        |

---

## Push notification SURVIVE artifacts (summary)

Notification Delivery ownership, PC-06 routing substrate, durable notification store, delivery queue, user preferences, delivery metadata, workspace isolation consumption, channel catalog/boundary flags, and verified ownership rows on existing owners.

See `rowsPushNotificationSurvive()` for the full machine-readable list.

---

## W5-N04-b durability update (post-slice b)

| Artifact ID                        | Before (W5-N04-a) | After (W5-N04-b)                                                                                 |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `persist-push-notification-anchor` | EPHEMERAL         | **SURVIVE** — `workspace_push_notification_anchors`; canonical anchors only; no Web Push/FCM I/O |

**Binding finding (unchanged):** Production Push notifications are **NOT implemented**. Anchor rows survive in storage, but **restart recovery is not claimed** until W5-N04-c.

---

## Push notification EPHEMERAL artifacts (summary)

Reserved-inactive push transport path, missing Web Push/FCM transports, missing vault VAPID/FCM types, missing device token registry, missing browser registration, missing connect product, UI-only reserved channel views, and honesty blockers.

See `rowsPushNotificationEphemeral()` for the full machine-readable list.

---

## Explicit non-claims

- Push implemented — **not claimed**
- Web Push implemented — **not claimed**
- FCM implemented — **not claimed**
- Browser notifications operational — **not claimed**
- Device token registry implemented — **not claimed**
- W5-N04 COMPLETE — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Notification Platform Complete — **not claimed**
