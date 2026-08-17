# W2-S02 Product Scope

**Package:** W2-S02 Exchange Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w2-s02-implementation-package.md`](./w2-s02-implementation-package.md)
**Consumed:** [`w2-s01-product-scope.md`](./w2-s01-product-scope.md) · [`connection-management-overview.md`](./connection-management-overview.md)
**Vision (read-only):** [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **providers**, **customer workflows**, **failure philosophy**, and **acceptance** for W2-S02. It does not redesign Connection Management. It does not reopen Wave 1. It does not revise the Master Plan. It does not introduce Live Trading.

---

## Product purpose

Exchange Connectivity Foundation is the product package that enables **real exchange connectivity** using the existing Connection Management foundation.

A validated Exchange Connection can establish a real authenticated exchange session. The product proves that communication with the exchange succeeds.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own monitoring, live trading, order execution, portfolio, or the strategy engine.

It does **not** redesign Connection Management. Operators still open Connections to choose an Exchange and run Connect.

```text
Connection Management owns the connection product.
Vault owns the secrets.
Exchange Connectivity Foundation owns handshake, health, availability, status, and capability projection.
Connected means authenticated exchange communication succeeded.
Connected does NOT mean Trading enabled.
```

---

## Why Exchange Connectivity Foundation exists (business language)

W2-S01 closed the Connection Management product: operators can create an Exchange connection, store credentials in Vault, run local validation, and manage lifecycle. That is not yet proof that Binance, Bybit, or OKX accepted an authenticated session.

Paying customers need an honest answer: did communication with the exchange succeed?

This package exists so **Connected** for an Exchange connection means the venue authenticated the session — and so the product never pretends that proof is trading.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Open Connections
- Choose Binance, Bybit, or OKX
- Run Connect
- See Connected when authenticated exchange communication succeeded
- See Failure when it did not
- Disconnect
- Stay inside their workspace and their authorization
- Never receive orders, balances, positions, or Trading enabled from this package

This package does **not** own Wave 4 complete venue I/O exit, Kraken as offered Core, market-data streaming, or Wave 6 live capital.

---

## Consumes

| Product                   | How this package uses it                                        | Must not do                        |
| ------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| **Connection Management** | Operator surface, Exchange catalog, connection lifecycle, state | Redesign or replace the facade     |
| **Vault**                 | Retrieve credentials for handshake only                         | Duplicate or store secrets locally |
| **Authentication**        | Only signed-in operators Connect / Disconnect                   | Parallel login                     |
| **Authorization**         | Only permitted roles may Connect / Disconnect                   | New IAM                            |
| **Workspace Isolation**   | Credentials and connectivity stay in one workspace              | Cross-workspace convenience        |
| **Security Platform**     | Hardening and abuse/rate-limit defaults                         | Fork platform controls             |
| **Security Audit**        | Attributable Connect / Failure / Disconnect                     | Own the audit store                |

---

## Owns

| Outcome                         | Customer meaning                                                    |
| ------------------------------- | ------------------------------------------------------------------- |
| Exchange protocol connectivity  | Offered exchanges can be reached for an authenticated session       |
| Provider capability abstraction | Binance, Bybit, and OKX share one connectivity contract             |
| Connection handshake            | Connect proves authenticated communication                          |
| Connection health               | Healthy session vs failed / unhealthy is visible                    |
| Provider availability           | Unavailable provider is honest                                      |
| Connectivity status             | Connected, Failure, Disconnected                                    |
| Exchange capability projection  | Product shows connectivity proof — not trading, balances, or orders |

---

## Does NOT own

| Concern               | Real owner           |
| --------------------- | -------------------- |
| Secrets               | Vault                |
| Identity              | Authentication       |
| Authentication        | Authentication       |
| Authorization         | Authorization        |
| Workspace             | Workspace            |
| Audit persistence     | Security Audit       |
| Monitoring            | Wave 3 Monitoring    |
| Live Trading          | Wave 6               |
| Order execution       | Canonical Order Path |
| Portfolio             | Portfolio / later    |
| Strategy Engine       | Strategy / Runtime   |
| Connection Management | W2-S01 (CLOSED)      |

---

## IN Scope

| Item                       | Customer meaning                                            |
| -------------------------- | ----------------------------------------------------------- |
| Real authenticated session | Connect talks to the offered exchange and authenticates     |
| Honest Connected           | Authenticated exchange communication succeeded              |
| Honest Failure             | Authentication or communication did not succeed             |
| Disconnect                 | Connection is no longer Connected                           |
| Provider contract          | Binance, Bybit, OKX; additional providers allowed by design |
| Health and availability    | Healthy vs unavailable vs failed                            |
| Capability projection      | Connectivity proof only                                     |
| Workspace isolation        | A cannot use B’s exchange connection                        |
| Authorization              | Unauthorized roles cannot Connect                           |
| Operator walkthrough       | Manual Exchange Connectivity Walkthrough                    |
| Security boundaries        | Consume Wave 1 and W2-S01; do not redefine                  |
| Audit interaction          | Emit Connect / Failure / Disconnect                         |
| Failure philosophy         | Fail closed; no fake Connected; no trading claim            |
| Validation strategy        | Slices, Close criteria, evidence, regressions               |

---

## OUT OF Scope

Explicitly out of this package:

| Item                                 | Declaration                          |
| ------------------------------------ | ------------------------------------ |
| Orders                               | **No orders**                        |
| Balances                             | **No balances**                      |
| Positions                            | **No positions**                     |
| Live trading                         | **No live trading**                  |
| Execution                            | **No execution**                     |
| Monitoring                           | **No monitoring**                    |
| Billing                              | **No billing**                       |
| Leverage                             | Out                                  |
| Market data engine                   | Out                                  |
| WebSockets                           | Out                                  |
| Paper trading                        | Out (certified paper path unchanged) |
| Portfolio                            | Out                                  |
| Risk engine                          | Out                                  |
| Order placement                      | Out                                  |
| Secrets store                        | Out (Vault)                          |
| Identity / authn / authz / workspace | Out                                  |
| Audit persistence                    | Out                                  |
| Connection Management redesign       | Out                                  |
| Wave 1 changes                       | Out                                  |
| Master Plan changes                  | Out                                  |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
Exchange Connectivity Foundation
        │ consumes
        ├── Connection Management
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Security Platform
        └── Security Audit

Exchange Connectivity Foundation
        │ owns (product outcomes)
        ├── exchange protocol connectivity
        ├── provider capability abstraction
        ├── connection handshake
        ├── connection health
        ├── provider availability
        ├── connectivity status
        └── exchange capability projection

Exchange Connectivity Foundation
        │ does not own
        ├── secrets
        ├── identity
        ├── authentication
        ├── authorization
        ├── workspace
        ├── audit persistence
        ├── monitoring
        ├── live trading
        ├── order execution
        ├── portfolio
        └── strategy engine
```

