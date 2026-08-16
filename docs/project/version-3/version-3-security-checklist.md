# Version 3 Security Checklist

**Document:** Version 3 Security Checklist  
**Date:** 2026-08-16  
**Status:** Mandatory for every `V3-*` package  
**Extended:** 2026-08-16 — Threat Review (lightweight STRIDE) is mandatory in every Security Review  
**Extended:** 2026-08-16 — Timing Assessment and Abuse Assessment are mandatory from S01-c  
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)  
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)  
**Nature:** Checklist. Not an RC. Not an ADR. Not implementation.

Every Version 3 package must complete this checklist twice: at **Implementation Package** (planning intent) and at **Close** (evidence). Every Security Review must also include the **Threat Review**, **Timing Assessment**, and **Abuse Assessment** tables below (see grandfathering). A package cannot Close while any item is **REQUIRES ACTION**.

S01-a is accepted without a Threat Review table. S01-a and S01-b are accepted without Timing Assessment or Abuse Assessment. Do **not** rewrite those reviews. Every subsequent Security Review (starting S01-b) must include Threat Review. Every subsequent Security Review (starting S01-c) must include Timing Assessment and Abuse Assessment.

---

## Package identity

| Field                  | Value                          |
| ---------------------- | ------------------------------ |
| Package                | V3-___                         |
| Wave                   |                                |
| Reviewer               |                                |
| Date (package / close) |                                |
| Stage                  | Implementation Package / Close |

---

## Verdicts (only these three)

| Verdict             | Meaning                                                                                                         | Close allowed?                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **PASS**            | The control is satisfied **for this package’s IN Scope**, with evidence.                                        | Yes, if all other items are PASS or NOT APPLICABLE |
| **NOT APPLICABLE**  | This package does not own the control. Name the owning `V3-*` package or the Master Plan deferral. Not a dodge. | Yes, if the citation is correct                    |
| **REQUIRES ACTION** | The control is in scope and not satisfied, or evidence is missing.                                              | **No. Implementation stops or Close is refused.**  |

Rules:

- Do not mark **PASS** on a later package’s control by shipping a stub.
- Do not mark **NOT APPLICABLE** for a control this package’s IN Scope clearly requires (example: Authentication on V3-S01).
- **NOT APPLICABLE** must cite an owner: package ID, “host infrastructure”, or “out of Version 3 / Master Plan deferred”.
- Fail closed. Convenience never outranks protection of financial assets.

---

## Checklist

Copy the table into the package Security Review. Fill **Verdict**, **Evidence or owner**, and **Action** (empty unless REQUIRES ACTION).

