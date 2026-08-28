# Email SMTP Overview

**Document:** W5-N02 Email SMTP Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W5-N02 Planning **OPEN**. Awaiting Planning Review. Not implementation. No SMTP. No email sending.
**Product:** Wave 5 — Notification Platform · Package W5-N02 (V3-N02 · CM-12)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w5-n02-implementation-package.md`](./w5-n02-implementation-package.md)
**Scope:** [`w5-n02-product-scope.md`](./w5-n02-product-scope.md)
**Wave progress:** [`wave-5-progress.md`](./wave-5-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 5 makes notification delivery **real**. W5-N02 is the second Wave 5 package. It will deliver **vault-backed SMTP email notifications** on the existing catalog and routing product — so operators can receive trading alerts by email through a production transport, not a reserved placeholder.

```text
Real delivery means SMTP sent a verifiable test message.
Real delivery does NOT mean Live Trading enabled.
Real delivery does NOT mean orders are sent to live capital.
Email is delivery-only — never a control plane.
W5-N02 extends the existing Notification Delivery adapters only.
It does NOT invent a second notification engine.
Password-recovery email (Sign in → Forgot password) is NOT the Notification Email product.
W5-N01 Telegram foundation is consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Notifications and select **Email (SMTP)** when the channel is shipped.
2. Connect vaulted SMTP credentials for notification alerts.
3. Send a **verifiable test email** through the production transport.
4. See honest **Connected**, **Error**, or **Disconnected** from real SMTP round-trip.
5. Receive notification alerts by email when routing delivers to the active email transport.
6. Stay inside their workspace and authorization.

**Not available today** — Email channel is **reserved-inactive** in PC-07. UI lists SMTP fields as “Not offered”. No production SMTP notification transport exists. W5-N02 Planning is **OPEN** only — no implementation in this act.

---

## What the operator cannot do (still)

- Receive notification alerts by email through production SMTP (not implemented).
- Assume W5-N01 Close enables email delivery (Telegram foundation only).
- Use password-recovery email as proof that Notification Email works (separate Auth product).
- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Use email as a trading control plane.

---

## Honest Product rules (binding)

| Label            | Meaning                                            |
| ---------------- | -------------------------------------------------- |
| **Connected**    | Real SMTP connect succeeded with vault credentials |
| **Delivering**   | Real SMTP send round-trip succeeded                |
| **Error**        | SMTP failure visible — not silent success          |
| **Reserved**     | Channel not yet shipped — honest “Not offered”     |
| **Disconnected** | Transport disconnected                             |

Never show **Connected** or **Delivering** without a real SMTP round-trip.

Never conflate password-recovery mail with Notification Email delivery.

---

## Customer journey (planning intent)

```text
Sign in
  → Open Notifications
  → Select Email (SMTP)
  → Connect SMTP credentials (vault-backed)
  → Test send — receive verifiable email
  → Alerts route to email when channel active and routing enabled
  → SMTP errors shown honestly
```

---

## Relationship to W5-N01

W5-N01 Production Telegram Bot API is **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W5-N02 delivers the **Email SMTP** product per Master Plan V3-N02 · CM-12. It does not reopen W5-N01.

Telegram foundation patterns from W5-N01-b/c/d are **consumed** for email notification anchors — not redesigned.

---

## Relationship to Auth password-recovery mail

When you use **Forgot password**, the system may send recovery email through **host mail** — infrastructure inside Authentication (S01-e). That is **identity recovery**, not the Notification Email product. W5-N02 owns **customer notification SMTP** on the Notification Delivery adapter only. These paths must remain separate.

---

## Package sequence

| Package | Name                        | Status                                   |
| ------- | --------------------------- | ---------------------------------------- |
| W5-N01  | Production Telegram Bot API | **CLOSED** by Product Owner (2026-08-28) |
| W5-N02  | Email (SMTP)                | Planning **OPEN** — Awaiting Review      |
| W5-N03  | Slack / Discord / Teams     | Not authorized                           |
| W5-N04  | Push                        | Not authorized                           |

Order is binding: **N01 → N02 → N03 → N04**.

---

## Implementation slices (planning only — not opened)

| Slice    | Name                                                   |
| -------- | ------------------------------------------------------ |
| W5-N02-a | Email Notification Inventory & Honest Product Baseline |
| W5-N02-b | Durable Email Notification Foundation                  |
| W5-N02-c | Email Notification Restart Recovery Foundation         |
| W5-N02-d | Email Notification Operational Continuity Foundation   |
| W5-N02-e | Package Close Evidence                                 |

---

## Explicit non-declarations

- Email SMTP implemented — **not declared**
- Email notifications operational — **not declared**
- Notification Platform Complete — **not declared**
- Wave 5 COMPLETE — **not declared**
- Production Ready — **not declared**
- Live Notifications — **not declared**
- W5-N02 Planning APPROVED — **not declared**

---

**STOP.** W5-N02 Planning Package is **OPEN**. Await explicit Product Owner instruction before W5-N02 Planning Review. Do not perform Planning Review. Do not perform Planning Approval. Do not create W5-N02-a. Do not begin implementation.
