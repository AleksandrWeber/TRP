import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTradingSession, attachLease, transitionSession } from '../domain/trading-session';
import { createSessionLease } from '../domain/session-lease';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { RecoveryLeaseAcquisitionResult } from '../domain/recovery-lease-acquisition';
import type { RecoveryCheckpointValidationResult } from '../domain/recovery-checkpoint-validation';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import type { RecoveryReconciliationPorts } from '../ports/recovery-reconciliation.ports';
import type { StrategyRuntimePort } from '../../strategy-runtime/ports/strategy-runtime.port';
import type { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';
import { RecoveryStateReconciliationService } from './recovery-state-reconciliation.service';
import type { RecoveryLeaseAcquisitionService } from './recovery-lease-acquisition.service';
import type { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';

const at = '2026-07-30T15:00:00.000Z';

function lease(): RecoveryLeaseAcquisitionResult {
  return {
    outcome: 'LEASE_ACQUIRED',
    reason: 'missing_lease',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    ownerId: 'runtime-a',
    fencingToken: 3,
    expiresAt: at,
  };
}

function validCheckpoint(): RecoveryCheckpointValidationResult {
  return {
    outcome: 'VALID_CHECKPOINT',
    reason: 'valid',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    fencingToken: 3,
    checkpoint: {
      checkpointId: 'scp_1',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      lastProcessedEventId: 'evt-10',
      runtimeVersion: '1',
      version: 2,
      updatedAt: at,
      streamId: 'stream-1',
      sequence: 10,
    },
  };
}

function sessionRow() {
  const created = createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: 'idem-1',
    createdAt: at,
    recordedAt: at,
  });
  const running = transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, at),
    TradingSessionStatus.RUNNING,
    at,
  );
  return attachLease(
    running,
    createSessionLease({
      ownerId: 'runtime-a',
      acquiredAt: at,
      expiresAt: '2026-07-30T15:00:30.000Z',
      previousToken: 2,
    }),
  );
}

describe('US243 — RecoveryStateReconciliationService', () => {
  const findById = vi.fn();
  const listSignalIntents = vi.fn();
  const listOrdersBySession = vi.fn();
  const reconcileExecution = vi.fn();
  const readAccounting = vi.fn();
  const readRisk = vi.fn();
  const arm = vi.fn();
  const resume = vi.fn();
  const evaluate = vi.fn();
  const saveCheckpoint = vi.fn();

  const sessions = {
    findById,
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByStatuses: vi.fn(),
  } as unknown as TradingSessionRepository;

  const runtime = {
    listSignalIntents,
    loadCheckpoint: vi.fn(),
    arm,
    resume,
    evaluate,
    saveCheckpoint,
    loadContext: vi.fn(),
    getDiagnostics: vi.fn(),
    getLifecycle: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    admitTick: vi.fn(),
    emitSignalIntent: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const ports = {
    listOrdersBySession,
    reconcileExecution,
    readAccounting,
    readRisk,
  } as unknown as RecoveryReconciliationPorts;

  const discovery = { getLastResult: vi.fn(), discover: vi.fn() };
  const leases = { getLastResult: vi.fn() };
  const checkpoints = { getLastResult: vi.fn() };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryStateReconciliationService;

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
    service = new RecoveryStateReconciliationService(
      sessions,
      runtime,
      ports,
      discovery as unknown as StartupRecoveryDiscoveryService,
      leases as unknown as RecoveryLeaseAcquisitionService,
      checkpoints as unknown as RecoveryCheckpointValidationService,
      logger as never,
    );
    findById.mockResolvedValue(sessionRow());
    listSignalIntents.mockResolvedValue([]);
    listOrdersBySession.mockResolvedValue([]);
    readAccounting.mockResolvedValue({
      status: 'consistent',
      sourceHash: 'h',
      rebuiltHash: 'h',
      reason: null,
    });
    readRisk.mockResolvedValue({ killSwitchActive: null, decisions: [] });
  });

  it('reconciles consistent state without Runtime or Order mutations', async () => {
    const result = await service.reconcile(lease(), validCheckpoint());
    expect(result.outcome).toBe('RECONCILED');
    expect(arm).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_state_reconciliation',
      expect.objectContaining({ outcome: 'RECONCILED', failedContext: null }),
    );
  });

  it('fails and logs failedContext for accounting mismatch', async () => {
    readAccounting.mockResolvedValue({
      status: 'mismatch',
      sourceHash: 'a',
      rebuiltHash: 'b',
      reason: 'ledger diverge',
    });
    const result = await service.reconcile(lease(), validCheckpoint());
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.failedContext).toBe('accounting');
    expect(info).toHaveBeenCalledWith(
      'recovery_state_reconciliation',
      expect.objectContaining({ failedContext: 'accounting' }),
    );
  });

  it('fails on order session mismatch collected via ports', async () => {
    listOrdersBySession.mockResolvedValue([
      {
        orderId: 'ord-1',
        status: 'proposed',
        tradingSessionId: 'wrong',
        paperAccountId: 'account-1',
        openOrUncertain: true,
      },
    ]);
    reconcileExecution.mockResolvedValue({
      orderId: 'ord-1',
      status: 'proposed',
      terminal: false,
      fillCount: 0,
      reconciliationRequired: false,
    });
    const result = await service.reconcile(lease(), validCheckpoint());
    expect(result.failedContext).toBe('orders');
  });

  it('fails on execution reconciliationRequired', async () => {
    listOrdersBySession.mockResolvedValue([
      {
        orderId: 'ord-1',
        status: 'submitted',
        tradingSessionId: 'session-1',
        paperAccountId: 'account-1',
        openOrUncertain: true,
      },
    ]);
    reconcileExecution.mockResolvedValue({
      orderId: 'ord-1',
      status: 'uncertain',
      terminal: false,
      fillCount: 0,
      reconciliationRequired: true,
    });
    const result = await service.reconcile(lease(), validCheckpoint());
    expect(result.failedContext).toBe('execution');
  });

  it('fails when session row is missing', async () => {
    findById.mockResolvedValue(null);
    const result = await service.reconcile(lease(), validCheckpoint());
    expect(result.failedContext).toBe('missing_state');
  });

  it('bootstrap runs only after VALID_CHECKPOINT', async () => {
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: TradingSessionStatus.RUNNING,
        createdAt: at,
      },
      eligibleSessionIds: ['session-1'],
    });
    leases.getLastResult.mockReturnValue(lease());
    checkpoints.getLastResult.mockReturnValue(validCheckpoint());
    await service.onApplicationBootstrap();
    expect(findById).toHaveBeenCalled();
    expect(service.getLastResult()?.outcome).toBe('RECONCILED');
  });

  it('bootstrap skips when checkpoint is not valid', async () => {
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: TradingSessionStatus.RUNNING,
        createdAt: at,
      },
      eligibleSessionIds: ['session-1'],
    });
    leases.getLastResult.mockReturnValue(lease());
    checkpoints.getLastResult.mockReturnValue({
      ...validCheckpoint(),
      outcome: 'NO_CHECKPOINT',
      checkpoint: null,
      reason: 'absent',
    });
    await service.onApplicationBootstrap();
    expect(findById).not.toHaveBeenCalled();
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
        status: TradingSessionStatus.RUNNING,
        createdAt: at,
      },
      eligibleSessionIds: ['session-1'],
    });
    leases.getLastResult.mockReturnValue(lease());
    checkpoints.getLastResult.mockReturnValue(validCheckpoint());
    await service.onApplicationBootstrap();
    expect(discovery.discover).toHaveBeenCalledOnce();
    expect(findById).toHaveBeenCalled();
  });
});