| #   | Control                                            | What PASS requires (this package)                                                                                                                                                                                                                                                                                                                                        | Verdict                                 | Evidence or owner | Action |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------- | ------ |
| 1   | **Authentication**                                 | Operator identity is proven on the surfaces this package exposes. Unauthenticated access is only on routes the package and Master Plan already allow as public. Disabled users fail closed. No passwordless customer path. No shared/dev identity on the product path.                                                                                                   | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 2   | **Authorization**                                  | Every mutating or sensitive action this package adds is authorized server-side (role + workspace as applicable). JWT/role claims are hints; Identity is re-resolved. This package does not invent an ABAC engine. Admin cannot skip Gate or Risk.                                                                                                                        | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 3   | **OWASP Top 10 review**                            | The package reviewed the current OWASP Top 10 against its attack surface and recorded a verdict per relevant class (broken access control, crypto failures, injection, insecure design, security misconfiguration, vulnerable components, identification/auth failures, integrity failures, logging failures, SSRF). Classes not in scope are NOT APPLICABLE with owner. | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 4   | **Input validation**                               | Request bodies, query params, headers, and file/text inputs this package accepts are schema-validated. Unknown fields rejected on financial APIs. IDs, venues, and quantities use canonical types. Money is not IEEE float.                                                                                                                                              | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 5   | **Output encoding**                                | UI keeps framework encoding. JSON APIs do not reflect unsanitized HTML. Telegram/HTML payloads treated as text. No secret material in responses.                                                                                                                                                                                                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 6   | **Session review**                                 | If this package issues or consumes sessions: revocation works; access lifetime is short; refresh rotates if used; stolen/leftover tokens cannot keep acting after revoke. Auth sessions are not trading sessions.                                                                                                                                                        | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 7   | **Credential review**                              | Passwords (if touched) remain bcrypt (or documented successor) at sufficient cost; never plaintext. Reset/refresh secrets hashed at rest. Seed/admin defaults are not the product path. No debug prefill.                                                                                                                                                                | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 8   | **Secret storage**                                 | Customer vendor secrets are not stored in `.env`, logs, UI, or plaintext columns. Vault is the product path when the package handles vendor secrets. Host infrastructure (`DATABASE_URL`, JWT signing, host mail) may remain server-operated. Wrapping keys are not stored with ciphertext.                                                                              | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 9   | **Rate limiting**                                  | Internet-facing or brute-forceable endpoints this package adds are throttled. Existing global limits are not removed. Auth and live-order tightening is not skipped when this package owns those routes.                                                                                                                                                                 | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 10  | **Replay protection**                              | Session-token reuse, reset-token reuse, and (when in scope) live place/cancel replay are handled. Financial replay remains V3-L05 unless this **is** that package. Do not claim live-order replay PASS on an earlier package.                                                                                                                                            | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 11  | **CSRF**                                           | Cookie-authenticated mutations have SameSite=Strict **and** a CSRF token or equivalent. Bearer-only APIs must not also accept a cookie session without CSRF defenses.                                                                                                                                                                                                    | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 12  | **XSS**                                            | Production CSP stance for surfaces this package ships; no access tokens left in JavaScript-readable storage at package exit if this package owns session transport; React defaults kept.                                                                                                                                                                                 | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 13  | **Injection review**                               | No string-built SQL from user input. Prisma (or equivalent parameterized access) kept. Command, template, and prompt injection considered if the package handles those inputs.                                                                                                                                                                                           | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 14  | **Logging review**                                 | Security-relevant events this package owns are structured (actor when known, outcome, workspace, IP/UA as applicable). **No** passwords, tokens, hashes, vault plaintext, or `.env` values in logs.                                                                                                                                                                      | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 15  | **Audit review**                                   | Actions that can affect a financial result or security posture are attributable. If this package is not V3-S05 / V3-L03, it still must not make later audit impossible (keep structured events). It must not claim the audit **product** shipped.                                                                                                                        | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 16  | **Error leakage review**                           | Client errors are generic where enumeration or secret leakage would result (auth, recovery, vault). Stack traces and vendor internals are not shown to customers. Honest Product still applies: unavailable is stated without leaking internals.                                                                                                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 17  | **Permission review**                              | Default new user remains least privilege (Researcher, not Admin, not live-capable Trader). This package does not grant extra privilege as a convenience. Role assignment stays with the owning package (V3-S02 unless this is S02).                                                                                                                                      | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 18  | **Workspace isolation**                            | Workspace id is not a client honor system. Membership checked server-side. This package’s data is scoped. User in workspace A cannot read B’s secrets, orders, or binds. If isolation **product** tests are V3-S06, this package still must not punch a hole.                                                                                                            | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 19  | **Financial Integrity review**                     | Ledger remains Source of Truth for money. No silent balance edits. UI is not financial SoT. Canonical Order Path is not duplicated. Live orders (if any) fail closed. Financial action log is V3-L03 unless this is that package. Corrections are compensating entries only.                                                                                             | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 20  | **Secure-by-default review**                       | Production refuses insecure defaults this package owns (JWT secret rules, cookie flags, CSP, disconnected integrations, live off). Debug credential prefill remains forbidden. Simulated Connected is never shown as real.                                                                                                                                               | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 21  | **Zero Trust review**                              | Every non-public API call this package adds is authenticated. Vendor callbacks (if any) are authenticated independently of browser sessions. Network location is not trusted. Live enablement is server policy, not a hidden UI flag.                                                                                                                                    | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 22  | **Least Privilege review**                         | Surfaces default to deny. Vault list APIs return metadata never secret material. Trader paper ≠ live. Admin is people/policy, not a Gate/Risk bypass. Telegram is never a control plane.                                                                                                                                                                                 | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 23  | **AI safety review** _(when applicable)_           | AI analyses and explains only. It does not decide, approve, size, or start trades. Workspace uses customer-owned keys when this package handles AI keys. Unavailability is honest; research/paper still work. **NOT APPLICABLE** if the package does not touch AI.                                                                                                       | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |
| 24  | **Connection security review** _(when applicable)_ | Connections are product-configured, not customer `.env`. Test/connect/disconnect are honest. SSRF allowlists for customer-supplied URLs. Credentials live in the vault when collected. **NOT APPLICABLE** if the package does not touch connections.                                                                                                                     | PASS / NOT APPLICABLE / REQUIRES ACTION |                   |        |

