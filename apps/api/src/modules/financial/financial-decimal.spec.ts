import { describe, expect, it } from 'vitest';
import {
  createFinancialPrecision,
  FinancialDecimal,
  FinancialRounding,
  roundFee,
  roundMoney,
  roundPrice,
  roundQuantity,
} from '.';

describe('US153 — decimal financial value contracts', () => {
  it('performs exact decimal arithmetic without binary floating-point drift', () => {
    expect(FinancialDecimal.from('0.1').plus('0.2').toString()).toBe('0.3');
    expect(FinancialDecimal.from('1000000000000000000.01').plus('0.09').toString()).toBe(
      '1000000000000000000.1',
    );
    expect(FinancialDecimal.from('10').times('0.025').toString()).toBe('0.25');
    expect(FinancialDecimal.from('1').dividedBy('8').toString()).toBe('0.125');
  });

  it('rejects number, exponent, whitespace, and non-finite inputs', () => {
    expect(() => FinancialDecimal.from(0.1 as never)).toThrow(/canonical decimal string/);
    expect(() => FinancialDecimal.from('1e-8')).toThrow(/canonical decimal string/);
    expect(() => FinancialDecimal.from(' 1.00')).toThrow(/canonical decimal string/);
    expect(() => FinancialDecimal.from('+1')).toThrow(/canonical decimal string/);
    expect(() => FinancialDecimal.from('Infinity')).toThrow(/canonical decimal string/);
  });

  it('applies explicit instrument scales and rounding modes', () => {
    const precision = createFinancialPrecision({
      priceScale: 2,
      quantityScale: 6,
      moneyScale: 2,
      feeScale: 4,
      rounding: FinancialRounding.HALF_EVEN,
    });

    expect(roundPrice('100.125', precision).toString()).toBe('100.12');
    expect(roundQuantity('0.1234567', precision).toString()).toBe('0.123457');
    expect(roundMoney('12.345', precision).toString()).toBe('12.34');
    expect(roundFee('0.12345', precision).toString()).toBe('0.1234');
  });

  it('supports explicit alternative rounding and sign guards', () => {
    const down = createFinancialPrecision({
      priceScale: 2,
      quantityScale: 2,
      moneyScale: 2,
      feeScale: 2,
      rounding: FinancialRounding.DOWN,
    });
    expect(roundMoney('9.999', down).toString()).toBe('9.99');
    expect(() => FinancialDecimal.from('-0.01').assertNonNegative('cash')).toThrow(
      /cash must be non-negative/,
    );
    expect(() => FinancialDecimal.zero().assertPositive('quantity')).toThrow(
      /quantity must be greater than zero/,
    );
  });

  it('serializes financial values as canonical decimal strings', () => {
    const value = FinancialDecimal.from('100.5000');
    expect(value.toString()).toBe('100.5');
    expect(JSON.stringify({ value })).toBe('{"value":"100.5"}');
    expect(() => FinancialDecimal.from('001')).toThrow(/canonical decimal string/);
  });
});
