# PC-18 Identity Product — Compatibility Report

**Package:** PC-18  
**Date:** 2026-08-15  
**Verdict:** REST compatible. JWT compatible. No breaking Auth contract.

---

## REST

| Endpoint                 | Compatibility                          |
| ------------------------ | -------------------------------------- |
| `POST /v1/auth/login`    | Unchanged body and `AuthTokenResponse` |
| `POST /v1/auth/register` | Unchanged body and `AuthTokenResponse` |
| `GET /v1/auth/me`        | Unchanged                              |
| `GET /v1/auth/admin`     | Unchanged                              |

No new version, no renamed fields, no removed routes.

Frontend now calls existing `POST /v1/auth/register` (previously unused by UI). That is an extension of the client, not a server contract change.

---

## Authentication model

| Item                                            | Compatibility |
| ----------------------------------------------- | ------------- |
| JWT payload `sub` / `email` / `role`            | Unchanged     |
| `JWT_EXPIRES_IN` default `8h`                   | Unchanged     |
| Bearer extraction                               | Unchanged     |
| Password minimum length 8                       | Unchanged     |
| bcrypt hashing                                  | Unchanged     |
| Invalid credentials → 401 `Invalid credentials` | Unchanged     |
| Duplicate email → 409                           | Unchanged     |

Client-side logout (clear token, navigate to `/login`) is unchanged.

---

## Persistence compatibility

Existing `User` rows keep `id`, `email`, `role`, `passwordHash`, timestamps. New columns default so prior seed rows remain readable:

- `displayName` default `''`
- `status` default `'Active'`
- `passwordHash` may be null only for a profile that has not yet received an Auth hash

Identity Role continues to map onto the existing Prisma `Role` enum. No RBAC redesign.

---

## Behaviour that is intentionally gone (product path)

These were development-bootstrap behaviours, not API contract:

- Prefilling `admin@trp.local` / `trp-admin-change-me` on `/login`
- Auto-creating that user in `NODE_ENV=development` on module init
- Auto-assigning the shared development password at runtime

Engineer seed (`pnpm --filter @trp/api prisma:seed`) still can create an operator account when explicitly run.

---

## Downstream

Workspace bootstrap after login is unchanged (`POST /v1/workspaces/bootstrap`). JWT `sub` remains the workspace owner id. Because Identity IDs now survive restart, workspace ownership no longer diverges from a regenerated development UUID.

---

**End of Compatibility Report.**
