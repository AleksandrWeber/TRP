import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeWorkerState } from '../../strategy-runtime/domain/runtime-lifecycle';
import type { StrategyRuntimePort } from '../../strategy-runtime/ports/strategy-runtime.port';
import type { RecoveryCheckpointValidationResult } from '../domain/recovery-checkpoint-validation';
import type { RecoveryLeaseAcquisitionResult } from '../domain/recovery-lease-acquisition';
import type { RecoveryStateReconciliationResult } from '../domain/recovery-state-reconciliation';
import type { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';
import { RecoveryRuntimeResumeService } from './recovery-runtime-resume.service';
import type { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import type { RecoveryLeaseAcquisitionService } from './recovery-lease-acquisition.service';
import type { RecoveryStateReconciliationService } from './recovery-state-reconciliation.service';

const at = '2026-07-30T16:00:00.000Z';

function lease(): RecoveryLeaseAcquisitionResult {
  return {
    outcome: 'LEASE_ACQUIRED',
    reason: 'missing_lease',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    ownerId: 'runtime-a',
    fencingToken: 4,
    expiresAt: at,
  };
}

function checkpoint(): RecoveryCheckpointValidationResult {
  return {
    outcome: 'VALID_CHECKPOINT',
    reason: 'valid',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    fencingToken: 4,
    checkpoint: {
      checkpointId: 'scp_1',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      lastProcessedEventId: 'evt-10',
      runtimeVersion: '1',
      version: 3,
      updatedAt: at,
      streamId: 'stream-1',
      sequence: 10,
    },
  };
}

function reconciled(): RecoveryStateReconciliationResult {
  return {
    outcome: 'RECONCILED',
    failedContext: null,
    reason: 'all participating contexts agree on recovery point',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    recoveryPointEventId: 'evt-10',
    mismatches: [],
  };
}

describe('US244 — RecoveryRuntimeResumeService', () => {
  const loadContext = vi.fn();
  const getLifecycle = vi.fn();
  const getDiagnostics = vi.fn();
  const arm = vi.fn();
  const resumeRuntime = vi.fn();
  const admitTick = vi.fn();
  const evaluate = vi.fn();
  const emitSignalIntent = vi.fn();
  const saveCheckpoint = vi.fn();

  const runtime = {
    loadContext,
    getLifecycle,
    getDiagnostics,
    arm,
    pause: vi.fn(),
    resume: resumeRuntime,
    stop: vi.fn(),
    admitTick,
    evaluate,
    emitSignalIntent,
    listSignalIntents: vi.fn(),
    saveCheckpoint,
    loadCheckpoint: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const discovery = { getLastResult: vi.fn(), discover: vi.fn() };
  const leases = { getLastResult: vi.fn() };
  const checkpoints = { getLastResult: vi.fn() };
  const reconciliation = { getLastResult: vi.fn() };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryRuntimeResumeService;

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
    service = new RecoveryRuntimeResumeService(
      runtime,
      leases as unknown as RecoveryLeaseAcquisitionService,
      discovery as unknown as StartupRecoveryDiscoveryService,
      checkpoints as unknown as RecoveryCheckpointValidationService,
      reconciliation as unknown as RecoveryStateReconciliationService,
      logger as never,
    );

    loadContext.mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      deployment: {
        id: 'deployment-1',
        workspaceId: 'ws-1',
        status: 'APPROVED',
      },
      checkpoint: {
        id: 'scp_1',
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
        runtimeVersion: '1',
        version: 3,
        updatedAt: at,
      },
      runtimeVersion: '1',
    });
    getLifecycle.mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.IDLE,
      fencingToken: null,
      acceptsTicks: false,
      draining: false,
    });
    getDiagnostics.mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.IDLE,
      acceptsTicks: false,
    });
  });

  it('resumes successfully to READY while runtime remains idle', async () => {
    const result = await service.resume(lease(), checkpoint(), reconciled());
    expect(result.outcome).toBe('READY');
    expect(result.readyState?.operationalState).toBe('READY');
    expect(result.readyState?.workerState).toBe(RuntimeWorkerState.IDLE);
    expect(result.readyState?.acceptsTicks).toBe(false);
    expect(arm).not.toHaveBeenCalled();
    expect(resumeRuntime).not.toHaveBeenCalled();
    expect(admitTick).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
  });

  it('blocks invalid recovery preconditions', async () => {
    const result = await service.resume(
      {
        ...lease(),
        outcome: 'LEASE_DENIED',
        fencingToken: null,
        expiresAt: null,
        reason: 'active_foreign_lease',
      },
      checkpoint(),
      reconciled(),
    );
    expect(result.outcome).toBe('RESUME_BLOCKED');
    expect(result.reason).toBe('lease_not_acquired');
    expect(loadContext).not.toHaveBeenCalled();
  });

  it('prevents duplicate resume', async () => {
    const first = await service.resume(lease(), checkpoint(), reconciled());
    const second = await service.resume(lease(), checkpoint(), reconciled());
    expect(first.outcome).toBe('READY');
    expect(second.outcome).toBe('RESUME_BLOCKED');
    expect(second.reason).toBe('already_resumed');
  });

  it('blocks when runtime lifecycle is not idle', async () => {
    getLifecycle.mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.ARMED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    const result = await service.resume(lease(), checkpoint(), reconciled());
    expect(result.outcome).toBe('RESUME_BLOCKED');
    expect(result.reason).toBe('runtime_not_idle');
  });

  it('bootstrap resumes only when prior stages succeeded', async () => {
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: 'running',
        createdAt: at,
      },
      eligibleSessionIds: ['session-1'],
    });
    leases.getLastResult.mockReturnValue(lease());
    checkpoints.getLastResult.mockReturnValue(checkpoint());
    reconciliation.getLastResult.mockReturnValue(reconciled());
    await service.onApplicationBootstrap();
    expect(loadContext).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
    });
    expect(service.getLastResult()?.outcome).toBe('READY');
  });

  it('bootstrap skips when recovery prerequisites are absent', async () => {
    leases.getLastResult.mockReturnValue(null);
    checkpoints.getLastResult.mockReturnValue(checkpoint());
    reconciliation.getLastResult.mockReturnValue(reconciled());
    discovery.getLastResult.mockReturnValue({
      outcome: 'no_recovery_required',
      eligibleCount: 0,
      candidate: null,
      eligibleSessionIds: [],
    });
    await service.onApplicationBootstrap();
    expect(loadContext).not.toHaveBeenCalled();
    expect(service.getLastResult()).toBeNull();
  });

  it('bootstrap resolves prior stages explicitly when cache is empty', async () => {
    discovery.getLastResult.mockReturnValue(null);
    discovery.discover.mockResolvedValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: 'running',
        createdAt: at,
      },
      eligibleSessionIds: ['session-1'],
    });
    leases.getLastResult.mockReturnValue(lease());
    checkpoints.getLastResult.mockReturnValue(checkpoint());
    reconciliation.getLastResult.mockReturnValue(reconciled());
    await service.onApplicationBootstrap();
    expect(discovery.discover).toHaveBeenCalledOnce();
    expect(loadContext).toHaveBeenCalled();
  });
});
