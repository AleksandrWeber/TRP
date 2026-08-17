# Wave 1 Isolation Matrix

**Document:** Wave 1 Isolation Matrix
**Date:** 2026-08-17
**Status:** V3-S06-f evidence alignment completed under the approved Product Owner Resolution. Every row is PASS or NOT APPLICABLE; this is not an S06 Close declaration or Wave 1 Exit evidence.
**Wave:** 1 — Security Foundation
**Audience:** Product Owner, Architecture, Security
**Nature:** Planning matrix. Not an RC. Not an ADR. Not code. Not a Master Plan revision.

**Theme for S06:** Isolation is **proved**, not assumed.
It is not enough to say “workspace isolation exists.” S06 must prove:

> Workspace A **never** can obtain data belonging to Workspace B.

Proof must cover: API, Vault, Audit, Timeline, Incident, RBAC, Session, and any new endpoint introduced in Wave 1 scope.

---

## How to read

| Column          | Meaning                                                             |
| --------------- | ------------------------------------------------------------------- |
| Product surface | Customer / platform capability whose data must stay workspace-bound |
| Isolation owner | Bounded context responsible for the isolation rule                  |
| Proof required  | What must be demonstrated (not merely documented)                   |
| Evidence type   | Kind of test or review that counts as proof for S06                 |

| Status             | Meaning                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **PASS**           | The row has named Owner plus Static, Runtime, and Regression evidence for its stated Wave 1 boundary.    |
| **NOT APPLICABLE** | The product surface does not exist in Wave 1. A named reason is required; it is not hidden PENDING work. |

---

## Isolation Evidence (binding)

Every isolation claim must be backed by at least one evidence type. A bare
statement such as “Workspace isolation PASS” is not evidence.

| Evidence       | Meaning                                                                                            | S06-a foundation                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Static**     | A named production boundary prevents the foreign access path                                       | `WorkspaceAccessService` denies non-members; Vault and Timeline use the boundary |
| **Runtime**    | An executed test demonstrates the denied attempt                                                   | S06-a uses Workspace A → attempt → Workspace B → denied cases                    |
| **Regression** | The denied scenario remains an ordinary automated test so a later change cannot reopen it silently | `workspace-isolation/` harness specs                                             |

The required proof story is:

```text
Workspace A
    ↓
attempt
    ↓
Workspace B
    ↓
Denied
    ↓
Regression test
```

One evidence type may establish a foundation claim. A matrix row is **PASS** at
S06 Close only when its required positive scope, negative cross-tenant, and
fail-closed proof are executed and retained as regression coverage.

---

## Negative Proof (binding)

S06 verifies what must **not** work, not only normal allowed paths. Negative
proof is mandatory for every matrix row and must use a real foreign workspace
or foreign identity rather than a mock that cannot cross a tenancy boundary.

S06-a establishes these regression examples:

| Negative attempt                       | Expected result                               | Evidence                      |
| -------------------------------------- | --------------------------------------------- | ----------------------------- |
| Workspace A substitutes Workspace B id | Denied; no accessible workspace is resolved   | Static + Runtime + Regression |
| Reader reads a Vault                   | Denied even in own workspace                  | Runtime + Regression          |
| Trader from A accesses Vault B         | Denied with the same Vault isolation boundary | Static + Runtime + Regression |
| Session B is resolved as operator A    | Denied; session remains user-bound            | Runtime + Regression          |
| Trader from A opens Timeline B         | Denied before the Timeline reader runs        | Static + Runtime + Regression |
| Incident A links Audit evidence B      | Denied; mixed-workspace evidence is refused   | Runtime + Regression          |

These examples are the S06-a foundation. They do **not** mark the
Authentication, Authorization, Vault, Audit, Timeline, Incident, or Security
Platform matrix rows PASS for package Close. S06-b through S06-e must complete
the row-level product-path evidence.

---

## Isolation Ownership (binding)

Each row has one accountable bounded-context owner. S06 verifies the owner’s
boundary; it does not take ownership away.

| Surface                               | Owner                                  |
| ------------------------------------- | -------------------------------------- |
| Authentication / identity binding     | Authentication                         |
| Sessions                              | Authentication                         |
| RBAC / People                         | Identity                               |
| Vault                                 | Vault                                  |
| Security Audit / Timeline / Incidents | Audit                                  |
| Security Platform hardening           | Platform                               |
| Workspace membership                  | Workspace / Identity                   |
| Future Connection Management          | Wave 2 Connection Management (not S06) |

---

## Isolation matrix

