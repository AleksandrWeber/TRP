import { describe, expect, it } from 'vitest';
import {
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  SignalIntentDirection,
} from '../../strategy-runtime';
import {
  decideRecoveryCompletion,
  type RecoveryPipelineStageSnapshot,
} from './recovery-completion';
import { TradingSessionStatus } from './trading-session-status';
import { createTradingSession, transitionSession, attachLease } from './trading-session';
import { createSessionLease } from './session-lease';

const at = '2026-07-30T20:00:00.000Z';
const earlier = '2026-07-30T19:00:00.000Z';

function recoveringSession() {
  let session = createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: 'idem-complete-1',
    createdAt: earlier,
    recordedAt: earlier,
  });
  session = transitionSession(session, TradingSessionStatus.STARTING, earlier);
  session = transitionSession(session, TradingSessionStatus.RUNNING, earlier);
  session = transitionSession(session, TradingSessionStatus.RECOVERING, earlier);
  session = attachLease(
    session,
    createSessionLease({
      ownerId: 'runtime-a',
      previousToken: 3,
      acquiredAt: earlier,
      expiresAt: '2026-07-30T20:05:00.000Z',
    }),
  );
  return session;
}

function completeStages(
  overrides: Partial<RecoveryPipelineStageSnapshot> = {},
): RecoveryPipelineStageSnapshot {
  return {
    discovery: {
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: {
        sessionId: 'session-1',
        workspaceId: 'ws-1',
        deploymentId: 'deployment-1',
        status: TradingSessionStatus.RUNNING,
        createdAt: earlier,
      },
      eligibleSessionIds: ['session-1'],
      recoveringOpen: null,
    },
    lease: {
      outcome: 'LEASE_ACQUIRED',
      reason: 'missing_lease',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      ownerId: 'runtime-a',
      fencingToken: 4,
      expiresAt: '2026-07-30T20:05:00.000Z',
    },
    checkpoint: {
      outcome: 'VALID_CHECKPOINT',
      reason: 'valid',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      checkpoint: null,
    } as never,
    reconcile: {
      outcome: 'RECONCILED',
      reason: 'consistent',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
    } as never,
    resume: {
      outcome: 'READY',
      reason: 'runtime_ready',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      readyState: null,
    } as never,
    admission: {
      outcome: 'EVENT_ADMISSION_ENABLED',
      reason: 'event_admission_enabled',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      enabledState: null,
    } as never,
    arming: {
      outcome: 'ARMED',
      reason: 'runtime_armed',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      armedState: null,
    } as never,
    evaluation: {
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
      restoredContext: null,
      eventId: 'evt-11',
      signalIntentEmitted: false,
      orderCreated: false,
    },
    signalIntent: {
      outcome: 'SIGNAL_INTENT_GENERATED',
      reason: 'signal_intent_generated',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-1',
      eventId: 'evt-11',
      decision: {
        kind: EvaluationOutcomeKind.SIGNAL_INTENT,
        direction: SignalIntentDirection.BUY,
        confidence: 0.8,
        reason: 'deployment action=buy',
      },
      plan: null,
      restoredContext: null,
      signalIntentGenerated: true,
      orderCreated: false,
    },
    ...overrides,
  };
}

