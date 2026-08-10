/**
 * RC-22 Epic 3–4 — StrategyCertification.
 *
 * Certification is the gate between Research and the Strategy Library.
 * It references an immutable StrategyVersion and never mutates that version.
 *
 * Epic 4: each certification binds exactly one immutable LibraryTacticalEnvelope.
 *
 * One StrategyVersion may have at most one **active** certification.
 * Status values deprecated / archived are reserved; lifecycle transitions are Epic 6.
 *
 * No eligibility gate, registration port, or Lake writes here.
 */

import {
  assertRequiredCertificationEvidence,
  certificationEvidenceIsImmutable,
  createCertificationEvidence,
  type CertificationEvidence,
  type CreateCertificationEvidenceInput,
} from './certification-evidence';
import {
  createLibraryTacticalEnvelope,
  libraryTacticalEnvelopeIsImmutable,
  replaceLibraryTacticalEnvelopeInPlace,
  type CreateLibraryTacticalEnvelopeInput,
  type LibraryTacticalEnvelope,
} from './library-tactical-envelope';
import type { StrategyVersion } from './strategy-version';
import { strategyVersionContentIsImmutable } from './strategy-version';
import { assertEnvelopeCompatibleWithStrategyVersion } from './tactical-envelope-binding';
import {
  assertIsoTimestamp,
  contentHash,
  libraryEntryId,
  strategyFamilyId,
  strategyVersionLabel,
  type ContentHash,
  type LibraryEntryId,
  type StrategyFamilyId,
  type StrategyVersionLabel,
} from './value-objects';

/** Future lifecycle statuses — only `active` is issued in Epic 3+. */
export const STRATEGY_CERTIFICATION_STATUSES = Object.freeze([
  'active',
  'deprecated',
  'archived',
] as const);

export type StrategyCertificationStatus = (typeof STRATEGY_CERTIFICATION_STATUSES)[number];

export type StrategyCertification = Readonly<{
  certificationId: string;
  libraryEntryId: LibraryEntryId;
  strategyFamilyId: StrategyFamilyId;
  version: StrategyVersionLabel;
  /** Fingerprint of the referenced StrategyVersion at admission — not a mutation. */
  contentHash: ContentHash;
  decision: 'admitted';
  /** Epic 3+ always creates `active`. Transitions deferred to Epic 6. */
  status: StrategyCertificationStatus;
  certifiedAt: string;
  certifiedBy: string;
  notes: string | null;
  evidence: readonly CertificationEvidence[];
  /** Epic 4: exactly one immutable tactical envelope per certification. */
  tacticalEnvelope: LibraryTacticalEnvelope;
  workspaceId: string;
}>;

export type CreateStrategyCertificationInput = Readonly<{
  certificationId: string;
  /** Immutable StrategyVersion being certified — not modified. */
  strategyVersion: StrategyVersion;
  certifiedBy: string;
  certifiedAt: string;
  notes?: string | null;
  evidence: readonly CreateCertificationEvidenceInput[];
  /** Required Epic 4: approved operational boundaries (configuration only). */
  tacticalEnvelope: LibraryTacticalEnvelope | CreateLibraryTacticalEnvelopeInput;
  workspaceId?: string;
}>;

/**
 * Create an immutable StrategyCertification bound to a StrategyVersion + envelope.
 * Does not mutate `strategyVersion`. Does not evaluate eligibility.
 */
