/**
 * RC-22 Epic 4 — Tactical Envelope binding to StrategyCertification.
 *
 * One certified StrategyVersion / active certification references exactly one
 * immutable LibraryTacticalEnvelope.
 *
 * Binding never mutates StrategyVersion.
 * Envelope expansion ⇒ new certification (no in-place replace).
 */

import {
  createLibraryTacticalEnvelope,
  libraryTacticalEnvelopeIsImmutable,
  type CreateLibraryTacticalEnvelopeInput,
  type LibraryTacticalEnvelope,
} from './library-tactical-envelope';
import type { StrategyVersion } from './strategy-version';

/**
 * Validate envelope configuration against the referenced StrategyVersion allowlists.
 * Configuration alignment only — no runtime / eligibility decisions.
 */
export function assertEnvelopeCompatibleWithStrategyVersion(
  envelope: LibraryTacticalEnvelope,
  strategyVersion: StrategyVersion,
): void {
  if (!envelope.allowedMarkets.includes(strategyVersion.market)) {
    throw new Error(
      `tactical envelope allowedMarkets must include StrategyVersion market ${strategyVersion.market}`,
    );
  }

  for (const scopeId of envelope.allowedExchangeScopeIds) {
    if (!strategyVersion.supportedExchangeScopeIds.includes(scopeId as never)) {
      throw new Error(
        `tactical envelope exchange scope ${scopeId} is not in StrategyVersion allowlist`,
      );
    }
  }

  for (const timeframe of envelope.allowedTimeframes) {
    if (!strategyVersion.supportedTimeframes.includes(timeframe as never)) {
      throw new Error(
        `tactical envelope timeframe ${timeframe} is not in StrategyVersion allowlist`,
      );
    }
  }

  if (strategyVersion.supportedUniverse.kind === 'symbols') {
    const allowed = new Set(strategyVersion.supportedUniverse.symbols as readonly string[]);
    for (const symbol of envelope.allowedSymbols) {
      if (!allowed.has(symbol)) {
        throw new Error(
          `tactical envelope symbol ${symbol} is not in StrategyVersion supportedSymbols`,
        );
      }
    }
  }
}

export type TacticalEnvelopeBinding = Readonly<{
  certificationId: string;
  libraryEntryId: string;
  envelope: LibraryTacticalEnvelope;
}>;

/**
 * Bind exactly one immutable envelope to a certification id + version id.
 * Does not mutate StrategyVersion.
 */
export function bindTacticalEnvelopeToCertification(input: {
  certificationId: string;
  strategyVersion: StrategyVersion;
  envelope: LibraryTacticalEnvelope | CreateLibraryTacticalEnvelopeInput;
}): TacticalEnvelopeBinding {
  const certificationId = input.certificationId.trim();
  if (!certificationId) {
    throw new Error('certificationId is required');
  }

  const envelope =
    'envelopeVersion' in input.envelope && Object.isFrozen(input.envelope)
      ? (input.envelope as LibraryTacticalEnvelope)
      : createLibraryTacticalEnvelope(input.envelope as CreateLibraryTacticalEnvelopeInput);

  if (!libraryTacticalEnvelopeIsImmutable(envelope)) {
    throw new Error('tactical envelope must be immutable');
  }

  assertEnvelopeCompatibleWithStrategyVersion(envelope, input.strategyVersion);

  return Object.freeze({
    certificationId,
    libraryEntryId: input.strategyVersion.libraryEntryId,
    envelope,
  });
}

/**
 * One certification may reference only one envelope.
 * Rejects attempts to attach a second distinct envelope to the same certification.
 */
export function assertOneEnvelopePerCertification(
  existing: TacticalEnvelopeBinding | null | undefined,
  candidate: TacticalEnvelopeBinding,
): void {
  if (!existing) {
    return;
  }
  if (existing.certificationId !== candidate.certificationId) {
    return;
  }
  if (existing.envelope.envelopeVersion !== candidate.envelope.envelopeVersion) {
    throw new Error(
      `certification ${candidate.certificationId} already has envelope ${existing.envelope.envelopeVersion}; changing an envelope requires a new certification`,
    );
  }
  // Same version id — treat as idempotent only when structurally identical reference
  if (existing.envelope !== candidate.envelope) {
    throw new Error(
      `certification ${candidate.certificationId} already has a bound tactical envelope`,
    );
  }
}

/** Epic 4: envelope is configuration only — no runtime adaptation APIs. */
export function tacticalEnvelopeRuntimeAdaptationImplemented(): false {
  return false;
}
