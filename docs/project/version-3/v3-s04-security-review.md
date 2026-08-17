# V3-S04 Security Review (planning)

**Package:** V3-S04 OWASP & API Hardening
**Wave:** 1 — Security Foundation
**Status:** Planning security review — awaiting Product Owner Approval with the Implementation Package. Not a post-implementation closeout.
**Date:** 2026-08-17
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) — **mandatory** for this package
**Umbrella:** [`v3-s04-implementation-package.md`](./v3-s04-implementation-package.md)
**Scope:** [`v3-s04-product-scope.md`](./v3-s04-product-scope.md)
**Coverage map:** [`security-coverage-matrix.md`](./security-coverage-matrix.md)

This review describes **required security outcomes** for V3-S04. It does not describe how to implement them. Authentication remains Authentication. Authorization remains Authorization. Vault remains Vault. Connections, venues, Telegram, SMTP delivery, and AI use keep their later owners.

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

```text
S04 owns platform-wide hardening.
It does not re-own S01 sessions, S02 roles, or S03 ciphertext.
It does not claim Wave 1 exit alone.
```

---

## Boundary (binding)

| In                                         | Out                                                    |
| ------------------------------------------ | ------------------------------------------------------ |
| Headers, CSP, HSTS stance, clickjacking    | Vault encryption                                       |
| Rate limits, size limits, DoS bounds       | Account lockout product (S01) — complement only        |
| Validation, encoding, mass assignment, HPP | People IDOR (S02) — complement via platform deny shape |
| Error / disclosure / anti-enumeration      | Audit product UI (S05)                                 |
| SSRF allowlist foundation                  | Webhook product (Wave 5/9)                             |
| Cookie/CSRF platform consistency           | Refresh replay (S01)                                   |
| Security logging (non-secret events)       | Isolation suite (S06)                                  |
| OWASP SEC-08 platform coverage             | Financial live replay (V3-L05)                         |

---

## Threat model

From the Security Vision, this package is the primary control for **request tampering**, **XSS (platform CSP)**, **SSRF foundation**, **injection platform posture**, **security misconfiguration**, and **flood/DoS** at the edge. It is a contributing control for account takeover (throttle) and information disclosure. It is **not** the primary control for credential leakage (S03), role abuse (S02), session theft (S01), or live order fraud (Wave 6).

| Threat                              | Example against this package                        | Required outcome                                                         |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| **XSS**                             | Injected script steals session via product UI       | CSP on by default in production; React encoding kept; cookies HttpOnly   |
| **CSRF**                            | Hostile site triggers cookie-authenticated mutation | SameSite + CSRF (or equivalent) on cookie mutations platform-wide        |
| **Clickjacking**                    | UI framed; operator tricked                         | Frame ancestors / X-Frame-Options deny                                   |
| **Injection**                       | SQL/command/header/CRLF via inputs                  | Prisma kept; no string-built SQL; header/CRLF rejected                   |
| **SSRF**                            | Webhook URL hits cloud metadata (future)            | Allowlist foundation now; link-local/metadata blocked                    |
| **Open redirect**                   | `?next=` to evil host                               | Allowlist or relative-only                                               |
| **Host header attacks**             | Poisoned Host used in links/resets                  | Host validated / not trusted for security decisions unsafely             |
| **Header injection**                | CRLF in header values                               | Reject                                                                   |
| **Mass assignment**                 | Client sets `role=Admin` in body                    | Unexpected privileged fields rejected                                    |
| **HTTP Parameter Pollution**        | Duplicate params bypass checks                      | Normalization; fail closed                                               |
| **Deserialization**                 | Hostile payload revives objects                     | Malformed JSON fails closed; no unsafe revive                            |
| **IDOR / enumeration**              | Probe IDs to learn existence                        | Platform deny shape; authz still server-side (S02/S03 own object checks) |
| **Directory / path traversal**      | `../` escapes storage                               | Reject / sanitize on owned path surfaces                                 |
| **Technology / version disclosure** | Server banners, stack traces                        | Minimized / removed from customer responses                              |
| **Rate abuse / DoS**                | Login flood; huge bodies                            | Throttle + size limits                                                   |
| **Security misconfiguration**       | CSP off in prod “for convenience”                   | Fail closed                                                              |
| **Elevation**                       | Hardening used to skip Gate/Risk                    | Forbidden — no financial bypass                                          |

