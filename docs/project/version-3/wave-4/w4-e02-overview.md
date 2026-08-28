# Bybit Real I/O Overview

**Document:** W4-E02 Bybit Real I/O Overview
**Date:** 2026-08-28
**Status:** Product-facing planning record. W4-E02 **CLOSED** by Product Owner (2026-08-28). Foundation scope only — not REST/WebSocket I/O, not Bybit Connected, not Exchange Connectivity Complete.
**Product:** Wave 4 — Exchange Connectivity · Package W4-E02 (V3-E02 · CM-08)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w4-e02-implementation-package.md`](./w4-e02-implementation-package.md)
**Scope:** [`w4-e02-product-scope.md`](./w4-e02-product-scope.md)
**Wave progress:** [`wave-4-progress.md`](./wave-4-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 4 makes exchange connectivity **honest**. For Bybit, **Connected** will mean the real venue answered when you test with your saved credentials — not a simulation.

```text
Connected means the venue answered.
Connected does NOT mean Live Trading enabled.
Connected does NOT mean orders are sent to live capital.
Paper trading remains the default.
W4-E02 extends the existing Exchange Adapter factory only.
It does NOT invent a second trading engine.
W4-E01 foundation is consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Connections and select Bybit.
2. Use credentials already saved in the Vault from Wave 2 (or save new ones).
3. **Test** the connection — the product performs a real vendor round-trip.
4. See **Connected** when Bybit answers successfully.
5. See **Error**, **Expired**, or permission problems when the vendor reports them.
6. **Disconnect** without SSH or editing `.env`.

**Not available today** — W4-E02-a inventory and W4-E02-b durable persistence only. `BybitExchangeAdapter` remains a stub; validate returns planned `not_implemented`.

---

## W4-E02-a inventory baseline (2026-08-28)

W4-E02-a catalogued all exchange connectivity artifacts for Bybit Real I/O. **No operator-visible behaviour changed.**

Binding inventory finding: `BybitExchangeAdapter` remains a **stub** (simulated connect). Connection Management **validate** routes to `PlannedExchangeHandshakeAdapter(BYBIT)` which returns **not_implemented** — no real vendor round-trip. W4-E01 CLOSED foundation is **consumed** (structurally venue-capable; BYBIT anchors not evidenced). Exchange Connectivity **does not** survive restart from this slice.

Inventory: [`w4-e02-a-exchange-connectivity-inventory.md`](./w4-e02-a-exchange-connectivity-inventory.md)

---

## W4-E02-b durable persistence baseline (2026-08-28)

W4-E02-b added `workspace_bybit_exchange_connectivity_states` on the **Exchange Adapter** owner. Explicit BYBIT connection and adapter anchors can be persisted per workspace. **No operator-visible behaviour changed.** No synthetic Connected flag.

Registry: `w4-e02-b-durable-exchange-connectivity.ts`

---

## W4-E02-c restart recovery baseline (2026-08-28)

W4-E02-c restores W4-E02-b persisted Bybit exchange connectivity anchors after a normal API process restart into a single in-memory recovery cache. Recovery is deterministic, idempotent, and fail-honest on corruption. **No operator-visible behaviour changed.** No synthetic Connected flag.

Registry: `w4-e02-c-restart-recovery.ts`

---

## W4-E02-d operational continuity baseline (2026-08-28)

W4-E02-d projects Bybit exchange connectivity operational readiness onto Platform Readiness, derived exclusively from W4-E02-c recovery outcomes. Supported states: Recovering, Ready, Degraded, Unavailable. **No Connected label.** No REST/WebSocket I/O.

Registry: `w4-e02-d-operational-continuity.ts`

---

## W4-E02-e Close Evidence baseline (2026-08-28)

W4-E02-e assembled package Close Evidence verifying slices a–d form one internally consistent Bybit Exchange Connectivity foundation. **No new runtime behaviour.** Package **CLOSED** by Product Owner (2026-08-28). Close record: [`w4-e02-product-owner-close-record.md`](./w4-e02-product-owner-close-record.md).

Registry: `w4-e02-e-close-evidence.ts`

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Assume Binance product I/O is complete from W4-E01 alone (foundation CLOSED only).
- Assume OKX or Kraken are fully connected (W4-E03 / E04).
- Use Telegram or notifications as a trading control plane.

---

## Honest Product rules (binding)

| Label                  | Meaning                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **Connected**          | Real vendor round-trip succeeded with vault credentials             |
| **Error**              | Vendor or network failure; message is vendor-visible where possible |
| **Expired**            | Credentials no longer valid per vendor                              |
| **Permission problem** | Key lacks required permissions per vendor                           |
| **Not offered**        | Venue not implemented — honest label only                           |

Never show **Connected** without a real vendor round-trip.

Never show **Connected** for live trading when only paper is enabled.

---

## Customer journey (planning)

```text
Sign in
  → Open Connections
  → Select Bybit
  → Credentials from Vault (saved in Wave 2)
  → Test connection
  → Connected (venue answered) OR honest failure
  → Disconnect when done
  → Paper trading remains default
```

---

## Relationship to W4-E01

W4-E01 Binance Real I/O is **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W4-E02 applies the same factory extension pattern to **Bybit** per Master Plan V3-E02 / CM-08. It does not reopen W4-E01.

---

## Explicit non-claims

- W4-E02 Planning APPROVED — **recorded**
- W4-E02-a inventory — **COMPLETE**
- W4-E02-b durable persistence — **COMPLETE**
- W4-E02-c restart recovery — **COMPLETE**
- W4-E02-d operational continuity — **COMPLETE**
- W4-E02-e Close Evidence — **COMPLETE**
- W4-E02 CLOSED — **recorded** (Product Owner, 2026-08-28)
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Bybit Connected — **not claimed**
- Live Trading — **not claimed**
- OKX / Kraken real I/O — **not claimed** (E03–E04)
- Production Ready — **not claimed**

---

**STOP.** W4-E02 **CLOSED** by Product Owner. Do not declare Exchange Connectivity Complete. Do not declare Bybit Connected. Do not declare Wave 4 COMPLETE. Do not open W4-E03.
