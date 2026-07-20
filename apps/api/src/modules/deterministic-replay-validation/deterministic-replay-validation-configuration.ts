import {
  createReplayConfiguration,
  type CreateReplayConfigurationInput,
  type ReplayConfiguration,
} from '../historical-replay';

/**
 * Immutable configuration for US197 Deterministic Replay Validation.
 */

export type DeterministicReplayConfiguration = Readonly<{
  validationId: string;
  replayConfiguration: ReplayConfiguration;
  iterations: number;
  rejectOnMismatch: boolean;
}>;

export type CreateDeterministicReplayConfigurationInput = Readonly<{
  validationId: string;
  replayConfiguration: CreateReplayConfigurationInput;
  iterations: number;
  rejectOnMismatch?: boolean;
}>;

export function createDeterministicReplayConfiguration(
  input: CreateDeterministicReplayConfigurationInput,
): DeterministicReplayConfiguration {
  const validationId = required(input.validationId, 'validationId');
  const iterations = input.iterations;
  const rejectOnMismatch = input.rejectOnMismatch === true;

  if (!Number.isInteger(iterations) || iterations < 2) {
    throw new Error('iterations must be an integer greater than or equal to 2');
  }

  let replayConfiguration: ReplayConfiguration;
  try {
    replayConfiguration = createReplayConfiguration(input.replayConfiguration);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  return Object.freeze({
    validationId,
    replayConfiguration,
    iterations,
    rejectOnMismatch,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
