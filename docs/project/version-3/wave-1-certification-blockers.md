# Wave 1 Certification Blockers

**Triage date:** 2026-08-17  
**Source:** `wave-1-certification-findings-triage.md`  
**Status:** Product Owner decision input; no remediation is included.

## CERTIFICATION BLOCKERS

| Finding | Package(s)    | Why certification is blocked                                                                                                                                                                                                                                                                                                        |
| ------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01    | S05           | The delivered integrity model is a self-hash over mutable stored content. It does not meet S05’s approved detectable-tampering foundation requirement.                                                                                                                                                                              |
| F-02    | S02, S05      | Role-change and privileged-deny audit records fail the Audit attribution contract after successful privileged mutations. This violates the approved durable/auditable security-history commitment.                                                                                                                                  |
| F-05    | S05           | S05 Close is foundation-only while its approved scope and validation require searchable/filterable operator Security History.                                                                                                                                                                                                       |
| F-06    | S04           | **REMEDIATED (documentation)** — itemized Close worksheet and OWASP/API mappings now in [`v3-s04-security-verification-worksheet.md`](./v3-s04-security-verification-worksheet.md). Independent Certification Validation still required.                                                                                            |
| F-07    | S05           | **REMEDIATED (documentation)** — itemized Close worksheet, OWASP/API mappings, and regression-suite evidence now in [`v3-s05-security-verification-worksheet.md`](./v3-s05-security-verification-worksheet.md). Independent Certification Validation still required.                                                                |
| F-08    | S06           | **REMEDIATED (documentation)** — itemized Close worksheet, OWASP/API mappings, and isolation regression evidence now in [`v3-s06-security-verification-worksheet.md`](./v3-s06-security-verification-worksheet.md). Does **not** resolve F-14. Independent Certification Validation still required.                                 |
| F-10    | S02, S03, S05 | Privileged authorization and Vault actions can succeed when the subsequent audit write fails because persistence is best-effort.                                                                                                                                                                                                    |
| F-11    | S01           | Password-reset single-use behavior is not concurrency-safe.                                                                                                                                                                                                                                                                         |
| F-12    | S01           | Refresh rotation/reuse behavior is not concurrency-safe.                                                                                                                                                                                                                                                                            |
| F-14    | S06           | **REMEDIATED (implementation + evidence)** — real Nest module composition, Prisma persistence, JWT/authorization guards, Vault, Security Audit, and Timeline regressions are recorded in [`wave-1-production-composition-proof.md`](./wave-1-production-composition-proof.md). Independent Certification Validation still required. |
| F-19    | S04           | Production boot falls back to localhost CORS origins when configuration is unset instead of failing closed under Security Default Policy §3.                                                                                                                                                                                        |

## CERTIFICATION OBSERVATIONS

| Finding | Disposition | Reason                                                                                                           |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| F-03    | Downgrade   | Missing close tags and misleading commit wording are process hygiene, not an approved Close requirement breach.  |
| F-04    | Downgrade   | Vault overview honesty issue only; missing Vault UI is an approved Wave 1 non-blocker.                           |
| F-09    | Downgrade   | Dirty local worktree limits local validation provenance but does not invalidate synchronized commit evidence.    |
| F-15    | Downgrade   | S04 Close wording overstates a recommendation; documentation issue only.                                         |
| F-18    | Downgrade   | Retention eligibility-only delivery is within the approved S05 foundation limitation.                            |
| F-20    | Keep        | Stale governance/progress docs violate Honest Product narrative but do not block certification.                  |
| F-21    | Keep        | Artifact status conflicts are documentation defects; inventory-row proof-form subclaim withdrawn.                |
| F-22    | Downgrade   | S06 tag target is historical traceability, not a required Close mechanism.                                       |
| F-23    | Keep        | Security Default Policy authority text is unresolved, but this is governance clarity only.                       |
| F-24    | Downgrade   | Missing tests are corroborating evidence, not a separate breach unless a specific verified failure requires one. |

## CERTIFICATION NOTES

| Finding | Disposition | Reason                                                                                        |
| ------- | ----------- | --------------------------------------------------------------------------------------------- |
| F-13    | Withdraw    | Reverse-proxy rate-limit identity is not an approved Wave 1 deployment requirement.           |
| F-16    | Withdraw    | Identity-global People projection is expressly approved for S02/S06.                          |
| F-17    | Withdraw    | DNS-resolution SSRF controls exceed Wave 1’s foundation-only, no-outbound-product commitment. |

## STOP

Wave 1 is not declared COMPLETE. Wave 2 must not begin. Wait for Product Owner review.
