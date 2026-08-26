# W2-S04 Product Scope

**Package:** W2-S04 Paper Trading Foundation
**Wave:** 2 — Connection Management
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w2-s04-implementation-package.md`](./w2-s04-implementation-package.md)
**Consumed:** [`w2-s03-product-scope.md`](./w2-s03-product-scope.md) · [`market-data-overview.md`](./market-data-overview.md) · [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md) · [`connection-management-overview.md`](./connection-management-overview.md)
**Vision (read-only):** [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W2-S04. It does not redesign Market Data. It does not redesign Exchange Connectivity. It does not redesign Connection Management. It does not reopen Wave 1. It does not revise the Master Plan. It does not introduce Live Trading.

---

## Product purpose

Paper Trading Foundation is the product package that defines how the product **simulates order execution using Market Data** without placing real exchange orders and without real capital.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own Market Data adapters, ticker, candles, or order-book projections.

It does **not** own Connection Management or Exchange Connectivity.

It does **not** own Live Trading, real exchange order placement, real balances, exchange positions, risk engine, leverage, margin, liquidation, strategy engine, monitoring, analytics, or billing.

```text
Connection Management owns the connection product.
Exchange Connectivity owns authenticated session proof.
Market Data Foundation owns honest market prices and books.
Paper Trading Foundation owns paper orders, fills, positions, portfolio, balances, simulators, PnL, account state, and execution history.
Paper fill does NOT mean the exchange accepted an order.
Paper trading does NOT mean Live Trading enabled.
```

---

## Why Paper Trading Foundation exists (business language)

W2-S03 closed Market Data: operators can see honest symbols, ticker, candles, and order-book snapshots. That is not simulated execution.

Paying customers need a safe place to test strategies, signals, and workflows against real Market Data without risking capital and without calling exchange order APIs.

This package exists so Paper Trading is the mandatory foundation before Live Trading — and so the product never pretends a paper fill is an exchange acceptance or that paper balances are real capital.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Open Paper Trading
- Create a Paper Account
- Select Exchange and Symbol
- Place Buy and Sell as paper orders
- Observe Fill, Position, PnL, and Portfolio
- Cancel an open paper order
- Stay inside their workspace and their authorization
- Never place a real exchange order or move real capital from this package

This package does **not** own Live Trading, leverage, margin, liquidation, risk engine, strategy engine, WebSocket trading, monitoring, analytics, or billing.

---

## Consumes

| Product                    | How this package uses it                                   | Must not do                                             |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| **Market Data Foundation** | Execution uses Market Data snapshots for prices and books  | Fabricate prices; redesign adapters or projections      |
| **Exchange Connectivity**  | Honest Connected session context for offered exchanges     | Redesign handshake, health, or Connected meaning        |
| **Connection Management**  | Exchange catalog, connection lifecycle, provider selection | Redesign or replace the facade                          |
| **Vault**                  | Retrieve credentials only if a consumed path requires them | Duplicate or store secrets locally; use for live orders |
| **Authentication**         | Only signed-in operators open Paper Trading                | Parallel login                                          |
| **Authorization**          | Only permitted roles may use Paper Trading                 | New IAM                                                 |
| **Workspace Isolation**    | Paper accounts and orders stay in one workspace            | Cross-workspace convenience                             |
| **Security Platform**      | Hardening and abuse/rate-limit defaults                    | Fork platform controls                                  |
| **Security Audit**         | Attributable paper account / order / fill / cancel / fail  | Own the audit store                                     |

---

## Owns

| Outcome                  | Customer meaning                                                |
| ------------------------ | --------------------------------------------------------------- |
| Paper orders             | Operator can place and manage simulated buy/sell orders         |
| Paper positions          | Operator can see simulated open positions                       |
| Paper fills              | Operator can see simulated fills driven by Market Data          |
| Paper portfolio          | Operator can see simulated portfolio state                      |
| Paper balances           | Operator can see simulated balances (not exchange balances)     |
| Execution simulator      | Product simulates execution without calling exchange order APIs |
| Order matching simulator | Product matches paper orders against Market Data snapshots      |
| PnL calculation          | Operator can see paper PnL derived from paper fills and prices  |
| Paper account state      | Operator can create and use a paper account in the workspace    |
| Paper execution history  | Operator can review paper order / fill history                  |

---

## Does NOT own

| Concern                         | Real owner                    |
| ------------------------------- | ----------------------------- |
| Live Trading                    | Wave 6 / Order Path           |
| Exchange order placement        | Canonical Order Path / Wave 6 |
| Real balances                   | Exchange / later live owners  |
| Exchange positions              | Exchange / later live owners  |
| Market Data                     | W2-S03 (CLOSED)               |
| Connection Management           | W2-S01 (CLOSED)               |
| Exchange Connectivity           | W2-S02 (CLOSED)               |
| Vault                           | Vault                         |
| Authentication                  | Authentication                |
| Authorization                   | Authorization                 |
| Workspace Isolation             | Workspace Isolation           |
| Monitoring                      | Wave 3 Monitoring             |
| Analytics                       | Later                         |
| Billing                         | Later                         |
| Risk Engine                     | Risk                          |
| Strategy Engine                 | Strategy / Runtime            |
| Leverage / Margin / Liquidation | Later / Risk                  |

---

## IN Scope

| Item                             | Customer meaning                                       |
| -------------------------------- | ------------------------------------------------------ |
| Paper account                    | Create and use a paper account in the workspace        |
| Paper buy / sell                 | Place simulated orders                                 |
| Paper fill                       | Observe simulated fills driven by Market Data          |
| Paper position / PnL / portfolio | Observe simulated position, PnL, and portfolio         |
| Paper balances                   | Observe simulated balances                             |
| Execution / matching simulators  | Local simulation using Market Data snapshots           |
| Paper execution history          | Review paper order and fill history                    |
| Cancel paper order               | Cancel an open paper order                             |
| Consume Market Data              | Never fabricate market prices                          |
| Workspace isolation              | A cannot use B’s paper accounts                        |
| Authorization                    | Unauthorized roles cannot open Paper Trading           |
| Operator walkthrough             | Manual Paper Trading Walkthrough                       |
| Security boundaries              | Consume Wave 1 and W2-S01..S03; do not redefine        |
| Audit interaction                | Emit paper account / order / fill / cancel / fail      |
| Failure philosophy               | Fail closed; no fake venue acceptance; no real capital |
| Validation strategy              | Slices, Close criteria, evidence, regressions          |

---

## OUT OF Scope

Explicitly out of this package:

| Item                                 | Declaration                    |
| ------------------------------------ | ------------------------------ |
| Real exchange execution              | **No real exchange execution** |
| Exchange order APIs                  | **No exchange order APIs**     |
| Exchange balances                    | **No exchange balances**       |
| Exchange positions                   | **No exchange positions**      |
| Exchange portfolio                   | **No exchange portfolio**      |
| Risk engine                          | **No risk engine**             |
| Leverage                             | **No leverage**                |
| Margin engine                        | **No margin engine**           |
| Liquidation                          | **No liquidation**             |
| WebSocket trading                    | **No WebSocket trading**       |
| Strategy engine                      | **No strategy engine**         |
| Live Trading                         | **No Live Trading**            |
| Monitoring                           | **No monitoring**              |
| Analytics                            | Out                            |
| Billing                              | Out                            |
| Secrets store                        | Out (Vault)                    |
| Identity / authn / authz / workspace | Out                            |
| Audit persistence                    | Out                            |
| Market Data redesign                 | Out                            |
| Connection Management redesign       | Out                            |
| Exchange Connectivity redesign       | Out                            |
| Provider SDK redesign                | Out                            |
| Wave 1 changes                       | Out                            |
| Master Plan changes                  | Out                            |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
Paper Trading Foundation
        │ consumes
        ├── Market Data Foundation
        ├── Exchange Connectivity
        ├── Connection Management
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Security Platform
        └── Security Audit

Paper Trading Foundation
        │ owns (product outcomes)
        ├── paper orders
        ├── paper positions
        ├── paper fills
        ├── paper portfolio
        ├── paper balances
        ├── execution simulator
        ├── order matching simulator
        ├── PnL calculation
        ├── paper account state
        └── paper execution history

Paper Trading Foundation
        │ does not own
        ├── Live Trading
        ├── exchange order placement
        ├── real balances
        ├── exchange positions
        ├── Market Data
        ├── Connection Management
        ├── Exchange Connectivity
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Monitoring
        ├── Analytics
        └── Billing
```

