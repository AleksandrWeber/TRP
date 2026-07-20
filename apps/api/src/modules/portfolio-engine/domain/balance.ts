import { FinancialDecimal } from '../../financial';

/**
 * Cash available in the trading account (US204).
 * Balance = Cash.
 */
export type Balance = Readonly<{
  cash: string;
}>;

export function createBalance(cash: string): Balance {
  const value = FinancialDecimal.from(cash).assertNonNegative('cash').toString();
  return Object.freeze({ cash: value });
}
