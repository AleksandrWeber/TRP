# PC-18 Identity Product — Architecture Impact

**Package:** PC-18  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Ownership unchanged. No new SoT. No new domain.

---

## Frozen artifacts

| Artifact                        | Status after PC-18  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                               | Owner before   | Owner after    |
| ------------------------------------- | -------------- | -------------- |
| User profile / role / status          | Identity       | Identity       |
| Credentials / password hashes         | Authentication | Authentication |
| Sessions (JWT)                        | Authentication | Authentication |
| Workspace                             | Workspace      | Workspace      |
| Bot / Exchange / Trading / Strategies | Unchanged      | Unchanged      |

Identity does not own Workspace, Bot, Exchange, Trading, Strategies, or permissions outside the existing Role model.

Authentication still issues the same JWT (`sub`, `email`, `role`) with the same expiry configuration. No OAuth, SSO, RBAC redesign, multi-tenant redesign, or external identity provider.

---

## Persistence

The existing Prisma `User` table is the durable store for the existing Identity aggregate and the existing Auth credential column.

| Change                                                          | New SoT?                       | New domain? |
| --------------------------------------------------------------- | ------------------------------ | ----------- |
| `PrismaUserRepository` bound in `IdentityModule`                | No — persists Identity         | No          |
| `PrismaPasswordCredentialRepository` writes `User.passwordHash` | No — persists Auth credentials | No          |
| `displayName` / `status` columns on `User`                      | No — existing Identity fields  | No          |
| Nullable `passwordHash` until Auth sets it                      | No                             | No          |

In-memory maps remain a process cache after hydrate (Workspace pattern). They are not a second Source of Truth.

---

## What was not changed

- JWT secret handling and Passport JWT strategy
- Role enum semantics (`Admin` / `Researcher` / `Trader` / `Reader`)
- Mapping onto the pre-existing Prisma `Role` enum (`ADMINISTRATOR` / `RESEARCHER` / `TRADER` / `VIEWER`) — compatibility only
- Command authorization (Trader / Admin + workspace membership)
- Public route set (login, register, health)

---

**End of Architecture Impact.**
