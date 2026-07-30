import {
  deterministicCheckpointId,
  STRATEGY_CHECKPOINT_SCHEMA_VERSION,
  STRATEGY_RUNTIME_VERSION,
  type StrategyCheckpoint,
} from '../../strategy-runtime/domain/strategy-checkpoint';
import { isStrategyTimeframe } from '../../strategies/strategy';
import type { RecoveryLeaseAcquisitionResult } from './recovery-lease-acquisition';
import type { RecoveryCandidate } from './startup-recovery-discovery';

/**
 * Leased recovery Session identity for US242 checkpoint validation.
 * Built only from a successful US241 lease + US240 candidate.
 */
export type LeasedRecoverySession = Readonly<{
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  ownerId: string;
  fencingToken: number;
}>;

export type RecoveryCheckpointValidationOutcome =
  'VALID_CHECKPOINT' | 'NO_CHECKPOINT' | 'INVALID_CHECKPOINT';

export type InvalidCheckpointReason =
  | 'lease_required'
  | 'session_mismatch'
  | 'workspace_mismatch'
  | 'deployment_mismatch'
  | 'unsupported_runtime_version'
  | 'unsupported_schema_version'
  | 'corrupted_checkpoint'
  | 'illegal_checkpoint_identity'
  | 'illegal_runtime_state'
  | 'load_failed';

export type ValidatedRecoveryCheckpoint = Readonly<{
  checkpointId: string;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  lastProcessedEventId: string;
  runtimeVersion: string;
  version: number;
  updatedAt: string;
  streamId: string;
  sequence: number;
}>;

export type RecoveryCheckpointValidationResult = Readonly<{
  outcome: RecoveryCheckpointValidationOutcome;
  reason: InvalidCheckpointReason | 'valid' | 'absent';
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  fencingToken: number | null;
  checkpoint: ValidatedRecoveryCheckpoint | null;
}>;

/** Supported Runtime versions for recovery validation (US242). */
export const SUPPORTED_RECOVERY_RUNTIME_VERSIONS: ReadonlySet<string> = new Set([
  STRATEGY_RUNTIME_VERSION,
]);

/** Supported checkpoint schema versions (code constant; not a DB column yet). */
export const SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS: ReadonlySet<number> = new Set([
  STRATEGY_CHECKPOINT_SCHEMA_VERSION,
]);

export function toLeasedRecoverySession(
  lease: RecoveryLeaseAcquisitionResult,
  candidate: RecoveryCandidate,
): LeasedRecoverySession | null {
  if (lease.outcome !== 'LEASE_ACQUIRED' || lease.fencingToken === null) {
    return null;
  }
  if (lease.sessionId !== candidate.sessionId || lease.workspaceId !== candidate.workspaceId) {
    return null;
  }
  return Object.freeze({
    sessionId: lease.sessionId,
    workspaceId: lease.workspaceId,
    deploymentId: candidate.deploymentId,
    ownerId: lease.ownerId,
    fencingToken: lease.fencingToken,
  });
}

/**
 * Pure checkpoint discovery/validation for recovery (US242).
 *
 * Does not mutate checkpoints, Session status, or Runtime lifecycle.
 * `checkpoint === null` → NO_CHECKPOINT. Integrity failures → INVALID_CHECKPOINT.
 */
