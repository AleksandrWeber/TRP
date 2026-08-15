# PC-14 Workspace Management — Architecture Impact

**Package:** PC-14  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Workspace ownership unchanged. Identity unchanged. No new SoT. No new domain.

---

## Frozen artifacts

| Artifact                        | Status after PC-14  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                                        | Owner before                         | Owner after         |
| -------------------------------------------------------------- | ------------------------------------ | ------------------- |
| Workspace aggregate (id, name, ownerUserId, status, createdAt) | Workspace                            | Workspace           |
| Workspace membership (owner is member; Active required)        | Workspace (`WorkspaceAccessService`) | Workspace           |
| Identity profile / role                                        | Identity                             | Identity            |
| Credentials / JWT                                              | Authentication                       | Authentication      |
| Active workspace selection in the browser                      | Frontend (`trp_active_workspace`)    | Frontend (same key) |
| `X-Workspace-Id` injection                                     | Shared API Client                    | Shared API Client   |

Identity does not own Workspace. Workspace does not own Identity. JWT `sub` remains the existing owner id. No Teams, Invitations, Organization redesign, or RBAC changes.

---

## Persistence

The existing Prisma `WorkspaceRecord` table remains the durable store for the existing Workspace aggregate.

| Change                                       | New SoT?                                  | New domain? |
| -------------------------------------------- | ----------------------------------------- | ----------- |
| REST list / create / get / rename / archive  | No — HTTP for existing commands           | No          |
| Switcher UI                                  | No — selection is still localStorage      | No          |
| Restore persisted selection before bootstrap | No — product path over existing bootstrap | No          |

In-memory maps remain a process cache after hydrate. They are not a second Source of Truth.

---

## What was not changed

- Tenancy model
- Permissions / Role enum
- Authentication / JWT
- Exchange Scope
- Organization
- Workspace `ownerUserId` semantics
- `WorkspaceAccessService.isMember` (owner + Active)
- Bootstrap idempotency
- Spec, Authority Matrix, Alias Dictionary, RC history

---

**End of Architecture Impact.**