No ownership changes. No new bounded context invented by this planning package. Market Data remains the owner of market prices. Connections remain Connection Management. Connected remains Exchange Connectivity honesty. Live trading remains later.

---

## Honesty rules

1. **Paper fill** means simulated execution used a Market Data snapshot.
2. **Paper fill** does **not** mean the exchange accepted an order.
3. **Paper trading** does **not** mean Live Trading enabled.
4. **Paper balances** are simulated account state. They are **not** exchange balances.
5. **Paper positions** are simulated. They are **not** exchange positions.
6. Paper Trading must **consume Market Data**. It must **never fabricate market prices**.
7. Execution must use Market Data snapshots. Client-supplied prices are rejected.
8. The product must **not** emit simulated “exchange accepted” messages as if the venue took the order.
9. No real capital. No real exchange order placement.
10. Secrets are never shown, logged, exported, or stored locally by this package.
11. Provider SDKs are not redesigned by this package.

---

## Customer workflows

### Sign in

Operator signs in. Paper Trading requires authentication.

### Open Paper Trading

Operator opens the Paper Trading product. This is not Connections and not Market Data.

### Create Paper Account

Operator creates a Paper Account in the current workspace. Paper account ownership is workspace-scoped.

### Select Exchange

Operator selects an offered Exchange using the existing catalog and connectivity context. The operator does not paste secrets.

