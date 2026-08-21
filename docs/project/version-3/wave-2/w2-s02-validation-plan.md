# W2-S02 Validation Plan

**Package:** W2-S02 Exchange Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** W2-S02-a through W2-S02-e executed for Close evidence. Close remains pending Product Owner decision.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w2-s02-product-scope.md`](./w2-s02-product-scope.md)
**Security:** [`w2-s02-security-review.md`](./w2-s02-security-review.md)
**Umbrella:** [`w2-s02-implementation-package.md`](./w2-s02-implementation-package.md)
**Overview:** [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving the operator can Connect an Exchange and observe Connected or Failure in the product) do **not** count as Close evidence.

Do not validate order placement, balances, positions, leverage, market-data engine, WebSockets, execution, risk, paper-trading changes, live trading, monitoring dashboards, analytics, or billing. Validate **Exchange Connectivity Foundation** product outcomes only.

---

## 0. What Close means for W2-S02

| Gate              | Meaning                                                                   | Unlocks                                  |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| **W2-S02 Closed** | Exchange Connectivity Foundation outcomes are evidenced; walkthrough PASS | Honest Exchange Connected on Connections |
| **Not claimed**   | Wave 2 COMPLETE (full Execution Roadmap exit)                             | All Wave 2 exit criteria                 |
| **Not claimed**   | Wave 4 COMPLETE (Kraken, public market-data/WS, Wave 4 exit)              | Remaining Exchange Connectivity outcomes |
| **Not claimed**   | Live trading                                                              | Wave 6                                   |
| **Not claimed**   | Monitoring product                                                        | Wave 3                                   |
| **Not claimed**   | Orders, balances, positions, execution                                    | Later owners                             |

---

## 1. Implementation slices (validation mapping)

| Slice        | Must prove at slice review                                                      | Close contribution                             |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| **W2-S02-a** | One connectivity contract for Binance, Bybit, OKX; additional providers allowed | Abstraction — **executed** (see below)         |
| **W2-S02-b** | Connect establishes a real authenticated exchange session via Vault credentials | Handshake — **executed** (see below)           |
| **W2-S02-c** | Health and provider availability are honest                                     | Health — **executed** (see below)              |
| **W2-S02-d** | Connected means authenticated communication succeeded; never Trading enabled    | Status / projection — **executed** (see below) |
| **W2-S02-e** | Verification Standard + regressions + full walkthrough                          | Close evidence — **executed** (see below)      |

### W2-S02-a execution evidence

Recorded in [`w2-s02-a-validation-report.md`](./w2-s02-a-validation-report.md).

| Proof                                                                  | Result |
| ---------------------------------------------------------------------- | ------ |
| Provider registry, lookup, and selection for Binance, Bybit, OKX       | PASS   |
| Capability model is metadata only                                      | PASS   |
| Connection references an Exchange Provider inside the owning workspace | PASS   |
| Catalog rendering and provider selection in Connections                | PASS   |
| No HTTP, SDK, handshake, Connect, Authenticate, or Live status         | PASS   |
| Wave 1 authorization and Connection Management lifecycle smoke         | PASS   |

W2-S02-a does **not** Close W2-S02. Handshake, health, venue Connected, and the full Exchange Connectivity Walkthrough remain later slices.

### W2-S02-b execution evidence

Recorded in [`w2-s02-b-validation-report.md`](./w2-s02-b-validation-report.md).

| Proof                                                                             | Result |
| --------------------------------------------------------------------------------- | ------ |
| Binance authenticated handshake via Vault credentials                             | PASS   |
| Connected assigned only after authenticated communication success                 | PASS   |
| Authentication Failed, Handshake Timeout, Provider Unavailable, Validation Failed | PASS   |
| Connection Management does not receive Exchange plaintext secrets                 | PASS   |
| Workspace isolation and existing Validate authorization                           | PASS   |
| Handshake Started / Succeeded / Failed audit events                               | PASS   |
| UI Validate flow and handshake outcomes without secrets or trading claims         | PASS   |
| No balances, orders, market data, WebSockets, or live trading                     | PASS   |
| Wave 1 authorization and Connection Management lifecycle smoke                    | PASS   |

W2-S02-b does **not** Close W2-S02. Health is recorded in W2-S02-c. Remaining handshake providers and the full Exchange Connectivity Walkthrough remain later slices.

### W2-S02-c execution evidence

Recorded in [`w2-s02-c-validation-report.md`](./w2-s02-c-validation-report.md).

| Proof                                                                             | Result |
| --------------------------------------------------------------------------------- | ------ |
| Explicit session state machine; illegal transitions rejected                      | PASS   |
| Health projection from observed session state only                                | PASS   |
| Reconnect eligibility without automatic reconnect, polling, or workers            | PASS   |
| Provider availability observation                                                 | PASS   |
| Session Expired, Connection Lost, and Provider Unavailable                        | PASS   |
| Workspace isolation and existing authorization                                    | PASS   |
| Session Established / Expired / Connection Lost / Reconnect Required audit events | PASS   |
| UI health, session, reconnect, and availability without trading claims            | PASS   |
| No balances, orders, market data, WebSockets, or live trading                     | PASS   |
| Wave 1, Connection Management, and handshake smoke                                | PASS   |

W2-S02-c does **not** Close W2-S02. Capability verification (W2-S02-d) is recorded below. Remaining handshake providers and the full Exchange Connectivity Walkthrough remain later slices.

### W2-S02-d execution evidence

Recorded in [`w2-s02-d-validation-report.md`](./w2-s02-d-validation-report.md).

| Proof                                                                            | Result |
| -------------------------------------------------------------------------------- | ------ |
| Capability verification runs only after authenticated handshake                  | PASS   |
| Honest states: Supported, Unsupported, Unavailable, Unknown, Verification Failed | PASS   |
| Unknown preferred over guessing                                                  | PASS   |
| Verification failure does not invalidate the authenticated session               | PASS   |
| Session-scoped cache; workspace isolation                                        | PASS   |
| Existing authorization reused                                                    | PASS   |
| Capability Verification Started / Completed / Failed audit events                | PASS   |
| UI verified capabilities, state, time, unavailable, and failed without trading   | PASS   |
| No balances, orders, market data, WebSockets, or live trading                    | PASS   |
| Wave 1, Connection Management, handshake, and health smoke                       | PASS   |

W2-S02-d does **not** Close W2-S02. Close evidence (W2-S02-e) is recorded below.

### W2-S02-e execution evidence

Recorded in [`w2-s02-close-report.md`](./w2-s02-close-report.md), [`w2-s02-security-verification-worksheet.md`](./w2-s02-security-verification-worksheet.md), and [`w2-s02-live-product-walkthrough.md`](./w2-s02-live-product-walkthrough.md).

| Proof                                                                  | Result |
| ---------------------------------------------------------------------- | ------ |
| Planning Package outcomes implemented across slices a–d                | PASS   |
| Architecture / ownership drift check                                   | PASS   |
| Security Verification Worksheet §4–§19; zero REQUIRES ACTION           | PASS   |
| Security Review Close evidence                                         | PASS   |
| Product Walkthrough PASS                                               | PASS   |
| Regression suite green in ordinary tests                               | PASS   |
| Wave 1 / Connection Management / handshake / health / capability smoke | PASS   |
| No production code changes in Close package                            | PASS   |

W2-S02-e prepares Product Owner Close Review. It does **not** declare W2-S02 Closed.

---

## 2. Unit tests

| Area                       | Must prove                                                               |
| -------------------------- | ------------------------------------------------------------------------ |
| Handshake gated Connected  | Illegal Connected without authenticated communication success rejected   |
| Replay                     | Stale or client-supplied success cannot become Connected                 |
| Provider contract          | Binance, Bybit, OKX share the same Connect / Connected / Failure meaning |
| Capability projection      | Trading, orders, balances, and positions are not projected               |
| Workspace scope predicates | Missing/wrong workspace fails closed                                     |
| Secret field shaping       | Responses never include raw secret material                              |
| Failure mapping            | Auth reject, unavailable, and rate-limit do not become Connected         |

---

## 3. Integration tests

| Case family             | Must prove                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| Connect success         | Authenticated exchange communication succeeded → Connected            |
| Connect failure         | Auth reject / communication fail → Failure; not Connected             |
| Provider unavailable    | Honest unavailable / Failure                                          |
| Rate-limit awareness    | Throttled outcome is not Connected                                    |
| Disconnect              | Connected use stops; state honest                                     |
| Vault retrieve only     | Handshake uses Vault; no local secret store                           |
| Cross-workspace deny    | A cannot Connect / read / Disconnect B                                |
| Unauthorized role deny  | Connect / Disconnect denied without permission                        |
| Audit emit              | Connect attempted / succeeded / failed / Disconnect recorded          |
| No trading side effects | No orders, balances, positions, or execution as a result of Connect   |
| Wave 1 unregressed      | Login, RBAC, Vault, isolation, audit still work inside workspace A    |
| W2-S01 unregressed      | Connections catalog, credential write-only path, lifecycle still work |

---

## 4. UI tests

| Case                       | Must prove                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| Connections surface reused | Operator opens Connections; no second product required           |
| Choose Exchange            | Binance, Bybit, OKX selectable as Exchange providers             |
| Connect action visible     | Operator can run Connect                                         |
| Connected honest           | Connected only after authenticated communication success path    |
| Failure visible            | Failure shown without fake success                               |
| Disconnect visible         | Operator can disconnect                                          |
| Unauthorized UX            | Unavailable or deny — not foreign/empty success theater          |
| No trading capability      | Copy and controls do not offer orders, balances, or live trading |

---

## 5. Manual product walkthrough (mandatory)

Execute the **Exchange Connectivity Walkthrough** from [`w2-s02-product-scope.md`](./w2-s02-product-scope.md) and [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md).

```text
Exchange Connectivity Walkthrough

