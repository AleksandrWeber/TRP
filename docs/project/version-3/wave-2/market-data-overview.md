# Market Data Overview

**Document:** Version 3 Market Data Overview
**Date:** 2026-08-26
**Status:** W2-S03-a through W2-S03-d implemented. Remaining Market Data slices not started. Awaiting Product Owner review of W2-S03-d. Not Closed.
**Product:** Market Data Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S03-d delivered foundation

The product can retrieve, normalize, validate, cache, and expose historical OHLCV candlesticks for a selected symbol and interval.

- Operators can open **Market Data**, select an Exchange connection, load symbols, select a symbol, select an interval, load historical candles, and observe freshness.
- Supported intervals: 1m, 5m, 15m, 1h, 4h, 1d. Unsupported intervals are rejected honestly.
- Binance supports candlestick retrieval. Bybit and OKX remain registered and report that candlestick retrieval is not implemented.
- Retrieval failure and Provider Unavailable are honest.
- The product does not show order book, trades, balances, positions, or trading controls.

---

## W2-S03-c delivered foundation

The product can retrieve, normalize, validate, and expose the current ticker for a selected exchange symbol.

- Operators can open **Market Data**, select an Exchange connection, load symbols, select a symbol, load the current ticker, and observe freshness.
- Binance supports ticker retrieval. Bybit and OKX remain registered and report that ticker retrieval is not implemented.

---

## W2-S03-b delivered foundation

The product can retrieve, normalize, validate, and expose tradable symbols from a supported exchange connection.

- Operators can open **Market Data**, select an Exchange connection, load symbols, and browse normalized symbols.
- Binance supports symbol discovery. Bybit and OKX remain registered and report that symbol discovery is not implemented.

---

## W2-S03-a delivered foundation

The product has one Market Data adapter contract for **Binance**, **Bybit**, and **OKX**. Later Market Data features consume that contract. Additional exchanges can be registered later without changing existing adapters.

---

## Purpose

Market Data Foundation is the product that lets a workspace **see honest market data** from a supported exchange after Exchange Connectivity has succeeded.

The operator already manages the connection in **Connections**. This package does not replace that place. It adds **Market Data**: receive, normalize, validate, and expose symbols, ticker, and historical candles now; order book later.

- The operator can today: open Market Data, select Binance / Bybit / OKX connection, load symbols, select a symbol, load ticker, select interval, load historical candles, see freshness, see discovery or retrieval failure, and see provider unavailable.
- The operator cannot yet: view order book from this product journey.
- The operator cannot: place orders, enable trading, run execution, open portfolio, view balances, view positions, open monitoring, or see billing from this package.

```text
Candles available means historical OHLCV was normalized and validated.
Candles available does NOT mean Trading enabled.
Candles available does NOT mean order book is available.
```

---

## What the operator already has

Connection Management is **CLOSED**. The operator can already create an Exchange connection, store credentials securely, and manage lifecycle without editing a server file.

Exchange Connectivity is **CLOSED**. The operator can already prove that an offered exchange accepted an authenticated session. **Connected** means authenticated exchange communication succeeded. It does not mean market data is available.

W2-S03-a is the adapter foundation. W2-S03-b adds symbol discovery. W2-S03-c adds ticker retrieval. W2-S03-d adds historical candlesticks.

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
Select Symbol
  ↓
Load Ticker
  ↓
Select Interval
  ↓
Load Candles
  ↓
Observe freshness
```

Later slices add View Order Book.

### Open Market Data

The operator signs in and opens **Market Data**. Exchange connections still live in **Connections**.

### Select Exchange

The operator selects an offered Exchange connection (Binance, Bybit, or OKX). Selection uses existing Connections. The operator does not paste secrets.

### Load Symbols, Ticker, and Candles

The operator loads symbols, selects a symbol, loads ticker, selects an interval, and loads historical candles. The product does not invent prices or intervals.

---

## Customer Experience

- Happy path: open Market Data, select a Connected Binance connection, load symbols, select a symbol, load ticker, select interval, load candles, see Fresh or Stale honestly.
- If something fails: retrieval failed, Provider Unavailable, unsupported interval, or not implemented for Bybit / OKX. Never fake candles. Never “Trading enabled.”
- What they never have to do: edit `.env`, store keys in a local file, or SSH to a server.

---

## Market Data status (what the operator sees)

| Status                   | What it means to the operator                       |
| ------------------------ | --------------------------------------------------- |
| **Symbols available**    | Tradable symbols were normalized and validated      |
| **Ticker available**     | Current ticker was normalized and validated         |
| **Candles available**    | Historical OHLCV was normalized and validated       |
| **Fresh / Stale**        | Observed exchange age relative to retrieval time    |
| **Provider Unavailable** | The exchange could not supply market data           |
| **Not implemented**      | This provider does not yet support the requested op |
| **Denied**               | Permission or workspace boundary blocked the action |

---

## Providers offered now

| Provider | What the operator can see here                   | What does not happen here   |
| -------- | ------------------------------------------------ | --------------------------- |
| Binance  | Normalized symbols, ticker, and historical OHLCV | Order book, orders, trading |
| Bybit    | Not implemented for symbols / ticker / candles   | Order book, orders, trading |
| OKX      | Not implemented for symbols / ticker / candles   | Order book, orders, trading |

---

## Customer Never Sees

- Not shown: order book, trades stream, order tickets, balances, positions, leverage, live trading controls, WebSocket trading, strategy execution, monitoring, analytics, billing.
- Not offered: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**.

---

## Security Guarantees

- Exchange secrets are not shown after Market Data and are not stored locally by this product.
- A signed-out person cannot open Market Data. One workspace cannot use another workspace’s connection. A role without Projection permission cannot open Market Data.
- Market data is not trading.

---

## What's Next

- W2-S03-e remaining Market Data Close outcomes as sequenced by Product Owner
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

**STOP.** Wait for Product Owner review before W2-S03-e.
