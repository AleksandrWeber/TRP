/**
 * RC-22 Epic 6 — Strategy lifecycle (deprecation / archive).
 *
 * Completes the Strategy Library domain with immutable lifecycle records.
 * Transitions never mutate an existing certification in place — they emit a
 * new lifecycle record and a new frozen certification snapshot with updated status.
 *
 * Phases: certified (active) → deprecated → archived
 * Archived strategies remain historically queryable.
 * Deprecated / archived cannot receive new eligibility records.
 *
 * No runtime. No Orchestrator. No eligibility/certification model redesign.
 */

import {
  isActiveStrategyCertification,
  type StrategyCertification,
  type StrategyCertificationStatus,
} from './strategy-certification';
import { assertIsoTimestamp } from './value-objects';

/** Product / policy lifecycle phases (maps to certification.status). */
export const STRATEGY_LIFECYCLE_PHASES = Object.freeze([
  'certified',
  'deprecated',
  'archived',
] as const);

export type StrategyLifecyclePhase = (typeof STRATEGY_LIFECYCLE_PHASES)[number];

export type StrategyLifecycleRecord = Readonly<{
  lifecycleRecordId: string;
  certificationId: string;
  libraryEntryId: string;
  fromPhase: StrategyLifecyclePhase;
  toPhase: StrategyLifecyclePhase;
  reason: string;
  changedBy: string;
  changedAt: string;
  /** Snapshot of certification contentHash — must remain unchanged across transitions. */
  contentHash: string;
  envelopeVersion: string;
  workspaceId: string;
}>;

export type LifecycleTransitionResult = Readonly<{
  /** New frozen certification snapshot (status updated). Input is not mutated. */
  certification: StrategyCertification;
  lifecycleRecord: StrategyLifecycleRecord;
}>;

export function certificationStatusToLifecyclePhase(
  status: StrategyCertificationStatus,
): StrategyLifecyclePhase {
  switch (status) {
    case 'active':
      return 'certified';
    case 'deprecated':
      return 'deprecated';
    case 'archived':
      return 'archived';
  }
}

export function lifecyclePhaseToCertificationStatus(
  phase: StrategyLifecyclePhase,
): StrategyCertificationStatus {
  switch (phase) {
    case 'certified':
      return 'active';
    case 'deprecated':
      return 'deprecated';
    case 'archived':
      return 'archived';
  }
}

/** Deprecated and archived remain historically queryable. */
export function isHistoricallyQueryable(phase: StrategyLifecyclePhase): true {
  void phase;
  return true;
}

/** Only certified (active) certifications may receive new eligibility records. */
export function canReceiveNewEligibilityRecord(certification: StrategyCertification): boolean {
  return isActiveStrategyCertification(certification);
}

const ALLOWED_TRANSITIONS: Readonly<
  Record<StrategyLifecyclePhase, readonly StrategyLifecyclePhase[]>
> = Object.freeze({
  certified: Object.freeze(['deprecated', 'archived'] as const),
  deprecated: Object.freeze(['archived'] as const),
  archived: Object.freeze([] as const),
});

export function assertAllowedLifecycleTransition(
  from: StrategyLifecyclePhase,
  to: StrategyLifecyclePhase,
): void {
  if (from === to) {
    throw new Error(`lifecycle noop forbidden: already ${from}`);
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`illegal lifecycle transition: ${from} → ${to}`);
  }
}

function createLifecycleRecord(input: {
  lifecycleRecordId: string;
  certification: StrategyCertification;
  fromPhase: StrategyLifecyclePhase;
  toPhase: StrategyLifecyclePhase;
  reason: string;
  changedBy: string;
  changedAt: string;
}): StrategyLifecycleRecord {
  const lifecycleRecordId = input.lifecycleRecordId.trim();
  if (!lifecycleRecordId) {
    throw new Error('lifecycleRecordId is required');
  }
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('reason is required');
  }
  const changedBy = input.changedBy.trim();
  if (!changedBy) {
    throw new Error('changedBy is required');
  }

  return Object.freeze({
    lifecycleRecordId,
    certificationId: input.certification.certificationId,
    libraryEntryId: input.certification.libraryEntryId,
    fromPhase: input.fromPhase,
    toPhase: input.toPhase,
    reason,
    changedBy,
    changedAt: assertIsoTimestamp(input.changedAt, 'changedAt'),
    contentHash: input.certification.contentHash,
    envelopeVersion: input.certification.tacticalEnvelope.envelopeVersion,
    workspaceId: input.certification.workspaceId,
  });
}

