# Version 3 Wave 1 Certification Resolution

**Date:** 2026-08-17  
**Nature:** Certification Resolution. No implementation is performed by this document.  
**Status:** **Product Owner Approved — Finalized**  
**Authority:** Product Owner blocker classification and editorial decisions below are authoritative and supersede earlier wording in these Resolution documents where conflicts exist.

- Implementation: F-02, F-10, F-11, F-12
- Certification documentation: F-06, F-07, F-08, F-14
- Governance / planning: F-05
- Removed: F-01, F-19

### Product Owner editorial decisions (binding)

1. **F-14 terminology:** The required proof is **Production Composition Proof**. Certification is technology-neutral. HTTP, REST, GraphQL, or another production entry point is acceptable if the evidence exercises real dependency injection, real authorization, real persistence, and real production composition, without mocks or in-memory substitutions. Do not narrow certification to HTTP or Prisma.
2. **Final certification step:** After remediation, commission **Independent Certification Validation**. The independent audit has already been completed. Do not imply that Wave 1 requires a second full audit.

This is not a Master Plan revision, package redesign, ownership change, or Wave 2 authorization.

## Implementation blockers

### F-02 — Role-change audit attribution cannot persist

| Item                     | Resolution                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defect confirmation      | Confirmed. `authz.role-change` / `authz.deny` require `workspaceId` in `security-audit-attribution.ts`; People emits role changes without it through `authorization-events.ts`. The persist path rejects after the role mutation.                                                                                                                                                                         |
| Smallest correction      | Make the Security Audit attribution contract explicitly accept the approved Identity-global People role-assignment event without a workspace, while retaining required actor, subject, and resource attribution. For authorization-deny events, preserve workspace attribution whenever the denied surface has a workspace; define the Identity-global case explicitly rather than inventing a workspace. |
| Ownership / architecture | Authentication/Identity continues to emit role facts; Security Audit continues to normalize and persist them. No new store, context, owner, or Source of Truth.                                                                                                                                                                                                                                           |
| Product / Master Plan    | Preserves Everything Is Auditable, does not add product capability, and does not change Master Plan scope.                                                                                                                                                                                                                                                                                                |
| Affected packages        | S02 Identity/RBAC; S05 Security Audit.                                                                                                                                                                                                                                                                                                                                                                    |
| Expected files           | `authorization-events.ts`, `security-audit-attribution.ts`, `security-audit-emitter.adapter.ts`, their specs; People integration coverage.                                                                                                                                                                                                                                                                |
| Migration                | None expected. Existing `workspaceId` storage already permits absent attribution for globally scoped facts.                                                                                                                                                                                                                                                                                               |
| Required regressions     | Role assignment and role-denial persist successfully with Identity-global attribution; workspace-scoped authorization denial retains workspace; audit event contains actor/subject/resource and no secret.                                                                                                                                                                                                |

### F-10 — Privileged audit persistence is best-effort

| Item                     | Resolution                                                                                                                                                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defect confirmation      | Confirmed. Vault and authorization emitters invoke `void persistSecurityAuditEvent(...)`; an audit failure does not prevent a completed privileged mutation.                                                                                                                                        |
| Smallest correction      | Make each privileged mutation and its required Security Audit append atomic: persist the audit record in the same persistence transaction as the role/vault mutation, or reject and roll back the mutation when audit persistence fails. Do not treat a background write as Close-quality evidence. |
| Ownership / architecture | Identity retains role mutation; Vault retains lifecycle mutation; Security Audit retains the audit store. This changes transactional coordination only—no new bounded context, event store, or ownership transfer.                                                                                  |
| Product / Master Plan    | Enforces existing attributable/durable behavior only; no customer feature or Master Plan change.                                                                                                                                                                                                    |
| Affected packages        | S02, S03, S05.                                                                                                                                                                                                                                                                                      |
| Expected files           | People/Identity mutation service or repository boundary; Vault mutation service/repository boundary; Security Audit repository/service; module composition; focused tests.                                                                                                                          |
| Migration                | None expected. Existing audit table is sufficient.                                                                                                                                                                                                                                                  |
| Required regressions     | Forced audit-append failure leaves role unchanged; forced append failure leaves vault lifecycle unchanged; successful mutation creates exactly one corresponding audit record; no audit write is detached/unhandled.                                                                                |

### F-11 — Password-reset token single-use race

