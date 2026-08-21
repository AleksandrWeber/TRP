# Market Data Overview

**Document:** Version 3 Market Data Overview
**Date:** 2026-08-21
**Status:** Product-facing record of W2-S03 Implementation Package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Product:** Market Data Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Market Data Foundation is the product that lets a workspace **see honest market data** from a supported exchange after Exchange Connectivity has succeeded.

The operator already manages the connection in **Connections**. This package does not replace that place. It adds **Market Data**: receive, normalize, validate, and expose symbols, ticker, candles, and order book.

- The operator can: open Market Data, select Binance, Bybit, or OKX, choose a symbol, view ticker, view candles, view order book, see Provider Unavailable, and see stale handling.
- The operator cannot: place orders, enable trading, run execution, open portfolio, view balances, view positions, open monitoring, or see billing from this package.
- Why it exists, in business language: Connected is not prices. Paying customers and later product features need honest market data.
- If market data cannot run: the rest of the product does not pretend ticker, candles, or an order book are available. Trading remains unavailable here.

```text
Market data available means ticker, candles, and order book were validated.
Market data available does NOT mean Trading enabled.
```

---

## What the operator already has

Connection Management is **CLOSED**. The operator can already create an Exchange connection, store credentials securely, and manage lifecycle without editing a server file.

Exchange Connectivity is **CLOSED**. The operator can already prove that an offered exchange accepted an authenticated session. **Connected** means authenticated exchange communication succeeded. It does not mean market data is available.

W2-S03 is planning. Implementation has not started.

---

## Customer Journey

```text
Sign in
  ↓
Open Market Data
  ↓
Select Exchange
  ↓
Choose Symbol
  ↓
View Ticker
  ↓
View Candles
  ↓
View Order Book
```

### Open Market Data

The operator signs in and opens **Market Data**. Exchange connections still live in **Connections**. There is no second Connections product to learn.

### Select Exchange

The operator selects one offered provider: **Binance**, **Bybit**, or **OKX**. Additional exchanges may be added later without a new Connections product and without redesigning Market Data.

### Choose Symbol

The operator chooses a market symbol offered by that exchange. The product does not invent symbols and does not mix one exchange’s symbols with another’s.

### View Ticker

The operator views the ticker for the chosen symbol. That is a validated projection. It is **not** a trade. It is **not** Trading enabled.

### View Candles

The operator views candles for the chosen symbol. That is a validated projection. It is **not** strategy execution.

### View Order Book

The operator views the order book for the chosen symbol. That is a validated projection. It is **not** order placement.

---

## Customer Experience

- Happy path (plain language): open Market Data, select Binance, Bybit, or OKX, choose a symbol, view ticker, candles, and order book.
- If something fails, what they see (honest; no fake success): Provider Unavailable if the exchange cannot supply data; stale if the last validated data is not current; deny if the role or workspace is wrong. Never “Trading enabled.” Never “order sent.” Never “balances loaded.”
- What they never have to do: edit `.env`, store keys in a local file, SSH to a server, or ask an engineer to scrape a venue.
- Paper remains the default: Market Data does not turn on trading.

---

## Market Data status (what the operator sees)

| Status                    | What it means to the operator                       |
| ------------------------- | --------------------------------------------------- |
| **Market data available** | Ticker, candles, and order book were validated      |
| **Provider Unavailable**  | The exchange could not supply market data           |
| **Stale**                 | Last validated data is not current                  |
| **Denied**                | Permission or workspace boundary blocked the action |

Market data available is not Trading enabled. A ticker is not an order. Candles are not a strategy. An order book is not execution.

---

## Providers offered now

| Provider | What the operator can see here                 | What does not happen here            |
| -------- | ---------------------------------------------- | ------------------------------------ |
| Binance  | Symbols, ticker, candles, order book (planned) | Orders, trading, balances, positions |
| Bybit    | Symbols, ticker, candles, order book (planned) | Orders, trading, balances, positions |
| OKX      | Symbols, ticker, candles, order book (planned) | Orders, trading, balances, positions |

Later providers can use the same receive / normalize / project meaning. They are not offered as Core in this package.

---

## Customer Never Sees

- Not shown as finished products here: order tickets, balances, positions, leverage, live trading controls, WebSocket trading, strategy execution, paper-trading changes, monitoring walls, analytics, billing.
- Not offered as a button or implied state: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**, **Live trading connected**, **Execution ready**.
- Owner later: Trading; Order Path; Portfolio; Monitoring; Analytics; Billing; WebSocket streaming product.

Do not list internal types, routes, or table names here.

---

## Security Guarantees

- What stays private: exchange secrets are not shown after Market Data, not offered as export, and not stored in a local file. Public market data does not invent a trading key.
- What stops working when it should: a signed-out person cannot open Market Data. One workspace cannot use another workspace’s market-data context. A role that is not allowed cannot open Market Data. Provider Unavailable is not filled with fake data. Stale is not shown as current.
- What the product will not pretend: market data is not trading; it is not balances; it is not live capital.
- What this overview does **not** claim: Wave 3 monitoring, Wave 4 complete venue I/O exit, Wave 6 live capital, billing.
- What still works if Market Data cannot run: sign-in, Connection Management, Exchange Connectivity, paper trading, and research.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## Operator walkthroughs

### Open Market Data

```text
□ Sign in
□ Open Market Data
```

### Select Exchange

```text
□ Choose Binance, Bybit, or OKX
```

### Choose Symbol

```text
□ Choose a symbol offered by that exchange
```

### View Ticker

```text
□ See ticker
□ Confirm it does not say Trading enabled
```

### View Candles

```text
□ See candles
□ Confirm it is not strategy execution
```

### View Order Book

```text
□ See order book
□ Confirm it is not order placement
```

### Observe Provider Unavailable

```text
□ Provider cannot supply data
□ Status is Provider Unavailable
□ Fake ticker, candles, or book are not shown
□ Secret is not shown
```

### Observe stale data handling

```text
□ Last validated data is not current
□ Status is stale
□ Stale is not presented as current
```

### Workspace isolation

```text
□ Workspace A Market Data is not usable from Workspace B
```

### Authorization

```text
□ Role without permission cannot open Market Data
```

---

## What's Next

After Market Data Foundation ships its product outcomes:

- Remaining Wave 2 work as sequenced by Product Owner
- Later named Exchange Connectivity and market-data streaming outcomes stay later
- Trading stays later and is not introduced here

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

## Mandatory Questions (short)

1. **Problem solved:** After Exchange Connectivity, honestly provide market data — symbols, ticker, candles, and order book.
2. **Consumed:** Exchange Connectivity, Connection Management, Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.
3. **Owns:** Adapters, normalization, symbols, ticker, candles, order book, health, provider metadata.
4. **Does not own:** Orders, trading, execution, portfolio, balances, positions, risk, strategy, paper trading, monitoring, analytics.
5. **Providers planned:** Binance, Bybit, OKX. Architecture remains provider-independent.
6. **Trading:** No.
7. **Wave 1 modified:** No.

---

**STOP.** Wait for Product Owner review before W2-S03 implementation planning is approved.
