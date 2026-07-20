import { MOCK_MARKET_DATA_PROVIDER_ID } from './providers/mock-market-data-provider';

/** Environment variable selecting the active live market data provider (US007). */
export const MARKET_DATA_PROVIDER_ENV_VAR = 'MARKET_DATA_PROVIDER';
export const DEFAULT_MARKET_DATA_PROVIDER_ID = MOCK_MARKET_DATA_PROVIDER_ID;

/**
 * Resolves the configured provider id: unset/blank falls back to the mock
 * default; an id that is not registered fails fast at bootstrap so a typo
 * (e.g. MARKET_DATA_PROVIDER=binanse) can never silently serve mock data.
 */
export function resolveMarketDataProviderId(
  raw: string | undefined,
  registeredIds: ReadonlyArray<string>,
): string {
  const id = (raw ?? '').trim().toLowerCase();
  if (id === '') {
    return DEFAULT_MARKET_DATA_PROVIDER_ID;
  }
  if (!registeredIds.includes(id)) {
    throw new Error(
      `Unknown ${MARKET_DATA_PROVIDER_ENV_VAR} '${raw}' — expected one of: ${registeredIds.join(', ')}`,
    );
  }
  return id;
}
