# W2-S04 Validation Plan

**Package:** W2-S04 Paper Trading Foundation
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Awaiting Product Owner review. Not implementation. Not Close evidence.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w2-s04-product-scope.md`](./w2-s04-product-scope.md)
**Security:** [`w2-s04-security-review.md`](./w2-s04-security-review.md)
**Umbrella:** [`w2-s04-implementation-package.md`](./w2-s04-implementation-package.md)
**Overview:** [`paper-trading-overview.md`](./paper-trading-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving the operator can open Paper Trading, create a Paper Account, place Buy/Sell, and observe Fill, Position, PnL, and Portfolio in the product) do **not** count as Close evidence.

Do not validate real exchange execution, exchange order APIs, exchange balances, exchange positions, exchange portfolio, risk engine, leverage, margin, liquidation, WebSocket trading, strategy engine, Live Trading, monitoring dashboards, analytics, or billing. Validate **Paper Trading Foundation** product outcomes only.

---

## 0. What Close means for W2-S04

| Gate              | Meaning                                                           | Unlocks                                                |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **W2-S04 Closed** | Paper Trading Foundation outcomes are evidenced; walkthrough PASS | Safe Market Data–driven simulated execution foundation |
| **Not claimed**   | Wave 2 COMPLETE (full Execution Roadmap exit)                     | All Wave 2 exit criteria                               |
| **Not claimed**   | Live Trading                                                      | Wave 6 / Order Path                                    |
| **Not claimed**   | Exchange order placement / real capital                           | Later live owners                                      |
| **Not claimed**   | Risk / leverage / margin / liquidation                            | Risk / later                                           |
| **Not claimed**   | Strategy engine                                                   | Strategy / Runtime                                     |
| **Not claimed**   | Monitoring product                                                | Wave 3                                                 |

---

## 1. Implementation slices (validation mapping)

| Slice        | Must prove at slice review                                                       | Close contribution       |
| ------------ | -------------------------------------------------------------------------------- | ------------------------ |
| **W2-S04-a** | Paper account state exists; workspace-scoped create / ownership                  | Paper account foundation |
| **W2-S04-b** | Execution simulator and order matching simulator consume Market Data snapshots   | Simulators               |
| **W2-S04-c** | Paper orders, fills, cancel; no exchange order APIs; no venue-acceptance theater | Orders / fills           |
| **W2-S04-d** | Paper positions, balances, portfolio, PnL, execution history                     | Portfolio / PnL          |
| **W2-S04-e** | Security verification + regressions + full Paper Trading Walkthrough             | Close evidence           |

Slice names are planning sequence only. They are not approval to implement.

---

## 2. Unit tests

| Area                          | Must prove                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| Paper account ownership       | Missing/wrong workspace fails closed; foreign account rejected              |
| Order state machine           | Client cannot declare filled / cancelled / exchange-accepted                |
| Matching simulator            | Matching uses Market Data snapshot inputs only                              |
| Price integrity               | Fabricated or client-supplied prices rejected                               |
| Fill integrity                | Client-supplied fills rejected                                              |
| PnL calculation               | PnL derived from paper fills / positions / Market Data; client PnL rejected |
| Replay                        | Stale or replayed snapshot / fill cannot break integrity                    |
| No venue theater              | No “exchange accepted” simulated venue message path                         |
| No exchange order side effect | Simulator never invokes exchange order placement                            |
| Workspace scope predicates    | Missing/wrong workspace fails closed                                        |
| Secret field shaping          | Responses never include raw secret material                                 |
| No Live Trading projection    | Live Trading enabled / exchange balances / exchange positions not projected |

---

## 3. Integration tests

| Case family                        | Must prove                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Create Paper Account               | Workspace-scoped paper account created                                           |
| Select Exchange / Symbol           | Uses Connection Management + Market Data; no second catalog; no invented symbols |
| Place Buy / Place Sell             | Paper orders created; no exchange order API called                               |
| Observe Fill                       | Fill produced by simulator against Market Data                                   |
| Observe Position / PnL / Portfolio | Honest paper projections                                                         |
| Cancel Order                       | Open paper order cancelled locally only                                          |
| Market Data unavailable            | Honest refuse / fail; no fabricated prices                                       |
| Stale Market Data                  | Matching honesty rules applied; not silently treated as current if forbidden     |
| Cross-workspace deny               | A cannot open / mutate / observe B’s paper accounts                              |
| Unauthorized role deny             | Paper Trading denied without permission                                          |
| Audit emit                         | Create / place / fill / cancel / fail recorded                                   |
| No live side effects               | No exchange orders, real capital, leverage, margin, or liquidation               |
| Wave 1 unregressed                 | Login, RBAC, Vault, isolation, audit still work inside workspace A               |
| W2-S01 unregressed                 | Connections catalog, credential write-only path, lifecycle still work            |
| W2-S02 unregressed                 | Exchange Connected meaning, handshake honesty, and health still work             |
| W2-S03 unregressed                 | Market Data symbols / ticker / candles / order book honesty still work           |

---

## 4. Simulation tests

| Case                        | Must prove                                                              |
| --------------------------- | ----------------------------------------------------------------------- |
| Buy against Market Data     | Simulated buy uses snapshot; no fabricated mid/price                    |
| Sell against Market Data    | Simulated sell uses snapshot; no fabricated mid/price                   |
| Partial / full fill honesty | Fill quantities and prices consistent with matching rules and snapshots |
| Cancel before fill          | Cancelled order does not invent a later fill                            |
| Unavailable Market Data     | Simulation refuses rather than inventing prices                         |
| Replay attack               | Replayed snapshot does not create duplicate integrity-breaking fills    |
| PnL after fill              | PnL updates consistently with fills and Market Data                     |
| History completeness        | Paper execution history records place / fill / cancel                   |

---

## 5. UI validation

| Case                               | Must prove                                                          |
| ---------------------------------- | ------------------------------------------------------------------- |
| Open Paper Trading                 | Operator can open Paper Trading                                     |
| Create Paper Account               | Paper Account create visible and scoped                             |
| Select Exchange                    | Offered exchanges selectable via existing products                  |
| Select Symbol                      | Symbol selection constrained to Market Data                         |
| Place Buy / Sell                   | Paper order controls visible                                        |
| Observe Fill                       | Fill visible as paper fill — not exchange acceptance                |
| Observe Position / PnL / Portfolio | Paper projections visible                                           |
| Cancel Order                       | Cancel visible for open paper orders                                |
| Unauthorized UX                    | Unavailable or deny — not foreign/empty success theater             |
| No Live Trading capability         | Copy and controls do not offer live exchange orders or real capital |

---

## 6. Manual product walkthrough (mandatory)

Execute the **Paper Trading Walkthrough** from [`w2-s04-product-scope.md`](./w2-s04-product-scope.md) and [`paper-trading-overview.md`](./paper-trading-overview.md).

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

PASS / REQUIRES ACTION
```

