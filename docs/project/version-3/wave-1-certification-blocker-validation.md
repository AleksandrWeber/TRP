# Wave 1 Certification — Blocker Validation Review

**Date:** 2026-08-17
**Nature:** Independent blocker validation. Not remediation. Not a second full audit. Not a Product Owner certification verdict.
**Input:** Eleven remaining triage blockers from `wave-1-certification-decision-input.md`.
**Question for each finding:** Is this a **confirmed violation of an approved requirement**, or **artifact / documentation / interpretive overreach**?

## Classification key

| Class                                  | Meaning                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **CONFIRMED IMPLEMENTATION VIOLATION** | Code behavior conflicts with an approved package or policy commitment.                           |
| **CONFIRMED ARTIFACT DEFICIENCY**      | Required Close evidence form is missing or incomplete; product control may still exist.          |
| **PLANNING / CLOSE CONFLICT**          | Approved package documents conflict with an accepted Close; Master Plan Wave 1 may still be met. |
| **NOT CONFIRMED**                      | Finding compares to a stronger design than approved, or rests on an uncommitted interpretation.  |

This review does **not** declare CERTIFIED, CERTIFIED WITH OBSERVATIONS, or NOT CERTIFIED. That remains a Product Owner decision after this evidence pack.

---

## Executive table

| Finding | Validated class                        | Confirmed approved-requirement breach?         | Recommended treatment for final certification decision      |
| ------- | -------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| F-01    | **NOT CONFIRMED**                      | No                                             | Drop as blocker; keep as observation only if desired        |
| F-02    | **CONFIRMED IMPLEMENTATION VIOLATION** | Yes                                            | Keep as blocker                                             |
| F-05    | **PLANNING / CLOSE CONFLICT**          | Package-docs yes; Master Plan Wave 1 no        | Governance decision — not a silent code defect              |
| F-06    | **CONFIRMED ARTIFACT DEFICIENCY**      | Process yes; product defect not proven         | Keep as evidence-form issue; decide if form alone blocks    |
| F-07    | **CONFIRMED ARTIFACT DEFICIENCY**      | Process yes; product defect not proven         | Keep as evidence-form issue; decide if form alone blocks    |
| F-08    | **CONFIRMED ARTIFACT DEFICIENCY**      | Process yes; product defect not proven         | Keep as evidence-form issue; decide if form alone blocks    |
| F-10    | **CONFIRMED IMPLEMENTATION VIOLATION** | Yes                                            | Keep as blocker                                             |
| F-11    | **CONFIRMED IMPLEMENTATION VIOLATION** | Yes                                            | Keep as blocker                                             |
| F-12    | **CONFIRMED IMPLEMENTATION VIOLATION** | Yes                                            | Keep as blocker                                             |
| F-14    | **CONFIRMED ARTIFACT DEFICIENCY**      | Validation-form yes; isolation hole not proven | Keep as evidence-form issue; decide if form alone blocks    |
| F-19    | **NOT CONFIRMED** (interpretive)       | No against named S04 Close commitments         | Drop as blocker unless PO applies SDP §3 to CORS explicitly |

---

## F-01 — Audit integrity forgeability

### What was claimed

The integrity hash is a self-hash over stored content; a storage writer can rewrite content and recompute a valid hash.

### What approved S05 required

`v3-s05-implementation-package.md` §6 and acceptance criterion 5 require an integrity **foundation** that makes silent mutation of historical security events **impractical for ordinary compromise of application write paths**. Explicit planning rule:

> Do not claim cryptographic perfection against a fully compromised host database administrator.

`v3-s05-c-security-review.md` states the shipped limit:

- Update/delete against `security_audit_records` are rejected by a **database trigger**.
- Verification recomputes the hash and fails if content differs from the stored seal.
- Explicit non-claim: does **not** detect a DBA who changes content **and** integrity metadata together.

### Implementation evidence

- Append-only trigger: `apps/api/prisma/migrations/20260817143000_v3_s05_c_security_audit_integrity/migration.sql` (`BEFORE UPDATE OR DELETE` raises).
- Repository path is `create` only (`prisma-security-audit.repository.ts`).
- Hash is per-record content seal (`security-audit-integrity.ts`); verifier compares recomputed hash (`security-audit-integrity.service.ts`).

### Validation

The original blocker compared the design to resistance against a privileged writer who updates **both** content and hash. That exact case is the approved S05 non-claim. Product-path mutation is prevented by triggers; content-only tampering of surviving rows is detectable.

### Class

**NOT CONFIRMED**

---

## F-02 — Role-change audit cannot persist

### What was claimed

`authz.role-change` / `authz.deny` require `workspaceId`; People emits none; persistence is fire-and-forget after the mutation.

### What was approved

