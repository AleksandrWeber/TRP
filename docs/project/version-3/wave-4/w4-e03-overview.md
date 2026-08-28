# OKX Real I/O Overview

**Document:** W4-E03 OKX Real I/O Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W4-E03-e Close Evidence **COMPLETE** (local). Awaiting Final Package Integration Verification. Not OKX Connected. Not Exchange Connectivity Complete.
**Product:** Wave 4 — Exchange Connectivity · Package W4-E03 (V3-E03 · CM-09)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w4-e03-implementation-package.md`](./w4-e03-implementation-package.md)
**Scope:** [`w4-e03-product-scope.md`](./w4-e03-product-scope.md)
**Wave progress:** [`wave-4-progress.md`](./wave-4-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 4 makes exchange connectivity **honest**. For OKX, **Connected** will mean the real venue answered when you test with your saved credentials — including passphrase — not a simulation.

```text
Connected means the venue answered.
Connected does NOT mean Live Trading enabled.
Connected does NOT mean orders are sent to live capital.
Paper trading remains the default.
W4-E03 extends the existing Exchange Adapter factory only.
It does NOT invent a second trading engine.
W4-E01 and W4-E02 foundations are consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

1. Open Connections and select OKX.
2. Use credentials already saved in the Vault from Wave 2 (key, secret, and passphrase).
3. **Test** the connection — the product performs a real vendor round-trip.
4. See **Connected** when OKX answers successfully.
5. See **Error**, **Expired**, or permission problems when the vendor reports them.
6. **Disconnect** without SSH or editing `.env`.

**Not available today** — `OkxExchangeAdapter` remains a stub; validate returns planned `not_implemented`. W4-E03-a inventory baseline recorded locally; honest Connected unavailable until W4-E03-b+.

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Assume Binance or Bybit product I/O is complete from W4-E01 / W4-E02 alone (foundation CLOSED only).
- Assume Kraken is fully connected (W4-E04).
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
  → Select OKX
  → Credentials from Vault (saved in Wave 2 — key, secret, passphrase)
  → Test connection
  → Connected (venue answered) OR honest failure
  → Disconnect when done
  → Paper trading remains default
```

---

## Relationship to W4-E01 and W4-E02

W4-E01 Binance Real I/O and W4-E02 Bybit Real I/O are **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W4-E03 applies the same factory extension pattern to **OKX** per Master Plan V3-E03 / CM-09. It does not reopen W4-E01 or W4-E02.

---

## Explicit non-claims

- W4-E03 Planning OPEN — **recorded**
- W4-E03 Planning Review PASS — **recorded**
- W4-E03 Planning APPROVED — **recorded**
- W4-E03-a COMPLETE — **recorded**
- W4-E03-b COMPLETE — **recorded**
- W4-E03-c COMPLETE — **recorded** (committed and pushed)
- W4-E03-d COMPLETE — **recorded** (committed and pushed)
- W4-E03-e COMPLETE — **recorded** (local, uncommitted)
- W4-E03 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- OKX Connected — **not claimed**
- Live Trading — **not claimed**
- Kraken real I/O — **not claimed** (E04)
- Production Ready — **not claimed**

---

**STOP.** W4-E03-e Close Evidence **COMPLETE** (local). Await Product Owner Package Review and Final Package Integration Verification. Do not declare OKX Connected or W4-E03 CLOSED.
