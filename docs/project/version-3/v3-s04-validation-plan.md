# V3-S04 Validation Plan

**Package:** V3-S04 OWASP & API Hardening
**Wave:** 1 — Security Foundation
**Status:** Planning — awaiting Product Owner Approval. Not executed.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Scope:** [`v3-s04-product-scope.md`](./v3-s04-product-scope.md)
**Security:** [`v3-s04-security-review.md`](./v3-s04-security-review.md)
**Umbrella:** [`v3-s04-implementation-package.md`](./v3-s04-implementation-package.md)
**Overview:** [`security-platform-overview.md`](./security-platform-overview.md)
**Coverage:** [`security-coverage-matrix.md`](./security-coverage-matrix.md)
**Checklists:** [`version-3-product-checklist.md`](./version-3-product-checklist.md) · [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) · [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a header flag in a unit stub without proving production responses include it, or claim rate limiting without an HTTP flood case) do **not** count as Close evidence.

Do not validate Binance I/O, Telegram send, SMTP send, AI chat, Vault Customer Complete UI, Audit product UI, or Isolation suite. Validate **platform hardening**.

---

## 0. What Close means for S04

| Gate            | Meaning                                                  | Unlocks                                |
| --------------- | -------------------------------------------------------- | -------------------------------------- |
| **S04 Closed**  | SEC-08 platform defaults are production-on and validated | V3-S05 Implementation Package may open |
| **Not claimed** | Wave 1 exit                                              | Still needs S05 + S06                  |
| **Not claimed** | Connection Management                                    | Wave 2 after Wave 1 exit               |
| **Not claimed** | Vault Customer Complete                                  | Remains Vault-owned under S03          |

There is no dual Platform/Customer Complete split for S04. Hardening is platform product; the operator walkthrough is still mandatory even though there is no new “Security” page.

---

## 1. Unit tests

| Area                    | Must prove                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Header policy           | CSP stance / frame denial / nosniff / related policies resolve to secure production defaults |
| Fail closed config      | Insecure production header/CSP posture is refused                                            |
| Validation helpers      | Unexpected privileged fields rejected; malformed structures fail closed                      |
| Parameter pollution     | Duplicate/conflicting params do not bypass the owned check                                   |
| Size limits             | Oversized body rejected before expensive work                                                |
| SSRF foundation         | Link-local, metadata IP patterns, and non-allowlisted schemes/hosts rejected                 |
| Open redirect helper    | Absolute external evil targets rejected; relative/allowlisted accepted                       |
| Header/CRLF             | CR/LF in header values rejected                                                              |
| Error shaping           | Internal exception details are not mapped into customer messages                             |
| Anti-enumeration helper | Owned deny path does not encode “exists vs missing” when policy forbids it                   |

---

## 2. Integration tests

| Case                          | Must prove                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Production-like headers       | Sensitive responses include required security headers (or documented host-owned HSTS with evidence) |
| Clickjacking                  | Framing denied for sensitive UI/API document responses as designed                                  |
| Invalid body                  | 4xx clear error; no stack; no Prisma/framework dump                                                 |
| Unauthorized foreign resource | Denied without useful existence oracle on owned surfaces                                            |
| Auth-route rate limit         | Excess login (or equivalent sensitive) attempts are throttled; S01 lockout still coherent           |
| Oversized request             | Rejected                                                                                            |
| CSRF consistency              | Cookie-authenticated mutation without CSRF still denied (S01 unregressed + platform routes)         |
| Host header abuse             | Poisoned Host does not produce open redirect or password-reset link to attacker host on owned flows |
| S01 unregressed               | Register / login / refresh / logout / sessions still work                                           |
| S02 unregressed               | People / role assign still work                                                                     |
| S03 unregressed               | Vault platform domain path still works (no requirement to finish Vault UI)                          |
| No financial bypass           | Hardening does not expose Gate/Risk/Ledger skip                                                     |

---

## 3. UI tests

| Case                              | Must prove                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Error UX                          | Invalid input shows clear operator-facing error; no stack in UI                         |
| Framing                           | Where UI tests can assert, frame denial is present (or HTTP header assertion covers it) |
| No security theater page required | Operator completes journeys without a “turn on CSP” setting                             |

If a UI test cannot assert framing, HTTP header integration evidence may satisfy clickjacking with Product Owner acceptance recorded in Product Review.

---

## 4. Manual Product Walkthrough

