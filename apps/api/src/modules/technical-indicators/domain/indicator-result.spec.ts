import { describe, expect, it } from 'vitest';
import { createIndicatorResult, type IndicatorResult } from './indicator-result';
import { InvalidIndicatorInputError } from './technical-indicators.error';

function validResult(): IndicatorResult {
  return {
    indicatorId: 'sma',
    values: [1, 2, 3],
    metadata: { period: 2, inputLength: 4, calculatedLength: 3 },
  };
}

describe('createIndicatorResult (US011)', () => {
  it('returns a deeply frozen result', () => {
    const result = createIndicatorResult(validResult());
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.values)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
  });

  it('copies values instead of aliasing the input array', () => {
    const input = validResult();
    const result = createIndicatorResult(input);
    expect(result.values).not.toBe(input.values);
    expect(result.values).toEqual([1, 2, 3]);
  });

  it('rejects an empty indicatorId', () => {
    expect(() => createIndicatorResult({ ...validResult(), indicatorId: '  ' })).toThrow(
      InvalidIndicatorInputError,
    );
  });

  it('rejects non-finite values', () => {
    expect(() => createIndicatorResult({ ...validResult(), values: [1, NaN, 3] })).toThrow(
      /index 1/,
    );
    expect(() => createIndicatorResult({ ...validResult(), values: [Infinity, 2, 3] })).toThrow(
      InvalidIndicatorInputError,
    );
  });

  it('rejects an invalid period in metadata', () => {
    expect(() =>
      createIndicatorResult({
        ...validResult(),
        metadata: { period: 0, inputLength: 4, calculatedLength: 3 },
      }),
    ).toThrow(/period/);
  });

  it('rejects an invalid inputLength in metadata', () => {
    expect(() =>
      createIndicatorResult({
        ...validResult(),
        metadata: { period: 2, inputLength: 0, calculatedLength: 3 },
      }),
    ).toThrow(/inputLength/);
  });

  it('rejects a calculatedLength that disagrees with values.length', () => {
    expect(() =>
      createIndicatorResult({
        ...validResult(),
        metadata: { period: 2, inputLength: 4, calculatedLength: 2 },
      }),
    ).toThrow(/calculatedLength/);
  });
});
