import { describe, expect, it } from 'vitest';
import type {
  RuntimeContext,
  RuntimeDiagnostics,
} from '../../strategy-runtime/domain/runtime-context';
import {
  RuntimeWorkerState,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime/domain/runtime-lifecycle';
import {
  RecoveryRuntimeOperationalState,
  decideRecoveryRuntimeResume,
} from './recovery-runtime-resume';
import type { RecoveryCheckpointValidationResult } from './recovery-checkpoint-validation';
import type { RecoveryLeaseAcquisitionResult } from './recovery-lease-acquisition';
import type { RecoveryStateReconciliationResult } from './recovery-state-reconciliation';

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

function context(): RuntimeContext {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    exchangeScopeId: 'exchange-scope:binance',
    deploymentId: 'deployment-1',
    deployment: {
      id: 'deployment-1',
      workspaceId: 'ws-1',
      status: 'APPROVED',
    } as never,
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
  };
}

function lifecycle(overrides: Partial<RuntimeLifecycleSnapshot> = {}): RuntimeLifecycleSnapshot {
  return {
    workspaceId: 'ws-1',
    sessionId: 'session-1',
    state: RuntimeWorkerState.IDLE,
    fencingToken: null,
    acceptsTicks: false,
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
    workerState: RuntimeWorkerState.IDLE,
    acceptsTicks: false,
    ...overrides,
  };
}

describe('US244 — recovery runtime resume (pure)', () => {
  it('returns READY when all recovery preconditions succeeded', () => {
    const result = decideRecoveryRuntimeResume({
      lease: lease(),
      checkpoint: checkpoint(),
      reconciliation: reconciled(),
      context: context(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      alreadyResumed: false,
    });

    expect(result.outcome).toBe('READY');
    expect(result.readyState).toEqual({
      operationalState: RecoveryRuntimeOperationalState.READY,
      workerState: RuntimeWorkerState.IDLE,
      acceptsTicks: false,
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

  it('blocks invalid recovery preconditions', () => {
    expect(
      decideRecoveryRuntimeResume({
        lease: {
          ...lease(),
          outcome: 'LEASE_DENIED',
          fencingToken: null,
          expiresAt: null,
          reason: 'active_foreign_lease',
        },
        checkpoint: checkpoint(),
        reconciliation: reconciled(),
        context: context(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        alreadyResumed: false,
      }).reason,
    ).toBe('lease_not_acquired');

    expect(
      decideRecoveryRuntimeResume({
        lease: lease(),
        checkpoint: {
          ...checkpoint(),
          outcome: 'NO_CHECKPOINT',
          checkpoint: null,
          reason: 'absent',
        },
        reconciliation: reconciled(),
        context: context(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        alreadyResumed: false,
      }).reason,
    ).toBe('checkpoint_not_valid');

    expect(
      decideRecoveryRuntimeResume({
        lease: lease(),
        checkpoint: checkpoint(),
        reconciliation: {
          ...reconciled(),
          outcome: 'RECONCILIATION_FAILED',
          failedContext: 'accounting',
          reason: 'mismatch',
          mismatches: ['accounting:mismatch'],
        },
        context: context(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics(),
        alreadyResumed: false,
      }).reason,
    ).toBe('reconciliation_failed');
  });

  it('prevents duplicate resume', () => {
    const result = decideRecoveryRuntimeResume({
      lease: lease(),
      checkpoint: checkpoint(),
      reconciliation: reconciled(),
      context: context(),
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      alreadyResumed: true,
    });
    expect(result.outcome).toBe('RESUME_BLOCKED');
    expect(result.reason).toBe('already_resumed');
  });

  it('requires runtime to remain idle and reject external work', () => {
    expect(
      decideRecoveryRuntimeResume({
        lease: lease(),
        checkpoint: checkpoint(),
        reconciliation: reconciled(),
        context: context(),
        lifecycle: lifecycle({ state: RuntimeWorkerState.ARMED, acceptsTicks: true }),
        diagnostics: diagnostics(),
        alreadyResumed: false,
      }).reason,
    ).toBe('runtime_not_idle');

    expect(
      decideRecoveryRuntimeResume({
        lease: lease(),
        checkpoint: checkpoint(),
        reconciliation: reconciled(),
        context: context(),
        lifecycle: lifecycle(),
        diagnostics: diagnostics({ acceptsTicks: true }),
        alreadyResumed: false,
      }).reason,
    ).toBe('runtime_accepts_ticks');
  });

  it('requires hydrated runtime state to match the validated checkpoint', () => {
    const mismatchedContext = {
      ...context(),
      checkpoint: {
        ...context().checkpoint!,
        lastProcessedEventId: 'evt-9',
      },
    };
    const result = decideRecoveryRuntimeResume({
      lease: lease(),
      checkpoint: checkpoint(),
      reconciliation: reconciled(),
      context: mismatchedContext,
      lifecycle: lifecycle(),
      diagnostics: diagnostics(),
      alreadyResumed: false,
    });
    expect(result.outcome).toBe('RESUME_BLOCKED');
    expect(result.reason).toBe('context_checkpoint_mismatch');
  });
});