□ Open Connections
□ Choose Exchange
□ Run Connect
□ Observe Connected
□ Observe Failure
□ Disconnect
□ Verify workspace isolation
□ Verify authorization
□ Verify no trading capability

PASS / REQUIRES ACTION
```

Automated tests do **not** replace this walkthrough.

| Field                   | Value (at execution)                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Walkthrough name        | Exchange Connectivity Walkthrough                                                  |
| Executed in the product | Yes — [`w2-s02-live-product-walkthrough.md`](./w2-s02-live-product-walkthrough.md) |
| Overall                 | PASS                                                                               |

---

## 6. Security walkthrough (mandatory)

```text
Exchange Connectivity Security Walkthrough

□ Credentials used from Vault only — no local secret store
□ Secret never shown after Connect, Failure, or Disconnect
□ Anonymous Connect denied
□ Unauthorized role Connect / Disconnect denied
□ Workspace A cannot Connect Workspace B
□ Client cannot set Connected
□ Replayed prior success does not restore Connected
□ Provider failure is Failure — not Connected
□ Rate-limited outcome is not Connected
□ Audit records Connect / Failure / Disconnect
□ Product does not expose orders, balances, or Trading enabled

PASS / REQUIRES ACTION
```

---

## 7. Close criteria

W2-S02 may Close only when all are true:

| #   | Criterion                                                                   | Verdict (at Close) |
| --- | --------------------------------------------------------------------------- | ------------------ |
| 1   | All in-scope slices done; Implementation Report written                     | PASS               |
| 2   | Architecture checklist PASS; no ownership drift                             | PASS               |
| 3   | Security checklist + STRIDE + Verification Standard + Regression Suite PASS | PASS               |
| 4   | Product checklist PASS; Walkthrough PASS                                    | PASS               |
| 5   | Validation plan executed; evidence recorded                                 | PASS               |
| 6   | Mandatory reports present and consistent                                    | PASS               |
| 7   | Master Plan compliance (no invented scope; no Master Plan edit)             | PASS               |
| 8   | Product Principles respected                                                | PASS               |
| 9   | No SSH / customer `.env` / local secrets / manual SQL in customer journeys  | PASS               |
| 10  | No orders, balances, live trading, execution, monitoring, or billing        | PASS               |

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

---

## 9. Operator walkthrough (validation role)

The validator is an operator, not a host engineer.

1. Sign in to Workspace A with connection permission.
2. Open Connections.
3. Choose Exchange (Binance, Bybit, or OKX) with Vault-backed credentials already stored.
4. Run Connect.
5. Observe Connected — authenticated exchange communication succeeded.
6. Observe Failure on a separate attempt or connection where authentication or communication cannot succeed.
7. Disconnect; confirm not Connected.
8. Switch to Workspace B context; confirm A’s exchange connection is inaccessible.
9. Sign in as unauthorized role; confirm Connect / Disconnect unavailable or denied.
10. Confirm the product offers no orders, no balances, no live trading, no execution, no monitoring, and no billing from this package.

---

## 10. Regression strategy

| Class                     | Strategy                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| Handshake gated Connected | Connected-without-authentication must fail forever as regression    |
| Secret non-disclosure     | Response-shape tests on Connect / status / Disconnect               |
| Cross-tenant              | Isolation cases for Exchange Connect in ordinary suite              |
| Authz                     | Role deny cases                                                     |
| Replay                    | Stale proof cannot become Connected                                 |
| Rate-limit honesty        | Throttled is not Connected                                          |
| No trading side effects   | Connect must not place orders or read balances/positions            |
| Wave 1 smoke              | Login / Vault / isolation smoke not regressed                       |
| W2-S01 smoke              | Connections catalog / write-only credentials / lifecycle not broken |
| Found vulnerabilities     | Each package-owned fix adds a named regression test                 |

---

## 11. Security Verification Standard expectations

| Expectation                                                   | Required at Close |
| ------------------------------------------------------------- | ----------------- |
| Categories 1–14 completed for connectivity surfaces           | Yes               |
| OWASP Top 10 mapping                                          | Yes               |
| OWASP API Top 10 mapping                                      | Yes               |
| Timing/Abuse where Connect can be spammed or venue-hammered   | Yes               |
| Replay protection evidenced                                   | Yes               |
| Regression Suite rows                                         | Yes               |
| NOT APPLICABLE named for orders / live / monitoring / billing | Yes               |
| Zero REQUIRES ACTION                                          | Yes               |

---

## 12. Explicit non-goals for validation

Do not treat the following as W2-S02 Close evidence:

- Successful live exchange order
- Balance or position inventory
- WebSocket market stream
- Paper-trading engine change
- Telegram message received
- SMTP inbox delivery
- Monitoring dashboard widgets
- Billing invoices
- Wave 4 COMPLETE
- Wave 1 recertification (Wave 1 is already CERTIFIED COMPLETE)
- W2-S01 recertification (W2-S01 is already CLOSED)

---

**STOP.** Close evidence is assembled. Wait for Product Owner Close Review. Only the Product Owner may declare W2-S02 Closed.
