import { FinancialDecimal } from '../../financial';

/**
 * Total account value (US204).
 * Equity = Balance + RealizedPnL + UnrealizedPnL.
 */
export type Equity = Readonly<{
  equity: string;
  realizedPnL: string;
  unrealizedPnL: string;
}>;

export function createEquity(input: {
  equity: string;
  realizedPnL: string;
  unrealizedPnL: string;
}): Equity {
  const equity = FinancialDecimal.from(input.equity).assertNonNegative('equity').toString();
  const realizedPnL = FinancialDecimal.from(input.realizedPnL).toString();
  const unrealizedPnL = FinancialDecimal.from(input.unrealizedPnL).toString();
  return Object.freeze({ equity, realizedPnL, unrealizedPnL });
}
