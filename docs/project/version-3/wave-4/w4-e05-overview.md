# Venue Permission Verification Overview

**Document:** W4-E05 Venue Permission Verification Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W4-E05 Planning **APPROVED** (2026-08-28). W4-E05-a inventory baseline **COMPLETE** (2026-08-28). W4-E05-b durable foundation **COMPLETE** (2026-08-28). W4-E05-c restart recovery **COMPLETE** (2026-08-28).
**Product:** Wave 4 — Exchange Connectivity · Package W4-E05 (V3-E05 · feeds LT-02 later)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w4-e05-implementation-package.md`](./w4-e05-implementation-package.md)
**Scope:** [`w4-e05-product-scope.md`](./w4-e05-product-scope.md)
**Wave progress:** [`wave-4-progress.md`](./wave-4-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 4 makes exchange connectivity **honest**. W4-E05 is the fifth and final Wave 4 package. It delivers **vendor-verified permissions** across catalog crypto venues — so operators see real permission status from the venue, not hardcoded defaults like `spot.read` and `spot.trade` that may not reflect actual API key capabilities.

```text
Permission verified means the venue reported what your key can do.
Permission verified does NOT mean Live Trading enabled.
Permission verified does NOT mean orders are sent to live capital.
Paper trading remains the default.
W4-E05 extends the existing Exchange Adapter factory only.
It does NOT invent a second trading engine.
W4-E01…E04 foundations are consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Connections for a connected catalog venue (Binance, Bybit, OKX, or Kraken when offered).
2. See **vendor-reported permissions** — what the venue says your API key can do.
3. See **Expired** when credentials are no longer valid per the vendor.
4. See **permission problems** when the key lacks required capabilities per the vendor.
5. Distinguish verified permissions from unverified or default labels.
6. Stay inside their workspace and authorization.

**Not available today** — `ExchangeManager.readApiPermissions()` returns hardcoded `['spot.read', 'spot.trade']` when adapters lack `apiPermissions()`. Cross-venue permission verification product does not exist.

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Assume per-venue Real I/O product outcomes are complete from W4-E01…E04 alone (foundation CLOSED only).
- Assume permission labels from connect/test capability probes equal Venue Permission Verification Complete (E05).
- Use Telegram or notifications as a trading control plane.

---

## Honest Product rules (binding)

| Label                   | Meaning                                                       |
| ----------------------- | ------------------------------------------------------------- |
| **Permission verified** | Real vendor permission probe succeeded with vault credentials |
| **Unverified**          | No probe yet, probe failed, or venue not supported            |
| **Expired**             | Credentials no longer valid per vendor                        |
| **Permission problem**  | Key lacks required permissions per vendor                     |

Never show **vendor-verified** permission labels without a real vendor permission probe.

Never show hardcoded defaults as if they were vendor-reported.

Never show **permission verified** as live trading enablement.

---

## Customer journey (planning)

```text
Sign in
  → Open Connections
  → Select connected catalog venue
  → View vendor-reported permissions
  → Expired or permission problem shown honestly when vendor reports
  → Paper trading remains default
```

---

## Relationship to W4-E01, W4-E02, W4-E03, and W4-E04

W4-E01 Binance Real I/O, W4-E02 Bybit Real I/O, W4-E03 OKX Real I/O, and W4-E04 Kraken Adapter (factory) are **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W4-E05 delivers the cross-venue **Venue Permission Verification** product per Master Plan V3-E05 — the final Wave 4 package. It does not reopen W4-E01, W4-E02, W4-E03, or W4-E04.

Per-venue connect/test capability probes during E01–E04 are **not** E05 Complete. E05 owns the cross-venue permission verification product.

---

## Relationship to Wave 6 Live Trading

Security Vision requires Wave 4 real permission verification (`spot.trade` from venue, not hardcoded `apiPermissions`) before live capital. W4-E05 advances this prerequisite. It does **not** enable Live Trading. Wave 6 + ADR remains the gate for live order submission.

---

## W4-E05-a status (inventory baseline)

W4-E05-a delivered the machine-readable and human inventory baseline only. No vendor permission probe I/O, persistence, or runtime behaviour changed. Hardcoded `apiPermissions` defaults remain active in `VenueExchangeAdapter` and `ExchangeManager.readApiPermissions()`.

Inventory: [`w4-e05-a-venue-permission-inventory.md`](./w4-e05-a-venue-permission-inventory.md)

## W4-E05-b status (durable persistence foundation)

W4-E05-b delivered durable venue permission verification anchor persistence on the existing Exchange Adapter owner only. No vendor permission probe I/O, restart recovery, operational continuity, or operator-visible behaviour changed.

Implementation: [`w4-e05-b-implementation-report.md`](./w4-e05-b-implementation-report.md)

## W4-E05-c status (restart recovery foundation)

W4-E05-c delivered deterministic restart recovery for W4-E05-b persisted venue permission verification anchors. Hydrate runs on module init; integrity-verified rows restore into a single in-memory recovery store. No operational continuity or customer-visible behaviour changed.

Implementation: [`w4-e05-c-implementation-report.md`](./w4-e05-c-implementation-report.md)
Persistence foundation: [`w4-e05-b-implementation-report.md`](./w4-e05-b-implementation-report.md)

---

## Explicit non-claims

- W4-E05 Planning APPROVED — **recorded**
- W4-E05-a inventory baseline — **recorded**
- W4-E05-b durable foundation — **recorded**
- W4-E05-c restart recovery — **recorded**
- W4-E05-d opened — **not claimed**
- W4-E05 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Venue Permission Verification Complete — **not claimed**
- Live Trading — **not claimed**
- Production Ready — **not claimed**

---

**STOP.** W4-E05-c restart recovery **COMPLETE** (2026-08-28). Await Product Owner review before W4-E05-d. Do not declare Venue Permission Verification Complete or Exchange Connectivity Complete.
