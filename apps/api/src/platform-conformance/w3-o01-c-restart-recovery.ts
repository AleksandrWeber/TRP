/**
 * W3-O01-c — Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W3-O01-b durable analytical owners.
 * Not Business Continuity / HA / Disaster Recovery / failover.
 */

import { W3_O01_B_DURABLE_OWNERS } from '../persistence/analytical-owner-store-snapshot';
import {
  W3_O01_C_RECOVERY_DEPENDENCIES,
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../persistence/analytical-restart-recovery';
import { W3_O01_A_ANALYTICAL_INVENTORY } from './w3-o01-a-analytical-inventory';
import {
  W3_O01_B_DURABLE_COVERAGE,
  W3_O01_B_EPHEMERAL_EXCLUDED,
} from './w3-o01-b-durable-persistence';

export const W3_O01_C_SLICE_ID = 'W3-O01-c' as const;

export const W3_O01_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  persistenceRedesigned: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  failover: false,
  customerVisibleRecoveryUi: false,
  normalProcessRestartRecovery: true,
} as const);

export type W3O01CRecoveryCoverage = Readonly<{
  artifactId: string;
  artifact: string;
  owner: W3O01CRecoveryOwner;
  recoveryOrderIndex: number;
}>;

export const W3_O01_C_RECOVERY_COVERAGE: readonly W3O01CRecoveryCoverage[] = Object.freeze(
  W3_O01_B_DURABLE_COVERAGE.map((row) =>
    Object.freeze({
      artifactId: row.artifactId,
      artifact: row.artifact,
      owner: row.owner as W3O01CRecoveryOwner,
      recoveryOrderIndex: W3_O01_C_RECOVERY_ORDER.indexOf(row.owner as W3O01CRecoveryOwner),
    }),
  ),
);

export function recoveryOwnersInOrder(): readonly W3O01CRecoveryOwner[] {
  return W3_O01_C_RECOVERY_ORDER;
}

export function transitionSafetyAnswers(): Readonly<{
  canRestorePreviouslyPersistedArtifacts: true;
  canRecoverWithoutOwnershipChanges: true;
  canRecoverWithoutPersistenceRedesign: true;
  backwardCompatibilityPreserved: true;
  w3O01aInventoryRemainsValid: true;
}> {
  return Object.freeze({
    canRestorePreviouslyPersistedArtifacts: true,
    canRecoverWithoutOwnershipChanges: true,
    canRecoverWithoutPersistenceRedesign: true,
    backwardCompatibilityPreserved: true,
    w3O01aInventoryRemainsValid: true,
  });
}

export function ephemeralArtifactsNotRecovered(): readonly string[] {
  return W3_O01_B_EPHEMERAL_EXCLUDED;
}

export function surviveArtifactsRestored(): readonly string[] {
  return W3_O01_A_ANALYTICAL_INVENTORY.filter((row) => row.requiredDurability === 'SURVIVE').map(
    (row) => row.artifactId,
  );
}

export function durableOwnerSetMatchesRecoveryOrder(): boolean {
  return (
    [...W3_O01_B_DURABLE_OWNERS].sort().join(',') ===
    [...W3_O01_C_RECOVERY_ORDER].slice().sort().join(',')
  );
}

export { W3_O01_C_RECOVERY_ORDER, W3_O01_C_RECOVERY_DEPENDENCIES };
