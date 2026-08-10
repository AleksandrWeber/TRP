/**
 * RC-22 Epic 5 — StrategyEligibility (domain gate).
 *
 * Determines whether a certified strategy may be selected by *future* runtime
 * consumers. This is a domain decision — not runtime execution, not Orchestrator,
 * not Strategy Selector, and not Session lifecycle.
 *
 * Eligibility references StrategyCertification + LibraryTacticalEnvelope.
 * It never references Trading Sessions and never mutates Certification.
 *
 * Changing eligibility rules ⇒ new eligibility record (no in-place rule mutate).
 */

import {
  REQUIRED_CERTIFICATION_EVIDENCE_TYPES,
  type CertificationEvidenceType,
} from './certification-evidence';
import { libraryTacticalEnvelopeIsImmutable } from './library-tactical-envelope';
import {
  isActiveStrategyCertification,
  type StrategyCertification,
} from './strategy-certification';
import { assertIsoTimestamp } from './value-objects';

export type EligibilityOutcome = 'eligible' | 'ineligible';

export const ELIGIBILITY_REASON_CODES = Object.freeze([
  'eligible',
  'certification_missing',
  'certification_not_active',
  'certification_not_admitted',
  'certification_deprecated',
  'certification_archived',
  'evidence_incomplete',
  'envelope_missing',
  'envelope_not_immutable',
  'scope_not_allowed',
  'envelope_violation',
] as const);

export type EligibilityReasonCode = (typeof ELIGIBILITY_REASON_CODES)[number];

/** Optional static tactic point check (configuration ⊆ envelope) — not live market state. */
export type EligibilityTacticPoint = Readonly<{
  symbol?: string;
  timeframe?: string;
  exchangeScopeId?: string;
  riskPerTrade?: number;
}>;

/**
 * Immutable eligibility decision record.
 * Does not embed Session ids. Does not mutate Certification.
 */
export type StrategyEligibility = Readonly<{
  eligibilityId: string;
  certificationId: string | null;
  libraryEntryId: string | null;
  envelopeVersion: string | null;
  outcome: EligibilityOutcome;
  reasons: readonly EligibilityReasonCode[];
  /** Version of the static eligibility rules used for this record. */
  rulesVersion: string;
  evaluatedAt: string;
  workspaceId: string | null;
}>;

export type EvaluateStrategyEligibilityInput = Readonly<{
  eligibilityId: string;
  /** Active certification under evaluation — never modified. */
  certification: StrategyCertification | null | undefined;
  rulesVersion: string;
  evaluatedAt: string;
  workspaceId?: string | null;
  /** Optional static tactic point (must be ⊆ envelope when provided). */
  tacticPoint?: EligibilityTacticPoint;
}>;

/**
 * Evaluate static domain eligibility conditions.
 * Does not inspect markets, exchange live state, positions, or sessions.
 */
export function evaluateStrategyEligibility(
  input: EvaluateStrategyEligibilityInput,
): StrategyEligibility {
  const eligibilityId = input.eligibilityId.trim();
  if (!eligibilityId) {
    throw new Error('eligibilityId is required');
  }
  const rulesVersion = input.rulesVersion.trim();
  if (!rulesVersion) {
    throw new Error('rulesVersion is required');
  }
  const evaluatedAt = assertIsoTimestamp(input.evaluatedAt, 'evaluatedAt');
  const workspaceId =
    input.workspaceId === undefined || input.workspaceId === null || input.workspaceId.trim() === ''
      ? null
      : input.workspaceId.trim();

  const reasons: EligibilityReasonCode[] = [];
  const certification = input.certification;

  if (!certification) {
    reasons.push('certification_missing');
    return freezeEligibility({
      eligibilityId,
      certificationId: null,
      libraryEntryId: null,
      envelopeVersion: null,
      outcome: 'ineligible',
      reasons,
      rulesVersion,
      evaluatedAt,
      workspaceId,
    });
  }

  // Snapshot identities only — do not mutate certification.
  const certificationId = certification.certificationId;
  const libraryEntryId = certification.libraryEntryId;
  const envelopeVersion = certification.tacticalEnvelope?.envelopeVersion ?? null;

  if (certification.decision !== 'admitted') {
    reasons.push('certification_not_admitted');
  }

  if (certification.status === 'deprecated') {
    reasons.push('certification_deprecated');
  } else if (certification.status === 'archived') {
    reasons.push('certification_archived');
  } else if (!isActiveStrategyCertification(certification)) {
    reasons.push('certification_not_active');
  }

  if (!hasRequiredEvidence(certification)) {
    reasons.push('evidence_incomplete');
  }

  if (!certification.tacticalEnvelope) {
    reasons.push('envelope_missing');
  } else if (!libraryTacticalEnvelopeIsImmutable(certification.tacticalEnvelope)) {
    reasons.push('envelope_not_immutable');
  } else if (input.tacticPoint) {
    const tacticReasons = evaluateTacticPoint(certification, input.tacticPoint);
    reasons.push(...tacticReasons);
  }

  const outcome: EligibilityOutcome = reasons.length === 0 ? 'eligible' : 'ineligible';
  if (outcome === 'eligible') {
    reasons.push('eligible');
  }

  return freezeEligibility({
    eligibilityId,
    certificationId,
    libraryEntryId,
    envelopeVersion,
    outcome,
    reasons: Object.freeze(reasons),
    rulesVersion,
    evaluatedAt,
    workspaceId: workspaceId ?? certification.workspaceId,
  });
}