---

## OWASP Top 10 worksheet (required with item 3)

Record a sub-verdict. Use NOT APPLICABLE with owner when the class is not this package.

| OWASP class                                | Verdict                                 | Notes / owner |
| ------------------------------------------ | --------------------------------------- | ------------- |
| Broken access control                      | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Cryptographic failures                     | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Injection                                  | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Insecure design                            | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Security misconfiguration                  | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Vulnerable and outdated components         | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Identification and authentication failures | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Software and data integrity failures       | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Security logging and monitoring failures   | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| Server-side request forgery (SSRF)         | PASS / NOT APPLICABLE / REQUIRES ACTION |               |

---

## Threat Review (lightweight STRIDE — mandatory)

Every Security Review must include this table. Copy it into the Security Review and fill **Verdict** and **Notes / owner**.

This is **not** a full threat model. It is one STRIDE summary for a financial product. No attack trees. No extra documents.

Each category must be marked **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION**. There is no fourth verdict.

| Category                   | What PASS requires (this package)                                                                                                                                                                        | Verdict                                 | Notes / owner |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------- |
| **Spoofing**               | An attacker cannot pretend to be an operator on the surfaces this package owns. Identity is proven where required. Public routes are only those already allowed.                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Tampering**              | Request bodies, tokens, roles, and records this package owns cannot be altered by the client in a way the server honors. Financial records are not silently edited.                                      | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Repudiation**            | Security-relevant and financial-relevant actions this package owns are attributable (structured events). This package does not claim the audit product unless it is that product.                        | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Information Disclosure** | Passwords, hashes, tokens, vault material, and internals do not appear in API responses, logs, or UI. Errors stay generic where enumeration would leak.                                                  | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Denial of Service**      | Brute-forceable or expensive surfaces this package adds are considered (rate limits, lockout, unbounded work). Residual DoS owned by a later package is **NOT APPLICABLE** with that owner — not a skip. | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Elevation of Privilege** | This package does not grant Admin, live trading, or extra workspace power as a convenience. Default remains least privilege. Server-side authorization is not skipped.                                   | PASS / NOT APPLICABLE / REQUIRES ACTION |               |

Rules:

- **PASS** means the category was reviewed for this package’s IN Scope and the control holds, with a short note.
- **NOT APPLICABLE** means this package cannot create that threat, or the control is owned later. Name the owning `V3-*` package or Master Plan deferral.
- **REQUIRES ACTION** means the category is in scope and not satisfied, or evidence is missing. Security Review cannot PASS.
- Do not invent a full threat model to fill Notes. One line is enough.
- Do not mark **PASS** on a later package’s control.

---

## Timing Assessment (mandatory from S01-c)

Every Security Review must answer:

**Could observable timing reveal protected information?**

This is **assessment only**. Do **not** implement artificial delays to manufacture PASS. Record whether this package’s code path could let an observer distinguish protected states.

Copy the table into the Security Review. Fill **Verdict** and **Notes / owner**.

Each row must be marked **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION**. There is no fourth verdict.

| Surface                   | What PASS requires (this package)                                                                                                              | Verdict                                 | Notes / owner |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------- |
| **Authentication**        | Known vs unknown identity: observable response time is not a practical oracle for account existence on surfaces this package owns.             | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Credential validation** | Password comparison path does not leak match vs miss (or user-found vs user-missing) via an observable timing fork.                            | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Recovery flow**         | If this package owns recovery: timing does not enumerate accounts.                                                                             | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Session validation**    | If this package validates sessions or tokens: timing does not distinguish valid / invalid / revoked beyond what the product already discloses. | PASS / NOT APPLICABLE / REQUIRES ACTION |               |

