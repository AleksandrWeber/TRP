# V3-S04 Product Scope

**Package:** V3-S04 OWASP & API Hardening (Security Platform Hardening)
**Wave:** 1 — Security Foundation
**Status:** Implementation package — awaiting Product Owner review. Not Approved. Not implementation.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Umbrella:** [`v3-s04-implementation-package.md`](./v3-s04-implementation-package.md)
**Capability:** SEC-08 OWASP / API Security

This document freezes **IN / OUT**, **ownership**, **customer outcomes**, and **honest platform language** for V3-S04. It does not add journeys the Master Plan did not already name. It does not redesign Version 2. It does not invent a new bounded context.

---

## Product purpose

Security Platform Hardening is the product layer that makes the **whole platform** resist common web and API attacks by default.

It does **not** replace Authentication (S01 CLOSED). Sessions, passwords, recovery, and CSRF on auth mutations stay with Authentication.

It does **not** replace Authorization (S02 CLOSED). Roles, People, and permission decisions stay with RBAC.

It does **not** replace Vault (S03 Platform Complete). Secrets stay with Vault. Vault Customer Complete UI stays Vault-owned.

It does **not** become Connection Management, Audit product, Isolation suite, Billing, or Live Trading.

```text
S04 hardens the platform edge and shared API posture.
It owns systemic defaults — not feature silos.
It does not own vendor connections or financial Source of Truth.
```

---

## Why S04 exists (business language)

A professional will not trust a research operating system that is careful in login, careful in roles, and careful in the vault — but still leaves CSP env-gated, flood controls partial, errors that leak internals, and no single owner for OWASP defaults.

Version 2 shipped useful baselines (helmet, rate-limit, ValidationPipe). Version 3 Wave 1 must make those baselines a **product promise**: production-default, fail closed, inherited by every later integration.

Without S04, Connection Management and real vendor traffic would invent security under deadline pressure. That is how regressions happen.

---

## Customer value

After this package Closes, an operator experiences a platform that:

- Refuses bad or abusive requests without leaking internals
- Denies unauthorized access without teaching what exists
- Limits flooding of sensitive actions
- Runs production with secure browser/HTTP defaults already on

Wave 1 exit line this package owns (Master Plan / Execution Roadmap):

> Global rate limit, CSP, helmet, validation, and injection posture are production-default on.

This package does **not** own:

> A secret can be stored encrypted… (S03)
> Security-relevant authz failures are in an append-only audit log (S05)
> Cross-workspace credential or data reads fail closed in tests (S06 product suite)
> I save Binance credentials… (Wave 2)

---

## Customer outcomes (this package only)

### The customer receives

1. **What does the customer receive?**
   Production-default platform hardening: secure headers (including CSP stance and clickjacking denial), rate limiting, request size limits, input validation strategy, safe errors, anti-enumeration, technology-disclosure policy, cookie/CSRF platform consistency, and an SSRF allowlist foundation for later webhooks.

2. **What does the customer NOT receive?**
   See OUT OF Scope below — especially Connections, exchanges, Telegram/SMTP, Vault UI completion, audit dashboard, isolation suite, billing, live trading, monitoring dashboards.

3. **What business problem does S04 solve?**
   Auth, RBAC, and Vault are secure individually; the platform still needs systemic hardening before real customer integrations.

4. **Which future packages depend on S04?**
   V3-S05, V3-S06, Wave 1 exit → Wave 2 Connections; Wave 5/9 webhook SSRF use; every later HTTP surface that inherits SEC-08.

### Explicit receive / not-receive table

| Customer receives                            | Customer does NOT receive                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Clear errors without internal leaks          | Stack traces, framework banners, version fingerprints as convenience                                             |
| Consistent unauthorized denial               | A “Security settings” administration product page (unless already implied by defaults — S04 is mostly invisible) |
| Rate limiting on sensitive actions           | Distributed edge DDoS product / CDN product                                                                      |
| Secure headers by default in production      | Per-integration header reinvention                                                                               |
| SSRF allowlist foundation                    | Live Slack/Discord/Teams/Push webhooks                                                                           |
| Platform anti-enumeration                    | Guarantee that every future package is done                                                                      |
| Hardened baseline for integrations           | Connection Management, venue I/O, Telegram, SMTP send, AI consumers                                              |
| Cookie/CSRF policy consistency               | A second authentication system                                                                                   |
| Security Coverage Matrix (planning artifact) | External penetration test as a substitute for Close                                                              |

