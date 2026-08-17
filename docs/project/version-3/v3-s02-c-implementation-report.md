# V3-S02-c Implementation Report

**Package:** V3-S02 RBAC Product
**Slice:** S02-c — Role Assignment API
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S02-c only**. S02-d and S02-e were not started. V3-S02 is not Closed.

---

## What shipped

Authorized Administrators can change a user's role through the product API. Identity persists the four existing roles. The new role is in force on the next authenticated request (`/me` reloads Identity; JWT `role` remains a hint).

| Behavior                 | Result                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Admin assigns a role     | `PATCH /v1/people/:userId/role` with `{ role }` — canonical `Role` enum only                     |
| Role changes immediately | Identity cache + repository write; `/me` returns the new role without re-login                   |
| Survives restart         | Prisma User row is the durable store; a new `UserDomainService` hydrates the assigned role       |
| Unauthorized assignment  | Non-Admin → 403. Unauthenticated → 401                                                           |
| Invalid role             | Unknown role / extra fields → 400                                                                |
| Last-Admin               | Demoting the last Active Admin → 409 “Cannot change the last active Administrator.”              |
| Self-escalation          | Reader / Researcher / Trader cannot assign any role, including their own                         |
| Horizontal non-bypass    | Assigning a role does not add workspace membership                                               |
| Audit events             | **Not in this slice.** Structured role-change and C6 deny logs are **S02-e** per the package     |
| UI                       | **Unchanged** — no People page                                                                   |
| Owners                   | Authentication owns sessions. Identity owns `User.role`. Workspace owns membership. RBAC decides |

---

## Files touched (this slice)

| Area                   | Path                                                      |
| ---------------------- | --------------------------------------------------------- |
| Role assignment domain | `apps/api/src/modules/identity/user-domain.service.ts`    |
| Domain errors          | `apps/api/src/modules/identity/role-assignment.errors.ts` |
| People HTTP transport  | `apps/api/src/modules/identity/people.controller.ts`      |
| Identity module        | `apps/api/src/modules/identity/identity.module.ts`        |
| DTOs                   | `apps/api/src/validation/dto/people.dto.ts`               |
| Surface inventory      | `apps/api/src/modules/auth/surface-coverage.spec.ts`      |

Tests: `user-domain.service.spec.ts`, `people.http.spec.ts`, `role-assignment.membership.spec.ts`, `role-assignment.persistence.integration.spec.ts`, CSRF People mutation, `/me` after assign, surface-coverage C6 classification.

No new roles. No new permission classes. No People UI. No Version 2 document edits. No Master Plan edit.

---

## Endpoints (transport only)

| Method | Path                      | Permission    | Who        |
| ------ | ------------------------- | ------------- | ---------- |
| GET    | `/v1/people`              | C6 Role admin | Admin only |
| PATCH  | `/v1/people/:userId/role` | C6 Role admin | Admin only |

List returns `{ operators: [{ id, email, displayName, role, status }] }`. Assignment returns the same operator view. No passwords, tokens, or hashes.

---

## Done-when (package slice)

From the Implementation Package S02-c:

| Criterion                                                                   | Result                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------- |
| Admin-only HTTP to assign Reader / Researcher / Trader / Admin              | **Met**                                        |
| Identity persists the role                                                  | **Met**                                        |
| Last-Admin protection                                                       | **Met** — Active Admins only                   |
| No self-escalation                                                          | **Met** — C6 403 before Identity               |
| JWT role remains a hint                                                     | **Met** — `/me` reloads Identity               |
| Admin assign survives restart                                               | **Met** — Prisma hydrate                       |
| Non-Admin 403                                                               | **Met**                                        |
| CSRF applies (S01 cookie transport)                                         | **Met** — People PATCH is not in the skip list |
| Must not: disable-user; invites; password change; force-logout; seed as API | **Met**                                        |

---

## Authorization Philosophy

| Rule                  | How this slice holds it                                        |
| --------------------- | -------------------------------------------------------------- |
| Default deny          | People routes are C6. Unclassified still denied by S02-b guard |
| Explicit allow        | Only Admin has C6 in the matrix                                |
| Least privilege       | Reader / Researcher / Trader cannot assign                     |
| Additive permissions  | No hierarchy. Admin C6 is a listed cell                        |
| Ownership always wins | Role assign does not grant workspace membership                |
| Fail closed           | Unknown role rejected. Last Admin refused. Missing user 404    |

---

## Audit events — not moved from S02-e

The approved package places **structured logs for role change and C6 deny (no secrets)** in **S02-e**, not S02-c.

S02-c done-when does not include event emission. The Product Owner asked to form audit events in S02-c **only if the plan already put them here**. It does not. They were not implemented and were not brought forward.

What this slice still leaves ready for S02-e:

- Identity is the only role store; old and new role are knowable at assignment time.
- The HTTP caller is an authenticated Admin session (S01).
- C6 deny already happens in `RolesGuard` with an explicit decision reason.

This slice does **not** claim the audit product (V3-S05).

---

## Honest limitations

- First Admin remains host bootstrap (PC-18 / S01). This API is how customers stay Admin afterward. People UI is **S02-d**.
- Membership remains owner-only until Wave 9. Assigning Admin does not invite a teammate.
- Structured role-change events are **S02-e**.
- Horizontal suite, Gate/Risk non-bypass confirmation, and leaked-later-product checks are **S02-e**.
- Unbounded People list size is a later OWASP/platform concern (**V3-S04**). Wave 1 operator counts are small.
- `UserDomainService.update({ role })` still exists for non-HTTP callers and now enforces last-Admin / known-role. Product assignment is the People PATCH.

---

## Remaining S02 slices

| Slice                                                | Status                   |
| ---------------------------------------------------- | ------------------------ |
| S02-a Permission Model                               | Accepted                 |
| S02-b Surface Coverage                               | Accepted                 |
| S02-c Role assignment API                            | Implemented (this slice) |
| S02-d People product                                 | Not started              |
| S02-e Privilege constraints and authorization events | Not started              |

---

## Next

**S02-d People product.** Customer-visible People in the existing Administration chrome. Not V3-S03.

**STOP.** Wait for Product Owner review before beginning V3-S02-d People Product.

**End of S02-c Implementation Report.**