Automated tests do **not** replace this walkthrough.

| Field                   | Value (at planning)       |
| ----------------------- | ------------------------- |
| Walkthrough name        | Paper Trading Walkthrough |
| Executed in the product | NOT DONE (planning)       |
| Overall                 | PENDING APPROVAL          |

---

## 7. Security walkthrough (mandatory)

```text
Paper Trading Security Walkthrough

□ Credentials never used to place exchange orders
□ Secret never shown after paper actions
□ Anonymous Paper Trading denied
□ Unauthorized role Paper Trading denied
□ Workspace A cannot use Workspace B paper accounts
□ Client cannot set prices, fills, or PnL
□ Replayed Market Data snapshot does not break paper integrity
□ Market Data unavailable does not invent prices
□ No simulated “exchange accepted” venue message
□ No Live Trading enabled claim
□ No exchange balances / exchange positions exposed
□ Audit records create / place / fill / cancel / fail
□ Product does not expose leverage, margin, liquidation, risk engine, or strategy engine

PASS / REQUIRES ACTION
```

Security walkthrough is executed at Close — not during planning.

---

## 8. Close criteria

W2-S04 may Close only when all are true:

| #   | Criterion                                                                                      | Verdict (at planning)  |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | All in-scope slices done; Implementation Report written                                        | NOT DONE (planning)    |
| 2   | Architecture checklist PASS; no ownership drift                                                | NOT DONE (planning)    |
| 3   | Security checklist + STRIDE + Verification Standard + Regression Suite PASS                    | NOT DONE (planning)    |
| 4   | Product checklist PASS; Walkthrough PASS                                                       | NOT DONE (planning)    |
| 5   | Validation plan executed; evidence recorded                                                    | NOT DONE (planning)    |
| 6   | Mandatory reports present and consistent                                                       | NOT DONE (planning)    |
| 7   | Master Plan compliance (no invented scope; no Master Plan edit)                                | PASS (planning intent) |
| 8   | Product Principles respected                                                                   | PASS (planning intent) |
| 9   | No SSH / customer `.env` / local secrets / manual SQL in customer journeys                     | NOT DONE (planning)    |
| 10  | No real exchange execution, Live Trading, leverage, margin, liquidation, or exchange inventory | NOT DONE (planning)    |

