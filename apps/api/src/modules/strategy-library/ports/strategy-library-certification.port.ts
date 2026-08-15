/**
 * RC-22 — Strategy Library Certification Port (write).
 *
 * Locked application command: admit an immutable StrategyVersion into Library.
 * Contract: docs/project/rc-22-api-contract.md §5
 *
 * PC-02 activates Nest + HTTP transport. Domain rules stay in
 * createStrategyCertification. This port does not own strategies;
 * Library remains the sole Strategy SoT.
 *
 * Forbidden by design (do not add):
 * - hot-edit certified content
 * - restore-to-certified
 * - certifyFromLake / certifyFromProfitMetric
 * - AI as certifiedBy
 * - Session / Deployment auto-bind
 * - new certification authority
 */

import type { CreateCertificationEvidenceInput } from '../domain/certification-evidence';
import type { CreateLibraryTacticalEnvelopeInput } from '../domain/library-tactical-envelope';

export const STRATEGY_LIBRARY_CERTIFICATION_PORT = Symbol('STRATEGY_LIBRARY_CERTIFICATION_PORT');

export const CERTIFICATION_OUTCOMES = Object.freeze(['certified', 'rejected', 'conflict'] as const);

export type CertificationOutcome = (typeof CERTIFICATION_OUTCOMES)[number];

export const CERTIFICATION_REASON_CODES = Object.freeze([
  'missing_evidence',
  'missing_evidence_backtesting',
  'missing_evidence_walk_forward',
  'invalid_envelope',
  'unfrozen_identity',
  'invalid_candidate',
  'certified_by_required',
  'version_already_certified',
  'duplicate_library_entry',
] as const);

export type CertificationReasonCode = (typeof CERTIFICATION_REASON_CODES)[number];

export type CertifyStrategyFamilyInput = Readonly<{
  strategyFamilyId?: string;
  name: string;
  description?: string | null;
  registryRef?: string | null;
}>;

export type CertifyStrategyVersionInput = Readonly<{
  version: string;
  contentHash: string;
  market: string;
  supportedExchangeScopeIds: readonly string[];
  supportedTimeframes: readonly string[];
  supportedSymbols?: readonly string[];
  universeRef?: string;
}>;

/** Inline payload equivalent of prepareCandidate + certify (API Contract §5.2). */
export type CertifyStrategyVersionCommand = Readonly<{
  workspaceId: string;
  certifiedBy: string;
  notes?: string | null;
  family: CertifyStrategyFamilyInput;
  version: CertifyStrategyVersionInput;
  evidence: readonly CreateCertificationEvidenceInput[];
  tacticalEnvelope: CreateLibraryTacticalEnvelopeInput;
}>;

export type CertificationAttemptMetadata = Readonly<{
  strategyFamilyId: string | null;
  name: string | null;
  version: string | null;
  contentHash: string | null;
  registryRef: string | null;
  evidenceTypes: readonly string[];
  envelopeVersion: string | null;
}>;

/**
 * Product-visible record of a certify command (success or failure).
 * Not a second Strategy SoT — membership lives on Lookup.
 */
export type CertificationAttemptRecord = Readonly<{
  attemptId: string;
  workspaceId: string;
  outcome: CertificationOutcome;
  progress: 'complete';
  reasons: readonly string[];
  libraryEntryId: string | null;
  certificationId: string | null;
  certifiedBy: string;
  certifiedAt: string | null;
  createdAt: string;
  notes: string | null;
  metadata: CertificationAttemptMetadata;
}>;

export type CertifyResult = CertificationAttemptRecord;

export type CertificationHistoryQuery = Readonly<{
  workspaceId: string;
  limit?: number;
}>;

export type CertificationHistoryPage = Readonly<{
  items: readonly CertificationAttemptRecord[];
}>;

/**
 * Strategy Library Certification write + attempt reads.
 * Reads are history of this command, not Library membership Lookup.
 */
export interface StrategyLibraryCertificationPort {
  certify(cmd: CertifyStrategyVersionCommand): CertifyResult;
  getAttempt(attemptId: string, workspaceId: string): CertificationAttemptRecord | null;
  listHistory(query: CertificationHistoryQuery): CertificationHistoryPage;
}
