import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import {
  deterministicCheckpointId,
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  TickAdmissionStatus,
  type StrategyCheckpoint,
  type StrategyRuntimePort,
} from '../../strategy-runtime';
import {
  RecoveryRuntimeArmingOperationalState,
  type RecoveryRuntimeArmingResult,
} from '../domain/recovery-runtime-arming';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import type { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';
import { RecoveryStrategyEvaluationService } from './recovery-strategy-evaluation.service';

const at = '2026-07-30T19:00:00.000Z';

function deployment() {
  const draft = createStrategyDeployment({
    id: 'deployment-1',
    workspaceId: 'ws-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    parameters: { action: 'buy', confidence: 0.8 },
    instrument: 'BTCUSDT',
    timeframe: '1m',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config',
    riskPolicyId: 'risk-1',
    riskPolicyVersion: 1,
    createdAt: at,
    recordedAt: at,
    actorId: 'actor-1',
    idempotencyKey: 'idem-eval-1',
  });
  return approveStrategyDeployment(draft, {
    approvedAt: at,
    approvedByActorId: 'admin-1',
    recordedAt: at,
  });
}

function checkpoint(): StrategyCheckpoint {
  return Object.freeze({
    id: deterministicCheckpointId('ws-1', 'session-1'),
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    lastProcessedCandle: Object.freeze({
      streamId: 'stream-1',
      sequence: 10,
      openTime: '2026-07-30T18:49:00.000Z',
      instrument: 'BTCUSDT',
      timeframe: '1m' as const,
    }),
    lastProcessedEventId: 'evt-10',
    runtimeVersion: '1',
    version: 3,
    updatedAt: at,
  });
}

function armingResult(): RecoveryRuntimeArmingResult {
  return {
    outcome: 'ARMED',
    reason: 'runtime_armed',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    armedState: {
      operationalState: RecoveryRuntimeArmingOperationalState.ARMED,
      workerState: RuntimeWorkerState.ARMED,
      acceptsTicks: true,
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      fencingToken: 4,
      checkpointEventId: 'evt-10',
      checkpointSequence: 10,
      checkpointVersion: 3,
      runtimeVersion: '1',
    },
  };
}

function session() {
  return {
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy' as const,
    status: TradingSessionStatus.RECOVERING,
    lease: {
      ownerId: 'runtime-a',
      fencingToken: 4,
      acquiredAt: '2026-07-30T18:55:00.000Z',
      expiresAt: '2026-07-30T19:05:00.000Z',
      heartbeatAt: '2026-07-30T18:59:00.000Z',
    },
    lastFencingToken: 4,
    version: 3,
    failureReason: null,
    createdAt: '2026-07-30T17:00:00.000Z',
    recordedAt: '2026-07-30T18:59:00.000Z',
    actorId: 'actor-1',
    correlationId: null,
    idempotencyKey: 'idem-1',
  };
}

function event(sequence = 11) {
  return {
    eventId: `evt-${sequence}`,
    workspaceId: 'ws-1',
    streamId: 'stream-1',
    sequence,
    openTime: '2026-07-30T18:50:00.000Z',
    closeTime: '2026-07-30T18:50:59.999Z',
    instrument: 'BTCUSDT',
    timeframe: '1m',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 12,
  };
}

describe('US247 — RecoveryStrategyEvaluationService', () => {
  const loadContext = vi.fn();
  const getLifecycle = vi.fn();
  const getDiagnostics = vi.fn();
  const admitTick = vi.fn();
  const evaluate = vi.fn();
  const emitSignalIntent = vi.fn();
  const saveCheckpoint = vi.fn();
  const arm = vi.fn();

  const runtime = {
    loadContext,
    getLifecycle,
    getDiagnostics,
    arm,
    enableEventAdmission: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    admitTick,
    evaluate,
    emitSignalIntent,
    listSignalIntents: vi.fn(),
    saveCheckpoint,
    loadCheckpoint: vi.fn(),
  } as unknown as StrategyRuntimePort;

  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    saveIfVersion: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByStatuses: vi.fn(),
  };

  const armingService = {
    getLastResult: vi.fn(),
  };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoveryStrategyEvaluationService;

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

    service = new RecoveryStrategyEvaluationService(
      runtime,
      sessions,
      armingService as unknown as RecoveryRuntimeArmingService,
      logger as never,
    );

    const approved = deployment();
    const cp = checkpoint();
    vi.mocked(armingService.getLastResult).mockReturnValue(armingResult());
    vi.mocked(sessions.findById).mockResolvedValue(session() as never);
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.ARMED,
      fencingToken: 4,
      acceptsTicks: true,
      draining: false,
    });
    vi.mocked(getDiagnostics).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-10',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.ARMED,
      acceptsTicks: true,
    });
    vi.mocked(loadContext).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      deployment: approved,
      checkpoint: cp,
      runtimeVersion: '1',
    });
    vi.mocked(admitTick).mockResolvedValue({
      status: TickAdmissionStatus.ADMITTED,
      admitted: true,
      reason: 'closed-candle tick admitted',
      eventId: 'evt-11',
      streamId: 'stream-1',
      sequence: 11,
    });
  });

  it('evaluates successfully without SignalIntent or Order path activity', async () => {
    const result = await service.evaluate({ event: event(), nowIso: at });

    expect(result.outcome).toBe('EVALUATED');
    expect(result.decision?.kind).toBe(EvaluationOutcomeKind.SIGNAL_INTENT);
    expect(result.signalIntentEmitted).toBe(false);
    expect(result.orderCreated).toBe(false);
    expect(admitTick).toHaveBeenCalledOnce();
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(arm).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_strategy_evaluation',
      expect.objectContaining({
        outcome: 'EVALUATED',
        reason: 'strategy_evaluated',
        signalIntentEmitted: false,
        orderCreated: false,
      }),
    );
  });

  it('blocks when Runtime is not ARMED', async () => {
    vi.mocked(armingService.getLastResult).mockReturnValue({
      ...armingResult(),
      outcome: 'ARMING_BLOCKED',
      reason: 'invalid_lifecycle',
      armedState: null,
    });

    const result = await service.evaluate({ event: event(), nowIso: at });

    expect(result.outcome).toBe('EVALUATION_BLOCKED');
    expect(result.reason).toBe('runtime_not_armed');
    expect(admitTick).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();
  });

  it('handles duplicate events from admission and in-process replay', async () => {
    const first = await service.evaluate({ event: event(), nowIso: at });
    expect(first.outcome).toBe('EVALUATED');

    const second = await service.evaluate({ event: event(), nowIso: at });
    expect(second.outcome).toBe('DUPLICATE_EVENT');
    expect(second.reason).toBe('already_evaluated');
    expect(evaluate).not.toHaveBeenCalled();
    expect(emitSignalIntent).not.toHaveBeenCalled();

    vi.mocked(admitTick).mockResolvedValueOnce({
      status: TickAdmissionStatus.REJECTED_DUPLICATE,
      admitted: false,
      reason: 'duplicate closed-candle tick',
      eventId: 'evt-10',
      streamId: 'stream-1',
      sequence: 10,
    });
    const fromCheckpoint = await service.evaluate({ event: event(10), nowIso: at });
    expect(fromCheckpoint.outcome).toBe('DUPLICATE_EVENT');
    expect(fromCheckpoint.reason).toBe('duplicate_event');
  });

  it('verifies restored context matches the armed checkpoint identity', async () => {
    const result = await service.evaluate({ event: event(), nowIso: at });

    expect(result.restoredContext).toEqual({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      fencingToken: 4,
      checkpointEventId: 'evt-10',
      checkpointSequence: 10,
      checkpointVersion: 3,
      runtimeVersion: '1',
    });
    expect(loadContext).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
    });

    vi.mocked(getDiagnostics).mockResolvedValueOnce({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deploymentId: 'deployment-1',
      checkpointVersion: 3,
      lastProcessedEventId: 'evt-mismatch',
      lastProcessedCandleSequence: 10,
      runtimeVersion: '1',
      evaluationEnabled: true,
      workerState: RuntimeWorkerState.ARMED,
      acceptsTicks: true,
    });
    const mismatched = await service.evaluate({ event: event(12), nowIso: at });
    expect(mismatched.outcome).toBe('EVALUATION_BLOCKED');
    expect(mismatched.reason).toBe('runtime_context_mismatch');
  });
});
