import { describe, expect, it } from 'vitest';
import {
  createStrategyCheckpoint,
  deterministicCheckpointId,
  STRATEGY_RUNTIME_VERSION,
  type StrategyCheckpoint,
} from '../../strategy-runtime/domain/strategy-checkpoint';
import {
  toLeasedRecoverySession,
  validateRecoveryCheckpoint,
  type LeasedRecoverySession,
} from './recovery-checkpoint-validation';
import type { RecoveryLeaseAcquisitionResult } from './recovery-lease-acquisition';
import type { RecoveryCandidate } from './startup-recovery-discovery';
import { TradingSessionStatus } from './trading-session-status';

const at = '2026-07-30T14:00:00.000Z';

function leased(): LeasedRecoverySession {
  return Object.freeze({
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    ownerId: 'runtime-a',
    fencingToken: 2,
  });
}

function validCheckpoint(overrides: Partial<StrategyCheckpoint> = {}): StrategyCheckpoint {
  const base = createStrategyCheckpoint({
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    lastProcessedCandle: {
      streamId: 'stream-1',
      sequence: 10,
      openTime: at,
      instrument: 'BTCUSDT',
      timeframe: '1m',
    },
    lastProcessedEventId: 'evt-10',
    updatedAt: at,
  });
  return Object.freeze({ ...base, ...overrides }) as StrategyCheckpoint;
}

describe('US242 — recovery checkpoint validation (pure)', () => {
  it('returns VALID_CHECKPOINT for a consistent checkpoint', () => {
    const result = validateRecoveryCheckpoint(leased(), validCheckpoint());
    expect(result.outcome).toBe('VALID_CHECKPOINT');
    expect(result.reason).toBe('valid');
    expect(result.checkpoint?.lastProcessedEventId).toBe('evt-10');
    expect(result.checkpoint?.checkpointId).toBe(deterministicCheckpointId('ws-1', 'session-1'));
  });

  it('returns NO_CHECKPOINT when no durable checkpoint exists', () => {
    const result = validateRecoveryCheckpoint(leased(), null);
    expect(result).toEqual(
      expect.objectContaining({
        outcome: 'NO_CHECKPOINT',
        reason: 'absent',
        checkpoint: null,
        fencingToken: 2,
      }),
    );
  });

  it('rejects corrupted checkpoints', () => {
    const corrupted = validCheckpoint({
      lastProcessedEventId: '   ',
    });
    expect(validateRecoveryCheckpoint(leased(), corrupted).outcome).toBe('INVALID_CHECKPOINT');
    expect(validateRecoveryCheckpoint(leased(), corrupted).reason).toBe('corrupted_checkpoint');
  });

  it('rejects Session / checkpoint mismatches', () => {
    expect(
      validateRecoveryCheckpoint(leased(), validCheckpoint({ sessionId: 'other' })).reason,
    ).toBe('session_mismatch');
    expect(
      validateRecoveryCheckpoint(leased(), validCheckpoint({ workspaceId: 'other-ws' })).reason,
    ).toBe('workspace_mismatch');
    expect(
      validateRecoveryCheckpoint(leased(), validCheckpoint({ deploymentId: 'other-dep' })).reason,
    ).toBe('deployment_mismatch');
  });

  it('rejects unsupported runtime version', () => {
    const result = validateRecoveryCheckpoint(leased(), validCheckpoint({ runtimeVersion: '999' }));
    expect(result.outcome).toBe('INVALID_CHECKPOINT');
    expect(result.reason).toBe('unsupported_runtime_version');
    expect(STRATEGY_RUNTIME_VERSION).toBe('1');
  });

  it('rejects unsupported schema version option', () => {
    const result = validateRecoveryCheckpoint(leased(), validCheckpoint(), {
      schemaVersion: 99,
    });
    expect(result.reason).toBe('unsupported_schema_version');
  });

  it('rejects illegal Runtime state (bad version / fence on checkpoint)', () => {
    expect(validateRecoveryCheckpoint(leased(), validCheckpoint({ version: 0 })).reason).toBe(
      'illegal_runtime_state',
    );

    const withFence = {
      ...validCheckpoint(),
      fencingToken: 7,
    } as StrategyCheckpoint;
    expect(validateRecoveryCheckpoint(leased(), withFence).reason).toBe('illegal_runtime_state');
  });

  it('rejects illegal checkpoint identity', () => {
    const result = validateRecoveryCheckpoint(
      leased(),
      validCheckpoint({ id: 'scp_not_deterministic' }),
    );
    expect(result.reason).toBe('illegal_checkpoint_identity');
  });

  it('requires a leased Session', () => {
    expect(validateRecoveryCheckpoint(null, validCheckpoint()).reason).toBe('lease_required');
  });

  it('builds LeasedRecoverySession only from LEASE_ACQUIRED', () => {
    const candidate: RecoveryCandidate = {
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      status: TradingSessionStatus.RUNNING,
      createdAt: at,
    };
    const acquired: RecoveryLeaseAcquisitionResult = {
      outcome: 'LEASE_ACQUIRED',
      reason: 'missing_lease',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      ownerId: 'runtime-a',
      fencingToken: 2,
      expiresAt: at,
    };
    expect(toLeasedRecoverySession(acquired, candidate)).toEqual({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      ownerId: 'runtime-a',
      fencingToken: 2,
    });

    const denied: RecoveryLeaseAcquisitionResult = {
      ...acquired,
      outcome: 'LEASE_DENIED',
      reason: 'active_foreign_lease',
      fencingToken: null,
      expiresAt: null,
    };
    expect(toLeasedRecoverySession(denied, candidate)).toBeNull();
  });
});
