# V3-S02-a Validation Report

**Package:** V3-S02 RBAC Product  
**Slice:** S02-a — Permission Model  
**Date:** 2026-08-16  
**Nature:** Slice validation evidence. Not package Close. Not an RC. Not an ADR.  
**Plan:** [`v3-s02-validation-plan.md`](./v3-s02-validation-plan.md) (unmodified; executed only for S02-a rows)

---

## Verdict

**PASS for S02-a.** The C0–C9 matrix is encoded. Default deny holds for the decision service. Reader ⊄ C4/C5/C6; Researcher ⊄ C5/C6; Trader ⊄ C6; all roles ⊄ C7/C8/C9. No inheritance engine. Register default remains Researcher. Guard integration honors `@RequirePermission`. Paper command authorization still matches US158.

V3-S02 **cannot Close** on this evidence.

---

## 1. Unit tests (S02-a)

| Area                                                | Plan requirement                                                                               | Result                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Permission matrix                                   | Reader denied C4/C5/C6; Researcher denied C5/C6; Trader denied C6; all roles denied C7/C9      | **PASS** — `permission-matrix.spec.ts`, `authorization-decision.service.spec.ts`                          |
| No inheritance engine                               | Tests do not pass because `Admin includes Trader`                                              | **PASS** — Admin C5 is a listed cell; source is not `...TRADER_ALLOWS`                                    |
| Default role                                        | `UserDomainService.create` without role → Researcher                                           | **PASS** — `user-domain.service.spec.ts`                                                                  |
| Command authorization                               | Trader/Admin paper gate still holds; Researcher cannot issue trading commands                  | **PASS** — `command-authorization.service.spec.ts`, `us179-contract-state-authorization.spec.ts`          |
| RolesGuard                                          | Wrong role denied when metadata present; `@RequirePermission` fail-closed; unknown role denied | **PASS** — `roles.guard.spec.ts`                                                                          |
| JWT hint                                            | Authorization uses Identity role, not a caller-supplied role field                             | **PASS** — decision service takes the role value already re-resolved by S01; no JWT parse in the matrix   |
| Workspace membership                                | Role does not bypass membership                                                                | **PASS** — `not_member` on C5 for Admin when `workspaceMember: false`; US158 cross-workspace still denied |
| Role assignment / last Admin / self-escalation HTTP | —                                                                                              | **NOT RUN** — S02-c                                                                                       |
| Missing `@Roles` gone on remaining C4+ routes       | —                                                                                              | **NOT RUN** — S02-b                                                                                       |

Command: `pnpm --filter @trp/api exec vitest run` on the S02-a files plus Identity default-role and US179 — **48 passed**. Full `src/modules/auth` suite remains green (S01 unregressed).

## 2. Integration tests (S02-a)

| Case                                                            | Result                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Assign role survives restart                                    | **NOT RUN** — S02-c                                                                    |
| Vertical HTTP (Reader certify, Researcher paper, Trader assign) | **NOT RUN** — S02-b / S02-c                                                            |
| Horizontal HTTP                                                 | **NOT RUN** — S02-e                                                                    |
| C6 HTTP People/role                                             | **NOT RUN** — S02-c                                                                    |
| Live mutations bound on HTTP                                    | **NOT RUN** — S02-b                                                                    |
| US158 paper command + membership                                | **PASS** — existing command authorization + US179 still green                          |
| S01 unregressed                                                 | **PASS** — full `src/modules/auth` suite green (register, lockout, sessions, recovery) |
| Public surface                                                  | **PASS** — no new public routes                                                        |

## 3. UI tests (S02-a)

| Case                     | Result                          |
| ------------------------ | ------------------------------- |
| People page              | **NOT RUN** — S02-d             |
| Navigation / catalog     | **NOT RUN** — S02-d             |
| No leaked later products | **PASS** — no web files changed |
| Shell regression         | **PASS** — web untouched        |

## 4. Manual product walkthrough

```text
Permission Model Walkthrough (S02-a)

□ Authorized action succeeds          PASS
□ Missing permission denied           PASS
□ Unknown permission denied           PASS
□ Unknown role denied                 PASS
□ Unauthorized action denied          PASS

PASS
```

