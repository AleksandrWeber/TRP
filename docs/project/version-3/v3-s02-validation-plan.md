# V3-S02 Validation Plan

**Package:** V3-S02 RBAC Product  
**Wave:** 1 — Security Foundation  
**Status:** Planning — **not** executed  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Scope:** [`v3-s02-product-scope.md`](./v3-s02-product-scope.md)  
**Security:** [`v3-s02-security-review.md`](./v3-s02-security-review.md)  
**Umbrella:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)  
**Checklists:** [`version-3-product-checklist.md`](./version-3-product-checklist.md) · [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) · [`version-3-security-checklist.md`](./version-3-security-checklist.md)

Validation runs after implementation and the implementation report. This package is **not Closed** until every section below has a recorded result.

Tests that mock the customer outcome (for example: a unit test that asserts a matrix object but never hits HTTP, or a UI test that stubs “forbidden”) do **not** count as Close evidence for customer acceptance.

---

## 1. Unit tests

Extend existing Identity / Authz specs; do not replace them. Do not rewrite certified PC-18 / US158 tests; add coverage.

| Area                   | Must prove                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default role           | `UserDomainService.create` without role → Researcher. Client cannot create Admin through the product register path.                                      |
| Role assignment policy | Only Admin callers authorized to change role. Reader / Researcher / Trader denied.                                                                       |
| Last Admin             | Demoting or changing the last Active Admin fails. A second Admin can be demoted.                                                                         |
| Self-escalation        | A non-Admin update of `role` on self fails.                                                                                                              |
| Permission matrix      | Reader denied C4/C5/C6; Researcher denied C5/C6; Trader denied C6; all roles denied C7/C9.                                                               |
| No inheritance engine  | Tests do not pass because `Admin includes Trader`. Each class is explicit.                                                                               |
| Command authorization  | Existing Trader/Admin paper gate still holds; Researcher still cannot issue trading commands (`command-authorization.service.spec.ts`).                  |
| RolesGuard             | Missing `@Roles` must not be the remaining product stance on C4+ routes this package classifies. Guard still denies wrong role when metadata is present. |
| JWT hint               | Authorization uses re-resolved Identity role, not a caller-supplied role field.                                                                          |
| Workspace membership   | Role change does not alter `WorkspaceAccessService.isMember`.                                                                                            |

Primary files today: `command-authorization.service.spec.ts`, `roles.guard.spec.ts`, `user-domain.service.spec.ts`, `prisma-role.mapping.spec.ts`. New policy/assignment specs live next to those owners.

---

## 2. Integration tests

Prisma-backed tests (same pattern as PC-18 identity persistence and US158 command authorization).

| Case                         | Must prove                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Assign role survives restart | Admin assigns Trader; after process restart, Identity role is Trader and paper command is allowed for that user in **their** workspace.   |
| Vertical HTTP                | Reader certify/campaign → forbidden. Researcher paper session start / place order → forbidden. Trader role-assign → forbidden.            |
| Horizontal HTTP              | User A (any role) cannot mutate workspace B. Admin role-assign does not add User B as member of Admin’s workspace.                        |
| C6 HTTP                      | `GET`/`PATCH` (or equivalent) People/role routes: Admin 2xx on happy path; non-Admin 403. Unauthenticated 401.                            |
| Last Admin HTTP              | Demote last Admin → 4xx honest product error; at least one Admin remains.                                                                 |
| Live mutations               | In-scope live command routes remain denied as a product (C7). Live UI not enabled.                                                        |
| Workspace header             | Authorized `X-Workspace-Id` still required. Unknown/foreign id does not leak.                                                             |
| S01 unregressed              | Register, login, recover, session revoke still work. `/me` shows assigned role after re-auth or subsequent request using Identity reload. |
| Gate/Risk                    | Admin cannot skip a failed Gate or Risk decision through any new S02 route.                                                               |
| Public surface               | Register/login/recover remain `@Public()`. People/role routes are not.                                                                    |

---

## 3. UI tests

Frontend unit/component tests plus existing shell specs (`pc19`, `pc20`, `AppLayout`).

| Case                     | Must prove                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| People page (Admin)      | Lists operators; shows current role; assign control for the four roles; success and honest failure (last Admin). |
| People page (non-Admin)  | Forbidden / unavailable honest state. Not a fake empty “no people yet” that implies the directory loaded.        |
| Navigation               | People lives in the existing paper-first shell (Administration). Not a new chrome product.                       |
| Copy                     | Operator language. No JWT / Prisma / slice IDs on the happy path.                                                |
| No leaked later products | No vault, connection wizard, billing, API keys, live trading, or invite-teammate.                                |
| Shell regression         | Sign-in sessions and Password remain. Logout still server logout.                                                |
| J-01                     | Certified paper-first path still reachable for Researcher (research) and Trader (paper).                         |

Do not require a full Playwright rewrite of J-02…J-14. Do require J-01 still passes and J3-02 is covered at component or e2e smoke level.

---

## 4. Manual product walkthrough

Perform as an ordinary operator. **No SSH. No customer `.env`. No SQL.**

This is not a unit test. This is not an integration test. This is not a UI test.

