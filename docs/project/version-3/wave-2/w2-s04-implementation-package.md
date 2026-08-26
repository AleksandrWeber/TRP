# W2-S04 Paper Trading Foundation — Implementation Package

```text
Package:            W2-S04
Name:               Paper Trading Foundation
Also known as:      Paper Trading · Paper execution foundation
Wave:               2 — Connection Management
Master Plan map:    Paper-first product already named. This package does not
                    revise that map. It sequences Paper Trading Foundation after
                    W2-S03 Close so simulated execution consumes Market Data.
Date:               2026-08-26
Status:             Implementation Package — Planning COMPLETE. Awaiting Product Owner Review and Approval.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Consumed products (read-only):** [`market-data-overview.md`](./market-data-overview.md) · [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md) · [`connection-management-overview.md`](./connection-management-overview.md)

**Companions:**

| Document                                                     | Role                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| [`w2-s04-product-scope.md`](./w2-s04-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w2-s04-security-review.md`](./w2-s04-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w2-s04-validation-plan.md`](./w2-s04-validation-plan.md)   | How Close is proven                                   |
| [`paper-trading-overview.md`](./paper-trading-overview.md)   | Operator / PO language product                        |
| [`w2-s04-planning-summary.md`](./w2-s04-planning-summary.md) | Planning open record                                  |
| [`wave-2-progress.md`](./wave-2-progress.md)                 | Wave 2 package status                                 |

**Prerequisites:**

| Prerequisite                    | Status                                           |
| ------------------------------- | ------------------------------------------------ |
| Version 2                       | **CERTIFIED**                                    |
| Wave 1 Security Foundation      | **CERTIFIED COMPLETE** (Product Owner authority) |
| W2-S01 Connection Management    | **CLOSED** (consumed; not redesigned)            |
| W2-S02 Exchange Connectivity    | **CLOSED** (consumed; not redesigned)            |
| W2-S03 Market Data Foundation   | **CLOSED** (consumed; not redesigned)            |
| V3-S01 Authentication & Session | **CLOSED** (consumed)                            |
| V3-S02 RBAC Product             | **CLOSED** (consumed)                            |
| V3-S03 Secret Vault             | **CLOSED** / Vault platform available (consumed) |
| V3-S04 OWASP & API Hardening    | **CLOSED** (consumed)                            |
| V3-S05 Audit Trail Foundation   | **CLOSED** (consumed)                            |
| V3-S06 Workspace Isolation      | **CLOSED** (consumed)                            |
| Master Plan                     | **FROZEN** — this package does not revise it     |
| Security Verification Standard  | **Approved** (mandatory)                         |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package).** Paper-first product is already named. Market Data already exists. This package sequences the foundation that simulates order execution using Market Data without placing real exchange orders. Wave 1 remains CERTIFIED COMPLETE. W2-S01, W2-S02, and W2-S03 remain CLOSED. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Paper Trading Foundation consumes Market Data, Exchange Connectivity, Connection Management, and Wave 1.
It does NOT redesign Market Data, Exchange Connectivity, or Connection Management.
It does NOT own secrets, identity, authz, workspace, audit persistence, or monitoring.
It does NOT place real exchange orders or move real capital.
Paper fill means simulated execution used a Market Data snapshot.
Paper fill does NOT mean the exchange accepted an order.
Paper trading does NOT mean Live Trading enabled.
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
Implementation           ← W2-S04 slices only (after Approval)
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

Do not skip a stage. Do not start production code before Approval. Do not open Wave 3 from this package. Do not claim Wave 2 exit. Do not claim Live Trading.

---

## Overview

W2-S04 opens **Paper Trading Foundation**. It is the product package that lets the product **simulate order execution using Market Data** without placing real exchange orders and without real capital.

It consumes W2-S03 Market Data Foundation, W2-S02 Exchange Connectivity, and W2-S01 Connection Management. Operators still manage Exchange connections in Connections and view market data in Market Data. This package does not invent a second Connections product, does not redesign Market Data, and does not enable Live Trading.

Vault still owns credentials. Authentication still owns identity. Authorization still owns permission. Workspace Isolation still owns the tenant boundary. This package owns the **product outcomes**: paper orders, paper positions, paper fills, paper portfolio, paper balances, execution simulator, order matching simulator, PnL calculation, paper account state, and paper execution history.

| Field                                | Value                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Package ID                           | W2-S04                                                                            |
| Master Plan / Execution Roadmap name | Paper Trading Foundation (paper-first product already named)                      |
| Product name                         | Paper Trading Foundation                                                          |
| Wave                                 | 2 — Connection Management                                                         |
| Capabilities (inventory IDs)         | Paper trading / paper execution foundation (paper-first already named)            |
| Complexity                           | L                                                                                 |
| Previous                             | W2-S03 CLOSED                                                                     |
| Next after W2-S04 Close              | Remaining Wave 2 packages as sequenced by Product Owner; Live Trading stays later |

---

## Business Goal

- **Goal:** Allow operators to safely test strategies, signals, and workflows using simulated execution driven by real Market Data. Paper Trading becomes the mandatory foundation before Live Trading.
- **Honesty:** **Paper fill** means simulated execution used a Market Data snapshot. **Paper fill** does not mean the exchange accepted an order. **Paper trading** does not mean Live Trading enabled.
- **Master Plan reference:** Paper-first product already named. This package does not revise that name.
- **Metric this package must meet or not regress:** credential exposure **0**; default misconfig **0**; cross-workspace leak **0**; no dishonest Live Trading claim; no fabricated market prices; no exchange order placement; no real capital. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** W2-S03 provides honest Market Data. That is not simulated execution. Paying customers still cannot safely place paper buys and sells, observe fills, positions, PnL, and portfolio against real Market Data without risking capital or calling exchange order APIs.
- **Who feels it:** Workspace operators who need to test strategies, signals, and workflows safely; Product Owner who cannot sell Live Trading without a mandatory paper foundation; later waves that must consume paper execution rather than invent dishonest theater.
- **What they must do today that they should not:** Treat Market Data as trading, invent fake prices for demos, or skip straight to live capital risk.

---

## Business Value

- **Value delivered at W2-S04 Close (after implementation):** An operator can open Paper Trading, create a Paper Account, select Exchange and Symbol, place Buy and Sell, observe Fill, Position, PnL, and Portfolio, and cancel a paper order — all driven by real Market Data, with workspace and authorization boundaries held, and with no real capital or exchange order placement.
- **What remains blocked until later packages / waves:** Live Trading; exchange order APIs; exchange balances and positions; risk engine; leverage; margin; liquidation; WebSocket trading; strategy engine; monitoring product; analytics product; billing; Wave 6 live capital.

---

## Current State

| Capability or surface                         | Status                       | Evidence                 |
| --------------------------------------------- | ---------------------------- | ------------------------ |
| Connection Management product                 | Already exists (W2-S01)      | W2-S01 CLOSED            |
| Exchange Connectivity Foundation              | Already exists (W2-S02)      | W2-S02 CLOSED            |
| Market Data Foundation                        | Already exists (W2-S03)      | W2-S03 CLOSED            |
| Vault-backed exchange credentials             | Already exists               | W2-S01 / W2-S02 consumed |
| Authenticated exchange session proof          | Already exists (W2-S02)      | Connected is not trading |
| Honest Market Data snapshots                  | Already exists (W2-S03)      | Not paper execution      |
| Paper orders / fills / positions / portfolio  | Missing as W2-S04 foundation | This package             |
| Execution / matching simulators               | Missing                      | This package             |
| PnL / paper account state / execution history | Missing                      | This package             |
| Live Trading / exchange order placement       | Out of this package          | Wave 6 / Order Path      |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- W2-S01, W2-S02, and W2-S03 are CLOSED and must not be redesigned.
- Vault owns ciphertext. Paper Trading never stores customer secrets locally.
- Paper Trading must consume Market Data and never fabricate market prices.
- Execution must use Market Data snapshots.
- No simulated “exchange accepted” messages.
- No real capital. No exchange order APIs. No Live Trading.
- No leverage, margin, liquidation, risk engine, or strategy engine.
- No provider SDK redesign.

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Market Data; Exchange Connectivity; Connection Management facade; Vault; Authentication; Authorization; Workspace Isolation; Audit; Platform; Ledger; Canonical Order Path (not live) |
| Minor extension | Existing paper-first product receives product outcomes for paper accounts, simulated execution, fills, positions, portfolio, PnL, and history                                         |
| Major extension | Nothing. No new protocol engine domain. No second Connections product. No Live Trading domain.                                                                                        |
| New justified   | Nothing. No new bounded context. No second vault. No live trading product.                                                                                                            |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Wave 1, W2-S01, W2-S02, or W2-S03 ownership                                                                  |

| Area                  | Owner                 | This package must not own         |
| --------------------- | --------------------- | --------------------------------- |
| Customer credentials  | Vault                 | Ciphertext / encryption keys      |
| Identity / sessions   | Authentication        | Login, MFA, recovery              |
| Permissions           | Authorization         | Role matrix redesign              |
| Workspace membership  | Workspace             | Tenancy SoT                       |
| Hardening defaults    | Security Platform     | CSP / rate-limit product rewrite  |
| Audit persistence     | Security Audit        | Append-only store                 |
| Connection product    | Connection Management | Catalog / lifecycle redesign      |
| Session proof         | Exchange Connectivity | Handshake / Connected redesign    |
| Market prices / books | Market Data           | Adapters / projections redesign   |
| Live money / orders   | Ledger / Order Path   | Live trading / exchange execution |

---

## Dependencies

| Dependency                    | Kind                 | Status required before this package |
| ----------------------------- | -------------------- | ----------------------------------- |
| Wave 1 CERTIFIED COMPLETE     | Prior wave           | **Required**                        |
| W2-S01 Connection Management  | Prior Wave 2 package | **CLOSED**                          |
| W2-S02 Exchange Connectivity  | Prior Wave 2 package | **CLOSED**                          |
| W2-S03 Market Data Foundation | Prior Wave 2 package | **CLOSED**                          |
| Vault                         | Earlier V3 package   | Closed / available                  |
| Authentication                | Earlier V3 package   | Closed                              |
| Authorization                 | Earlier V3 package   | Closed                              |
| Workspace Isolation           | Earlier V3 package   | Closed                              |
| Security Platform             | Earlier V3 package   | Closed                              |
| Security Audit                | Earlier V3 package   | Closed                              |

This package does **not** depend on:

- Wave 3 Monitoring / durable ops products
- Wave 4 remaining outcomes
- Wave 5 production Telegram / SMTP delivery
- Wave 6 live trading ADR
- Wave 7 multi-provider AI platform
- Billing, analytics dashboards, or Wave 9 SaaS admin
- Risk engine, leverage, margin, liquidation, or strategy engine

---

## Implementation Scope

### IN Scope

| Item                     | Customer meaning                                                         | Notes / owner inside existing domain |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------ |
| Paper orders             | Operator can place and manage simulated buy/sell                         | This package                         |
| Paper positions          | Operator can see simulated positions                                     | This package                         |
| Paper fills              | Operator can see simulated fills driven by Market Data                   | This package                         |
| Paper portfolio          | Operator can see simulated portfolio                                     | This package                         |
| Paper balances           | Operator can see simulated balances                                      | This package                         |
| Execution simulator      | Product simulates execution without exchange order APIs                  | This package                         |
| Order matching simulator | Product matches paper orders against Market Data snapshots               | This package                         |
| PnL calculation          | Operator can see paper PnL                                               | This package                         |
| Paper account state      | Operator can create and use a paper account                              | This package                         |
| Paper execution history  | Operator can review paper order / fill history                           | This package                         |
| Customer workflows       | Sign in → Open Paper Trading → Create Account → Select → Place → Observe | Operator Walkthrough                 |
| Security boundaries      | Authn / Authz / Isolation / Vault / Audit / Platform consumed            | Does not redefine                    |
| Audit interaction        | Paper create / place / fill / cancel / fail attributable                 | Emits to Security Audit              |
| Failure philosophy       | Fail closed; consume Market Data; no venue theater; no real capital      | Security Default Policy              |
| Validation strategy      | Slices, Close criteria, evidence, regressions                            | This package + validation plan       |

### OUT OF Scope

| Item                           | Why out                    | Owner later                   |
| ------------------------------ | -------------------------- | ----------------------------- |
| Real exchange execution        | No live capital            | Canonical Order Path / Wave 6 |
| Exchange order APIs            | No venue order placement   | Canonical Order Path / Wave 6 |
| Exchange balances              | Not paper                  | Later live owners             |
| Exchange positions             | Not paper                  | Later live owners             |
| Exchange portfolio             | Not paper                  | Later live owners             |
| Risk Engine                    | Risk SoT                   | Risk                          |
| Leverage                       | Not this foundation        | Later / Risk                  |
| Margin engine                  | Not this foundation        | Later / Risk                  |
| Liquidation                    | Not this foundation        | Later / Risk                  |
| WebSocket trading              | Trading stream             | Later / Wave 6                |
| Strategy Engine                | Strategy / Runtime         | Strategy                      |
| Live Trading                   | Wave 6                     | Wave 6 / Order Path           |
| Monitoring                     | Ops health product         | Wave 3                        |
| Analytics                      | Analytics product          | Later                         |
| Billing                        | SaaS commercial            | Wave 9                        |
| Secrets                        | Credential store           | Vault                         |
| Identity                       | People                     | Authentication                |
| Authentication                 | Sign-in                    | Authentication                |
| Authorization                  | Roles                      | Authorization                 |
| Workspace                      | Tenancy                    | Workspace                     |
| Audit persistence              | Append-only store          | Security Audit                |
| Market Data redesign           | Foundation already shipped | W2-S03 CLOSED                 |
| Connection Management redesign | Facade already shipped     | W2-S01 CLOSED                 |
| Exchange Connectivity redesign | Handshake already shipped  | W2-S02 CLOSED                 |
| Provider SDK redesign          | Explicitly forbidden       | Not this package              |
| Wave 3+ exit                   | Later wave packages        | Execution Roadmap             |

Nothing in IN Scope may be invented. If a desired item is not already named, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                  | Fail if                                    |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Operator opens Paper Trading and creates a Paper Account                                 | Live trading or exchange account required  |
| 2   | Operator selects Exchange and Symbol using existing Connection / Market Data products    | Second catalog; invented symbols or prices |
| 3   | Operator places Buy and Sell as paper orders                                             | Exchange order API called                  |
| 4   | Fill, Position, PnL, and Portfolio are honest paper projections                          | Venue acceptance claim; fabricated prices  |
| 5   | Cancel affects paper order only                                                          | Exchange cancel attempted                  |
| 6   | Workspace A cannot use Workspace B paper accounts                                        | Cross-tenant leak                          |
| 7   | Unauthorized roles cannot open or mutate Paper Trading                                   | Privilege bypass                           |
| 8   | Product never offers Live Trading, real capital, leverage, margin, or exchange inventory | Live / leverage / exchange inventory claim |

The customer never uses SSH, customer `.env`, local secret files, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

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
□ Foreign workspace paper account — denied
□ Unauthorized role — Paper Trading denied
□ Confirm no real exchange execution, no Live Trading, no leverage, no margin, no exchange inventory

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                     |
| ----------------------- | ------------------------- |
| Walkthrough name        | Paper Trading Walkthrough |
| Executed in the product | Yes (at Close)            |
| Overall                 | PENDING APPROVAL          |

---

## Architecture Review (planning intent)

| Rule                                                           | Decision                                                                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | Paper-first product already named; Market Data / Connections / Connectivity remain existing owners       |
| No ownership drift                                             | Vault / Auth / Authz / Workspace / Platform / Audit / Connections / Connectivity / Market Data unchanged |
| No duplicate Source of Truth                                   | No second vault; no second Connections product; no second order path; no live trading SoT                |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                      |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                |
| Justified persistence/ports inside an existing owner           | Paper outcomes live in paper-first product; prices remain Market Data; secrets remain Vault              |

Forbidden: duplicate auth, vault, ledger, or live order path; hidden redesign; Version 2-style RC track; reopening Wave 1; redesigning W2-S01 / W2-S02 / W2-S03; claiming Live Trading; fabricating market prices; provider SDK redesign.

---

## Security Review (planning intent)

Full planning Security Review: [`w2-s04-security-review.md`](./w2-s04-security-review.md).

| Category               | Planning verdict |
| ---------------------- | ---------------- |
| Spoofing               | PASS (intent)    |
| Tampering              | PASS (intent)    |
| Repudiation            | PASS (intent)    |
| Information Disclosure | PASS (intent)    |
| Denial of Service      | PASS (intent)    |
| Elevation of Privilege | PASS (intent)    |

Threats this package must reduce:

| Threat                                      | Control in this package                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| Cross-tenant paper account use              | Workspace-scoped paper accounts and actions             |
| Unauthorized paper trading                  | Authz + workspace isolation on every action             |
| Client-set prices / fills / PnL             | Server-side simulation; reject client integrity fields  |
| Replay of Market Data snapshot or fill      | Replay protection; freshness honesty                    |
| Fabricated market prices                    | Consume Market Data only                                |
| Simulated “exchange accepted” venue theater | Honesty rules; no venue acceptance messages             |
| Credentials used for live orders            | No exchange order APIs                                  |
| Paper presented as live capital             | Capability and copy exclude Live Trading / real capital |
| Integrity failure of paper history / PnL    | Order integrity + PnL integrity rules                   |

Controls explicitly **not** this package:

| Control                   | Owner                |
| ------------------------- | -------------------- |
| Secret encryption at rest | Vault                |
| Session / login           | Authentication       |
| Role matrix               | Authorization        |
| Audit append-only store   | Security Audit       |
| Platform hardening suite  | Security Platform    |
| Market Data integrity     | W2-S03               |
| Live order controls       | Wave 6 / Gate / Risk |

Security Verification Standard is **mandatory**. Complete at Close with Regression Suite.

---

## Honesty model (planning)

| Claim                                | Allowed after this package? | Meaning                                         |
| ------------------------------------ | --------------------------- | ----------------------------------------------- |
| **Paper account created**            | Yes                         | Workspace-scoped simulated account exists       |
| **Paper order placed**               | Yes                         | Simulated order exists; not exchange order      |
| **Paper fill**                       | Yes, if simulator matched   | Simulated execution used a Market Data snapshot |
| **Paper position / PnL / portfolio** | Yes                         | Simulated projections                           |
| **Exchange accepted**                | **No**                      | No simulated venue acceptance theater           |
| **Live Trading enabled**             | **No**                      | Live Trading is not this package                |
| **Real capital committed**           | **No**                      | No real capital                                 |
| **Exchange balances / positions**    | **No**                      | Out of scope                                    |
| **Leverage / margin ready**          | **No**                      | Out of scope                                    |

Market Data available is **not** the customer success for Paper Trading. Market Data remains W2-S03 honesty. This package adds paper simulation; it does not change Market Data meaning.

---

## Planning principles (binding)

1. Paper Trading must consume Market Data.
2. Paper Trading must never fabricate market prices.
3. Execution must use Market Data snapshots.
4. No simulated “exchange accepted” messages.
5. No real capital.
6. No provider SDK redesign.
7. No Live Trading.
8. No leverage. No margin. No liquidation. No risk engine. No strategy engine.

---

## Implementation Slices (planning — not to implement now)

### W2-S04-a — Paper account state

**Goal:** Workspace-scoped Paper Account create and ownership.
**Done when:** Operator can create a Paper Account; foreign workspace account use is denied.
**Must not:** Exchange account mapping; real balances; Live Trading; Market Data redesign.

### W2-S04-b — Execution and order matching simulators

**Goal:** Simulators consume Market Data snapshots and never fabricate prices.
**Done when:** Matching uses validated Market Data inputs; unavailable Market Data fails honestly.
**Must not:** Exchange order APIs; venue-acceptance theater; provider SDK redesign.

### W2-S04-c — Paper orders, fills, and cancel

**Goal:** Operator can Place Buy / Place Sell, observe Fill, and Cancel Order.
**Done when:** Walkthrough order / fill / cancel are evidenced without exchange order side effects.
**Must not:** Live orders; leverage; margin; WebSocket trading.

### W2-S04-d — Positions, portfolio, balances, PnL, and history

**Goal:** Operator can observe Position, PnL, Portfolio, paper balances, and execution history.
**Done when:** Projections are honest paper state; PnL integrity holds; client cannot set PnL.
**Must not:** Exchange inventory; risk engine; strategy engine; analytics product.

### W2-S04-e — Security verification and Close evidence

**Goal:** Verification Standard + regressions + Product Walkthrough PASS.
**Done when:** Close checklist eligible.
**Must not:** Scope expansion into Live Trading, Wave 3+, or leverage / margin / liquidation.

---

## Validation Plan

Companion: [`w2-s04-validation-plan.md`](./w2-s04-validation-plan.md).

| Gate                                                          | Required                       |
| ------------------------------------------------------------- | ------------------------------ |
| Unit tests                                                    | Yes                            |
| Integration tests                                             | Yes                            |
| Simulation tests                                              | Yes                            |
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
| Implementation Package | Before Approval             | `w2-s04-implementation-package.md` (this document)            |
| Implementation Report  | After Implementation        | `w2-s04-implementation-report.md`                             |
| Architecture Review    | After Implementation Report | `w2-s04-architecture-review.md`                               |
| Security Review        | After Architecture Review   | `w2-s04-security-review.md` (planning now; evidence at Close) |
| Product Review         | After Security Review       | `w2-s04-product-review.md`                                    |
| Validation evidence    | After Product Review        | `w2-s04-validation-plan.md` + recorded results                |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard                    |

**Forbidden:** Version 2-style RC documents; ADRs except Master Plan’s named Wave 6 live-capital ADR; Master Plan edits from inside this package; Wave 1 reopen; W2-S01 / W2-S02 / W2-S03 redesign.

---

## Package Close Checklist

| #   | Gate                          | Verdict                               |
| --- | ----------------------------- | ------------------------------------- |
| 1   | Implementation Review         | PASS (slices a–d; e = Close evidence) |
| 2   | Architecture Review           | PASS                                  |
| 3   | Security Review               | PASS                                  |
| 4   | Product Review                | PASS                                  |
| 5   | Validation                    | PASS                                  |
| 6   | All mandatory reports         | PASS                                  |
| 7   | Master Plan compliance        | PASS                                  |
| 8   | Product Principles compliance | PASS                                  |
| 9   | Customer walkthrough          | PASS                                  |

**Note:** Package Close remains Product Owner authority. Engineering must not declare W2-S04 CLOSED.

## Customer-visible Changes

**At Close evidence (2026-08-26):**

- Paper Account create / view / disable / activate
- Paper Orders create / review / list / cancel
- Execute Matching; Paper Fill
- Paper Positions, Portfolio, Balance, Realized/Unrealized PnL, Execution History
- Honesty: paper-only; not Live Trading; not exchange acceptance

What the UI / copy must **not** claim:

- Live Trading enabled
- Exchange accepted / exchange order placed
- Real capital committed
- Exchange balances or exchange positions available
- Leverage / margin / liquidation ready
- Risk engine or strategy engine
- Monitoring, analytics, or billing products
- Wave 2 COMPLETE or Wave 6 live capital

---

## Next Package Dependencies

| Field                             | Value                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ |
| This package unblocks             | Mandatory paper execution foundation before Live Trading                       |
| This package does **not** unblock | Live Trading; Wave 6 live capital; risk / leverage / margin; Wave 3 monitoring |
| Remaining wave work               | Wave 2 remaining sequencing as directed by Product Owner                       |

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

### 1. What business problem does W2-S04 solve?

Operators still cannot safely test strategies, signals, and workflows with simulated execution driven by real Market Data. Without Paper Trading Foundation, the product has honest market data but no mandatory paper execution foundation before Live Trading.

### 2. Which existing products does it consume?

Market Data Foundation (W2-S03), Exchange Connectivity (W2-S02), Connection Management (W2-S01), Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

### 3. What does W2-S04 own?

Paper orders, paper positions, paper fills, paper portfolio, paper balances, execution simulator, order matching simulator, PnL calculation, paper account state, and paper execution history.

### 4. What is explicitly out of scope?

Real exchange execution, exchange order APIs, exchange balances, exchange positions, exchange portfolio, risk engine, leverage, margin engine, liquidation, WebSocket trading, strategy engine, Live Trading, monitoring, analytics, billing, secrets, identity, authentication, authorization, workspace, audit persistence, Market Data redesign, Connection Management redesign, Exchange Connectivity redesign, provider SDK redesign, and Wave 1 changes.

### 5. Does W2-S04 execute real exchange orders?

No.

### 6. Does W2-S04 use real market data?

Yes. Paper Trading consumes Market Data and must never fabricate market prices.

### 7. Does W2-S04 modify Wave 1?

No.

---

## Future guidance (binding)

1. No production code before Product Owner Approval.
2. No Master Plan, Version 2, architecture, or ownership changes from this package.
3. Do not reopen Wave 1. Do not redesign W2-S01, W2-S02, or W2-S03.
4. Do not implement simulators, APIs, SDKs, WebSockets, or network code under the guise of planning.
5. Do not place real exchange orders or move real capital to “test paper trading.”
6. Do not fabricate market prices. Do not emit simulated “exchange accepted” messages.
7. Conflicts: **Master Plan wins.**

---

**STOP.** Wait for Product Owner review before W2-S04 implementation planning is approved.
