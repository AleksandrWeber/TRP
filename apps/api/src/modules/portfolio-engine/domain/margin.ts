import { FinancialDecimal } from '../../financial';

/**
 * Margin state for a trading account (US204).
 * No risk engine — used/available margin are financial facts only.
 */
export type Margin = Readonly<{
  usedMargin: string;
  availableMargin: string;
}>;

export function createMargin(input: { usedMargin: string; availableMargin: string }): Margin {
  const usedMargin = FinancialDecimal.from(input.usedMargin)
    .assertNonNegative('usedMargin')
    .toString();
  const availableMargin = FinancialDecimal.from(input.availableMargin)
    .assertNonNegative('availableMargin')
    .toString();
  return Object.freeze({ usedMargin, availableMargin });
}
