# V3-S04 OWASP & API Hardening — Implementation Package

```text
Package:            V3-S04
Name:               OWASP & API Hardening
Also known as:      Security Platform Hardening
Wave:               1 — Security Foundation
Capabilities:       SEC-08
Date:               2026-08-17
Status:             Implementation Package
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)
**Governance:** [`version-3-governance-freeze.md`](./version-3-governance-freeze.md)
**Annexes used (read-only):** Execution Roadmap, Security Vision, Capability Inventory, Product Roadmap, Wave 1 Progress Report.
**Mandatory:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) — this is the first Wave 1 package that must execute the standard at Close (S01–S03 grandfathered for rewrite; S04 starts after approval of the standard).

**Companions:**

| Document                                                           | Role                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| [`v3-s04-product-scope.md`](./v3-s04-product-scope.md)             | IN / OUT, customer meaning, ownership, acceptance      |
| [`v3-s04-security-review.md`](./v3-s04-security-review.md)         | Threat model, OWASP maps, Verification Standard intent |
| [`v3-s04-validation-plan.md`](./v3-s04-validation-plan.md)         | How Close is proven                                    |
| [`security-platform-overview.md`](./security-platform-overview.md) | Operator-language product                              |
| [`security-coverage-matrix.md`](./security-coverage-matrix.md)     | Wave 1 threat → package coverage (not an audit)        |

**Prerequisites:**

| Prerequisite                     | Status                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| Version 2                        | **CERTIFIED**                                              |
| V3-S01 Authentication & Session  | **CLOSED**                                                 |
| V3-S02 RBAC Product              | **CLOSED**                                                 |
| V3-S03 Secret Vault & Encryption | **Platform Complete** (Customer Complete open under Vault) |
| Master Plan                      | **FROZEN**                                                 |
| Security Verification Standard   | **Approved** (mandatory for this package)                  |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES.** Scope, owners, and exit criteria are already in the frozen Master Plan (SEC-08 / V3-S04). This package only sequences work inside that freeze. Version 2 remains certified. The Master Plan is not modified. No new bounded context is invented.

```text
S04 hardens the entire platform.
It does NOT replace Authentication, Authorization, or Vault.
It does NOT connect vendors.
It does NOT ship Connection Management, Audit product, or Isolation suite.
It makes security systemic — not feature-by-feature.
```

**STOP.** Do not write production code until this package is **Approved** by the Product Owner.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← S04-a … S04-e only
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
Close                    → then V3-S05 Implementation Package
```

Do not skip a stage. Do not start V3-S05 until this package is **Closed**. The next package opens at **Implementation Package**, not at code. Do not start Wave 2 Connection Management from this package. Wave 1 exit still requires S05 and S06 after S04 Close.

---

## Overview

V3-S04 is the Wave 1 Security Foundation package that makes **platform-wide** protections production-default. Authentication (S01), authorization (S02), and Vault Platform Complete (S03) are secure as owned surfaces. This package closes the gap between “each feature is careful” and “the platform resists common web attacks and accidental regressions by default.”

| Field                                | Value                                       |
| ------------------------------------ | ------------------------------------------- |
| Package ID                           | V3-S04                                      |
| Master Plan / Execution Roadmap name | OWASP & API Hardening                       |
| Wave                                 | 1 — Security Foundation                     |
| Capabilities (inventory IDs)         | SEC-08 OWASP / API Security                 |
| Complexity                           | L                                           |
| Previous package                     | V3-S03 Secret Vault (**Platform Complete**) |
| Next package                         | V3-S05 Audit Trail Foundation               |

---

## Business Goal

- **Goal:** Make financial-asset protection a **product** at the HTTP and platform edge — secure headers, rate limits, validation, encoding, anti-enumeration, and secure defaults — so later integrations inherit a hardened baseline instead of inventing controls per feature.
- **Master Plan reference:** §1 business goal 1 (Security Platform); §4 Wave 1 exit “Global rate limit, CSP, helmet, validation, and injection posture are production-default on”; §7 OWASP row; Execution Roadmap V3-S04 / SEC-08; Security Vision §4 API Security & OWASP; Capability Inventory SEC-08.
- **Metric this package must meet or not regress (Master Plan §6):** default misconfig **0 tolerated**; credential exposure **0**; cross-workspace leak **0**. S04 must not regress S01–S03 journeys. Time-to-connect-Binance remains Wave 4.

