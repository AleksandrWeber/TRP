import { describe, expect, it } from 'vitest';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import {
  createEvaluationCandle,
  createRuntimeContext,
  deterministicCheckpointId,
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  TickAdmissionStatus,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
  type StrategyCheckpoint,
  type TickAdmissionResult,
} from '../../strategy-runtime';
import {
  RecoveryRuntimeArmingOperationalState,
  type RecoveryRuntimeArmingResult,
} from './recovery-runtime-arming';
import { decideRecoveryStrategyEvaluation } from './recovery-strategy-evaluation';

const at = '2026-07-30T19:00:00.000Z';

function deployment(parameters: Record<string, unknown> = { action: 'buy', confidence: 0.75 }) {
  const draft = createStrategyDeployment({
    id: 'deployment-1',
    workspaceId: 'ws-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    parameters,
    instrument: 'BTCUSDT',
    timeframe: '1m',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config',
    riskPolicyId: 'risk-1',
    riskPolicyVersion: 1,
    createdAt: at,
    recordedAt: at,
    actorId: 'actor-1',
    idempotencyKey: `idem-${JSON.stringify(parameters)}`,
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

function arming(): RecoveryRuntimeArmingResult {
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

function lifecycle(overrides: Partial<RuntimeLifecycleSnapshot> = {}): RuntimeLifecycleSnapshot {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    state: RuntimeWorkerState.ARMED,
    fencingToken: 4,
    acceptsTicks: true,
    draining: false,
    ...overrides,
  };
}

function diagnostics(overrides: Partial<RuntimeDiagnostics> = {}): RuntimeDiagnostics {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    deploymentId: 'deployment-1',
    checkpointVersion: 3,
    lastProcessedEventId: 'evt-10',
    lastProcessedCandleSequence: 10,
    runtimeVersion: '1',
    evaluationEnabled: true as const,
    workerState: RuntimeWorkerState.ARMED,
    acceptsTicks: true,
    ...overrides,
  };
}

function context() {
  return createRuntimeContext({
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    deployment: deployment(),
    checkpoint: checkpoint(),
    runtimeVersion: '1',
  });
}

function candle(sequence = 11) {
  return createEvaluationCandle({
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
  });
}

function admitted(): TickAdmissionResult {
  return {
    status: TickAdmissionStatus.ADMITTED,
    admitted: true,
    reason: 'closed-candle tick admitted',
    eventId: 'evt-11',
    streamId: 'stream-1',
    sequence: 11,
  };
}

describe('US247 — recovery strategy evaluation (pure)', () => {
  it('evaluates successfully for an ARMED runtime with matching restored context', () => {
    const result = decideRecoveryStrategyEvaluation({
      arming: arming(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      context: context(),
      admission: admitted(),
      candle: candle(),
      alreadyEvaluated: false,
    });

    expect(result.outcome).toBe('EVALUATED');
    expect(result.reason).toBe('strategy_evaluated');
    expect(result.decision).toMatchObject({
      kind: EvaluationOutcomeKind.SIGNAL_INTENT,
      reason: 'deployment action=buy',
    });
    expect(result.signalIntentEmitted).toBe(false);
    expect(result.orderCreated).toBe(false);
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
  });

  it('blocks when Runtime is not ARMED', () => {
    const result = decideRecoveryStrategyEvaluation({
      arming: {
        ...arming(),
        outcome: 'ARMING_BLOCKED',
        reason: 'invalid_lifecycle',
        armedState: null,
      },
      lifecycle: lifecycle({ state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED }),
      diagnostics: diagnostics({ workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED }),
      context: context(),
      admission: admitted(),
      candle: candle(),
      alreadyEvaluated: false,
    });

    expect(result.outcome).toBe('EVALUATION_BLOCKED');
    expect(result.reason).toBe('runtime_not_armed');
    expect(result.decision).toBeNull();
    expect(result.signalIntentEmitted).toBe(false);
  });

  it('handles duplicate events without emitting SignalIntent', () => {
    const duplicateAdmission: TickAdmissionResult = {
      status: TickAdmissionStatus.REJECTED_DUPLICATE,
      admitted: false,
      reason: 'duplicate closed-candle tick',
      eventId: 'evt-10',
      streamId: 'stream-1',
      sequence: 10,
    };

    const fromAdmission = decideRecoveryStrategyEvaluation({
      arming: arming(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      context: context(),
      admission: duplicateAdmission,
      candle: candle(10),
      alreadyEvaluated: false,
    });
    expect(fromAdmission.outcome).toBe('DUPLICATE_EVENT');
    expect(fromAdmission.reason).toBe('duplicate_event');
    expect(fromAdmission.signalIntentEmitted).toBe(false);
    expect(fromAdmission.orderCreated).toBe(false);

    const alreadyEvaluated = decideRecoveryStrategyEvaluation({
      arming: arming(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      context: context(),
      admission: admitted(),
      candle: candle(),
      alreadyEvaluated: true,
    });
    expect(alreadyEvaluated.outcome).toBe('DUPLICATE_EVENT');
    expect(alreadyEvaluated.reason).toBe('already_evaluated');
  });

  it('blocks when restored Runtime context does not match checkpoint identity', () => {
    const result = decideRecoveryStrategyEvaluation({
      arming: arming(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics({ lastProcessedEventId: 'evt-other' }),
      context: context(),
      admission: admitted(),
      candle: candle(),
      alreadyEvaluated: false,
    });

    expect(result.outcome).toBe('EVALUATION_BLOCKED');
    expect(result.reason).toBe('runtime_context_mismatch');
    expect(result.decision).toBeNull();
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      arming: arming(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      context: context(),
      admission: admitted(),
      candle: candle(),
      alreadyEvaluated: false,
    };

    expect(decideRecoveryStrategyEvaluation(input)).toEqual(
      decideRecoveryStrategyEvaluation(input),
    );
  });
});
