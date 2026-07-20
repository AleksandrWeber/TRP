/**
 * Replay window and informational speed for US193 Historical Replay.
 *
 * replaySpeed is informational only. Replay remains synchronous with no timers.
 */

export type ReplayConfiguration = Readonly<{
  datasetId: string;
  replaySpeed: number;
  startIndex: number;
  endIndex: number;
}>;

export type CreateReplayConfigurationInput = Readonly<{
  datasetId: string;
  replaySpeed?: number;
  startIndex?: number;
  endIndex: number;
}>;

export function createReplayConfiguration(
  input: CreateReplayConfigurationInput,
): ReplayConfiguration {
  const datasetId = required(input.datasetId, 'datasetId');
  const startIndex = input.startIndex ?? 0;
  const endIndex = input.endIndex;
  const replaySpeed = input.replaySpeed ?? 1;

  if (!Number.isInteger(startIndex) || startIndex < 0) {
    throw new Error('startIndex must be a non-negative integer');
  }
  if (!Number.isInteger(endIndex) || endIndex < 0) {
    throw new Error('endIndex must be a non-negative integer');
  }
  if (startIndex > endIndex) {
    throw new Error('startIndex must be less than or equal to endIndex');
  }
  if (typeof replaySpeed !== 'number' || !Number.isFinite(replaySpeed) || replaySpeed <= 0) {
    throw new Error('replaySpeed must be a positive finite number');
  }

  return Object.freeze({
    datasetId,
    replaySpeed,
    startIndex,
    endIndex,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
