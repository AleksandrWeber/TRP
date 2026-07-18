import Decimal from 'decimal.js';

const CANONICAL_DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

const DomainDecimal = Decimal.clone({
  precision: 80,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -100,
  toExpPos: 100,
});

export enum FinancialRounding {
  DOWN = 'down',
  HALF_UP = 'half_up',
  HALF_EVEN = 'half_even',
}

export type FinancialDecimalInput = string | bigint | FinancialDecimal;

/**
 * Immutable decimal-safe financial value (US153 / ADR-015).
 * Number input and conversion are intentionally absent so canonical financial
 * calculations cannot silently cross a binary floating-point boundary.
 */
export class FinancialDecimal {
  private constructor(private readonly value: Decimal) {}

  static from(input: FinancialDecimalInput): FinancialDecimal {
    if (input instanceof FinancialDecimal) return input;
    const text = typeof input === 'bigint' ? input.toString() : input;
    assertCanonicalDecimal(text);
    return new FinancialDecimal(new DomainDecimal(text));
  }

  static zero(): FinancialDecimal {
    return FinancialDecimal.from('0');
  }

  plus(other: FinancialDecimalInput): FinancialDecimal {
    return new FinancialDecimal(this.value.plus(FinancialDecimal.from(other).value));
  }

  minus(other: FinancialDecimalInput): FinancialDecimal {
    return new FinancialDecimal(this.value.minus(FinancialDecimal.from(other).value));
  }

  times(other: FinancialDecimalInput): FinancialDecimal {
    return new FinancialDecimal(this.value.times(FinancialDecimal.from(other).value));
  }

  dividedBy(other: FinancialDecimalInput): FinancialDecimal {
    const divisor = FinancialDecimal.from(other);
    if (divisor.isZero()) throw new Error('financial decimal division by zero');
    return new FinancialDecimal(this.value.dividedBy(divisor.value));
  }

  abs(): FinancialDecimal {
    return new FinancialDecimal(this.value.abs());
  }

  negate(): FinancialDecimal {
    return new FinancialDecimal(this.value.negated());
  }

  quantize(scale: number, rounding: FinancialRounding): FinancialDecimal {
    assertScale(scale);
    return new FinancialDecimal(this.value.toDecimalPlaces(scale, toDecimalRounding(rounding)));
  }

  compare(other: FinancialDecimalInput): number {
    return this.value.comparedTo(FinancialDecimal.from(other).value);
  }

  equals(other: FinancialDecimalInput): boolean {
    return this.compare(other) === 0;
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isPositive(): boolean {
    return this.value.isPositive() && !this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  assertNonNegative(label = 'financial value'): FinancialDecimal {
    if (this.isNegative()) throw new Error(`${label} must be non-negative`);
    return this;
  }

  assertPositive(label = 'financial value'): FinancialDecimal {
    if (!this.isPositive()) throw new Error(`${label} must be greater than zero`);
    return this;
  }

  /**
   * Canonical non-exponential decimal string for persistence/events/APIs.
   */
  toString(): string {
    return this.value.toFixed();
  }

  toJSON(): string {
    return this.toString();
  }
}

export function assertScale(scale: number): void {
  if (!Number.isInteger(scale) || scale < 0 || scale > 36) {
    throw new Error('financial scale must be an integer between 0 and 36');
  }
}

function assertCanonicalDecimal(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !CANONICAL_DECIMAL.test(value)) {
    throw new Error(
      'financial value must be a canonical decimal string (no number, exponent, sign prefix, or whitespace)',
    );
  }
  const parsed = new DomainDecimal(value);
  if (!parsed.isFinite()) throw new Error('financial value must be finite');
}

function toDecimalRounding(rounding: FinancialRounding): Decimal.Rounding {
  switch (rounding) {
    case FinancialRounding.DOWN:
      return Decimal.ROUND_DOWN;
    case FinancialRounding.HALF_UP:
      return Decimal.ROUND_HALF_UP;
    case FinancialRounding.HALF_EVEN:
      return Decimal.ROUND_HALF_EVEN;
  }
}