Out of this review as primary owners: session family revoke (S01), role assignment (S02), vault plaintext ban (S03), searchable audit (S05), isolation suite (S06), live replay (L05), prompt injection (AI later).

---

## Threat Review (STRIDE) — planning intent

| Category               | Verdict           | Notes                                                    |
| ---------------------- | ----------------- | -------------------------------------------------------- |
| Spoofing               | **PASS (intent)** | Host-header / cookie policy; auth remains S01            |
| Tampering              | **PASS (intent)** | Validation, HPP, mass assignment, header injection       |
| Repudiation            | **PASS (intent)** | Security logging of abuse-class events; product view S05 |
| Information Disclosure | **PASS (intent)** | Errors, anti-enumeration, disclosure policy              |
| Denial of Service      | **PASS (intent)** | Rate limit, size limits                                  |
| Elevation of Privilege | **PASS (intent)** | No role grant; no Gate/Risk skip                         |

Timing Assessment and Abuse Assessment: required at Close (from S01-c onward pattern). Planning: auth-route throttle and size limits are the primary Timing/Abuse surfaces for S04.

---

## Mandatory topic coverage

| Topic                    | S04 outcome                                                | Owner if not S04                    |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------- |
| Injection protection     | Prisma + forbid string SQL + header/CRLF                   | —                                   |
| XSS                      | CSP + encoding + HttpOnly cookies                          | —                                   |
| CSRF                     | Platform cookie mutation policy                            | S01 owns auth mutation CSRF already |
| IDOR                     | Platform enumeration resistance; object authz stays domain | S02 / S03                           |
| SSRF                     | Allowlist foundation                                       | Wave 5/9 product use                |
| Clickjacking             | Frame denial                                               | —                                   |
| Open Redirect            | Allowlist / relative-only                                  | —                                   |
| Header Injection         | Reject CRLF                                                | —                                   |
| Host Header attacks      | Validated / not blindly trusted                            | —                                   |
| Mass Assignment          | Unexpected fields rejected                                 | —                                   |
| HTTP Parameter Pollution | Normalized / fail closed                                   | —                                   |
| Deserialization risks    | Fail closed JSON; no unsafe revive                         | —                                   |
| Technology disclosure    | No banners                                                 | —                                   |
| Version disclosure       | No convenience version leak                                | —                                   |
| Directory traversal      | Fail closed on owned paths                                 | —                                   |
| Path traversal           | Same                                                       | —                                   |
| Rate limiting            | Platform + auth-route                                      | S01 lockout complementary           |
| Enumeration resistance   | Uniform deny where required                                | —                                   |
| Secure headers           | Full suite                                                 | —                                   |
| CSP                      | On by default in production                                | —                                   |
| HSTS                     | Present or named host owner with evidence                  | Host edge may share                 |
| Cookie policy            | Secure / HttpOnly / SameSite                               | S01 sets auth cookies               |

---

## Security Verification Standard — planning intent map

Every row must be filled at Close with evidence. Below is **intent ownership** so implementers do not mis-claim PASS.

### Categories 1–14 (summary)

| Category               | S04 intent                                                                                  | Typical N/A owners         |
| ---------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| 1 Injection            | **PASS** for platform SQL/command/header/CRLF/template; Prompt Injection **N/A** (AI later) | LDAP/XXE/CSV if no surface |
| 2 Cross-site           | **PASS** XSS/CSRF/clickjacking/open redirect/CORS if configured                             | —                          |
| 3 Authentication       | Mostly **N/A** (S01) except flood complement (**PASS** rate)                                | Password policy S01        |
| 4 Authorization        | Platform deny/enumeration **PASS**; object IDOR **N/A**/contribute                          | S02/S03                    |
| 5 API security         | **PASS** validation, encoding, JSON, unexpected fields, HPP, rate, errors, leakage          | —                          |
| 6 URL security         | **PASS** enumeration/hidden endpoints/secrets-in-URL policy                                 | —                          |
| 7 Transport            | **PASS** cookie flags consistency; HSTS; HTTPS assumed; no secrets in GET                   | Host TLS                   |
| 8 Secrets              | **N/A** primary (S03/S01) — must not log secrets in S04 logging                             | S03                        |
| 9 File upload          | **N/A** if no upload; else **PASS** size/path                                               | —                          |
| 10 Availability        | **PASS** rate/size/DoS                                                                      | Distributed edge = host    |
| 11 Financial integrity | **PASS** — must not add Gate/Risk/ledger bypass; replay **N/A** → L05                       | L05                        |
| 12 AI                  | **N/A**                                                                                     | Later AI                   |
| 13 Privacy             | **PASS** minimize PII in platform errors/logs                                               | —                          |
| 14 Secure headers      | **PASS** CSP, frame, referrer, permissions, nosniff                                         | —                          |

