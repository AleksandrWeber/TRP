# Wave 5 — Notification Platform Overview

**Document:** Wave 5 Notification Platform Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W5-N01 **CLOSED** · W5-N02 **CLOSED** by Product Owner (2026-08-28). Foundation scope only — not SMTP I/O, not Connected/Delivering product labels, not Notification Platform Complete.
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

**Not available today** — W5-N01 and W5-N02 foundations are **CLOSED** (Telegram and Email anchors only). Email channel remains **reserved-inactive**; no production SMTP transport; Auth host mail is separate from Notification Email.

---

## W5-N02-e status (Email package Close Evidence)

W5-N02-e assembles complete engineering Close Evidence across slices a–d: operational chain verification, governance, architecture compliance, documentation completeness, validation completeness, and Honest Product enforcement. Final Integration Verification **PASS**. Package **CLOSED** by Product Owner (2026-08-28).

```text
Email channel = reserved-inactive today.
Complete foundation journey evidenced and CLOSED.
SMTP transport and outbound delivery not claimed.
Auth password-recovery mail ≠ Notification Email product.
Connected/Delivering require real SMTP round-trip — not claimed.
```

---

## W5-N02-d status (Email operational continuity foundation)

W5-N02-d projects derived Email Notification operational readiness (Recovering / Ready / Degraded / Unavailable) into Platform Operational Readiness from W5-N02-c recovery state. **No outbound Email delivery** was added.

```text
Email channel = reserved-inactive today.
Operational readiness derived from recovered anchors + integrity verification.
SMTP transport and outbound delivery not claimed.
Auth password-recovery mail ≠ Notification Email product.
Connected/Delivering require real SMTP round-trip — not claimed.
```

---

## W5-N02-c status (Email restart recovery foundation)

W5-N02-c adds deterministic restart recovery for canonical Email notification anchors on the existing Notification Delivery owner.

---

## W5-N02-b status (Durable Email anchor foundation)

W5-N02-b adds canonical Email notification anchor persistence on the existing Notification Delivery owner. **No customer-visible Email notification behaviour** was added.

---

## W5-N03 status (Slack / Discord / Teams — CLOSED)

W5-N03 Slack / Discord / Teams Notification foundation is **CLOSED** by Product Owner (2026-08-29). Delivered: inventory (a), durable persistence (b), restart recovery (c), operational continuity (d), Close Evidence (e), Final Integration Verification **PASS** (`7f17a26`).

```text
Foundation only — not webhook I/O, not outbound delivery, not Connected/Delivering labels.
Slack / Discord / Microsoft Teams channels remain reserved-inactive.
Notification Platform Complete and Wave 5 COMPLETE not claimed.
```

See [`w5-n03-product-owner-close-record.md`](./w5-n03-product-owner-close-record.md).

---

## W5-N03-e status (Package Close Evidence)

W5-N03-e assembles complete engineering Close Evidence for slices a–d: inventory, durable persistence, restart recovery, and operational continuity. **No new customer functionality** was added.

```text
Implementation chain a → b → c → d verified complete.
Governance, architecture, documentation, and validation completeness recorded.
Honest Product integrity and dependency integrity verified.
Ready for Final Package Integration Verification — not performed from this slice.
Product Owner Package Close — not performed.
```

---

## W5-N03-d status (Slack / Discord / Teams operational continuity foundation)

W5-N03-d projects derived Slack / Discord / Teams Notification operational readiness (Recovering / Ready / Degraded / Unavailable) into Platform Operational Readiness from W5-N03-c recovery state. **No outbound Slack / Discord / Teams delivery** was added.

```text
Readiness derived from W5-N03-c continuity record only.
Degraded never reports Ready.
Missing continuity never fabricates Ready.
Transport availability does not affect readiness.
Package Close = W5-N03-e (not claimed from this slice).
```

---

## W5-N03-c status (Slack / Discord / Teams restart recovery foundation)

W5-N03-c adds deterministic restart recovery hydrate for W5-N03-b canonical Slack / Discord / Teams notification anchors on the existing Notification Delivery owner. **No customer-visible Slack / Discord / Teams notification behaviour** was added.

```text
Canonical anchors restore into recovery cache after normal process restart.
Recovery is deterministic and idempotent.
Missing rows → empty cache (no fabrication).
Corrupt rows → SlackDiscordTeamsNotificationRestartRecoveryError.
Operational continuity = W5-N03-d (not claimed from this slice).
```

---

## W5-N03-b status (Slack / Discord / Teams durable foundation)

