# Slack / Discord / Teams Overview

**Document:** W5-N03 Slack / Discord / Teams Overview
**Date:** 2026-08-29
**Status:** Product-facing record. W5-N03 Planning **OPEN**. Awaiting Planning Review. Not implementation. No Slack. No Discord. No Microsoft Teams. No outbound notifications.
**Product:** Wave 5 — Notification Platform · Package W5-N03 (V3-N03 · CM-13, CM-14, CM-15)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w5-n03-implementation-package.md`](./w5-n03-implementation-package.md)
**Scope:** [`w5-n03-product-scope.md`](./w5-n03-product-scope.md)
**Wave progress:** [`wave-5-progress.md`](./wave-5-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 5 makes notification delivery **real**. W5-N03 is the third Wave 5 package. It will deliver **vault-backed Slack, Discord, and Microsoft Teams notifications** on the existing catalog and routing product — so operators can receive trading alerts in team chat through a production transport, not a reserved placeholder.

```text
Real delivery means the webhook sent a verifiable test message.
Real delivery does NOT mean Live Trading enabled.
Real delivery does NOT mean orders are sent to live capital.
Team chat channels are delivery-only — never a control plane.
W5-N03 extends the existing Notification Delivery adapters only.
It does NOT invent a second notification engine.
W5-N01 Telegram and W5-N02 Email foundations are consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Notifications and select **Slack**, **Discord**, or **Microsoft Teams** when the channel is shipped.
2. Connect vaulted webhook credentials for notification alerts.
3. Send a **verifiable test message** through the production transport.
4. See honest **Connected**, **Error**, or **Disconnected** from real webhook round-trip.
5. Receive notification alerts in team chat when routing delivers to the active transport.
6. Stay inside their workspace and authorization.

**Not available today** — Slack, Discord, and Microsoft Teams channels are **reserved-inactive** in PC-07. UI lists webhook fields as “Not offered”. No production webhook notification transport exists. W5-N03 Planning is **OPEN** only — no implementation in this act.

---

## What the operator cannot do (still)

- Receive notification alerts in Slack, Discord, or Microsoft Teams through production webhooks (not implemented).
- Assume W5-N01 or W5-N02 Close enables team chat delivery (Telegram and Email foundations only).
- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Use team chat channels as a trading control plane.

---

## Honest Product rules (binding)

| Label            | Meaning                                               |
| ---------------- | ----------------------------------------------------- |
| **Connected**    | Real webhook connect succeeded with vault credentials |
| **Delivering**   | Real webhook send round-trip succeeded                |
| **Error**        | Webhook failure visible — not silent success          |
| **Reserved**     | Channel not yet shipped — honest “Not offered”        |
| **Disconnected** | Transport disconnected                                |

Never show **Connected** or **Delivering** without a real webhook round-trip.

---

## Customer journey (planning intent)

```text
Sign in
  → Open Notifications
  → Select Slack, Discord, or Microsoft Teams
  → Connect webhook credentials (vault-backed)
  → Test send — receive verifiable message in team chat
  → Alerts route to active transport when channel active and routing enabled
  → Webhook errors shown honestly
```

---

## Relationship to W5-N01 and W5-N02

W5-N01 Production Telegram Bot API is **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W5-N02 Email SMTP is **CLOSED** (same foundation pattern for Email). W5-N03 delivers the **Slack / Discord / Teams** product per Master Plan V3-N03 · CM-13, CM-14, CM-15. It does not reopen W5-N01 or W5-N02.

Foundation patterns from W5-N01-b/c/d and W5-N02-b/c/d are **consumed** for Slack / Discord / Teams notification anchors — not redesigned.

---

## Package sequence

| Package | Name                        | Status                                   |
| ------- | --------------------------- | ---------------------------------------- |
| W5-N01  | Production Telegram Bot API | **CLOSED** by Product Owner (2026-08-28) |
| W5-N02  | Email (SMTP)                | **CLOSED** by Product Owner (2026-08-28) |
| W5-N03  | Slack / Discord / Teams     | Planning **OPEN** — Awaiting Review      |
| W5-N04  | Push                        | Not authorized                           |

Order is binding: **N01 → N02 → N03 → N04**.

---

## Implementation slices (planning only — not opened)

| Slice    | Name                                                                     |
| -------- | ------------------------------------------------------------------------ |
| W5-N03-a | Slack / Discord / Teams Notification Inventory & Honest Product Baseline |
| W5-N03-b | Durable Slack / Discord / Teams Notification Foundation                  |
| W5-N03-c | Slack / Discord / Teams Restart Recovery Foundation                      |
| W5-N03-d | Slack / Discord / Teams Operational Continuity Foundation                |
| W5-N03-e | Package Close Evidence                                                   |

---

## Explicit non-declarations

- Slack implemented — **not declared**
- Discord implemented — **not declared**
- Microsoft Teams implemented — **not declared**
- Notification Platform Complete — **not declared**
- Wave 5 COMPLETE — **not declared**
- Production Ready — **not declared**
- Live Notifications — **not declared**
- W5-N03 Planning APPROVED — **not declared**

---

**STOP.** W5-N03 Planning Package is **OPEN**. Await explicit Product Owner instruction before W5-N03 Planning Review. Do not perform Planning Review. Do not perform Planning Approval. Do not create W5-N03-a. Do not begin implementation.
