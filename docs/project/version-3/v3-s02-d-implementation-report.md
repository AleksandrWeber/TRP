# V3-S02-d Implementation Report

**Package:** V3-S02 RBAC Product
**Slice:** S02-d — People Product
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)
**Overview:** [`people-product-overview.md`](./people-product-overview.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S02-d only**. S02-e was not started. V3-S02 is not Closed.

---

## What shipped

Administrators assign roles in the signed-in product. People is a projection over the approved Role Assignment API. Non-administrators who open People see an honest unavailable state — not a fake empty directory.

| Behavior                   | Result                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| People page                | Administration → People in the existing paper-first shell                                     |
| User list and current role | Display name, email, current role. Signed-in Administrator marked **You**                     |
| Change role                | Four roles only. Confirmation before the change. Immediate success copy                       |
| Invalid role               | Select lists only Reader / Researcher / Trader / Administrator. Server still rejects unknowns |
| Self-role restriction      | An Administrator cannot change their own role (API + UI). Last-Admin is not enough for this   |
| Last-Admin                 | Honest failure: “Cannot change the last active Administrator.”                                |
| Unauthorized               | Non-Admin: “People is unavailable” / “only available to Administrators.” No operator list     |
| Owners                     | UI is not Source of Truth. Identity still owns `User.role`. Authz still C6                    |

---

## Self-role (business protection)

Last Active Admin prevents leaving the host with zero Administrators. It does **not** stop an Administrator from removing their own Admin role when another Administrator exists.

S02-d security requires “Self-role restrictions respected.” The protection is:

**An operator cannot change their own role.**

Enforced in Identity (`assignRole` with the signed-in actor) so the People page cannot be bypassed. HTTP 409: “You cannot change your own role.” The signed-in row has no change control.

Structured audit events remain **S02-e**.

---

## Files touched (this slice)

| Area                 | Path                                                               |
| -------------------- | ------------------------------------------------------------------ |
| People page          | `apps/web/src/pages/PeoplePage.tsx`, `peopleProduct.ts`            |
| Catalog / shell      | `apps/web/src/shared/product-ui/catalog.ts`, `app/App.tsx`         |
| API client           | `apps/web/src/shared/api.ts` (`listPeople`, `assignPersonRole`)    |
| Error copy           | `apps/web/src/shared/mapApiError.ts`                               |
| Self-role (Identity) | `user-domain.service.ts`, `role-assignment.errors.ts`, People HTTP |

Tests: People panel (Admin list, confirmation, forbidden, last-Admin copy); peopleProduct roles; pc19/pc20/AppLayout; Identity self-role unit + HTTP; mapHttpError.

No new bounded context. No People UI pretending invites. No Version 2 document edits. No Master Plan edit.

---

## Done-when (package slice)

From the Implementation Package S02-d:

| Criterion                                                                                    | Result  |
| -------------------------------------------------------------------------------------------- | ------- |
| Customer-visible People in existing Administration chrome                                    | **Met** |
| Admin lists operators, sees current role, assigns least privilege                            | **Met** |
| Non-Admin sees honest forbidden/unavailable — not a fake empty directory                     | **Met** |
| Reuse `AppLayout`                                                                            | **Met** |
| Copy is operator language                                                                    | **Met** |
| Must not: new shell; live/vault/connections/billing/API keys; team invites labeled as People | **Met** |

---

## Honest limitations

- First Administrator remains host bootstrap. After that, People is the customer path.
- Membership remains owner-only until Wave 9. People is not invitations.
- Structured role-change events are **S02-e**.
- Horizontal suite, Gate/Risk non-bypass, leaked-later-product package checks complete in **S02-e**.
- J3-02 full walkthrough (sign in as the assigned Reader/Trader in a second browser) is recorded at component level here; package Close still needs the manual walkthrough.

---

## Remaining S02 slices

| Slice                                                | Status                   |
| ---------------------------------------------------- | ------------------------ |
| S02-a … S02-c                                        | Accepted                 |
| S02-d People product                                 | Implemented (this slice) |
| S02-e Privilege constraints and authorization events | Not started              |

---

## Next

**S02-e Privilege constraints and authorization events.** Not V3-S03.

**STOP.** Wait for Product Owner review before beginning V3-S02-e.

**End of S02-d Implementation Report.**
