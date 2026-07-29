import { StrategyDeploymentStatus, type StrategyDeployment } from '../../strategy-deployment';
import { STRATEGY_RUNTIME_VERSION, type StrategyCheckpoint } from './strategy-checkpoint';
import { RuntimeWorkerState, type RuntimeWorkerState as WorkerState } from './runtime-lifecycle';

/**
 * Immutable Strategy Runtime evaluation context (US216 / ADR-017).
 * Binds approved Deployment + optional Checkpoint for a session id reference.
 * Does not own Trading Session lifecycle, leases, Orders, Risk, or Execution.
 */
export type RuntimeContext = Readonly<{
  workspaceId: string;
  /** Opaque session identity reference — Runtime does not own Session state. */
  sessionId: string;
  deploymentId: string;
  deployment: StrategyDeployment;
  checkpoint: StrategyCheckpoint | null;
  runtimeVersion: string;
}>;

export type CreateRuntimeContextInput = Readonly<{
  workspaceId: string;
  sessionId: string;
  deployment: StrategyDeployment;
  checkpoint?: StrategyCheckpoint | null;
  runtimeVersion?: string;
}>;

export function createRuntimeContext(input: CreateRuntimeContextInput): RuntimeContext {
  const workspaceId = required(input.workspaceId, 'workspace id');
  const sessionId = required(input.sessionId, 'session id');
  const deployment = input.deployment;
  if (!deployment || typeof deployment !== 'object') {
    throw new Error('deployment is required');
  }
  if (deployment.workspaceId !== workspaceId) {
    throw new Error('deployment workspace must match runtime context workspace');
  }
  if (deployment.status !== StrategyDeploymentStatus.APPROVED) {
    throw new Error('runtime context requires an approved strategy deployment');
  }
  const checkpoint = input.checkpoint ?? null;
  if (checkpoint !== null) {
    if (checkpoint.workspaceId !== workspaceId) {
      throw new Error('checkpoint workspace must match runtime context workspace');
    }
    if (checkpoint.sessionId !== sessionId) {
      throw new Error('checkpoint session must match runtime context session');
    }
    if (checkpoint.deploymentId !== deployment.id) {
      throw new Error('checkpoint deployment must match runtime context deployment');
    }
  }

  return Object.freeze({
    workspaceId,
    sessionId,
    deploymentId: deployment.id,
    deployment,
    checkpoint,
    runtimeVersion: required(input.runtimeVersion ?? STRATEGY_RUNTIME_VERSION, 'runtime version'),
  });
}

/**
 * Read-only Runtime diagnostics shell (US216 / US219 / US220).
 */
export type RuntimeDiagnostics = Readonly<{
  workspaceId: string;
  sessionId: string;
  deploymentId: string | null;
  checkpointVersion: number | null;
  lastProcessedEventId: string | null;
  lastProcessedCandleSequence: number | null;
  runtimeVersion: string;
  /** True once Runtime evaluation pipeline is available (US219). */
  evaluationEnabled: true;
  /** Operational worker state under Session authority (US220). */
  workerState: WorkerState;
  acceptsTicks: boolean;
}>;

export function createRuntimeDiagnostics(input: {
  workspaceId: string;
  sessionId: string;
  checkpoint: StrategyCheckpoint | null;
  workerState?: WorkerState;
  acceptsTicks?: boolean;
}): RuntimeDiagnostics {
  const checkpoint = input.checkpoint;
  const workerState = input.workerState ?? RuntimeWorkerState.IDLE;
  return Object.freeze({
    workspaceId: required(input.workspaceId, 'workspace id'),
    sessionId: required(input.sessionId, 'session id'),
    deploymentId: checkpoint?.deploymentId ?? null,
    checkpointVersion: checkpoint?.version ?? null,
    lastProcessedEventId: checkpoint?.lastProcessedEventId ?? null,
    lastProcessedCandleSequence: checkpoint?.lastProcessedCandle.sequence ?? null,
    runtimeVersion: checkpoint?.runtimeVersion ?? STRATEGY_RUNTIME_VERSION,
    evaluationEnabled: true,
    workerState,
    acceptsTicks: input.acceptsTicks ?? workerState === RuntimeWorkerState.ARMED,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
