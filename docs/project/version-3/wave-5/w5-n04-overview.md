# Push Overview

**Document:** W5-N04 Push Overview
**Date:** 2026-08-29
**Status:** Product-facing record. W5-N04 Planning **OPEN**. Awaiting Planning Review. Not implementation. No Push. No Web Push. No FCM/APNs. No outbound notifications.
**Product:** Wave 5 — Notification Platform · Package W5-N04 (V3-N04 · CM-16)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w5-n04-implementation-package.md`](./w5-n04-implementation-package.md)
**Scope:** [`w5-n04-product-scope.md`](./w5-n04-product-scope.md)
**Wave progress:** [`wave-5-progress.md`](./wave-5-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 5 makes notification delivery **real**. W5-N04 is the fourth and final Wave 5 package. It will deliver **vault-backed browser/device push notifications** on the existing catalog and routing product — so operators can receive trading attention alerts on mobile or browser through a production transport, not a reserved placeholder.

```text
Real delivery means the push provider accepted a verifiable test notification.
Real delivery does NOT mean Live Trading enabled.
Real delivery does NOT mean orders are sent to live capital.
Push is delivery-only — never a control plane.
W5-N04 extends the existing Notification Delivery adapters only.
It does NOT invent a second notification engine.
W5-N01 Telegram, W5-N02 Email, and W5-N03 Slack/Discord/Teams foundations are consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Notifications and select **Push** when the channel is shipped.
2. Register a browser or device for push attention alerts (workspace-scoped).
3. Connect vaulted VAPID/FCM credentials for notification delivery.
4. Send a **verifiable test push** through the production transport.
5. See honest **Connected**, **Error**, or **Disconnected** from real provider round-trip.
6. Receive notification alerts on registered devices when routing delivers to the active transport.
7. Stay inside their workspace and authorization.

**Not available today** — Push channel is **reserved-inactive** in PC-07. UI lists push fields as “Not offered”. No production Web Push/FCM transport exists. No device token registry exists. W5-N04 Planning is **OPEN** only — no implementation in this act.

---

## What the operator cannot do (still)

- Receive notification alerts via push through production Web Push/FCM (not implemented).
- Assume W5-N01, W5-N02, or W5-N03 Close enables push delivery (those foundations cover other channels only).
- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Use push notifications as a trading control plane.

---

## Honest Product rules (binding)

| Label            | Meaning                                               |
| ---------------- | ----------------------------------------------------- |
| **Connected**    | Real push connect succeeded with vault credentials    |
| **Delivering**   | Real push send round-trip succeeded                   |
| **Error**        | Push provider failure visible — not silent success    |
| **Reserved**     | Channel not yet shipped — honest “Not offered”        |
| **Disconnected** | Transport disconnected or device registration revoked |

Never show **Connected** or **Delivering** without a real push provider round-trip.

---

## Customer journey (planning intent)

```text
Sign in
  → Open Notifications
  → Select Push
  → Register browser/device (workspace-scoped)
  → Connect VAPID/FCM credentials (vault-backed)
  → Test send — receive verifiable push on device
  → Alerts route to active transport when channel active and routing enabled
  → Push errors shown honestly
```

---

## Relationship to W5-N01, W5-N02, and W5-N03

W5-N01 Production Telegram Bot API is **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W5-N02 Email SMTP is **CLOSED** (same foundation pattern for Email). W5-N03 Slack / Discord / Teams is **CLOSED** (same foundation pattern for team chat webhooks). W5-N04 delivers the **Push** product per Master Plan V3-N04 · CM-16. It does not reopen W5-N01, W5-N02, or W5-N03.

Foundation patterns from W5-N01-b/c/d through W5-N03-b/c/d are **consumed** for Push notification anchors — not redesigned.

---

## Package sequence

| Package | Name                        | Status                                   |
| ------- | --------------------------- | ---------------------------------------- |
| W5-N01  | Production Telegram Bot API | **CLOSED** by Product Owner (2026-08-28) |
| W5-N02  | Email (SMTP)                | **CLOSED** by Product Owner (2026-08-28) |
| W5-N03  | Slack / Discord / Teams     | **CLOSED** by Product Owner (2026-08-29) |
| W5-N04  | Push                        | Planning **OPEN** — Awaiting Review      |

Order is binding: **N01 → N02 → N03 → N04**.

---

## Implementation slices (planning only — not opened)

| Slice    | Name                                                  |
| -------- | ----------------------------------------------------- |
| W5-N04-a | Push Notification Inventory & Honest Product Baseline |
| W5-N04-b | Durable Push Notification Foundation                  |
| W5-N04-c | Push Restart Recovery Foundation                      |
| W5-N04-d | Push Operational Continuity Foundation                |
| W5-N04-e | Package Close Evidence                                |

---

## Explicit non-declarations

- Push implemented — **not declared**
- Push notifications operational — **not declared**
- Web Push / FCM / APNs operational — **not declared**
- Notification Platform Complete — **not declared**
- Wave 5 COMPLETE — **not declared**
- Production Ready — **not declared**
- Live Notifications — **not declared**
- W5-N04 Planning APPROVED — **not declared**
- W5-N04 Planning Review completed — **not declared**

---

**STOP.** W5-N04 Planning Package is **OPEN**. Await explicit Product Owner instruction before W5-N04 Planning Review. Do not perform Planning Review. Do not perform Planning Approval. Do not create W5-N04-a. Do not begin implementation.
