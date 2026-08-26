# Market Data Overview

**Document:** Version 3 Market Data Overview
**Date:** 2026-08-26
**Status:** W2-S03-a adapter foundation and W2-S03-b symbol discovery implemented. Remaining Market Data slices not started. Awaiting Product Owner review of W2-S03-b. Not Closed.
**Product:** Market Data Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S03-b delivered foundation

The product can retrieve, normalize, validate, and expose tradable symbols from a supported exchange connection.

- Operators can open **Market Data**, select an Exchange connection, load symbols, and browse normalized symbols.
- Binance supports symbol discovery. Bybit and OKX remain registered and report that symbol discovery is not implemented.
- Discovery failure and Provider Unavailable are honest.
- The product does not show ticker, candles, order book, balances, positions, or trading controls.

---

## W2-S03-a delivered foundation

The product has one Market Data adapter contract for **Binance**, **Bybit**, and **OKX**. Later Market Data features consume that contract. Additional exchanges can be registered later without changing existing adapters.

---

## Purpose

Market Data Foundation is the product that lets a workspace **see honest market data** from a supported exchange after Exchange Connectivity has succeeded.

The operator already manages the connection in **Connections**. This package does not replace that place. It adds **Market Data**: receive, normalize, validate, and expose symbols now; ticker, candles, and order book later.

- The operator can today: open Market Data, select Binance / Bybit / OKX connection, load symbols, browse normalized symbols, see discovery failure, and see provider unavailable.
- The operator cannot yet: view ticker, candles, or order book from this product journey.
- The operator cannot: place orders, enable trading, run execution, open portfolio, view balances, view positions, open monitoring, or see billing from this package.

```text
Symbols available means tradable symbols were normalized and validated.
Symbols available does NOT mean Trading enabled.
Symbols available does NOT mean ticker, candles, or order book are available.
```

---

## What the operator already has

Connection Management is **CLOSED**. The operator can already create an Exchange connection, store credentials securely, and manage lifecycle without editing a server file.

Exchange Connectivity is **CLOSED**. The operator can already prove that an offered exchange accepted an authenticated session. **Connected** means authenticated exchange communication succeeded. It does not mean market data is available.

W2-S03-a is the adapter foundation. W2-S03-b adds symbol discovery.

---

## Customer Journey (current)

```text
Sign in
  ↓
Open Market Data
  ↓
Select Exchange connection
  ↓
Load Symbols
  ↓
Browse normalized symbols
```

Later slices add Choose Symbol → View Ticker → View Candles → View Order Book.

### Open Market Data

The operator signs in and opens **Market Data**. Exchange connections still live in **Connections**.

### Select Exchange

The operator selects an offered Exchange connection (Binance, Bybit, or OKX). Selection uses existing Connections. The operator does not paste secrets.

### Load Symbols

The operator loads symbols for that connection. Symbols are provider-scoped and normalized. The product does not invent symbols and does not mix venues.

### Browse normalized symbols

The operator sees exchange symbol, normalized symbol, base asset, quote asset, trading status, and provider. No prices.

---

## Customer Experience

- Happy path: open Market Data, select a Connected Binance connection, load symbols, browse the list.
- If something fails: discovery failed, Provider Unavailable, or not implemented for Bybit / OKX. Never fake symbols. Never “Trading enabled.”
- What they never have to do: edit `.env`, store keys in a local file, or SSH to a server.

---

## Market Data status (what the operator sees)

| Status                   | What it means to the operator                       |
| ------------------------ | --------------------------------------------------- |
| **Symbols available**    | Tradable symbols were normalized and validated      |
| **Provider Unavailable** | The exchange could not supply symbols               |
| **Not implemented**      | This provider does not yet support symbol discovery |
| **Denied**               | Permission or workspace boundary blocked the action |

---

## Providers offered now

| Provider | What the operator can see here | What does not happen here              |
| -------- | ------------------------------ | -------------------------------------- |
| Binance  | Normalized symbols             | Ticker, candles, book, orders, trading |
| Bybit    | Not implemented for symbols    | Ticker, candles, book, orders, trading |
| OKX      | Not implemented for symbols    | Ticker, candles, book, orders, trading |

---

## Customer Never Sees

- Not shown: ticker, candles, order book, order tickets, balances, positions, leverage, live trading controls, WebSocket trading, strategy execution, monitoring, analytics, billing.
- Not offered: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**.

---

## Security Guarantees

- Exchange secrets are not shown after Market Data and are not stored locally by this product.
- A signed-out person cannot open Market Data. One workspace cannot use another workspace’s connection. A role without Projection permission cannot open Market Data.
- Market data is not trading.

---

## What's Next

- W2-S03-c ticker, candles, and order-book projections (after Product Owner review)
- Remaining Market Data slices as sequenced by Product Owner
- Trading stays later

Wave 1 Security Foundation is **CERTIFIED COMPLETE** and is consumed, not reopened.
W2-S01 Connection Management is **CLOSED** and is consumed, not redesigned.
W2-S02 Exchange Connectivity is **CLOSED** and is consumed, not redesigned.

---

## Out of scope declarations

This product does **not** include:

- No order placement
- No execution
- No portfolio
- No balances
- No positions
- No WebSocket trading
- No strategy execution
- No paper trading
- No monitoring
- No billing

---

**STOP.** Wait for Product Owner review before W2-S03-c.