| Product surface                           | Owner                        | Proof required                                                                                                                                                      | Evidence                                                                                                                                       | Status             |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Authentication / identity binding         | Authentication               | A signed-in principal cannot act as another workspace operator; session resolution cannot leak cross-workspace subject binding                                      | Static: `AuthSessionStore` user binding · Runtime + Regression: foreign session denied                                                         | **PASS**           |
| Session                                   | Authentication               | A session cannot be resolved, listed, or used as another operator                                                                                                   | Static: owner-bound session lookup · Runtime + Regression: list/revoke caller-scoped; foreign session bind denied                              | **PASS**           |
| RBAC / People / role assignment           | Identity                     | Identity-global People and role assignment never substitute for Workspace membership; non-Admins cannot list or mutate People                                       | Static: role assignment mutates Identity role only · Runtime + Regression: role ≠ membership (`workspace-isolation.identity-coverage.spec.ts`) | **PASS**           |
| Vault secrets                             | Vault                        | A cannot read, list, unwrap, or lifecycle-operate B secrets                                                                                                         | Static: `VaultAccessControl` + workspace-scoped repository · Runtime + Regression: lifecycle deny and A-only list                              | **PASS**           |
| Security Audit store                      | Audit                        | Trusted emitter records remain attributed to their workspace; scoped reads never return another workspace records                                                   | Static: attributed `SecurityAuditService` + workspace-scoped `readTimeline` · Runtime + Regression: Vault → Audit → Timeline                   | **PASS**           |
| Timeline                                  | Audit                        | A timeline never includes B events; cursor cannot hop tenants                                                                                                       | Static: controller membership gate + workspace query · Runtime + Regression: foreign deny and B cursor isolation                               | **PASS**           |
| Incident / investigation                  | Audit                        | Workspace-bound incidents refuse mixed evidence; internal investigation/export assemble only linked same-workspace events; no customer HTTP caller exists in Wave 1 | Static: incident workspace/evidence-link boundary · Runtime + Regression: mixed evidence denied (`workspace-isolation.cross-product.spec.ts`)  | **PASS**           |
| Security Platform tenancy                 | Platform                     | Not applicable: Platform owns hardening, not workspace-scoped tenant state                                                                                          | V3-S04 Close hardening evidence; tenant isolation is owned by Authentication, Session, Vault, Audit, Timeline, and Workspace membership        | **NOT APPLICABLE** |
| Workspace membership / boundary           | Workspace / Identity         | Membership is the gate; foreign id substitution fails closed                                                                                                        | Static: `WorkspaceAccessService` · Runtime + Regression: A→B denied                                                                            | **PASS**           |
| Future Connection Management boundary     | Wave 2 Connection Management | Connections product is absent in Wave 1                                                                                                                             | Wave 2 only; no route or credential product exists to verify                                                                                   | **NOT APPLICABLE** |
| Wave 1 security route ownership inventory | Owning package of endpoint   | Every Wave 1 security-relevant route maps to an owning bounded context and a PASS or NOT APPLICABLE isolation row                                                   | [`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md) — no orphan security route                    | **PASS**           |

---

## PASS proof completeness (binding from S06-c)

Every **PASS** row is evidence-backed, not a status label: it names the owner,
the reason the boundary holds, Static/Runtime/Regression evidence, and a
negative regression.

| PASS surface                              | Owner                      | Reason                                                                                                                                                                                                         | Evidence                                                       | Negative regression                                                                                                               |
| ----------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentication / identity binding         | Authentication             | `AuthSessionStore` resolves a session only for its issued user; JWT validation returns that bound subject.                                                                                                     | Static owner-bound session resolution; Runtime + Regression.   | `workspace-isolation.identity-coverage.spec.ts`: B session cannot bind to A.                                                      |
| Session                                   | Authentication             | Session listing and revocation are scoped to the authenticated user.                                                                                                                                           | Static owner-bound lookup; Runtime + Regression.               | `workspace-isolation.identity-coverage.spec.ts`: A cannot list or revoke B sessions.                                              |
| RBAC / People / role assignment           | Identity                   | People is the approved S02 Identity-global Admin projection; role assignment changes Identity role and never grants Workspace membership.                                                                      | Static role/membership separation; Runtime + Regression.       | `workspace-isolation.identity-coverage.spec.ts`: Admin role cannot grant foreign workspace membership.                            |
| Vault secrets                             | Vault                      | `VaultAccessControl` verifies membership and C8 permission before every Vault operation; repository slots are workspace-scoped.                                                                                | Static access/repository boundary; Runtime + Regression.       | `workspace-isolation.vault-coverage.spec.ts`: A cannot list, read, unwrap, store, replace, revoke, or delete B secrets.           |
| Security Audit store                      | Audit                      | Trusted Vault emitters persist classified workspace attribution; `readTimeline` filters by workspace.                                                                                                          | Static attribution and query boundary; Runtime + Regression.   | `workspace-isolation.cross-product.spec.ts`: B Vault lifecycle records never appear in A Timeline, including with B cursor input. |
| Timeline                                  | Audit                      | Controller membership check runs before read and Timeline reads only the requested workspace.                                                                                                                  | Static controller/service boundary; Runtime + Regression.      | `workspace-isolation.cross-product.spec.ts`: A is denied before B Timeline read; B cursor cannot disclose B through A Timeline.   |
| Incident / investigation                  | Audit                      | Incident open and evidence attachment refuse mixed-workspace evidence; internal investigation/export assemble linked same-workspace events only. No customer HTTP investigation/export route exists in Wave 1. | Static workspace/evidence-link boundary; Runtime + Regression. | `workspace-isolation.cross-product.spec.ts`: Incident A cannot link Audit evidence B.                                             |
| Workspace membership / boundary           | Workspace / Identity       | `WorkspaceAccessService` verifies membership before resolving or authorizing a caller-supplied workspace ID.                                                                                                   | Static access service; Runtime + Regression.                   | `workspace-isolation.negative-proofs.spec.ts`: A→B workspace-ID substitution is denied.                                           |
| Wave 1 security route ownership inventory | Owning package of endpoint | The Close inventory maps every security-relevant Wave 1 route to an existing owner and a PASS/N/A matrix row.                                                                                                  | Documentation consistency + cross-reference review.            | [`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md): no orphan security route.       |

