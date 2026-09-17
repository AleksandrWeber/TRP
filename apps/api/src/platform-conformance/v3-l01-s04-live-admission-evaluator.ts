/**
 * PROPOSED-V3-L01-S04 — Live admission foundation registry.
 *
 * Gate · KS · Session admission wiring, fail-closed.
 * Not L02 execution. Not C7 activation. Not live-capital activation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import { roleAllowsPermission } from '../modules/auth/permission-matrix';
import { PermissionClass } from '../modules/auth/permission-catalog';
import { Role } from '../modules/identity/role';
import {
  livePolicyAuthorizesAdmission,
  livePolicyAuthorizesExecution,
  livePolicyAuthorizesLiveTrading,
  WorkspaceLivePolicy,
} from '../modules/workspace/live-policy/durable-workspace-live-policy-state';

export const V3_L01_S04_SLICE_ID = 'PROPOSED-V3-L01-S04' as const;

export const V3_L01_S04_OWNER = 'trading-session' as const;

export const V3_L01_S04_COVERAGE = Object.freeze({
  decideLiveAdmission:
    'apps/api/src/modules/trading-session/live-admission/domain/decide-live-admission.ts',
  humanStartProof:
    'apps/api/src/modules/trading-session/live-admission/domain/human-start-proof.ts',
  liveAdmissionService:
    'apps/api/src/modules/trading-session/live-admission/live-admission.service.ts',
  liveAdmissionModule:
    'apps/api/src/modules/trading-session/live-admission/live-admission.module.ts',
  l02Contract:
    'apps/api/src/modules/trading-session/live-admission/domain/live-admission-l02-contract.ts',
} as const);

export const V3_L01_S04_ARCHITECTURE_CLAIMS = Object.freeze({
  liveAdmissionEvaluator: true,
  consumesS02S03PolicySoT: true,
  gateLiveAdmissionWiring: true,
  killSwitchLiveWiring: true,
  sessionMinimumEligibility: true,
  humanStartDistinctPrerequisite: true,
  liveCommandDenyAll: true,
  liveCommandActivated: false,
  secondGate: false,
  secondKillSwitch: false,
  securityAuditRuntimeAdmissionPersist: false,
  liveAdapter: false,
  credentialsOrVaultMutation: false,
  exchangeIo: false,
  liveCapitalActivation: false,
  l02ThroughL05: false,
  honestyHelpersRemainFalse: true,
} as const);

export const V3_L01_S04_EXPLICIT_OUT = Object.freeze([
  'live-command-activation',
  'credentials',
  'vault-mutation',
  'exchange-adapters',
  'order-submit-cancel',
  'capital-movement',
  'financial-action-log',
  'live-ui',
  'l05-financial-replay',
  'fiv',
  'production-release',
  'live-capital-activation',
  's04-final-close',
  'l02',
  'l03',
  'l04',
  'l05',
] as const);

export function v3L01S04RepoRoot(): string {
  return join(__dirname, '../../../..');
}

export function v3L01S04RequiredFilesExist(): boolean {
  const root = v3L01S04RepoRoot();
  return (
    existsSync(join(root, V3_L01_S04_COVERAGE.decideLiveAdmission)) &&
    existsSync(join(root, V3_L01_S04_COVERAGE.humanStartProof)) &&
    existsSync(join(root, V3_L01_S04_COVERAGE.liveAdmissionService)) &&
    existsSync(join(root, V3_L01_S04_COVERAGE.liveAdmissionModule)) &&
    existsSync(join(root, V3_L01_S04_COVERAGE.l02Contract))
  );
}

export function v3L01S04V2AnchorsIntact(): boolean {
  return (
    V2_READINESS.liveCapitalAuthorized === false &&
    V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true)
  );
}

export function v3L01S04LiveCommandRemainsDenyAll(): boolean {
  return (
    !roleAllowsPermission(Role.Admin, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Trader, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Researcher, PermissionClass.LiveCommand) &&
    !roleAllowsPermission(Role.Reader, PermissionClass.LiveCommand)
  );
}

export function v3L01S04HonestyHelpersRemainFalse(): boolean {
  const opted = {
    workspaceId: 'ws',
    policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    schemaVersion: 1,
    updatedAt: '2026-09-17T00:00:00.000Z',
  };
  return (
    livePolicyAuthorizesLiveTrading(opted) === false &&
    livePolicyAuthorizesAdmission(opted) === false &&
    livePolicyAuthorizesExecution(opted) === false
  );
}