function withCertificationStatus(
  certification: StrategyCertification,
  status: StrategyCertificationStatus,
): StrategyCertification {
  return Object.freeze({
    ...certification,
    status,
    evidence: Object.freeze([...certification.evidence]),
    tacticalEnvelope: certification.tacticalEnvelope,
  });
}

function transitionCertification(input: {
  lifecycleRecordId: string;
  certification: StrategyCertification;
  toPhase: StrategyLifecyclePhase;
  reason: string;
  changedBy: string;
  changedAt: string;
}): LifecycleTransitionResult {
  const fromPhase = certificationStatusToLifecyclePhase(input.certification.status);
  assertAllowedLifecycleTransition(fromPhase, input.toPhase);

  const lifecycleRecord = createLifecycleRecord({
    lifecycleRecordId: input.lifecycleRecordId,
    certification: input.certification,
    fromPhase,
    toPhase: input.toPhase,
    reason: input.reason,
    changedBy: input.changedBy,
    changedAt: input.changedAt,
  });

  const nextStatus = lifecyclePhaseToCertificationStatus(input.toPhase);
  const nextCertification = withCertificationStatus(input.certification, nextStatus);

  if (nextCertification.contentHash !== input.certification.contentHash) {
    throw new Error('lifecycle transition must not change contentHash');
  }
  if (nextCertification.tacticalEnvelope !== input.certification.tacticalEnvelope) {
    throw new Error('lifecycle transition must not change tactical envelope');
  }

  return Object.freeze({
    certification: nextCertification,
    lifecycleRecord,
  });
}

/**
 * Deprecate a certified strategy certification.
 * Creates a new lifecycle record + new certification snapshot (status=deprecated).
 * Does not mutate the input certification.
 */
export function deprecateStrategyCertification(input: {
  lifecycleRecordId: string;
  certification: StrategyCertification;
  reason: string;
  deprecatedBy: string;
  deprecatedAt: string;
}): LifecycleTransitionResult {
  return transitionCertification({
    lifecycleRecordId: input.lifecycleRecordId,
    certification: input.certification,
    toPhase: 'deprecated',
    reason: input.reason,
    changedBy: input.deprecatedBy,
    changedAt: input.deprecatedAt,
  });
}

/**
 * Archive a certified or deprecated strategy certification.
 * Creates a new lifecycle record + new certification snapshot (status=archived).
 * Does not mutate the input certification. Not a delete.
 */
export function archiveStrategyCertification(input: {
  lifecycleRecordId: string;
  certification: StrategyCertification;
  reason: string;
  archivedBy: string;
  archivedAt: string;
}): LifecycleTransitionResult {
  return transitionCertification({
    lifecycleRecordId: input.lifecycleRecordId,
    certification: input.certification,
    toPhase: 'archived',
    reason: input.reason,
    changedBy: input.archivedBy,
    changedAt: input.archivedAt,
  });
}

/**
 * Append an immutable lifecycle record to history (audit / archaeology).
 * Does not mutate `existing`.
 */
export function appendStrategyLifecycleRecord(
  existing: readonly StrategyLifecycleRecord[],
  record: StrategyLifecycleRecord,
): readonly StrategyLifecycleRecord[] {
  for (const current of existing) {
    if (current.lifecycleRecordId === record.lifecycleRecordId) {
      throw new Error(`duplicate lifecycleRecordId ${record.lifecycleRecordId}`);
    }
  }
  return Object.freeze([...existing, record]);
}

/**
 * Historical query: all lifecycle records for a certification (including archived).
 */
export function listLifecycleHistoryForCertification(
  history: readonly StrategyLifecycleRecord[],
  certificationId: string,
): readonly StrategyLifecycleRecord[] {
  return Object.freeze(history.filter((r) => r.certificationId === certificationId));
}

export function strategyLifecycleRecordIsImmutable(record: StrategyLifecycleRecord): true {
  if (!Object.isFrozen(record)) {
    throw new Error('StrategyLifecycleRecord must be immutable');
  }
  return true;
}

/** Epic 6: lifecycle transitions are implemented at the domain layer. */
export function strategyLifecycleTransitionsImplemented(): true {
  return true;
}

/** No hard-delete lifecycle API. */
export function strategyLifecycleHardDeleteImplemented(): false {
  return false;
}
