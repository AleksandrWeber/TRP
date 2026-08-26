# Paper Trading Overview

**Document:** Version 3 Paper Trading Overview
**Date:** 2026-08-26
**Status:** W2-S04 planning **APPROVED**. W2-S04-a **APPROVED**. W2-S04-b **APPROVED**. W2-S04-c Paper Execution & Matching Foundation implemented. Awaiting Product Owner slice review before W2-S04-d. Not Close.
**Product:** Paper Trading Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.
**Slice evidence:** [`w2-s04-a-implementation-report.md`](./w2-s04-a-implementation-report.md) · [`w2-s04-b-implementation-report.md`](./w2-s04-b-implementation-report.md) · [`w2-s04-c-implementation-report.md`](./w2-s04-c-implementation-report.md) · [`w2-s04-c-validation-report.md`](./w2-s04-c-validation-report.md)

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S04-a delivered foundation

The product can create and view a workspace-owned Paper Account.

- Operators can open **Paper Trading**, create exactly one Paper Account per workspace, view Status, Currency (USD), Starting Balance, Current Balance, and Owner, and disable or activate the account.
- Statuses: Not Created, Active, Disabled.
- Paper balances are informational only. They never represent real money.
- The account exists independently of Exchange Connections.

```text
Paper Account Active means a simulated workspace account exists.
Paper Account Active does NOT mean fills, Positions, PnL, or Live Trading.
```

---

## W2-S04-b delivered foundation

The product can create and manage Paper Orders as trading intent.

- Operators can create Limit / Market / Stop / Stop Limit Buy or Sell orders, list them, review them, and cancel Draft or Pending orders.
- Statuses: Draft, Pending, Cancelled, Rejected (Filled added in W2-S04-c).
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
- Matching uses Market Data ticker snapshots only (FRESH bid/ask/last). No replay. No streaming. No fabricated or interpolated prices.
- A Paper Fill records local simulated execution. It does not claim exchange acceptance.
- Status **Filled** means a Paper Fill was created from Market Data — nothing more.
- The product does not show Positions, Portfolio, PnL, or balance changes from this slice.

```text
Paper Fill means local simulated execution based on Market Data.
Paper Fill does NOT mean the exchange accepted an order.
Paper Fill does NOT mean Positions, Portfolio, PnL, or Live Trading.
```

---

## Purpose

Paper Trading Foundation is the product that lets a workspace **safely test strategies, signals, and workflows** using simulated execution driven by real Market Data.

The operator already manages Exchange connections in **Connections**, proves connectivity in Exchange Connectivity, and views honest market data in **Market Data**. This package does not replace those places. It adds **Paper Trading**: paper accounts, simulated buy and sell, fills, and later positions, PnL, and portfolio — without placing real exchange orders and without real capital.

- The operator can today: open Paper Trading, create a Paper Account, create/review/list/cancel Paper Orders, execute matching, and view Paper Fills.
- The operator cannot yet: observe Positions, Portfolio, or PnL from paper fills (later slices).
- The operator cannot: place live exchange orders, move real capital, enable Live Trading, use leverage or margin, open a risk or strategy engine, stream trading WebSockets, or claim exchange balances or exchange positions from this package.

```text
Paper fill means simulated execution used a Market Data snapshot.
Paper fill does NOT mean the exchange accepted an order.
Paper trading does NOT mean Live Trading enabled.
Paper trading uses real Market Data. It never fabricates market prices.
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

## Customer Journey (current through W2-S04-c)

```text
Sign in
  ↓
Open Paper Trading
  ↓
Create Paper Account
  ↓
Create Paper Order
  ↓
Review / List Orders
  ↓
Execute Matching (Pending)
  ↓
View Paper Fill
  ↓
Cancel Order (optional, before fill)
```

Later slices add positions, PnL, and portfolio.

### Sign in

The operator signs in. Anonymous Paper Trading is denied.

### Open Paper Trading

The operator opens **Paper Trading**. This is not Connections, not Market Data, and not Live Trading.

### Create Paper Account

The operator creates a Paper Account in the current workspace. Paper balances belong to that paper account. They are not exchange balances. Balance does not change on fill in this slice.

### Select Exchange

The operator selects an offered Exchange using the existing Connection Management catalog and Exchange Connectivity session context. Secrets are not pasted again.

### Select Symbol

The operator selects a symbol offered through Market Data for that exchange. Symbols are not invented. Prices are not invented.

### Place Buy / Place Sell

The operator places a paper Buy or Sell. Pending means intent accepted. No real exchange order API is called.

### Execute Matching / Observe Fill

The operator runs Execute Matching. The product matches against a Market Data ticker snapshot. When matched, the operator sees a Paper Fill. A fill is local simulation evidence — not venue confirmation.

### Observe Position / PnL / Portfolio

Not available yet (W2-S04-d).

### Cancel Order

The operator can cancel a Draft or Pending paper order. Cancel does not cancel anything on an exchange. Filled orders are not cancelled.

### Workspace isolation and authorization

Workspace A cannot use Workspace B’s paper accounts, orders, or fills. A role without Paper Trading permission is denied.

---

## Customer Never Sees

- Not shown: live exchange order tickets, real capital moves, exchange balances, exchange positions, leverage, margin, liquidation, WebSocket trading streams, strategy engine controls, monitoring product, analytics product, billing.
- Not offered: **Live Trading enabled**, **Exchange order placed**, **Real capital committed**, **Exchange accepted**.
- Not yet from this foundation: Positions, Portfolio, PnL (later slices).

---

## Security Guarantees

- Paper accounts, orders, and fills are workspace-owned. Cross-workspace use is denied.
- Only authorized roles may open Paper Trading or mutate paper orders / execute matching.
- Market prices come from Market Data. Client-supplied fill prices are rejected.
- Unavailable or stale Market Data fails honestly — no fabricated prices.
- Audit attributes who created fills and who completed or rejected execution.
- No real capital. No exchange order placement from this product.

---

## What's Next

- Product Owner review of W2-S04-c
- W2-S04-d only after approval (Positions / Portfolio / PnL — not started)
- Live Trading stays later (Wave 6 / Order Path)
- Wave 2 COMPLETE is not claimed

Wave 1 Security Foundation is **CERTIFIED COMPLETE** and is consumed, not reopened.
W2-S01 Connection Management is **CLOSED** and is consumed, not redesigned.
W2-S02 Exchange Connectivity is **CLOSED** and is consumed, not redesigned.
W2-S03 Market Data Foundation is **CLOSED** and is consumed, not redesigned.

---

## Out of scope declarations

This product does **not** include:

- No real exchange execution
- No exchange order APIs
- No exchange balances
- No exchange positions
- No exchange portfolio
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

---

**STOP.** Wait for Product Owner review before W2-S04-d.
