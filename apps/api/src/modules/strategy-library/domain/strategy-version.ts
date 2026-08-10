/**
 * RC-22 Epic 2 — StrategyVersion domain entity.
 *
 * One immutable implementation of a Strategy family.
 * A family may hold multiple versions.
 *
 * Epic 2 deliberately omits certification status, evidence, envelope binding,
 * eligibility, and lifecycle transitions — those arrive in later Epics.
 *
 * Content fields are frozen at creation (no mutator APIs).
 */

import {
  assertIsoTimestamp,
  contentHash,
  exchangeScopeId,
  instrumentUniverseFromRef,
  instrumentUniverseFromSymbols,
  libraryEntryId,
  marketDomain,
  strategyFamilyId,
  strategyVersionLabel,
  timeframeCode,
  type ContentHash,
  type ExchangeScopeId,
  type InstrumentUniverse,
  type LibraryEntryId,
  type MarketDomain,
  type StrategyFamilyId,
  type StrategyVersionLabel,
  type TimeframeCode,
} from './value-objects';

export type StrategyVersion = Readonly<{
  libraryEntryId: LibraryEntryId;
  strategyFamilyId: StrategyFamilyId;
  version: StrategyVersionLabel;
  contentHash: ContentHash;
  market: MarketDomain;
  supportedExchangeScopeIds: readonly ExchangeScopeId[];
  supportedTimeframes: readonly TimeframeCode[];
  supportedUniverse: InstrumentUniverse;
  workspaceId: string;
  createdAt: string;
}>;

export type CreateStrategyVersionInput = Readonly<{
  libraryEntryId: string;
  strategyFamilyId: string;
  version: string;
  contentHash: string;
  market: string;
  supportedExchangeScopeIds: readonly string[];
  supportedTimeframes: readonly string[];
  /** Exactly one of symbols[] or universeRef must be provided. */
  supportedSymbols?: readonly string[];
  universeRef?: string;
  workspaceId: string;
  createdAt: string;
}>;

/**
 * Create an immutable StrategyVersion.
 * Does not certify, deprecate, archive, or bind envelopes.
 */
export function createStrategyVersion(input: CreateStrategyVersionInput): StrategyVersion {
  const entryId = libraryEntryId(input.libraryEntryId);
  const familyId = strategyFamilyId(input.strategyFamilyId);
  const version = strategyVersionLabel(input.version);
  const hash = contentHash(input.contentHash);
  const market = marketDomain(input.market);
  const workspaceId = input.workspaceId.trim();
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  if (input.supportedExchangeScopeIds.length === 0) {
    throw new Error('supportedExchangeScopeIds must contain at least one scope');
  }
  if (input.supportedTimeframes.length === 0) {
    throw new Error('supportedTimeframes must contain at least one timeframe');
  }

  const hasSymbols = input.supportedSymbols !== undefined && input.supportedSymbols.length > 0;
  const hasUniverseRef =
    input.universeRef !== undefined &&
    input.universeRef !== null &&
    input.universeRef.trim() !== '';
  if (hasSymbols === hasUniverseRef) {
    throw new Error('provide exactly one of supportedSymbols or universeRef');
  }

  const supportedUniverse = hasSymbols
    ? instrumentUniverseFromSymbols(input.supportedSymbols!)
    : instrumentUniverseFromRef(input.universeRef!);

  return Object.freeze({
    libraryEntryId: entryId,
    strategyFamilyId: familyId,
    version,
    contentHash: hash,
    market,
    supportedExchangeScopeIds: Object.freeze(input.supportedExchangeScopeIds.map(exchangeScopeId)),
    supportedTimeframes: Object.freeze(input.supportedTimeframes.map(timeframeCode)),
    supportedUniverse,
    workspaceId,
    createdAt: assertIsoTimestamp(input.createdAt, 'createdAt'),
  });
}

/** Family + version uniqueness key (Library invariant). */
export function strategyVersionIdentityKey(version: StrategyVersion): string {
  return `${version.strategyFamilyId}::${version.version}`;
}

/**
 * Assert that `candidate` does not collide with existing versions under the same family.
 * Throws on duplicate `strategyFamilyId + version`.
 */
export function assertUniqueStrategyVersion(
  existing: readonly StrategyVersion[],
  candidate: StrategyVersion,
): void {
  const key = strategyVersionIdentityKey(candidate);
  for (const current of existing) {
    if (strategyVersionIdentityKey(current) === key) {
      throw new Error(
        `duplicate StrategyVersion for family ${candidate.strategyFamilyId} version ${candidate.version}`,
      );
    }
    if (current.libraryEntryId === candidate.libraryEntryId) {
      throw new Error(`duplicate libraryEntryId ${candidate.libraryEntryId}`);
    }
  }
}

/**
 * Attach a new immutable version under a family, enforcing uniqueness.
 * Returns a new frozen array (does not mutate `existing`).
 */
export function appendStrategyVersion(
  existing: readonly StrategyVersion[],
  candidate: StrategyVersion,
): readonly StrategyVersion[] {
  if (existing.length > 0) {
    const familyId = existing[0]!.strategyFamilyId;
    if (candidate.strategyFamilyId !== familyId) {
      throw new Error('StrategyVersion must belong to the same strategyFamilyId');
    }
  }
  assertUniqueStrategyVersion(existing, candidate);
  return Object.freeze([...existing, candidate]);
}

/** StrategyVersion itself has no embedded certification status (Epic 3 binds externally). */
export function strategyVersionHasCertificationState(_version: StrategyVersion): false {
  void _version;
  return false;
}

/** Epic 2: no content mutators — attempts are rejected by absence of APIs. */
export function strategyVersionContentIsImmutable(version: StrategyVersion): true {
  if (!Object.isFrozen(version)) {
    throw new Error('StrategyVersion must be immutable');
  }
  return true;
}
