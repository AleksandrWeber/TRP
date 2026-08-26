# W2-S04 Security Review

**Package:** W2-S04 Paper Trading Foundation
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Awaiting Product Owner review. Not implementation. Not Close evidence.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) — **mandatory**
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w2-s04-implementation-package.md`](./w2-s04-implementation-package.md)
**Scope:** [`w2-s04-product-scope.md`](./w2-s04-product-scope.md)

```text
Paper Trading uses Wave 1 security, Connection Management, Exchange Connectivity, and Market Data.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Paper fills are simulated against Market Data — never exchange order placement.
Paper trading is not Live Trading enabled.
No real capital. No fabricated market prices. No simulated “exchange accepted” venue theater.
```

This document is **planning intent**. Close evidence worksheets are produced after implementation.

---

## Boundary (binding)

| In                                                    | Out                                                  |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Workspace-scoped paper accounts and orders            | Owning customer secret ciphertext                    |
| Authn/Authz gates on Paper Trading                    | Redesigning Market Data / Connections / Connectivity |
| Paper account ownership                               | Reopening Wave 1 packages                            |
| Replay protection for Market Data snapshots and fills | Identity / RBAC matrix rewrite                       |
| Order integrity and PnL integrity                     | Audit store / timeline / incidents redesign          |
| Honest paper fill (not exchange acceptance)           | Live trading enablement                              |
| OWASP / API implications for Paper Trading surfaces   | Exchange order / balance / position security         |
| Audit attribution for paper actions                   | Monitoring / analytics / billing security scopes     |
| Verification Standard + regression expectations       | Leverage / margin / liquidation / risk engine        |
| No real capital / no exchange order APIs              | Strategy engine / WebSocket trading                  |

---

## How Paper Trading uses existing security capabilities

| Capability                         | How Paper Trading uses it                                                              | Must not do                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable Paper Trading | Invent a second constitution                     |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by this package  | Skip worksheets; claim PASS without evidence     |
| **Workspace Isolation**            | Paper accounts, orders, fills, and portfolio are workspace-bound; A↛B                  | Soften isolation to share paper accounts         |
| **Vault**                          | Retrieve only if a consumed path needs credentials; no local secret store; no echo     | Duplicate Vault; use credentials for live orders |
| **Authentication**                 | Only signed-in subjects open Paper Trading                                             | Create a parallel login                          |
| **Authorization**                  | Only permitted roles use Paper Trading                                                 | Hard-code a new IAM                              |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                      | Fork platform middleware                         |
| **Security Audit**                 | Emit paper account / order / fill / cancel / fail                                      | Persist audit itself                             |
| **Connection Management**          | Existing connection records, catalog, and lifecycle                                    | Bypass the facade or invent a second product     |
| **Exchange Connectivity**          | Authenticated session context remains the connectivity owner                           | Rewrite Connected meaning or handshake           |
| **Market Data Foundation**         | Prices and books come from validated Market Data snapshots                             | Fabricate prices; redesign Market Data           |

---

## Required coverage

### 1. Workspace isolation

| Outcome           | Required                                                                               |
| ----------------- | -------------------------------------------------------------------------------------- |
| Workspace scoped  | Workspace A cannot read or mutate Workspace B paper accounts, orders, fills, portfolio |
| Account ownership | Paper accounts belong to one workspace; foreign workspace context denies               |
| Fail closed       | Missing or forged workspace context denies                                             |

### 2. Authorization

| Outcome            | Required                                           |
| ------------------ | -------------------------------------------------- |
| Authenticated only | Anonymous Paper Trading denied                     |
| Authorized only    | Roles without permission cannot open Paper Trading |
| No new role        | Reuse existing Authorization; do not invent IAM    |
| Fail closed        | Missing permission denies — not empty success      |

### 3. Paper account ownership

| Outcome                 | Required                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| Owned account only      | Operator acts only on paper accounts in the current workspace        |
| No foreign account ID   | Guessing or supplying another workspace’s paper account ID is denied |
| Create attributable     | Paper account create is attributable to subject + workspace          |
| No exchange account map | Paper account is not an exchange account or live capital account     |

### 4. Replay protection

| Outcome                              | Required                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Market Data snapshot is not a token  | A prior ticker / book cannot be posted back as current execution input      |
| Client cannot set fill / PnL         | Client-supplied fill, price, or PnL is rejected                             |
| Stale snapshot rejected for matching | Matching does not treat stale Market Data as current without honesty rules  |
| Order / fill replay                  | Replaying an old success does not create duplicate integrity-breaking fills |

### 5. Order integrity

| Outcome                    | Required                                                           |
| -------------------------- | ------------------------------------------------------------------ |
| Server-side order state    | Client cannot declare filled, cancelled, or accepted by exchange   |
| Market Data–gated matching | Matching uses Market Data snapshots; never fabricated prices       |
| No venue theater           | Product does not emit simulated “exchange accepted” venue messages |
| No exchange order API      | Place / cancel never call exchange order placement APIs            |
| Cancel is local            | Cancel affects paper order state only                              |

### 6. PnL integrity

| Outcome               | Required                                                       |
| --------------------- | -------------------------------------------------------------- |
| Derived not invented  | PnL is calculated from paper fills, positions, and Market Data |
| Client cannot set PnL | Client-supplied PnL is rejected                                |
| Consistent with fills | PnL cannot diverge from recorded paper execution history       |
| Honesty               | Paper PnL is never presented as realized exchange PnL          |

### 7. OWASP / API impacts

Planning mapping. Complete with evidence at Close.

| Class                             | Implication for this package                               | Required outcome                                                |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Broken access control / BOLA      | Read/mutate another workspace’s paper account or orders    | Deny; anti-enumeration consistent with Wave 1                   |
| Broken authentication             | Anonymous Paper Trading                                    | Deny                                                            |
| Injection                         | Symbol, account, order identifiers, error strings          | Parameterized, constrained identifiers; no secret interpolation |
| Security misconfiguration         | Debug dumps, verbose simulation internals                  | Honest operator errors only; no stack or credential dump        |
| Sensitive data exposure           | Keys in responses, logs, traces                            | Vault-only if needed; no echo                                   |
| Integrity failure                 | Client-set prices, fills, PnL, or replayed snapshots       | Reject                                                          |
| Excessive data / inventory        | Returning exchange balances or live positions              | Out of scope; must not appear                                   |
| Unrestricted resource consumption | Order spam / simulation spam                               | Platform abuse controls                                         |
| Unsafe consumption of APIs        | Trusting client market prices or fake venue acceptance     | Server simulates only from Market Data                          |
| Business logic abuse              | Treating paper fill as live capital or exchange acceptance | Honesty rules; capability excludes Live Trading                 |

Live trading, leverage, margin, liquidation, and exchange inventory security are **NOT APPLICABLE** here and remain later owners / Wave 6 / Order Path / Risk.

### 8. Audit attribution

| Outcome              | Required                                                        |
| -------------------- | --------------------------------------------------------------- |
| Account create       | Who created which paper account in which workspace is auditable |
| Order place / cancel | Who placed or cancelled which paper order is auditable          |
| Fill / fail          | Simulated fill and failure are auditable                        |
| Deny attributable    | Where product already audits denies, keep emit rules            |
| No secret in audit   | Audit payloads never include Vault material                     |

---

## Security outcomes (mandatory)

### A. Secrets and capital

| Outcome                 | Required                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| No customer `.env` path | Paper Trading uses Vault only if a consumed path requires credentials |
| No plaintext echo       | UI/API never return stored secret material                            |
| No local store          | Paper Trading never writes secrets beside Vault                       |
| No live order use       | Credentials must not be used to place exchange orders                 |
| No real capital         | Paper balances are simulated; never exchange balances                 |

### B. Access control

| Outcome            | Required                                           |
| ------------------ | -------------------------------------------------- |
| Authenticated only | Anonymous Paper Trading denied                     |
| Authorized only    | Roles without permission cannot open Paper Trading |
| Workspace scoped   | Workspace A cannot use Workspace B paper accounts  |
| Fail closed        | Missing workspace context denies                   |

### C. Honesty / abuse

| Outcome                      | Required                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| No fabricated market prices  | Execution consumes Market Data only                          |
| No exchange-accepted theater | No simulated venue acceptance messages                       |
| No Live Trading claim        | Paper Trading must not enable or imply Live Trading          |
| No exchange inventory        | Projections exclude exchange balances and exchange positions |
| Failures honest              | Unavailable Market Data / deny with operator-safe reason     |

### D. Auditability

| Outcome                | Required                                             |
| ---------------------- | ---------------------------------------------------- |
| Mutations attributable | Create / place / fill / cancel / fail are auditable  |
| Deny attributable      | Where product already audits denies, keep emit rules |

---

## Threat Review (STRIDE) — planning intent

| Category                   | Threat example                                                        | Required outcome                                           | Verdict       |
| -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- | ------------- |
| **Spoofing**               | Act as another operator to open Paper Trading                         | Authentication binding required                            | PASS (intent) |
| **Tampering**              | Set fill / price / PnL; replay snapshot; forge paper history          | Server-side simulation; replay protection; integrity rules | PASS (intent) |
| **Repudiation**            | Deny having placed a paper order or created an account                | Audit events for create / place / fill / cancel / fail     | PASS (intent) |
| **Information Disclosure** | Read another workspace’s paper portfolio; dump secrets                | Isolation + Vault deny; no secret echo                     | PASS (intent) |
| **Denial of Service**      | Order or simulation spam against platform                             | Inherit platform abuse controls                            | PASS (intent) |
| **Elevation of Privilege** | Unauthorized role trades paper; paper used as Live Trading enablement | Authorization + isolation; no Live Trading enabled         | PASS (intent) |

A package cannot Close while any Threat Review row is **REQUIRES ACTION**. Close evidence is produced after implementation.

---

## Threats this package must reduce

| Threat                                      | Control in this package                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| Cross-tenant paper account use              | Workspace-scoped paper accounts and actions                 |
| Unauthorized paper trading                  | Authz on every Paper Trading action                         |
| Client-set prices / fills / PnL             | Server-side simulation; reject client integrity fields      |
| Replay of Market Data snapshot or fill      | Replay protection; freshness honesty                        |
| Fabricated market prices                    | Consume Market Data only                                    |
| Simulated “exchange accepted” venue theater | Honesty rules; no venue acceptance messages                 |
| Credentials used for live orders            | No exchange order APIs; Vault path never for live placement |
| Paper presented as live capital             | Capability and copy exclude Live Trading / real capital     |
| Integrity failure of paper history / PnL    | Order integrity + PnL integrity rules                       |

---

## Controls explicitly not this package

| Control                                | Owner                                                           |
| -------------------------------------- | --------------------------------------------------------------- |
| Password / session / MFA mechanics     | Authentication (S01)                                            |
| Role matrix content                    | Authorization (S02)                                             |
| Encryption / wrapping keys             | Vault (S03)                                                     |
| Secure headers / rate-limit product    | Security Platform (S04)                                         |
| Append-only audit store                | Security Audit (S05)                                            |
| Isolation proof suite ownership        | Workspace Isolation (S06) — Paper Trading **consumes** boundary |
| Connection catalog / lifecycle product | Connection Management (W2-S01)                                  |
| Authenticated session proof            | Exchange Connectivity (W2-S02)                                  |
| Market Data integrity / projections    | Market Data Foundation (W2-S03)                                 |
| Live order controls                    | Wave 6 / Gate / Risk                                            |
| Risk / leverage / margin / liquidation | Risk / later                                                    |
| Strategy engine                        | Strategy / Runtime                                              |
| Monitoring alerts product              | Wave 3                                                          |
| Billing isolation                      | Wave 9                                                          |

---

## Security Verification Standard expectations

W2-S04 starts after the Verification Standard is approved. At Close, **every category and every row** must be **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION** (zero REQUIRES ACTION allowed to Close).

Must include:

1. Injection through Secure Headers (categories 1–14) as applicable to Paper Trading surfaces
2. Explicit OWASP Top 10 and OWASP API Top 10 mapping for Paper Trading APIs/UI
3. **Security Regression Suite** — every found-and-fixed vulnerability owned by this package leaves an automated regression in ordinary tests
4. Timing/Abuse rows where paper order placement or simulation could be spammed
5. Explicit **NOT APPLICABLE** with named owners for Live Trading, exchange orders, exchange balances, exchange positions, leverage, margin, liquidation, risk engine, strategy engine, monitoring, analytics, and billing

Planning worksheet is created during implementation Close preparation — not in this planning open.

| Area                    | Expectation at Close                                       |
| ----------------------- | ---------------------------------------------------------- |
| Paper Trading open      | Authn + Authz + workspace checked                          |
| Paper account ownership | Foreign account / workspace denied                         |
| Secret fields           | Never returned; never logged                               |
| Order / fill / PnL      | Server-side only; client cannot set integrity fields       |
| Cross-tenant tests      | A↛B for open / create / place / observe / cancel           |
| Audit emit              | Create / place / fill / cancel / fail                      |
| Honest error bodies     | No ciphertext; no venue dump; no foreign ids beyond policy |
| Replay                  | Stale snapshot / replayed fill cannot break integrity      |
| Market Data consumption | No fabricated prices                                       |
| Capability projection   | Cannot be toggled into Live Trading enabled by client      |

---

## Failure philosophy (security)

| Failure                       | Security-required behavior                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Vault unavailable (if needed) | Fail closed; do not read secrets from unsafe storage                                                                    |
| Market Data unavailable       | Do not invent prices; refuse or fail honestly                                                                           |
| Authz missing                 | Deny                                                                                                                    |
| Workspace missing/forged      | Deny                                                                                                                    |
| Integrity ambiguous           | Do not invent fill or PnL                                                                                               |
| Replay / client-set fields    | Reject                                                                                                                  |
| Audit emit fails              | Follow existing Wave 1 durability rules; do not silently succeed a privileged mutation if policy requires durable audit |

---

## Out of this review as primary owners

- Wave 1 product redesign
- Connection Management redesign
- Exchange Connectivity redesign
- Market Data redesign
- Live order execution security
- Exchange balance / position inventory security
- Leverage / margin / liquidation / risk engine
- Strategy engine
- Live capital ADR controls
- WebSocket trading security
- Monitoring alerts product
- Analytics product
- Billing isolation

---

**STOP.** Wait for Product Owner review before W2-S04 implementation planning is approved.
