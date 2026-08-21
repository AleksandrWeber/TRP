# W2-S03 Market Data Foundation — Implementation Package

```text
Package:            W2-S03
Name:               Market Data Foundation
Also known as:      Market Data · Market Data Domain foundation
Wave:               2 — Connection Management
Master Plan map:    Market Data Domain already named (Live Market Data minor extension;
                    Wave 4 public market-data / WS remaining). This package does not
                    revise that map. It sequences the foundation after W2-S02 Close.
Date:               2026-08-21
Status:             Implementation Package — Planning COMPLETE. Awaiting Product Owner Review and Approval.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Consumed products (read-only):** [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md) · [`w2-s02-close-report.md`](./w2-s02-close-report.md) · [`connection-management-overview.md`](./connection-management-overview.md)

**Companions:**

| Document                                                     | Role                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| [`w2-s03-product-scope.md`](./w2-s03-product-scope.md)       | IN / OUT, ownership, honesty, providers, acceptance   |
| [`w2-s03-security-review.md`](./w2-s03-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w2-s03-validation-plan.md`](./w2-s03-validation-plan.md)   | How Close is proven                                   |
| [`market-data-overview.md`](./market-data-overview.md)       | Operator / PO language product                        |
| [`w2-s03-planning-summary.md`](./w2-s03-planning-summary.md) | Planning open record                                  |
| [`wave-2-progress.md`](./wave-2-progress.md)                 | Wave 2 package status                                 |

**Prerequisites:**

| Prerequisite                    | Status                                           |
| ------------------------------- | ------------------------------------------------ |
| Version 2                       | **CERTIFIED**                                    |
| Wave 1 Security Foundation      | **CERTIFIED COMPLETE** (Product Owner authority) |
| W2-S01 Connection Management    | **CLOSED** (consumed; not redesigned)            |
| W2-S02 Exchange Connectivity    | **CLOSED** (consumed; not redesigned)            |
| V3-S01 Authentication & Session | **CLOSED** (consumed)                            |
| V3-S02 RBAC Product             | **CLOSED** (consumed)                            |
| V3-S03 Secret Vault             | **CLOSED** / Vault platform available (consumed) |
| V3-S04 OWASP & API Hardening    | **CLOSED** (consumed)                            |
| V3-S05 Audit Trail Foundation   | **CLOSED** (consumed)                            |
| V3-S06 Workspace Isolation      | **CLOSED** (consumed)                            |
| Master Plan                     | **FROZEN** — this package does not revise it     |
| Security Verification Standard  | **Approved** (mandatory)                         |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package).** Market Data Domain is already named. Exchange Connectivity already exists. This package sequences the foundation that receives, normalizes, validates, and exposes market data using those products. Wave 1 remains CERTIFIED COMPLETE. W2-S01 remains CLOSED. W2-S02 remains CLOSED. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. Wave 4 exit is not claimed. Trading is not introduced.

```text
Market Data Foundation consumes Exchange Connectivity, Connection Management, and Wave 1.
It does NOT redesign Exchange Connectivity or Connection Management.
It does NOT own secrets, identity, authz, workspace, audit persistence, or monitoring.
It does NOT place orders, read balances, open positions, or enable trading.
Market data available means honest ticker, candle, and order-book projections.
Market data available does NOT mean Trading enabled.
STOP until Product Owner Approval before any implementation.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (awaiting PO review)
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← W2-S03 slices only (after Approval)
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close
```

Do not skip a stage. Do not start production code before Approval. Do not open Wave 3 from this package. Do not claim Wave 2 exit. Do not claim Wave 4 exit. Do not claim Trading.

---

## Overview

W2-S03 opens **Market Data Foundation**. It is the product package that lets the product **receive, normalize, validate, and expose** market data from supported exchanges after successful Exchange Connectivity.

It consumes W2-S02 Exchange Connectivity and W2-S01 Connection Management. Operators still manage Exchange connections in Connections. This package does not invent a second Connections product and does not redesign handshake, health, or capability projection.