### 18.1 OWASP Top 10 — planning map

| OWASP class                                | Verdict (intent)                                                       | Notes / owner                       |
| ------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------- |
| Broken access control                      | **PASS** (platform consistency / enumeration)                          | Object IDOR primary S02/S03         |
| Cryptographic failures                     | **NOT APPLICABLE**                                                     | S01 passwords / S03 vault crypto    |
| Injection                                  | **PASS**                                                               | Platform                            |
| Insecure design                            | **PASS**                                                               | Secure-by-default stance            |
| Security misconfiguration                  | **PASS**                                                               | Core S04                            |
| Vulnerable and outdated components         | **PASS** (process: no reckless adds; CI/host owns continuous CVE)      | Not a customer page                 |
| Identification and authentication failures | **PASS** (flood/throttle complement)                                   | Core authn S01                      |
| Software and data integrity failures       | **PASS** (no unsafe deserialize; no supply of unsigned “security off”) | —                                   |
| Security logging and monitoring failures   | **PASS** (emit non-secret security events)                             | Product view S05; dashboards Wave 3 |
| Server-side request forgery (SSRF)         | **PASS** (foundation)                                                  | Product webhooks later              |

### 18.2 OWASP API Top 10 — planning map

| OWASP API class                                 | Verdict (intent)                                                  | Notes / owner                          |
| ----------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| Broken object level authorization               | **PASS** (enumeration) / contribute                               | Primary object checks S02/S03          |
| Broken authentication                           | **PASS** (throttle)                                               | S01 primary                            |
| Broken object property level authorization      | **PASS**                                                          | Mass assignment / unexpected fields    |
| Unrestricted resource consumption               | **PASS**                                                          | Rate + size                            |
| Broken function level authorization             | **NOT APPLICABLE** / contribute                                   | S02 primary                            |
| Unrestricted access to sensitive business flows | **PASS** (throttle sensitive flows)                               | Live flows Wave 6                      |
| Server side request forgery                     | **PASS** (foundation)                                             | —                                      |
| Security misconfiguration                       | **PASS**                                                          | —                                      |
| Improper inventory management                   | **PASS** (hidden endpoints still protected; no shadow admin APIs) | —                                      |
| Unsafe consumption of APIs                      | **NOT APPLICABLE**                                                | Outbound vendor clients later packages |

### Security Regression Suite — planning rules

At Close, every S04-owned fix must leave an automated regression test. Expected class coverage for this package (when exercised):

| Class                | Expected in S04 suite                             |
| -------------------- | ------------------------------------------------- |
| XSS                  | Header/CSP or reflection encoding regression      |
| CSRF                 | Cookie mutation without CSRF denied               |
| Header Injection     | CRLF rejected                                     |
| Mass Assignment      | Privileged field rejected                         |
| SQL Injection        | If any raw path touched — parameterized/rejected  |
| Rate limiting / size | Oversized or flood fails closed                   |
| SSRF                 | Disallowed URL/host rejected by foundation helper |
| Open Redirect        | Evil target rejected                              |
| Other                | As found                                          |

IDOR object checks remain owned by S02/S03 suites; S04 may add enumeration-shape regressions only.

---

## Mapping to Version 3 Security Verification Standard

| Standard obligation               | How S04 satisfies                                          |
| --------------------------------- | ---------------------------------------------------------- |
| Complete every category row       | Close Security Review worksheet                            |
| OWASP Top 10 + API Top 10         | Tables above → evidence at Close                           |
| Security Regression Suite         | Slice tests + any fix tests                                |
| Do not claim later owners as PASS | N/A rows name S01–S03, S05–S06, L05, Wave 5/9, host        |
| Fail closed                       | Production misconfig refuses boot or refuses insecure mode |

