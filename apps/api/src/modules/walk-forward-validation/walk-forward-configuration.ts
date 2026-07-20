/**
 * Immutable Walk Forward Validation configuration (US194).
 *
 * Window length = trainingWindow + validationWindow.
 * Consecutive windows advance by stepSize.
 * overlap must equal max(0, windowLength - stepSize).
 */

export type WalkForwardConfiguration = Readonly<{
  datasetId: string;
  trainingWindow: number;
  validationWindow: number;
  stepSize: number;
  overlap: number;
  maximumWindows: number;
}>;

export type CreateWalkForwardConfigurationInput = Readonly<{
  datasetId: string;
  trainingWindow: number;
  validationWindow: number;
  stepSize: number;
  overlap: number;
  maximumWindows: number;
}>;

export function createWalkForwardConfiguration(
  input: CreateWalkForwardConfigurationInput,
): WalkForwardConfiguration {
  const datasetId = required(input.datasetId, 'datasetId');
  const trainingWindow = positiveInteger(input.trainingWindow, 'trainingWindow');
  const validationWindow = positiveInteger(input.validationWindow, 'validationWindow');
  const stepSize = positiveInteger(input.stepSize, 'stepSize');
  const overlap = nonNegativeInteger(input.overlap, 'overlap');
  const maximumWindows = positiveInteger(input.maximumWindows, 'maximumWindows');

  const windowLength = trainingWindow + validationWindow;
  const expectedOverlap = Math.max(0, windowLength - stepSize);
  if (overlap !== expectedOverlap) {
    throw new Error(
      `invalid overlap: expected ${expectedOverlap} for windowLength=${windowLength} stepSize=${stepSize}, got ${overlap}`,
    );
  }

  return Object.freeze({
    datasetId,
    trainingWindow,
    validationWindow,
    stepSize,
    overlap,
    maximumWindows,
  });
}

export function walkForwardWindowLength(configuration: WalkForwardConfiguration): number {
  return configuration.trainingWindow + configuration.validationWindow;
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