Vault still owns credentials. Authentication still owns identity. Authorization still owns permission. Workspace Isolation still owns the tenant boundary. The existing Market Data Domain still owns public candles and prices when this package is later implemented. This package owns the **product outcomes**: adapters, provider normalization, market symbols, ticker projection, candlestick projection, order-book projection, market-data health, and provider metadata.

| Field                                | Value                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Package ID                           | W2-S03                                                                                             |
| Master Plan / Execution Roadmap name | Market Data Foundation (named Market Data Domain / Live Market Data; Wave 4 full exit not claimed) |
| Product name                         | Market Data Foundation                                                                             |
| Wave                                 | 2 — Connection Management                                                                          |
| Capabilities (inventory IDs)         | Live Market Data foundation; Market Data Domain (public candles / prices already named)            |
| Complexity                           | L                                                                                                  |
| Previous                             | W2-S02 CLOSED                                                                                      |
| Next after W2-S03 Close              | Remaining Wave 2 packages as sequenced by Product Owner; Wave 4 remaining outcomes stay later      |

---

## Business Goal

- **Goal:** After successful Exchange Connectivity, the product honestly provides market data to internal product features. Market Data becomes a reusable product foundation for later waves.
- **Honesty:** **Market data available** means ticker, candle, and order-book projections were received, normalized, and validated. **Market data available** does not mean Trading enabled.
- **Master Plan reference:** Market Data Domain already named; Live Market Data already named; Binance / Bybit / OKX already named. This package does not revise those names.
- **Metric this package must meet or not regress:** credential exposure **0**; default misconfig **0**; cross-workspace leak **0**; no dishonest trading claim; no local secret store; no fake ticker, candles, or order book. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** W2-S02 proves that an Exchange connection can establish an authenticated session. That Connected is not market data. Paying customers and later product features still cannot honestly see symbols, ticker, candles, or order book from Binance, Bybit, or OKX.
- **Who feels it:** Workspace operators who connected an exchange and need honest market data; later waves that must consume reusable market data rather than invent a second venue reader; Product Owner who cannot sell “market data” from connectivity proof alone.
- **What they must do today that they should not:** Treat Connected as prices, ask an engineer to probe a venue, or pretend that handshake success is ticker, candles, or an order book.

---

## Business Value

- **Value delivered at W2-S03 Close (after implementation):** For offered Exchange providers, an operator can open Market Data, select an Exchange, choose a symbol, and view honest ticker, candles, and order book. Provider unavailable and stale data are honest. Workspace and authorization boundaries hold. No trading capability is offered.
- **What remains blocked until later packages / waves:** WebSocket streaming product; Kraken and further venues beyond the extension contract; balances; positions; leverage; order placement; execution engine; risk engine; strategy engine; paper-trading changes; live trading; monitoring product; analytics product; billing; Wave 4 full exit; Wave 6 live capital.

---

## Current State

| Capability or surface                    | Status                  | Evidence                     |
| ---------------------------------------- | ----------------------- | ---------------------------- |
| Connection Management product            | Already exists (W2-S01) | W2-S01 CLOSED                |
| Exchange Connectivity Foundation         | Already exists (W2-S02) | W2-S02 CLOSED                |
| Vault-backed exchange credentials        | Already exists          | W2-S01 / W2-S02 consumed     |
| Authenticated exchange session proof     | Already exists (W2-S02) | Connected is not market data |
| Market Data adapters                     | Missing                 | This package                 |
| Provider normalization                   | Missing                 | This package                 |
| Market symbols                           | Missing                 | This package                 |
| Ticker / candles / order book projection | Missing                 | This package                 |
| Market Data health / provider metadata   | Missing                 | This package                 |
| Orders / balances / positions / trading  | Out of this package     | Wave 6 / later owners        |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- W2-S01 is CLOSED and must not be redesigned.
- W2-S02 is CLOSED and must not be redesigned.
- Vault owns ciphertext. Market Data never stores customer secrets locally.
- Public market-data paths must not invent a trading key.
- Market data available never means Trading enabled.
- WebSocket streaming, trading I/O, and execution are not this package.

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Exchange Connectivity; Connection Management facade; Vault; Authentication; Authorization; Workspace Isolation; Audit; Platform; certified paper path; Ledger; Canonical Order Path |
| Minor extension | Existing Market Data Domain / Live Market Data receives product outcomes for symbols, ticker, candles, order book, health, and metadata                                             |
| Major extension | Nothing. No new protocol engine domain. No second Connections product.                                                                                                              |
| New justified   | Nothing. No new bounded context. No second vault. No trading product.                                                                                                               |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Wave 1, W2-S01, or W2-S02 ownership                                                                        |