W5-N03-b adds canonical Slack / Discord / Teams notification anchor persistence on the existing Notification Delivery owner. **No customer-visible Slack / Discord / Teams notification behaviour** was added.

```text
Slack / Discord / Microsoft Teams channels = reserved-inactive today.
Webhook transport = not implemented.
Connected/Delivering require real webhook round-trip — not claimed.
Restart survival = **recorded** from W5-N03-c hydrate; operational continuity = W5-N03-d.
```

---

## W5-N03-a status (Slack / Discord / Teams inventory baseline)

W5-N03-a catalogues every Slack / Discord / Teams notification artifact with SURVIVE vs EPHEMERAL classification and Honest Product boundaries. **No customer-visible Slack / Discord / Teams notification behaviour** was added.

```text
Slack / Discord / Microsoft Teams channels = reserved-inactive today.
Vault webhook secret types = absent today.
Connected/Delivering require real webhook round-trip — not claimed.
Team chat channels are delivery-only — never a control plane.
```

---

## W5-N02-a status (Email inventory baseline)

W5-N02-a catalogues every Email notification artifact with SURVIVE vs EPHEMERAL classification and Honest Product boundaries. **No customer-visible Email notification behaviour** was added.

```text
Email channel = reserved-inactive today.
Auth password-recovery mail ≠ Notification Email product.
Connected/Delivering require real SMTP round-trip — not claimed.
```

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Use Telegram to start, stop, or approve trades (forbidden forever).
- Assume all reserved channels are shipped — unshipped ones stay honestly reserved.
- Use notifications as a substitute for the Gate or Risk Engine.
- Assume Telegram Bot API connect/test/disconnect is operational from W5-N01 alone (foundation CLOSED only).

---

## Wave packages (Master Plan order)

| Package | Name                        | What it delivers                                                             | Status                                   |
| ------- | --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| W5-N01  | Production Telegram Bot API | Real Bot API connect / test / disconnect                                     | **CLOSED** by Product Owner (2026-08-28) |
| W5-N02  | Email (SMTP)                | Email Notification foundation — inventory, persistence, recovery, continuity | **CLOSED** by Product Owner (2026-08-28) |
| W5-N03  | Slack / Discord / Teams     | Real webhook transports                                                      | **CLOSED** by Product Owner (2026-08-29) |
| W5-N04  | Push                        | Push Notification foundation — inventory, persistence, recovery, continuity  | **CLOSED** by Product Owner (2026-08-29) |

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

W5-N01-e assembled complete engineering Close Evidence across slices a–d: operational chain verification, governance, architecture compliance, and Honest Product enforcement. Final Integration Verification **PASS**. Package **CLOSED** by Product Owner (2026-08-28).

---

## Customer journey (Email foundation — W5-N02)

```text
Slack / Discord / Teams Notification inventory & honesty baseline (W5-N03-a)

Email Notification inventory & honesty baseline (W5-N02-a)
        ↓
Persist canonical notification anchors (W5-N02-b)
        ↓
Restart application → recover anchors (W5-N02-c)
        ↓
Derive operational readiness (W5-N02-d)
        ↓
Platform Readiness emailNotification view
        ↓
Close Evidence + Final Integration Verification PASS
        ↓
Product Owner Close (2026-08-28)
```

W5-N02-e assembled complete engineering Close Evidence across slices a–d. Final Integration Verification **PASS**. Package **CLOSED** by Product Owner (2026-08-28). **Without:** SMTP I/O · Outbound Email delivery · Connected/Delivering labels · Email notifications operational.

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
- Telegram Bot implemented — **not claimed**
- Telegram notifications operational — **not claimed**
- Email / Slack / Discord / Teams / Push shipped — **not claimed**
- Notification Platform Complete — **not claimed**
- Live Trading — **not claimed**
- W5-N01 CLOSED — **recorded** (2026-08-28)
- W5-N02 CLOSED — **recorded** (2026-08-28)
- W5-N03 CLOSED — **recorded** (2026-08-29)
- Email SMTP implemented — **not claimed**
- Email notifications operational — **not claimed**
- Slack notifications operational — **not claimed**
- Discord notifications operational — **not claimed**
- Microsoft Teams notifications operational — **not claimed**
- Push implemented — **not claimed**
- Web Push implemented — **not claimed**
- FCM implemented — **not claimed**
- Browser notifications operational — **not claimed**
- Device token registry implemented — **not claimed**
- Push notifications operational — **not claimed**

---

---

## W5-N04-c status (Push restart recovery foundation)

W5-N04-c adds deterministic restart recovery hydrate for W5-N04-b canonical Push notification anchors on the existing Notification Delivery owner. **No customer-visible Push notification behaviour** was added.