### Select Symbol

Operator selects a symbol from Market Data for that exchange. The product does not invent symbols or prices.

### Place Buy / Place Sell

Operator places a paper Buy or Sell. Execution is simulated locally using Market Data snapshots.

### Observe Fill / Position / PnL / Portfolio

Operator observes paper fill, position, PnL, and portfolio derived from paper account state and Market Data–driven simulation.

### Cancel Order

Operator cancels an open paper order. Nothing is cancelled on an exchange.

### Verify workspace isolation

An operator in Workspace A cannot open, mutate, or observe Workspace B’s paper accounts, orders, fills, or portfolio.

### Verify authorization

A role without permission cannot open Paper Trading or place paper orders.

---

## Failure philosophy

| Situation                         | Required product behavior                               |
| --------------------------------- | ------------------------------------------------------- |
| Missing permission                | Deny — not an empty success                             |
| Wrong workspace                   | Fail closed deny                                        |
| Market Data unavailable / stale   | Do not invent prices; fail or refuse execution honestly |
| Client-supplied price / fill      | Reject                                                  |
| Replay of old snapshot as current | Reject; cannot rewrite paper integrity                  |
| Attempted live / exchange order   | Out of scope; must not call exchange order APIs         |
| Ambiguous matching                | Fail closed; do not invent a fill                       |
| Vault cannot retrieve (if needed) | Fail closed; no local fallback store                    |

Defaults follow [`../security-default-policy.md`](../security-default-policy.md): default deny, fail closed, least privilege, honest product, everything attributable.

---

## Audit interaction

Paper Trading Foundation **emits** attributable events for paper account create, order place, fill, cancel, and fail.

Security Audit **persists** them. This package does not redesign the audit store.

---

## Product Acceptance Criteria

| #   | Outcome                                                                | Fail if                                   |
| --- | ---------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Operator opens Paper Trading and creates a Paper Account               | Live trading or exchange account required |
| 2   | Operator selects Exchange and Symbol using existing products           | Second catalog; invented symbols          |
| 3   | Operator places Buy and Sell as paper orders                           | Exchange order API called                 |
| 4   | Fill, Position, PnL, and Portfolio are honest paper projections        | Venue acceptance claim; fabricated prices |
| 5   | Cancel affects paper order only                                        | Exchange cancel attempted                 |
| 6   | Cross-workspace paper account use denied                               | Tenant leak                               |
| 7   | Unauthorized Paper Trading access denied                               | Privilege bypass                          |
| 8   | No Live Trading, real capital, leverage, margin, or exchange inventory | Live or leverage claim                    |

---

## Product Walkthrough (operator language)

```text
Paper Trading Walkthrough

□ Sign in
□ Open Paper Trading
□ Create Paper Account
□ Select Exchange
□ Select Symbol
□ Place Buy
□ Place Sell
□ Observe Fill
□ Observe Position
□ Observe PnL
□ Observe Portfolio
□ Cancel Order
□ Verify workspace isolation
□ Verify authorization

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Out of scope declarations (binding)

This package does **not** deliver:

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

## Mandatory Questions

1. **What business problem does W2-S04 solve?**
   Operators still cannot safely test strategies, signals, and workflows with simulated execution driven by real Market Data. Without Paper Trading Foundation, the product jumps from market data to live risk or invents dishonest theater.

2. **Which existing products does it consume?**
   Market Data Foundation (W2-S03), Exchange Connectivity (W2-S02), Connection Management (W2-S01), Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

3. **What does W2-S04 own?**
   Paper orders, paper positions, paper fills, paper portfolio, paper balances, execution simulator, order matching simulator, PnL calculation, paper account state, and paper execution history.

4. **What is explicitly out of scope?**
   Real exchange execution, exchange order APIs, exchange balances, exchange positions, exchange portfolio, risk engine, leverage, margin engine, liquidation, WebSocket trading, strategy engine, Live Trading, monitoring, analytics, billing, secrets, identity, authentication, authorization, workspace, audit persistence, Market Data redesign, Connection Management redesign, Exchange Connectivity redesign, provider SDK redesign, and Wave 1 changes.

5. **Does W2-S04 execute real exchange orders?**
   No.

6. **Does W2-S04 use real market data?**
   Yes. Paper Trading consumes Market Data and must never fabricate market prices.

7. **Does W2-S04 modify Wave 1?**
   No.

---

**STOP.** Wait for Product Owner review before W2-S04 implementation planning is approved.
