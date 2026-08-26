# 03 — Product Map

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Internal onboarding reference only
**Do not:** invent products or ownership; use package product-scope docs for dispute resolution

Wave 1 and Wave 2 products delivered or in flight. Certified Version 2 products that Version 3 **maintains without rebuilding** are listed at the end for context only.

---

## Naming

| ID family      | Meaning                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| **V3-S01…S06** | Wave 1 Security Foundation packages                                               |
| **V3-C01…C04** | Master Plan / Execution Roadmap IDs for Wave 2 Connection Management capabilities |
| **W2-S01…**    | Executed Wave 2 package IDs under `wave-2/`                                       |

W2-S01 maps to the Wave 2 / V3-C01 facade opening. Later W2 packages (S02 Market/Exchange sequencing, S03 Market Data, S04 Paper Trading) are Product Owner–sequenced operational packages. Do **not** silently equate W2-S02/S03/S04 one-to-one with V3-C02/C03/C04 without a planning revision.

**Sources:** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../wave-2/w2-s01-implementation-package.md`](../wave-2/w2-s01-implementation-package.md)

---

## Wave 1 — Security Foundation

### Authentication Platform (V3-S01)

| Field            | Content                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Durable register/sign-in, sessions (list/revoke/sign out everywhere), recovery and password change when host mail is available                                |
| **Owner**        | Authentication / Identity                                                                                                                                     |
| **Consumes**     | Workspace membership; host mail for recovery (when configured)                                                                                                |
| **Produces**     | Durable accounts, revocable sessions, recovery/password-change product paths                                                                                  |
| **Does NOT own** | MFA productization, social/passkeys, RBAC People UI, Vault, Connections, live trading, exchange keys                                                          |
| **Status**       | **CLOSED**                                                                                                                                                    |
| **Overview**     | [`../authentication-platform-overview.md`](../authentication-platform-overview.md) · [`../session-management-overview.md`](../session-management-overview.md) |

### People / RBAC Product (V3-S02)

| Field            | Content                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Admin assigns Reader / Researcher / Trader / Administrator in People; least-privilege enforcement                                         |
| **Owner**        | Authorization / Identity (RBAC product)                                                                                                   |
| **Consumes**     | Authentication, Workspace                                                                                                                 |
| **Produces**     | People directory, role assignment, attributable role changes on product surfaces                                                          |
| **Does NOT own** | Invites/disable-person product (later), Vault, Connections, live trading, full Security Audit customer UI                                 |
| **Status**       | **CLOSED**                                                                                                                                |
| **Overview**     | [`../people-product-overview.md`](../people-product-overview.md) · [`../permission-matrix-overview.md`](../permission-matrix-overview.md) |

### Secret Vault (V3-S03)

| Field            | Content                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Store customer secrets encrypted at rest; write-only after save; no plaintext readback                                                            |
| **Owner**        | Vault (Master Plan–justified new bounded context)                                                                                                 |
| **Consumes**     | Authentication, Authorization, Workspace Isolation                                                                                                |
| **Produces**     | Credential lifecycle (store / validate / replace / revoke / delete) as **Platform Complete** domain for consumers                                 |
| **Does NOT own** | Connections, Notifications, AI execution, Trading, Exchanges, venue round-trip validation                                                         |
| **Status**       | **Platform Complete CLOSED**; **Customer Complete remains open under Vault** (operator Vault UI intentionally deferred)                           |
| **Honesty**      | Vault holding a secret ≠ Binance Connected / delivery / AI online                                                                                 |
| **Overview**     | [`../secret-vault-overview.md`](../secret-vault-overview.md) · [`../v3-s03-close-criteria-resolution.md`](../v3-s03-close-criteria-resolution.md) |

### Security Platform Hardening (V3-S04)

| Field            | Content                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Purpose**      | Production-default OWASP / API hardening (headers, rate limits, validation, disclosure discipline) |
| **Owner**        | Security Platform (Identity/Auth platform HTTP)                                                    |
| **Consumes**     | Existing Wave 1 surfaces                                                                           |
| **Produces**     | Secure-by-default platform posture for Wave 1 surfaces (SEC-08)                                    |
| **Does NOT own** | Vault, Audit customer UI, Isolation suite, Connections, live trading                               |
| **Status**       | **CLOSED**                                                                                         |
| **Overview**     | [`../security-platform-overview.md`](../security-platform-overview.md)                             |

### Security Audit Foundation (V3-S05)

| Field                     | Content                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | Durable append-only Security Audit foundation: attribution, Event Minimalism, incident→event, timeline foundation                                                     |
| **Owner**                 | Security Audit (under Identity/Auth + Vault module; **not** a new bounded context)                                                                                    |
| **Consumes**              | Authn, Authz, Vault, Platform events                                                                                                                                  |
| **Produces**              | Security Audit Foundation store and investigation timeline foundation                                                                                                 |
| **Does NOT own (Wave 1)** | Search, advanced filter, download UI, analytics, monitoring, dashboards, alerting (F-05)                                                                              |
| **Status**                | **CLOSED** as foundation; F-05 binds Wave 1 certification to Foundation, not Customer Audit Product                                                                   |
| **Overview**              | [`../security-audit-overview.md`](../security-audit-overview.md) · [`../wave-1-f05-product-owner-decision-record.md`](../wave-1-f05-product-owner-decision-record.md) |

### Workspace Isolation Hardening (V3-S06)

| Field            | Content                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Purpose**      | Prove fail-closed cross-workspace denial across Wave 1 security surfaces                              |
| **Owner**        | S06 owns proof suite / evidence; does **not** replace Auth / Vault / Audit products; **not** a new BC |
| **Consumes**     | All Wave 1 security products                                                                          |
| **Produces**     | Isolation Matrix evidence, route ownership inventory, production-composition proof                    |
| **Does NOT own** | Business products for Connections, trading, monitoring                                                |
| **Status**       | **CLOSED**                                                                                            |
| **Overview**     | [`../workspace-isolation-overview.md`](../workspace-isolation-overview.md)                            |

Wave 1 package Close alone was insufficient for wave exit. Independent Certification Audit → Resolution → Independent Validation → Product Owner certification declared Wave 1 **CERTIFIED COMPLETE**.

**Source:** [`../version-3-wave-1-completion-report.md`](../version-3-wave-1-completion-report.md)

---

## Wave 2 — Connection Management (operational packages)

### Connection Management (W2-S01)

| Field            | Content                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | One Connections place: create, validate, replace, disconnect, review — without customer `.env`                            |
| **Owner**        | Connection Management facade                                                                                              |
| **Consumes**     | Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit                              |
| **Produces**     | Connection metadata, lifecycle, state model, validation orchestration, provider catalog product behavior                  |
| **Does NOT own** | Secrets, identity, authn/authz, workspace, security platform, audit store, venue protocol, delivery, AI execution, orders |
| **Honesty**      | Connected ≠ live trading / message delivered / AI online                                                                  |
| **Status**       | **CLOSED**                                                                                                                |
| **Overview**     | [`../wave-2/connection-management-overview.md`](../wave-2/connection-management-overview.md)                              |

### Exchange Connectivity Foundation (W2-S02)

| Field            | Content                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**      | Prove authenticated exchange communication on Connections for offered providers                                                |
| **Owner**        | Exchange Connectivity outcomes (handshake, health, availability, capability projection); protocol I/O remains Exchange Adapter |
| **Consumes**     | Connection Management, Vault, Authn, Authz, Isolation, Security Platform, Security Audit                                       |
| **Produces**     | Honest Connected / Failure; session health; verified capability projection (observed, not “used”)                              |
| **Does NOT own** | Secrets, identity, monitoring, live trading, orders, portfolio, strategy, market data engine                                   |
| **Honesty**      | Connected does **NOT** mean Trading enabled                                                                                    |
| **Status**       | **CLOSED**                                                                                                                     |
| **Notes**        | Binance handshake implemented; Bybit/OKX cataloged with honest not-implemented handshake                                       |
| **Overview**     | [`../wave-2/exchange-connectivity-overview.md`](../wave-2/exchange-connectivity-overview.md)                                   |

### Market Data Foundation (W2-S03)

| Field            | Content                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Receive, normalize, validate, expose symbols / ticker / candles / order book                                                                      |
| **Owner**        | Market Data Domain                                                                                                                                |
| **Consumes**     | Exchange Connectivity, Connection Management, Vault, Authn, Authz, Isolation, Platform, Audit                                                     |
| **Produces**     | Provider-independent market-data contract; Binance implementation; Bybit/OKX cataloged; Projection-authorized UI; freshness / unavailable honesty |
| **Does NOT own** | Orders, trading, execution, portfolio, balances, positions, risk, strategy, paper trading, monitoring, analytics                                  |
| **Honesty**      | Market data available does **NOT** mean Trading enabled. No streaming product in this package.                                                    |
| **Status**       | **CLOSED**                                                                                                                                        |
| **Overview**     | [`../wave-2/market-data-overview.md`](../wave-2/market-data-overview.md)                                                                          |

### Paper Trading Foundation (W2-S04) — current package

| Field            | Content                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Simulate order execution using Market Data; no real exchange orders; no real capital; mandatory foundation before Live Trading                                                  |
| **Owner**        | Paper orders, fills, positions, portfolio, balances, execution/matching simulators, PnL, account state, execution history                                                       |
| **Consumes**     | Market Data, Exchange Connectivity, Connection Management, Vault, Authn, Authz, Isolation, Platform, Audit                                                                      |
| **Produces**     | Paper Trading product outcomes (account → orders → fills → positions/PnL/history as slices deliver)                                                                             |
| **Does NOT own** | Live Trading, exchange order APIs, real balances/positions, Market Data, CM, Exchange Connectivity, Risk, Strategy, leverage/margin/liquidation, monitoring, analytics, billing |
| **Honesty**      | Paper fill ≠ exchange accepted an order. Paper trading ≠ Live Trading enabled. Never fabricate market prices.                                                                   |
| **Status**       | Active package — see [`04-wave-status.md`](./04-wave-status.md) and [`08-current-state.md`](./08-current-state.md)                                                              |
| **Overview**     | [`../wave-2/paper-trading-overview.md`](../wave-2/paper-trading-overview.md)                                                                                                    |

---

## Certified Version 2 products (maintain, do not rebuild)

Strategy Library, Certification, Runtime Gate, Deployment, Orchestrator, Qualification, Market Profile, Market State, Command Center (paper), Knowledge Lake, Reporting, AI Analytics, paper Execution Adapter.

**Source:** Master Plan §5

---

## Product areas planned but not yet Wave 1–2 products

Security Platform financial logging (Wave 6), Notification Platform (Wave 5), Live Trading (Wave 6), AI Platform customer keys beyond Connections collect (Wave 7), Knowledge durability extensions (Wave 7), Portfolio / Risk / Analytics productization (Wave 8), Workspace SaaS / Admin / Billing / Developer Platform (Wave 9), Compliance / Performance closeout (Wave 10), Monitoring / Business Continuity / Disaster Recovery claims (Wave 3).

See [`09-future-roadmap.md`](./09-future-roadmap.md).

---

**STOP.** Ownership changes require Master Plan revision. Do not move ownership inside a slice review.
