# W2-S03 Security Review

**Package:** W2-S03 Market Data Foundation
**Wave:** 2 — Connection Management
**Status:** Close evidence **COMPLETE** for Product Owner Close Review. Not Closed.
**Date:** 2026-08-26 (Close evidence). Planning baseline 2026-08-21.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) — **mandatory**
**Worksheet:** [`v3-w2-s03-security-verification-worksheet.md`](./v3-w2-s03-security-verification-worksheet.md) — **PASS** (zero REQUIRES ACTION)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w2-s03-implementation-package.md`](./w2-s03-implementation-package.md)
**Scope:** [`w2-s03-product-scope.md`](./w2-s03-product-scope.md)

```text
Market Data uses Wave 1 security, Connection Management, and Exchange Connectivity.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Secrets never leave Vault into a local store.
Market data is earned by receive / normalize / validate — never simulated.
Market data is not Trading enabled.
```

## Close evidence verdict

| Gate                                   | Verdict |
| -------------------------------------- | ------- |
| Vault-only secret usage                | PASS    |
| Workspace Isolation                    | PASS    |
| Authorization (no new roles)           | PASS    |
| Security Audit ownership               | PASS    |
| Projection honesty                     | PASS    |
| Freshness honesty                      | PASS    |
| Provider Unavailable honesty           | PASS    |
| No plaintext secret exposure           | PASS    |
| No Wave 1 / W2-S01 / W2-S02 regression | PASS    |
| STRIDE                                 | PASS    |
| Verification Standard §4–§19           | PASS    |

Full itemized rows: [`v3-w2-s03-security-verification-worksheet.md`](./v3-w2-s03-security-verification-worksheet.md).

Planning baseline below remains the approved control intent. Close rows are evidenced, not intent-only.

---

## Boundary (binding)

| In                                                | Out                                              |
| ------------------------------------------------- | ------------------------------------------------ |
| Provider communication for market-data receive    | Owning customer secret ciphertext                |
| Workspace-scoped Market Data actions              | Redesigning Connection Management                |
| Authn/Authz gates on Market Data                  | Reopening Wave 1 packages                        |
| Input validation of symbols and provider payloads | Identity / RBAC matrix rewrite                   |
| Rate-limit awareness on provider communication    | Audit store / timeline / incidents redesign      |
| Replay protection for snapshots                   | Live trading enablement                          |
| Market data integrity before projection           | Order, balance, position, or execution security  |
| Honest Provider Unavailable and stale handling    | Monitoring / analytics / billing security scopes |
| OWASP / API implications for Market Data surfaces | WebSocket streaming / trading-stream security    |
| Verification Standard + regression expectations   | Wave 4 exit or Wave 6 live-capital controls      |

---

## How Market Data uses existing security capabilities

| Capability                         | How Market Data uses it                                                               | Must not do                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable Market Data  | Invent a second constitution                 |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by this package | Skip worksheets; claim PASS without evidence |
| **Workspace Isolation**            | Market-data context is workspace-bound; A↛B                                           | Soften isolation to share venue data context |
| **Vault**                          | Retrieve only if a path needs credentials; no local secret store; no secret echo      | Duplicate Vault; write secrets to disk       |
| **Authentication**                 | Only signed-in subjects open Market Data                                              | Create a parallel login                      |
| **Authorization**                  | Only permitted roles view Market Data                                                 | Hard-code a new IAM                          |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                     | Fork platform middleware                     |
| **Security Audit**                 | Emit market-data read / fail / unavailable                                            | Persist audit itself                         |
| **Connection Management**          | Existing connection records, catalog, and lifecycle                                   | Bypass the facade or invent a second product |
| **Exchange Connectivity**          | Authenticated session proof remains the connectivity owner                            | Rewrite Connected meaning or handshake       |

---

## Required coverage

### 1. Provider communication

| Outcome                    | Required                                                                       |
| -------------------------- | ------------------------------------------------------------------------------ |
| Offered providers only     | Market Data talks only to Binance, Bybit, and OKX as offered Core              |
| No arbitrary URL           | Operator cannot point Market Data at an unconstrained host                     |
| Public paths invent no key | Public market-data paths must not invent a trading secret                      |
| Credential use is least    | If credentials are required, Vault retrieve only; never for orders or balances |
| Fail closed on unknown     | Unknown provider is unavailable — not projected                                |

### 2. Workspace isolation

| Outcome           | Required                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| Workspace scoped  | Workspace A cannot read or use Workspace B market-data context or connections |
| Credential scoped | Vault retrieve is the owning workspace only                                   |
| Session scoped    | Exchange session context is not reusable across workspaces                    |
| Fail closed       | Missing or forged workspace context denies                                    |

### 3. Authorization

| Outcome            | Required                                         |
| ------------------ | ------------------------------------------------ |
| Authenticated only | Anonymous Market Data denied                     |
| Authorized only    | Roles without permission cannot open Market Data |
| No new role        | Reuse existing Authorization; do not invent IAM  |
| Fail closed        | Missing permission denies — not empty success    |

### 4. Input validation

| Outcome              | Required                                                             |
| -------------------- | -------------------------------------------------------------------- |
| Symbol constrained   | Symbol identifiers are validated; unconstrained strings are rejected |
| Provider constrained | Provider identifiers are catalog-constrained                         |
| Payload validated    | Provider payloads are validated before projection                    |
| No injection         | Parameterized, constrained identifiers; no secret interpolation      |
| No client-set data   | Client cannot supply ticker, candles, or order book as product state |

### 5. Rate-limit awareness

| Outcome                         | Required                                                   |
| ------------------------------- | ---------------------------------------------------------- |
| Inherit platform abuse controls | Market Data cannot become an unauthenticated flood path    |
| Venue rate limits are honest    | Throttled / limited is unavailable — not fake current data |
| No hammering                    | Repeated refresh does not ignore rate-limit signals        |
| No secret in throttle errors    | Operator-safe reason only                                  |

### 6. Replay considerations

| Outcome                                 | Required                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Snapshot is not a reusable client token | A prior ticker, candle, or book cannot be posted back as current       |
| Freshness is server-assigned            | Client cannot set “current”                                            |
| Stale replay rejected                   | Replaying an old success view does not restore current data            |
| Provider replay rules respected         | Requests follow the provider’s freshness expectations where applicable |

### 7. OWASP / API impacts

Planning mapping. Complete with evidence at Close.

| Class                             | Implication for this package                         | Required outcome                                                |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Broken access control / BOLA      | Read another workspace’s Market Data                 | Deny; anti-enumeration consistent with Wave 1                   |
| Broken authentication             | Anonymous Market Data                                | Deny                                                            |
| Injection                         | Provider identifiers, symbols, error strings         | Parameterized, constrained identifiers; no secret interpolation |
| Security misconfiguration         | Debug dumps, verbose venue payloads                  | Honest operator errors only; no stack or credential dump        |
| Sensitive data exposure           | Keys in responses, logs, traces                      | Vault-only; no echo                                             |
| SSRF / unconstrained outbound     | Market Data to an operator-supplied URL              | Offered providers only; no arbitrary URL                        |
| Excessive data / inventory        | Returning balances, positions, account inventory     | Out of scope; must not appear                                   |
| Unrestricted resource consumption | Refresh spam                                         | Platform abuse controls + rate-limit awareness                  |
| Unsafe consumption of APIs        | Trusting venue or client snapshots blindly           | Server projects only after validate                             |
| Integrity failure                 | Client-set ticker / candles / book or replayed proof | Reject                                                          |

Live trading, order injection, and financial integrity beyond market-data projection are **NOT APPLICABLE** here and remain Wave 6 / Order Path.

### 8. Market data integrity

| Outcome                   | Required                                                             |
| ------------------------- | -------------------------------------------------------------------- |
| Receive then validate     | Unvalidated provider data is never product state                     |
| Normalize without lying   | Normalization does not invent prices, sizes, or symbols              |
| Provider-scoped symbols   | A Binance symbol is not silently treated as Bybit or OKX             |
| Stale is not current      | Freshness failure is stale or unavailable                            |
| Unavailable is not filled | Missing book, ticker, or candles are not synthesized                 |
| Integrity ≠ trading       | Valid market data does not enable orders, execution, or live capital |

---

## Security outcomes (mandatory)

### A. Secrets

| Outcome                    | Required                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| No customer `.env` path    | Market Data uses Vault-backed credentials only if required                 |
| No plaintext echo          | UI/API never return stored secret material                                 |
| No local store             | Market Data never writes secrets beside Vault                              |
| Public path invents no key | Public market data does not create a trading secret                        |
| No trading use             | Credentials must not be used to place orders or fetch balances / positions |

### B. Access control

| Outcome            | Required                                               |
| ------------------ | ------------------------------------------------------ |
| Authenticated only | Anonymous Market Data denied                           |
| Authorized only    | Roles without permission cannot open Market Data       |
| Workspace scoped   | Workspace A cannot use Workspace B market-data context |
| Fail closed        | Missing workspace context denies                       |

### C. Honesty / abuse

| Outcome                          | Required                                                  |
| -------------------------------- | --------------------------------------------------------- |
| No simulated market-data success | Projections require receive / normalize / validate        |
| No trading claim                 | Market Data must not enable or imply trading              |
| No order / balance / position    | Projections exclude trading inventory                     |
| Failures honest                  | Unavailable / stale with operator-safe reason; no secrets |

### D. Auditability

| Outcome                  | Required                                             |
| ------------------------ | ---------------------------------------------------- |
| Read attributable        | Who attempted / succeeded / failed is auditable      |
| Unavailable attributable | Provider Unavailable is auditable                    |
| Deny attributable        | Where product already audits denies, keep emit rules |

---

## Threat Review (STRIDE) — Close evidence

| Category                   | Threat example                                                       | Required outcome                                          | Verdict |
| -------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- | ------- |
| **Spoofing**               | Act as another operator to open Market Data                          | Authentication binding required                           | PASS    |
| **Tampering**              | Set ticker / candles / book without validate; replay an old snapshot | Server-side projection; replay protection                 | PASS    |
| **Repudiation**            | Deny having requested market data                                    | Audit events for read / fail / unavailable                | PASS    |
| **Information Disclosure** | Read another workspace’s Market Data; dump venue payloads or secrets | Isolation + Vault deny; no secret echo; no inventory leak | PASS    |
| **Denial of Service**      | Refresh spam against platform or venue                               | Inherit platform abuse controls; rate-limit awareness     | PASS    |
| **Elevation of Privilege** | Unauthorized role opens Market Data; data used as trading enablement | Authorization + isolation; no Trading enabled             | PASS    |

A package cannot Close while any Threat Review row is **REQUIRES ACTION**.

---

## Threats this package must reduce

| Threat                                  | Control in this package                    |
| --------------------------------------- | ------------------------------------------ |
| Credential theft via local files / logs | Vault-only path; no secret logging/echo    |
| Broken access control on Market Data    | Authz + workspace scope on every action    |
| Dishonest market-data theater           | Validate-gated projections                 |
| Cross-tenant market-data use            | Workspace-scoped context and retrieve      |
| Replay of snapshot success              | Fresh proof; client cannot set projections |
| Venue outage shown as live data         | Honest Provider Unavailable                |
| Stale snapshot shown as current         | Honest stale handling                      |
| Rate-limit bypass / hammering           | Rate-limit awareness; fail closed          |
| Integrity failure of provider payloads  | Validate before project                    |
| Market data used as trading switch      | Projections exclude trading                |

---

## Controls explicitly not this package

| Control                                | Owner                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| Password / session / MFA mechanics     | Authentication (S01)                                              |
| Role matrix content                    | Authorization (S02)                                               |
| Encryption / wrapping keys             | Vault (S03)                                                       |
| Secure headers / rate-limit product    | Security Platform (S04)                                           |
| Append-only audit store                | Security Audit (S05)                                              |
| Isolation proof suite ownership        | Workspace Isolation (S06) — Market Data **consumes** the boundary |
| Connection catalog / lifecycle product | Connection Management (W2-S01)                                    |
| Authenticated session proof            | Exchange Connectivity (W2-S02)                                    |
| Live order controls                    | Wave 6 / Gate / Risk                                              |
| Monitoring alerts product              | Wave 3                                                            |
| Billing isolation                      | Wave 9                                                            |

---

## Security Verification Standard expectations

W2-S03 starts after the Verification Standard is approved. At Close, **every category and every row** must be **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION** (zero REQUIRES ACTION allowed to Close).

Must include:

1. Injection through Secure Headers (categories 1–14) as applicable to Market Data surfaces
2. Explicit OWASP Top 10 and OWASP API Top 10 mapping for Market Data APIs/UI
3. **Security Regression Suite** — every found-and-fixed vulnerability owned by this package leaves an automated regression in ordinary tests
4. Timing/Abuse rows where Market Data refresh could be spammed or used to hammer a venue
5. Explicit **NOT APPLICABLE** with named owners for trading, orders, balances, positions, execution, monitoring, analytics, and billing

Planning worksheet expectation was completed at Close. Worksheet: [`v3-w2-s03-security-verification-worksheet.md`](./v3-w2-s03-security-verification-worksheet.md).

| Area                  | Expectation                                                | Close |
| --------------------- | ---------------------------------------------------------- | ----- |
| Market Data read      | Authn + Authz + workspace checked                          | PASS  |
| Secret fields         | Never returned; never logged                               | PASS  |
| Projection updates    | Server-side only after validate                            | PASS  |
| Cross-tenant tests    | A↛B for open / select / view                               | PASS  |
| Audit emit            | Read attempted / succeeded / failed / unavailable          | PASS  |
| Honest error bodies   | No ciphertext, no venue dump, no foreign ids beyond policy | PASS  |
| Replay                | Stale snapshot cannot become current                       | PASS  |
| Rate limit            | Throttled is not current data                              | PASS  |
| Integrity             | Malformed payload cannot become ticker, candles, or book   | PASS  |
| Capability projection | Cannot be toggled into Trading enabled by client           | PASS  |

---

## Failure philosophy (security)

| Failure                  | Security-required behavior                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Vault unavailable        | Fail closed; do not read secrets from unsafe storage                                                                |
| Payload ambiguous        | Do not project as current                                                                                           |
| Authz missing            | Deny                                                                                                                |
| Workspace missing/forged | Deny                                                                                                                |
| Provider unavailable     | Honest unavailable; no fake data                                                                                    |
| Rate limited             | Honest unavailable; do not retry in a way that bypasses limits                                                      |
| Stale snapshot           | Show stale; never current                                                                                           |
| Audit emit fails         | Follow existing Wave 1 durability rules; do not silently succeed a privileged read if policy requires durable audit |

---

## Out of this review as primary owners

- Wave 1 product redesign
- Connection Management redesign
- Exchange Connectivity redesign
- Order execution security
- Balance / position inventory security
- Live capital ADR controls
- WebSocket streaming / trading-stream security
- Monitoring alerts product
- Analytics product
- Billing isolation

---

**STOP.** Close security evidence supports Product Owner Close Review. Do **not** declare W2-S03 CLOSED. Do **not** declare Wave 2 COMPLETE.
