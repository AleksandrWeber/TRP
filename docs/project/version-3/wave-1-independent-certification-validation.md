# Wave 1 Independent Certification Validation

**Date:** 2026-08-17
**Nature:** Independent certification validation. No remediation, implementation, architecture, ownership, scope, policy, or governance change is made by this record.
**Scope:** Version 3 Wave 1 only — V3-S01 through V3-S06.
**Authority reviewed:** Version 3 Certification Process and Wave 1 Certification Resolution.

## Validation basis

The validation treated the approved resolution as the source for the former
blocker set: F-02, F-05, F-06, F-07, F-08, F-10, F-11, F-12, and F-14. It
did not reopen withdrawn, downgraded, Version 2, Wave 2, or unrelated audit
observations.

The following existing evidence was independently compared:

- `version-3-master-plan.md` — Wave 1 is S01–S06; product scope and architectural constraints remain controlled by the Master Plan.
- `version-3-implementation-policy.md` — existing owners, bounded contexts, lifecycle gates, and no-silent-scope-expansion rules.
- `security-default-policy.md` — attributable/auditable actions, fail-closed behavior, one source of truth, and regression expectations.
- `version-3-security-verification-standard.md` — completed-row, evidence, and no-REQUIRES-ACTION criteria.
- `security-coverage-matrix.md` — recorded S01–S06 package boundary and coverage allocation.
- `wave-1-certification-resolution.md` and `wave-1-f05-product-owner-decision-record.md` — authoritative blocker resolutions and certification boundary.
- S04, S05, and S06 Security Verification Worksheets; S01–S06 Close and security-review evidence.
- `wave-1-isolation-matrix.md`, `wave-1-security-route-ownership-inventory.md`, and `wave-1-production-composition-proof.md`.
- Remediation commits `770303c`, `9c96ea2`, `9ddc0af`, `9e8ba87`, `5c3a01f`, `d3776a4`, and `1547c4c`, plus their affected production code and regression tests.

## Former-blocker determinations

| Former blocker                           | Determination | Independent evidence                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-02 — Audit attribution contract        | **RESOLVED**  | `security-audit-attribution.ts` no longer requires `workspaceId` for Identity-global `authz.role-change`; it retains actor, subject, and resource attribution. `authorization-events.ts` awaits role-change audit persistence, and the role-change path supplies the existing transaction. The F-02 commit and its authorization/People/Security Audit regressions verify successful persistence without inventing a workspace.                         |
| F-05 — Product Owner governance conflict | **RESOLVED**  | `wave-1-f05-product-owner-decision-record.md` is an approved authoritative interpretation: Wave 1 certifies the Security Audit Foundation, not the later customer Audit product. It expressly keeps the Master Plan, architecture, owners, bounded contexts, and Wave 2 unchanged.                                                                                                                                                                      |
| F-06 — S04 worksheet                     | **RESOLVED**  | `v3-s04-security-verification-worksheet.md` identifies F-06, records every required standard row and §19 regression entry, maps the OWASP sections, and states zero REQUIRES ACTION; `v3-s04-e-security-review.md` is its Close review.                                                                                                                                                                                                                 |
| F-07 — S05 worksheet                     | **RESOLVED**  | `v3-s05-security-verification-worksheet.md` records the S05 Foundation boundary, completed verification rows, named owners for non-owned controls, OWASP mappings, and regression evidence without a REQUIRES ACTION outcome.                                                                                                                                                                                                                           |
| F-08 — S06 worksheet                     | **RESOLVED**  | `v3-s06-security-verification-worksheet.md` records every applicable standard row, clear NOT APPLICABLE ownership, OWASP/regression evidence, and its separate F-14 proof-form boundary; it contains no REQUIRES ACTION outcome.                                                                                                                                                                                                                        |
| F-10 — Atomic Security Audit persistence | **RESOLVED**  | `UserDomainService.assignRoleWithMandatoryAudit` writes the role and audit append through one `PrismaTransactionService` transaction. `SecretVaultService` performs lifecycle mutations and audit append through the same transaction when the production audit/transaction dependencies are present. Role and Vault regression tests demonstrate rollback when the mandatory audit append fails. No new audit store, context, or owner was introduced. |
| F-11 — Password-reset single-use race    | **RESOLVED**  | `PasswordResetStore.consume` now succeeds only when `consumeIfActive` wins; `PrismaPasswordResetRepository.consumeIfActive` conditionally updates active, unexpired rows and requires `count === 1`. The concurrent-consumer regression accepts exactly one success.                                                                                                                                                                                    |
| F-12 — Refresh-token rotation race       | **RESOLVED**  | `AuthSessionStore.rotate` delegates to `rotateIfActive` before returning a successor. `PrismaAuthSessionRepository.rotateIfActive` conditionally claims/revokes the predecessor and creates the successor in one transaction. The concurrent rotation regression permits exactly one successor, then reuse remains invalid.                                                                                                                             |
| F-14 — Production Composition Proof      | **RESOLVED**  | `production-composition-proof.integration.spec.ts` boots the in-scope real Nest modules, Prisma persistence, JWT and production guards without provider overrides. `wave-1-production-composition-proof.md` maps dual-workspace denied Vault and Timeline operations, including 401/403/200 HTTP behavior, to the Isolation Matrix. Its stated non-claims keep Wave 2 and unrelated products out of scope.                                              |

