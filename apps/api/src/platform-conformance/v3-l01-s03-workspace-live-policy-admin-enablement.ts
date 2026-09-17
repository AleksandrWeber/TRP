/**
 * PROPOSED-V3-L01-S03 — Admin enable/disable + audit registry.
 *
 * Control-plane only over the S02 SoT.
 * Not Gate / KS / Session admission. Not live adapter. Not credentials.
 * Not live-capital activation. Not L02–L05.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import { roleAllowsPermission } from '../modules/auth/permission-matrix';
import { PermissionClass } from '../modules/auth/permission-catalog';
import { Role } from '../modules/identity/role';

export const V3_L01_S03_SLICE_ID = 'PROPOSED-V3-L01-S03' as const;

export const V3_L01_S03_OWNER = 'workspace' as const;

export const V3_L01_S03_API = Object.freeze({
  enable: 'POST /v1/workspaces/:workspaceId/live-policy/enable',
  disable: 'POST /v1/workspaces/:workspaceId/live-policy/disable',
  getEndpoint: false,
} as const);

export const V3_L01_S03_AUDIT_EVENT = 'authz.workspace-live-policy-change' as const;

export const V3_L01_S03_COVERAGE = Object.freeze({
  controller: 'apps/api/src/modules/workspace/live-policy/workspace-live-policy.controller.ts',
  adminService: 'apps/api/src/modules/workspace/live-policy/workspace-live-policy-admin.service.ts',
  auditHelper: 'apps/api/src/modules/workspace/live-policy/workspace-live-policy.audit.ts',
  s02Persistence:
    'apps/api/src/modules/workspace/live-policy/workspace-live-policy-persistence.service.ts',
} as const);

export const V3_L01_S03_ARCHITECTURE_CLAIMS = Object.freeze({
  publicAdminApi: true,
  enablementAuthorization: true,
  enablementAudit: true,
  usesRoleAdmin: true,
  usesWorkspaceMembership: true,
  consumesS02SoT: true,
  secondPolicyStore: false,
  getEndpoint: false,
  liveCommandBoundToEnablement: false,
  liveCommandDenyAll: true,
  gateLiveAdmissionWiring: false,
  killSwitchLiveWiring: false,
  sessionLiveProductization: false,
  liveAdapter: false,
  credentialsOrVaultMutation: false,
  liveCapitalActivation: false,
  mfa: false,
  l02ThroughL05: false,
} as const);

export const V3_L01_S03_EXPLICIT_OUT = Object.freeze([
  'gate-admission',
  'kill-switch-live-wiring',
  'session-live-productization',
  'live-command-activation',
  'credentials',
  'vault-mutation',
  'exchange-adapters',
  'order-submit-cancel',
  'capital-movement',
  'financial-action-log',
  'live-ui',
  'replay-protection',
  'mfa',
  'l02',
  'l03',
  'l04',
  'l05',
  'fiv',
  'production-release',
  'live-capital-activation',
  's03-final-close',
] as const);

export function v3L01S03RepoRoot(): string {
  return join(__dirname, '../../../..');
}

export function v3L01S03RequiredFilesExist(): boolean {
  const root = v3L01S03RepoRoot();
  return (
    existsSync(join(root, V3_L01_S03_COVERAGE.controller)) &&
    existsSync(join(root, V3_L01_S03_COVERAGE.adminService)) &&
    existsSync(join(root, V3_L01_S03_COVERAGE.auditHelper)) &&
    existsSync(join(root, V3_L01_S03_COVERAGE.s02Persistence))
  );
}

export function v3L01S03V2AnchorsIntact(): boolean {
  return (
    V2_READINESS.liveCapitalAuthorized === false &&
    V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true)
  );
}

export function v3L01S03LiveCommandRemainsDenyAll(): boolean {
  return (
    !roleAllowsPermission(Role.Admin, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Trader, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Researcher, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Reader, PermissionClass.LiveCommand)
  );
}

export function v3L01S03AdminAllowsRoleAdmin(): boolean {
  return roleAllowsPermission(Role.Admin, PermissionClass.RoleAdmin);
}
