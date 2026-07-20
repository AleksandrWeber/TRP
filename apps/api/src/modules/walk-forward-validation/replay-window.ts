/**
 * Immutable replay window for US194 Walk Forward Validation.
 *
 * Indices are inclusive. Windows never overlap unless configuration.overlap > 0.
 */

export type ReplayWindow = Readonly<{
  windowId: string;
  startIndex: number;
  endIndex: number;
  datasetId: string;
}>;

export type CreateReplayWindowInput = Readonly<{
  windowId: string;
  startIndex: number;
  endIndex: number;
  datasetId: string;
}>;

export function createReplayWindow(input: CreateReplayWindowInput): ReplayWindow {
  const windowId = required(input.windowId, 'windowId');
  const datasetId = required(input.datasetId, 'datasetId');
  const startIndex = nonNegativeInteger(input.startIndex, 'startIndex');
  const endIndex = nonNegativeInteger(input.endIndex, 'endIndex');

  if (startIndex > endIndex) {
    throw new Error('startIndex must be less than or equal to endIndex');
  }

  return Object.freeze({
    windowId,
    startIndex,
    endIndex,
    datasetId,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