| Area                 | Owner                 | This package must not own        |
| -------------------- | --------------------- | -------------------------------- |
| Customer credentials | Vault                 | Ciphertext / encryption keys     |
| Identity / sessions  | Authentication        | Login, MFA, recovery             |
| Permissions          | Authorization         | Role matrix redesign             |
| Workspace membership | Workspace             | Tenancy SoT                      |
| Hardening defaults   | Security Platform     | CSP / rate-limit product rewrite |
| Audit persistence    | Security Audit        | Append-only store                |
| Connection product   | Connection Management | Catalog / lifecycle redesign     |
| Session proof        | Exchange Connectivity | Handshake / Connected redesign   |
| Venue protocol       | Exchange Adapter      | New protocol engine domain       |
| Money / orders       | Ledger / Order Path   | Live trading / execution         |

---

## Dependencies

| Dependency                   | Kind                 | Status required before this package            |
| ---------------------------- | -------------------- | ---------------------------------------------- |
| Wave 1 CERTIFIED COMPLETE    | Prior wave           | **Required**                                   |
| W2-S01 Connection Management | Prior Wave 2 package | **CLOSED**                                     |
| W2-S02 Exchange Connectivity | Prior Wave 2 package | **CLOSED**                                     |
| Vault                        | Earlier V3 package   | Closed / available                             |
| Authentication               | Earlier V3 package   | Closed                                         |
| Authorization                | Earlier V3 package   | Closed                                         |
| Workspace Isolation          | Earlier V3 package   | Closed                                         |
| Security Platform            | Earlier V3 package   | Closed                                         |
| Security Audit               | Earlier V3 package   | Closed                                         |
| Market Data Domain owner     | Version 2 product    | Exists (public paths partial; this foundation) |

This package does **not** depend on:

- Wave 3 Monitoring / durable ops products
- Wave 4 remaining outcomes (Kraken, public market-data/WS streaming product, Wave 4 exit)
- Wave 5 production Telegram / SMTP delivery
- Wave 6 live trading ADR
- Wave 7 multi-provider AI platform
- Billing, analytics dashboards, or Wave 9 SaaS admin

---

## Implementation Scope

### IN Scope

| Item                   | Customer meaning                                                        | Notes / owner inside existing domain        |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| Market Data adapters   | Offered exchanges can supply market data through one adapter contract   | Existing Market Data Domain / adapter owner |
| Provider normalization | Binance / Bybit / OKX payloads become one product model                 | This package                                |
| Market symbols         | Operator can choose a symbol offered by the selected exchange           | This package                                |
| Ticker projection      | Operator can view an honest ticker                                      | This package                                |
| Candlestick projection | Operator can view honest candles                                        | This package                                |
| Order Book projection  | Operator can view an honest order book                                  | This package                                |
| Market Data health     | Healthy vs unavailable vs stale is visible                              | This package                                |
| Provider metadata      | Product shows which provider supplied the data — not trading capability | This package                                |
| Customer workflows     | Open Market Data → Select Exchange → Choose Symbol → View projections   | Operator Walkthrough                        |
| Security boundaries    | Authn / Authz / Isolation / Vault / Audit / Platform consumed           | Does not redefine                           |
| Audit interaction      | Market-data read / fail / unavailable attributable where required       | Emits to Security Audit; does not own store |
| Failure philosophy     | Fail closed; honest unavailable / stale; no fake data; no trading claim | Security Default Policy                     |
| Validation strategy    | Slices, Close criteria, evidence, regressions                           | This package + validation plan              |

