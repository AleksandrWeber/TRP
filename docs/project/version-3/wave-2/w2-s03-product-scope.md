# W2-S03 Product Scope

**Package:** W2-S03 Market Data Foundation
**Wave:** 2 — Connection Management
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w2-s03-implementation-package.md`](./w2-s03-implementation-package.md)
**Consumed:** [`w2-s02-product-scope.md`](./w2-s02-product-scope.md) · [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md) · [`connection-management-overview.md`](./connection-management-overview.md)
**Vision (read-only):** [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **providers**, **customer workflows**, **failure philosophy**, and **acceptance** for W2-S03. It does not redesign Exchange Connectivity. It does not redesign Connection Management. It does not reopen Wave 1. It does not revise the Master Plan. It does not introduce trading.

---

## Product purpose

Market Data Foundation is the product package that defines how the product **receives, normalizes, validates, and exposes** market data from supported exchanges after successful Exchange Connectivity.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own monitoring, trading, order execution, portfolio, balances, positions, risk, strategy, paper trading, or analytics.

It does **not** redesign Connection Management or Exchange Connectivity. Operators still open Connections to manage Exchange sessions. They open **Market Data** to view symbols, ticker, candles, and order book.

```text
Connection Management owns the connection product.
Exchange Connectivity owns authenticated session proof.
Vault owns the secrets.
Market Data Foundation owns adapters, normalization, symbols, ticker, candles, order book, health, and provider metadata.
Market data available does NOT mean Trading enabled.
```

---

## Why Market Data Foundation exists (business language)

W2-S02 closed Exchange Connectivity: operators can prove that Binance, Bybit, or OKX accepted an authenticated session. That is not market data.

Paying customers and later product features need an honest answer: can the product show a symbol, a ticker, candles, and an order book from a supported exchange?

This package exists so market data is a reusable product foundation — and so the product never pretends that prices, candles, or a book are trading.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Open Market Data
- Select Binance, Bybit, or OKX
- Choose a symbol
- View ticker
- View candles
- View order book
- See Provider Unavailable when the provider cannot supply data
- See stale handling when data is not current
- Stay inside their workspace and their authorization
- Never receive orders, trading, execution, portfolio, balances, or positions from this package

This package does **not** own Wave 4 complete venue I/O exit, Kraken as offered Core, WebSocket streaming, or Wave 6 live capital.

---

## Consumes

| Product                   | How this package uses it                                         | Must not do                                      |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| **Exchange Connectivity** | Honest Connected session as the prerequisite for market-data use | Redesign handshake, health, or Connected meaning |
| **Connection Management** | Exchange catalog, connection lifecycle, provider selection       | Redesign or replace the facade                   |
| **Vault**                 | Retrieve credentials only if a market-data path requires them    | Duplicate or store secrets locally               |
| **Authentication**        | Only signed-in operators open Market Data                        | Parallel login                                   |
| **Authorization**         | Only permitted roles may view Market Data                        | New IAM                                          |
| **Workspace Isolation**   | Market-data context stays in one workspace                       | Cross-workspace convenience                      |
| **Security Platform**     | Hardening and abuse/rate-limit defaults                          | Fork platform controls                           |
| **Security Audit**        | Attributable market-data read / fail / unavailable               | Own the audit store                              |

---

## Owns

| Outcome                | Customer meaning                                              |
| ---------------------- | ------------------------------------------------------------- |
| Market Data adapters   | Offered exchanges can supply market data through one contract |
| Provider normalization | Binance, Bybit, and OKX payloads become one product model     |
| Market symbols         | Operator chooses a symbol for the selected exchange           |
| Ticker projection      | Operator can view an honest ticker                            |
| Candlestick projection | Operator can view honest candles                              |
| Order Book projection  | Operator can view an honest order book                        |
| Market Data health     | Healthy vs unavailable vs stale is visible                    |
| Provider metadata      | Product shows which provider supplied the data — not trading  |

---

## Does NOT own

| Concern               | Real owner           |
| --------------------- | -------------------- |
| Orders                | Canonical Order Path |
| Trading               | Wave 6 / Order Path  |
| Execution             | Canonical Order Path |
| Portfolio             | Portfolio / later    |
| Balances              | Portfolio / later    |
| Positions             | Portfolio / later    |
| Risk Engine           | Risk                 |
| Strategy Engine       | Strategy / Runtime   |
| Paper Trading         | Version 2 paper path |
| Monitoring            | Wave 3 Monitoring    |
| Analytics             | Later                |
| Secrets               | Vault                |
| Identity              | Authentication       |
| Authentication        | Authentication       |
| Authorization         | Authorization        |
| Workspace             | Workspace            |
| Audit persistence     | Security Audit       |
| Connection Management | W2-S01 (CLOSED)      |
| Exchange Connectivity | W2-S02 (CLOSED)      |

---

## IN Scope

| Item                    | Customer meaning                                    |
| ----------------------- | --------------------------------------------------- |
| Receive market data     | Product receives data from offered exchanges        |
| Normalize provider data | One product model across Binance, Bybit, OKX        |
| Validate before expose  | Malformed or untrusted payloads are not projected   |
| Market symbols          | Choose a symbol for the selected exchange           |
| Ticker                  | Honest ticker projection                            |
| Candles                 | Honest candlestick projection                       |
| Order book              | Honest order-book projection                        |
| Provider unavailable    | Honest unavailable; no fake data                    |
| Stale data handling     | Stale is not current                                |
| Provider metadata       | Which provider supplied the data                    |
| Workspace isolation     | A cannot use B’s market-data context                |
| Authorization           | Unauthorized roles cannot open Market Data          |
| Operator walkthrough    | Manual Market Data Walkthrough                      |
| Security boundaries     | Consume Wave 1, W2-S01, and W2-S02; do not redefine |
| Audit interaction       | Emit market-data read / fail / unavailable          |
| Failure philosophy      | Fail closed; no fake data; no trading claim         |
| Validation strategy     | Slices, Close criteria, evidence, regressions       |

---

## OUT OF Scope

Explicitly out of this package:

| Item                                 | Declaration                  |
| ------------------------------------ | ---------------------------- |
| Order placement                      | **No order placement**       |
| Execution engine                     | **No execution**             |
| Portfolio                            | **No portfolio**             |
| Balances                             | **No balances**              |
| Positions                            | **No positions**             |
| WebSocket trading                    | **No WebSocket trading**     |
| Strategy execution                   | **No strategy execution**    |
| Paper Trading                        | **No paper-trading changes** |
| Monitoring                           | **No monitoring**            |
| Billing                              | **No billing**               |
| Trading                              | **No trading**               |
| Analytics                            | Out                          |
| Risk engine                          | Out                          |
| WebSocket streaming product          | Out                          |
| Secrets store                        | Out (Vault)                  |
| Identity / authn / authz / workspace | Out                          |
| Audit persistence                    | Out                          |
| Connection Management redesign       | Out                          |
| Exchange Connectivity redesign       | Out                          |
| Wave 1 changes                       | Out                          |
| Master Plan changes                  | Out                          |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
Market Data Foundation
        │ consumes
        ├── Exchange Connectivity
        ├── Connection Management
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Security Platform
        └── Security Audit

Market Data Foundation
        │ owns (product outcomes)
        ├── Market Data adapters
        ├── provider normalization
        ├── market symbols
        ├── ticker projection
        ├── candlestick projection
        ├── order-book projection
        ├── Market Data health
        └── provider metadata

Market Data Foundation
        │ does not own
        ├── orders
        ├── trading
        ├── execution
        ├── portfolio
        ├── balances
        ├── positions
        ├── risk engine
        ├── strategy engine
        ├── paper trading
        ├── monitoring
        └── analytics
```

