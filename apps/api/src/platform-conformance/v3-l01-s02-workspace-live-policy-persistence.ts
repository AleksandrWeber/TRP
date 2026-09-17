/**
 * PROPOSED-V3-L01-S02 — Workspace live-policy persistence & Paper defaulting registry.
 *
 * Persistence foundation only.
 * Not Admin enablement API. Not Gate / KS / Session admission. Not live adapter.
 * Not credentials. Not live-capital activation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';

export const V3_L01_S02_SLICE_ID = 'PROPOSED-V3-L01-S02' as const;

export const V3_L01_S02_OWNER = 'workspace' as const;

export const V3_L01_S02_POLICY_STATES = Object.freeze(['PAPER', 'LIVE_POLICY_OPTED_IN'] as const);

export const V3_L01_S02_DURABLE_COVERAGE = Object.freeze({
  prismaModel: 'WorkspaceLivePolicyState',
  table: 'workspace_live_policy_states',
  repositoryPort:
    'apps/api/src/modules/workspace/live-policy/workspace-live-policy-state.repository.ts',
  prismaAdapter:
    'apps/api/src/modules/workspace/live-policy/persistence/prisma-workspace-live-policy-state.repository.ts',
  persistenceService:
    'apps/api/src/modules/workspace/live-policy/workspace-live-policy-persistence.service.ts',
  domain: 'apps/api/src/modules/workspace/live-policy/durable-workspace-live-policy-state.ts',
  migration:
    'apps/api/prisma/migrations/20260917120000_v3_l01_s02_workspace_live_policy/migration.sql',
} as const);

export const V3_L01_S02_ARCHITECTURE_CLAIMS = Object.freeze({
  workspaceOwnedSatelliteTable: true,
  paperCanonicalDefault: true,
  explicitPaperBackfill: true,
  enumStylePolicyStates: true,
  persistenceDomainPortsOnly: true,
  singlePolicySourceOfTruth: true,
  booleanLiveOptInAsSoT: false,
  workspaceRecordColumn: false,
  sessionExecutionModeReuse: false,
  v2FlagReuseAsPolicy: false,
  publicAdminApi: false,
  enablementAuthorization: false,
  enablementAudit: false,
  gateLiveAdmissionWiring: false,
  killSwitchLiveWiring: false,
  sessionLiveProductization: false,
  liveAdapter: false,
  credentialsOrVaultMutation: false,
  liveCapitalActivation: false,
  l02ThroughL05: false,
} as const);

export const V3_L01_S02_EXPLICIT_OUT = Object.freeze([
  'admin-enablement-api',
  'enablement-authorization',
  'enablement-audit',
  'mfa',
  'live-command-grants',
  'runtime-enforcement-gate-live-admission',
  'kill-switch-live-wiring',
  'session-live-productization',
  'live-adapter',
  'order-submit-cancel',
  'credentials',
  'vault-mutation',
  'live-ui',
  'l02',
  'l03',
  'l04',
  'l05',
  'fiv',
  'production-release',
  'live-capital-activation',
] as const);

export function v3L01S02RepoRoot(): string {
  return join(__dirname, '../../../..');
}

export function readV3L01S02MigrationSql(): string {
  return readFileSync(join(v3L01S02RepoRoot(), V3_L01_S02_DURABLE_COVERAGE.migration), 'utf8');
}

export function v3L01S02RequiredFilesExist(): boolean {
  const root = v3L01S02RepoRoot();
  return (
    existsSync(join(root, V3_L01_S02_DURABLE_COVERAGE.domain)) &&
    existsSync(join(root, V3_L01_S02_DURABLE_COVERAGE.repositoryPort)) &&
    existsSync(join(root, V3_L01_S02_DURABLE_COVERAGE.prismaAdapter)) &&
    existsSync(join(root, V3_L01_S02_DURABLE_COVERAGE.persistenceService)) &&
    existsSync(join(root, V3_L01_S02_DURABLE_COVERAGE.migration))
  );
}

export function v3L01S02V2AnchorsIntact(): boolean {
  return (
    V2_READINESS.liveCapitalAuthorized === false &&
    V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true)
  );
}
