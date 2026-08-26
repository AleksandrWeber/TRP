# Version 3 Wave 1 — Independent Certification Findings

**Audit date:** 2026-08-17
**Scope:** V3-S01 through V3-S06, delivered Wave 1 Security Foundation
**Audit posture:** Independent; prior PASS assertions were treated as claims requiring artifact evidence.
**Verdict:** **NOT CERTIFIED**

Findings are ordered by severity. Evidence paths are repository-relative from the project root.

---

## Critical

### F-01 — Audit integrity is forgeable, not tamper-evident

`apps/api/src/modules/security-audit/security-audit.service.ts` computes `integrityHash` solely from attacker-controllable stored content. `security-audit-integrity.service.ts` verifies only that self-hash. There is no chain, signature, external anchor, or protected signing key.

An actor who can modify the audit table can rewrite content and recompute a valid hash. This fails S05’s stated “detectable silent mutation” requirement and Security Default Policy §10 (attributable and auditable).

### F-02 — Required role-change audit records cannot persist

`apps/api/src/modules/security-audit/security-audit-attribution.ts` requires `workspaceId` (and other fields) for `authz.role-change` and `authz.deny`.

`apps/api/src/modules/identity/people.controller.ts` emits role-change events without `workspaceId`. `apps/api/src/modules/auth/authorization-events.ts` calls `void persistSecurityAuditEvent(...)` after the HTTP mutation path completes. Attribution validation rejects the write after the privileged mutation succeeds.

Role changes and C6 denies can therefore complete without durable Security Audit evidence.

### F-03 — S03–S05 lack independent close git anchors

Close tags exist only for `v3-s01-close`, `v3-s02-close`, and `v3-s06-close`. There are no `v3-s03-close`, `v3-s04-close`, or `v3-s05-close` tags or dedicated close commits.

S03–S05 close reports and most Wave 1 security code first appear together in commit `3a2077a` (`feat(security): close V3-S06 workspace isolation`, 433 files). S04 and S05 close reports state “Nothing was committed or pushed as part of this Close record” while their artifacts debut in that commit.

This contradicts Implementation Policy sequential Close discipline and weakens historical traceability.

### F-04 — Vault customer outcome marked complete without a customer product path

Master Plan Wave 1 customer outcomes (`version-3-master-plan.md` §4) require that an ordinary operator can store a secret they cannot read back as plaintext.

`wave-1-exit-checklist.md` marks that outcome ✅ on “S03 Platform Complete” only. `v3-s03-close-criteria-resolution.md` and `v3-s03-platform-complete-close-report.md` state Customer Complete (Vault UI, HTTP, walkthrough) remains open and operators cannot yet manage secrets through the product.

`wave-1-security-route-ownership-inventory.md` lists no Vault HTTP routes. `secret-vault-overview.md` nevertheless describes operators opening Vault and adding credentials as present-tense product behavior.

The exit checklist ✅ and the Platform Complete / Customer Complete split contradict each other without a Master Plan revision.

### F-05 — S05 CLOSED while package scope still requires searchable Admin UX

`v3-s05-product-scope.md` and `v3-s05-validation-plan.md` define Close as a searchable/filterable Security History product with operator UX.

The only customer audit HTTP surface is chronological timeline navigation in `security-audit-timeline.controller.ts`, which explicitly offers no search, filters, or export controls. `v3-s05-close-report.md` admits foundation-only delivery (no operator search/filter UI).

S05 is recorded CLOSED in `v3-s05-package-close-report.md` while its own scope/validation artifacts still describe a fuller customer product at Close.

---

## Major

### F-06 — V3-S04 Verification Standard evidence is incomplete

`version-3-security-verification-standard.md` requires every numbered row, OWASP Top 10 mapping, and OWASP API Top 10 mapping in the package Security Review.

`v3-s04-e-security-review.md` summarizes categories rather than completing the mandatory worksheet. `v3-s04-close-report.md` nevertheless records “Security Verification Standard completed | PASS.”

### F-07 — V3-S05 lacks post-implementation Verification Standard evidence

`v3-s05-security-review.md` remains planning-only (“planning intent”) while stating the standard is mandatory at Close. Post-implementation slice reviews (for example `v3-s05-e-security-review.md`) contain no completed §4–§19 worksheet, OWASP mappings, or regression-suite table.

`v3-s05-package-close-report.md` records Security Review as PASS.

### F-08 — V3-S06 lacks post-implementation Verification Standard evidence

`v3-s06-security-review.md` remains planning-intent content. `v3-s06-close-report.md` asserts Verification Standard PASS with no completed itemized worksheet or OWASP/API mappings in the Close evidence set.

### F-09 — Certification cannot bind to a clean, immutable repository state

`HEAD` equals `origin/main` (`0a0d0b5e54431fcbca9d17816e181cf981b5d8f6`), but the working tree contains unrelated modifications to five GitHub workflow files and `docs/releases/rc-1/security.md`, plus untracked Version 2 audit documents.

Required validation passed against this dirty tree, not against an immutable certification candidate.

### F-10 — Audit persistence is best-effort after privileged mutations

