import { describe, expect, it } from 'vitest';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import {
  createEvaluationCandle,
  createRuntimeContext,
  deterministicCheckpointId,
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  SignalIntentDirection,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
  type StrategyCheckpoint,
} from '../../strategy-runtime';
import {
  RecoveryRuntimeArmingOperationalState,
  type RecoveryRuntimeArmingResult,
} from './recovery-runtime-arming';
import type { RecoveryStrategyEvaluationResult } from './recovery-strategy-evaluation';
import { decideRecoverySignalIntentGeneration } from './recovery-signal-intent-generation';

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
    idempotencyKey: 'idem-sig-1',
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
    evaluationEnabled: true,
    workerState: RuntimeWorkerState.ARMED,
    acceptsTicks: true,
    ...overrides,
  };
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

function evaluation(
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

function validInput(overrides: Record<string, unknown> = {}) {
  const approved = deployment();
  return {
    evaluation: evaluation(),
    arming: arming(),
    lifecycle: lifecycle(),
    diagnostics: diagnostics(),
    context: createRuntimeContext({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      deployment: approved,
      checkpoint: checkpoint(),
    }),
    candle: candle(),
    alreadyConverted: false,
    alreadyGenerated: false,
    ...overrides,
  };
}

describe('US248 — recovery SignalIntent generation (pure)', () => {
  it('maps a successful SIGNAL_INTENT decision to exactly one generation plan', () => {
    const result = decideRecoverySignalIntentGeneration(validInput());

    expect(result.outcome).toBe('SIGNAL_INTENT_GENERATED');
    expect(result.reason).toBe('signal_intent_generated');
    expect(result.signalIntentGenerated).toBe(true);
    expect(result.orderCreated).toBe(false);
    expect(result.plan).toEqual(
      expect.objectContaining({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        deploymentId: 'deployment-1',
        strategyVersion: '1.0.0',
        instrument: 'BTCUSDT',
        timeframe: '1m',
        direction: SignalIntentDirection.BUY,
        confidence: 0.8,
        marketCheckpoint: {
          streamId: 'stream-1',
          sequence: 11,
          eventId: 'evt-11',
        },
        generatedAt: '2026-07-30T18:50:59.999Z',
        evaluationReason: 'deployment action=buy',
      }),
    );
  });

  it('blocks when evaluation did not complete successfully', () => {
    const result = decideRecoverySignalIntentGeneration(
      validInput({
        evaluation: evaluation({
          outcome: 'EVALUATION_BLOCKED',
          reason: 'runtime_not_armed',
          decision: null,
          restoredContext: null,
        }),
      }),
    );

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('evaluation_not_completed');
    expect(result.plan).toBeNull();
    expect(result.signalIntentGenerated).toBe(false);
  });

  it('blocks duplicate events from upstream evaluation', () => {
    const result = decideRecoverySignalIntentGeneration(
      validInput({
        evaluation: evaluation({
          outcome: 'DUPLICATE_EVENT',
          reason: 'already_evaluated',
          decision: null,
        }),
      }),
    );

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('duplicate_event');
  });

  it('blocks already converted decisions and already generated intents', () => {
    const converted = decideRecoverySignalIntentGeneration(validInput({ alreadyConverted: true }));
    expect(converted.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(converted.reason).toBe('decision_already_converted');

    const generated = decideRecoverySignalIntentGeneration(validInput({ alreadyGenerated: true }));
    expect(generated.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(generated.reason).toBe('already_generated');
  });

  it('blocks invalid Runtime state and Session mismatch', () => {
    const notArmed = decideRecoverySignalIntentGeneration(
      validInput({
        lifecycle: lifecycle({ state: RuntimeWorkerState.EVENT_ADMISSION_ENABLED }),
      }),
    );
    expect(notArmed.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(notArmed.reason).toBe('invalid_lifecycle');

    const sessionMismatch = decideRecoverySignalIntentGeneration(
      validInput({
        evaluation: evaluation({ sessionId: 'other-session' }),
      }),
    );
    expect(sessionMismatch.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(sessionMismatch.reason).toBe('session_mismatch');
  });

  it('rejects non-actionable decisions', () => {
    const result = decideRecoverySignalIntentGeneration(
      validInput({
        evaluation: evaluation({
          decision: {
            kind: EvaluationOutcomeKind.NO_ACTION,
            reason: 'deployment action=hold',
          },
        }),
      }),
    );

    expect(result.outcome).toBe('SIGNAL_GENERATION_BLOCKED');
    expect(result.reason).toBe('decision_not_actionable');
    expect(result.signalIntentGenerated).toBe(false);
  });

  it('is deterministic for identical inputs', () => {
    const input = validInput();
    expect(decideRecoverySignalIntentGeneration(input)).toEqual(
      decideRecoverySignalIntentGeneration(input),
    );
  });
});
