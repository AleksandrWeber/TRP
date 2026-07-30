import type {
  RuntimeContext,
  RuntimeDiagnostics,
} from '../../strategy-runtime/domain/runtime-context';
import {
  RuntimeWorkerState,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime/domain/runtime-lifecycle';
import type { RecoveryCheckpointValidationResult } from './recovery-checkpoint-validation';
import type { RecoveryLeaseAcquisitionResult } from './recovery-lease-acquisition';
import type { RecoveryStateReconciliationResult } from './recovery-state-reconciliation';

export const RecoveryRuntimeOperationalState = {
  READY: 'READY',
} as const;

export type RecoveryRuntimeOperationalState =
  (typeof RecoveryRuntimeOperationalState)[keyof typeof RecoveryRuntimeOperationalState];

export type RecoveryRuntimeResumeOutcome = 'READY' | 'RESUME_BLOCKED';

export type RecoveryRuntimeResumeBlockedReason =
  | 'lease_not_acquired'
  | 'checkpoint_not_valid'
  | 'reconciliation_failed'
  | 'runtime_not_idle'
  | 'runtime_accepts_ticks'
  | 'context_checkpoint_mismatch'
  | 'already_resumed';

export type ReadyRuntimeState = Readonly<{
  operationalState: 'READY';
  workerState: RuntimeWorkerState;
  acceptsTicks: false;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  fencingToken: number;
  checkpointEventId: string;
  checkpointSequence: number;
  checkpointVersion: number;
  runtimeVersion: string;
}>;

export type RecoveryRuntimeResumeResult = Readonly<{
  outcome: RecoveryRuntimeResumeOutcome;
  reason: 'ready' | RecoveryRuntimeResumeBlockedReason;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  readyState: ReadyRuntimeState | null;
}>;

/**
 * Pure US244 gate.
 * Runtime may become recovery-READY only after lease + checkpoint + reconcile,
 * while the worker remains IDLE and rejects external work.
 */
export function decideRecoveryRuntimeResume(input: {
  lease: RecoveryLeaseAcquisitionResult;
  checkpoint: RecoveryCheckpointValidationResult;
  reconciliation: RecoveryStateReconciliationResult;
  context: RuntimeContext;
  lifecycle: RuntimeLifecycleSnapshot;
  diagnostics: RuntimeDiagnostics;
  alreadyResumed: boolean;
}): RecoveryRuntimeResumeResult {
  const { lease, checkpoint, reconciliation, context, lifecycle, diagnostics, alreadyResumed } =
    input;

  const base = {
    sessionId: lease.sessionId,
    workspaceId: lease.workspaceId,
    deploymentId: checkpoint.deploymentId,
  };

  if (alreadyResumed) {
    return blocked(base, 'already_resumed');
  }
  if (lease.outcome !== 'LEASE_ACQUIRED' || lease.fencingToken === null) {
    return blocked(base, 'lease_not_acquired');
  }
  if (checkpoint.outcome !== 'VALID_CHECKPOINT' || checkpoint.checkpoint === null) {
    return blocked(base, 'checkpoint_not_valid');
  }
  if (reconciliation.outcome !== 'RECONCILED') {
    return blocked(base, 'reconciliation_failed');
  }
  if (lifecycle.state !== RuntimeWorkerState.IDLE) {
    return blocked(base, 'runtime_not_idle');
  }
  if (lifecycle.acceptsTicks || diagnostics.acceptsTicks) {
    return blocked(base, 'runtime_accepts_ticks');
  }
  if (
    context.workspaceId !== lease.workspaceId ||
    context.sessionId !== lease.sessionId ||
    context.deploymentId !== checkpoint.deploymentId ||
    context.checkpoint?.lastProcessedEventId !== checkpoint.checkpoint.lastProcessedEventId ||
    context.checkpoint?.lastProcessedCandle.sequence !== checkpoint.checkpoint.sequence ||
    diagnostics.lastProcessedEventId !== checkpoint.checkpoint.lastProcessedEventId ||
    diagnostics.lastProcessedCandleSequence !== checkpoint.checkpoint.sequence ||
    diagnostics.workerState !== RuntimeWorkerState.IDLE
  ) {
    return blocked(base, 'context_checkpoint_mismatch');
  }

  return Object.freeze({
    outcome: 'READY',
    reason: 'ready',
    ...base,
    readyState: Object.freeze({
      operationalState: RecoveryRuntimeOperationalState.READY,
      workerState: RuntimeWorkerState.IDLE,
      acceptsTicks: false,
      sessionId: lease.sessionId,
      workspaceId: lease.workspaceId,
      deploymentId: checkpoint.deploymentId,
      fencingToken: lease.fencingToken,
      checkpointEventId: checkpoint.checkpoint.lastProcessedEventId,
      checkpointSequence: checkpoint.checkpoint.sequence,
      checkpointVersion: checkpoint.checkpoint.version,
      runtimeVersion: context.runtimeVersion,
    }),
  });
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoveryRuntimeResumeBlockedReason,
): RecoveryRuntimeResumeResult {
  return Object.freeze({
    outcome: 'RESUME_BLOCKED',
    reason,
    ...base,
    readyState: null,
  });
}