---

## Customer Problem

- **Problem:** Auth, RBAC, and Vault are secure individually. The platform still lacks a single, production-default hardening layer for flood, headers, disclosure, enumeration, and common web/API attack classes that every future surface will hit.
- **Who feels it:** Workspace administrators and operators (opaque errors that leak stack traces; inconsistent denial); the business (cannot claim Wave 1 production-default security); auditors (no clear platform owner for SEC-08).
- **What they must do today that they should not:** Rely on env-gated CSP, keep partial rate limits, accept feature-local security reviews as “platform done,” or wait until Connection Management invents SSRF/header policy under pressure.

---

## Business Value

- **Value delivered at Close:** The product’s HTTP edge and shared API posture are production-default secure. Operators experience clear, non-leaking errors and consistent denial without resource enumeration. Future packages inherit SEC-08 instead of re-arguing headers and limits.
- **What remains blocked until later packages:** Searchable audit product (S05); isolation **suite** product (S06); Connection Management (Wave 2 — also waits for full Wave 1 exit); webhook SSRF **product use** (Wave 5 / Wave 9 — S04 owns allowlist policy foundation); live financial replay/nonces (V3-L05); monitoring dashboards (Wave 3).

---

## Current State

Honest Version 2 / S01 / S02 / S03 facts. Do not redesign Version 2.

| Capability or surface                                             | Status                              | Evidence                                                                                   |
| ----------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| **Authentication / sessions / CSRF on auth mutations**            | Already exists (CLOSED)             | V3-S01                                                                                     |
| **RBAC / People / default deny**                                  | Already exists (CLOSED)             | V3-S02                                                                                     |
| **Vault domain encryption / ownership**                           | Platform Complete                   | V3-S03                                                                                     |
| **helmet**                                                        | Needs extension                     | Registered in Version 2; CSP often env-gated                                               |
| **Global rate-limit / Throttler**                                 | Needs extension                     | Baseline exists; auth-route and platform tightening deferred to S04 across S01–S03 reviews |
| **ValidationPipe**                                                | Needs extension                     | Global pipe exists; unknown-field / financial API posture incomplete                       |
| **Production CSP by default**                                     | Missing as product                  | Security Vision: CSP on by default in production                                           |
| **HSTS / secure header suite as product**                         | Missing / partial                   | Named to S04 in Verification Standard                                                      |
| **Platform anti-enumeration policy**                              | Partial                             | Feature-local (auth/RBAC); not platform-wide                                               |
| **SSRF allowlist foundation**                                     | Missing                             | No customer webhooks yet; policy must exist before Wave 5/9                                |
| **Technology / version disclosure policy**                        | Missing as product                  | Deferred repeatedly to S04                                                                 |
| **Financial replay / nonce window**                               | Out of this package (partial claim) | Completes V3-L05 / Wave 6                                                                  |
| **Audit product / Isolation suite**                               | Out of this package                 | S05 / S06                                                                                  |
| **Connection Management / exchanges / Telegram / SMTP consumers** | Out of this package                 | Wave 2+                                                                                    |

Facts implementers must not forget:

- Do not turn S04 into a rewrite of Identity, RBAC, or Vault.
- Do not invent a new “Security Platform” bounded context — Master Plan §11 owns Security Platform under Identity/Auth + Vault module.
- Do not enable live UI, collect exchange keys, or wire Vault consumers.
- Do not claim Wave 1 exit at S04 Close (S05 and S06 remain).
- CSRF for cookie sessions already started in S01; S04 owns **platform-wide** CSRF/cookie/header policy consistency, not a second auth stack.
- Financial replay is **not** fully owned here (SEC-08 notes Wave 6 completion).

---

## Reuse from Version 2

