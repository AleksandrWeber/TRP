import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStrategyCheckpoint,
  type StrategyCheckpoint,
} from '../../strategy-runtime/domain/strategy-checkpoint';
import type { StrategyRuntimePort } from '../../strategy-runtime/ports/strategy-runtime.port';
import type { RecoveryLeaseAcquisitionResult } from '../domain/recovery-lease-acquisition';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { RecoveryLeaseAcquisitionService } from './recovery-lease-acquisition.service';
import { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import type { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

const at = '2026-07-30T14:00:00.000Z';

function candidate(): RecoveryCandidate {
  return {
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    status: TradingSessionStatus.RUNNING,
    createdAt: at,
  };
}

function leaseAcquired(): RecoveryLeaseAcquisitionResult {
  return {
    outcome: 'LEASE_ACQUIRED',
    reason: 'missing_lease',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    ownerId: 'runtime-a',
    fencingToken: 2,
    expiresAt: at,
  };
}

function checkpoint(): StrategyCheckpoint {
  return createStrategyCheckpoint({
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    lastProcessedCandle: {
      streamId: 'stream-1',
      sequence: 3,
      openTime: at,
      instrument: 'ETHUSDT',
      timeframe: '1m',
    },
    lastProcessedEventId: 'evt-3',
    updatedAt: at,
  });
}

describe('US242 — RecoveryCheckpointValidationService', () => {
  const loadCheckpoint = vi.fn();
  const runtime = {
    loadCheckpoint,
    loadContext: vi.fn(),
    getDiagnostics: vi.fn(),
    getLifecycle: vi.fn(),
    arm: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    admitTick: vi.fn(),
    evaluate: vi.fn(),
    emitSignalIntent: vi.fn(),
    listSignalIntents: vi.fn(),
    saveCheckpoint: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const leases = {
    getLastResult: vi.fn(),
    acquire: vi.fn(),
  };
  const discovery = {
    getLastResult: vi.fn(),
  };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryCheckpointValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    info = vi.fn();
    const logger = {
      info,
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    logger.child.mockReturnValue(logger);
    service = new RecoveryCheckpointValidationService(
      runtime,
      leases as unknown as RecoveryLeaseAcquisitionService,
      discovery as unknown as StartupRecoveryDiscoveryService,
      logger as never,
    );
  });

  it('validates a loaded checkpoint without resuming Runtime', async () => {
    loadCheckpoint.mockResolvedValue(checkpoint());
    const result = await service.validateForLease(leaseAcquired(), candidate());
    expect(result.outcome).toBe('VALID_CHECKPOINT');
    expect(runtime.arm).not.toHaveBeenCalled();
    expect(runtime.resume).not.toHaveBeenCalled();
    expect(runtime.evaluate).not.toHaveBeenCalled();
    expect(runtime.saveCheckpoint).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_checkpoint_validation',
      expect.objectContaining({ outcome: 'VALID_CHECKPOINT', reason: 'valid' }),
    );
  });

  it('returns NO_CHECKPOINT when Runtime has no durable checkpoint', async () => {
    loadCheckpoint.mockResolvedValue(null);
    const result = await service.validateForLease(leaseAcquired(), candidate());
    expect(result.outcome).toBe('NO_CHECKPOINT');
    expect(result.reason).toBe('absent');
  });

  it('returns INVALID_CHECKPOINT on load failure', async () => {
    loadCheckpoint.mockRejectedValue(new Error('corrupt row'));
    const result = await service.validateForLease(leaseAcquired(), candidate());
    expect(result.outcome).toBe('INVALID_CHECKPOINT');
    expect(result.reason).toBe('load_failed');
  });

  it('returns INVALID_CHECKPOINT for mismatched Session identity', async () => {
    loadCheckpoint.mockResolvedValue(
      createStrategyCheckpoint({
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        sessionId: 'other-session',
        lastProcessedCandle: {
          streamId: 'stream-1',
          sequence: 1,
          openTime: at,
          instrument: 'BTCUSDT',
          timeframe: '1m',
        },
        lastProcessedEventId: 'evt-1',
        updatedAt: at,
      }),
    );
    const result = await service.validateForLease(leaseAcquired(), candidate());
    expect(result.reason).toBe('session_mismatch');
  });

  it('skips bootstrap when lease was not acquired', async () => {
    leases.getLastResult.mockReturnValue({
      ...leaseAcquired(),
      outcome: 'LEASE_DENIED',
      fencingToken: null,
    });
    leases.acquire.mockResolvedValue({
      ...leaseAcquired(),
      outcome: 'LEASE_DENIED',
      fencingToken: null,
    });
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: candidate(),
      eligibleSessionIds: ['session-1'],
    });
    await service.onApplicationBootstrap();
    expect(loadCheckpoint).not.toHaveBeenCalled();
    expect(service.getLastResult()).toEqual({
      outcome: 'INVALID_CHECKPOINT',
      reason: 'lease_required',
      sessionId: '',
      workspaceId: '',
      deploymentId: '',
      fencingToken: null,
      checkpoint: null,
    });
  });

  it('bootstrap validates after successful lease', async () => {
    leases.getLastResult.mockReturnValue(leaseAcquired());
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: candidate(),
      eligibleSessionIds: ['session-1'],
    });
    loadCheckpoint.mockResolvedValue(null);
    await service.onApplicationBootstrap();
    expect(loadCheckpoint).toHaveBeenCalledWith('ws-1', 'session-1');
    expect(service.getLastResult()?.outcome).toBe('NO_CHECKPOINT');
  });
});
