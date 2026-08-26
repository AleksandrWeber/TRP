# Paper Trading Overview

**Document:** Version 3 Paper Trading Overview
**Date:** 2026-08-26
**Status:** W2-S04 planning **APPROVED**. W2-S04-a **APPROVED**. W2-S04-b **APPROVED**. W2-S04-c **APPROVED**. W2-S04-d Paper Positions, Portfolio & PnL Foundation implemented. Awaiting Product Owner slice review before W2-S04-e. Not Close.
**Product:** Paper Trading Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.
**Slice evidence:** [`w2-s04-a-implementation-report.md`](./w2-s04-a-implementation-report.md) · [`w2-s04-b-implementation-report.md`](./w2-s04-b-implementation-report.md) · [`w2-s04-c-implementation-report.md`](./w2-s04-c-implementation-report.md) · [`w2-s04-d-implementation-report.md`](./w2-s04-d-implementation-report.md) · [`w2-s04-d-validation-report.md`](./w2-s04-d-validation-report.md)

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S04-a delivered foundation

The product can create and view a workspace-owned Paper Account.

- Operators can open **Paper Trading**, create exactly one Paper Account per workspace, view Status, Currency (USD), Starting Balance, Current Balance, and Owner, and disable or activate the account.
- Statuses: Not Created, Active, Disabled.
- Paper balances are simulated only. They never represent real money.

```text
Paper Account Active means a simulated workspace account exists.
Paper Account Active does NOT mean Live Trading.
```

---

## W2-S04-b delivered foundation

The product can create and manage Paper Orders as trading intent.

- Operators can create Limit / Market / Stop / Stop Limit Buy or Sell orders, list them, review them, and cancel Draft or Pending orders.
- Statuses: Draft, Pending, Cancelled, Rejected, Filled.
- **Pending** means accepted by Paper Trading as intent — not yet matched.
- Symbols must be known from Market Data for the selected offered exchange.

```text
Paper Order Pending means trading intent was accepted.
Paper Order Pending does NOT mean exchange acceptance or Live Trading.
```

---

## W2-S04-c delivered foundation

The product can simulate execution of Pending Paper Orders using Market Data.

- Operators can review Pending Orders, run **Execute Matching**, and **View Paper Fill**.
- Matching uses Market Data ticker snapshots only (FRESH bid/ask/last).
- A Paper Fill records local simulated execution. It does not claim exchange acceptance.

```text
Paper Fill means local simulated execution based on Market Data.
Paper Fill does NOT mean the exchange accepted an order.
```

---

## W2-S04-d delivered foundation

The product can observe paper trading state derived from Paper Fills.

- Operators can view **Paper Positions**, **Paper Portfolio**, **Paper Balance**, **Realized PnL**, **Unrealized PnL**, and **Execution History**.
- Positions are derived only from Paper Fills.
- Portfolio is derived from Positions plus paper cash.
- Paper Balance (cash) updates from fill notionals against Starting Balance.
- Unrealized PnL uses FRESH Market Data last prices; unavailable marks fail honestly (no invented prices).
- Client cannot set Position, Portfolio, PnL, or Balance values.

```text
Paper Portfolio / Positions / Balance / PnL are simulated projections only.
They do NOT represent exchange assets, real capital, or exchange profit.
Execution History is local Paper Fill history only.
```

---

## Purpose

Paper Trading Foundation is the product that lets a workspace **safely test strategies, signals, and workflows** using simulated execution driven by real Market Data.

- The operator can today: open Paper Trading, create a Paper Account, create/review/list/cancel Paper Orders, execute matching, view Paper Fills, and observe Positions, Portfolio, Balance, PnL, and Execution History.
- The operator cannot: place live exchange orders, move real capital, enable Live Trading, use leverage or margin, open a risk or strategy engine, stream trading WebSockets, or claim exchange balances or exchange positions from this package.

```text
Paper fill means simulated execution used a Market Data snapshot.
Paper fill does NOT mean the exchange accepted an order.
Paper trading does NOT mean Live Trading enabled.
Paper trading uses real Market Data. It never invents market prices.
```

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

## Customer Journey (current through W2-S04-d)

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
View Paper Fill
  ↓
Observe Positions / Portfolio / Balance / PnL
  ↓
Review Execution History
```

### Observe Position / PnL / Portfolio

After fills, the operator sees paper positions, paper portfolio, paper balance, and paper PnL. These are simulated projections — not exchange inventory.

### Workspace isolation and authorization

Workspace A cannot observe Workspace B’s paper accounts, orders, fills, positions, or portfolio. Unauthorized roles are denied.

---

## Customer Never Sees

- Not shown: live exchange order tickets, real capital moves, exchange balances, exchange positions, exchange portfolio, exchange PnL, leverage, margin, liquidation, WebSocket trading streams, strategy engine controls, monitoring product, analytics product, billing.
- Not offered: **Live Trading enabled**, **Exchange order placed**, **Real capital committed**, **Exchange accepted**.

---

## Security Guarantees

- Paper accounts, orders, fills, positions, and portfolio are workspace-owned.
- Only authorized roles may open Paper Trading or mutate paper orders / execute matching.
- Market prices come from Market Data. Client-supplied fill prices or PnL are rejected.
- Unavailable or stale Market Data fails honestly for unrealized marks.
- Audit attributes fill, position, portfolio, balance, and PnL updates.
- No real capital. No exchange order placement from this product.

---

## What's Next

- Product Owner review of W2-S04-d
- W2-S04-e only after approval (Close evidence / walkthrough — not started)
- Live Trading stays later (Wave 6 / Order Path)
- Wave 2 COMPLETE is not claimed

Wave 1 Security Foundation is **CERTIFIED COMPLETE** and is consumed, not reopened.
W2-S01 / W2-S02 / W2-S03 remain **CLOSED** and are consumed, not redesigned.

---

## Out of scope declarations

This product does **not** include:

- No real exchange execution
- No exchange order APIs
- No exchange balances
- No exchange positions
- No exchange portfolio
- No exchange PnL
- No risk engine
- No leverage
- No margin engine
- No liquidation
- No WebSocket trading
- No strategy engine
- No Live Trading
- No monitoring
- No analytics
- No billing
- No second Ledger

---

**STOP.** Wait for Product Owner review before W2-S04-e.
