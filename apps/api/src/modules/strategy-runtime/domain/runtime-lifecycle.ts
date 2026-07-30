/**
 * Operational Strategy Runtime worker states (US220 / ADR-014).
 * Derived under Session authority — must not outrank Session status or lease.
 */
export const RuntimeWorkerState = {
  IDLE: 'IDLE',
  EVENT_ADMISSION_ENABLED: 'EVENT_ADMISSION_ENABLED',
  ARMED: 'ARMED',
  EVALUATING: 'EVALUATING',
  DRAINING: 'DRAINING',
} as const;

export type RuntimeWorkerState = (typeof RuntimeWorkerState)[keyof typeof RuntimeWorkerState];

export type RuntimeLifecycleSnapshot = Readonly<{
  workspaceId: string;
  sessionId: string;
  state: RuntimeWorkerState;
  fencingToken: number | null;
  acceptsTicks: boolean;
  draining: boolean;
}>;

export type RuntimeLifecycleResult = Readonly<{
  workspaceId: string;
  sessionId: string;
  fromState: RuntimeWorkerState;
  toState: RuntimeWorkerState;
  drained: boolean;
  reason: string;
}>;

export function acceptsTicks(state: RuntimeWorkerState): boolean {
  return state === RuntimeWorkerState.EVENT_ADMISSION_ENABLED || state === RuntimeWorkerState.ARMED;
}

export function isDraining(state: RuntimeWorkerState): boolean {
  return state === RuntimeWorkerState.DRAINING;
}

export function acceptsEvaluation(state: RuntimeWorkerState): boolean {
  return state === RuntimeWorkerState.ARMED;
}

export function createLifecycleSnapshot(input: {
  workspaceId: string;
  sessionId: string;
  state: RuntimeWorkerState;
  fencingToken: number | null;
}): RuntimeLifecycleSnapshot {
  return Object.freeze({
    workspaceId: required(input.workspaceId, 'workspace id'),
    sessionId: required(input.sessionId, 'session id'),
    state: input.state,
    fencingToken: input.fencingToken,
    acceptsTicks: acceptsTicks(input.state),
    draining: isDraining(input.state),
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
