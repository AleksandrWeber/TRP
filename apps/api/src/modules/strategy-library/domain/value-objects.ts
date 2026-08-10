/**
 * RC-22 Epic 2 — Strategy Library value objects.
 *
 * Identity and fingerprint types for Strategy / StrategyVersion.
 * No certification, eligibility, or envelope types here.
 */

export type StrategyFamilyId = string & { readonly __brand: 'StrategyFamilyId' };
export type LibraryEntryId = string & { readonly __brand: 'LibraryEntryId' };
export type StrategyVersionLabel = string & { readonly __brand: 'StrategyVersionLabel' };
export type ContentHash = string & { readonly __brand: 'ContentHash' };
export type MarketDomain = string & { readonly __brand: 'MarketDomain' };
export type ExchangeScopeId = string & { readonly __brand: 'ExchangeScopeId' };
export type TimeframeCode = string & { readonly __brand: 'TimeframeCode' };
export type SymbolCode = string & { readonly __brand: 'SymbolCode' };

export type InstrumentUniverse = Readonly<
  | { kind: 'symbols'; symbols: readonly SymbolCode[] }
  | { kind: 'universe-ref'; universeRef: string }
>;

function requiredTrimmed(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

export function strategyFamilyId(value: string): StrategyFamilyId {
  return requiredTrimmed(value, 'strategyFamilyId') as StrategyFamilyId;
}

export function libraryEntryId(value: string): LibraryEntryId {
  return requiredTrimmed(value, 'libraryEntryId') as LibraryEntryId;
}

export function strategyVersionLabel(value: string): StrategyVersionLabel {
  return requiredTrimmed(value, 'version') as StrategyVersionLabel;
}

export function contentHash(value: string): ContentHash {
  return requiredTrimmed(value, 'contentHash') as ContentHash;
}

export function marketDomain(value: string): MarketDomain {
  return requiredTrimmed(value, 'market') as MarketDomain;
}

export function exchangeScopeId(value: string): ExchangeScopeId {
  return requiredTrimmed(value, 'exchangeScopeId') as ExchangeScopeId;
}

export function timeframeCode(value: string): TimeframeCode {
  return requiredTrimmed(value, 'timeframe') as TimeframeCode;
}

export function symbolCode(value: string): SymbolCode {
  return requiredTrimmed(value, 'symbol') as SymbolCode;
}

export function instrumentUniverseFromSymbols(symbols: readonly string[]): InstrumentUniverse {
  if (symbols.length === 0) {
    throw new Error('supportedSymbols must contain at least one symbol');
  }
  return Object.freeze({
    kind: 'symbols',
    symbols: Object.freeze(symbols.map(symbolCode)),
  });
}

export function instrumentUniverseFromRef(universeRef: string): InstrumentUniverse {
  return Object.freeze({
    kind: 'universe-ref',
    universeRef: requiredTrimmed(universeRef, 'universeRef'),
  });
}

export function assertIsoTimestamp(value: string, field: string): string {
  const trimmed = requiredTrimmed(value, field);
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${field} must be an ISO-8601 timestamp`);
  }
  return trimmed;
}