---

## Close completeness review (S06-f)

The approved Product Owner Resolution aligns all rows to **PASS** or honestly
**NOT APPLICABLE**. PASS rows above name existing evidence. NOT APPLICABLE rows
state an explicit reason:

| NOT APPLICABLE surface                | Reason                                                                                                                                               | Evidence reference                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Security Platform tenancy             | Platform owns hardening, not tenant state; tenancy is owned and proved by Authentication, Session, Vault, Audit, Timeline, and Workspace membership. | V3-S04 Close                       |
| Future Connection Management boundary | A Wave 2 product with no Wave 1 route or credential store.                                                                                           | Wave 2 deferral in the Master Plan |

This matrix is evidence-ready for Product Owner review. It does not itself mark
V3-S06 CLOSED or commission the independent Wave 1 Certification Audit.

---

## Proof standard (binding for S06)

For each matrix row, Close-quality proof must show all of:

1. **Positive scope** — allowed caller in Workspace A sees only Workspace A data for that surface.
2. **Negative cross-tenant** — same caller (or attacker with Workspace A credentials) **cannot** obtain Workspace B identifiers, payloads, lists, exports, or side-channels that disclose B’s existence beyond honest deny policy.
3. **Fail closed** — missing/wrong workspace context denies; it does not fall open to “all” or “first match.”
4. **No assumption credit** — prior package Close does not substitute for an S06 isolation evidence row.

---

## Explicit non-goals of this matrix

- Not implementation of S06.
- Not monitoring, analytics, or alerting.
- Not Wave 2 Connections / live trading isolation.
- Not claiming Wave 1 Exit.
- Not rewriting Auth, Vault, or Audit ownership.

---

## S06-a harness (code)

Executable matrix contract and fixtures live under
`apps/api/src/modules/workspace-isolation/`:

| Artifact                                      | Role                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `isolation-matrix-contract.ts`                | Canonical matrix rows; execution status `pending` / `wired` only in S06-a |
| `dual-workspace.fixture.ts`                   | Distinct workspaces A and B with distinct operators                       |
| `negative-proof.ts`                           | Shared deny helpers for regression tests                                  |
| `workspace-isolation.matrix.spec.ts`          | Contract completeness + fixture smoke                                     |
| `workspace-isolation.negative-proofs.spec.ts` | Wired negative-proof regression examples                                  |

## Recommended S06 use

1. Turn each matrix row into an isolation suite case (or case family).
2. Add any new endpoint discovered during S06 to the matrix before claiming coverage.
3. Package Close for S06 only when every ✅ planning row has executed ⏳ proof with **PASS**.

---

## STOP

This document is planning only. **Do not start V3-S06 implementation** until Product Owner Approves [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md). Wave 1 Exit also requires [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md) and the Wave 1 Certification Audit after S06 Close.
