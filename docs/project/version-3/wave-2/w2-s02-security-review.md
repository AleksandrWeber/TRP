# W2-S02 Security Review (planning)

**Package:** W2-S02 Exchange Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval. Close evidence later.
**Date:** 2026-08-17
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) — **mandatory**
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w2-s02-implementation-package.md`](./w2-s02-implementation-package.md)
**Scope:** [`w2-s02-product-scope.md`](./w2-s02-product-scope.md)

This review describes **required security outcomes** for W2-S02. It does not describe how to implement them. It does **not** redefine Wave 1 security products. It does **not** redesign Connection Management. It references them.

```text
Exchange Connectivity uses Wave 1 security and W2-S01 Connection Management.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Secrets never leave Vault into a local store.
Connected is earned by authenticated exchange communication — never simulated.
Connected is not Trading enabled.
```

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

---

## Boundary (binding)

| In                                                            | Out                                              |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Authenticated exchange handshake security                     | Owning customer secret ciphertext                |
| Connectivity-gated Connected state for Exchange               | Redesigning Connection Management                |
| Workspace-scoped Connect / Disconnect                         | Reopening Wave 1 packages                        |
| Authn/Authz gates on connectivity actions                     | Identity / RBAC matrix rewrite                   |
| Audit emit for Connect / Failure / Disconnect                 | Audit store / timeline / incidents redesign      |
| Honest Failure when Vault, provider, or handshake unavailable | Live trading enablement                          |
| Replay protection for handshake proofs                        | Order, balance, position, or execution security  |
| Rate-limit awareness on venue communication                   | Monitoring / analytics / billing security scopes |
| Provider capability honesty (offered vs not offered)          | Market-data / WebSocket product security         |
| Verification Standard + regression expectations               | Wave 4 exit or Wave 6 live-capital controls      |

---

## How Exchange Connectivity uses existing security capabilities

| Capability                         | How connectivity uses it                                                              | Must not do                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable Connect      | Invent a second constitution                 |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by this package | Skip worksheets; claim PASS without evidence |
| **Workspace Isolation**            | Handshake and status are workspace-bound; A↛B                                         | Soften isolation to share venue sessions     |
| **Vault**                          | Only retrieve path for handshake credentials; no local secret store; no secret echo   | Duplicate Vault; write secrets to disk       |
| **Authentication**                 | Only signed-in subjects Connect / Disconnect                                          | Create a parallel login                      |
| **Authorization**                  | Only permitted roles Connect / Disconnect                                             | Hard-code a new IAM                          |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                     | Fork platform middleware                     |
| **Security Audit**                 | Emit Connect attempted / succeeded / failed / Disconnect                              | Persist audit itself                         |
| **Connection Management**          | Existing connection records, lifecycle, and catalog                                   | Bypass the facade or invent a second product |

---

## Required coverage

### 1. Credential usage

| Outcome                         | Required                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| Vault is the only secret source | Handshake retrieves credentials from Vault for the owning workspace      |
| No local secret store           | No files, no connection plaintext columns, no browser persistence        |
| Least use                       | Credentials are used for authenticated session proof only                |
| No trading use                  | Credentials must not be used to place orders or fetch balances/positions |
| Replace / revoke respected      | Revoked or replaced Vault material cannot complete a handshake           |

### 2. Exchange authentication

| Outcome                             | Required                                                             |
| ----------------------------------- | -------------------------------------------------------------------- |
| Real authenticated session          | Connect authenticates to the offered exchange                        |
| Provider-specific auth stays honest | Failure to authenticate is Failure, not Connected                    |
| Server-side only                    | The client cannot declare Connected                                  |
| Scope limited                       | Authentication proves communication; it does not enable live trading |

### 3. Workspace boundaries

| Outcome           | Required                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| Workspace scoped  | Workspace A cannot read, Connect, or Disconnect Workspace B connections |
| Credential scoped | Vault retrieve is the owning workspace only                             |
| Session scoped    | An authenticated exchange session is not reusable across workspaces     |
| Fail closed       | Missing or forged workspace context denies                              |

### 4. Replay protection

| Outcome                                                 | Required                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Handshake is not a reusable token the client can replay | A prior success cannot be posted back as Connected                      |
| Provider replay rules respected                         | Signed venue requests follow the provider’s freshness expectations      |
| Status is not client-trusted                            | Connectivity status is assigned only by the product after a fresh proof |
| Disconnect is final for that session claim              | Replaying an old Connected view does not restore Connected              |

### 5. Provider failure handling

| Outcome              | Required                                                 |
| -------------------- | -------------------------------------------------------- |
| Auth rejected        | Failure; not Connected                                   |
| Network / venue down | Honest unavailable / Failure; not Connected              |
| Ambiguous outcome    | Do not mark Connected                                    |
| Partial success      | Connectivity proof only; never invent balances or orders |
| Fail closed          | Unknown provider or unknown error is not Connected       |

### 6. Rate-limit awareness

| Outcome                         | Required                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| Inherit platform abuse controls | Connect cannot become an unauthenticated flood path           |
| Venue rate limits are honest    | Throttled / limited is Failure or unavailable — not Connected |
| No hammering                    | Repeated Connect does not ignore rate-limit signals           |
| No secret in throttle errors    | Operator-safe reason only                                     |

### 7. Secret handling

| Outcome            | Required                                                           |
| ------------------ | ------------------------------------------------------------------ |
| No echo            | UI/API never return stored secret material                         |
| No logs            | Secrets and signing material are not written to logs or audit body |
| No export          | No copy, download, or reveal of exchange credentials               |
| No customer `.env` | Connectivity does not revive a host-file secret path               |
| In-memory use only | Retrieved material is used for handshake and not persisted locally |

### 8. OWASP / API implications

Planning mapping. Complete with evidence at Close.

| Class                             | Implication for this package                        | Required outcome                                                |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| Broken access control / BOLA      | Connect on another workspace’s connection id        | Deny; anti-enumeration consistent with Wave 1                   |
| Broken authentication             | Anonymous Connect                                   | Deny                                                            |
| Injection                         | Provider identifiers, connection ids, error strings | Parameterized, constrained identifiers; no secret interpolation |
| Security misconfiguration         | Debug Connected, verbose venue dumps                | Honest operator errors only; no stack or credential dump        |
| Sensitive data exposure           | Keys in responses, logs, traces                     | Vault-only; no echo                                             |
| SSRF / unconstrained outbound     | Handshake to an operator-supplied URL               | Offered providers only; no arbitrary URL Connect                |
| Excessive data / inventory        | Returning balances, positions, account inventory    | Out of scope; must not appear                                   |
| Unrestricted resource consumption | Connect spam                                        | Platform abuse controls + rate-limit awareness                  |
| Unsafe consumption of APIs        | Trusting venue or client status blindly             | Server assigns Connected only after authenticated proof         |
| Integrity failure                 | Client-set Connected or replayed proof              | Reject                                                          |

Live trading, order injection, and financial integrity beyond connectivity proof are **NOT APPLICABLE** here and remain Wave 6 / Order Path.

---

## Security outcomes (mandatory)

### A. Secrets

| Outcome                        | Required                                                |
| ------------------------------ | ------------------------------------------------------- |
| No customer `.env` path        | Handshake uses Vault-backed connection credentials only |
| No plaintext echo              | UI/API never return stored secret material              |
| No local store                 | Connectivity never writes secrets beside Vault          |
| Revoked/disabled not Connected | Status and runtime use agree                            |

### B. Access control

| Outcome            | Required                                             |
| ------------------ | ---------------------------------------------------- |
| Authenticated only | Anonymous Connect / Disconnect denied                |
| Authorized only    | Roles without permission cannot Connect / Disconnect |
| Workspace scoped   | Workspace A cannot use Workspace B exchange sessions |
| Fail closed        | Missing workspace context denies                     |

### C. Honesty / abuse

| Outcome                        | Required                                                |
| ------------------------------ | ------------------------------------------------------- |
| No simulated Connected success | Connected requires authenticated exchange communication |
| No live-trading claim          | Connectivity must not enable or imply Wave 6            |
| No order / balance / position  | Capability projection excludes trading inventory        |
| Failures honest                | Failure with operator-safe reason; no secret leakage    |

### D. Auditability

| Outcome                 | Required                                             |
| ----------------------- | ---------------------------------------------------- |
| Connect attributable    | Who attempted / succeeded / failed is auditable      |
| Disconnect attributable | Who disconnected is auditable                        |
| Deny attributable       | Where product already audits denies, keep emit rules |

---

## Threat Review (STRIDE) — planning intent

| Category                   | Threat example                                                      | Required outcome                                          | Verdict       |
| -------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| **Spoofing**               | Act as another operator to Connect an exchange                      | Authentication binding required                           | PASS (intent) |
| **Tampering**              | Set Connected without a handshake; replay an old proof              | Server-side status; replay protection                     | PASS (intent) |
| **Repudiation**            | Deny having Connected or Disconnected                               | Audit events for Connect / Failure / Disconnect           | PASS (intent) |
| **Information Disclosure** | Read another workspace’s connection or secrets; dump venue payloads | Isolation + Vault deny; no secret echo; no inventory leak | PASS (intent) |
| **Denial of Service**      | Connect spam against platform or venue                              | Inherit platform abuse controls; rate-limit awareness     | PASS (intent) |
| **Elevation of Privilege** | Reader Connects; connectivity used as trading enablement            | Authorization + isolation; no Trading enabled             | PASS (intent) |

A package cannot Close while any Threat Review row is **REQUIRES ACTION**.

---

## Threats this package must reduce

| Threat                                   | Control in this package                 |
| ---------------------------------------- | --------------------------------------- |
| Credential theft via local files / logs  | Vault-only path; no secret logging/echo |
| Broken access control on Connect         | Authz + workspace scope on every action |
| Dishonest connected theater              | Handshake-gated Connected               |
| Cross-tenant credential or session use   | Workspace-scoped retrieve and handshake |
| Replay of handshake success              | Fresh proof; client cannot set status   |
| Venue outage shown as Connected          | Honest Failure / unavailable            |
| Rate-limit bypass / hammering            | Rate-limit awareness; fail closed       |
| Connectivity used as live-trading switch | Capability projection excludes trading  |

---

## Controls explicitly not this package

| Control                                | Owner                                                              |
| -------------------------------------- | ------------------------------------------------------------------ |
| Password / session / MFA mechanics     | Authentication (S01)                                               |
| Role matrix content                    | Authorization (S02)                                                |
| Encryption / wrapping keys             | Vault (S03)                                                        |
| Secure headers / rate-limit product    | Security Platform (S04)                                            |
| Append-only audit store                | Security Audit (S05)                                               |
| Isolation proof suite ownership        | Workspace Isolation (S06) — connectivity **consumes** the boundary |
| Connection catalog / lifecycle product | Connection Management (W2-S01)                                     |
| Live order controls                    | Wave 6 / Gate / Risk                                               |
| Monitoring alerts product              | Wave 3                                                             |
| Billing isolation                      | Wave 9                                                             |

---

## Security Verification Standard expectations

W2-S02 starts after the Verification Standard is approved. At Close, **every category and every row** must be **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION** (zero REQUIRES ACTION allowed to Close).

Must include:

1. Injection through Secure Headers (categories 1–14) as applicable to connectivity surfaces
2. Explicit OWASP Top 10 and OWASP API Top 10 mapping for Connect / Disconnect / status
3. **Security Regression Suite** — every found-and-fixed vulnerability owned by this package leaves an automated regression in ordinary tests
4. Timing/Abuse rows where Connect could be spammed or used to hammer a venue
5. Explicit **NOT APPLICABLE** with named owners for live trading, orders, balances, positions, execution, monitoring, and billing

Planning worksheet expectation (complete at implementation Close, not now):

| Area                  | Expectation                                                |
| --------------------- | ---------------------------------------------------------- |
| Connect / Disconnect  | Authn + Authz + workspace checked                          |
| Secret fields         | Never returned; never logged                               |
| Status updates        | Server-side only after authenticated proof                 |
| Cross-tenant tests    | A↛B for Connect / status / Disconnect                      |
| Audit emit            | Connect attempted / succeeded / failed / Disconnect        |
| Honest error bodies   | No ciphertext, no venue dump, no foreign ids beyond policy |
| Replay                | Stale proof cannot become Connected                        |
| Rate limit            | Throttled is not Connected                                 |
| Capability projection | Cannot be toggled into Trading enabled by client           |

---

## Failure philosophy (security)

| Failure                  | Security-required behavior                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Vault unavailable        | Fail closed; do not read secrets from unsafe storage                                                                   |
| Handshake ambiguous      | Do not mark Connected                                                                                                  |
| Authz missing            | Deny                                                                                                                   |
| Workspace missing/forged | Deny                                                                                                                   |
| Provider rejected auth   | Failure; not Connected                                                                                                 |
| Rate limited             | Honest Failure / unavailable; do not retry in a way that bypasses limits                                               |
| Audit emit fails         | Follow existing Wave 1 durability rules; do not silently succeed a privileged Connect if policy requires durable audit |

---

## Out of this review as primary owners

- Wave 1 product redesign
- Connection Management redesign
- Order execution security
- Balance / position inventory security
- Live capital ADR controls
- Market-data / WebSocket product security
- Monitoring alerts product
- Billing isolation

---

**STOP.** Wait for Product Owner review before W2-S02 implementation begins. Re-run this Security Review with evidence at Close.
