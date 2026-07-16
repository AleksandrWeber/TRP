import type { OhlcvBar } from '../types';
import {
  SLICE_ROLES,
  type CreateSliceRefInput,
  type ResolvedSlice,
  type SliceIdentity,
  type SliceRef,
  type SliceRole,
} from './slice.types';

export function buildSliceIdentity(
  datasetId: string,
  startIndex: number,
  endIndex: number,
  role: SliceRole,
): SliceIdentity {
  return `${datasetId}:${startIndex}:${endIndex}:${role}`;
}

export function isSliceRole(value: unknown): value is SliceRole {
  return typeof value === 'string' && (SLICE_ROLES as readonly string[]).includes(value);
}

function assertRole(role: unknown): asserts role is SliceRole {
  if (!isSliceRole(role)) {
    throw new Error(`Invalid slice role: ${String(role)}`);
  }
}

function assertRange(startIndex: number, endIndex: number, datasetLength: number): void {
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) {
    throw new Error('Slice indices must be integers');
  }
  if (!Number.isInteger(datasetLength) || datasetLength < 0) {
    throw new Error('datasetLength must be a non-negative integer');
  }
  if (datasetLength === 0) {
    throw new Error('Cannot create slice on empty dataset');
  }
  if (startIndex < 0 || endIndex < 0) {
    throw new Error('Slice indices must be non-negative');
  }
  if (startIndex > endIndex) {
    throw new Error('Slice range is empty or inverted (startIndex > endIndex)');
  }
  if (endIndex >= datasetLength) {
    throw new Error(
      `Slice endIndex ${endIndex} is out of bounds for datasetLength ${datasetLength}`,
    );
  }
}

/**
 * Sole construction path for immutable SliceRef (ADR-011).
 * Validates role and inclusive range against datasetLength.
 */
export function createSliceRef(input: CreateSliceRefInput): {
  ref: SliceRef;
  sliceIdentity: SliceIdentity;
} {
  if (!input.datasetId) {
    throw new Error('datasetId is required');
  }
  assertRole(input.role);
  assertRange(input.startIndex, input.endIndex, input.datasetLength);

  const ref: SliceRef = Object.freeze({
    datasetId: input.datasetId,
    startIndex: input.startIndex,
    endIndex: input.endIndex,
    role: input.role,
  });

  return {
    ref,
    sliceIdentity: buildSliceIdentity(ref.datasetId, ref.startIndex, ref.endIndex, ref.role),
  };
}

/**
 * Resolve a slice against an already-loaded bars array.
 * No Dataset Repository / DB access (US045).
 */
export function resolveSlice(input: {
  datasetId: string;
  startIndex: number;
  endIndex: number;
  role: SliceRole;
  bars: OhlcvBar[];
}): ResolvedSlice<OhlcvBar> {
  const { ref, sliceIdentity } = createSliceRef({
    datasetId: input.datasetId,
    startIndex: input.startIndex,
    endIndex: input.endIndex,
    role: input.role,
    datasetLength: input.bars.length,
  });

  const bars = input.bars.slice(ref.startIndex, ref.endIndex + 1);

  return {
    ref,
    sliceIdentity,
    bars,
  };
}
