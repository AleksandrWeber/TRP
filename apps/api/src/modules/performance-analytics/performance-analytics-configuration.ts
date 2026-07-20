/**
 * Immutable performance analytics configuration for US202.
 *
 * Supplies reference prices used to compute slippage from execution fills.
 * No portfolio or persistence concerns.
 */

export type PerformanceAnalyticsConfiguration = Readonly<{
  requestedPricesByRequestId: Readonly<Record<string, number>>;
}>;

export type CreatePerformanceAnalyticsConfigurationInput = Readonly<{
  requestedPricesByRequestId?: Readonly<Record<string, number>>;
}>;

export function createPerformanceAnalyticsConfiguration(
  input: CreatePerformanceAnalyticsConfigurationInput = {},
): PerformanceAnalyticsConfiguration {
  const requestedPricesByRequestId = validateRequestedPrices(
    input.requestedPricesByRequestId ?? {},
  );

  return Object.freeze({
    requestedPricesByRequestId,
  });
}

function validateRequestedPrices(
  prices: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const normalized: Record<string, number> = {};

  for (const [requestId, price] of Object.entries(prices)) {
    const normalizedRequestId = requestId.trim();
    if (normalizedRequestId === '') {
      throw new Error('requestedPricesByRequestId keys must be non-empty request ids');
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`requested price for ${normalizedRequestId} must be a non-negative number`);
    }
    normalized[normalizedRequestId] = price;
  }

  return Object.freeze(normalized);
}