export function createStrategyCertification(
  input: CreateStrategyCertificationInput,
): StrategyCertification {
  if (!strategyVersionContentIsImmutable(input.strategyVersion)) {
    throw new Error('StrategyVersion must be immutable before certification');
  }

  const certificationId = input.certificationId.trim();
  if (!certificationId) {
    throw new Error('certificationId is required');
  }
  const certifiedBy = input.certifiedBy.trim();
  if (!certifiedBy) {
    throw new Error('certifiedBy is required (human operator)');
  }

  const evidence = Object.freeze(input.evidence.map((item) => createCertificationEvidence(item)));
  assertRequiredCertificationEvidence(evidence);
  for (const item of evidence) {
    if (!certificationEvidenceIsImmutable(item)) {
      throw new Error('certification evidence must be immutable');
    }
  }

  const tacticalEnvelope = resolveEnvelope(input.tacticalEnvelope);
  assertEnvelopeCompatibleWithStrategyVersion(tacticalEnvelope, input.strategyVersion);

  const version = input.strategyVersion;
  const workspaceId = (input.workspaceId ?? version.workspaceId).trim();
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  const notes =
    input.notes === undefined || input.notes === null || input.notes.trim() === ''
      ? null
      : input.notes.trim();

  return Object.freeze({
    certificationId,
    libraryEntryId: libraryEntryId(version.libraryEntryId),
    strategyFamilyId: strategyFamilyId(version.strategyFamilyId),
    version: strategyVersionLabel(version.version),
    contentHash: contentHash(version.contentHash),
    decision: 'admitted' as const,
    status: 'active' as const,
    certifiedAt: assertIsoTimestamp(input.certifiedAt, 'certifiedAt'),
    certifiedBy,
    notes,
    evidence,
    tacticalEnvelope,
    workspaceId,
  });
}

function resolveEnvelope(
  input: LibraryTacticalEnvelope | CreateLibraryTacticalEnvelopeInput,
): LibraryTacticalEnvelope {
  if (
    typeof input === 'object' &&
    input !== null &&
    'envelopeVersion' in input &&
    'allowedSymbols' in input &&
    'riskPerTrade' in input &&
    Object.isFrozen(input) &&
    libraryTacticalEnvelopeIsImmutable(input as LibraryTacticalEnvelope)
  ) {
    return input as LibraryTacticalEnvelope;
  }
  return createLibraryTacticalEnvelope(input as CreateLibraryTacticalEnvelopeInput);
}

/** True when certification is the active admission for its version. */
export function isActiveStrategyCertification(certification: StrategyCertification): boolean {
  return certification.status === 'active' && certification.decision === 'admitted';
}

/**
 * Reject a second active certification for the same StrategyVersion (`libraryEntryId`).
 */
export function assertUniqueActiveCertification(
  existing: readonly StrategyCertification[],
  candidate: StrategyCertification,
): void {
  for (const current of existing) {
    if (current.certificationId === candidate.certificationId) {
      throw new Error(`duplicate certificationId ${candidate.certificationId}`);
    }
    if (
      current.libraryEntryId === candidate.libraryEntryId &&
      isActiveStrategyCertification(current) &&
      isActiveStrategyCertification(candidate)
    ) {
      throw new Error(
        `StrategyVersion ${candidate.libraryEntryId} already has an active certification`,
      );
    }
  }
}

/**
 * Record a new active certification among existing ones.
 * Returns a new frozen array — does not mutate StrategyVersion or `existing`.
 */
export function appendStrategyCertification(
  existing: readonly StrategyCertification[],
  candidate: StrategyCertification,
): readonly StrategyCertification[] {
  assertUniqueActiveCertification(existing, candidate);
  return Object.freeze([...existing, candidate]);
}

/**
 * Prove certification references a StrategyVersion without mutating it.
 * Compares identity + contentHash snapshot.
 */
export function certificationReferencesStrategyVersion(
  certification: StrategyCertification,
  strategyVersion: StrategyVersion,
): boolean {
  return (
    certification.libraryEntryId === strategyVersion.libraryEntryId &&
    certification.strategyFamilyId === strategyVersion.strategyFamilyId &&
    certification.version === strategyVersion.version &&
    certification.contentHash === strategyVersion.contentHash
  );
}

/**
 * Envelope mutation on an existing certification is forbidden.
 * Callers must create a new certification (typically with a new StrategyVersion).
 */
export function replaceCertificationTacticalEnvelope(
  certification: StrategyCertification,
  nextEnvelope: CreateLibraryTacticalEnvelopeInput,
): never {
  void certification;
  return replaceLibraryTacticalEnvelopeInPlace(certification.tacticalEnvelope, nextEnvelope);
}

/**
 * @deprecated Use {@link strategyLifecycleTransitionsImplemented} from strategy-lifecycle.
 * Epic 6 implements deprecate/archive via immutable lifecycle records.
 */
export function strategyCertificationLifecycleTransitionsImplemented(): true {
  return true;
}