export function validateRecoveryCheckpoint(
  leased: LeasedRecoverySession | null,
  checkpoint: StrategyCheckpoint | null,
  options: { schemaVersion?: number } = {},
): RecoveryCheckpointValidationResult {
  if (leased === null) {
    return result('INVALID_CHECKPOINT', 'lease_required', {
      sessionId: '',
      workspaceId: '',
      deploymentId: '',
      fencingToken: null,
      checkpoint: null,
    });
  }

  const base = {
    sessionId: leased.sessionId,
    workspaceId: leased.workspaceId,
    deploymentId: leased.deploymentId,
    fencingToken: leased.fencingToken,
  };

  if (checkpoint === null) {
    return result('NO_CHECKPOINT', 'absent', { ...base, checkpoint: null });
  }

  const schemaVersion = options.schemaVersion ?? STRATEGY_CHECKPOINT_SCHEMA_VERSION;
  if (!SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS.has(schemaVersion)) {
    return result('INVALID_CHECKPOINT', 'unsupported_schema_version', {
      ...base,
      checkpoint: null,
    });
  }

  const integrity = inspectCheckpointIntegrity(checkpoint);
  if (integrity !== null) {
    return result('INVALID_CHECKPOINT', integrity, { ...base, checkpoint: null });
  }

  if (checkpoint.workspaceId !== leased.workspaceId) {
    return result('INVALID_CHECKPOINT', 'workspace_mismatch', { ...base, checkpoint: null });
  }
  if (checkpoint.sessionId !== leased.sessionId) {
    return result('INVALID_CHECKPOINT', 'session_mismatch', { ...base, checkpoint: null });
  }
  if (checkpoint.deploymentId !== leased.deploymentId) {
    return result('INVALID_CHECKPOINT', 'deployment_mismatch', { ...base, checkpoint: null });
  }

  if (!SUPPORTED_RECOVERY_RUNTIME_VERSIONS.has(checkpoint.runtimeVersion)) {
    return result('INVALID_CHECKPOINT', 'unsupported_runtime_version', {
      ...base,
      checkpoint: null,
    });
  }

  const expectedId = deterministicCheckpointId(leased.workspaceId, leased.sessionId);
  if (checkpoint.id !== expectedId) {
    return result('INVALID_CHECKPOINT', 'illegal_checkpoint_identity', {
      ...base,
      checkpoint: null,
    });
  }

  // Recovery invariant: strategy checkpoint must not carry Session lease authority.
  if (Object.prototype.hasOwnProperty.call(checkpoint, 'fencingToken')) {
    return result('INVALID_CHECKPOINT', 'illegal_runtime_state', { ...base, checkpoint: null });
  }

  return result('VALID_CHECKPOINT', 'valid', {
    ...base,
    checkpoint: Object.freeze({
      checkpointId: checkpoint.id,
      sessionId: checkpoint.sessionId,
      workspaceId: checkpoint.workspaceId,
      deploymentId: checkpoint.deploymentId,
      lastProcessedEventId: checkpoint.lastProcessedEventId,
      runtimeVersion: checkpoint.runtimeVersion,
      version: checkpoint.version,
      updatedAt: checkpoint.updatedAt,
      streamId: checkpoint.lastProcessedCandle.streamId,
      sequence: checkpoint.lastProcessedCandle.sequence,
    }),
  });
}

function result(
  outcome: RecoveryCheckpointValidationOutcome,
  reason: RecoveryCheckpointValidationResult['reason'],
  fields: Omit<RecoveryCheckpointValidationResult, 'outcome' | 'reason'>,
): RecoveryCheckpointValidationResult {
  return Object.freeze({
    outcome,
    reason,
    ...fields,
  });
}

/**
 * Structural integrity of a loaded checkpoint.
 * Returns an invalid reason, or null when structurally sound.
 */
function inspectCheckpointIntegrity(
  checkpoint: StrategyCheckpoint,
): InvalidCheckpointReason | null {
  try {
    if (!checkpoint || typeof checkpoint !== 'object') {
      return 'corrupted_checkpoint';
    }
    if (!isNonEmptyString(checkpoint.id)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(checkpoint.workspaceId)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(checkpoint.sessionId)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(checkpoint.deploymentId)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(checkpoint.lastProcessedEventId)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(checkpoint.runtimeVersion)) return 'corrupted_checkpoint';
    if (!Number.isInteger(checkpoint.version) || checkpoint.version < 1) {
      return 'illegal_runtime_state';
    }
    if (!isIsoUtc(checkpoint.updatedAt)) return 'corrupted_checkpoint';

    const candle = checkpoint.lastProcessedCandle;
    if (!candle || typeof candle !== 'object') return 'corrupted_checkpoint';
    if (!isNonEmptyString(candle.streamId)) return 'corrupted_checkpoint';
    if (!Number.isInteger(candle.sequence) || candle.sequence < 0) {
      return 'illegal_runtime_state';
    }
    if (!isIsoUtc(candle.openTime)) return 'corrupted_checkpoint';
    if (!isNonEmptyString(candle.instrument)) return 'corrupted_checkpoint';
    if (!isStrategyTimeframe(candle.timeframe)) return 'corrupted_checkpoint';

    return null;
  } catch {
    return 'corrupted_checkpoint';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isIsoUtc(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