### OUT OF Scope

| Item                                  | Why out                             | Owner later                    |
| ------------------------------------- | ----------------------------------- | ------------------------------ |
| Order placement                       | No trading                          | Canonical Order Path / Wave 6  |
| Execution engine                      | Order execution                     | Canonical Order Path           |
| Portfolio                             | Holdings product                    | Later                          |
| Balances                              | Not market data                     | Portfolio / later              |
| Positions                             | Not market data                     | Portfolio / later              |
| Risk Engine                           | Risk SoT                            | Risk                           |
| Strategy Engine                       | Strategy / Runtime                  | Strategy                       |
| Paper Trading                         | Already certified; not this package | Version 2 paper path           |
| Monitoring                            | Ops health product                  | Wave 3                         |
| Analytics                             | Analytics product                   | Later                          |
| Billing                               | SaaS commercial                     | Wave 9                         |
| WebSocket trading                     | Trading stream                      | Later / Wave 6                 |
| WebSocket streaming product           | Streaming I/O                       | Later venue / Wave 4 remaining |
| Secrets                               | Credential store                    | Vault                          |
| Identity                              | People                              | Authentication                 |
| Authentication                        | Sign-in                             | Authentication                 |
| Authorization                         | Roles                               | Authorization                  |
| Workspace                             | Tenancy                             | Workspace                      |
| Audit persistence                     | Append-only store                   | Security Audit                 |
| Connection Management redesign        | Facade already shipped              | W2-S01 CLOSED                  |
| Exchange Connectivity redesign        | Handshake already shipped           | W2-S02 CLOSED                  |
| Kraken / extra venues as offered Core | Not in this package’s offered list  | Later / extension contract     |
| Wave 3+ exit                          | Later wave packages                 | Execution Roadmap              |

Nothing in IN Scope may be invented. If a desired item is not already named, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                             | Fail if                                                  |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Operator opens Market Data and selects an offered Exchange (Binance, Bybit, or OKX) | A second Connections product; Exchange catalog abandoned |
| 2   | Operator chooses a market symbol for that exchange                                  | Symbols invented or mixed across providers               |
| 3   | Operator views ticker, candles, and order book as normalized product projections    | Raw vendor dump; missing projections; trading ticket     |
| 4   | Provider unavailable is honest; no fake ticker, candles, or order book              | Fake success; secret leaked in the error                 |
| 5   | Stale data is shown as stale; it is not presented as current                        | Stale data claimed current                               |
| 6   | Workspace A cannot use Workspace B market-data context or connections               | Cross-tenant leak                                        |
| 7   | Unauthorized roles cannot open or mutate Market Data                                | Reader/unauthorized can bypass                           |
| 8   | Product never offers orders, trading, execution, portfolio, balances, or positions  | Trading or portfolio claim                               |

The customer never uses SSH, customer `.env`, local secret files, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Market Data Walkthrough

□ Sign in to a workspace with market-data permission
□ Open Market Data
□ Select Exchange (Binance, Bybit, or OKX)
□ Choose Symbol
□ View Ticker
□ View Candles
□ View Order Book
□ Observe Provider Unavailable — honest; no fake data
□ Observe stale data handling — stale is not current
□ Foreign workspace market data — denied
□ Unauthorized role — Market Data denied
□ Confirm no orders, no trading, no execution, no portfolio, no balances, no positions

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                   |
| ----------------------- | ----------------------- |
| Walkthrough name        | Market Data Walkthrough |
| Executed in the product | Yes (at Close)          |
| Overall                 | PENDING APPROVAL        |