---

## Ownership (binding)

| Concern                                       | Owner                                  | Must not own                               |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| Platform security headers / CSP / HSTS stance | **S04** (Identity/Auth platform HTTP)  | Vault, Ledger, order path                  |
| Rate limiting / size limits                   | **S04** (extends Version 2 baseline)   | S01 account lockout replacement            |
| Validation / unexpected fields / pollution    | **S04** policy + existing pipes        | Spec v2.0 money types redesign             |
| Error / disclosure / anti-enumeration         | **S04**                                | Audit **product** UI (S05)                 |
| SSRF allowlist foundation                     | **S04**                                | Webhook delivery product (Wave 5/9)        |
| Cookie / CSRF platform consistency            | **S04** + S01 (auth mutations already) | New session SoT                            |
| Login passwords / sessions / refresh replay   | Authentication (S01)                   | Platform headers as Auth’s only job        |
| Roles / People / IDOR on assignments          | Authorization (S02)                    | Platform rate limits as RBAC               |
| Vendor secrets / encryption                   | Vault (S03)                            | Platform CSP as Vault’s job                |
| Append-only audit product                     | V3-S05                                 | Platform event emission only in S04        |
| Isolation suite                               | V3-S06                                 | Claiming S06 PASS by header work           |
| Connections / venues / channels / AI use      | Wave 2+                                | Anything in S04 IN Scope as those products |
| Financial replay on live place/cancel         | V3-L05                                 | Claiming full SEC-08 replay done in S04    |

**Bounded context:** S04 does **not** introduce a new bounded context.

---

## IN Scope (exact)

| Capability                         | Meaning for the operator / platform                                          |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Global security middleware         | Shared refuse/allow posture at the edge                                      |
| Security headers                   | CSP, frame denial, nosniff, Referrer-Policy, Permissions-Policy, HSTS stance |
| HTTP hardening                     | Safe method/cache/Host-header behavior on owned surfaces                     |
| Input validation strategy          | Schema-validated bodies/queries; fail closed                                 |
| Output encoding                    | No unsanitized HTML; no secret echo                                          |
| Rate limiting                      | Platform + auth-route tightening                                             |
| Request size limits                | Oversized bodies refused                                                     |
| Request normalization              | Parameter pollution does not bypass checks                                   |
| Security logging                   | Non-secret abuse/security events (product view later)                        |
| Error handling                     | Generic client errors where leak/enumeration would result                    |
| Security configuration             | Production secure defaults; fail closed if misconfigured                     |
| OWASP compliance (SEC-08)          | Mapped controls for platform surfaces                                        |
| Secure defaults                    | No “remember to turn CSP on” customer step                                   |
| Platform-wide anti-enumeration     | Unauthorized ≈ non-informative deny                                          |
| Technology disclosure policy       | No helpful stack/server/version banners                                      |
| Mass assignment defense            | Unexpected privileged fields rejected on sensitive APIs                      |
| Directory / path traversal defense | Where path/file surfaces exist                                               |
| Deserialization risk posture       | Malformed payloads fail closed; no unsafe object revive on owned APIs        |
| Open redirect defense              | Redirect targets allowlisted or relative-only on owned surfaces              |
| Header injection / CRLF defense    | Reject CR/LF smuggling in headers/logs/redirects                             |
| Clickjacking defense               | Framing denied for sensitive UI                                              |
| SSRF foundation                    | Allowlist helpers; block link-local and cloud metadata patterns              |
| Cookie policy                      | Secure / HttpOnly / SameSite consistency for credential cookies              |
| Security Coverage Matrix           | Threat → S01–S04 coverage map maintained                                     |

---

## OUT OF Scope (explicit)

| Item                                                    | Owner later                       |
| ------------------------------------------------------- | --------------------------------- |
| Connection Management                                   | Wave 2 `V3-C01`…`C04`             |
| Exchange integrations (Binance, Bybit, OKX, Kraken I/O) | Waves 2/4                         |
| Telegram                                                | Wave 5                            |
| SMTP / email send                                       | Wave 5                            |
| OpenRouter consumers / AI chat                          | Wave 2/7                          |
| Vault UI / Customer Complete                            | V3-S03 (Vault-owned)              |
| Billing                                                 | Wave 9                            |
| Live Trading                                            | Wave 6 + ADR                      |
| Monitoring dashboards                                   | Wave 3                            |
| Audit Trail product                                     | V3-S05                            |
| Workspace Isolation suite product                       | V3-S06                            |
| Financial replay / nonce window completion              | V3-L05                            |
| MFA / extra factors                                     | Later pre-live                    |
| Customer webhook product                                | Wave 9 (uses S04 SSRF foundation) |
| Prompt injection controls                               | AI packages / later waves         |

