import {
  RuntimeWorkerState,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime';
import { isLeaseExpired } from './session-lease';
import type { TradingSession } from './trading-session';
import {
  RecoveryRuntimeOperationalState,
  type ReadyRuntimeState,
  type RecoveryRuntimeResumeResult,
} from './recovery-runtime-resume';

export const RecoveryEventAdmissionOperationalState = {
  EVENT_ADMISSION_ENABLED: 'EVENT_ADMISSION_ENABLED',
} as const;

export type RecoveryEventAdmissionOperationalState =
  (typeof RecoveryEventAdmissionOperationalState)[keyof typeof RecoveryEventAdmissionOperationalState];

export type RecoveryEventAdmissionOutcome = 'EVENT_ADMISSION_ENABLED' | 'ADMISSION_BLOCKED';

export type RecoveryEventAdmissionBlockedReason =
  | 'runtime_not_ready'
  | 'lease_expired'
  | 'kill_switch_active'
  | 'runtime_not_idle'
  | 'runtime_already_accepts_events'
  | 'recovery_failed'
  | 'already_admitted';

export type EventAdmissionEnabledRuntimeState = Readonly<{
  operationalState: 'EVENT_ADMISSION_ENABLED';
  workerState: typeof RuntimeWorkerState.EVENT_ADMISSION_ENABLED;
  acceptsTicks: true;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  fencingToken: number;
  checkpointEventId: string;
  checkpointSequence: number;
  checkpointVersion: number;
  runtimeVersion: string;
}>;

export type RecoveryEventAdmissionResult = Readonly<{
  outcome: RecoveryEventAdmissionOutcome;
  reason: 'event_admission_enabled' | RecoveryEventAdmissionBlockedReason;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  enabledState: EventAdmissionEnabledRuntimeState | null;
}>;

/**
 * Pure US245 gate.
 * READY is a recovery-local state; event admission makes the runtime externally
 * reachable for semantic market events only.
 */
export function decideRecoveryEventAdmission(input: {
  ready: RecoveryRuntimeResumeResult | null;
  session: TradingSession | null;
  lifecycle: RuntimeLifecycleSnapshot | null;
  diagnostics: RuntimeDiagnostics | null;
  killSwitchActive: boolean;
  alreadyAdmitted: boolean;
  nowIso: string;
}): RecoveryEventAdmissionResult {
  const { ready } = input;
  const readyState = ready?.readyState;
  const base = resultBase(ready, readyState, input.session);

  if (ready === null || ready.outcome !== 'READY' || !isReadyState(readyState)) {
    return blocked(base, 'runtime_not_ready');
  }
  const confirmedReadyState = readyState;
  if (input.alreadyAdmitted) {
    return blocked(base, 'already_admitted');
  }
  if (input.session === null) {
    return blocked(base, 'runtime_not_ready');
  }
  if (input.session.status === 'failed') {
    return blocked(base, 'recovery_failed');
  }
  if (
    input.session.lease === null ||
    input.session.lease.fencingToken !== confirmedReadyState.fencingToken ||
    isLeaseExpired(input.session.lease, input.nowIso)
  ) {
    return blocked(base, 'lease_expired');
  }
  if (input.killSwitchActive) {
    return blocked(base, 'kill_switch_active');
  }
  if (
    input.lifecycle === null ||
    input.diagnostics === null ||
    input.lifecycle.state !== RuntimeWorkerState.IDLE ||
    input.diagnostics.workerState !== RuntimeWorkerState.IDLE
  ) {
    return blocked(base, 'runtime_not_idle');
  }
  if (input.lifecycle.acceptsTicks || input.diagnostics.acceptsTicks) {
    return blocked(base, 'runtime_already_accepts_events');
  }
  if (
    input.lifecycle.workspaceId !== confirmedReadyState.workspaceId ||
    input.lifecycle.sessionId !== confirmedReadyState.sessionId ||
    input.diagnostics.workspaceId !== confirmedReadyState.workspaceId ||
    input.diagnostics.sessionId !== confirmedReadyState.sessionId ||
    input.diagnostics.deploymentId !== confirmedReadyState.deploymentId ||
    input.diagnostics.lastProcessedEventId !== confirmedReadyState.checkpointEventId ||
    input.diagnostics.lastProcessedCandleSequence !== confirmedReadyState.checkpointSequence ||
    input.diagnostics.checkpointVersion !== confirmedReadyState.checkpointVersion ||
    input.diagnostics.runtimeVersion !== confirmedReadyState.runtimeVersion
  ) {
    return blocked(base, 'runtime_not_ready');
  }

  return Object.freeze({
    outcome: 'EVENT_ADMISSION_ENABLED',
    reason: 'event_admission_enabled',
    ...base,
    enabledState: toEnabledState(confirmedReadyState),
  });
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoveryEventAdmissionBlockedReason,
): RecoveryEventAdmissionResult {
  return Object.freeze({
    outcome: 'ADMISSION_BLOCKED',
    reason,
    ...base,
    enabledState: null,
  });
}

function isReadyState(
  readyState: ReadyRuntimeState | null | undefined,
): readyState is ReadyRuntimeState {
  return (
    readyState !== null &&
    readyState !== undefined &&
    readyState.operationalState === RecoveryRuntimeOperationalState.READY
  );
}

function toEnabledState(readyState: ReadyRuntimeState): EventAdmissionEnabledRuntimeState {
  return Object.freeze({
    operationalState: RecoveryEventAdmissionOperationalState.EVENT_ADMISSION_ENABLED,
    workerState: RuntimeWorkerState.EVENT_ADMISSION_ENABLED,
    acceptsTicks: true,
    sessionId: readyState.sessionId,
    workspaceId: readyState.workspaceId,
    deploymentId: readyState.deploymentId,
    fencingToken: readyState.fencingToken,
    checkpointEventId: readyState.checkpointEventId,
    checkpointSequence: readyState.checkpointSequence,
    checkpointVersion: readyState.checkpointVersion,
    runtimeVersion: readyState.runtimeVersion,
  });
}

function resultBase(
  ready: RecoveryRuntimeResumeResult | null,
  readyState: ReadyRuntimeState | null | undefined,
  session: TradingSession | null,
): { sessionId: string; workspaceId: string; deploymentId: string } {
  return {
    sessionId: ready?.sessionId ?? session?.id ?? 'unknown-session',
    workspaceId: ready?.workspaceId ?? session?.workspaceId ?? 'unknown-workspace',
    deploymentId:
      ready?.deploymentId ??
      readyState?.deploymentId ??
      session?.deploymentId ??
      'unknown-deployment',
  };
}