S05 requires durable role-change history with actor/subject attribution (`v3-s05-implementation-package.md` IN Scope; validation plan “Consume role events”). Master Plan / SDP require attributable security-relevant actions. S02 emits role-change events for later audit consumption.

### Implementation evidence

- Attribution rules require `workspaceId` for `authz.role-change` and `authz.deny` (`security-audit-attribution.ts:15–21`).
- People emits without `workspaceId` (`people.controller.ts` → `recordRoleChange`).
- Persistence is `void persistSecurityAuditEvent(...)` (`authorization-events.ts:47, 64`).
- Persist path throws on missing required attribution (`security-audit-persist.ts` → `audit.record`).

### Validation

After a successful role mutation, the required Security Audit write is contractually rejected. This is a real S02↔S05 integration defect against the approved durable/auditable commitment.

### Class

**CONFIRMED IMPLEMENTATION VIOLATION**

---

## F-05 — Searchable Security History required at S05 Close

### What was claimed

S05 Closed as foundation-only while scope/validation require searchable/filterable operator UX.

### What documents say

| Artifact                                    | Stance                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `v3-s05-product-scope.md`                   | Search/filter are customer outcomes and Close criteria              |
| `v3-s05-validation-plan.md`                 | Search/filter API and UX rows; walkthrough requires filter/search   |
| `v3-s05-package-close-report.md`            | PO **APPROVED** foundation Close; search/filter UI **not received** |
| `security-audit-readiness-delta.md`         | **ACCEPTED**; search/filter “Deliberately not ready”                |
| Master Plan Wave 1 customer-observable list | No searchable-audit line                                            |

### Validation

There is a real **package planning vs accepted Close** conflict. There is **no** Master Plan Wave 1 customer-observable requiring search UI. Product Owner already accepted foundation-only Close in writing.

This is not a silent implementation bug. It is a Close-scope integrity / documentation conflict. Whether it blocks Wave 1 certification depends on whether the Product Owner treats unrevi sed S05 validation criteria as still binding after the accepted foundation Close.

### Class

**PLANNING / CLOSE CONFLICT**

---

## F-06 / F-07 / F-08 — Verification Standard worksheets

### What was claimed

S04–S06 claim Verification Standard PASS without completed itemized §4–§19 worksheets and OWASP/API mappings.

### What was approved

`version-3-security-verification-standard.md` requires every category/row filled; blank is not PASS; OWASP Top 10 and API Top 10 mappings; applies to packages that start after approval (S04–S06). Implementation Policy L55/L74 make this a Close Security Review gate.

### What exists

| Package | Available Close security evidence                                  | Completed per-row SVS worksheet? |
| ------- | ------------------------------------------------------------------ | -------------------------------- |
| S04     | `v3-s04-e-security-review.md` category rollups + named regressions | **No**                           |
| S05     | Narrative slice reviews; planning-intent package review            | **No**                           |
| S06     | Isolation matrix narrative; planning-intent package review         | **No**                           |

Underlying regressions and controls exist for many surfaces (S04 platform specs; S05 store/timeline/integrity tests; S06 isolation suite). The **mandatory evidence form** is absent.

### Validation

This is a confirmed **Close-evidence process** breach. It is not, by itself, proof that the platform controls fail. Product Owner must decide whether missing worksheet form alone is certification-blocking or a governance remediable observation.

### Class

**CONFIRMED ARTIFACT DEFICIENCY** (for each of F-06, F-07, F-08)

---

## F-10 — Best-effort audit after privileged mutations

### What was claimed

Vault/authorization events use unawaited persistence; mutation can succeed with no durable audit record.

### What was approved

S05 durable append-only history; SDP §10 attributable/auditable actions; “silent untraceable power is forbidden.”

### Implementation evidence

- `authorization-events.ts` and `vault-events.ts` call `void persistSecurityAuditEvent(...)`.
- Persist failures do not roll back the completed privileged mutation.

### Validation

Confirmed. Even aside from F-02’s attribution rejection, the write path is best-effort after success.

### Class

**CONFIRMED IMPLEMENTATION VIOLATION**

---

## F-11 — Password-reset single-use race

### What was claimed

Read-then-consume without verifying the consume won.

### What was approved

`v3-s01-product-scope.md`: recovery token is **time-limited, single-use**. S01-e security review claims single-use / replay fail closed.

### Implementation evidence

- `password-reset.store.ts:50–58` reads unconsumed token, then calls `consume`.
- `prisma-password-reset.repository.ts:30–35` `updateMany` does not return/check `count`.
- Two concurrent consumers can both pass the read and both proceed.

### Validation

Confirmed concurrency failure of the approved single-use property.

### Class

**CONFIRMED IMPLEMENTATION VIOLATION**

---

## F-12 — Refresh-token rotation race