| Item                     | Resolution                                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defect confirmation      | Confirmed. `PasswordResetStore.consume` reads then consumes; Prisma `updateMany` result is ignored. Concurrent callers can each proceed after observing the same unconsumed token.     |
| Smallest correction      | Change consume to conditional compare-and-consume that returns whether exactly one row transitioned from unconsumed to consumed. Only the winning request may continue password reset. |
| Ownership / architecture | Remains Authentication-owned reset-token persistence. No new domain or table.                                                                                                          |
| Product / Master Plan    | Restores the existing single-use recovery commitment; no scope change.                                                                                                                 |
| Affected packages        | S01.                                                                                                                                                                                   |
| Expected files           | `password-reset.repository.ts`, Prisma and in-memory implementations, `password-reset.store.ts`, recovery tests.                                                                       |
| Migration                | None.                                                                                                                                                                                  |
| Required regressions     | Parallel consumption of one token yields exactly one success; losing request gets existing generic invalid-link behavior; normal reset and expiry remain green.                        |

### F-12 — Refresh-token rotation race

| Item                     | Resolution                                                                                                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defect confirmation      | Confirmed. Refresh creates a successor before verifying that it exclusively revoked the predecessor. Concurrent calls can create multiple valid successors.                                                                                                     |
| Smallest correction      | Replace read → save successor → non-asserted revoke with one atomic compare-and-swap rotation transaction: claim/revoke the presented active session exactly once, create one successor for the winner, and apply the existing family-revoke behavior to reuse. |
| Ownership / architecture | Remains Authentication session-store behavior; no new session context or ownership change.                                                                                                                                                                      |
| Product / Master Plan    | Restores existing rotation/reuse-to-family-revoke behavior; does not add a new customer feature.                                                                                                                                                                |
| Affected packages        | S01.                                                                                                                                                                                                                                                            |
| Expected files           | `auth-session.repository.ts`, Prisma and in-memory implementations, `auth-session.store.ts`, session tests.                                                                                                                                                     |
| Migration                | None expected. Existing session fields support conditional revocation and successor link.                                                                                                                                                                       |
| Required regressions     | Concurrent refresh of one token creates one valid successor only; loser fails and family is handled per existing reuse policy; ordinary refresh, revoke, and sign-out-everywhere remain green.                                                                  |

## Certification documentation blockers

### F-06 — S04 Verification Standard record

| Item                       | Resolution                                                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing evidence reusable | Yes: S04-e Security Review category evidence, `security-platform/*.spec.ts`, named regression suite, S04 validation reports, Coverage Matrix, and Security Foundation certification audit.                                                                            |
| Missing artifact           | A completed S04 Security Verification Standard worksheet containing every §4–§18 row, §18 OWASP Top 10 and API Top 10 mapping, and §19 regression-suite rows.                                                                                                         |
| New implementation needed  | No.                                                                                                                                                                                                                                                                   |
| Minimum record             | One S04 Close evidence worksheet or an explicit completed attachment referenced by the Security Review. It must state PASS / NOT APPLICABLE and name evidence/owner for each row; it may reuse existing tests and owners.                                             |
| Remediation status         | **RESOLVED** — completed worksheet at [`v3-s04-security-verification-worksheet.md`](./v3-s04-security-verification-worksheet.md); referenced from [`v3-s04-e-security-review.md`](./v3-s04-e-security-review.md). Zero **REQUIRES ACTION**. No implementation change. |

### F-07 — S05 Verification Standard record

| Item                       | Resolution                                                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing evidence reusable | Partially: S05 slice security reviews, store/timeline/integrity/incident tests, Close report, audit product certification audit, and readiness delta.                                                                                                                 |
| Missing artifact           | Completed S05 §4–§19 worksheet, both OWASP mappings, and §19 regression-suite record.                                                                                                                                                                                 |
| New implementation needed  | No for the worksheet itself. If a required row has no existing evidence, mark it REQUIRES ACTION rather than inventing a PASS; that outcome would expose additional work.                                                                                             |
| Minimum record             | One S05 Close worksheet distinguishing foundation-delivered controls from named later owners and explicitly recording the approved retention/export limits.                                                                                                           |
| Remediation status         | **RESOLVED** — completed worksheet at [`v3-s05-security-verification-worksheet.md`](./v3-s05-security-verification-worksheet.md); referenced from [`v3-s05-e-security-review.md`](./v3-s05-e-security-review.md). Zero **REQUIRES ACTION**. No implementation change. |

### F-08 — S06 Verification Standard record

