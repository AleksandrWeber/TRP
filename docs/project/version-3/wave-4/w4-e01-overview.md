# Binance Real I/O Overview

**Document:** W4-E01 Binance Real I/O Overview
**Date:** 2026-08-28
**Status:** Product-facing record. Wave 4 Planning **OPEN**. W4-E01 Planning **OPEN**. Not approved. Not implementation.
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

## What the operator can do (after W4-E01 Close — not yet)

1. Open Connections and select Binance.
2. Use credentials already saved in the Vault from Wave 2 (or save new ones).
3. **Test** the connection — the product performs a real vendor round-trip.
4. See **Connected** when Binance answers successfully.
5. See **Error**, **Expired**, or permission problems when the vendor reports them.
6. **Disconnect** without SSH or editing `.env`.

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

## Explicit non-claims

- Live Trading — **not claimed**
- Live order submission — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Bybit / OKX / Kraken real I/O — **not claimed** (E02–E04)
- W4-E01 APPROVED — **not claimed**
- Implementation started — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not open W4-E01-a.
