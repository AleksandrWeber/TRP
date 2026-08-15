# PC-14 Workspace Management — Implementation Report

**Package:** PC-14 Workspace Management  
**Wave:** A — Trust and shell (order 3)  
**Date:** 2026-08-15  
**Journey:** J-02 Workspace — **COMPLETE**  
**Status:** Ready for review (stop before PC-01)  
**Readiness:** Workspace declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes the existing Workspace aggregate as a customer product. It does not redesign tenancy, ownership, Identity, permissions, Exchange Scope, or Organization.

---

## What was exposed

| Surface       | Change                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **REST**      | Existing `WorkspaceDomainService` over HTTP: list, named create, get (switch), rename, archive. Bootstrap remains.                                     |
| **UI**        | Workspace Switcher in the PC-19 Operator Shell header. List, create dialog, rename dialog, archive confirmation, empty / loading / error / validation. |
| **Selection** | Persisted `trp_active_workspace` is restored on refresh when the workspace is still owned and Active. Bootstrap is the fallback, not an overwrite.     |
| **Shell**     | Operator Shell consumes the selected workspace. `X-Workspace-Id` continues to come from that selection.                                                |

No new domain. No new Source of Truth. Workspace still owns Workspace. Identity still does not.

---

## Product path (not a redesign)

| File                                                     | Role                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/src/modules/workspace/workspace.controller.ts` | REST transport for existing create / findByOwner / getById / rename / archive |
| `apps/web/src/workspace/WorkspaceSwitcher.tsx`           | Header switcher in the Operator Shell                                         |
| `apps/web/src/workspace/resolve-active-workspace.ts`     | Restore persisted selection; bootstrap only when needed                       |
| `apps/web/src/layout/AppLayout.tsx`                      | Hosts the switcher (same paper-first chrome)                                  |
| `apps/web/src/app/RequireAuth.tsx`                       | Auth gate uses restore-then-bootstrap                                         |

Ports used: existing `WorkspaceDomainService`, `WorkspaceAccessService`, `WorkspaceRepository` (Prisma). UI and REST delegate. No shadow API.

---

## REST contract

Unchanged:

- `POST /v1/workspaces/bootstrap` — discover or create the caller’s earliest active workspace

Added (same Workspace owner, same view shape):

- `GET /v1/workspaces` — caller’s active workspaces
- `POST /v1/workspaces` — named create (`name` 1–80)
- `GET /v1/workspaces/:id` — switch / read; owned Active only
- `PATCH /v1/workspaces/:id` — rename; owned Active only
- `POST /v1/workspaces/:id/archive` — archive; owned Active only

Missing, foreign, or archived ids return **404**. `ownerUserId` is not in the view. No tenant, team, invitation, or RBAC fields.

---

## UI

Header switcher (not a new admin page, not a redesign):

- Current workspace name
- List of owned active workspaces
- Switch (persists selection; subsequent API calls use `X-Workspace-Id`)
- Create / Rename dialogs with validation
- Archive confirmation
- Empty, loading, and error states
- No placeholder, Coming Soon, or disabled fake actions

If the last active workspace is archived, existing bootstrap creates a default workspace so the operator is not stranded.

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

---

## Definition of Done

| #   | Gate                               | Result                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — existing create / list / rename / archive operable                     |
| 2   | REST transport complete            | **TRUE** — list / create / get / rename / archive + bootstrap                     |
| 3   | UI complete                        | **TRUE** — switcher, list, dialogs, empty / loading / error                       |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no Identity ownership of Workspace                      |
| 5   | Integration wiring complete        | **TRUE** — Operator Shell consumes selected workspace                             |
| 6   | Tests PASS                         | **TRUE** — web 117, api 2959                                                      |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched |
| 8   | Release Notes written              | **TRUE** — [`pc-14-release-notes.md`](./pc-14-release-notes.md)                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-14 Closed                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-02 Complete; UI Policy not violated                                  |

```text
Package: PC-14
Journey steps enabled: J-02
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

---

## Companions

- [Architecture Impact](./pc-14-architecture-impact.md)
- [Compatibility Report](./pc-14-compatibility-report.md)
- [Workspace UX Audit](./pc-14-workspace-ux-audit.md)
- [Tests Summary](./pc-14-tests-summary.md)
- [Validation Report](./pc-14-validation-report.md)
- [Documentation Summary](./pc-14-documentation-summary.md)
- [Release Notes](./pc-14-release-notes.md)
- [Product Readiness Update](./pc-14-product-readiness-update.md)

**STOP.** Next package is PC-01 Strategy Library Product. Do not begin PC-01 until this package is reviewed.

---

**End of Implementation Report.**