Example (shape, not a required result):

```text
Known email      ≈ same response time
Unknown email    ≈ same response time

PASS
```

Rules:

- **PASS** means the reviewer considered timing on this package’s IN Scope and no practical oracle is expected from this package’s path. One line in Notes is enough.
- **NOT APPLICABLE** means this package does not own that surface, or residual timing is owned later. Name the owning `V3-*` package or Master Plan deferral.
- **REQUIRES ACTION** means timing is in scope and could reveal protected information, or evidence is missing. Security Review cannot PASS.
- Do **not** add dummy sleeps, padding, or fake work to force PASS.
- Do not mark **PASS** on a later package’s control.

---

## Abuse Assessment (mandatory from S01-c)

Every Security Review must briefly assess abuse against this package’s surfaces.

This is **assessment only**. This section does not require implementing new mitigations in the review task. Record whether the category is controlled here, owned later, or unprotected.

Copy the table into the Security Review. Fill **Verdict** and **Notes / owner**.

Each row must be marked **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION**. There is no fourth verdict.

| Category                | What PASS requires (this package)                                                                                                                     | Verdict                                 | Notes / owner |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------- |
| **Credential stuffing** | Reuse of leaked credentials against this package’s auth surfaces is considered. Existing lockout / rate limits, or a named later owner, are recorded. | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Brute force**         | Repeated secret guessing on this package’s surfaces is considered (lockout, throttle, or named later owner).                                          | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Enumeration**         | Account / user / resource existence is not disclosed by errors, listings, or other oracles this package owns.                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Replay attempts**     | Token / request replay on surfaces this package owns is considered, or a later owner is named.                                                        | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Resource exhaustion** | Expensive or unbounded work this package adds is considered.                                                                                          | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Automation abuse**    | Scripted / high-volume use of this package’s public or sensitive surfaces is considered.                                                              | PASS / NOT APPLICABLE / REQUIRES ACTION |               |
| **Distributed attacks** | Typically **NOT APPLICABLE** unless this package owns platform / IP / edge controls. Name the owner (often V3-S04 or host infrastructure).            | PASS / NOT APPLICABLE / REQUIRES ACTION |               |

Example (shape, not a required result):

```text
Repeated login attempts    Rate limited?     PASS
Credential stuffing        Mitigated?        PASS
Distributed attack         Out of scope      NOT APPLICABLE (V3-S04 / host)

PASS
```

Rules:

- **PASS** means the category was reviewed for this package’s IN Scope and the control holds at this package’s level, with a short note.
- **NOT APPLICABLE** means this package cannot create that abuse, or the control is owned later. Name the owning `V3-*` package, “host infrastructure”, or Master Plan deferral.
- **REQUIRES ACTION** means the category is in scope and not satisfied, or evidence is missing. Security Review cannot PASS.
- Assessment does not ship new rate limits, CAPTCHA, or edge defenses. If the gap is real and in scope, mark **REQUIRES ACTION** and stop — do not silently expand the package.
- Do not mark **PASS** on a later package’s control.

---

## Explicit non-goals (do not “PASS” these unless this package owns them)

| Control                                      | Typical owner                           |
| -------------------------------------------- | --------------------------------------- |
| MFA / TOTP product                           | Wave 6 (live); not a convenience add-on |
| Credential Vault as a domain                 | V3-S03                                  |
| Platform CSP / helmet / global OWASP product | V3-S04                                  |
| Append-only audit product                    | V3-S05                                  |
| Isolation test suite as a product            | V3-S06                                  |
| Connection wizards                           | Wave 2                                  |
| Live-order replay / financial action log     | V3-L05 / V3-L03                         |
| Kill Switch product                          | V3-O04                                  |
| ABAC engine                                  | Out of Version 3                        |

---

## Close rule

```text
any REQUIRES ACTION (checklist, OWASP worksheet, Threat Review, Timing Assessment, or Abuse Assessment)  →  package cannot Close; implementation stops until resolved
all PASS or NOT APPLICABLE  →  Security Review gate may PASS
```

Unresolved REQUIRES ACTION is not deferred to “the next slice” inside the same package Close.

---

**STOP.** Complete this checklist for the package. Do not treat a blank row as PASS.
