# Binance Real I/O Overview

**Document:** W4-E01 Binance Real I/O Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W4-E01 **CLOSED** by Product Owner (2026-08-28). Foundation scope only — not REST/WebSocket I/O, not Binance Connected, not Exchange Connectivity Complete.
**Product:** Wave 4 — Exchange Connectivity · Package W4-E01 (V3-E01 · CM-07)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w4-e01-implementation-package.md`](./w4-e01-implementation-package.md)
**Scope:** [`w4-e01-product-scope.md`](./w4-e01-product-scope.md)
**Wave progress:** [`wave-4-progress.md`](./wave-4-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 4 makes exchange connectivity **honest**. For Binance, **Connected** means the real venue answered when you test with your saved credentials — not a simulation.

```text
Connected means the venue answered.
Connected does NOT mean Live Trading enabled.
Connected does NOT mean orders are sent to live capital.
Paper trading remains the default.
W4-E01 extends the existing Exchange Adapter factory only.
It does NOT invent a second trading engine.
```

---

## What the operator can do (foundation closed — product I/O still pending)

W4-E01 foundation (inventory, persistence, recovery, operational continuity) is **CLOSED**. Operator-visible Binance Real I/O outcomes (REST test, honest Connected) are **not yet delivered** — `BinanceExchangeAdapter` remains a stub per inventory.

When future approved work delivers real I/O, the operator journey will be:

1. Open Connections and select Binance.
2. Use credentials already saved in the Vault from Wave 2 (or save new ones).
3. **Test** the connection — the product performs a real vendor round-trip.
4. See **Connected** when Binance answers successfully.
5. See **Error**, **Expired**, or permission problems when the vendor reports them.
6. **Disconnect** without SSH or editing `.env`.

**Not available today** — foundation Close does not authorize the above product outcomes.

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Assume Bybit or OKX are fully connected (W4-E02 / E03).
- Assume Kraken is offered unless E04 delivers it or the product says honestly not offered.
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
  → Select Binance
  → Credentials from Vault (saved in Wave 2)
  → Test connection
  → Connected (venue answered) OR honest failure
  → Disconnect when done
  → Paper trading remains default
```

---

## W4-E01-a inventory baseline (2026-08-28)

W4-E01-a catalogued all exchange connectivity artifacts for Binance Real I/O. **No operator-visible behaviour changed.**

Binding inventory finding: `BinanceExchangeAdapter` remains a **stub** (simulated connect). Connection Management **validate** performs real signed Binance REST via handshake adapter. Public market data REST/WS paths are **adjacent** — not credentialed Connected. Exchange Connectivity **does not** survive restart from this slice.

Inventory: [`w4-e01-a-exchange-connectivity-inventory.md`](./w4-e01-a-exchange-connectivity-inventory.md)

---

## W4-E01-b durable persistence baseline (2026-08-28)

W4-E01-b added `workspace_exchange_connectivity_states` on the **Exchange Adapter** owner. Explicit connection and adapter anchors can be persisted per workspace. **No operator-visible behaviour changed.** No synthetic Connected flag.

Registry: `w4-e01-b-durable-exchange-connectivity.ts`

---

## W4-E01-c restart recovery baseline (2026-08-28)

W4-E01-c restores W4-E01-b persisted exchange connectivity anchors after normal API restart via `ExchangeConnectivityRestartRecoveryService`. Recovery is deterministic, idempotent, and fail-honest on corruption. **No operator-visible Connected behaviour.** No REST/WebSocket I/O.

Registry: `w4-e01-c-restart-recovery.ts`

---

## W4-E01-d operational continuity baseline (2026-08-28)

W4-E01-d projects Exchange Connectivity operational readiness (Recovering / Ready / Degraded / Unavailable) on Platform Readiness, derived exclusively from W4-E01-c recovery outcomes. Visible only within Platform Operational Continuity — not Connected, not REST/WebSocket I/O.

Registry: `w4-e01-d-operational-continuity.ts`

---

## W4-E01-e Close Evidence baseline (2026-08-28)

W4-E01-e assembled package Close Evidence verifying slices a–d form one internally consistent foundation.

Registry: `w4-e01-e-close-evidence.ts`

---

## Product Owner Close (2026-08-28)

W4-E01 Binance Real I/O **foundation** is **CLOSED** by Product Owner. Close record: [`w4-e01-product-owner-close-record.md`](./w4-e01-product-owner-close-record.md).

---

## Explicit non-claims

- Live Trading — **not claimed**
- Live order submission — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Binance Connected — **not claimed**
- REST / WebSocket Complete — **not claimed**
- Binance Real I/O product outcomes — **not claimed** (foundation CLOSED only)
- Bybit / OKX / Kraken real I/O — **not claimed** (E02–E04)
- Production Ready — **not claimed**
- W4-E02 Planning OPEN — **not claimed**

---

**STOP.** W4-E01 **CLOSED** by Product Owner. Do not declare Exchange Connectivity Complete. Do not declare Binance Connected. Do not declare Wave 4 COMPLETE. Do not open W4-E02.
