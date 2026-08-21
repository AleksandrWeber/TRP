# W2-S03 Validation Plan

**Package:** W2-S03 Market Data Foundation
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Not executed. Awaiting Product Owner Approval, then implementation, then validation.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w2-s03-product-scope.md`](./w2-s03-product-scope.md)
**Security:** [`w2-s03-security-review.md`](./w2-s03-security-review.md)
**Umbrella:** [`w2-s03-implementation-package.md`](./w2-s03-implementation-package.md)
**Overview:** [`market-data-overview.md`](./market-data-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving the operator can open Market Data, select an Exchange, choose a symbol, and view ticker, candles, or order book in the product) do **not** count as Close evidence.

Do not validate order placement, execution, portfolio, balances, positions, WebSocket trading, strategy execution, paper-trading changes, live trading, monitoring dashboards, analytics, or billing. Validate **Market Data Foundation** product outcomes only.

---

## 0. What Close means for W2-S03

| Gate              | Meaning                                                                | Unlocks                                            |
| ----------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| **W2-S03 Closed** | Market Data Foundation outcomes are evidenced; walkthrough PASS        | Honest market-data projections for later consumers |
| **Not claimed**   | Wave 2 COMPLETE (full Execution Roadmap exit)                          | All Wave 2 exit criteria                           |
| **Not claimed**   | Wave 4 COMPLETE (Kraken, public market-data/WS streaming, Wave 4 exit) | Remaining Exchange Connectivity outcomes           |
| **Not claimed**   | Trading                                                                | Wave 6 / Order Path                                |
| **Not claimed**   | Monitoring product                                                     | Wave 3                                             |
| **Not claimed**   | Orders, balances, positions, execution, portfolio                      | Later owners                                       |

---

## 1. Implementation slices (validation mapping)

| Slice        | Must prove at slice review                                                             | Close contribution  |
| ------------ | -------------------------------------------------------------------------------------- | ------------------- |
| **W2-S03-a** | One Market Data adapter contract for Binance, Bybit, OKX; additional providers allowed | Adapters            |
| **W2-S03-b** | Provider payloads normalize; symbols are provider-scoped and selectable                | Normalize / symbols |
| **W2-S03-c** | Ticker, candles, and order book are honest product projections                         | Projections         |
| **W2-S03-d** | Health, provider metadata, Provider Unavailable, and stale handling are honest         | Health / honesty    |
| **W2-S03-e** | Verification Standard + regressions + full walkthrough                                 | Close evidence      |

---

## 2. Unit tests

| Area                       | Must prove                                                          |
| -------------------------- | ------------------------------------------------------------------- |
| Adapter contract           | Binance, Bybit, OKX share the same receive / fail product meaning   |
| Normalization              | Provider payloads map to one product model without inventing values |
| Symbol validation          | Invalid, mixed-venue, or unconstrained symbols rejected             |
| Projection gating          | Ticker, candles, and book cannot be set without validate            |
| Replay                     | Stale or client-supplied snapshot cannot become current             |
| Stale mapping              | Freshness failure is stale or unavailable — not current             |
| Unavailable mapping        | Provider failure / rate-limit do not become live projections        |
| Workspace scope predicates | Missing/wrong workspace fails closed                                |
| Secret field shaping       | Responses never include raw secret material                         |
| No trading projection      | Orders, balances, positions, and Trading enabled are not projected  |

---

## 3. Integration tests

| Case family                | Must prove                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| Select Exchange            | Offered Exchange from existing catalog; no second Connections product   |
| Choose Symbol              | Symbol is provider-scoped and selectable                                |
| View Ticker                | Validated ticker projection                                             |
| View Candles               | Validated candlestick projection                                        |
| View Order Book            | Validated order-book projection                                         |
| Provider unavailable       | Honest Provider Unavailable; no fake data                               |
| Stale handling             | Stale is not presented as current                                       |
| Rate-limit awareness       | Throttled outcome is not current data                                   |
| Vault retrieve only        | Credentialed paths use Vault; no local secret store                     |
| Public path invents no key | Public market data does not create a trading secret                     |
| Cross-workspace deny       | A cannot open / view B’s Market Data                                    |
| Unauthorized role deny     | Market Data denied without permission                                   |
| Audit emit                 | Read attempted / succeeded / failed / unavailable recorded              |
| No trading side effects    | No orders, balances, positions, or execution as a result of Market Data |
| Wave 1 unregressed         | Login, RBAC, Vault, isolation, audit still work inside workspace A      |
| W2-S01 unregressed         | Connections catalog, credential write-only path, lifecycle still work   |
| W2-S02 unregressed         | Exchange Connected meaning, handshake honesty, and health still work    |

---

## 4. UI tests

| Case                  | Must prove                                                       |
| --------------------- | ---------------------------------------------------------------- |
| Open Market Data      | Operator can open Market Data                                    |
| Select Exchange       | Binance, Bybit, OKX selectable                                   |
| Choose Symbol         | Symbol selection visible and constrained                         |
| View Ticker           | Ticker projection visible                                        |
| View Candles          | Candles projection visible                                       |
| View Order Book       | Order-book projection visible                                    |
| Provider Unavailable  | Unavailable shown without fake success                           |
| Stale visible         | Stale handling visible; not claimed current                      |
| Unauthorized UX       | Unavailable or deny — not foreign/empty success theater          |
| No trading capability | Copy and controls do not offer orders, balances, or live trading |

---

## 5. Manual product walkthrough (mandatory)

Execute the **Market Data Walkthrough** from [`w2-s03-product-scope.md`](./w2-s03-product-scope.md) and [`market-data-overview.md`](./market-data-overview.md).

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

PASS / REQUIRES ACTION
```

