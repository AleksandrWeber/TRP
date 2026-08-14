import type { EmitSignalIntentCommand, EmitSignalIntentResult } from '../signal-intent.service';
import type {
  SaveStrategyCheckpointCommand,
  SaveStrategyCheckpointResult,
} from '../strategy-checkpoint.service';
import type { ClosedCandleTickEventInput } from '../domain/closed-candle-tick';
import type { EvaluationResult } from '../domain/evaluation-result';
import type { RuntimeLifecycleResult, RuntimeLifecycleSnapshot } from '../domain/runtime-lifecycle';
import type { RuntimeLeaseProofInput } from '../domain/runtime-lease-proof';
import type { SignalIntent } from '../domain/signal-intent';
import type { StrategyCheckpoint } from '../domain/strategy-checkpoint';
import type { RuntimeContext, RuntimeDiagnostics } from '../domain/runtime-context';
import type { TickAdmissionResult } from '../domain/tick-admission';
import type { EvaluateTickCommand } from '../runtime-evaluation.service';
import type { RuntimeLifecycleCommand } from '../runtime-lifecycle.coordinator';

export const STRATEGY_RUNTIME_PORT = Symbol('STRATEGY_RUNTIME_PORT');

export type LoadRuntimeContextQuery = Readonly<{
  workspaceId: string;
  sessionId: string;
  deploymentId: string;
  /** Optional; defaults to Deployment / Binance Exchange Scope. */
  exchangeScopeId?: string;
}>;

/**
 * Semantic closed-candle tick admission command (US218).
 * Caller supplies Session lease proof; Runtime does not own Session state.
 */
export type AdmitTickCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  event: ClosedCandleTickEventInput;
  lease: RuntimeLeaseProofInput;
  nowIso: string;
}>;

/**
 * Public Strategy Runtime application port (US216–US220 / ADR-017).
 * Trading Session and future workers depend on this boundary — never on
 * Orders, Risk, Execution, or Runtime persistence internals.
 */
export interface StrategyRuntimePort {
  loadContext(query: LoadRuntimeContextQuery): Promise<RuntimeContext>;

  getDiagnostics(workspaceId: string, sessionId: string): Promise<RuntimeDiagnostics>;

  getLifecycle(workspaceId: string, sessionId: string): Promise<RuntimeLifecycleSnapshot>;

  /** Arm Runtime after Session reaches RUNNING (US220). */
  arm(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult>;

  /** Drain in-flight evaluation and stop accepting ticks (US220). */
  pause(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult>;

  /** Re-arm Runtime after Session resumes RUNNING (US220). */
  resume(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult>;

  /**
   * Enable external semantic event admission after recovery READY.
   * Does not enable strategy evaluation.
   */
  enableEventAdmission(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult>;

  /** Lease-aware shutdown: drain then IDLE (US220). */
  stop(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult>;

  /**
   * Admit a semantic closed-candle tick under a valid Session lease.
   * Rejected when Runtime is not admission-enabled.
   */
  admitTick(command: AdmitTickCommand): Promise<TickAdmissionResult>;

  /**
   * Evaluate an admitted closed-candle tick → Signal Intent | NO_ACTION.
   * Commits Intent (when actionable) + Checkpoint + Outbox atomically.
   * Rejected when Runtime is not ARMED.
   */
  evaluate(command: EvaluateTickCommand): Promise<EvaluationResult>;

  emitSignalIntent(command: EmitSignalIntentCommand): Promise<EmitSignalIntentResult>;

  listSignalIntents(workspaceId: string, sessionId: string): Promise<SignalIntent[]>;

  saveCheckpoint(command: SaveStrategyCheckpointCommand): Promise<SaveStrategyCheckpointResult>;

  loadCheckpoint(workspaceId: string, sessionId: string): Promise<StrategyCheckpoint | null>;
}