```text
Canonical anchors restore into recovery cache after normal process restart.
Recovery is deterministic and idempotent.
Missing rows → empty cache (no fabrication).
Corrupt rows → PushNotificationRestartRecoveryError.
Operational continuity = W5-N04-d (not claimed from this slice).
```

---

---

## W5-N04-d status (Push operational continuity foundation)

W5-N04-d projects derived Push Notification operational readiness (Recovering / Ready / Degraded / Unavailable) into Platform Operational Readiness from W5-N04-c recovery state. **No outbound Push delivery** was added.

```text
Readiness derived from W5-N04-c continuity record only.
Degraded never fabricates Ready.
Missing continuity never fabricates Ready.
Web Push / FCM / device token registry do not influence readiness.
Package Close = W5-N04-e (not claimed from this slice).
```

---

---

## W5-N04-e status (Package Close Evidence)

W5-N04-e assembles complete engineering Close Evidence for slices a–d: inventory, durable persistence, restart recovery, and operational continuity. **No new customer functionality** was added.

```text
Implementation chain a → b → c → d verified complete.
Governance, architecture, documentation, and validation completeness recorded.
Honest Product integrity and dependency integrity verified.
Ready for Final Package Integration Verification — not performed from this slice.
Product Owner Package Close — not performed.
```

---

## W5-N04 status (Push — CLOSED)

W5-N04 Push Notification foundation is **CLOSED** by Product Owner (2026-08-29). Delivered: inventory (a), durable persistence (b), restart recovery (c), operational continuity (d), Close Evidence (e), Final Integration Verification **PASS** (`2488d4f`).

```text
Foundation only — not Web Push / FCM I/O, not outbound delivery, not Connected/Delivering labels.
Push channel remains reserved-inactive.
Notification Platform Complete and Wave 5 COMPLETE not claimed.
```

See [`w5-n04-product-owner-close-record.md`](./w5-n04-product-owner-close-record.md).

---

## W5-N04 Final Integration Verification status

W5-N04 Final Package Integration Verification **PASS** (2026-08-29). All slices a–e form one internally consistent package. Engineering verdict: **READY FOR PRODUCT OWNER FINAL CLOSE** — executed 2026-08-29.

```text
Slice chain d8c6158 → 0720bda → 37e245c → a06a4c5 → d20ea88 → 2488d4f verified on origin/main.
Product Owner Close Record created — W5-N04 CLOSED.
W5-N05 — not opened.
```

---

## W5-N06-a status (Notification Platform Delivery inventory & honesty baseline)

W5-N06-a enumerates every Notification Platform Delivery artifact across Closed W5-N05 integration foundation, per-channel W5-N01…N04 foundations, PC-06 routing, PC-07 notification product, per-channel and integration operational continuity views, and missing unified platform delivery layer, dispatcher, scheduler, and retry orchestration. **No customer-visible Notification Platform Delivery behaviour** was added.

```text
W5-N05 integration foundation consumed as reference only — not reopened.
Per-channel W5-N01…N04 foundations consumed as reference only.
Unified platform delivery layer absent — EPHEMERAL until W5-N06-b.
Platform delivery anchors, restart recovery, operational continuity, dispatcher, scheduler, and retry missing.
TD-049 / TD-050 production transport I/O deferred.
Notification Platform Delivery does NOT function after this slice.
Durable foundation = W5-N06-b (not claimed from this slice).
```

See [`w5-n06-a-notification-platform-delivery-inventory.md`](./w5-n06-a-notification-platform-delivery-inventory.md).

---

## W5-N06-b status (Durable Notification Platform Delivery foundation)

W5-N06-b adds canonical Notification Platform Delivery anchor persistence on the existing **Notification Delivery** owner via `WorkspaceNotificationPlatformDeliveryAnchor`. **No customer-visible Notification Platform Delivery behaviour** was added.

```text
Canonical platform delivery anchors persisted — anchor-recorded only.
No delivery execution, dispatcher, queue workers, retry, or scheduler.
No restart recovery hydrate — W5-N06-c.
Platform delivery does NOT function after this slice.
Notification Platform Delivery implemented — NOT claimed.
```

See [`w5-n06-b-implementation-report.md`](./w5-n06-b-implementation-report.md).

---

## W5-N06-c status (Notification Platform Delivery restart recovery foundation)

W5-N06-c adds deterministic restart recovery hydrate for W5-N06-b canonical Notification Platform Delivery anchors on the existing **Notification Delivery** owner. **No customer-visible Notification Platform Delivery behaviour** was added.

