import {
  RuntimeWorkerState,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime';
import { isLeaseExpired } from './session-lease';
import type { TradingSession } from './trading-session';
import {
  RecoveryEventAdmissionOperationalState,
  type EventAdmissionEnabledRuntimeState,
  type RecoveryEventAdmissionResult,
} from './recovery-event-admission';

export const RecoveryRuntimeArmingOperationalState = {
  ARMED: 'ARMED',
} as const;

export type RecoveryRuntimeArmingOperationalState =
  (typeof RecoveryRuntimeArmingOperationalState)[keyof typeof RecoveryRuntimeArmingOperationalState];

export type RecoveryRuntimeArmingOutcome = 'ARMED' | 'ARMING_BLOCKED';

export type RecoveryRuntimeArmingBlockedReason =
  | 'event_admission_not_enabled'
  | 'lease_expired'
  | 'kill_switch_active'
  | 'invalid_lifecycle'
  | 'accepts_ticks_false'
  | 'worker_unhealthy'
  | 'runtime_identity_mismatch'
  | 'recovery_failed'
  | 'already_armed';

export type ArmedRuntimeState = Readonly<{
  operationalState: 'ARMED';
  workerState: typeof RuntimeWorkerState.ARMED;
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

export type RecoveryRuntimeArmingResult = Readonly<{
  outcome: RecoveryRuntimeArmingOutcome;
  reason: 'runtime_armed' | RecoveryRuntimeArmingBlockedReason;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  armedState: ArmedRuntimeState | null;
}>;

/**
 * Pure US246 gate.
 * EVENT_ADMISSION_ENABLED is admission-only; arming authorizes future evaluation
 * without performing any strategy evaluation in this step.
 */
export function decideRecoveryRuntimeArming(input: {
  admission: RecoveryEventAdmissionResult | null;
  session: TradingSession | null;
  lifecycle: RuntimeLifecycleSnapshot | null;
  diagnostics: RuntimeDiagnostics | null;
  killSwitchActive: boolean;
  alreadyArmed: boolean;
  nowIso: string;
}): RecoveryRuntimeArmingResult {
  const { admission } = input;
  const enabledState = admission?.enabledState;
  const base = resultBase(admission, enabledState, input.session);

  if (
    admission === null ||
    admission.outcome !== 'EVENT_ADMISSION_ENABLED' ||
    !isEnabledState(enabledState)
  ) {
    return blocked(base, 'event_admission_not_enabled');
  }
  const confirmedEnabledState = enabledState;
  if (input.alreadyArmed) {
    return blocked(base, 'already_armed');
  }
  if (input.session === null) {
    return blocked(base, 'event_admission_not_enabled');
  }
  if (input.session.status === 'failed') {
    return blocked(base, 'recovery_failed');
  }
  if (
    input.session.lease === null ||
    input.session.lease.fencingToken !== confirmedEnabledState.fencingToken ||
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
    input.lifecycle.state !== RuntimeWorkerState.EVENT_ADMISSION_ENABLED ||
    input.diagnostics.workerState !== RuntimeWorkerState.EVENT_ADMISSION_ENABLED
  ) {
    return blocked(base, 'invalid_lifecycle');
  }
  if (!input.lifecycle.acceptsTicks || !input.diagnostics.acceptsTicks) {
    return blocked(base, 'accepts_ticks_false');
  }
  if (input.lifecycle.draining) {
    return blocked(base, 'worker_unhealthy');
  }
  if (
    input.lifecycle.workspaceId !== confirmedEnabledState.workspaceId ||
    input.lifecycle.sessionId !== confirmedEnabledState.sessionId ||
    input.diagnostics.workspaceId !== confirmedEnabledState.workspaceId ||
    input.diagnostics.sessionId !== confirmedEnabledState.sessionId ||
    input.diagnostics.deploymentId !== confirmedEnabledState.deploymentId ||
    input.diagnostics.lastProcessedEventId !== confirmedEnabledState.checkpointEventId ||
    input.diagnostics.lastProcessedCandleSequence !== confirmedEnabledState.checkpointSequence ||
    input.diagnostics.checkpointVersion !== confirmedEnabledState.checkpointVersion ||
    input.diagnostics.runtimeVersion !== confirmedEnabledState.runtimeVersion
  ) {
    return blocked(base, 'runtime_identity_mismatch');
  }

  return Object.freeze({
    outcome: 'ARMED',
    reason: 'runtime_armed',
    ...base,
    armedState: toArmedState(confirmedEnabledState),
  });
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoveryRuntimeArmingBlockedReason,
): RecoveryRuntimeArmingResult {
  return Object.freeze({
    outcome: 'ARMING_BLOCKED',
    reason,
    ...base,
    armedState: null,
  });
}

function isEnabledState(
  enabledState: EventAdmissionEnabledRuntimeState | null | undefined,
): enabledState is EventAdmissionEnabledRuntimeState {
  return (
    enabledState !== null &&
    enabledState !== undefined &&
    enabledState.operationalState === RecoveryEventAdmissionOperationalState.EVENT_ADMISSION_ENABLED
  );
}

function toArmedState(enabledState: EventAdmissionEnabledRuntimeState): ArmedRuntimeState {
  return Object.freeze({
    operationalState: RecoveryRuntimeArmingOperationalState.ARMED,
    workerState: RuntimeWorkerState.ARMED,
    acceptsTicks: true,
    sessionId: enabledState.sessionId,
    workspaceId: enabledState.workspaceId,
    deploymentId: enabledState.deploymentId,
    fencingToken: enabledState.fencingToken,
    checkpointEventId: enabledState.checkpointEventId,
    checkpointSequence: enabledState.checkpointSequence,
    checkpointVersion: enabledState.checkpointVersion,
    runtimeVersion: enabledState.runtimeVersion,
  });
}

function resultBase(
  admission: RecoveryEventAdmissionResult | null,
  enabledState: EventAdmissionEnabledRuntimeState | null | undefined,
  session: TradingSession | null,
): { sessionId: string; workspaceId: string; deploymentId: string } {
  return {
    sessionId: admission?.sessionId ?? session?.id ?? 'unknown-session',
    workspaceId: admission?.workspaceId ?? session?.workspaceId ?? 'unknown-workspace',
    deploymentId:
      admission?.deploymentId ??
      enabledState?.deploymentId ??
      session?.deploymentId ??
      'unknown-deployment',
  };
}