---

## Architecture Review (planning intent)

| Rule                                                           | Decision                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| No new bounded context unless the Master Plan already named it | Market Data Domain already owns public candles / prices; Connection Management already owns the facade |
| No ownership drift                                             | Vault / Auth / Authz / Workspace / Platform / Audit / Connections / Exchange Connectivity unchanged    |
| No duplicate Source of Truth                                   | No second vault; no second Connections product; no second order path; no trading SoT                   |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                    |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                              |
| Justified persistence/ports inside an existing owner           | Projections live in Market Data Domain; secrets remain in Vault; Connected remains W2-S02              |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track; reopening Wave 1; redesigning W2-S01 or W2-S02; claiming Trading; introducing WebSockets under planning.

---

## Security Review (planning intent)

Full planning Security Review: [`w2-s03-security-review.md`](./w2-s03-security-review.md).

| Category               | Planning verdict |
| ---------------------- | ---------------- |
| Spoofing               | PASS (intent)    |
| Tampering              | PASS (intent)    |
| Repudiation            | PASS (intent)    |
| Information Disclosure | PASS (intent)    |
| Denial of Service      | PASS (intent)    |
| Elevation of Privilege | PASS (intent)    |

Threats this package must reduce:

| Threat                                  | Control in this package                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| Credential theft / local secret store   | Vault-only retrieve if a path needs credentials; never store locally |
| Broken access control                   | Authz + workspace isolation on every Market Data action              |
| Dishonest market data                   | Projections only after receive / normalize / validate                |
| Replay of a prior snapshot as current   | Replay protection; client cannot set ticker, candles, or book        |
| Cross-tenant market-data use            | Workspace-scoped Market Data and connection selection                |
| Vendor outage shown as live data        | Honest Provider Unavailable; no fake projections                     |
| Stale snapshot shown as current         | Honest stale handling                                                |
| Rate-limit hammering / secret in errors | Rate-limit awareness; operator-safe errors; no secret leakage        |
| Market data used as trading enablement  | Capability projection excludes trading                               |
| Integrity failure of provider payloads  | Validate before project; reject malformed data                       |

Controls explicitly **not** this package:

| Control                   | Owner                |
| ------------------------- | -------------------- |
| Secret encryption at rest | Vault                |
| Session / login           | Authentication       |
| Role matrix               | Authorization        |
| Audit append-only store   | Security Audit       |
| Platform hardening suite  | Security Platform    |
| Live order controls       | Wave 6 / Gate / Risk |

Security Verification Standard is **mandatory**. Complete at Close with Regression Suite.

---

## Honesty model (planning)

| Claim                     | Allowed after this package? | Meaning                                        |
| ------------------------- | --------------------------- | ---------------------------------------------- |
| **Market data available** | Yes, if projections succeed | Ticker, candles, and order book were validated |
| **Provider Unavailable**  | Yes                         | Provider could not supply market data          |
| **Stale**                 | Yes                         | Last validated data is not current             |
| **Trading enabled**       | **No**                      | Trading is not this package                    |
| **Orders available**      | **No**                      | Out of scope                                   |
| **Balances / positions**  | **No**                      | Out of scope                                   |
| **Market data streaming** | **No**                      | WebSocket streaming product out of scope       |
| **Execution ready**       | **No**                      | Out of scope                                   |

Exchange Connected is **not** the customer success for Market Data. Connected remains W2-S02 honesty: authenticated exchange communication succeeded. This package adds market-data projections; it does not change Connected meaning.

---

## Provider model (planning)

Offered in this package:

```text
Exchange
  ├── Binance
  ├── Bybit
  └── OKX
  └── (additional providers allowed by the existing extension contract — not offered now)
```