```text
Platform Hardening Walkthrough

□ Sign in successfully (S01 unregressed)
□ Submit an invalid request → clear error → no internal leak
□ Attempt an unauthorized resource → denied → no useful enumeration
□ Trigger rate limit on a sensitive action → honest limit → recovers
□ Confirm sensitive UI cannot be framed (or host-documented equivalent with evidence)
□ Confirm production security defaults are on (no customer toggle)
□ Confirm People still works
□ Confirm Vault platform path still works as previously accepted (no Vault UI invention)

PASS / REQUIRES ACTION
```

Rules:

- No SSH, no customer `.env`, no manual SQL for the operator path.
- Automated tests do not replace this walkthrough.
- Secrets must never appear in errors.

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Walkthrough name        | Platform Hardening Walkthrough |
| Executed in the product | Pending implementation         |
| Overall                 | NOT DONE                       |

---

## 5. Security verification

| Gate                                    | Required            | Close rule                                  |
| --------------------------------------- | ------------------- | ------------------------------------------- |
| Security Checklist                      | Yes                 | Zero REQUIRES ACTION                        |
| Threat Review (STRIDE)                  | Yes                 | Zero REQUIRES ACTION                        |
| Timing Assessment                       | Yes                 | Auth flood / size limits considered         |
| Abuse Assessment                        | Yes                 | Automation abuse on owned routes considered |
| Security Verification Standard (§4–§18) | **Yes — mandatory** | Every row PASS or N/A with owner            |
| Security Regression Suite (§19)         | **Yes — mandatory** | Every S04 fix has a regression; suite green |
| OWASP Top 10 + API Top 10 maps          | Yes                 | Match security review evidence              |
| Security Coverage Matrix update         | Yes                 | Reflect S04 Close coverage                  |

---

## 6. Architecture verification

| Rule                       | Must prove                                                                |
| -------------------------- | ------------------------------------------------------------------------- |
| No new bounded context     | S04 extends Identity/Auth platform HTTP only                              |
| No ownership drift         | Vault / Audit product / Isolation suite / Connections untouched as owners |
| No duplicate SoT           | No second auth, vault, ledger, or order path                              |
| HTTP is transport          | UI not Source of Truth                                                    |
| Spec v2.0 / Matrix / Alias | Unchanged                                                                 |

---

## 7. Product verification

| Checkbox                      | Meaning                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| □ Customer First              | Hardening outcomes usable without SSH / customer `.env` / SQL                               |
| □ Honest Product              | No claim of Wave 1 complete, Connections, or live                                           |
| □ Security Before Convenience | Production defaults fail closed                                                             |
| □ Acceptance criteria 1–6     | From product scope — all PASS                                                               |
| □ Overview accurate           | [`security-platform-overview.md`](./security-platform-overview.md) matches shipped behavior |

---

## 8. Customer acceptance (Master Plan outcomes this package owns)

| Master Plan / Roadmap line                                                                  | Evidence                                        |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Global rate limit, CSP, helmet, validation, and injection posture are production-default on | Headers + validation + rate tests + walkthrough |
| Sessions cookies/headers secure-by-default (Wave 1 shared line with S01)                    | Cookie policy consistency + S01 unregressed     |
| No live trading UI enabled                                                                  | Unchanged                                       |
| No `.env` as customer secret path for new secrets                                           | Unchanged (Vault ownership)                     |

---

## 9. Explicit non-validation

Do **not** treat as S04 Close evidence:

- Connection wizard success
- Exchange handshake
- Telegram/SMTP delivery
- OpenRouter chat using vaulted key
- Vault Customer Complete walkthrough (still S03 Gate 2)
- Searchable audit UI (S05)
- Cross-workspace isolation suite product (S06)
- Live order replay/nonce (L05)
- External pentest report alone (valuable later; not a substitute)

---

## 10. Close evidence checklist

| #   | Evidence                                                           | Verdict  |
| --- | ------------------------------------------------------------------ | -------- |
| 1   | Unit tests green                                                   | NOT DONE |
| 2   | Integration tests green                                            | NOT DONE |
| 3   | UI / header evidence for framing                                   | NOT DONE |
| 4   | Manual walkthrough PASS                                            | NOT DONE |
| 5   | Security Checklist + STRIDE + Timing + Abuse                       | NOT DONE |
| 6   | Verification Standard complete                                     | NOT DONE |
| 7   | Regression Suite green                                             | NOT DONE |
| 8   | Architecture checklist                                             | NOT DONE |
| 9   | Product checklist                                                  | NOT DONE |
| 10  | Coverage Matrix updated                                            | NOT DONE |
| 11  | Implementation / Architecture / Security / Product reports present | NOT DONE |

---

**STOP.** Do not execute this plan until the Implementation Package is Approved and slices are implemented. After Close, open V3-S05 at Implementation Package.