---

## Product Walkthrough (operator experience)

Not engineering. What the operator notices.

### Invalid request

```text
Operator submits invalid input
        ↓
Clear error
        ↓
No internal information leaked
```

### Unauthorized request

```text
Operator (or attacker) requests a resource they must not see
        ↓
Denied
        ↓
No resource enumeration
```

### Flood / spray

```text
Repeated sensitive attempts
        ↓
Limited
        ↓
Honest “try later” / unavailable
        ↓
Normal use recovers
```

### Framing / browser abuse

```text
Hostile page tries to frame the product
        ↓
Framing denied
```

### Production defaults

```text
Operator uses production product
        ↓
Secure headers and validation already on
        ↓
No customer “enable security” chore
```

Full checklist form: Implementation Package Product Walkthrough. Overview: [`security-platform-overview.md`](./security-platform-overview.md).

---

## Mandatory planning questions (answers)

| #   | Question                                  | Answer                                                                                                                                             |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What does the customer receive?           | Systemic platform hardening and secure defaults (see receive table).                                                                               |
| 2   | What does the customer NOT receive?       | Connections, vendors, Vault UI completion, audit/isolation products, billing, live, monitoring dashboards.                                         |
| 3   | What business problem does S04 solve?     | Platform-wide attack resistance before real integrations.                                                                                          |
| 4   | Which future packages depend on S04?      | S05, S06, Wave 2+, webhook consumers, later HTTP surfaces; L05 still owns live replay.                                                             |
| 5   | Which OWASP categories become covered?    | See [`v3-s04-security-review.md`](./v3-s04-security-review.md) § OWASP mapping and [`security-coverage-matrix.md`](./security-coverage-matrix.md). |
| 6   | Does S04 introduce a new bounded context? | **No.**                                                                                                                                            |
| 7   | Was the Master Plan respected?            | **Yes** — SEC-08 / V3-S04 / Wave 1 only; no plan edits.                                                                                            |
| 8   | Were Product Principles respected?        | **Yes** — Security Before Convenience, Customer First, Honest Product, Architecture Is a Constraint, Paper First / Live Must Be Earned unchanged.  |

---

## Relationship to earlier Wave 1 packages

| Package | Delivers                                   | Still needs S04 for                                       |
| ------- | ------------------------------------------ | --------------------------------------------------------- |
| S01     | Who you are; sessions; auth CSRF           | Platform flood tightening; CSP product; disclosure policy |
| S02     | What you may do                            | Platform caps; dependency/header product                  |
| S03     | Where secrets live                         | Platform DoS/headers; not Vault encryption                |
| S04     | How the platform edge behaves for everyone | —                                                         |
| S05     | Searchable security history                | Consumes events; not headers                              |
| S06     | Isolation proof suite                      | Not headers                                               |

---

## Acceptance criteria (product)

| #   | Outcome                                          | Fail if                                  |
| --- | ------------------------------------------------ | ---------------------------------------- |
| 1   | Invalid request → clear error → no internal leak | Stack/framework/version leak             |
| 2   | Unauthorized → denied → no enumeration           | Existence oracle on owned surfaces       |
| 3   | Sensitive flood limited                          | Unlimited spray                          |
| 4   | Clickjacking denied                              | Sensitive UI iframable                   |
| 5   | Production secure defaults on                    | Prod boots “insecure for convenience”    |
| 6   | S01–S03 journeys unregressed                     | Sign-in / People / Vault platform broken |

---

## Honest language rules

| Must say                                        | Must not say                                  |
| ----------------------------------------------- | --------------------------------------------- |
| Production-default platform hardening           | Wave 1 complete                               |
| Denied / unavailable / try later                | Connected to Binance / live enabled           |
| Clear error                                     | Internal exception text                       |
| Framing denied                                  | “Unhackable” / “OWASP certified by S04 alone” |
| Vault remains Vault-owned for Customer Complete | S04 finished Vault UI                         |

---

**STOP.** Awaiting Product Owner review. No implementation until the Implementation Package is Approved.