Not executed in a live browser. This slice has no UI. Evidence: `authorization-decision.service.spec.ts` describe block **Permission model walkthrough (V3-S02-a)** against the real `AuthorizationDecisionService`.

Full J3-02 RBAC Walkthrough remains for package Close after S02-d.

## 5. Security verification (slice)

| Check                      | Result                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| Privilege escalation       | **PASS** for policy — lower roles cannot obtain C5/C6/C7/C9. Assign API is S02-c             |
| Vertical access            | **PASS** for matrix cells. Remaining HTTP is S02-b                                           |
| Horizontal access          | **PASS** for ownership-wins on workspace-scoped classes. People HTTP is S02-c                |
| Permission inheritance     | **PASS** — none                                                                              |
| Role confusion             | **PASS** — four roles; C9 empty                                                              |
| Default-deny               | **PASS** for the decision service and `@RequirePermission`. Unclassified routes remain S02-b |
| JWT hint                   | **PASS** — matrix does not read JWT                                                          |
| Last Admin                 | **NOT RUN** — S02-c                                                                          |
| Secrets                    | **PASS** — none in this slice                                                                |
| CSRF                       | **NOT RUN** — no new mutations                                                               |
| Enumeration                | **NOT RUN** — no People API                                                                  |
| MFA / vault / live theater | **PASS** — none                                                                              |
| Seed                       | **PASS** — login form untouched                                                              |

See [`v3-s02-a-security-review.md`](./v3-s02-a-security-review.md) for STRIDE, Timing Assessment, and Abuse Assessment.

## 6. Architecture verification (slice)

See [`v3-s02-a-architecture-review.md`](./v3-s02-a-architecture-review.md). Authorization decision remains existing Auth. Role store remains Identity. Membership remains Workspace. No new bounded context.

## 7. Customer acceptance

Not requested for package Close. Slice-level: a reviewer can see that authorized actions succeed and every fail-closed case in the S02-a walkthrough is denied.

Master Plan S02 checkboxes (Admin assigns role in the product; J3-02) remain **unchecked**.

## 8. Close criteria

| Gate                                                          | Result                                       |
| ------------------------------------------------------------- | -------------------------------------------- |
| Slices S02-a … S02-e merged                                   | **NOT DONE** — only S02-a                    |
| Unit / integration / UI for the **package**                   | **NOT DONE**                                 |
| Manual J3-02 walkthrough recorded                             | **NOT DONE** — S02-a policy walkthrough only |
| Architecture / Security / Product reviews for the **package** | Slice reviews only                           |
| Honest limitations recorded                                   | **PASS** — implementation report             |
| No Master Plan change                                         | **PASS**                                     |

---

## Package Summary Standard (S02-a answers)

These answers are for **this slice**. They are not a V3-S02 Close.

1. **What did the customer receive?**  
   A server-side permission model: catalog C0–C9, explicit role mapping, authorization decision service, default deny, and guard integration. The platform can consistently decide who may perform which action. No visible UI change.

2. **What did the customer NOT receive?**  
   People management UI, role assignment UI, workspace invitations, Credential Vault, Connection Management, exchange permissions, live trading authorization, HTTP coverage of remaining TD-006 surfaces, last-Admin protection, or authorization event logs.

3. **What business problem was solved?**  
   Privilege was scattered (hard-coded trading roles, allow-by-omission elsewhere) and could not be reasoned about as one product policy. That policy now exists and fail-closes.

4. **What remains?**  
   S02-b surface coverage; S02-c role assignment API; S02-d People product; S02-e privilege constraints and authorization events. Then V3-S03.

5. **Which slice becomes available next?**  
   **S02-b Surface coverage (TD-006 remainder).** Not V3-S03.

6. **Was the Master Plan respected?**  
   **Yes.** Permission model only. No new bounded context. No People product. No live capital. No Master Plan edit.

7. **Were Product Principles respected?**  
   **Yes.** Security Before Convenience, One Source of Truth, Honest Product, Live Must Be Earned, and Architecture Is a Constraint were applied.

8. **Were any architectural deviations introduced?**  
   **No.**

---

**STOP.** Wait for review before beginning S02-b Surface coverage.

**End of S02-a Validation Report.**