No ownership changes. No new bounded context. Market Data Domain remains the existing owner of public candles and prices. The Connections surface remains Connection Management. Connected remains Exchange Connectivity honesty.

---

## Honesty rules

1. **Market data available** means ticker, candles, and order book were received, normalized, and validated.
2. **Market data available** does **not** mean Trading enabled.
3. **Market data available** does **not** mean orders, balances, or positions are available.
4. **Market data available** does **not** mean live trading, execution, or WebSocket streaming.
5. Exchange **Connected** is **not** Market Data success. Connected remains authenticated communication succeeded.
6. If the provider is unavailable, rate-limited, or data cannot be validated, the product shows Provider Unavailable or failure — never fake projections.
7. Stale data is shown as stale. It is never presented as current.
8. Secrets are never shown, logged, exported, or stored locally.
9. Public market-data paths must not invent a trading key.

---

## Providers planned

| Provider | Offered in W2-S03 | Role                          |
| -------- | ----------------- | ----------------------------- |
| Binance  | Yes               | Market-data receive / project |
| Bybit    | Yes               | Market-data receive / project |
| OKX      | Yes               | Market-data receive / project |

Architecture must remain provider-independent. Design must allow additional providers without redesigning Connection Management, Exchange Connectivity, or this foundation.

Not offered as Core in this package: Kraken, Coinbase, and any unlisted venue.

Do not implement provider adapters, SDKs, WebSockets, or network code in this planning document.

---

## Customer workflows

### Open Market Data

Operator signs in and opens the Market Data product. This is not a second Connections product.