---

## 9. Mandatory evidence

| Evidence                         | Form                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| Unit + integration results       | Ordinary CI / test run artifacts                                           |
| Simulation results               | Simulation test artifacts                                                  |
| UI evidence                      | UI tests and/or recorded walkthrough notes                                 |
| Product Walkthrough              | Completed checklist with PASS                                              |
| Security Walkthrough             | Completed checklist with PASS                                              |
| Security Verification worksheet  | Every row PASS / NOT APPLICABLE                                            |
| Security Regression Suite        | Automated tests for this package’s owned fixed vulns                       |
| Architecture checklist           | Completed at Close                                                         |
| Product checklist                | Completed at Close                                                         |
| Cross-tenant deny evidence       | Integration proof A↛B                                                      |
| Honest non-claim evidence        | Asserts that Live Trading / exchange orders / real capital are not claimed |
| Integrity evidence               | Client-set price / fill / PnL cannot become product state                  |
| Market Data consumption evidence | Fabricated prices cannot drive fills                                       |

---

## 10. Operator walkthrough (validation role)

The validator is an operator, not a host engineer.

1. Sign in to Workspace A with Paper Trading permission.
2. Open Paper Trading.
3. Create Paper Account.
4. Select Exchange.
5. Select Symbol.
6. Place Buy.
7. Place Sell.
8. Observe Fill.
9. Observe Position.
10. Observe PnL.
11. Observe Portfolio.
12. Cancel an open paper order (or place one and cancel it).
13. Switch to Workspace B context; confirm A’s paper accounts are inaccessible.
14. Sign in as unauthorized role; confirm Paper Trading unavailable or denied.
15. Confirm the product offers no real exchange execution, no exchange order APIs, no exchange balances, no exchange positions, no exchange portfolio, no risk engine, no leverage, no margin, no liquidation, no WebSocket trading, no strategy engine, no Live Trading, no monitoring, no analytics, and no billing from this package.

---

## 11. Regression strategy

| Class                          | Strategy                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| Market Data–gated execution    | Fabricated prices must fail forever as regression                   |
| Order / fill / PnL integrity   | Client-set integrity fields must fail forever as regression         |
| No exchange order side effects | Paper place/cancel must never call exchange order APIs              |
| No venue theater               | No “exchange accepted” simulated message path                       |
| Secret non-disclosure          | Response-shape tests on Paper Trading surfaces                      |
| Cross-tenant                   | Isolation cases for paper accounts in ordinary suite                |
| Authz                          | Role deny cases                                                     |
| Replay                         | Stale snapshot / replayed fill cannot break integrity               |
| Wave 1 smoke                   | Login / Vault / isolation smoke not regressed                       |
| W2-S01 smoke                   | Connections catalog / write-only credentials / lifecycle not broken |
| W2-S02 smoke                   | Exchange Connected meaning / handshake honesty / health not broken  |
| W2-S03 smoke                   | Market Data projections / freshness honesty not broken              |
| Found vulnerabilities          | Each package-owned fix adds a named regression test                 |

---

## 12. Security Verification Standard expectations

| Expectation                                                                  | Required at Close |
| ---------------------------------------------------------------------------- | ----------------- |
| Categories 1–14 completed for Paper Trading surfaces                         | Yes               |
| OWASP Top 10 mapping                                                         | Yes               |
| OWASP API Top 10 mapping                                                     | Yes               |
| Timing/Abuse where Paper Trading can be spammed                              | Yes               |
| Replay protection evidenced                                                  | Yes               |
| Integrity rows for order / fill / PnL                                        | Yes               |
| Regression Suite rows                                                        | Yes               |
| NOT APPLICABLE named for Live Trading / exchange inventory / risk / strategy | Yes               |
| Zero REQUIRES ACTION                                                         | Yes               |

---

## 13. Explicit non-goals for validation

Do not treat the following as W2-S04 Close evidence:

- Successful live exchange order
- Exchange balance or exchange position inventory
- Leverage, margin, or liquidation behavior
- Risk engine decision
- Strategy engine run
- WebSocket trading or streaming product
- Monitoring dashboard widgets
- Analytics dashboards
- Billing invoices
- Wave 2 COMPLETE
- Wave 1 recertification (Wave 1 is already CERTIFIED COMPLETE)
- W2-S01 / W2-S02 / W2-S03 recertification (already CLOSED)

---

**STOP.** Wait for Product Owner review before W2-S04 implementation planning is approved.
