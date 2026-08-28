# Wave 5 — Notification Platform Overview

**Document:** Wave 5 Notification Platform Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W5-N01 foundation slices a–e **COMPLETE** (local). Close Evidence assembled. Production Telegram Bot API **not implemented**.
**Product:** Wave 5 — Notification Platform
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`wave-5-implementation-package.md`](./wave-5-implementation-package.md)
**Scope:** [`wave-5-product-scope.md`](./wave-5-product-scope.md)
**Wave progress:** [`wave-5-progress.md`](./wave-5-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 5 makes notification delivery **real**. Operators receive alerts outside the process through production transports — Telegram Bot API, Email, team chat webhooks, and push — on the existing notification catalog and routing product.

```text
Real delivery means the transport sent a verifiable message.
Real delivery does NOT mean Live Trading enabled.
Telegram is for alerts only — it cannot start, stop, or approve trades.
Wave 5 extends Notification Delivery adapters only.
It does NOT invent a second notification engine.
```

---

## What the operator will be able to do (after Wave 5 implementation)

1. Connect **Telegram** with a bot token saved in the Vault.
2. Bind a real chat and receive a **test message** via Bot API.
3. Connect **Email** (SMTP) and shipped Slack/Discord/Teams/Push channels the same way — or see honestly reserved channels.
4. **Test** each shipped channel and see success or a vendor-visible failure.
5. **Disconnect** without SSH or editing `.env`.
6. Receive routed alerts from the platform through active transports.

**Not available today** — W5-N01 foundation (inventory, durable anchors, restart recovery, operational continuity, Close Evidence) is complete locally. Transport remains in-memory; Bot API is not used. Real Telegram delivery awaits post-foundation product slices.

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Use Telegram to start, stop, or approve trades (forbidden forever).
- Assume all reserved channels are shipped — unshipped ones stay honestly reserved.
- Use notifications as a substitute for the Gate or Risk Engine.

---

## Wave packages (Master Plan order)

| Package | Name                        | What it delivers                         |
| ------- | --------------------------- | ---------------------------------------- |
| W5-N01  | Production Telegram Bot API | Real Bot API connect / test / disconnect |
| W5-N02  | Email (SMTP)                | Real SMTP transport                      |
| W5-N03  | Slack / Discord / Teams     | Real webhook transports                  |
| W5-N04  | Push                        | Real browser/device push                 |

Order: **N01 → N02 → N03 → N04**.

---

## Honest Product rules (binding)

| Label          | Meaning                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Connected**  | Real transport round-trip succeeded                                   |
| **Delivering** | Message sent through production transport                             |
| **Error**      | Provider or network failure; message is vendor-visible where possible |
| **Expired**    | Credentials no longer valid per provider                              |
| **Reserved**   | Channel not yet shipped — honest label only                           |

Never show **Connected** or **Delivering** without a real transport round-trip.

Never allow Telegram to control trading.

---

## Customer journey (Telegram — W5-N01 planning)

```text
Sign in
  → Open Connections / Notifications
  → Select Telegram
  → Bot token from Vault (saved in Wave 2)
  → Bind chat
  → Test connection
  → Real message in chat OR honest failure
  → Disconnect when done
  → Alerts route through PC-06 to active Telegram transport
```

---

## Dependencies (already closed)

| Wave / product               | What Wave 5 builds on                          |
| ---------------------------- | ---------------------------------------------- |
| Wave 1 Vault                 | Bot tokens and webhook secrets stored securely |
| Wave 2 Connection Management | Operator connect / test / disconnect UI        |
| Wave 3 Durable Queue         | Delivery survives restart                      |
| PC-06 routing                | Events route to active transport               |
| PC-07 catalog                | Channel entries and status                     |

---

## Explicit non-claims

- Wave 5 COMPLETE — **not claimed**
- Telegram real delivery — **not claimed** (planning only)
- Email / Slack / Discord / Teams / Push shipped — **not claimed**
- Live Trading — **not claimed**
- Planning Review PASS — **not claimed**

---

**STOP.** Wave 5 Planning **OPEN**. Await Product Owner Planning Review before implementation.