Automated tests do **not** replace this walkthrough.

| Field                   | Value (at execution)    |
| ----------------------- | ----------------------- |
| Walkthrough name        | Market Data Walkthrough |
| Executed in the product | PENDING APPROVAL        |
| Overall                 | PENDING APPROVAL        |

---

## 6. Security walkthrough (mandatory)

```text
Market Data Security Walkthrough

□ Credentials used from Vault only when required — no local secret store
□ Public market-data path invents no trading key
□ Secret never shown after view, unavailable, or stale
□ Anonymous Market Data denied
□ Unauthorized role Market Data denied
□ Workspace A cannot view Workspace B Market Data
□ Client cannot set ticker, candles, or order book
□ Replayed prior snapshot does not restore current data
□ Provider Unavailable is unavailable — not fake data
□ Stale is not presented as current
□ Rate-limited outcome is not current data
□ Malformed payload is not projected
□ Audit records read / fail / unavailable
□ Product does not expose orders, trading, execution, portfolio, balances, or positions

PASS / REQUIRES ACTION
```

---

## 7. Close criteria

W2-S03 may Close only when all are true:

| #   | Criterion                                                                             | Verdict (at Close)     |
| --- | ------------------------------------------------------------------------------------- | ---------------------- |
| 1   | All in-scope slices done; Implementation Report written                               | PENDING (planning)     |
| 2   | Architecture checklist PASS; no ownership drift                                       | PENDING (planning)     |
| 3   | Security checklist + STRIDE + Verification Standard + Regression Suite PASS           | PENDING (planning)     |
| 4   | Product checklist PASS; Walkthrough PASS                                              | PENDING (planning)     |
| 5   | Validation plan executed; evidence recorded                                           | PENDING (planning)     |
| 6   | Mandatory reports present and consistent                                              | PENDING (planning)     |
| 7   | Master Plan compliance (no invented scope; no Master Plan edit)                       | PASS (planning intent) |
| 8   | Product Principles respected                                                          | PASS (planning intent) |
| 9   | No SSH / customer `.env` / local secrets / manual SQL in customer journeys            | PENDING (planning)     |
| 10  | No orders, trading, execution, portfolio, balances, positions, monitoring, or billing | PENDING (planning)     |

---

## 8. Mandatory evidence

