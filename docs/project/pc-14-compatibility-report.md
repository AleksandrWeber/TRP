# PC-14 Workspace Management — Compatibility Report

**Package:** PC-14  
**Date:** 2026-08-15  
**Verdict:** Additive REST. Bootstrap unchanged. JWT unchanged. Operator Shell unchanged except the header switcher.

---

## REST

| Endpoint                          | Compatibility                        |
| --------------------------------- | ------------------------------------ |
| `POST /v1/workspaces/bootstrap`   | Unchanged body and workspace view    |
| `GET /v1/workspaces`              | **New** — caller’s active workspaces |
| `POST /v1/workspaces`             | **New** — `{ name }`                 |
| `GET /v1/workspaces/:id`          | **New** — switch / read transport    |
| `PATCH /v1/workspaces/:id`        | **New** — `{ name }`                 |
| `POST /v1/workspaces/:id/archive` | **New** — archive command            |

No new version. No renamed fields. No removed routes. Workspace view remains `{ id, name, status, createdAt }`.

Foreign / missing / archived ids are **404** (same isolation style as other workspace-scoped resources). They are not 403.

---

## Authentication model

Unchanged from PC-18. Login, register, logout, and JWT behaviour are out of this package. Workspace still keys ownership by JWT `sub`.

---

## Frontend compatibility

| Path                            | Compatibility                                                    |
| ------------------------------- | ---------------------------------------------------------------- |
| Operator Shell bands and routes | Unchanged (PC-19)                                                |
| Header workspace name           | Now a switcher; same location, same paper-first chrome           |
| `X-Workspace-Id`                | Still injected by the Shared API Client from persisted selection |
| `/login`                        | Still bootstraps when no valid stored workspace exists           |
| Page refresh                    | Restores stored workspace when it is still owned and Active      |

Logout still clears the access token and the stored workspace (existing auth storage contract).

---

## Downstream

Later packages (PC-01 Strategy Library and after) continue to run **inside** the selected workspace. They must not invent a second workspace owner.

---

**End of Compatibility Report.**
