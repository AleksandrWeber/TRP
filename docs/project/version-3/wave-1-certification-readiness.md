# Wave 1 Certification Readiness

**Date:** 2026-08-17
**Prepared by:** V3-S06-f Evidence & Certification Alignment
**Status:** **READY FOR INDEPENDENT CERTIFICATION AUDIT** — V3-S06 is CLOSED;
this is not an independent Certification Audit or Wave 1 COMPLETE declaration.

## Certification table

| Product surface                           | Owner                        | Isolation          | Evidence                                                                                                 | Reason                                                                                                                                        |
| ----------------------------------------- | ---------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication / identity binding         | Authentication               | **PASS**           | `workspace-isolation.identity-coverage.spec.ts` — foreign session cannot bind to A; JWT subject binding. | `AuthSessionStore` resolves sessions only for the issued user.                                                                                |
| Session                                   | Authentication               | **PASS**           | `workspace-isolation.identity-coverage.spec.ts` — A cannot list/revoke B sessions.                       | Listing and revocation are caller-scoped.                                                                                                     |
| RBAC / People / role assignment           | Identity                     | **PASS**           | `workspace-isolation.identity-coverage.spec.ts` — role ≠ membership.                                     | People is the approved S02 Identity-global Admin projection; role assignment cannot grant foreign Workspace membership.                       |
| Vault secrets                             | Vault                        | **PASS**           | `workspace-isolation.vault-coverage.spec.ts` — A-only list and A→B lifecycle denial.                     | Membership + C8 is checked before every Vault operation; storage slots are workspace-scoped.                                                  |
| Security Audit store                      | Audit                        | **PASS**           | `workspace-isolation.cross-product.spec.ts` — B Vault lifecycle records never appear in A Timeline.      | Classified trusted-emitter attribution persists; scoped reads filter by workspace.                                                            |
| Timeline                                  | Audit                        | **PASS**           | `workspace-isolation.cross-product.spec.ts` — deny-before-read and B cursor non-leak.                    | Membership is checked before read; Timeline queries the requested workspace only.                                                             |
| Incident / investigation                  | Audit                        | **PASS**           | `workspace-isolation.cross-product.spec.ts` — mixed-workspace evidence linking is denied.                | Incidents are workspace-bound; internal investigation/export assemble linked same-workspace events. No customer HTTP caller exists in Wave 1. |
| Security Platform tenancy                 | Platform                     | **NOT APPLICABLE** | V3-S04 Close evidence.                                                                                   | Platform owns hardening, not tenant state; tenant isolation is proved by Authentication, Session, Vault, Audit, Timeline, and Workspace rows. |
| Workspace membership / boundary           | Workspace / Identity         | **PASS**           | `workspace-isolation.negative-proofs.spec.ts` — A→B ID substitution denied.                              | Membership is checked before resolving or authorizing a workspace ID.                                                                         |
| Future Connection Management              | Wave 2 Connection Management | **NOT APPLICABLE** | No Wave 1 route or credential product exists.                                                            | It is explicitly a Wave 2 product.                                                                                                            |
| Wave 1 security route ownership inventory | Owning package               | **PASS**           | [`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md).        | Every Wave 1 security-relevant route maps to an owner and a PASS/N/A matrix row; no route is orphaned.                                        |

## Gate decision

Every matrix row is now **PASS** or **NOT APPLICABLE**, with an explicit reason
for each N/A and named existing evidence for each PASS. The evidence clears the
matrix-readiness condition for V3-S06 Close review.

The following gates remain intentionally unclaimed:

1. The independent **Wave 1 Certification Audit** — eligible to begin after S06 Close, but not started.
2. A Product Owner declaration of **Wave 1 COMPLETE** — only after the independent audit passes.
3. Opening Wave 2 Connection Management — only after Wave 1 COMPLETE.

## Certification Audit input once unblocked

After S06 Close, an independent audit must verify:

- S01–S06 Close evidence;
- frozen Master Plan alignment;
- Product Principles;
- Security Default Policy;
- Security Verification Standard;
- ownership boundaries and absence of architectural drift.

The authoritative preparation references are the
[Wave 1 Exit Checklist](./wave-1-exit-checklist.md),
[Isolation Matrix](./wave-1-isolation-matrix.md), and V3-S06 slice reports.