| Layer                         | Meaning                                  | Owner                                    |
| ----------------------------- | ---------------------------------------- | ---------------------------------------- |
| **Connection Type: Exchange** | Already offered by Connection Management | Connection Management catalog (consumed) |
| **Provider**                  | Binance, Bybit, OKX                      | Catalog consumed; market-data owned here |
| **Connection**                | Workspace instance                       | Connection Management                    |
| **Authenticated session**     | Connectivity proof                       | Exchange Connectivity                    |
| **Secret**                    | Credential material                      | Vault                                    |
| **Market Data adapters**      | Provider-independent receive contract    | This package                             |
| **Normalization / symbols**   | One product model; offered symbols       | This package                             |
| **Projections / health**      | Ticker, candles, book, health, metadata  | This package                             |

Architecture must remain provider-independent. Design must allow additional providers without redesigning Connection Management, Exchange Connectivity, Vault, or this foundation. Do not offer Kraken, Coinbase, or other venues as Wave 2 Core in this package.

Public market-data paths must not invent a trading key. If a path needs credentials, retrieve them from Vault for the owning workspace only. Credentials must not be used to place orders or read balances or positions.

Do not implement provider adapters, SDKs, WebSockets, or network code in this planning package.

---

## Implementation Slices (planning — not to implement now)

### W2-S03-a — Market Data adapters

**Goal:** One provider-independent Market Data adapter contract for Binance, Bybit, and OKX, with room for additional providers later.
**Done when:** Offered Exchange providers share the same receive / normalize / fail product meaning.
**Must not:** New Connections product; new Vault; offer unlisted providers as Core; trading adapters; WebSockets; SDKs shipped as planning.

### W2-S03-b — Provider normalization and market symbols

**Goal:** Provider payloads normalize into one product model. Operator can choose a symbol for the selected exchange.
**Done when:** Symbols are provider-scoped, validated, and selectable without mixing venues.
**Must not:** Invent symbols; cross-provider symbol alias as Source of Truth; balances; positions.

### W2-S03-c — Ticker, candlestick, and order-book projections

**Goal:** Operator can view honest ticker, candles, and order book for the chosen symbol.
**Done when:** Walkthrough projections are evidenced; malformed provider data is not projected.
**Must not:** Order ticket; execution; WebSocket stream product; trading copy.

### W2-S03-d — Market Data health, provider metadata, and stale handling

**Goal:** Healthy vs unavailable vs stale is honest. Provider metadata does not imply trading.
**Done when:** Provider Unavailable and stale handling are evidenced without secret leakage.
**Must not:** Monitoring product; alerting platform; automatic trading on stale or missing data.

### W2-S03-e — Security verification and Close evidence

**Goal:** Verification Standard + regressions + Product Walkthrough PASS.
**Done when:** Close checklist eligible.
**Must not:** Scope expansion into Wave 3+, Wave 4 exit, WebSockets, or Wave 6.

---

## Validation Plan

Companion: [`w2-s03-validation-plan.md`](./w2-s03-validation-plan.md).

| Gate                                                          | Required                       |
| ------------------------------------------------------------- | ------------------------------ |
| Unit tests                                                    | Yes                            |
| Integration tests                                             | Yes                            |
| UI tests                                                      | Yes (customer-visible package) |
| Manual product walkthrough                                    | **Yes**                        |
| Security walkthrough                                          | **Yes**                        |
| Security verification (checklist)                             | **Yes**                        |
| Security Verification Standard + Regression Suite             | **Yes**                        |
| Architecture verification (checklist)                         | **Yes**                        |
| Product verification (checklist)                              | **Yes**                        |
| Customer acceptance of Master Plan outcomes this package owns | **Yes**                        |

---

## Required Reports