```text
Canonical platform delivery anchors restored after normal process restart.
Recovery deterministic, idempotent, fail-honest on corruption.
Missing rows → empty cache (no fabrication).
No operational continuity — W5-N06-d.
Platform delivery execution / dispatcher / scheduler / retry — NOT claimed.
```

See [`w5-n06-c-implementation-report.md`](./w5-n06-c-implementation-report.md).

---

## W5-N06-d status (Notification Platform Delivery operational continuity foundation)

W5-N06-d adds derived operational readiness for Notification Platform Delivery on Platform Operational Readiness, using W5-N06-c continuity records only. **No dispatcher, queue execution, retry engine, or scheduler** was added.

```text
Recovering | Ready | Degraded | Unavailable derived from W5-N06-c continuity + owner readiness.
Integrity-verified anchor counts exposed on Platform Readiness UI.
Package Close = W5-N06-e (not claimed from this slice).
Notification Platform Delivery does NOT function after this slice.
```

See [`w5-n06-d-implementation-report.md`](./w5-n06-d-implementation-report.md).

---

## W5-N06-e status (Notification Platform Delivery package close evidence)

W5-N06-e assembles complete engineering Close Evidence for W5-N06-a through W5-N06-d. **No platform delivery execution, dispatcher, queue, retry, or scheduler** was added.

```text
Implementation chain, dependency chain, operational chain, governance, architecture, and Honest Product verified.
Package walkthrough evidenced.
Ready for Final Package Integration Verification — not performed from this slice.
W5-N06 — not CLOSED.
```

See [`w5-n06-e-implementation-report.md`](./w5-n06-e-implementation-report.md).

---

## W5-N06 Final Integration Verification status

W5-N06 Final Package Integration Verification **PASS** (2026-08-29). All slices a–e form one internally consistent package. Engineering verdict: **READY FOR PRODUCT OWNER FINAL CLOSE**.

```text
Slice chain 6d6c504 → ed7149e → 19a2ac8 → 09b8c0f → 68b277b → 52151cb verified on origin/main.
W5-N06-e COMPLETE (`68b277b`) — Package Close Evidence.
Final Integration Verification PASS (`52151cb`).
Product Owner Close Record created — W5-N06 CLOSED (2026-08-29).
```

See [`w5-n06-final-integration-verification.md`](./w5-n06-final-integration-verification.md).

---

## W5-N06 status (Notification Platform Delivery — CLOSED)

W5-N06 Notification Platform Delivery Foundation is **CLOSED** by Product Owner (2026-08-29). Delivered: inventory (a), durable persistence (b), restart recovery (c), operational continuity (d), Close Evidence (e), Final Integration Verification **PASS** (`52151cb`).

```text
Foundation only — not platform delivery execution, not dispatcher, not queue, not retry, not scheduler.
Closed W5-N05 integration foundation consumed; per-channel W5-N01…N04 transport stubs remain honest per inventory.
Notification Platform Delivery complete and Notification Platform Complete not claimed.
Wave 5 COMPLETE not claimed.
```

See [`w5-n06-product-owner-close-record.md`](./w5-n06-product-owner-close-record.md).

---

## W5-N05-a status (Notification Platform Integration inventory & honesty baseline)

W5-N05-a enumerates every Notification Platform Integration artifact across W5-N01…N04 per-channel foundations, PC-06 routing, PC-07 notification product, per-channel operational continuity views, and missing unified platform integration layer. **No customer-visible Notification Platform Integration behaviour** was added.

```text
Per-channel W5-N01…N04 foundations consumed as reference only — not reopened.
Unified platform integration layer absent — EPHEMERAL until W5-N05-b.
Platform integration anchors, restart recovery, and operational continuity missing.
TD-049 / TD-050 production transport I/O deferred.
Notification Platform Integration does NOT function after this slice.
Durable foundation = W5-N05-b (not claimed from this slice).
```

See [`w5-n05-a-notification-platform-integration-inventory.md`](./w5-n05-a-notification-platform-integration-inventory.md).

---

## W5-N05-b status (Durable Notification Platform Integration foundation)

W5-N05-b adds canonical Notification Platform Integration anchor persistence on the existing Notification Delivery owner via `WorkspaceNotificationPlatformIntegrationAnchor`. **No customer-visible Notification Platform Integration behaviour** was added.

```text
Canonical integration anchors persist in workspace_notification_platform_integration_anchors.
Integration state only — no delivery state, runtime state, or transport I/O.
Restart recovery = W5-N05-c (not claimed from this slice).
Operational continuity = W5-N05-d (not claimed from this slice).
Notification Platform Integration does NOT function after this slice.
```

