# Kraken Adapter (factory) Overview

**Document:** W4-E04 Kraken Adapter (factory) Overview
**Date:** 2026-08-28
**Status:** Product-facing record. W4-E04 **CLOSED** by Product Owner (2026-08-28). Foundation scope only — not REST/WebSocket I/O, not Kraken Connected, not Exchange Connectivity Complete.
**Product:** Wave 4 — Exchange Connectivity · Package W4-E04 (V3-E04 · CM-10)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.

**Planning:** [`w4-e04-implementation-package.md`](./w4-e04-implementation-package.md)
**Scope:** [`w4-e04-product-scope.md`](./w4-e04-product-scope.md)
**Wave progress:** [`wave-4-progress.md`](./wave-4-progress.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 4 makes exchange connectivity **honest**. For Kraken, the product will either offer a **real factory adapter** with **Connected** meaning the venue answered when you test with saved credentials, or honestly say Kraken is **not offered** — not a silent catalog label.

```text
Connected means the venue answered (when Kraken is offered).
Connected does NOT mean Live Trading enabled.
Connected does NOT mean orders are sent to live capital.
Paper trading remains the default.
W4-E04 extends the existing Exchange Adapter factory only.
It does NOT invent a second trading engine.
W4-E01, W4-E02, and W4-E03 foundations are consumed — not redesigned.
```

---

## What the operator will be able to do (after approved implementation and Close)

### When Kraken is offered

1. Open Connections and select Kraken.
2. Use credentials already saved in the Vault from Wave 2.
3. **Test** the connection — the product performs a real vendor round-trip.
4. See **Connected** when Kraken answers successfully.
5. See **Error**, **Expired**, or permission problems when the vendor reports them.
6. **Disconnect** without SSH or editing `.env`.

### When Kraken is not offered

1. Open Connections and select Kraken.
2. See an honest **not offered** label.
3. No fake **Connected** status.
4. No implied live trading availability.

**Not available today** — `kraken` is an Exchange Scope catalog label with `liveAdapter: false`. No Kraken adapter, REST client, or WS client exists.

---

## What the operator cannot do (still)

- Start Live Trading or submit live orders to capital (Wave 6 + ADR).
- Assume Binance, Bybit, or OKX product I/O is complete from W4-E01 / W4-E02 / W4-E03 alone (foundation CLOSED only).
- Assume venue permission verification is complete (W4-E05).
- Use Telegram or notifications as a trading control plane.

---

## Honest Product rules (binding)

| Label                  | Meaning                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **Connected**          | Real vendor round-trip succeeded with vault credentials (offered) |
| **Not offered**        | Kraken adapter not delivered — honest label only                  |
| **Error**              | Vendor or network failure; message vendor-visible where possible  |
| **Expired**            | Credentials no longer valid per vendor                            |
| **Permission problem** | Key lacks required permissions per vendor                         |

Never show **Connected** without a real vendor round-trip.

Never show **Connected** for live trading when only paper is enabled.

Never show silent availability for a label-only venue.

---

## Customer journey (planning)

```text
Sign in
  → Open Connections
  → Select Kraken
  → When offered: credentials from Vault (saved in Wave 2)
  → When offered: Test connection
  → When offered: Connected (venue answered) OR honest failure
  → When not offered: honest not-offered label
  → Disconnect when done (offered)
  → Paper trading remains default
```

---

## Relationship to W4-E01, W4-E02, and W4-E03

W4-E01 Binance Real I/O, W4-E02 Bybit Real I/O, and W4-E03 OKX Real I/O are **CLOSED** (foundation: inventory, durable persistence, restart recovery, operational continuity). W4-E04 applies the same factory extension pattern to **Kraken** per Master Plan V3-E04 / CM-10 — the first catalog label with no existing client. It does not reopen W4-E01, W4-E02, or W4-E03.

---

## W4-E04-a status (inventory baseline)

W4-E04-a delivered the machine-readable and human inventory baseline only. No REST, WebSocket, persistence, or runtime behaviour changed. Kraken remains the first label-only venue: Exchange Scope catalog label exists; no adapter, provider catalog entry, vault secret type, or Connections UI entry.

Inventory: [`w4-e04-a-exchange-connectivity-inventory.md`](./w4-e04-a-exchange-connectivity-inventory.md)

---

## W4-E04-b status (durable persistence foundation)

W4-E04-b delivered durable workspace Kraken exchange connectivity anchors on the existing Exchange Adapter owner only. Canonical continuity anchors can be written to `workspace_kraken_exchange_connectivity_states`. No operational continuity, REST, WebSocket, or operator-visible behaviour changed.

Report: [`w4-e04-b-implementation-report.md`](./w4-e04-b-implementation-report.md)

---

## W4-E04-c status (restart recovery foundation)

W4-E04-c delivered deterministic restart recovery for W4-E04-b persisted Kraken exchange connectivity anchors on the existing Exchange Adapter owner only. `hydrate()` restores previously persisted continuity anchors into an in-memory recovery store on module init. No operational continuity, REST, WebSocket, or operator-visible behaviour changed.

Report: [`w4-e04-c-implementation-report.md`](./w4-e04-c-implementation-report.md)

---

## W4-E04-d status (operational continuity foundation)

W4-E04-d delivered derived operational readiness for Kraken exchange connectivity on Platform Readiness after W4-E04-c recovery. Operators see Recovering, Ready, Degraded, or Unavailable — not Connected, not Kraken Connected, and not live trading enablement.

Report: [`w4-e04-d-implementation-report.md`](./w4-e04-d-implementation-report.md)

---

## W4-E04-e status (package close evidence)

W4-E04-e assembled package Close Evidence across slices a–d: operational walkthrough, governance verification, architecture integrity, and Honest Product enforcement. No runtime behaviour changed.

Report: [`w4-e04-e-implementation-report.md`](./w4-e04-e-implementation-report.md)

---

## Explicit non-claims

- W4-E04 Planning APPROVED — **recorded**
- W4-E04-a inventory baseline — **recorded**
- W4-E04-b durable persistence foundation — **recorded**
- W4-E04-c restart recovery foundation — **recorded**
- W4-E04-d operational continuity foundation — **recorded**
- W4-E04-e close evidence — **recorded**
- W4-E04 CLOSED — **recorded** (2026-08-28)
- Final Package Integration Verification PASS — **recorded**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Kraken Connected — **not claimed**
- Live Trading — **not claimed**
- Production Ready — **not claimed**

---

**STOP.** W4-E04 **CLOSED** by Product Owner (2026-08-28). Do not declare Kraken Connected, Exchange Connectivity Complete, or Wave 4 COMPLETE. Do not open W4-E05 without separate Product Owner sequencing.
