/**
 * RC-23 Epic 3 — Runtime Enforcement validateDeployment sequence.
 *
 * Pure fail-closed Gate over Strategy Library reads.
 * Does not write Library SoT. Does not start Sessions. Does not bind Deployments.
 *
 * Contract: docs/project/rc-23-runtime-enforcement-contract.md §§4–6
 * API: docs/project/rc-23-api-contract.md §4
 *
 * VALID ≡ pass · INVALID ≡ fail
 */

import {
  isActiveStrategyCertification,
  type StrategyCertification,
} from '../../strategy-library/domain/strategy-certification';
import { libraryTacticalEnvelopeIsImmutable } from '../../strategy-library/domain/library-tactical-envelope';
import type { StrategyEligibility } from '../../strategy-library/domain/strategy-eligibility';
import type { StrategyVersionRecord } from '../../strategy-library/ports/strategy-library-lookup.port';
import type {
  EnforcementDecision,
  EnforcementReasonCode,
  ValidateDeploymentRequest,
} from '../ports/runtime-enforcement.port';

/** Library read surface required by the Gate (no writes). */
export type ValidateDeploymentLibraryReads = Readonly<{
  getByLibraryEntryId(libraryEntryId: string): StrategyVersionRecord | null;
  getByFamilyVersion(strategyFamilyId: string, version: string): StrategyVersionRecord | null;
  /**
   * True when any Library entry exists for the family in the workspace
   * (used to distinguish strategy_not_found vs strategy_version_not_found).
   */
  familyExistsInWorkspace(workspaceId: string, strategyFamilyId: string): boolean;
}>;

/**
 * Validate a deployment request against Strategy Library SoT.
 * Never throws for expected validation failures — returns INVALID/fail.
 */
export function validateDeployment(
  cmd: ValidateDeploymentRequest,
  reads: ValidateDeploymentLibraryReads,
  nowIso: string = new Date().toISOString(),
): EnforcementDecision {
  const checkedAt = normalizeCheckedAt(cmd.requestedAt, nowIso);
  const workspaceId = cmd.workspaceId?.trim() ?? '';

  if (!workspaceId) {
    return fail(['workspace_mismatch'], checkedAt);
  }

  const resolved = resolveIdentity(cmd, reads, workspaceId);
  if (resolved.kind === 'fail') {
    return fail(resolved.reasons, checkedAt, resolved.libraryEntryId);
  }

  const record = resolved.record;
  const libraryEntryId = record.version.libraryEntryId;

  if (record.strategy.workspaceId !== workspaceId || record.version.workspaceId !== workspaceId) {
    return fail(['workspace_mismatch'], checkedAt, libraryEntryId, snapshot(record));
  }

  const reasons: EnforcementReasonCode[] = [];

  // 3. Certification Active
  const certReasons = validateCertification(record.certification);
  reasons.push(...certReasons);

  // 4. StrategyEligibility exists and eligible
  if (reasons.length === 0) {
    reasons.push(...validateEligibility(record.eligibility));
  }

  // 5. Library Tactical Envelope exists
  if (reasons.length === 0) {
    reasons.push(...validateEnvelope(record));
  }

  // 6. Optional static bounds
  if (reasons.length === 0) {
    reasons.push(...validateOptionalBounds(cmd, record));
  }

  if (reasons.length > 0) {
    return fail(reasons, checkedAt, libraryEntryId, snapshot(record));
  }

  return pass(checkedAt, libraryEntryId, snapshot(record));
}

type ResolveResult =
  | { kind: 'ok'; record: StrategyVersionRecord }
  | {
      kind: 'fail';
      reasons: readonly EnforcementReasonCode[];
      libraryEntryId?: string;
    };

function resolveIdentity(
  cmd: ValidateDeploymentRequest,
  reads: ValidateDeploymentLibraryReads,
  workspaceId: string,
): ResolveResult {
  const libraryEntryId = cmd.libraryEntryId?.trim() || undefined;
  const strategyFamilyId = cmd.strategyFamilyId?.trim() || undefined;
  const strategyVersion = cmd.strategyVersion?.trim() || undefined;

  const hasEntry = Boolean(libraryEntryId);
  const hasFamilyVersion = Boolean(strategyFamilyId && strategyVersion);
  const hasPartialFamily = Boolean(strategyFamilyId) !== Boolean(strategyVersion);

  if (!hasEntry && !hasFamilyVersion) {
    return { kind: 'fail', reasons: Object.freeze(['identity_ambiguous']) };
  }
  if (hasPartialFamily && !hasEntry) {
    return { kind: 'fail', reasons: Object.freeze(['identity_ambiguous']) };
  }

  if (hasEntry) {
    const byId = reads.getByLibraryEntryId(libraryEntryId!);
    if (!byId) {
      return {
        kind: 'fail',
        reasons: Object.freeze(['strategy_version_not_found']),
        libraryEntryId,
      };
    }
    if (hasFamilyVersion) {
      if (
        byId.strategy.strategyFamilyId !== strategyFamilyId ||
        byId.version.version !== strategyVersion
      ) {
        return {
          kind: 'fail',
          reasons: Object.freeze(['identity_ambiguous']),
          libraryEntryId,
        };
      }
    }
    return { kind: 'ok', record: byId };
  }

  // family + version path
  const byFamily = reads.getByFamilyVersion(strategyFamilyId!, strategyVersion!);
  if (byFamily) {
    return { kind: 'ok', record: byFamily };
  }

  if (reads.familyExistsInWorkspace(workspaceId, strategyFamilyId!)) {
    return {
      kind: 'fail',
      reasons: Object.freeze(['strategy_version_not_found']),
    };
  }

  return {
    kind: 'fail',
    reasons: Object.freeze(['strategy_not_found']),
  };
}