| Report                 | When                        | Path convention                                               |
| ---------------------- | --------------------------- | ------------------------------------------------------------- |
| Implementation Package | Before Approval             | `w2-s03-implementation-package.md` (this document)            |
| Implementation Report  | After Implementation        | `w2-s03-implementation-report.md`                             |
| Architecture Review    | After Implementation Report | `w2-s03-architecture-review.md`                               |
| Security Review        | After Architecture Review   | `w2-s03-security-review.md` (planning now; evidence at Close) |
| Product Review         | After Security Review       | `w2-s03-product-review.md`                                    |
| Validation evidence    | After Product Review        | `w2-s03-validation-plan.md` + recorded results                |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard                    |

**Forbidden:** Version 2-style RC documents; ADRs except Master Plan’s named Wave 6 live-capital ADR; Master Plan edits from inside this package; Wave 1 reopen; W2-S01 redesign; W2-S02 redesign.

---

## Package Close Checklist

| #   | Gate                          | Verdict                |
| --- | ----------------------------- | ---------------------- |
| 1   | Implementation Review         | NOT DONE (planning)    |
| 2   | Architecture Review           | NOT DONE (planning)    |
| 3   | Security Review               | NOT DONE (planning)    |
| 4   | Product Review                | NOT DONE (planning)    |
| 5   | Validation                    | NOT DONE (planning)    |
| 6   | All mandatory reports         | NOT DONE (planning)    |
| 7   | Master Plan compliance        | PASS (planning intent) |
| 8   | Product Principles compliance | PASS (planning intent) |
| 9   | Customer walkthrough          | NOT DONE (planning)    |

---

## Customer-visible Changes

**Fill at Close.**

-

What the UI / copy must **not** claim:

- Trading enabled
- Orders, balances, or positions available
- Live trading connected
- Execution ready
- WebSocket stream product
- Monitoring, analytics, or billing products
- Wave 4 COMPLETE or Wave 6 live capital

---

## Next Package Dependencies

| Field                             | Value                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| This package unblocks             | Honest market-data projections for later Wave 2 / later-wave consumers |
| This package does **not** unblock | Wave 4 exit; Wave 5 delivery; Wave 6 live; Wave 3 monitoring; trading  |
| Remaining wave work               | Wave 2 remaining sequencing; Wave 4 remaining named outcomes           |

---

## Lessons Learned

**Fill at Close.**

-

---

## Package Summary Standard (mandatory at Close)

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Answers: **PENDING CLOSE** (planning package only).

---

## Mandatory Questions (Planning Package answers)

### 1. What business problem does W2-S03 solve?

After successful Exchange Connectivity, the product still cannot honestly provide market data. Operators and later features cannot see normalized symbols, ticker, candles, or order book from supported exchanges.

### 2. Which existing products does it consume?

Exchange Connectivity (W2-S02), Connection Management, Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

### 3. What does W2-S03 own?

Market Data adapters, provider normalization, market symbols, ticker projection, candlestick projection, order-book projection, Market Data health, and provider metadata.

### 4. What is explicitly out of scope?

Order placement, execution engine, portfolio, balances, positions, WebSocket trading, strategy execution, paper trading, monitoring, billing, analytics, risk engine, trading, secrets, identity, authentication, authorization, workspace, audit persistence, Connection Management redesign, Exchange Connectivity redesign, and Wave 1 changes.

### 5. Which providers are planned?

Binance, Bybit, OKX. Architecture must remain provider-independent. Additional providers are not offered as Core in this package.

### 6. Does W2-S03 introduce trading?

No.

### 7. Does W2-S03 modify Wave 1?

No.

---

## Future guidance (binding)

1. No production code before Product Owner Approval.
2. No Master Plan, Version 2, architecture, or ownership changes from this package.
3. Do not reopen Wave 1. Do not redesign W2-S01. Do not redesign W2-S02.
4. Do not implement adapters, SDKs, APIs, WebSockets, or network code under the guise of planning.
5. Do not place orders, read balances, or enable trading to “test market data.”
6. Conflicts: **Master Plan wins.**

---

**STOP.** Wait for Product Owner review before W2-S03 implementation planning is approved.
