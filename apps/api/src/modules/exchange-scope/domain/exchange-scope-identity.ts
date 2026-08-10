/**
 * RC-19 Epic 1 — Exchange Scope identity only.
 *
 * Isolation boundary identity for one exchange (UI: Cluster).
 * No policies, routing, capacity, or orchestration in this epic.
 */

export const DEFAULT_BINANCE_EXCHANGE_SCOPE_ID = 'exchange-scope:binance' as const;

export type ExchangeScopeIdentity = Readonly<{
  id: typeof DEFAULT_BINANCE_EXCHANGE_SCOPE_ID;
  exchangeCode: 'binance';
  label: 'Binance';
}>;

/** Sole default Exchange Scope for the current paper Freeze (single venue). */
export const DEFAULT_BINANCE_EXCHANGE_SCOPE: ExchangeScopeIdentity = Object.freeze({
  id: DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  exchangeCode: 'binance',
  label: 'Binance',
});

/**
 * Resolves Exchange Scope identity for persistence.
 * Empty / omitted values receive the default Binance scope.
 */
export function resolveExchangeScopeId(value?: string | null): string {
  if (value === undefined || value === null) {
    return DEFAULT_BINANCE_EXCHANGE_SCOPE_ID;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return DEFAULT_BINANCE_EXCHANGE_SCOPE_ID;
  }
  return trimmed;
}
