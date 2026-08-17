# V3-S02-e Implementation Report

**Package:** V3-S02 RBAC Product
**Slice:** S02-e — Privilege Constraints & Authorization Events
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)
**Overview:** [`authorization-events-overview.md`](./authorization-events-overview.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S02-e only**. Implementation slices S02-a … S02-e are done. V3-S02 is **not** Closed. Product Owner review is required before Package Close. V3-S03 was not started.

---

## What shipped

Role changes and C6 refusals are recorded as structured application events on the existing Logger. Privilege constraints are evidenced: role assignment is not workspace membership; Admin cannot skip Gate or Risk; later-wave products did not appear. An Administrator who tries to change their own role in People is denied and sees a clear explanation.

| Behavior                 | Result                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Role-change event        | Assigned: actor, subject, from role, to role. Workspace id omitted when unknown. No secrets               |
| Denied role-change event | Self-role and last-Admin refusals recorded with reason                                                    |
| C6 deny event            | Authenticated missing-permission on Role admin recorded. Other permission denials are not this event      |
| Existing event model     | Same Logger pattern as sign-in events. No new event store. No Events product. No S05 UI                   |
| Horizontal constraint    | Assigning Admin does not add membership of another person’s workspace                                     |
| Gate / Risk              | Admin still has no Bypass. People adds no skip. Runtime Validation still has no overrides                 |
| Later-wave leak          | People, catalog, and shell still omit vault, invites, billing, API keys, live                             |
| Own-role walkthrough     | People lets the Administrator confirm a self-change; Identity refuses; the page shows a clear explanation |

---

## Files touched (this slice)

| Area                    | Path                                                 |
| ----------------------- | ---------------------------------------------------- |
| Event helpers           | `apps/api/src/modules/auth/authorization-events.ts`  |
| C6 deny recording       | `apps/api/src/modules/auth/roles.guard.ts`           |
| Role-change recording   | `apps/api/src/modules/identity/people.controller.ts` |
| People own-role journey | `apps/web/src/pages/PeoplePage.tsx`                  |

Tests: `authorization-events.spec.ts`, `roles.guard.spec.ts` C6 vs other denials, `people.http.spec.ts` assigned / self / last-Admin / C6, `privilege-constraints.spec.ts`, `PeoplePage.spec.tsx` own-role try → deny → explanation, pc19/pc20 leaked products.

No new bounded context. No new Source of Truth. No Version 2 document edits. No Master Plan edit. No V3-S03 code.

---

## Done-when (package slice)

From the Implementation Package S02-e:

| Criterion                                                                   | Result  |
| --------------------------------------------------------------------------- | ------- |
| Horizontal access tests (role assign ≠ workspace membership)                | **Met** |
| Structured logs for role change and C6 deny (no secrets)                    | **Met** |
| Admin cannot skip Gate / Risk                                               | **Met** |
| No leaked later-wave UI                                                     | **Met** |
| Architecture: Authn, Identity role, Workspace membership still three owners | **Met** |
| Must not: Audit product UI (S05); isolation product rewrite (S06); ABAC     | **Met** |

---

## Honest limitations

- Events are structured logs for a later security history. Operators do not search them in the product.
- Workspace id is recorded only when known. People role assignment is Identity-global, so that field is omitted on this path.
- Package Close still needs Product Owner review and the live J3-02 recording (second-browser Reader/Trader pass).
- First Administrator remains host bootstrap.

---

## Mandatory questions

1. **What did the customer receive?**
   Attributable role changes and C6 refusals. Privilege constraints that keep Admin from skipping Gate/Risk and from treating a role as another person’s workspace. In People, trying to change your own role is denied with a clear explanation.

2. **What did the customer NOT receive?**
   A security-history page; new permissions or roles; role hierarchy; workspace invitations; vault; connection management; exchange permissions; live authorization; ABAC; S05 audit product; S06 isolation rewrite.

3. **What business problem was solved?**
   Role changes were not fully auditable, and privilege decisions were not traceable. The platform now records those decisions without pretending an audit product shipped.

4. **Is V3-S02 now complete?**
   **Implementation slices S02-a … S02-e are complete.** The package is **not Closed**. Stop for Product Owner review before Package Close.

5. **Which package becomes available next?**
   **V3-S03 Secret Vault & Encryption**, starting at Implementation Package — not at code — and only after V3-S02 is Closed.

6. **Was the Master Plan respected?**
   **Yes.** Wave 1 SEC-02 / SEC-03 RBAC only. No Master Plan edit. No Version 2 edit. No S03 start.

7. **Were Product Principles respected?**
   **Yes.** Security before convenience (own-role still refused). Honest Product (refusal is on screen). Everything Is Auditable at the log layer without claiming S05. Paper First and Live Must Be Earned unchanged.

8. **Were any architectural deviations introduced?**
   **No.** Identity still owns roles. RBAC still authorizes. Authorization events record decisions on the existing Logger. No new bounded context. No new Source of Truth.

---

## Remaining S02 work

| Slice                                                | Status                                   |
| ---------------------------------------------------- | ---------------------------------------- |
| S02-a … S02-d                                        | Accepted                                 |
| S02-e Privilege constraints and authorization events | Implemented (this slice)                 |
| Package Close                                        | **Not started** — wait for Product Owner |

---

## Next

**STOP.** Wait for Product Owner review before V3-S02 Package Close. Do not begin V3-S03.

**End of S02-e Implementation Report.**
