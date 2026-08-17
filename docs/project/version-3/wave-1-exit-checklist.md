# Wave 1 Exit Checklist

**Document:** Wave 1 Exit Checklist
**Audience:** Product Owner
**Date:** 2026-08-17
**Wave:** 1 — Security Foundation
**Status:** V3-S06 is **CLOSED**. Wave 1 Exit is **NOT claimed** pending the
independent Wave 1 Certification Audit and Product Owner acceptance.
**Nature:** Product Owner checklist. Not technical design. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

```text
Purpose: Make Wave 1 COMPLETE a decision with evidence —
         not a feeling that “security seems done.”
```

**Companions:** [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md) · [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md) · [`wave-1-security-progress.md`](./wave-1-security-progress.md)

---

## How to use

1. Every row needs **Requirement**, **Evidence**, and **Status**.
2. ✅ means Product Owner accepts closed evidence for that requirement.
3. ⏳ means evidence is not yet accepted (or not yet produced).
4. Wave 1 COMPLETE requires **every** row ✅, including **Wave 1 Certification Audit**.
5. Do not open Wave 2 Connection Management until this checklist is fully ✅.

---

## Exit checklist

| Requirement                  | Evidence                                                                                                                                                      | Status |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Authentication               | V3-S01 Close                                                                                                                                                  | ✅     |
| Authorization                | V3-S02 Close                                                                                                                                                  | ✅     |
| Vault Platform               | V3-S03 Platform Complete Close                                                                                                                                | ✅     |
| Security Platform            | V3-S04 Close                                                                                                                                                  | ✅     |
| Security Audit               | V3-S05 Close                                                                                                                                                  | ✅     |
| Workspace Isolation          | [`v3-s06-close-report.md`](./v3-s06-close-report.md)                                                                                                          | ✅     |
| Cross-workspace verification | `wave-1-isolation-matrix.md` — all rows PASS or NOT APPLICABLE; named evidence / N/A reasons retained                                                         | ✅     |
| Security Regression          | Existing S06 suite evidence and executable matrix contract; Close validation PASS                                                                             | ✅     |
| Wave 1 Certification Audit   | Independent audit after S06 Close — S01–S06 vs Master Plan, Product Principles, Security Default Policy, Security Verification Standard, ownership boundaries | ⏳     |

---

## Master Plan customer outcomes (Wave 1)

These are the customer-observable lines from the Master Plan. Product Owner marks them only with closed-package evidence.

| Customer-observable outcome                                            | Owning package        | Status |
| ---------------------------------------------------------------------- | --------------------- | ------ |
| I can register an account that survives restart                        | S01                   | ✅     |
| I can log in securely (no shared default password on the product path) | S01                   | ✅     |
| I can recover an account through a supported recovery path             | S01                   | ✅     |
| I can see and sign out sessions (including sign out everywhere)        | S01                   | ✅     |
| An admin can give me a role; I cannot perform another role’s actions   | S02                   | ✅     |
| The product can store a secret that I cannot read back as plaintext    | S03 Platform Complete | ✅     |
| I cannot see another workspace’s data                                  | S06                   | ✅     |

---

## Explicit non-claims (still true until Wave 1 COMPLETE)

| Not claimed yet                       | Why                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Wave 1 COMPLETE                       | Independent Certification Audit and Product Owner acceptance still open |
| Connection Management available       | Wave 2 — after Wave 1 COMPLETE                                          |
| Vault Customer Complete UI            | May remain open under Vault; does not block Platform Complete exit line |
| Live trading                          | Wave 6                                                                  |
| Monitoring dashboard                  | Wave 3                                                                  |
| Billing / teams SaaS                  | Later waves                                                             |
| Wave 9 multi-team isolation remainder | SEC-11 remainder — not Wave 1                                           |

---

## Wave 1 Certification Audit (mandatory before COMPLETE)

After **V3-S06 Close**, Product Owner commissions an **independent** Wave 1 Certification Audit. This is not a developer self-sign-off and not a substitute for S06 Close.

### Audit must confirm

| Check                          | Meaning                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01–S06 closed with evidence   | Every Wave 1 package has Close records Product Owner accepts                                                                                                                                                                  |
| Master Plan alignment          | Shipped outcomes match frozen Master Plan Wave 1 lines; no invented scope                                                                                                                                                     |
| Product Principles             | Customer First, Security Before Convenience, One Source of Truth, Paper First, Live Must Be Earned, Honest Product, AI Never Controls Capital, Everything Is Auditable, No Hidden Configuration, Architecture Is a Constraint |
| Security Default Policy        | Default deny, fail closed, least privilege, honest product, attributable, regressions never return                                                                                                                            |
| Security Verification Standard | Subject packages satisfy the standard; grandfathered packages remain honest about limits                                                                                                                                      |
| Ownership boundaries           | No package stole Auth, Identity, Vault, Audit, Ledger, Gate, Risk, or Connections                                                                                                                                             |
| Isolation proved               | Isolation Matrix + suite evidence supports “I cannot see another workspace’s data”                                                                                                                                            |
| Wave 1 really finished         | No silent deferral of a Wave 1 exit line into Wave 2                                                                                                                                                                          |

### Audit must not

- Rewrite the Master Plan
- Redesign architecture
- Open Connection Management
- Claim financial-complete security (that is Wave 6)
- Treat S03 Customer Complete UI as a Wave 1 exit blocker if Platform Complete already meets the vault outcome

### Official declaration (only after audit PASS + PO acceptance)

```text
Wave 1 COMPLETE
        ↓
Wave 2 Connection Management may open at Implementation Package
```

Until that declaration exists in Product Owner writing, Wave 1 Exit remains **not claimed**.

---

## Decision log (fill at exit)

| Field                               | Value                 |
| ----------------------------------- | --------------------- |
| S06 Close accepted by Product Owner | 2026-08-17            |
| Wave 1 Certification Audit verdict  | Pending               |
| Wave 1 COMPLETE declared on         | Pending               |
| Declared by                         | Pending               |
| Wave 2 may open                     | **No** until COMPLETE |

---

## STOP

This checklist is planning and Product Owner governance only.
**Do not claim Wave 1 COMPLETE** from S05 Close, from S06 planning, or from partial isolation work.
**Do not start Wave 2** until every row above is ✅ and the Certification Audit is accepted.