See [`w5-n05-b-implementation-report.md`](./w5-n05-b-implementation-report.md).

---

## W5-N05-c status (Notification Platform Restart Recovery Integration foundation)

W5-N05-c adds deterministic restart recovery hydrate for W5-N05-b canonical Notification Platform Integration anchors on the existing Notification Delivery owner. **No customer-visible Notification Platform Integration behaviour** was added.

```text
OnModuleInit hydrate loads persisted integration anchors into process-local recovery store.
Deterministic order: workspaceId ascending, then integrationAnchorId.
Missing rows → empty cache (no fabrication). Corrupt rows → fail-honest throw.
Operational continuity = W5-N05-d (not claimed from this slice).
Notification Platform Integration does NOT function after this slice.
```

See [`w5-n05-c-implementation-report.md`](./w5-n05-c-implementation-report.md).

---

## W5-N05-d status (Notification Platform Operational Continuity Integration foundation)

W5-N05-d adds derived operational readiness for Notification Platform Integration on Platform Operational Readiness, using W5-N05-c continuity records only. **No platform integration I/O or delivery behaviour** was added.

```text
Recovering | Ready | Degraded | Unavailable derived from W5-N05-c continuity + owner readiness.
Integrity-verified anchor counts exposed on Platform Readiness UI.
Package Close = W5-N05-e (not claimed from this slice).
Notification Platform Integration does NOT function after this slice.
```

See [`w5-n05-d-implementation-report.md`](./w5-n05-d-implementation-report.md).

---

## W5-N05-e status (Package Close Evidence)

W5-N05-e assembles complete engineering Close Evidence for slices a–d: inventory, durable persistence, restart recovery, and operational continuity. **No new customer functionality** was added.

```text
Implementation chain a → b → c → d verified complete.
Governance, architecture, documentation, and validation completeness recorded.
Honest Product integrity and dependency integrity verified.
Ready for Final Package Integration Verification — not performed from this slice.
Product Owner Package Close — not performed.
Notification Platform Integration does NOT function after this slice.
```

See [`w5-n05-e-implementation-report.md`](./w5-n05-e-implementation-report.md).

---

## W5-N05 Final Integration Verification status

W5-N05 Final Package Integration Verification **PASS** (2026-08-29). All slices a–e form one internally consistent package. Engineering verdict: **READY FOR PRODUCT OWNER FINAL CLOSE**.

```text
Slice chain d6514ab → cbbf1d7 → 9b85628 → 2cdb0b7 → d89a076 → ae1104d verified on origin/main.
Product Owner Close Record created — W5-N05 CLOSED.
W5-N06 Planning APPROVED (2026-08-29).
W5-N06-a COMPLETE (`6d6c504`) — Notification Platform Delivery Inventory & Honest Product Baseline.
W5-N06-b COMPLETE (`ed7149e`) — Durable Notification Platform Delivery Foundation.
W5-N06-c COMPLETE (`19a2ac8`) — Notification Platform Delivery Restart Recovery Foundation.
W5-N06-d COMPLETE (`09b8c0f`) — Notification Platform Delivery Operational Continuity Foundation.
W5-N06-e COMPLETE (`68b277b`) — Package Close Evidence.
W5-N06 Final Integration Verification PASS (`52151cb`).
W5-N06 CLOSED by Product Owner (2026-08-29).
```

---

## W5-N05 status (Notification Platform Integration — CLOSED)

W5-N05 Notification Platform Integration foundation is **CLOSED** by Product Owner (2026-08-29). Delivered: inventory (a), durable persistence (b), restart recovery (c), operational continuity (d), Close Evidence (e), Final Integration Verification **PASS** (`ae1104d`).

```text
Foundation only — not platform integration I/O, not cross-channel delivery unification, not Connected/Delivering labels.
Per-channel W5-N01…N04 transport stubs remain honest per inventory.
Notification Platform Complete and Wave 5 COMPLETE not claimed.
```

See [`w5-n05-product-owner-close-record.md`](./w5-n05-product-owner-close-record.md).

---

**STOP.** W5-N05 is **CLOSED** by Product Owner. W5-N06 is **CLOSED** by Product Owner. Do not declare Notification Platform Integration implemented. Do not declare Notification Platform Delivery implemented. Do not declare Notification Platform Delivery complete. Do not declare Notification Platform Complete. Do not declare Wave 5 COMPLETE. Do not open W5-N07 without separate Product Owner instruction.