No ownership changes. No new bounded context. Protocol I/O remains with the existing Exchange Adapter owner. The Connections surface remains Connection Management.

---

## Honesty rules

1. **Connected** means authenticated exchange communication succeeded.
2. **Connected** does **not** mean Trading enabled.
3. **Connected** does **not** mean orders, balances, or positions are available.
4. **Connected** does **not** mean live trading, execution, or market-data streaming.
5. Local W2-S01 validation success is **not** Exchange Connected after this package.
6. Simulated ping success from Version 2 is not Exchange Connected.
7. If the provider is unavailable, rate-limited, or authentication fails, the product shows Failure or unavailable — never fake Connected.
8. Secrets are never shown, logged, exported, or stored locally.

---

## Providers planned

| Provider | Offered in W2-S02 | Role                        |
| -------- | ----------------- | --------------------------- |
| Binance  | Yes               | Authenticated session proof |
| Bybit    | Yes               | Authenticated session proof |
| OKX      | Yes               | Authenticated session proof |

Design must allow additional providers without redesigning Connection Management or this foundation.

Not offered as Core in this package: Kraken, Coinbase, and any unlisted venue.

Do not implement provider adapters, SDKs, or network code in this planning document.

---

## Customer workflows

### Open Connections

Operator signs in and opens the existing Connections product.

