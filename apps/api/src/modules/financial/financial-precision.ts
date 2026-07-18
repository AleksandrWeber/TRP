import {
  assertScale,
  FinancialDecimal,
  FinancialRounding,
  type FinancialDecimalInput,
} from './financial-decimal';

export type FinancialPrecision = Readonly<{
  priceScale: number;
  quantityScale: number;
  moneyScale: number;
  feeScale: number;
  rounding: FinancialRounding;
}>;

export function createFinancialPrecision(input: FinancialPrecision): FinancialPrecision {
  assertScale(input.priceScale);
  assertScale(input.quantityScale);
  assertScale(input.moneyScale);
  assertScale(input.feeScale);
  if (!Object.values(FinancialRounding).includes(input.rounding)) {
    throw new Error('unsupported financial rounding mode');
  }
  return Object.freeze({ ...input });
}

export function roundPrice(
  value: FinancialDecimalInput,
  precision: FinancialPrecision,
): FinancialDecimal {
  return FinancialDecimal.from(value).quantize(precision.priceScale, precision.rounding);
}

export function roundQuantity(
  value: FinancialDecimalInput,
  precision: FinancialPrecision,
): FinancialDecimal {
  return FinancialDecimal.from(value).quantize(precision.quantityScale, precision.rounding);
}

export function roundMoney(
  value: FinancialDecimalInput,
  precision: FinancialPrecision,
): FinancialDecimal {
  return FinancialDecimal.from(value).quantize(precision.moneyScale, precision.rounding);
}

export function roundFee(
  value: FinancialDecimalInput,
  precision: FinancialPrecision,
): FinancialDecimal {
  return FinancialDecimal.from(value).quantize(precision.feeScale, precision.rounding);
}