function validateCertification(
  certification: StrategyCertification | null,
): EnforcementReasonCode[] {
  if (!certification) {
    return ['certification_missing'];
  }
  if (certification.decision !== 'admitted') {
    return ['certification_not_admitted'];
  }
  if (certification.status === 'deprecated') {
    return ['certification_deprecated'];
  }
  if (certification.status === 'archived') {
    return ['certification_archived'];
  }
  if (!isActiveStrategyCertification(certification)) {
    return ['certification_not_active'];
  }
  return [];
}

function validateEligibility(eligibility: StrategyEligibility | null): EnforcementReasonCode[] {
  if (!eligibility) {
    return ['eligibility_missing'];
  }
  if (eligibility.outcome !== 'eligible') {
    return ['eligibility_ineligible'];
  }
  return [];
}

function validateEnvelope(record: StrategyVersionRecord): EnforcementReasonCode[] {
  const envelope = record.tacticalEnvelope ?? record.certification?.tacticalEnvelope ?? null;
  if (!envelope) {
    return ['envelope_missing'];
  }
  try {
    if (!libraryTacticalEnvelopeIsImmutable(envelope)) {
      return ['envelope_not_immutable'];
    }
  } catch {
    return ['envelope_not_immutable'];
  }
  return [];
}

function validateOptionalBounds(
  cmd: ValidateDeploymentRequest,
  record: StrategyVersionRecord,
): EnforcementReasonCode[] {
  const envelope = record.tacticalEnvelope ?? record.certification?.tacticalEnvelope;
  if (!envelope) {
    return [];
  }

  const reasons: EnforcementReasonCode[] = [];
  const scope = cmd.exchangeScopeId?.trim();
  if (scope) {
    const allowed =
      envelope.allowedExchangeScopeIds.includes(scope) ||
      record.version.supportedExchangeScopeIds.includes(
        scope as (typeof record.version.supportedExchangeScopeIds)[number],
      );
    if (!allowed) {
      reasons.push('scope_not_allowed');
    }
  }

  const tactic = cmd.tacticPoint;
  if (tactic && typeof tactic === 'object') {
    const symbol = typeof tactic.symbol === 'string' ? tactic.symbol.trim() : undefined;
    const timeframe = typeof tactic.timeframe === 'string' ? tactic.timeframe.trim() : undefined;
    const tacticScope =
      typeof tactic.exchangeScopeId === 'string' ? tactic.exchangeScopeId.trim() : undefined;
    const risk = typeof tactic.riskPerTrade === 'number' ? tactic.riskPerTrade : undefined;

    if (symbol !== undefined && (!symbol || !envelope.allowedSymbols.includes(symbol))) {
      reasons.push('envelope_violation');
    }
    if (
      timeframe !== undefined &&
      (!timeframe || !envelope.allowedTimeframes.includes(timeframe))
    ) {
      reasons.push('envelope_violation');
    }
    if (
      tacticScope !== undefined &&
      (!tacticScope || !envelope.allowedExchangeScopeIds.includes(tacticScope))
    ) {
      reasons.push('scope_not_allowed');
    }
    if (risk !== undefined) {
      const limit = envelope.riskPerTrade;
      let ok = false;
      if ('kind' in limit && limit.kind === 'set') {
        ok = limit.values.includes(risk);
      } else if ('min' in limit && 'max' in limit) {
        ok = risk >= limit.min && risk <= limit.max;
      }
      if (!ok) {
        reasons.push('envelope_violation');
      }
    }
  }

  return reasons;
}

type Snapshot = Readonly<{
  certificationStatus?: string;
  eligibilityOutcome?: 'eligible' | 'ineligible' | 'unknown';
}>;

function snapshot(record: StrategyVersionRecord): Snapshot {
  return {
    certificationStatus: record.certification?.status,
    eligibilityOutcome: record.eligibility?.outcome ?? 'unknown',
  };
}

function normalizeCheckedAt(requestedAt: string | undefined, nowIso: string): string {
  if (typeof requestedAt === 'string' && requestedAt.trim() !== '') {
    return requestedAt.trim();
  }
  return nowIso;
}

function pass(checkedAt: string, libraryEntryId: string, snap: Snapshot): EnforcementDecision {
  return Object.freeze({
    outcome: 'pass',
    validation: 'VALID',
    reasons: Object.freeze([]),
    libraryEntryId,
    certificationStatus: snap.certificationStatus,
    eligibilityOutcome: snap.eligibilityOutcome,
    checkedAt,
  });
}

function fail(
  reasons: readonly EnforcementReasonCode[],
  checkedAt: string,
  libraryEntryId?: string,
  snap?: Snapshot,
): EnforcementDecision {
  const unique = Object.freeze([...new Set(reasons)]);
  return Object.freeze({
    outcome: 'fail',
    validation: 'INVALID',
    reasons: unique,
    ...(libraryEntryId ? { libraryEntryId } : {}),
    ...(snap?.certificationStatus ? { certificationStatus: snap.certificationStatus } : {}),
    ...(snap?.eligibilityOutcome ? { eligibilityOutcome: snap.eligibilityOutcome } : {}),
    checkedAt,
  });
}
