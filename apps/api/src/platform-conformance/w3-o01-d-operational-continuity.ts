/**
 * W3-O01-d — Operational Continuity Foundation registry.
 *
 * Continuity after normal process restart recovery (W3-O01-c).
 * Not Business Continuity / HA / Disaster Recovery / Monitoring.
 */

import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { CONTINUITY_AUDIT_EVENT_TYPES } from '../modules/operational-continuity/operational-continuity-audit';
import { W3_O01_C_RECOVERY_ORDER } from '../persistence/analytical-restart-recovery';
import { W3_O01_B_DURABLE_OWNERS } from '../persistence/analytical-owner-store-snapshot';

export const W3_O01_D_SLICE_ID = 'W3-O01-d' as const;

export const W3_O01_D_ARCHITECTURE_CLAIMS = Object.freeze({
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
  monitoringPlatform: false,
  newRecoveryEngine: false,
  recoveryContinuesViaW3O01cOnly: true,
  operationalContinuity: true,
  platformReadinessDerivedFromOwners: true,
  operationalStateMatrix: true,
} as const);

export const W3_O01_D_SUPPORTED_STATES = OPERATIONAL_STATES;

export const W3_O01_D_AUDIT_EVENTS = CONTINUITY_AUDIT_EVENT_TYPES;

export function transitionSafetyAnswers(): Readonly<{
  recoveryContinuesUsingW3O01cOnly: true;
  noPersistenceRedesign: true;
  noOwnershipChanges: true;
  noNewSourceOfTruth: true;
  noVersion2Changes: true;
  noMonitoringPlatform: true;
  noBusinessContinuity: true;
  noHighAvailability: true;
}> {
  return Object.freeze({
    recoveryContinuesUsingW3O01cOnly: true,
    noPersistenceRedesign: true,
    noOwnershipChanges: true,
    noNewSourceOfTruth: true,
    noVersion2Changes: true,
    noMonitoringPlatform: true,
    noBusinessContinuity: true,
    noHighAvailability: true,
  });
}

export function continuityOwnersMatchDurableSet(): boolean {
  return (
    [...W3_O01_B_DURABLE_OWNERS].sort().join(',') ===
    [...W3_O01_C_RECOVERY_ORDER].slice().sort().join(',')
  );
}
