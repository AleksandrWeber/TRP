import { describe, expect, it } from 'vitest';
import { createSliceRef, runExperiment } from './index';
import type { OhlcvBar } from './types';

function makeBars(count: number): OhlcvBar[] {
  return Array.from({ length: count }, (_, i) => {
    const close = 100 + i * 0.5;
    return {
      timestamp: 1_700_000_000_000 + i * 3_600_000,
      open: close - 0.2,
      high: close + 0.5,
      low: close - 0.5,
      close,
      volume: 1000,
    };
  });
}

describe('runExperiment slice support', () => {
  it('runs on a full dataset without sliceIdentity', () => {
    const bars = makeBars(120);
    const report = runExperiment(bars);

    expect(report.datasetBarCount).toBe(120);
    expect(report).not.toHaveProperty('sliceIdentity');
    expect(report.validation.verdict).toBeDefined();
    expect(report.metrics).toBeDefined();
  });

  it('runs on a TRAIN slice and records sliceIdentity', () => {
    const bars = makeBars(200);
    const { ref, sliceIdentity } = createSliceRef({
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 119,
      role: 'TRAIN',
      datasetLength: bars.length,
    });

    const report = runExperiment(bars, undefined, ref);

    expect(report.datasetBarCount).toBe(120);
    expect(report.sliceIdentity).toBe(sliceIdentity);
    expect(report.sliceIdentity).toBe('ds-1:0:119:TRAIN');
  });

  it('runs on a TEST slice and records sliceIdentity', () => {
    const bars = makeBars(200);
    const { ref, sliceIdentity } = createSliceRef({
      datasetId: 'ds-1',
      startIndex: 80,
      endIndex: 199,
      role: 'TEST',
      datasetLength: bars.length,
    });

    const report = runExperiment(bars, undefined, ref);

    expect(report.datasetBarCount).toBe(120);
    expect(report.sliceIdentity).toBe(sliceIdentity);
    expect(report.sliceIdentity).toBe('ds-1:80:199:TEST');
  });

  it('rejects an invalid slice', () => {
    const bars = makeBars(50);

    expect(() =>
      runExperiment(bars, undefined, {
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 99,
        role: 'TRAIN',
      }),
    ).toThrow('out of bounds');
  });

  it('does not add sliceIdentity for full-dataset runs', () => {
    const report = runExperiment(makeBars(80));
    expect('sliceIdentity' in report).toBe(false);
  });
});