---

## Capability → catalog map (special requirement)

Every planned S04 capability mapped to OWASP Top 10, OWASP API Top 10, and Verification Standard categories:

| Planned capability                             | OWASP Top 10                               | OWASP API Top 10                | Verification Standard                           |
| ---------------------------------------------- | ------------------------------------------ | ------------------------------- | ----------------------------------------------- |
| Security headers / CSP / HSTS / clickjacking   | A05 Misconfig; A03 Injection (XSS defense) | API8 Misconfig                  | §2 Cross-site; §14 Secure headers; §7 Transport |
| HTTP hardening / Host header / cache           | A05; A01                                   | API8                            | §5 API; §6 URL; §7 Transport                    |
| Input validation strategy                      | A03 Injection; A04 Insecure design         | API3 Property; API4 Consumption | §5.1–5.5; §1 Injection                          |
| Output encoding                                | A03 XSS                                    | API8                            | §2.1–2.4; §5.2                                  |
| Rate limiting                                  | A07 Authn failures; A04                    | API4 Resource consumption       | §5.7; §10 Availability; §3.7–3.8 complement     |
| Request size limits                            | A04; A05                                   | API4                            | §10.2; §5                                       |
| Request normalization / HPP                    | A01; A03                                   | API3; API8                      | §5.5                                            |
| Security logging                               | A09 Logging                                | API8                            | §13 Privacy; §5; repudiation                    |
| Error handling / anti-enumeration / disclosure | A01; A05                                   | API1 BOLA (oracle); API8        | §5.9–5.14; §6.5; §4.3 contribute                |
| Secure defaults / config                       | A05                                        | API8                            | §14; insecure design                            |
| Mass assignment                                | A01                                        | API3                            | §4.5; §5.4                                      |
| Open redirect                                  | A01                                        | API8                            | §2.7                                            |
| Header / CRLF injection                        | A03                                        | API8                            | §1.6–1.7                                        |
| Path / directory traversal                     | A01; A03                                   | API8                            | §9.6–9.7 if upload/path                         |
| Deserialization posture                        | A08 Integrity                              | API8                            | §5.3; §1                                        |
| SSRF foundation                                | A10 SSRF                                   | API7 SSRF                       | §18 SSRF rows                                   |
| Cookie / CSRF policy                           | A07; A01                                   | API2 Authn                      | §2.5; §7.2–7.4                                  |
| Technology / version disclosure                | A05                                        | API8; API9 Inventory            | §5.10–5.14                                      |
| Platform anti-enumeration                      | A01                                        | API1; API9                      | §6.5; §4                                        |

---

## Controls explicitly not claimed

| Control                         | Owner           |
| ------------------------------- | --------------- |
| Refresh replay / session revoke | V3-S01          |
| Role matrix / People IDOR       | V3-S02          |
| Vault ciphertext / wrapping key | V3-S03          |
| Append-only audit product       | V3-S05          |
| Isolation suite                 | V3-S06          |
| Live place/cancel replay window | V3-L05          |
| Vendor webhook sending          | Wave 5 / Wave 9 |
| Prompt injection                | AI later        |
| Monitoring security dashboard   | Wave 3          |

---

## Failure philosophy

```text
Misconfigured production security defaults
        ↓
Fail closed (refuse insecure mode)
        ↓
Do not silently run “open for convenience”

Hardening fault on one route
        ↓
Deny that route
        ↓
Do not disable authentication, paper trading, or research globally
        ↓
Do not skip Gate / Risk / Ledger
```

---

## Close gate (security)

```text
any REQUIRES ACTION in:
  Security Checklist
  OR STRIDE
  OR Timing / Abuse
  OR Verification Standard (§4–§18)
  OR Regression Suite (§19)
        →  cannot Close

all PASS or NOT APPLICABLE with correct owners
        →  Security Review gate may PASS
```

---

**STOP.** Planning only. Product Owner must Approve the Implementation Package before production code. Re-run this review with evidence at Close.
