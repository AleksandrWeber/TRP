/**
 * W3-O05-b — Monitoring & Security Health Durable Persistence Foundation registry.
 *
 * Maps approved W3-O05-a SURVIVE monitoring artifacts to Security Platform storage.
 * Not restart recovery. Not operational continuity. Not health evaluation.
 */

import {
  W3_O05_A_MONITORING_INVENTORY,
  type W3O05AInventoryRow,
} from './w3-o05-a-monitoring-inventory';

export const W3_O05_B_SLICE_ID = 'W3-O05-b' as const;

export const W3_O05_B_MONITORING_OWNER = 'security-platform' as const;

/** New durable persistence implemented in W3-O05-b. */
export const W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-monitoring-health-state',
] as const);

/** SURVIVE security health rows with pre-existing Security Audit persistence. */
export const W3_O05_B_PREEXISTING_SECURITY_HEALTH_ARTIFACT_IDS = Object.freeze([
  'state-security-audit-records',
  'state-security-incident-records',
  'persist-security-audit-store',
  'runtime-security-audit-emitter',
] as const);

/** SURVIVE monitoring substrate rows owned by other packages — consumed, not duplicated. */
export const W3_O05_B_CONSUMED_SURVIVE_ARTIFACT_IDS = Object.freeze([
  'state-queue-continuity-status',
  'state-kill-switch-continuity-status',
  'state-analytical-owner-continuity',
  'adjacent-w3-o04-kill-switch-foundation',
] as const);

export type W3O05BPersistedArtifactId = (typeof W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS)[number];

export type W3O05BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W3_O05_B_MONITORING_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W3_O05_B_DURABLE_COVERAGE: readonly W3O05BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-monitoring-health-state',
    artifact: 'Durable monitoring / security health state on Security Platform owner',
    owner: W3_O05_B_MONITORING_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceMonitoringHealthState',
    repositoryPort:
      'apps/api/src/security-platform/monitoring-health/domain/monitoring-health-state.repository.ts',
    prismaAdapter:
      'apps/api/src/security-platform/monitoring-health/persistence/prisma-monitoring-health-state.repository.ts',
    persistenceService:
      'apps/api/src/security-platform/monitoring-health/monitoring-health-persistence.service.ts',
    migration: 'apps/api/prisma/migrations/20260828100000_w3_o05_b_monitoring_health/migration.sql',
  }),
]);

export const W3_O05_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newMonitoringPlatform: false,
  newIncidentSystem: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  w3O03Redesigned: false,
  w3O04Redesigned: false,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  monitoringEvaluationImplemented: false,
  alertingImplemented: false,
  dashboardImplemented: false,
  customerVisibleMonitoringUi: false,
  monitoringCompleteClaimed: false,
  securityHealthCompleteClaimed: false,
  monitoringRestartSurvivalClaimed: false,
} as const);

export const W3_O05_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'monitoring-evaluation',
  'health-computation',
  'alerting',
  'dashboard-rendering',
  'incident-management-product',
  'live-trading-enablement',
  'business-continuity',
  'high-availability',
  'disaster-recovery-product',
  'second-monitoring-platform',
  'second-incident-system',
  'w3-o05-c',
] as const);

export const W3_O05_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W3-O05 durable persistence foundation — workspace monitoring health anchors can be written to Security Platform owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W3-O05-c restart recovery — hydrate monitoring anchors after API restart',
    'W3-O05-d operational continuity — monitoring readiness projection',
    'W3-O05-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export function newPersistedInventoryRows(): readonly W3O05AInventoryRow[] {
  return W3_O05_A_MONITORING_INVENTORY.filter((row) =>
    (W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function preexistingSecurityHealthSurviveRows(): readonly W3O05AInventoryRow[] {
  return W3_O05_A_MONITORING_INVENTORY.filter((row) =>
    (W3_O05_B_PREEXISTING_SECURITY_HEALTH_ARTIFACT_IDS as readonly string[]).includes(
      row.artifactId,
    ),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W3_O05_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
