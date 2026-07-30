import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import {
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  SignalIntentDirection,
  type StrategyCheckpoint,
  type StrategyRuntimePort,
} from '../../strategy-runtime';
import {
  RecoveryRuntimeArmingOperationalState,
  type RecoveryRuntimeArmingResult,
} from '../domain/recovery-runtime-arming';
import type { RecoveryStrategyEvaluationResult } from '../domain/recovery-strategy-evaluation';
import type { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';
import type { RecoveryStrategyEvaluationService } from './recovery-strategy-evaluation.service';
import { RecoverySignalIntentGenerationService } from './recovery-signal-intent-generation.service';

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
    idempotencyKey: 'idem-sig-svc-1',
  });
  return approveStrategyDeployment(draft, {
    approvedAt: at,
    approvedByActorId: 'admin-1',
    recordedAt: at,
  });
}

function checkpoint(): StrategyCheckpoint {
  return Object.freeze({
    id: 'cp_ws-1_session-1',
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

function evaluationResult(
  overrides: Partial<RecoveryStrategyEvaluationResult> = {},
): RecoveryStrategyEvaluationResult {
  return {
    outcome: 'EVALUATED',
    reason: 'strategy_evaluated',
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    decision: {
      kind: EvaluationOutcomeKind.SIGNAL_INTENT,
      direction: SignalIntentDirection.BUY,
      confidence: 0.8,
      reason: 'deployment action=buy',
    },
    restoredContext: {
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      fencingToken: 4,
      checkpointEventId: 'evt-10',
      checkpointSequence: 10,
      checkpointVersion: 3,
      runtimeVersion: '1',
    },
    eventId: 'evt-11',
    signalIntentEmitted: false,
    orderCreated: false,
    ...overrides,
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

describe('US248 — RecoverySignalIntentGenerationService', () => {
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

  const armingService = {
    getLastResult: vi.fn(),
  };

  const evaluationService = {
    getLastResult: vi.fn(),
  };

  let info: ReturnType<typeof vi.fn>;
  let service: RecoverySignalIntentGenerationService;

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

    service = new RecoverySignalIntentGenerationService(
      runtime,
      armingService as unknown as RecoveryRuntimeArmingService,
      evaluationService as unknown as RecoveryStrategyEvaluationService,
      logger as never,
    );

    const approved = deployment();
    const cp = checkpoint();
    vi.mocked(armingService.getLastResult).mockReturnValue(armingResult());
    vi.mocked(evaluationService.getLastResult).mockReturnValue(evaluationResult());
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
    vi.mocked(emitSignalIntent).mockResolvedValue({
      intent: {
        id: 'si_test',
        intentHash: 'hash-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        sessionId: 'session-1',
        strategyVersion: '1.0.0',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        direction: SignalIntentDirection.BUY,
        confidence: 0.8,
        marketCheckpoint: { streamId: 'stream-1', sequence: 11, eventId: 'evt-11' },
        generatedAt: '2026-07-30T18:50:59.999Z',
        recordedAt: at,
        actorId: 'actor-1',
        correlationId: null,
        metadata: {},
        intentVersion: 1,
      },
      created: true,
    });
  });

  it('generates exactly one SignalIntent without Orders or Execution activity', async () => {
    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_INTENT_GENERATED');
    expect(result.signalIntentGenerated).toBe(true);
    expect(result.intentCreated).toBe(true);
    expect(result.intent?.id).toBe('si_test');
    expect(result.orderCreated).toBe(false);
    expect(emitSignalIntent).toHaveBeenCalledOnce();
    expect(emitSignalIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        deploymentId: 'deployment-1',
        direction: SignalIntentDirection.BUY,
        confidence: 0.8,
        marketCheckpoint: {
          streamId: 'stream-1',
          sequence: 11,
          eventId: 'evt-11',
        },
        actorId: 'actor-1',
      }),
    );
    expect(evaluate).not.toHaveBeenCalled();
    expect(admitTick).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(arm).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_signal_intent_generation',
      expect.objectContaining({
        outcome: 'SIGNAL_INTENT_GENERATED',
        reason: 'signal_intent_generated',
        signalIntentGenerated: true,
        orderCreated: false,
        intentCreated: true,
      }),
    );
  });

  it('blocks duplicate Decision conversion', async () => {
    const first = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });
    expect(first.outcome).toBe('SIGNAL_INTENT_GENERATED');

    const second = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });
    expect(second.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(second.reason).toBe('decision_already_converted');
    expect(emitSignalIntent).toHaveBeenCalledOnce();
  });

  it('blocks invalid Runtime state', async () => {
    vi.mocked(getLifecycle).mockResolvedValue({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      state: RuntimeWorkerState.IDLE,
      fencingToken: 4,
      acceptsTicks: false,
      draining: false,
    });

    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('invalid_lifecycle');
    expect(emitSignalIntent).not.toHaveBeenCalled();
  });

  it('blocks invalid Session identity', async () => {
    vi.mocked(evaluationService.getLastResult).mockReturnValue(
      evaluationResult({ sessionId: 'other-session' }),
    );

    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('session_mismatch');
    expect(emitSignalIntent).not.toHaveBeenCalled();
  });

  it('blocks duplicate upstream evaluation events', async () => {
    vi.mocked(evaluationService.getLastResult).mockReturnValue(
      evaluationResult({
        outcome: 'DUPLICATE_EVENT',
        reason: 'already_evaluated',
        decision: null,
      }),
    );

    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('duplicate_event');
    expect(emitSignalIntent).not.toHaveBeenCalled();
  });

  it('leaves Runtime lifecycle unchanged and never writes checkpoints', async () => {
    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_INTENT_GENERATED');
    expect(arm).not.toHaveBeenCalled();
    expect(runtime.pause).not.toHaveBeenCalled();
    expect(runtime.resume).not.toHaveBeenCalled();
    expect(runtime.stop).not.toHaveBeenCalled();
    expect(runtime.enableEventAdmission).not.toHaveBeenCalled();
    expect(saveCheckpoint).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('rejects non-actionable decisions without emitting', async () => {
    vi.mocked(evaluationService.getLastResult).mockReturnValue(
      evaluationResult({
        decision: {
          kind: EvaluationOutcomeKind.NO_ACTION,
          reason: 'deployment action=hold',
        },
      }),
    );

    const result = await service.generate({
      event: event(),
      recordedAt: at,
      actorId: 'actor-1',
    });

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('decision_not_actionable');
    expect(emitSignalIntent).not.toHaveBeenCalled();
  });
});