| Item                       | Resolution                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing evidence reusable | Partially: Isolation Matrix, executable matrix contract, five S06 isolation specs, Close report, route inventory, and alignment report.                                                                                                                                                                                                                   |
| Missing artifact           | Completed S06 §4–§19 worksheet, both OWASP mappings, and §19 regression-suite record.                                                                                                                                                                                                                                                                     |
| New implementation needed  | No for the worksheet itself. It must not claim a proof form that the suite does not provide; see F-14.                                                                                                                                                                                                                                                    |
| Minimum record             | One S06 Close worksheet with per-row evidence/owner, explicit N/A for internal-only and later-wave surfaces, and a §19 entry for each actual isolation regression.                                                                                                                                                                                        |
| Remediation status         | **RESOLVED** — completed worksheet at [`v3-s06-security-verification-worksheet.md`](./v3-s06-security-verification-worksheet.md); referenced from [`v3-s06-e-security-review.md`](./v3-s06-e-security-review.md). Zero **REQUIRES ACTION**. Explicitly does **not** claim Production Composition Proof (**F-14** remains OPEN). No implementation change. |

### F-14 — S06 Production Composition Proof

| Item                              | Resolution                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing evidence reusable        | Partial only. Existing in-memory/direct composition tests prove domain boundaries and negative cases.                                                                                                                                                                                                                                        |
| Missing evidence                  | **Production Composition Proof** for applicable S06 rows: dual-workspace negative coverage through a real production entry point that exercises real dependency injection, real authorization, real persistence, and real production composition, without mocks or in-memory substitutions.                                                  |
| New certification artifact needed | Yes, after the missing tests exist: a focused validation/certification record mapping each new test to the Isolation Matrix row.                                                                                                                                                                                                             |
| New implementation needed         | No production behavior change. New test harness and regression tests are required because the current evidence does not establish the required proof form.                                                                                                                                                                                   |
| Minimum proof                     | Dual-workspace Production Composition Proof that A cannot read/mutate B for applicable routes/surfaces. The entry point may be HTTP, REST, GraphQL, or another production entry point. Persistence must be the real production store composition, not an in-memory substitute. UI evidence only where a customer UI surface actually exists. |

## Governance blocker

### F-05 — S05 search/filter scope versus accepted foundation Close

**Cause:** An unrevised S05 Product Scope and Validation Plan require search/filter UI and walkthrough. The Product Owner accepted a foundation-only S05 Close that explicitly excludes that UI. The Master Plan Wave 1 customer outcomes do not independently require searchable audit UI.

**Exactly one recommended resolution: D — Product Owner decision record.**

A Product Owner decision record should:

1. Confirm that the accepted S05 gate is **Security Audit Product Foundation** for Wave 1;
2. State that the S05 Close and readiness delta are authoritative for the foundation boundary;
3. State that search/filter/customer download remain Security Audit-owned later work;
4. State that this decision resolves the S05 package-document conflict without changing Master Plan scope, ownership, or Wave 1 customer outcomes; and
5. Link the unchanged scope/validation plans as historical planning inputs, not rewritten evidence.

This is the narrowest option. It neither revises the Master Plan nor silently edits approved planning/validation text.

## Recommended actions and work estimate

| Work item                                                         | Type                                   | Estimate                        | Migration               |
| ----------------------------------------------------------------- | -------------------------------------- | ------------------------------- | ----------------------- |
| F-02 attribution contract and persistence regressions             | Implementation + tests                 | Small                           | No                      |
| F-10 transactional mutation/audit coordination                    | Implementation + tests                 | Medium                          | No                      |
| F-11 conditional reset consumption                                | Implementation + tests                 | Small                           | No                      |
| F-12 atomic refresh rotation                                      | Implementation + tests                 | Medium                          | No                      |
| F-06 S04 completed worksheet                                      | Certification artifact                 | Small                           | No                      |
| F-07 S05 completed worksheet                                      | Certification artifact                 | Small, subject to evidence gaps | No                      |
| F-08 S06 completed worksheet                                      | Certification artifact                 | Small, subject to F-14          | No                      |
| F-14 Production Composition Proof regressions and evidence record | Test evidence + certification artifact | Medium                          | No production migration |
| F-05 Product Owner decision record                                | Governance artifact                    | Small                           | No                      |

## Final answers

1. **How many implementation defects remain?** Four: F-02, F-10, F-11, F-12.
2. **How many certification-document defects remain?** Four: F-06, F-07, F-08, F-14. F-14 requires Production Composition Proof before its documentation can be completed.
3. **Does any governance conflict remain?** Yes: F-05, resolved by one Product Owner decision record (option D).
4. **After resolving only those items, will Wave 1 become CERTIFIED or is Independent Certification Validation still required?** **Independent Certification Validation** is required. The present audit verdict cannot be silently converted after implementation fixes, new proof, and governance resolution. Independent Certification Validation must verify that all confirmed blockers have been resolved before any certification verdict.

## STOP

No production code, package scope, Master Plan, ownership, certification verdict, commit, or push was changed.

**The Product Owner Resolution is now authoritative.**  
**Implementation remediation may begin** only after Product Owner authorization of the remediation stage.
