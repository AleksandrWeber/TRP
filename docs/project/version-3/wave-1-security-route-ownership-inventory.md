# Wave 1 Security Route Ownership Inventory

**Date:** 2026-08-17
**Purpose:** V3-S06 Close evidence under the approved Product Owner Resolution.
**Nature:** Certification evidence, not a product, audit, or endpoint catalogue.
**Status:** Evidence prepared for Product Owner review; it does not claim V3-S06 CLOSED or begin the independent Wave 1 Certification Audit.

## Scope and method

This inventory records every Wave 1 security-relevant HTTP route in the closed
S01–S05 packages and maps it to a bounded-context isolation owner and an
existing row in the [Wave 1 Isolation Matrix](./wave-1-isolation-matrix.md).

Routes that do not own or expose tenant state are marked **NOT APPLICABLE** with
an explicit reason. Internal Incident investigation/export foundations have no
customer HTTP route in Wave 1 and are represented by their Audit matrix row.

## Route ownership

| Route                                                     | Owning package                | Owning bounded context                   | Isolation owner      | Matrix row                        | Status                                                                                                 |
| --------------------------------------------------------- | ----------------------------- | ---------------------------------------- | -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST /v1/auth/register`                                  | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/login`                                     | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/refresh`                                   | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/logout`                                    | V3-S01                        | Authentication                           | Authentication       | Session                           | PASS                                                                                                   |
| `GET /v1/auth/csrf`                                       | V3-S01                        | Authentication                           | Platform             | Security Platform tenancy         | NOT APPLICABLE — CSRF hardening does not own tenant state; V3-S04 Close is Platform evidence.          |
| `GET /v1/auth/recovery`                                   | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/forgot-password`                           | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/reset-password`                            | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `POST /v1/auth/change-password`                           | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `GET /v1/auth/sessions`                                   | V3-S01                        | Authentication                           | Authentication       | Session                           | PASS                                                                                                   |
| `POST /v1/auth/sessions/revoke-others`                    | V3-S01                        | Authentication                           | Authentication       | Session                           | PASS                                                                                                   |
| `POST /v1/auth/sessions/revoke-all`                       | V3-S01                        | Authentication                           | Authentication       | Session                           | PASS                                                                                                   |
| `DELETE /v1/auth/sessions/:sessionId`                     | V3-S01                        | Authentication                           | Authentication       | Session                           | PASS                                                                                                   |
| `GET /v1/auth/me`                                         | V3-S01                        | Authentication                           | Authentication       | Authentication / identity binding | PASS                                                                                                   |
| `GET /v1/auth/admin`                                      | V3-S02                        | Authentication / Authorization transport | Identity             | RBAC / People / role assignment   | PASS                                                                                                   |
| `GET /v1/people`                                          | V3-S02                        | Identity                                 | Identity             | RBAC / People / role assignment   | PASS                                                                                                   |
| `PATCH /v1/people/:userId/role`                           | V3-S02                        | Identity                                 | Identity             | RBAC / People / role assignment   | PASS                                                                                                   |
| `POST /v1/workspaces/bootstrap`                           | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `GET /v1/workspaces`                                      | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `POST /v1/workspaces`                                     | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `GET /v1/workspaces/:id`                                  | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `PATCH /v1/workspaces/:id`                                | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `POST /v1/workspaces/:id/archive`                         | Existing Workspace foundation | Workspace                                | Workspace / Identity | Workspace membership / boundary   | PASS                                                                                                   |
| `GET /v1/security-audit/workspaces/:workspaceId/timeline` | V3-S05                        | Security Audit                           | Audit                | Timeline                          | PASS                                                                                                   |
| `GET /health`                                             | V3-S04 platform support       | Security Platform                        | Platform             | Security Platform tenancy         | NOT APPLICABLE — health hardening/status does not own tenant state; V3-S04 Close is Platform evidence. |
| `GET /v1/metrics`                                         | V3-S04 platform support       | Security Platform                        | Platform             | Security Platform tenancy         | NOT APPLICABLE — metrics exposure does not own tenant state; V3-S04 Close is Platform evidence.        |

## Completeness conclusion

- Every listed Wave 1 security-relevant route has an owning package, bounded
  context, isolation owner, and matrix row.
- No security route is orphaned.
- No customer HTTP route exists for Incident investigation/export in Wave 1;
  their workspace-bound internal-foundation evidence remains on the Incident /
  investigation matrix row.
- This inventory does not claim Wave 2 Connection Management, a workspace-scoped
  People API, or customer Incident investigation/export.

## Evidence references

- [Wave 1 Isolation Matrix](./wave-1-isolation-matrix.md)
- [V3-S06 Product Owner Resolution](./v3-s06-product-owner-resolution.md)
- [V3-S04 Close evidence](./v3-s04-e-implementation-report.md)
- `workspace-isolation.identity-coverage.spec.ts`
- `workspace-isolation.cross-product.spec.ts`
- `workspace-isolation.negative-proofs.spec.ts`