function lifecycle(overrides: Record<string, unknown> = {}) {
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

describe('US249 — recovery completion (pure)', () => {
  it('completes recovery, exits RECOVERING, and releases the lease', () => {
    const session = recoveringSession();
    const result = decideRecoveryCompletion({
      session,
      stages: completeStages(),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETED');
    expect(result.terminalCause).toBe('SIGNAL_INTENT_GENERATED');
    expect(result.fromStatus).toBe(TradingSessionStatus.RECOVERING);
    expect(result.toStatus).toBe(TradingSessionStatus.RUNNING);
    expect(result.nextSession?.status).toBe(TradingSessionStatus.RUNNING);
    expect(result.nextSession?.lease).toBeNull();
    expect(result.fencingTokenReleased).toBe(4);
    expect(result.ownerIdReleased).toBe('runtime-a');
    expect(result.orderCreated).toBe(false);
    expect(result.runtimeRemainsOperational).toBe(true);
  });

  it('accepts non-actionable evaluation as a terminal cause', () => {
    const result = decideRecoveryCompletion({
      session: recoveringSession(),
      stages: completeStages({
        evaluation: {
          outcome: 'EVALUATED',
          reason: 'strategy_evaluated',
          sessionId: 'session-1',
          workspaceId: 'ws-1',
          deploymentId: 'deployment-1',
          decision: {
            kind: EvaluationOutcomeKind.NO_ACTION,
            reason: 'deployment action=hold',
          },
          restoredContext: null,
          eventId: 'evt-11',
          signalIntentEmitted: false,
          orderCreated: false,
        },
        signalIntent: null,
      }),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETED');
    expect(result.terminalCause).toBe('EVALUATED_NON_ACTIONABLE');
  });

  it('blocks duplicate completion', () => {
    const result = decideRecoveryCompletion({
      session: recoveringSession(),
      stages: completeStages(),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: true,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('already_completed');
    expect(result.nextSession).toBeNull();
  });

  it('blocks invalid Session lifecycle', () => {
    let session = recoveringSession();
    session = transitionSession(session, TradingSessionStatus.RUNNING, at);

    const result = decideRecoveryCompletion({
      session,
      stages: completeStages(),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('invalid_lifecycle');
  });

  it('blocks lease mismatch', () => {
    const result = decideRecoveryCompletion({
      session: recoveringSession(),
      stages: completeStages({
        lease: {
          outcome: 'LEASE_ACQUIRED',
          reason: 'missing_lease',
          sessionId: 'session-1',
          workspaceId: 'ws-1',
          ownerId: 'other-runtime',
          fencingToken: 99,
          expiresAt: '2026-07-30T20:05:00.000Z',
        },
      }),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('lease_mismatch');
  });

  it('blocks unfinished Recovery stages', () => {
    const result = decideRecoveryCompletion({
      session: recoveringSession(),
      stages: completeStages({
        reconcile: {
          outcome: 'RECONCILIATION_FAILED',
          reason: 'accounting_mismatch',
          sessionId: 'session-1',
          workspaceId: 'ws-1',
          deploymentId: 'deployment-1',
        } as never,
      }),
      lifecycle: lifecycle(),
      controlledTermination: true,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETION_BLOCKED');
    expect(result.reason).toBe('unfinished_recovery_stage');
    expect(result.unfinishedStage).toBe('reconcile');
  });

  it('accepts already-converted SignalIntent as terminal evidence', () => {
    const result = decideRecoveryCompletion({
      session: recoveringSession(),
      stages: completeStages({
        signalIntent: {
          outcome: 'SIGNAL_GENERATION_BLOCKED',
          reason: 'decision_already_converted',
          sessionId: 'session-1',
          workspaceId: 'ws-1',
          deploymentId: 'deployment-1',
          eventId: 'evt-11',
          decision: {
            kind: EvaluationOutcomeKind.SIGNAL_INTENT,
            direction: SignalIntentDirection.BUY,
            confidence: 0.8,
            reason: 'deployment action=buy',
          },
          plan: null,
          restoredContext: null,
          signalIntentGenerated: false,
          orderCreated: false,
        },
      }),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      alreadyCompleted: false,
    });

    expect(result.outcome).toBe('RECOVERY_COMPLETED');
    expect(result.terminalCause).toBe('SIGNAL_INTENT_GENERATED');
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      session: recoveringSession(),
      stages: completeStages(),
      lifecycle: lifecycle(),
      controlledTermination: false,
      resumeIntent: TradingSessionStatus.RUNNING as const,
      recordedAt: at,
      alreadyCompleted: false,
    };
    expect(decideRecoveryCompletion(input)).toEqual(decideRecoveryCompletion(input));
  });
});
