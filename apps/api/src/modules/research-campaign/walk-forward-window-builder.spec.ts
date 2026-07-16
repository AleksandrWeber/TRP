import { describe, expect, it } from 'vitest';
import { buildWalkForwardWindows } from './walk-forward-window-builder';

describe('buildWalkForwardWindows', () => {
  it('builds rolling windows for a normal dataset', () => {
    expect(buildWalkForwardWindows(100, 40, 20)).toEqual([
      { trainStart: 0, trainEnd: 39, testStart: 40, testEnd: 59 },
      { trainStart: 20, trainEnd: 59, testStart: 60, testEnd: 79 },
      { trainStart: 40, trainEnd: 79, testStart: 80, testEnd: 99 },
    ]);
  });

  it('includes the last window when the dataset is an exact fit', () => {
    expect(buildWalkForwardWindows(60, 40, 20)).toEqual([
      { trainStart: 0, trainEnd: 39, testStart: 40, testEnd: 59 },
    ]);
  });

  it('returns a single window when only one fits', () => {
    expect(buildWalkForwardWindows(40, 30, 10)).toEqual([
      { trainStart: 0, trainEnd: 29, testStart: 30, testEnd: 39 },
    ]);
  });

  it('returns an empty array when the dataset is too small', () => {
    expect(buildWalkForwardWindows(50, 40, 20)).toEqual([]);
    expect(buildWalkForwardWindows(59, 40, 20)).toEqual([]);
    expect(buildWalkForwardWindows(0, 40, 20)).toEqual([]);
  });

  it('rejects invalid stepSize', () => {
    expect(() => buildWalkForwardWindows(100, 40, 0)).toThrow('stepSize must be a positive number');
    expect(() => buildWalkForwardWindows(100, 40, -5)).toThrow(
      'stepSize must be a positive number',
    );
  });

  it('rejects invalid windowSize', () => {
    expect(() => buildWalkForwardWindows(100, 0, 20)).toThrow(
      'windowSize must be a positive number',
    );
    expect(() => buildWalkForwardWindows(100, -10, 20)).toThrow(
      'windowSize must be a positive number',
    );
  });
});