### Select Exchange

Operator selects an offered Exchange provider: Binance, Bybit, or OKX. Selection uses the existing Connection Management catalog and Exchange Connectivity session proof. The operator does not paste secrets.

### Choose Symbol

Operator chooses a market symbol offered by that exchange. Symbols are provider-scoped. The product does not invent symbols or mix venues.

### View Ticker

Operator views the ticker projection for the chosen symbol. The projection is normalized and validated. It is not a trading ticket.

### View Candles

Operator views the candlestick projection for the chosen symbol. The projection is normalized and validated. It is not strategy execution.

### View Order Book

Operator views the order-book projection for the chosen symbol. The projection is normalized and validated. It is not order placement.

### Observe Provider Unavailable

When the provider cannot supply market data, the product shows Provider Unavailable. Fake ticker, candles, or order book are not shown. Secrets are not shown.

### Observe stale data handling

When the last validated data is not current, the product shows stale. Stale is not presented as current. The product does not trade on stale data.

### Verify workspace isolation

An operator in Workspace A cannot open, view, or use Workspace B’s market-data context or exchange connection.

### Verify authorization

A role without permission cannot open Market Data.

---

## Failure philosophy

| Situation                    | Required product behavior                                   |
| ---------------------------- | ----------------------------------------------------------- |
| Missing permission           | Deny — not an empty success                                 |
| Wrong workspace              | Fail closed deny                                            |
| Vault cannot retrieve secret | Fail closed; no local fallback store; no fake data          |
| Provider unavailable         | Honest Provider Unavailable; no fake projections            |
| Rate limited                 | Honest throttled / unavailable; no fake data; do not hammer |
| Malformed provider payload   | Do not project; fail closed                                 |
| Ambiguous freshness          | Do not mark current; show stale or unavailable              |
| Replay of old snapshot       | Reject; client cannot set ticker, candles, or book          |
| Partial outage               | Degrade honestly; do not claim trading                      |

Defaults follow [`../security-default-policy.md`](../security-default-policy.md): default deny, fail closed, least privilege, honest product, everything attributable.

---

## Audit interaction

Market Data Foundation **emits** attributable events for market-data read attempted, succeeded, failed, and provider unavailable.

Security Audit **persists** them. This package does not redesign the audit store.

---

## Product Acceptance Criteria

| #   | Outcome                                                       | Fail if                                 |
| --- | ------------------------------------------------------------- | --------------------------------------- |
| 1   | Operator opens Market Data and selects an offered Exchange    | Second Connections product required     |
| 2   | Operator chooses a symbol for that exchange                   | Symbols invented or mixed across venues |
| 3   | Ticker, candles, and order book are honest projections        | Raw dump, missing projection, or ticket |
| 4   | Provider Unavailable is honest and secret-free                | Fake data or secret in errors           |
| 5   | Stale data is not presented as current                        | Stale claimed current                   |
| 6   | Cross-workspace market data denied                            | Tenant leak                             |
| 7   | Unauthorized Market Data access denied                        | Privilege bypass                        |
| 8   | No orders, trading, execution, portfolio, balances, positions | Trading or portfolio claim              |

---

## Product Walkthrough (operator language)

```text
Market Data Walkthrough

□ Open Market Data
□ Select Exchange
□ Choose Symbol
□ View Ticker
□ View Candles
□ View Order Book
□ Observe Provider Unavailable
□ Observe stale data handling
□ Verify workspace isolation
□ Verify authorization

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Out of scope declarations (binding)

This package does **not** deliver:

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

## Mandatory Questions

1. **What business problem does W2-S03 solve?**
   After successful Exchange Connectivity, the product still cannot honestly provide market data. Operators and later features need normalized symbols, ticker, candles, and order book from supported exchanges.

2. **Which existing products does it consume?**
   Exchange Connectivity, Connection Management, Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

3. **What does W2-S03 own?**
   Market Data adapters, provider normalization, market symbols, ticker projection, candlestick projection, order-book projection, Market Data health, provider metadata.

4. **What is explicitly out of scope?**
   Order placement, execution, portfolio, balances, positions, WebSocket trading, strategy execution, paper trading, monitoring, billing, analytics, risk engine, trading, secrets, identity, authentication, authorization, workspace, audit persistence, Connection Management redesign, Exchange Connectivity redesign, Wave 1 changes.

5. **Which providers are planned?**
   Binance, Bybit, OKX. Architecture must remain provider-independent. Additional providers allowed by design; not offered as Core now.

6. **Does W2-S03 introduce trading?**
   No.

7. **Does W2-S03 modify Wave 1?**
   No.

---

**STOP.** Wait for Product Owner review before W2-S03 implementation planning is approved.