## Consistency and boundary review

The Master Plan remains the controlling product-scope document, while the
Implementation Policy preserves the established owner and bounded-context
rules. The Security Default Policy's attribution and audit requirements are
satisfied by the corrected F-02 and F-10 paths. The Security Verification
Standard's evidence-form requirement is satisfied for S04–S06 by the completed
worksheets, whose package boundaries are consistent with the Coverage Matrix.

The F-05 Decision Record resolves the one former planning/Close conflict
without rewriting historical planning artifacts. Its explicit non-changes,
together with the Isolation Matrix ownership table and the F-14 proof's
explicit non-claims, show no architecture drift, no ownership-boundary change,
no bounded-context change, and no silent package-scope expansion.

The inspected remediation commits are confined to corrected security behavior,
its regression evidence, and certification records. They do not add a customer
feature, transfer ownership, introduce a new bounded context, revise the
Master Plan, or expand Wave 1 certification scope.

## Repository and executable validation

- Repository synchronization: local `HEAD`, local `origin/main`, and
  `origin/main` all resolved to `1547c4c1ec3bec000d3034e2c3746b135937b9c2`
  during this review.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed.
- `pnpm --filter @trp/web build` — passed; the existing large-chunk warning was emitted but did not fail the build.
- `git diff --check` — passed.

The working tree contains unrelated pre-existing changes and untracked
artifacts. They were not modified or included by this validation, and they do
not alter the synchronized committed candidate reviewed above.

## Certification conclusion

All nine former certification blockers were independently verified as
**RESOLVED**. No certification blocker remains in the stated Wave 1 scope, and
no new certification blocker was discovered during this validation.

The recommendation is **RECOMMENDED FOR PRODUCT OWNER CERTIFICATION**. This is
not a declaration that Wave 1 is CERTIFIED or COMPLETE; that decision belongs
exclusively to the Product Owner.

## Mandatory answers

1. **Were all former certification blockers independently verified?** Yes.
2. **Does any certification blocker remain?** No.
3. **Was any new certification blocker discovered?** No.
4. **Was any implementation changed during validation?** No.
5. **Was any architecture changed?** No.
6. **Were any ownership boundaries changed?** No.
7. **Is Wave 1 recommended for Product Owner certification?** Yes — **RECOMMENDED FOR PRODUCT OWNER CERTIFICATION**.

## STOP

Wait for Product Owner decision. No further implementation work is authorized by this validation.