/**
 * Create an eligibility record only when the strategy is eligible.
 * Uncertified / incomplete inputs are rejected (no eligible record).
 */
export function createStrategyEligibility(
  input: EvaluateStrategyEligibilityInput,
): StrategyEligibility {
  const decision = evaluateStrategyEligibility(input);
  if (decision.outcome !== 'eligible') {
    throw new Error(
      `strategy is not eligible: ${decision.reasons.filter((r) => r !== 'eligible').join(',')}`,
    );
  }
  if (!decision.certificationId) {
    throw new Error('eligible record requires certificationId');
  }
  return decision;
}

function hasRequiredEvidence(certification: StrategyCertification): boolean {
  const types = new Set(certification.evidence.map((e) => e.type));
  return REQUIRED_CERTIFICATION_EVIDENCE_TYPES.every((required: CertificationEvidenceType) =>
    types.has(required),
  );
}

function evaluateTacticPoint(
  certification: StrategyCertification,
  tacticPoint: EligibilityTacticPoint,
): EligibilityReasonCode[] {
  const envelope = certification.tacticalEnvelope;
  const reasons: EligibilityReasonCode[] = [];

  if (tacticPoint.symbol !== undefined) {
    const symbol = tacticPoint.symbol.trim();
    if (!symbol || !envelope.allowedSymbols.includes(symbol)) {
      reasons.push('envelope_violation');
    }
  }
  if (tacticPoint.timeframe !== undefined) {
    const timeframe = tacticPoint.timeframe.trim();
    if (!timeframe || !envelope.allowedTimeframes.includes(timeframe)) {
      reasons.push('envelope_violation');
    }
  }
  if (tacticPoint.exchangeScopeId !== undefined) {
    const scopeId = tacticPoint.exchangeScopeId.trim();
    if (!scopeId || !envelope.allowedExchangeScopeIds.includes(scopeId)) {
      reasons.push('scope_not_allowed');
    }
  }
  if (tacticPoint.riskPerTrade !== undefined) {
    if (!riskWithinEnvelope(envelope.riskPerTrade, tacticPoint.riskPerTrade)) {
      reasons.push('envelope_violation');
    }
  }

  return reasons;
}

function riskWithinEnvelope(
  limit: StrategyCertification['tacticalEnvelope']['riskPerTrade'],
  value: number,
): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  if ('kind' in limit && limit.kind === 'set') {
    return limit.values.includes(value);
  }
  const range = limit as { min: number; max: number };
  return value >= range.min && value <= range.max;
}

function freezeEligibility(record: StrategyEligibility): StrategyEligibility {
  return Object.freeze({
    ...record,
    reasons: Object.freeze([...record.reasons]),
  });
}

export function strategyEligibilityIsImmutable(eligibility: StrategyEligibility): true {
  if (!Object.isFrozen(eligibility)) {
    throw new Error('StrategyEligibility must be immutable');
  }
  return true;
}

/** Eligibility never mutates certification — proven by absence of write APIs. */
export function eligibilityMutatesCertification(): false {
  return false;
}

/**
 * Changing eligibility rules requires a new record.
 * In-place rule mutation is forbidden.
 */
export function replaceEligibilityRulesInPlace(
  _eligibility: StrategyEligibility,
  _nextRulesVersion: string,
): never {
  throw new Error(
    'StrategyEligibility rules are immutable; changing eligibility rules creates a new eligibility record',
  );
}

/** Epic 5: no runtime / Orchestrator / Strategy Selector integration. */
export function eligibilityRuntimeIntegrationImplemented(): false {
  return false;
}

/**
 * Prove an eligibility record references a certification without mutating it.
 */
export function eligibilityReferencesCertification(
  eligibility: StrategyEligibility,
  certification: StrategyCertification,
): boolean {
  return (
    eligibility.certificationId === certification.certificationId &&
    eligibility.libraryEntryId === certification.libraryEntryId &&
    eligibility.envelopeVersion === certification.tacticalEnvelope.envelopeVersion
  );
}
