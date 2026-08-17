# V3-S02-b Implementation Report

**Package:** V3-S02 RBAC Product
**Slice:** S02-b — Surface Coverage
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S02-b only**. S02-c through S02-e were not started. V3-S02 is not Closed.

---

## What shipped

Every customer-visible HTTP action is now classified. Silence is no longer a grant. Unauthorized operators are denied in `RolesGuard` before the controller body runs.

| Behavior                         | Result                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Default deny on HTTP             | Unclassified routes are denied. `@Public()` is the only undocumented-looking allow, and it is explicit C0                |
| Explicit allow                   | Non-public handlers declare `@RequirePermission` from catalog C0–C9                                                      |
| Vertical matrix on real surfaces | Reader ⊄ C4/C5/C6; Researcher ⊄ C5/C6; Trader ⊄ C6; all roles ⊄ C7                                                       |
| Live mutations                   | Bound to `LiveCommand` (C7). Empty for every role. Not a live product                                                    |
| Existing `@Roles`                | Kept as an additional AND on paper command routes. Permission class is the Version 3 policy                              |
| UI                               | **Unchanged** — no People, no role assignment, no new chrome                                                             |
| Owners                           | Authentication still owns sessions. Identity still owns `User.role`. Workspace still owns membership. Authz only decides |

---

## Files touched (this slice)

| Area              | Path                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Guard fail-closed | `apps/api/src/modules/auth/roles.guard.ts`                                                 |
| Surface helpers   | `apps/api/src/modules/auth/surface-coverage.ts`                                            |
| Auth self / admin | `apps/api/src/modules/auth/auth.controller.ts`                                             |
| Product HTTP      | Existing `*.controller.ts` under `apps/api/src` (decorators only; no new routes or owners) |

Tests: `roles.guard.spec.ts` (unclassified deny, public allow), `surface-coverage.spec.ts` (every handler classified; walkthrough on real controllers), `surface-coverage.http.spec.ts` (HTTP 403/2xx vertical probe).

No new permissions. No new roles. No People HTTP. No Version 2 document edits. No Master Plan edit.

---

## Classification applied (existing catalog only)

| Class                      | Surfaces now bound                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C0 Public**              | Register, login, refresh, logout, CSRF, recovery, forgot/reset password; `GET /`; `GET /health`; `GET /v1/metrics`                                                                                     |
| **C1 Self**                | `/me`, own sessions, change-password                                                                                                                                                                   |
| **C2 Own workspace**       | Workspace bootstrap / list / create / rename / archive; notification preference upsert; Telegram connect/complete/verify/disconnect/test                                                               |
| **C3 Projection**          | Reads: reports, library, command-center views, knowledge lake, portfolio/accounting, market profile/state, qualification reads, cluster reads, live _reads_                                            |
| **C4 Research**            | Lab, campaigns, datasets, experiments, historical research, certify, research-control executions, qualification commands, AI generate/execute, cluster writes, risk evaluate, runtime validation       |
| **C5 Paper command**       | Paper session commands, paper orders, paper account, orchestrator commands, deployment bind, exchange-adapter connect/disconnect (existing Trader/Admin gate kept), portfolio reset, risk policy patch |
| **C6 Role admin**          | Existing `GET /v1/auth/admin` probe. People list/assign remains **S02-c**                                                                                                                              |
| **C7 Live command**        | Live start/stop/pause/resume/reconnect/synchronize/kill-switch/orders                                                                                                                                  |
| **C8 Vault / connections** | Not bound on existing V2 Telegram or exchange-adapter HTTP (see deferred). Connection wizard remains OUT                                                                                               |
| **C9 Bypass**              | Not bound. No skip-Gate/Risk route exists                                                                                                                                                              |

---

## Done-when (package slice)

From the Implementation Package S02-b:

| Criterion                                                               | Result                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| In-scope product HTTP mutating/sensitive routes use the matrix          | **Met**                                                     |
| Research mutations → Researcher+                                        | **Met** — C4                                                |
| Paper commands remain Trader+                                           | **Met** — C5 plus existing `@Roles` / command authorization |
| Live mutations stay denied as a product                                 | **Met** — C7                                                |
| Authenticated-any-role only where C1/C2/C3 say Yes for all four roles   | **Met** — those routes still declare `@RequirePermission`   |
| Vertical HTTP tests: Reader refused on C4/C5; Researcher refused on C5  | **Met** — real controller metadata + HTTP probe             |
| Must not: connection wizard; enable live UI; skip Gate/Risk; break J-01 | **Met** — no UI; C7/C9 empty; Researcher still allowed C4   |

---

## Deferred missing permissions (no C10+)

Coverage used only C0–C9. These finer classes were **not** invented:

| Desired distinction                                         | Bound as     | Why deferred                                                                                                                                      |
| ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification-channel / Telegram bind as its own admin class | C2           | Catalog has no notification-admin class. C8 would deny every role and break the certified Telegram product. Wave 2 / later                        |
| Cluster lifecycle distinct from research                    | C4           | Researchers must create clusters for lab work. A ClusterAdmin class is not in the catalog                                                         |
| Risk policy edit distinct from paper command                | C5           | No RiskPolicyAdmin class. Trader+Admin matches capital-adjacent paper config                                                                      |
| Vault / connection wizard on HTTP                           | unbound (C8) | C8 is empty for every role. Binding existing V2 Telegram to C8 would hide a shipped product. Vault is **V3-S03**; Connection Management is Wave 2 |

---

## Honest limitations

- JWT `role` remains a hint. Identity re-resolution is unchanged from S01.
- Workspace membership remains owner-only and is still checked by Workspace on workspace-scoped controllers. Horizontal membership product tests are **S02-e**.
- `GET /v1/auth/admin` is not People. Role assignment HTTP is **S02-c**.
- Live _reads_ remain C3 projections. Live _mutations_ are C7 denied. Live UI is not enabled.
- Finder duplicate `* 2.ts` files in the working tree are not part of this slice.

---

## What this slice did not do

| Item                                                 | Result                  |
| ---------------------------------------------------- | ----------------------- |
| S02-c Role assignment API                            | Not started             |
| S02-d People product                                 | Not started             |
| S02-e Privilege constraints and authorization events | Not started             |
| New permissions or roles                             | Not added               |
| Vault / connections / billing / API keys             | Out of package          |
| Live trading authorization product                   | Out of package (Wave 6) |
| Team invites / membership table                      | Out of package (Wave 9) |
| New IAM bounded context                              | Not created             |
| Version 2 documents                                  | Unmodified              |
| Master Plan / Policy / Template                      | Unmodified              |
| RC / ADR                                             | None                    |

---

## Next slice (not this task)

**S02-c Role assignment API.**

Do not start it in this task.

---

**STOP.** Wait for Product Owner review before beginning V3-S02-c Role Assignment API.

**End of S02-b Implementation Report.**
