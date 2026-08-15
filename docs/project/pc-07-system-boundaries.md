# PC-07 Notification Channels Product — System Boundaries

**Package:** PC-07  
**Date:** 2026-08-15  
**Verdict:** Boundaries held.

---

## Notification Delivery

Notification Delivery remains the delivery owner. Channel views compose `listChannels`, `getPreferences`, `upsertPreferences`, `getTelegramConnection`, and `listDeliveries`. They do not add skip reasons, channels, storage, or a second `deliver()` owner.

The Notification Delivery bounded context still does not import Reporting, product-flow, or the product adapters. Domain `rest: false` is unchanged. HTTP lives in sibling `notification-product` and `telegram-product`.

## Channel adapters

The in-memory Telegram adapter remains transport only. Reserved adapters remain reserved. This package does not redesign them. Complete bind still supplies an in-memory platform chat id. No `api.telegram.org`. No SMTP. No Slack/Discord/Teams webhooks.

## Notification Product

PC-06 remains settings / delivery-history owner. PC-07 adds channel workspace views in the same adapter and keeps Telegram connect/test in `telegram-product`. An additive Channels nav does not move ownership.

## Reporting and AI

Reporting remains report owner. AI remains narrative only. Neither owns channels.

## Distinct surfaces

RCC `/settings` remains research prefs. Command Center `NotificationCenter` remains RC-20 in-app toasts. Channel product paths are `/v1/notification-channels/*` and `/notifications/channels`. Telegram operations remain `/v1/telegram/*`.

---

**End of System Boundaries.**
