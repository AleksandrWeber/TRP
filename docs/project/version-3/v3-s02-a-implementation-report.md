# V3-S02-a Implementation Report

**Package:** V3-S02 RBAC Product  
**Slice:** S02-a — Permission Model  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Status:** Slice implemented — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Package:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)  
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S02-a only**. S02-b through S02-e were not started. V3-S02 is not Closed.

---

## What shipped

The platform can now decide **who may perform which action** from a single server-side policy. Authentication still proves identity. Identity still stores `User.role`. Workspace still owns membership. Authorization only decides.

| Behavior                       | Result                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permission catalog             | Classes **C0–C9** named and resolvable. Unknown identifiers are not in the catalog                                                                                 |
| Role → permission mapping      | Explicit allow lists for Reader, Researcher, Trader, Admin. No inheritance engine                                                                                  |
| Permission resolution          | Catalog lookup only. Unknown action / unknown permission → deny                                                                                                    |
| Authorization decision service | Default deny, explicit allow, additive listed cells, ownership always wins                                                                                         |
| Fail closed                    | Unknown role, unknown permission, unknown action, missing permission → denied                                                                                      |
| Guard integration              | `RolesGuard` honors `@RequirePermission`. Existing `@Roles` kept. Unknown roles denied. Unclassified routes still allow a known authenticated role until **S02-b** |
| Paper command gate             | `CommandAuthorizationService` uses the C5 cell, then Workspace membership                                                                                          |
| Default register role          | Still **Researcher**                                                                                                                                               |
| UI                             | **Unchanged** — no People, no role assignment, no new chrome                                                                                                       |

---

## Files touched

| Area               | Path                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| Catalog            | `apps/api/src/modules/auth/permission-catalog.ts`                                 |
| Matrix             | `apps/api/src/modules/auth/permission-matrix.ts`                                  |
| Decision           | `apps/api/src/modules/auth/authorization-decision.ts`                             |
| Decision service   | `apps/api/src/modules/auth/authorization-decision.service.ts`                     |
| Decorator          | `apps/api/src/modules/auth/decorators/require-permission.decorator.ts`            |
| Guard              | `apps/api/src/modules/auth/roles.guard.ts`                                        |
| Paper command gate | `apps/api/src/modules/auth/command-authorization.service.ts`                      |
| Auth module        | `apps/api/src/modules/auth/auth.module.ts`                                        |
| Known-role helper  | `apps/api/src/modules/identity/role.ts`, `apps/api/src/modules/identity/index.ts` |

Tests: `permission-catalog.spec.ts`, `permission-matrix.spec.ts`, `authorization-decision.service.spec.ts` (includes the slice walkthrough), `roles.guard.spec.ts`, `command-authorization.service.spec.ts`, `role.spec.ts`. Existing `user-domain.service.spec.ts` still proves default Researcher.

---

## Done-when (package slice)

From the Implementation Package S02-a:

| Criterion                           | Result                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| Reader ⊄ C4/C5/C6                   | **Met**                                                       |
| Researcher ⊄ C5/C6                  | **Met**                                                       |
| Trader ⊄ C6                         | **Met**                                                       |
| All roles ⊄ C7/C9 (and C8)          | **Met**                                                       |
| No inheritance engine               | **Met** — Admin C5 is a listed cell; Admin is not `...Trader` |
| Register default still Researcher   | **Met**                                                       |
| Fixture users of each role in tests | **Met**                                                       |
| No People UI                        | **Met**                                                       |

---

## Honest limitations

- Remaining product HTTP surfaces are **not** classified in this slice. That is **S02-b**. `RolesGuard` still allows a known authenticated role when neither `@Roles` nor `@RequirePermission` is set.
- Role-assignment HTTP, last-Admin protection, and People UI are **S02-c / S02-d**.
- Horizontal membership tests beyond the existing US158 workspace gate are **S02-e**.
- C7 live mutations are denied by the matrix. Existing live HTTP routes are not yet bound to `@RequirePermission(LiveCommand)` — **S02-b**.
- JWT `role` remains a hint. Identity re-resolution is unchanged from S01.

---

## What this slice did not do

| Item                                                 | Result                  |
| ---------------------------------------------------- | ----------------------- |
| S02-b Surface coverage (TD-006 remainder)            | Not started             |
| S02-c Role assignment API                            | Not started             |
| S02-d People product                                 | Not started             |
| S02-e Privilege constraints and authorization events | Not started             |
| Vault / connections / billing / API keys             | Out of package          |
| Live trading authorization product                   | Out of package (Wave 6) |
| Team invites / membership table                      | Out of package (Wave 9) |
| New IAM bounded context                              | Not created             |
| Version 2 documents                                  | Unmodified              |
| Master Plan / Policy / Template                      | Unmodified              |
| RC / ADR                                             | None                    |

---

## Next slice (not this task)

**S02-b Surface coverage (TD-006 remainder).**

Do not start it in this task.

---

**STOP.** Wait for review before beginning S02-b.

**End of S02-a Implementation Report.**
