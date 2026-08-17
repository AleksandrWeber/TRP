/**
 * Operator-visible capability projection (W2-S02-d).
 *
 * Verified capabilities describe observed session permissions only.
 * They do not mean trading, balances, orders, market data, or execution.
 */

import type { ExchangeVerifiedCapability } from './exchange-capability.mapping';

export type ExchangeCapabilityView = Readonly<{
  capabilities: readonly ExchangeVerifiedCapability[];
  verifiedAt: string | null;
  verificationFailed: boolean;
}>;

export function projectExchangeCapabilities(
  connectionType: string,
  status: string,
  cached: ExchangeCapabilityView | null,
): ExchangeCapabilityView | null {
  if (connectionType !== 'EXCHANGE' || status !== 'CONNECTED') {
    return null;
  }
  return cached;
}
