# Market Data Overview

**Document:** Version 3 Market Data Overview
**Date:** 2026-08-26
**Status:** W2-S03 Market Data Foundation implemented through W2-S03-e. Close package prepared. Ready for Product Owner Close Review. Not Closed.
**Product:** Market Data Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.
**Close evidence:** [`w2-s03-close-report.md`](./w2-s03-close-report.md) · [`w2-s03-live-product-walkthrough.md`](./w2-s03-live-product-walkthrough.md)

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S03-e delivered foundation

The product can retrieve, normalize, validate, cache, and expose the current Order Book snapshot for a selected symbol and depth.

- Operators can open **Market Data**, select an Exchange connection, load symbols, select a symbol, select depth, load the order book, and observe freshness.
- Supported depths: 10, 20, 50, 100. Unsupported depths are rejected honestly.
- Binance supports order book snapshot retrieval. Bybit and OKX remain registered and report that order book retrieval is not implemented.
- Retrieval failure and Provider Unavailable are honest.
- The product does not show trades, streaming state, balances, positions, or trading controls.

---

## W2-S03-d delivered foundation

The product can retrieve, normalize, validate, cache, and expose historical OHLCV candlesticks for a selected symbol and interval.

- Supported intervals: 1m, 5m, 15m, 1h, 4h, 1d.
- Binance supports candlestick retrieval. Bybit and OKX remain registered and report not implemented.

---

## W2-S03-c delivered foundation

The product can retrieve, normalize, validate, and expose the current ticker for a selected exchange symbol.

---

## W2-S03-b delivered foundation

The product can retrieve, normalize, validate, and expose tradable symbols from a supported exchange connection.

---

## W2-S03-a delivered foundation

The product has one Market Data adapter contract for **Binance**, **Bybit**, and **OKX**.

---

## Purpose

Market Data Foundation is the product that lets a workspace **see honest market data** from a supported exchange after Exchange Connectivity has succeeded.

The operator already manages the connection in **Connections**. This package does not replace that place. It adds **Market Data**: receive, normalize, validate, and expose symbols, ticker, historical candles, and order book snapshots.

- The operator can today: open Market Data, select Binance / Bybit / OKX connection, load symbols, select a symbol, load ticker, select interval, load candles, select depth, load order book, see freshness, and see honest failure or provider unavailable.
- The operator cannot: place orders, enable trading, run execution, open portfolio, view balances, view positions, open monitoring, see billing, stream depth, or view trades from this package.

```text
Order book available means a snapshot was normalized and validated.
Order book available does NOT mean Trading enabled.
Order book available does NOT mean streaming or trades are available.
```

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
Select Interval → Load Candles
  ↓
Select Depth → Load Order Book
  ↓
Observe freshness
```

---

## Providers offered now

| Provider | What the operator can see here                              | What does not happen here      |
| -------- | ----------------------------------------------------------- | ------------------------------ |
| Binance  | Symbols, ticker, historical OHLCV, order book snapshot      | Trades stream, orders, trading |
| Bybit    | Not implemented for symbols / ticker / candles / order book | Trades stream, orders, trading |
| OKX      | Not implemented for symbols / ticker / candles / order book | Trades stream, orders, trading |

---

## Customer Never Sees

- Not shown: trades stream, streaming state, order tickets, balances, positions, leverage, live trading controls, WebSocket trading, strategy execution, monitoring, analytics, billing.
- Not offered: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**.

---

## Security Guarantees

- Exchange secrets are not shown after Market Data and are not stored locally by this product.
- A signed-out person cannot open Market Data. One workspace cannot use another workspace’s connection. A role without Projection permission cannot open Market Data.
- Market data is not trading.

---

## What's Next

- Product Owner Close Review for W2-S03 (only the Product Owner may declare Closed)
- Remaining Wave 2 sequencing after Close
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

**STOP.** Wait for Product Owner Close Review. Do not declare W2-S03 CLOSED. Do not declare Wave 2 COMPLETE.