| Stance          | This package                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Prisma parameterized access; React default encoding; certified paper/order path; Spec v2.0 / Authority Matrix / Alias Dictionary                                                                     |
| Minor extension | Existing helmet registration; existing Fastify rate-limit + Throttler; existing ValidationPipe                                                                                                       |
| Major extension | Production-default CSP/HSTS/header suite; auth and expensive-route rate posture; request size / normalization; disclosure and error policy; SSRF allowlist **foundation**; platform anti-enumeration |
| New justified   | **Nothing** — no new bounded context                                                                                                                                                                 |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library                                                                                                                              |

Owner from Master Plan §11:

| Area                           | Owner                                   | This package must not own                                        |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| Security Platform / OWASP edge | Identity/Auth (platform HTTP) extension | Orders, Ledger, Vault product UI, Audit product, Isolation suite |
| Vault                          | Vault (S03)                             | Platform headers as Vault’s job                                  |
| Audit product                  | V3-S05                                  | Searchable security history                                      |
| Isolation suite                | V3-S06                                  | Cross-workspace proof product                                    |

---

## Dependencies

| Dependency                                                              | Kind                | Status required before this package                                              |
| ----------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| Version 2 Identity / HTTP baseline (helmet, rate-limit, ValidationPipe) | Version 2 product   | Exists (certified)                                                               |
| V3-S01                                                                  | Earlier V3 package  | Closed                                                                           |
| V3-S02                                                                  | Earlier V3 package  | Closed                                                                           |
| V3-S03                                                                  | Earlier V3 package  | Platform Complete (consumers may use Vault later; S04 does not require Vault UI) |
| Host TLS / edge HTTPS                                                   | Host infrastructure | Host-operated                                                                    |

This package does **not** depend on:

- Connection Management (`V3-C01`…`C04`)
- Exchange I/O, Telegram, SMTP send, OpenRouter consumers
- V3-S05 Audit product, V3-S06 Isolation suite
- Wave 3 monitoring dashboards
- Wave 6 live / V3-L05 financial replay completion
- Billing, Vault Customer Complete UI (may remain open under Vault)

---

## Implementation Scope

### IN Scope

| Item                                                                                            | Customer meaning                                                                       | Notes / owner inside existing domain                           |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Global security middleware posture                                                              | Dangerous requests fail the same way everywhere                                        | Identity/Auth / API host extension                             |
| Security headers (CSP, frame denial, nosniff, Referrer-Policy, Permissions-Policy, HSTS stance) | Browser abuse paths are closed by default                                              | Platform HTTP                                                  |
| HTTP hardening                                                                                  | Methods, caching of sensitive responses, Host-header abuse resistance                  | Platform HTTP                                                  |
| Input validation strategy                                                                       | Bad bodies/queries fail closed with clear, non-leaking errors                          | ValidationPipe extension + policy                              |
| Output encoding / safe JSON                                                                     | Responses do not emit HTML or secrets as convenience                                   | API + web defaults kept                                        |
| Rate limiting (platform + auth-route tightening)                                                | Flood and spray are limited                                                            | Extend existing limiters                                       |
| Request size limits                                                                             | Huge bodies cannot exhaust the process                                                 | Platform HTTP                                                  |
| Request normalization                                                                           | Duplicate/conflicting parameters do not bypass checks                                  | API policy                                                     |
| Security logging (platform events, non-secret)                                                  | Abuse attempts are attributable without leaking secrets                                | Events for S05 to productize later                             |
| Error handling policy                                                                           | No stack traces, framework banners, or technology fingerprints to customers            | Platform HTTP                                                  |
| Security configuration / secure defaults                                                        | Production refuses insecure header/CSP/cookie misconfig                                | Fail closed in prod                                            |
| OWASP / API Top 10 coverage for platform surfaces                                               | Mapped and owned                                                                       | See security review                                            |
| Platform-wide anti-enumeration                                                                  | Unauthorized and missing resources do not teach the attacker what exists               | Consistent deny/error shape                                    |
| Technology / version disclosure policy                                                          | No helpful version banners                                                             | Platform HTTP                                                  |
| SSRF allowlist **foundation**                                                                   | Policy and helpers ready before webhooks exist                                         | Used later by Wave 5/9; no webhook product in S04              |
| Cookie policy consistency (platform)                                                            | Cookie sessions remain Secure / HttpOnly / SameSite; CSRF required on cookie mutations | Complements S01                                                |
| Mass assignment / unexpected fields policy                                                      | Privileged fields cannot be smuggled on sensitive APIs                                 | API validation                                                 |
| Directory / path traversal defenses on owned surfaces                                           | Paths cannot escape intended roots                                                     | Where file/path surfaces exist; else N/A                       |
| Security Coverage Matrix maintained for Wave 1                                                  | PO/auditor map of threat → package                                                     | [`security-coverage-matrix.md`](./security-coverage-matrix.md) |