Vault lifecycle and authorization events use unawaited `void persistSecurityAuditEvent(...)` (`authorization-events.ts`, `vault-events.ts`, `secret-vault.service.ts`). A database or validation failure after a successful mutation can leave no durable audit record, contrary to S05’s durable history requirement and Security Default Policy §10.

### F-11 — Password-reset token consumption is not concurrency-safe

`password-reset.store.ts` reads an unconsumed token, then marks it consumed without verifying the update won a race. Two concurrent reset requests can both pass the read and both change the password. No concurrency regression test exists.

### F-12 — Refresh-token rotation has a replay race

`auth-session.store.ts` reads an active refresh token, saves a successor, then revokes the predecessor without atomic compare-and-swap. Concurrent refreshes can each create valid successor sessions. The losing revoke can affect zero rows silently.

### F-13 — S04 rate-limit identity collapses behind a reverse proxy in production

`security-platform.http.ts` resolves client IP from `request.ip` first. Production bootstrap in `main.ts` does not set Fastify `trustProxy`. Behind a normal reverse proxy, distinct clients can share one quota bucket. Integration tests set `trustProxy: true`, masking the production configuration gap.

### F-14 — S06 isolation PASS evidence is mostly in-memory composition, not product-path proof

`v3-s06-implementation-package.md` requires HTTP/API and UI evidence where available. The cited isolation suite substitutes in-memory repositories and invokes services/controllers directly (`workspace-isolation.cross-product.spec.ts`, `workspace-isolation.vault-coverage.spec.ts`, `workspace-isolation.identity-coverage.spec.ts`).

This is useful regression coverage but does not prove Prisma scoping, registered global guards, CSRF, JWT extraction, or HTTP error shaping in the deployed application composition.

### F-15 — S04 Close maps a “RECOMMEND CLOSE REVIEW” audit to PASS

`security-foundation-certification-audit.md` verdict: “RECOMMEND CLOSE REVIEW — not an automatic Close.”

`v3-s04-close-report.md` records “Independent Certification Audit accepted | PASS” citing that document. This is not the pending Wave 1 Certification Audit, but the wording overstates the S04 foundation audit’s recommendation.

---

## Minor

### F-16 — People list is Identity-global and discloses all users to any Admin

`people.controller.ts` returns every user via `users.list()` with no workspace filter. S06 matrix documents this as an approved Identity-global projection, but it is an explicit exception to the Master Plan isolation outcome “I cannot see another workspace’s data” that must be named at Wave 1 exit, not assumed away.

### F-17 — SSRF allowlist foundation does not validate resolved addresses

`ssrf-allowlist.ts` validates literal hostnames only and does not resolve DNS. Hostnames that later resolve to private or metadata addresses are not blocked at resolution time. This cannot be accepted as sufficient outbound SSRF control without resolved-address validation.

### F-18 — Retention is a calculation, not an enforced or attributable mechanism

`security-audit-retention.ts` computes eligibility only. No retention job, stored expiry enforcement, or attributable archive/delete action exists in the delivered product.

### F-19 — Production CORS defaults to localhost without fail-closed validation

`main.ts` defaults `CORS_ORIGIN` to localhost dev origins when unset, with no production guard requiring an explicit origin policy.

### F-20 — Stale governance and progress documents contradict closed package state

Examples: `version-3-master-plan.md` still says planning awaits acceptance and implementation is not started; `version-3-wave-1-progress-report.md` still reports S03–S06 not started; `README.md` still points next package at S02; `secret-vault-overview.md` and `security-platform-overview.md` overstate or predate Close states.

These do not by themselves invalidate code, but they undermine certification traceability.

### F-21 — Coverage matrix and route-inventory artifacts contain internal status conflicts

`security-coverage-matrix.md` header says S06 CLOSED while its Wave-exit section still describes S06 as aligned for Close review. `wave-1-security-route-ownership-inventory.md` says it does not claim S06 CLOSED while `v3-s06-close-report.md` treats it as Close evidence.

The route-ownership matrix row marks PASS on documentation consistency without the Static/Runtime/Regression evidence required by `wave-1-isolation-matrix.md` proof rules.

### F-22 — `v3-s06-close` tag does not pin the feat close commit

Tag `v3-s06-close` peels to `880f016` (chore: remove duplicate workspace artifacts), not `3a2077a` (feat close). Governance alignment commit `53059c6` post-dates the tag.

---

## Observation

### F-23 — Security Default Policy authority text is contradictory

`security-default-policy.md` status says it awaits Product Owner confirmation; S04 and S06 Close reports treat it as satisfied binding constitution with no separate acceptance record.

### F-24 — Passing test suite does not exercise the failure modes above

`pnpm test` passes (604 API files / 3,563 tests at audit time), but the suite contains no concurrent reset/refresh tests, no test that role audit attribution persists through the real module graph, no forged-self-hash integrity test, no reverse-proxy production configuration test, and no full HTTP+Prisma two-workspace isolation test for the deployed composition.

Wave 1 COMPLETE remains correctly unclaimed pending Product Owner acceptance of this independent audit.

---

## No fixes

This audit records deficiencies only. It does not prescribe repairs, redesign, package reopening, or a Wave 2 start.
