# Wave 1 Workspace Isolation — Production Composition Proof

**Finding:** F-14  
**Date:** 2026-08-17  
**Scope:** Authentication, Identity, Workspace, Vault, Security Audit, and Timeline only.  
**Regression:** [`production-composition-proof.integration.spec.ts`](../../../apps/api/src/modules/workspace-isolation/production-composition-proof.integration.spec.ts)

## Claim and execution boundary

This evidence proves applicable Wave 1 Workspace Isolation behaviour through
the real Nest production modules, real PostgreSQL Prisma client, and real
production services. It is deliberately limited to the F-14 products; it
does not claim Connection Management, exchange adapters, live trading,
monitoring, billing, customer UI, Wave 2, or future products.

The regression creates a Nest/Fastify application from the in-scope production
modules without overrides: `ConfigModule`, `LoggingModule`, `MetricsModule`,
`PrismaModule`, `IdentityModule`, `WorkspaceModule`, `AuthModule`,
`SecretVaultModule`, `SecurityAuditModule`, and
`SecurityAuditTimelineApiModule`. It installs the same `JwtAuthGuard`,
`AuthCsrfGuard`, and `RolesGuard` classes that production registers globally.
It uses no mock, fake service, manual service construction, in-memory
repository, or test-only ownership shortcut.

Two registered Identity users own distinct persisted Workspaces. Authentication
issues real JWT sessions; Vault writes real encrypted records through Prisma;
Vault lifecycle and denial events use the Security Audit store; Timeline is
read through the protected production HTTP route.

## Executable proof

| F-14 requirement                     | Executed proof                                                                                                                                                     | Result |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Authentication and Identity          | Real `AuthenticationService.register` and login create persisted users, credentials, sessions, and JWTs; roles are resolved by the production Identity service.    | PASS   |
| Workspace ownership                  | Workspace A and B are created by the production `WorkspaceDomainService`; `WorkspaceAccessService` accepts A→A and rejects A→B.                                    | PASS   |
| Vault read, enumerate, retrieve      | A's list, get, and retrieve operations targeting B fail at production `VaultAccessControl`; B's persisted secret remains available to B.                           | PASS   |
| Vault write, replace, revoke, delete | A's store, replace, revoke, and delete operations targeting B fail before mutation; B retains exactly one persisted vault record.                                  | PASS   |
| Audit isolation and real persistence | Vault lifecycle facts are appended through `SecurityAuditService` to the migrated Prisma `security_audit_records` table and are counted by workspace.              | PASS   |
| Timeline isolation and real guards   | The real Timeline HTTP route returns 401 without a JWT, 403 for A→B, and 200 for each owner’s own workspace. Returned payloads contain no foreign secret material. | PASS   |
| Cross-workspace denial               | Every applicable F-14 read/write path is exercised with A targeting B.                                                                                             | PASS   |

The test database runs the existing committed Prisma migrations with
`prisma migrate deploy`; it uses neither schema substitution nor an in-memory
store. Security Audit evidence is intentionally not deleted after a run
because the production table is append-only.

## Relationship to existing evidence

- [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md) supplies the
  static/runtime/regression ownership model and row definitions.
- [`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md)
  records Timeline route ownership.
- [`v3-s06-security-verification-worksheet.md`](./v3-s06-security-verification-worksheet.md)
  records the broader S06 control and OWASP mapping evidence.

This record adds the missing production-composition form of proof. It does not
alter package Close reports, grant a certification verdict, declare Wave 1
complete, or resolve F-05.