| Evidence                        | Form                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| Unit + integration results      | Ordinary CI / test run artifacts                                |
| UI evidence                     | UI tests and/or recorded walkthrough notes                      |
| Product Walkthrough             | Completed checklist with PASS                                   |
| Security Walkthrough            | Completed checklist with PASS                                   |
| Security Verification worksheet | Every row PASS / NOT APPLICABLE                                 |
| Security Regression Suite       | Automated tests for this package’s owned fixed vulns            |
| Architecture checklist          | Completed at Close                                              |
| Product checklist               | Completed at Close                                              |
| Cross-tenant deny evidence      | Integration proof A↛B                                           |
| Honest non-claim evidence       | Asserts that trading / orders / balances / live are not claimed |
| Integrity evidence              | Malformed payload cannot become product projections             |
| Stale / unavailable evidence    | Stale is not current; unavailable is not fake data              |

---

## 9. Operator walkthrough (validation role)

The validator is an operator, not a host engineer.

1. Sign in to Workspace A with market-data permission.
2. Open Market Data.
3. Select Exchange (Binance, Bybit, or OKX).
4. Choose Symbol.
5. View Ticker.
6. View Candles.
7. View Order Book.
8. Observe Provider Unavailable on a separate attempt or provider where data cannot be supplied.
9. Observe stale data handling; confirm stale is not presented as current.
10. Switch to Workspace B context; confirm A’s Market Data is inaccessible.
11. Sign in as unauthorized role; confirm Market Data unavailable or denied.
12. Confirm the product offers no order placement, no execution, no portfolio, no balances, no positions, no WebSocket trading, no strategy execution, no paper-trading changes, no monitoring, and no billing from this package.

---

## 10. Regression strategy

| Class                     | Strategy                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| Validate-gated projection | Unvalidated ticker / candles / book must fail forever as regression |
| Secret non-disclosure     | Response-shape tests on Market Data surfaces                        |
| Cross-tenant              | Isolation cases for Market Data in ordinary suite                   |
| Authz                     | Role deny cases                                                     |
| Replay                    | Stale snapshot cannot become current                                |
| Rate-limit honesty        | Throttled is not current data                                       |
| Integrity                 | Malformed payload cannot become product state                       |
| No trading side effects   | Market Data must not place orders or read balances / positions      |
| Wave 1 smoke              | Login / Vault / isolation smoke not regressed                       |
| W2-S01 smoke              | Connections catalog / write-only credentials / lifecycle not broken |
| W2-S02 smoke              | Exchange Connected meaning / handshake honesty / health not broken  |
| Found vulnerabilities     | Each package-owned fix adds a named regression test                 |

---

## 11. Security Verification Standard expectations

| Expectation                                                      | Required at Close |
| ---------------------------------------------------------------- | ----------------- |
| Categories 1–14 completed for Market Data surfaces               | Yes               |
| OWASP Top 10 mapping                                             | Yes               |
| OWASP API Top 10 mapping                                         | Yes               |
| Timing/Abuse where Market Data can be spammed or venue-hammered  | Yes               |
| Replay protection evidenced                                      | Yes               |
| Integrity rows for malformed provider payloads                   | Yes               |
| Regression Suite rows                                            | Yes               |
| NOT APPLICABLE named for orders / trading / monitoring / billing | Yes               |
| Zero REQUIRES ACTION                                             | Yes               |

---

## 12. Explicit non-goals for validation

Do not treat the following as W2-S03 Close evidence:

- Successful live exchange order
- Balance or position inventory
- WebSocket trading or streaming product
- Paper-trading engine change
- Strategy execution
- Telegram message received
- SMTP inbox delivery
- Monitoring dashboard widgets
- Analytics dashboards
- Billing invoices
- Wave 4 COMPLETE
- Wave 1 recertification (Wave 1 is already CERTIFIED COMPLETE)
- W2-S01 recertification (W2-S01 is already CLOSED)
- W2-S02 recertification (W2-S02 is already CLOSED)

---

**STOP.** Wait for Product Owner review before W2-S03 implementation planning is approved.
