# Paper Trading Overview

**Document:** Version 3 Paper Trading Overview
**Date:** 2026-08-26
**Status:** W2-S04 planning **APPROVED**. W2-S04-a Paper Account Foundation implemented. Awaiting Product Owner slice review before W2-S04-b. Not Close.
**Product:** Paper Trading Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.
**Slice evidence:** [`w2-s04-a-implementation-report.md`](./w2-s04-a-implementation-report.md) · [`w2-s04-a-validation-report.md`](./w2-s04-a-validation-report.md)

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S04-a delivered foundation

The product can create and view a workspace-owned Paper Account.

- Operators can open **Paper Trading**, create exactly one Paper Account per workspace, view Status, Currency (USD), Starting Balance, Current Balance, and Owner, and disable or activate the account.
- Statuses: Not Created, Active, Disabled.
- Paper balances are informational only. They never represent real money.
- The account exists independently of Exchange Connections.
- The product does not show orders, positions, portfolio, PnL, or trading controls from this slice.

```text
Paper Account Active means a simulated workspace account exists.
Paper Account Active does NOT mean Orders, Positions, PnL, or Live Trading.
```

---

## Purpose

Paper Trading Foundation is the product that lets a workspace **safely test strategies, signals, and workflows** using simulated execution driven by real Market Data.

The operator already manages Exchange connections in **Connections**, proves connectivity in Exchange Connectivity, and views honest market data in **Market Data**. This package does not replace those places. It adds **Paper Trading**: paper accounts, simulated buy and sell, fills, positions, PnL, and portfolio — without placing real exchange orders and without real capital.

- The operator can today: open Paper Trading, create a Paper Account, view currency, starting balance, current balance, and status, and disable or activate the account.
- The operator cannot yet: select Exchange/Symbol for paper execution, place Buy/Sell, observe fills, positions, PnL, or portfolio, or cancel paper orders (later slices).
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

## Customer Journey (current through W2-S04-a)

```text
Sign in
  ↓
Open Paper Trading
  ↓
Create Paper Account
  ↓
View Status / Currency / Balances
  ↓
Disable or Activate (optional)
```

Later slices add Select Exchange / Symbol, Place Buy / Sell, Fill, Position, PnL, Portfolio, and Cancel Order.

### Sign in

The operator signs in. Anonymous Paper Trading is denied.

### Open Paper Trading

The operator opens **Paper Trading**. This is not Connections, not Market Data, and not Live Trading.

### Create Paper Account

The operator creates a Paper Account in the current workspace. Paper balances and portfolio state belong to that paper account. They are not exchange balances.

### Select Exchange

The operator selects an offered Exchange using the existing Connection Management catalog and Exchange Connectivity session context. Secrets are not pasted again.

### Select Symbol

The operator selects a symbol offered through Market Data for that exchange. Symbols are not invented. Prices are not invented.

### Place Buy / Place Sell

The operator places a paper Buy or Sell. The product simulates execution using Market Data snapshots. No real exchange order API is called. No “exchange accepted” message is simulated as if the venue took the order.

### Observe Fill

When the simulator matches against Market Data, the operator sees a paper fill. A fill is local simulation evidence — not venue confirmation.

### Observe Position / PnL / Portfolio

The operator sees paper position, PnL, and portfolio derived from paper fills and paper account state.

### Cancel Order

The operator can cancel an open paper order. Cancel does not cancel anything on an exchange.

### Workspace isolation and authorization

Workspace A cannot use Workspace B’s paper accounts. A role without Paper Trading permission is denied.

---

## Customer Never Sees

- Not shown: live exchange order tickets, real capital moves, exchange balances, exchange positions, leverage, margin, liquidation, WebSocket trading streams, strategy engine controls, monitoring product, analytics product, billing.
- Not offered: **Live Trading enabled**, **Exchange order placed**, **Real capital committed**, **Exchange accepted**.

---

## Security Guarantees (planned)

- Paper accounts are workspace-owned. Cross-workspace paper use is denied.
- Only authorized roles may open Paper Trading or mutate paper orders.
- Market prices come from Market Data. Client-supplied prices are rejected.
- Replay of old market snapshots or forged fills cannot rewrite paper integrity.
- Audit attributes who created accounts, placed, filled, cancelled, and failed.
- No real capital. No exchange order placement from this product.

---

## What's Next

- Product Owner review of W2-S04-a
- W2-S04-b only after approval (simulators)
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

**STOP.** Wait for Product Owner review before W2-S04-b.
