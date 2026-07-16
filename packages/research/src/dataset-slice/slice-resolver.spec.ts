import { describe, expect, it } from 'vitest';
import type { OhlcvBar } from '../types';
import { buildSliceIdentity, createSliceRef, resolveSlice } from './slice-resolver';

function bars(count: number): OhlcvBar[] {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: index * 60_000,
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
  }));
}

describe('createSliceRef', () => {
  it('creates an immutable SliceRef', () => {
    const { ref, sliceIdentity } = createSliceRef({
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 9,
      role: 'TRAIN',
      datasetLength: 100,
    });

    expect(ref).toEqual({
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 9,
      role: 'TRAIN',
    });
    expect(Object.isFrozen(ref)).toBe(true);
    expect(() => {
      (ref as { startIndex: number }).startIndex = 1;
    }).toThrow();
    expect(sliceIdentity).toBe(buildSliceIdentity('ds-1', 0, 9, 'TRAIN'));
  });

  it('accepts valid inclusive ranges', () => {
    expect(
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 0,
        role: 'FULL',
        datasetLength: 1,
      }).ref,
    ).toMatchObject({ startIndex: 0, endIndex: 0 });

    expect(
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 10,
        endIndex: 19,
        role: 'TEST',
        datasetLength: 20,
      }).ref.endIndex,
    ).toBe(19);
  });

  it('rejects invalid ranges', () => {
    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: -1,
        endIndex: 5,
        role: 'TRAIN',
        datasetLength: 10,
      }),
    ).toThrow('non-negative');

    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 10,
        role: 'TRAIN',
        datasetLength: 10,
      }),
    ).toThrow('out of bounds');

    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 1.5,
        endIndex: 2,
        role: 'TRAIN',
        datasetLength: 10,
      }),
    ).toThrow('integers');
  });

  it('rejects empty or inverted slices', () => {
    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 5,
        endIndex: 4,
        role: 'TEST',
        datasetLength: 10,
      }),
    ).toThrow('empty or inverted');

    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 0,
        role: 'TRAIN',
        datasetLength: 0,
      }),
    ).toThrow('empty dataset');
  });

  it('generates identity from datasetId + range + role', () => {
    const a = createSliceRef({
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 9,
      role: 'TRAIN',
      datasetLength: 100,
    });
    const b = createSliceRef({
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 9,
      role: 'TEST',
      datasetLength: 100,
    });
    const c = createSliceRef({
      datasetId: 'ds-2',
      startIndex: 0,
      endIndex: 9,
      role: 'TRAIN',
      datasetLength: 100,
    });

    expect(a.sliceIdentity).toBe('ds-1:0:9:TRAIN');
    expect(a.sliceIdentity).not.toBe(b.sliceIdentity);
    expect(a.sliceIdentity).not.toBe(c.sliceIdentity);
  });

  it('validates role', () => {
    expect(() =>
      createSliceRef({
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 1,
        role: 'INVALID' as never,
        datasetLength: 10,
      }),
    ).toThrow('Invalid slice role');

    for (const role of ['FULL', 'TRAIN', 'TEST', 'HOLD_OUT', 'VALIDATION'] as const) {
      expect(
        createSliceRef({
          datasetId: 'ds-1',
          startIndex: 0,
          endIndex: 1,
          role,
          datasetLength: 10,
        }).ref.role,
      ).toBe(role);
    }
  });
});

describe('resolveSlice', () => {
  it('returns sliced bars for a valid range without repository access', () => {
    const source = bars(10);
    const resolved = resolveSlice({
      datasetId: 'ds-1',
      startIndex: 2,
      endIndex: 4,
      role: 'VALIDATION',
      bars: source,
    });

    expect(resolved.ref).toEqual({
      datasetId: 'ds-1',
      startIndex: 2,
      endIndex: 4,
      role: 'VALIDATION',
    });
    expect(Object.isFrozen(resolved.ref)).toBe(true);
    expect(resolved.sliceIdentity).toBe('ds-1:2:4:VALIDATION');
    expect(resolved.bars).toHaveLength(3);
    expect(resolved.bars[0].timestamp).toBe(source[2].timestamp);
    expect(resolved.bars[2].timestamp).toBe(source[4].timestamp);
  });

  it('rejects out-of-bounds ranges against bars.length', () => {
    expect(() =>
      resolveSlice({
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 10,
        role: 'FULL',
        bars: bars(10),
      }),
    ).toThrow('out of bounds');
  });
});