### OUT OF Scope

| Item                                                 | Why out                                              | Owner later (or Master Plan deferral)    |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Connection Management                                | Wave 2                                               | `V3-C01`…`C04`                           |
| Exchange integrations / venue I/O                    | Waves 2/4                                            | Exchange Adapter packages                |
| Telegram / SMTP / Slack / Discord delivery           | Wave 5                                               | Notification packages                    |
| OpenRouter / AI consumers                            | Wave 2/7                                             | AI Gateway                               |
| Vault UI / Customer Complete                         | Still Vault-owned                                    | V3-S03 Customer Complete                 |
| Billing                                              | Wave 9                                               | Billing domain                           |
| Live Trading / live UI                               | Wave 6 + ADR                                         | Live packages                            |
| Monitoring dashboards                                | Wave 3                                               | `V3-O05`                                 |
| Searchable audit product                             | Later Wave 1                                         | **V3-S05**                               |
| Isolation test suite product                         | Later Wave 1                                         | **V3-S06**                               |
| Financial replay / nonce window on live place/cancel | Completes with live                                  | **V3-L05**                               |
| MFA / extra sign-in factors                          | Later                                                | Pre-live / Wave 6 prerequisites          |
| Customer webhook product                             | Wave 9                                               | DV-02 (uses S04 SSRF foundation)         |
| Dependency CVE continuous product                    | Named in OWASP class; process not a new product page | Host / CI policy; not a customer feature |
| Prompt injection product controls                    | AI not in this package                               | Wave 7 / AI packages                     |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan / Security Vision / SEC-08, **stop**.

---

## Product Acceptance Criteria

Customer-visible outcomes a non-engineer can perform. Fail conditions required.

| #   | Outcome                                                                                                                              | Fail if                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 1   | An invalid request shows a clear error and does not reveal stack traces, framework names, or internal paths                          | Error page or JSON includes stack, Prisma internals, or server version banners                                   |
| 2   | An unauthorized request is denied without teaching whether a foreign resource exists                                                 | Responses distinguish “exists but forbidden” vs “missing” in a way that enables enumeration on owned surfaces    |
| 3   | Flooding a sensitive action (e.g. login or other owned expensive route) is limited; the operator sees an honest throttle/unavailable | Unlimited spray succeeds; or throttle message exposes internal quotas as attack guidance beyond what is required |
| 4   | Framing the product UI for clickjacking is denied (or documented host owner with evidence)                                           | Sensitive UI can be iframed by an arbitrary origin                                                               |
| 5   | Production runs with secure header defaults (CSP stance, nosniff, etc.) without a special “turn security on” step for the customer   | Production can boot with CSP/headers off as a convenience                                                        |
| 6   | S01–S03 customer journeys still work (sign-in, People, Vault platform path as applicable)                                            | Hardening breaks certified/closed journeys                                                                       |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys. Host TLS may remain host-operated.

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

S04 is mostly invisible as a page. The walkthrough is still **customer validation**: what the operator experiences when the platform refuses or succeeds under hardening.

