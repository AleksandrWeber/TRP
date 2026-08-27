/**
 * W3-O04-b — Durable Kill Switch Persistence Foundation registry.
 *
 * Maps approved W3-O04-a SURVIVE paper artifacts to trading-session owner storage.
 * Not restart recovery. Not operational continuity. Not Kill Switch execution.
 */

import {
  W3_O04_A_KILL_SWITCH_INVENTORY,
  type W3O04AInventoryRow,
} from './w3-o04-a-kill-switch-inventory';

export const W3_O04_B_SLICE_ID = 'W3-O04-b' as const;

export const W3_O04_B_KILL_SWITCH_OWNER = 'trading-session' as const;

/** Paper SURVIVE inventory rows covered by W3-O04-b durable persistence. */
export const W3_O04_B_PERSISTED_ARTIFACT_IDS = Object.freeze([
  'persist-paper-session-kill-switch',
  'state-paper-kill-switch-armed',
] as const);

export type W3O04BPersistedArtifactId = (typeof W3_O04_B_PERSISTED_ARTIFACT_IDS)[number];

export type W3O04BDurableCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: typeof W3_O04_B_KILL_SWITCH_OWNER;
  durabilityClass: 'SURVIVE';
  prismaModel: string;
  repositoryPort: string;
  prismaAdapter: string;
  persistenceService: string;
  migration: string;
}>;

export const W3_O04_B_DURABLE_COVERAGE: readonly W3O04BDurableCoverage[] = Object.freeze([
  Object.freeze({
    artifactId: 'persist-paper-session-kill-switch',
    artifact: 'Paper session armed Kill Switch state on Session / Command Center owner',
    owner: W3_O04_B_KILL_SWITCH_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceKillSwitchState',
    repositoryPort: 'apps/api/src/modules/trading-session/domain/kill-switch-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/trading-session/persistence/prisma-kill-switch-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/trading-session/kill-switch/kill-switch-persistence.service.ts',
    migration: 'apps/api/prisma/migrations/20260827210000_w3_o04_b_kill_switch/migration.sql',
  }),
  Object.freeze({
    artifactId: 'state-paper-kill-switch-armed',
    artifact: 'Paper workspace Kill Switch armed state (durable substrate)',
    owner: W3_O04_B_KILL_SWITCH_OWNER,
    durabilityClass: 'SURVIVE' as const,
    prismaModel: 'WorkspaceKillSwitchState',
    repositoryPort: 'apps/api/src/modules/trading-session/domain/kill-switch-state.repository.ts',
    prismaAdapter:
      'apps/api/src/modules/trading-session/persistence/prisma-kill-switch-state.repository.ts',
    persistenceService:
      'apps/api/src/modules/trading-session/kill-switch/kill-switch-persistence.service.ts',
    migration: 'apps/api/prisma/migrations/20260827210000_w3_o04_b_kill_switch/migration.sql',
  }),
]);

export const W3_O04_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newKillSwitchEngine: false,
  newRuntimeController: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  w3O03Redesigned: false,
  automaticRestartRecovery: false,
  operationalContinuityGuaranteed: false,
  killSwitchExecutionImplemented: false,
  admissionPolicyWired: false,
  customerVisibleKillSwitchUi: false,
  killSwitchCompleteClaimed: false,
  paperRestartSurvivalClaimed: false,
} as const);

export const W3_O04_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'operational-continuity',
  'kill-switch-execution',
  'admission-policy-wiring',
  'command-center-projection',
  'monitoring-product',
  'live-trading-enablement',
  'business-continuity',
  'high-availability',
  'disaster-recovery-product',
  'second-kill-switch-engine',
  'w3-o04-c',
] as const);

export const W3_O04_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'TD-047 durable persistence foundation — paper Kill Switch armed/cleared state can be written to trading-session owner storage',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'TD-047 restart recovery — hydrate armed state after API restart (W3-O04-c)',
    'TD-047 paper visibility — Command Center arm/clear surfaces (W3-O04-c)',
    'TD-047 admission block proof — real RecoveryEventAdmissionPolicy (W3-O04-d)',
    'TD-047 package Close — walkthrough and honesty evidence (W3-O04-e)',
  ] as const),
} as const);

export function paperSurviveInventoryRows(): readonly W3O04AInventoryRow[] {
  return W3_O04_A_KILL_SWITCH_INVENTORY.filter(
    (row) =>
      row.isPaperProduct &&
      row.durabilityClass === 'SURVIVE' &&
      (W3_O04_B_PERSISTED_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
  );
}

export function persistedArtifactIds(): readonly string[] {
  return W3_O04_B_DURABLE_COVERAGE.map((row) => row.artifactId);
}
