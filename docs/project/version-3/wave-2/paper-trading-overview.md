# Paper Trading Overview

**Document:** Version 3 Paper Trading Overview
**Date:** 2026-08-26
**Status:** W2-S04 Paper Trading Foundation implemented through W2-S04-e. Close package prepared. Ready for Product Owner Package Close Review. **Not Closed.**
**Product:** Paper Trading Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.
**Close evidence:** [`w2-s04-close-package-report.md`](./w2-s04-close-package-report.md) · [`w2-s04-live-product-walkthrough.md`](./w2-s04-live-product-walkthrough.md) · [`w2-s04-package-summary.md`](./w2-s04-package-summary.md)

This is what an ordinary operator experiences. It is not an internal design note.

---

## What the operator can do today

- Open **Paper Trading**
- Create a **Paper Account** (one per workspace; USD; Starting / Current Balance; Active / Disabled)
- Create, review, list, and cancel **Paper Orders** (Limit / Market / Stop / Stop Limit; Buy / Sell)
- **Execute Matching** on Pending orders against Market Data ticker snapshots
- Observe **Paper Fill**, **Paper Positions**, **Paper Portfolio**, **Paper Balance**, **Realized PnL**, **Unrealized PnL**, and **Execution History**

```text
Paper fill means simulated execution used a Market Data snapshot.
Paper fill does NOT mean the exchange accepted an order.
Paper trading does NOT mean Live Trading enabled.
Paper Portfolio / Positions / Balance / PnL are simulated projections only — not exchange assets or real capital.
```

---

## Customer Journey

```text
Sign in
  ↓
Open Paper Trading
  ↓
Create Paper Account
  ↓
Create Paper Order
  ↓
Execute Matching (Pending)
  ↓
Observe Paper Fill
  ↓
Observe Positions / Portfolio / Balance / PnL
  ↓
Review Execution History
```

---

## Purpose

Paper Trading Foundation lets a workspace safely test strategies, signals, and workflows using simulated execution driven by real Market Data — without placing real exchange orders and without real capital. It is the mandatory foundation before Live Trading.

---

## What the operator already has

| Product                    | Status             | Role for Paper Trading                                |
| -------------------------- | ------------------ | ----------------------------------------------------- |
| Wave 1 Security Foundation | CERTIFIED COMPLETE | Sign-in, roles, Vault, isolation, audit, platform     |
| Connection Management      | CLOSED             | Exchange catalog and connection lifecycle             |
| Exchange Connectivity      | CLOSED             | Authenticated session proof for offered exchanges     |
| Market Data Foundation     | CLOSED             | Honest symbols, ticker, candles, order-book snapshots |

Paper Trading consumes those products. It does not redesign them.

---

## Customer Never Sees

- Live exchange order tickets, real capital moves, exchange balances, exchange positions, exchange portfolio, exchange PnL
- Leverage, margin, liquidation, WebSocket trading streams, strategy engine, monitoring, analytics, billing
- Claims of **Live Trading enabled**, **Exchange order placed**, **Real capital committed**, or **Exchange accepted**

---

## Security Guarantees

- Paper state is workspace-owned. Cross-workspace use is denied.
- Authorized roles only. No new roles introduced by this package.
- Prices come from Market Data. Client-supplied fills/PnL/prices are rejected.
- Unavailable or stale Market Data fails honestly.
- Audit attributes account, order, fill, execution, position, portfolio, balance, and PnL updates.
- No real capital. No exchange order placement from this product.

---

## What's Next

- Product Owner Package Close Review for W2-S04
- Only the Product Owner may declare W2-S04 CLOSED
- Live Trading stays later (Wave 6 / Order Path)
- Wave 2 COMPLETE is not claimed

---

## Out of scope declarations

- No real exchange execution
- No exchange order APIs
- No exchange balances / positions / portfolio / PnL
- No second Ledger
- No risk engine / leverage / margin / liquidation
- No WebSocket trading / strategy engine
- No Live Trading
- No monitoring / analytics / billing

---

**STOP.** Wait for Product Owner Package Review. Do not declare W2-S04 CLOSED. Do not declare Wave 2 COMPLETE. Do not declare Live Trading.
