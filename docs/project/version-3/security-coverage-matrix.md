# Security Coverage Matrix

**Document:** Version 3 Security Coverage Matrix
**Date:** 2026-08-17
**Status:** V3-S06 CLOSED; independent Wave 1 Certification Audit not started
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md) and [`v3-security-vision.md`](./v3-security-vision.md)
**Companions:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) · [`security-foundation-certification-audit.md`](./security-foundation-certification-audit.md) · [`security-audit-product-certification-audit.md`](./security-audit-product-certification-audit.md) · [`wave-1-security-progress.md`](./wave-1-security-progress.md)

---

## How to read

| Symbol | Meaning                                          |
| ------ | ------------------------------------------------ |
| ✅     | Covered with Close or accepted platform evidence |
| 🔲     | Planned, not Closed                              |
| —      | Not that package's primary owner                 |
| ⏳     | Later named package / wave                       |
| ◐      | Partial / complementary                          |

---

## Package status (Wave 1)

| Package | Name                          | Status                                         |
| ------- | ----------------------------- | ---------------------------------------------- |
| V3-S01  | Authentication & Session      | **CLOSED**                                     |
| V3-S02  | RBAC Product                  | **CLOSED**                                     |
| V3-S03  | Secret Vault & Encryption     | **Platform Complete** (Customer Complete open) |
| V3-S04  | OWASP & API Hardening         | **CLOSED**                                     |
| V3-S05  | Audit Trail Foundation        | **CLOSED**                                     |
| V3-S06  | Workspace Isolation Hardening | **CLOSED**                                     |

---

## V3-S04 slice progress

| Slice | Status     | Coverage added                                                                  |
| ----- | ---------- | ------------------------------------------------------------------------------- |
| S04-a | **CLOSED** | Platform bootstrap, config, errors, HPP foundation                              |
| S04-b | **CLOSED** | Body/timeout, Host/CRLF, cache/disclosure, open redirect                        |
| S04-c | **CLOSED** | CSP, frame denial, browser protections                                          |
| S04-d | **CLOSED** | Platform + sensitive abuse quotas                                               |
| S04-e | **CLOSED** | SSRF foundation, CSRF consistency, anti-enumeration live, Verification Standard |

---

## V3-S05 slice progress

| Slice | Status     | Coverage added                                                    |
| ----- | ---------- | ----------------------------------------------------------------- |
| S05-a | **CLOSED** | Append-only classified store, emitter adapters, secret ban        |
| S05-b | **CLOSED** | Workspace-scoped timeline read model + Admin HTTP                 |
| S05-c | **CLOSED** | Per-record integrity metadata + DB append-only enforcement        |
| S05-d | **CLOSED** | Incidents, evidence links, investigation enrichment               |
| S05-e | **CLOSED** | Retention eligibility, internal export foundation, Close evidence |

---

## Threat → package matrix (post S05-e)

| Threat                                     | S01 | S02 | S03 | S04  | S05  | Later      | Covered                            |
| ------------------------------------------ | --- | --- | --- | ---- | ---- | ---------- | ---------------------------------- |
| Brute force / password spray               | ✅  | —   | —   | ✅ ◐ | ✅ ◐ | —          | ✅                                 |
| Credential stuffing                        | ✅  | —   | —   | ✅ ◐ | ✅ ◐ | —          | ✅                                 |
| Session fixation / hijack / refresh replay | ✅  | —   | —   | —    | ✅ ◐ | —          | ✅                                 |
| CSRF (cookie mutations)                    | ✅  | —   | ◐   | ✅   | —    | —          | ✅                                 |
| Password policy / recovery abuse           | ✅  | —   | —   | —    | ✅ ◐ | —          | ✅                                 |
| Broken function / role escalation          | —   | ✅  | —   | —    | ✅ ◐ | —          | ✅                                 |
| IDOR (object authorization)                | —   | ✅  | ✅  | ◐    | —    | S06 ⏳     | ✅ (S02/S03)                       |
| Mass assignment                            | —   | ◐   | ◐   | ✅   | —    | —          | ✅ (platform foundation)           |
| Credential / vault leakage                 | —   | —   | ✅  | —    | ✅ ◐ | —          | ✅                                 |
| Cross-workspace secret read                | —   | ◐   | ✅  | —    | —    | S06 ⏳     | ◐                                  |
| SQL Injection                              | —   | —   | —   | ✅   | —    | —          | ✅ (Prisma + policy)               |
| Header / CRLF Injection                    | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| XSS / clickjacking (platform)              | ◐   | —   | —   | ✅   | —    | —          | ✅                                 |
| Open Redirect                              | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| Host Header attacks                        | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| HTTP Parameter Pollution                   | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| SSRF                                       | —   | —   | —   | ✅ ◐ | —    | product ⏳ | ✅ (foundation)                    |
| Rate limiting / exhaustion                 | ◐   | ◐   | ◐   | ✅   | ✅ ◐ | host ⏳    | ✅                                 |
| Anti-enumeration (platform)                | ◐   | ◐   | ◐   | ✅   | ✅ ◐ | —          | ✅                                 |
| Security misconfiguration                  | ◐   | —   | —   | ✅   | —    | —          | ✅                                 |
| Technology / stack disclosure              | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| Secure cookies                             | ✅  | —   | —   | ✅   | —    | —          | ✅                                 |
| CSP                                        | —   | —   | —   | ✅   | —    | —          | ✅                                 |
| HSTS                                       | —   | —   | —   | ✅ ◐ | —    | host ◐     | ✅ (API production)                |
| Security event logging (emit)              | ◐   | ✅  | ✅  | ✅   | ✅   | —          | ✅ (foundation)                    |
| Searchable audit product                   | —   | —   | —   | —    | ◐    | later ⏳   | ◐ (timeline only)                  |
| Audit export / retention product           | —   | —   | —   | —    | ◐    | Wave 10 ⏳ | ◐ (foundation)                     |
| Workspace isolation suite                  | —   | ◐   | ◐   | —    | —    | S06 CLOSED | ⏳ Independent Certification Audit |
| Financial Gate/Risk bypass                 | —   | ✅  | ✅  | —    | —    | Wave 6 ⏳  | ✅ fail-closed                     |
| Live order replay                          | —   | —   | —   | —    | —    | L05 ⏳     | ⏳                                 |
| MFA / prompt injection                     | —   | —   | —   | —    | —    | later ⏳   | ⏳                                 |

---

## OWASP snapshots (post S05-e)

| OWASP class                              | Status                                             |
| ---------------------------------------- | -------------------------------------------------- |
| Broken access control                    | ◐ → strengthened (S04 enum + S06 later)            |
| Cryptographic failures                   | ✅ S01/S03                                         |
| Injection                                | ✅ S04 platform                                    |
| Security misconfiguration                | ✅ S04                                             |
| Identification / authentication failures | ✅ S01 + S04 complement                            |
| SSRF                                     | ✅ foundation S04                                  |
| Logging failures (product)               | ◐ S05 foundation (search/UI/export download later) |

---

## Wave 1 exit (honest)

```text
S01 ✅ + S02 ✅ + S03 Platform ✅ + S04 ✅ + S05 ✅ + S06 Close
        ↓
Wave 1 Security Foundation exit
```

Today: S01–S05 **CLOSED**. S06 evidence is aligned for Product Owner Close
review; Wave 1 Exit remains unclaimed. See
[`v3-s06-f-alignment-report.md`](./v3-s06-f-alignment-report.md) and
[`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md).

---

**STOP.** Pending Product Owner review of V3-S06 Close evidence. Wave 1 Exit is
not claimed.