```text
Platform Hardening Walkthrough

□ Sign in successfully (S01 unregressed)
□ Submit an invalid API/UI request → clear error → no internal leak
□ Attempt an unauthorized resource → denied → no useful enumeration
□ Trigger rate limit on a sensitive action → honest limit → recovers
□ Confirm sensitive UI cannot be framed (or host-documented equivalent)
□ Confirm production security defaults are on (no customer toggle required)
□ Confirm People / Vault platform paths still work as previously accepted

PASS / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Walkthrough name        | Platform Hardening Walkthrough |
| Executed in the product | Yes / pending Approval         |
| Overall                 | PENDING PRODUCT OWNER APPROVAL |

---

## Architecture Review

**Fill at package time (intent) and again at Close (evidence).**

Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) at Close.

Summary (planning intent):

| Rule                                                           | Decision                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | **PASS (intent)** — no new context; extend Identity/Auth platform HTTP                              |
| No ownership drift                                             | **PASS (intent)** — does not own Vault, Audit product, Isolation suite, Connections, Orders, Ledger |
| No duplicate Source of Truth                                   | **PASS (intent)** — no money/auth/vault SoT duplication                                             |
| HTTP remains transport; UI remains not Source of Truth         | **PASS (intent)**                                                                                   |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                           |
| Justified persistence/ports inside an existing owner           | Optional security-event emission only; Audit **product** remains S05                                |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track.

---

## Security Review

**Fill at package time (intent) and again at Close (evidence).**

Companions: [`v3-s04-security-review.md`](./v3-s04-security-review.md), [`version-3-security-checklist.md`](./version-3-security-checklist.md), [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md).

Threat Review (STRIDE) — planning intent:

| Category               | Verdict                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Spoofing               | **PASS (intent)** — Host-header / session cookie policy consistency; auth remains S01  |
| Tampering              | **PASS (intent)** — validation, mass assignment, parameter pollution, header injection |
| Repudiation            | **PASS (intent)** — security logging of abuse-class events (product view = S05)        |
| Information Disclosure | **PASS (intent)** — error policy, anti-enumeration, technology disclosure              |
| Denial of Service      | **PASS (intent)** — rate limit, size limits, resource bounds                           |
| Elevation of Privilege | **PASS (intent)** — does not grant roles; default deny preserved; no Gate/Risk skip    |

Threats this package must reduce:

| Threat (from Security Vision)  | Control in this package                                    |
| ------------------------------ | ---------------------------------------------------------- |
| XSS                            | CSP + encoding + cookie flags consistency                  |
| CSRF                           | Platform cookie/CSRF policy                                |
| Injection                      | Keep Prisma; forbid string-built SQL; header/CRLF defenses |
| SSRF                           | Allowlist foundation before webhooks                       |
| Account takeover (spray/flood) | Auth-route and platform rate tightening                    |
| Request tampering              | Validation, unexpected fields, normalization               |
| Information disclosure         | Errors, headers, version banners                           |

Controls explicitly **not** this package:

| Control                          | Owner                                 |
| -------------------------------- | ------------------------------------- |
| Session revoke / refresh replay  | V3-S01                                |
| Role assignment / IDOR on People | V3-S02                                |
| Vault encryption / plaintext ban | V3-S03                                |
| Searchable audit                 | V3-S05                                |
| Isolation suite                  | V3-S06                                |
| Live financial replay            | V3-L05                                |
| Vendor webhook SSRF **product**  | Wave 5 / Wave 9 (uses S04 foundation) |

### Security Verification Standard

**Mandatory for this package.** Every category and every row must be completed at Close. Planning intent rows live in [`v3-s04-security-review.md`](./v3-s04-security-review.md). Security Regression Suite is mandatory for every found-and-fixed defect owned by S04.

---

## Implementation Slices

Independently reviewable. Do not implement in this planning task.

### S04-a — Secure defaults & security headers

**Goal:** Production-default header suite (CSP stance, clickjacking denial, nosniff, Referrer-Policy, Permissions-Policy, HSTS stance) and fail-closed production misconfig.

**Touch (expected):** API host / web security middleware configuration; production boot checks.

**Done when:** Production defaults are on; insecure production header/CSP posture fails closed; regression tests exist for header presence.

**Must not:** Redesign auth; enable live; invent a Security bounded context; turn off research paper journeys.

### S04-b — HTTP hardening, size limits, normalization, disclosure policy

**Goal:** Request size limits, Host-header / open-redirect / header-injection defenses, error and technology-disclosure policy, sensitive-response cache policy.

**Touch (expected):** Platform HTTP middleware and error filters.

**Done when:** Oversized bodies fail closed; errors never return stacks/framework banners; Host/open-redirect abuse fails closed on owned surfaces.

**Must not:** Build monitoring dashboards; change Ledger/order path.

### S04-c — Validation, encoding, mass assignment, parameter pollution

**Goal:** Platform input validation strategy; reject unexpected fields on sensitive APIs; parameter pollution does not bypass checks; output stays safe JSON/text.

**Touch (expected):** ValidationPipe / DTO policy; shared validation helpers.

**Done when:** Malformed JSON and unexpected privileged fields fail closed; pollution cases covered by tests.

**Must not:** Rewrite every Version 2 DTO without need; invent financial replay.

### S04-d — Rate limiting & anti-enumeration

**Goal:** Tighten auth and expensive routes; platform anti-enumeration consistency for unauthorized/missing resources.

**Touch (expected):** Existing rate-limit / Throttler configuration; shared deny/error shaping where platform-owned.

**Done when:** Auth-route tightening is real; enumeration oracles on owned platform surfaces are impractical; S01 lockout still works.

**Must not:** Replace S01 lockout; claim distributed edge DDoS product; build S05 audit UI.

### S04-e — SSRF foundation, cookie/CSRF platform consistency, Verification Standard Close pack

**Goal:** SSRF allowlist foundation (no webhook product); cookie/CSRF platform consistency with S01; complete Security Verification Standard + Regression Suite + Coverage Matrix update for Close.

**Touch (expected):** Shared SSRF allowlist module/policy; CSRF/cookie policy review; docs evidence at Close.

**Done when:** Allowlist helpers exist and block link-local/metadata patterns; cookie mutations remain CSRF-protected; Verification Standard has zero REQUIRES ACTION; Coverage Matrix updated.

**Must not:** Ship Slack/Discord/Teams webhooks; start S05 implementation; open Wave 2.

---

## Validation Plan

Companion: [`v3-s04-validation-plan.md`](./v3-s04-validation-plan.md).

| Gate                                              | Required                                       | Evidence                                                   |
| ------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Unit tests                                        | Yes                                            | Slice specs for headers, validation, limits, SSRF helpers  |
| Integration tests                                 | Yes                                            | HTTP hardening, rate limit, error policy, CSRF consistency |
| UI tests                                          | Yes where framing/error UX is customer-visible | Clickjacking / error non-leak smoke                        |
| Manual product walkthrough                        | Yes                                            | Platform Hardening Walkthrough                             |
| Security verification (checklist)                 | Yes                                            | Close Security Review                                      |
| Security Verification Standard + Regression Suite | **Yes**                                        | First mandatory full execution for a new package           |
| Architecture verification                         | Yes                                            | Checklist                                                  |
| Product verification                              | Yes                                            | Checklist                                                  |
| Customer acceptance of Master Plan outcomes       | Yes                                            | Wave 1 OWASP defaults line                                 |

---

## Required Reports

| Report                   | When                        | Path convention                                                          |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| Implementation Package   | Before Approval             | `v3-s04-implementation-package.md` (this file)                           |
| Implementation Report    | After Implementation        | `v3-s04-implementation-report.md`                                        |
| Architecture Review      | After Implementation Report | `v3-s04-architecture-review.md`                                          |
| Security Review          | After Architecture Review   | Update `v3-s04-security-review.md` with evidence + Verification Standard |
| Product Review           | After Security Review       | `v3-s04-product-review.md` with walkthrough                              |
| Validation evidence      | After Product Review        | `v3-s04-validation-plan.md` results                                      |
| Package Close record     | At Close                    | Close Checklist + Package Summary                                        |
| Security Coverage Matrix | At Close (update)           | `security-coverage-matrix.md`                                            |

**Forbidden:** Version 2-style RC documents; ADRs; Master Plan edits; Version 2 certification edits.

---

## Package Close Checklist

| #   | Gate                                                                                             | Verdict                         |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1   | Implementation Review                                                                            | NOT DONE                        |
| 2   | Architecture Review                                                                              | NOT DONE                        |
| 3   | Security Review (checklist + STRIDE + Timing + Abuse + Verification Standard + Regression Suite) | NOT DONE                        |
| 4   | Product Review (walkthrough PASS)                                                                | NOT DONE                        |
| 5   | Validation                                                                                       | NOT DONE                        |
| 6   | All mandatory reports                                                                            | NOT DONE                        |
| 7   | Master Plan compliance                                                                           | PENDING (planning: PASS intent) |
| 8   | Product Principles compliance                                                                    | PENDING (planning: PASS intent) |
| 9   | Customer walkthrough                                                                             | NOT DONE                        |

---

## Customer-visible Changes

**Fill at Close.**

Planning expectation:

- Clearer, safer errors; consistent denial; less fingerprinting; production security defaults without a customer toggle.

What the UI / copy must **not** claim:

- Wave 1 complete; Connections available; live trading; audit dashboard; isolation suite done; “unhackable.”

---

## Next Package Dependencies

| Field                             | Value                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| This package unblocks             | **V3-S05** Audit Trail Foundation (after Close). Also contributes to Wave 1 exit with S05+S06. |
| This package does **not** unblock | Connection Management (needs full Wave 1 exit); live trading; billing                          |
| Remaining wave work               | S05 → S06                                                                                      |

---

## Lessons Learned

**Fill at Close.**

---

## Package Summary Standard (planning answers — mandatory questions)

Cursor answers these at planning so Product Owner can review. Repeat with Close evidence later.

1. **What does the customer receive?**
   A platform that fails closed on common web/API attacks by default: secure headers, rate limits, safe errors, anti-enumeration, validation/encoding policy, and production secure defaults — without a new customer “security settings” product page.

2. **What does the customer NOT receive?**
   Connections, exchanges, Telegram/SMTP, Vault UI completion, audit history product, isolation suite, billing, live trading, monitoring dashboards, webhook product, or financial replay for live orders.

3. **What business problem does S04 solve?**
   Feature-local security is not enough. Before real customer integrations, the platform must resist common attacks and accidental regressions **systemically**.

4. **Which future packages depend on S04?**
   V3-S05 / S06 (Wave 1 completion); Wave 2 Connection Management (Wave 1 exit); Wave 5/9 webhook consumers (SSRF foundation); all later HTTP surfaces that inherit SEC-08 defaults. V3-L05 still owns live financial replay completion.

5. **Which OWASP categories become covered?**
   Primary platform coverage for Injection, Security Misconfiguration, SSRF (foundation), Logging failures (platform events), Identification/Authn failures (flood/throttle complement to S01), Broken Access Control **platform consistency** (enumeration), and API Top 10 classes for unrestricted resource consumption, security misconfiguration, and SSRF. Full map: [`v3-s04-security-review.md`](./v3-s04-security-review.md) and [`security-coverage-matrix.md`](./security-coverage-matrix.md).

6. **Does S04 introduce a new bounded context?**
   **No.** Master Plan already places Security Platform under Identity/Auth + Vault. S04 extends platform HTTP hardening only.

7. **Was the Master Plan respected?**
   **Yes (planning).** Package ID, wave, SEC-08, and exit line match. No Master Plan edits. No Version 2 edits. OUT OF Scope matches deferred owners.

8. **Were Product Principles respected?**
   **Yes (planning).** Security Before Convenience (fail closed defaults); Customer First (no SSH for the hardening outcome); Honest Product (no Wave 1-complete claim); Architecture Is a Constraint (no new context); Everything Is Auditable (events prepared, product in S05); Paper First / Live Must Be Earned (unchanged).

---

## Future guidance (binding)

1. No production code before Approval.
2. Do not modify Version 2 certification, Spec v2.0, Authority Matrix, or Alias Dictionary.
3. Do not create RC/ADR documents from this package.
4. Do not start Connection Management until Wave 1 exits (S04–S06 Closed as required).
5. Conflicts: **Master Plan wins.**

---

**STOP.** Wait for Product Owner review before approving V3-S04 implementation. After Approval, implement slices S04-a … S04-e only. After Close, open V3-S05 at Implementation Package — not at code.
