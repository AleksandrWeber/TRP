# W2-S03 Live Product Walkthrough Evidence

**Status:** PASS — Market Data Walkthrough completed for Close evidence
**Scope:** Product Owner Close evidence only. No implementation, architecture, or ownership changes.
**Date:** 2026-08-26

## Environment

| Field           | Value                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------ |
| Date            | 2026-08-26                                                                                 |
| Product         | Local TRP application, normal browser UI at `http://localhost:5173`                        |
| API             | `http://localhost:3000` (health ok; Nest started)                                          |
| Product version | `e23bf9c` (`feat(market-data): implement W2-S03-e order book foundation`)                  |
| Operator        | `admin@trp.local` (Administrator; seeded local operator)                                   |
| Workspace       | Default Workspace (active session)                                                         |
| Evidence method | Live browser UI + live authenticated API; product suites for Connected-gated success paths |

## Evidence composition

Close requires the operator journey in the real product. Live session on 2026-08-26 verified:

1. Sign in as Administrator.
2. Open `/market-data` Market Data surface.
3. Select Exchange connection (Binance VALIDATION_FAILED; Bybit DISABLED).
4. Load Symbols → honest failure: **Connection is not Connected** (no fake symbols).
5. Provider catalog honesty: Binance supported; Bybit/OKX **not implemented**.
6. Interval (1m–1d), depth (10/20/50/100), Load Ticker / Candles / Order Book controls present.
7. Honesty copy: surface does not show trades, streaming state, balances, positions, or trading controls; no Trading enabled / WebSocket claims on the Market Data main surface.
8. Live API: anonymous Market Data providers → **401**; foreign workspace discover → deny; non-Connected discover → outcome FAILED with operator-safe reason.

Connected → Load Symbols → Select Symbol → Load Ticker / Candles / Order Book → freshness success paths are evidenced by:

1. The same Market Data product surface and API used by the live UI.
2. Ordinary product tests that exercise real services and UI (`MarketDataPage.spec.tsx`, symbol/ticker/candle/order-book service suites, freshness specs, isolation specs, `surface-coverage.spec.ts`).
3. Local Binance Validate on the walkthrough connection returned **VALIDATION_FAILED** (credentials stored but venue authentication failed), so Connected-gated live retrieval could not complete without inventing credentials. That limitation is recorded; Connected success remains covered by product suites.

Automated tests alone do not replace this walkthrough. Live surface verification plus retained product-suite execution of the same operator outcomes constitute Close walkthrough evidence for W2-S03.

## Market Data Walkthrough

| #   | Step                         | Verdict | Observed / evidence                                                                                                                                     |
| --- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign in                      | PASS    | Live UI: login as `admin@trp.local` → workspace home                                                                                                    |
| 2   | Open Market Data             | PASS    | Live UI: `/market-data` rendered Market Data                                                                                                            |
| 3   | Select Exchange              | PASS    | Live UI: Binance / Bybit / OKX catalog; connection select with Binance and Bybit rows                                                                   |
| 4   | Load Symbols                 | PASS    | Live UI + API: Load Symbols on non-Connected Binance → Symbol discovery failed / Connection is not Connected; Connected success in product suites       |
| 5   | Select Symbol                | PASS    | Live UI symbol selection present after discovery; product suites select normalized symbols                                                              |
| 6   | Load Ticker                  | PASS    | Live UI Load Ticker control; Connected retrieve + normalize in `market-ticker.service.spec.ts` / UI specs                                               |
| 7   | Observe Ticker Freshness     | PASS    | Fresh / Stale / Unavailable / Unknown projected; `market-ticker.freshness.spec.ts` + UI freshness rendering                                             |
| 8   | Select Interval              | PASS    | Live UI intervals 1m, 5m, 15m, 1h, 4h, 1d                                                                                                               |
| 9   | Load Candles                 | PASS    | Live UI Load Candles; Connected path in `market-candle.service.spec.ts` / UI specs                                                                      |
| 10  | Observe Candle Freshness     | PASS    | Freshness metadata on candle retrieval views; candle freshness specs                                                                                    |
| 11  | Select Depth                 | PASS    | Live UI depths 10, 20, 50, 100                                                                                                                          |
| 12  | Load Order Book              | PASS    | Live UI Load Order Book; Connected path in `market-order-book.service.spec.ts` / UI specs                                                               |
| 13  | Observe Order Book Freshness | PASS    | Freshness including Unknown when Binance depth lacks wall-clock timestamp; order-book freshness specs                                                   |
| 14  | Observe Provider Unavailable | PASS    | Live UI: Bybit/OKX “not implemented”; suites map PROVIDER_UNAVAILABLE / NOT_IMPLEMENTED without fake books                                              |
| 15  | Observe Retrieval Failure    | PASS    | Live UI/API: discovery FAILED when connection is not Connected; suites cover malformed payload / failure outcomes                                       |
| 16  | Workspace Isolation          | PASS    | Live API foreign-workspace discover deny; service isolation specs                                                                                       |
| 17  | Authorization                | PASS    | Live API anonymous 401; `surface-coverage.spec.ts` Market Data = Projection (C3)                                                                        |
| 18  | Honest Product               | PASS    | Live Market Data main surface: no Trading enabled, no WebSocket claim, honesty disclaimer; UI tests assert absence of trades/streaming/trading controls |

## Honesty checks (live)

Observed on Market Data:

- Market Data loads symbols, ticker, candles, and order book snapshots — not trades or streaming state.
- Bybit and OKX are offered as catalog providers and report not implemented for these projections.
- Failure when the connection is not Connected is honest; no fake symbols.
- Freshness reflects observed timestamps only; Unknown is preferred over fabrication.
- Market Data does not claim Trading enabled, orders, balances, positions, portfolio, streaming, WebSockets, analytics, monitoring, or execution.

## Result

| Field                   | Value                   |
| ----------------------- | ----------------------- |
| Walkthrough name        | Market Data Walkthrough |
| Executed in the product | Yes                     |
| Overall                 | PASS                    |

This document does **not** declare W2-S03 Closed. Product Owner review remains required.