### What was claimed

Successor is saved before a non-asserted revoke of the predecessor.

### What was approved

S01 refresh rotation with reuse → family revoke (`v3-s01-product-scope.md`; S01 Close walkthrough requires refresh reuse → family revoke).

### Implementation evidence

- `auth-session.store.ts:72–104` loads active refresh, `save(next)`, then `revoke(current)`.
- `prisma-auth-session.repository.ts:65–76` revoke is `updateMany` where `revokedAt: null` without asserting rows updated.
- Concurrent refresh callers can each create a valid successor.

### Validation

Confirmed concurrency failure of the approved rotation/reuse model.

### Class

**CONFIRMED IMPLEMENTATION VIOLATION**

---

## F-14 — S06 isolation proof form

### What was claimed

S06 PASS evidence is mostly in-memory/direct service composition, not deployed HTTP + Prisma product-path proof.

### What was approved

`v3-s06-implementation-package.md` Isolation Proof Strategy:

> Product-path negatives — HTTP/API (and UI where the surface exists) — **not mocks of the customer outcome**

Implementation Policy Validation: do not Close on tests that mock the customer outcome.

### What was delivered

Named isolation specs exist and Close cites them. Examples:

- `workspace-isolation.cross-product.spec.ts` uses in-memory audit/incident repositories and composed services/controllers.
- `workspace-isolation.vault-coverage.spec.ts` uses `InMemorySecretVaultRepository` and direct service calls.

S06 Close and PO Resolution accepted this evidence set for matrix PASS.

### Validation

Confirmed **evidence-form** shortfall against the package’s own product-path wording. This does **not** by itself prove a live cross-workspace leak in production composition. It proves the Close suite did not demonstrate the declared HTTP+persistence product path.

### Class

**CONFIRMED ARTIFACT DEFICIENCY** (validation-form), not a proven isolation product hole

---

## F-19 — Production CORS localhost fallback

### What was claimed

Production can boot with localhost CORS origins when `CORS_ORIGIN` is unset, violating SDP §3 fail closed.

### What was approved

- SDP §3: misconfigured production security defaults fail closed.
- S04 package/Close name fail-closed production checks for JWT/insecure mode, host allowlist, browser policy, error sanitization — **not CORS**.
- No `CORS` commitment found in `v3-s04-implementation-package.md`.

### Implementation evidence

- `main.ts:34–48` defaults to localhost SPA origins when `CORS_ORIGIN` unset; no production branch.
- `assertSecurityPlatformBoot` / `security-config.ts` **do** fail closed for the named S04 production defaults; CORS is outside that guard.
- Fallback is a **restricted** localhost list, not `*` / reflect-any-origin.

### Validation

The code fact is true. Treating it as a confirmed Wave 1 blocker requires reading SDP §3 to cover CORS even though S04 never listed CORS as a Close control. That is an interpretive extension beyond the approved S04 package commitments.

### Class

**NOT CONFIRMED** as an S04 package requirement breach; **interpretive** under SDP §3

---

## Synthesis for Product Owner

### Confirmed product/security implementation blockers

1. **F-02** — role-change audit cannot persist under current attribution contract
2. **F-10** — privileged mutations can complete without durable audit write
3. **F-11** — password-reset single-use race
4. **F-12** — refresh rotation/replay race

### Confirmed process/evidence issues (not proven product holes)

5. **F-06, F-07, F-08** — missing Verification Standard Close worksheets
6. **F-14** — S06 isolation suite does not match declared HTTP/API product-path proof form

### Planning/Close governance conflict

7. **F-05** — S05 search/filter required by unrevi sed package docs; foundation Close accepted by Product Owner; Master Plan Wave 1 does not list search

### Not confirmed against approved commitments

8. **F-01** — matches approved S05 integrity foundation limits (DB append-only + content seal; DBA dual-write out of claim)
9. **F-19** — CORS localhost fallback is real code, but not a named S04 Close commitment

### Counts if Product Owner uses this validation strictly

| Bucket                                                                    | Findings               |
| ------------------------------------------------------------------------- | ---------------------- |
| Keep as implementation blockers                                           | F-02, F-10, F-11, F-12 |
| Keep only if evidence-form alone blocks certification                     | F-06, F-07, F-08, F-14 |
| Keep only if unrevi sed S05 validation still binds after foundation Close | F-05                   |
| Drop from blockers                                                        | F-01, F-19             |

---

## STOP

No code was changed. No certification verdict was declared.
Wait for Product Owner decision on:

1. whether artifact-form gaps (F-06–F-08, F-14) alone block certification;
2. whether F-05 remains binding after the accepted foundation Close;
3. the final Wave 1 status among CERTIFIED / CERTIFIED WITH OBSERVATIONS / NOT CERTIFIED.