```text
RBAC Walkthrough (J3-02)

□ Sign in as Administrator (host-bootstrap Admin, not a shared customer password on the form)
□ Open People in the signed-in shell
□ See operators and current roles
□ Assign Reader to an operator
□ Sign in as that Reader (or use a second browser)
□ Confirm projections are available
□ Confirm research / paper start is refused
□ Assign Researcher; confirm research works and paper start is refused
□ Assign Trader; confirm paper commands work and People / role assign is refused
□ As Trader, attempt to assign Admin to self — refused
□ As Admin, attempt to demote the last Administrator — refused
□ Confirm Gate / Risk still bind (Admin cannot skip)
□ Confirm no live trading, vault, connections, billing, or API keys
□ Confirm no SSH, customer .env, or database edit was used

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Record pass/fail in the package closeout. Any SSH or database step is an automatic fail of Customer First.

Host-bootstrap Admin (engineer seed) may be how the walkthrough **starts**. It must not be how customers are told to stay Admin. After the first assignment, the product path is People.

---

## 5. Security verification

| Check                      | Pass                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Privilege escalation       | Non-Admin cannot change any role including self                                     |
| Vertical access            | Matrix C4/C5/C6/C7 holds on HTTP                                                    |
| Horizontal access          | Role assign ≠ workspace membership; foreign workspace denied                        |
| Permission inheritance     | No hierarchy module; explicit matrix tests                                          |
| Role confusion             | Only four roles; Admin is not “unrestricted”; no Gate/Risk bypass                   |
| Default-deny               | In-scope C4+ mutating routes declare roles; allow-by-omission gone for those routes |
| JWT hint                   | Stale/forged role claim does not authorize                                          |
| Last Admin                 | Cannot leave zero Active Admins                                                     |
| Secrets                    | No password, token, or hash in People responses or logs                             |
| CSRF                       | Cookie-authenticated role mutation rejected if forged cross-site                    |
| Enumeration                | Non-Admin cannot probe user existence via People                                    |
| MFA / vault / live theater | None                                                                                |
| Seed                       | Login form still empty (PC-18 / S01)                                                |

Close also requires the Security Checklist, OWASP worksheet, Threat Review, Timing Assessment, and Abuse Assessment with **zero REQUIRES ACTION** (evidence stage).

---

## 6. Architecture verification

| Check                                           | Pass                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Authorization decision owner                    | Existing Auth (`RolesGuard` / `CommandAuthorizationService` in place)          |
| Role store                                      | Identity `User.role` — no second role table as SoT                             |
| Membership                                      | Workspace `WorkspaceAccessService` — no membership table invented              |
| Authentication                                  | Unchanged owner of credentials/sessions                                        |
| No new bounded context                          | No IAM / RBAC / People domain module as a new context                          |
| No duplicate SoT                                | Ledger, Risk, Gate, Library, Identity profile unchanged as SoT                 |
| HTTP                                            | Transport only; People UI is a projection                                      |
| Spec v2.0 / Authority Matrix / Alias Dictionary | Unchanged                                                                      |
| Live capital                                    | Not authorized                                                                 |
| Reuse                                           | Major extension of Identity/Auth (Master Plan §10). Workspace unchanged owner. |

Close also requires the Architecture Checklist with **zero REQUIRES ACTION**.

---

## 7. Product verification

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

Customer (Product Owner or delegate) signs that Master Plan S02 outcomes are true:

- [ ] An admin can give me a role; I cannot perform another role’s actions.
- [ ] Workspace Admin can assign Reader / Researcher / Trader / Admin without sharing passwords.
- [ ] I did not use SSH, customer `.env`, or manual database edits.
- [ ] Live UI, exchange keys, vault, billing, API keys, and Spec v2.0 were not touched.
- [ ] Authentication still signs me in; RBAC did not replace it.

Metrics: time-to-register and time-to-login recorded against Master Plan §6 (no regression).

---

## 8. Slice validation (independently reviewable)

Each slice may Close its own review only when its done-when is evidenced. Package Close still requires this full plan.

| Slice     | Evidence focus                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------- |
| **S02-a** | Matrix encoded; default-deny tests; no People UI required yet (fixture roles in tests).                   |
| **S02-b** | In-scope HTTP surfaces classified; Reader/Researcher/Trader/Admin vertical tests; V2 journeys not broken. |
| **S02-c** | Admin role-assignment API; last-Admin; self-escalation; Identity persistence.                             |
| **S02-d** | People UI; J3-02 walkthrough steps that are customer-visible; honest non-Admin state.                     |
| **S02-e** | Horizontal tests; structured events; Gate/Risk non-bypass; no leaked later products.                      |

---

## 9. Close criteria

V3-S02 may **Close** only when:

1. All implementation slices S02-a … S02-e are merged and independently reviewed.
2. Unit, integration, and UI tests above are green in CI.
3. Manual RBAC walkthrough is recorded **PASS**.
4. Architecture Review, Security Review, and Product Review (post-implementation) are recorded against this plan and the three Version 3 checklists.
5. Implementation Report lists honest limitations (especially: first Admin is host bootstrap; membership remains owner-only until Wave 9; live not authorized).
6. No Master Plan change was required. If one was required, this validation is void until the plan is revised and the package is re-approved.

Next package after Close: **V3-S03 Secret Vault & Encryption** — start at Implementation Package, not at code.

---

**STOP.** This plan is not executed until after Implementation and the Implementation Report.