### Choose Exchange

Operator chooses Connection Type **Exchange** and an offered provider: Binance, Bybit, or OKX. The connection already belongs to the workspace. Credentials already live in Vault from W2-S01.

### Run Connect

Operator runs **Connect**. The product performs a real authenticated handshake with the exchange using Vault credentials. Status is not client-trusted.

### Observe Connected

On success, status is **Connected**. That means authenticated exchange communication succeeded. It does not enable trading.

### Observe Failure

On failure, status is **Failure** (or the honest Connection Management failure state already used for unsuccessful validation). The reason is operator-safe. Secrets are not shown. Connected is not claimed.

### Disconnect

Operator disconnects. The connection is no longer Connected. The product does not keep claiming an authenticated session.

### Verify workspace isolation

An operator in Workspace A cannot Connect, view, or disconnect Workspace B’s exchange connection.

### Verify authorization

A role without permission cannot Connect or Disconnect.

### Verify no trading capability

The product offers no order ticket, no balances, no positions, and no Trading enabled control from this package.

---

## Failure philosophy

| Situation                    | Required product behavior                                |
| ---------------------------- | -------------------------------------------------------- |
| Missing permission           | Deny — not an empty success                              |
| Wrong workspace              | Fail closed deny                                         |
| Vault cannot retrieve secret | Fail closed; no local fallback store; not Connected      |
| Authentication rejected      | Failure; not Connected                                   |
| Provider unavailable         | Honest unavailable / Failure; not Connected              |
| Rate limited                 | Honest throttled / Failure; not Connected; do not hammer |
| Ambiguous handshake          | Do not mark Connected                                    |
| Replay of old success        | Reject; client cannot set Connected                      |
| Partial outage               | Degrade honestly; do not claim trading                   |

Defaults follow [`../security-default-policy.md`](../security-default-policy.md): default deny, fail closed, least privilege, honest product, everything attributable.

---

## Audit interaction

Exchange Connectivity Foundation **emits** attributable events for Connect attempted, Connect succeeded, Connect failed, and Disconnect.

Security Audit **persists** them. This package does not redesign the audit store.

---

## Product Acceptance Criteria

| #   | Outcome                                                   | Fail if                                |
| --- | --------------------------------------------------------- | -------------------------------------- |
| 1   | Operator chooses Exchange from existing Connections       | Second product surface required        |
| 2   | Connect establishes a real authenticated exchange session | Local-only success remains the story   |
| 3   | Connected means authenticated communication succeeded     | Connected without venue authentication |
| 4   | Failure is honest and secret-free                         | Fake Connected or secret in errors     |
| 5   | Disconnect clears Connected                               | Stale Connected                        |
| 6   | Cross-workspace connectivity denied                       | Tenant leak                            |
| 7   | Unauthorized Connect / Disconnect denied                  | Privilege bypass                       |
| 8   | No orders, balances, positions, or Trading enabled        | Trading or portfolio claim             |

---

## Product Walkthrough (operator language)

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

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Out of scope declarations (binding)

This package does **not** deliver:

- No orders
- No balances
- No live trading
- No execution
- No monitoring
- No billing

---

## Mandatory Questions

1. **What business problem does W2-S02 solve?**
   Prove that a validated Exchange connection can establish a real authenticated exchange session. Communication success becomes honest product status.

2. **Which existing products does it consume?**
   Connection Management, Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

3. **What does W2-S02 own?**
   Exchange protocol connectivity, provider capability abstraction, connection handshake, connection health, provider availability, connectivity status, exchange capability projection.

4. **What is explicitly out of scope?**
   Orders, balances, positions, live trading, execution, monitoring, billing, market data, WebSockets, portfolio, secrets, identity, authentication, authorization, workspace, audit persistence, Connection Management redesign, Wave 1 changes.

5. **Which providers are planned?**
   Binance, Bybit, OKX. Additional providers allowed by design; not offered as Core now.

6. **Does W2-S02 introduce Live Trading?**
   No.

7. **Does W2-S02 modify Wave 1?**
   No.

---

**STOP.** Wait for Product Owner review before W2-S02 implementation begins.
