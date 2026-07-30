export { StrategyRuntimeModule } from './strategy-runtime.module';
export { StrategyRuntimeService } from './strategy-runtime.service';
export {
  STRATEGY_RUNTIME_PORT,
  type AdmitTickCommand,
  type LoadRuntimeContextQuery,
  type StrategyRuntimePort,
} from './ports/strategy-runtime.port';
export {
  CLOSED_CANDLE_TICK_EVENT_TYPE,
  createClosedCandleTickEvent,
  isClosedCandleTickEventType,
  type ClosedCandleTickEvent,
  type ClosedCandleTickEventInput,
} from './domain/closed-candle-tick';
export {
  RUNTIME_LEASE_SESSION_STATUS_RUNNING,
  assertRuntimeLeaseValid,
  createRuntimeLeaseProof,
  type RuntimeLeaseProof,
  type RuntimeLeaseProofInput,
} from './domain/runtime-lease-proof';
export {
  TickAdmissionStatus,
  admitClosedCandleTick,
  type AdmitClosedCandleTickInput,
  type TickAdmissionResult,
} from './domain/tick-admission';
export {
  createEvaluationCandle,
  candleMatchesDeployment,
  type EvaluationCandle,
  type EvaluationCandleInput,
} from './domain/evaluation-candle';
export {
  EvaluationOutcomeKind,
  decideRuntimeEvaluation,
  type EvaluationDecision,
  type NoActionEvaluationDecision,
  type SignalIntentEvaluationDecision,
} from './domain/runtime-evaluation';
export {
  EvaluationStatus,
  evaluationAlreadyProcessed,
  evaluationCompleted,
  evaluationNotAdmitted,
  evaluationRejectedLifecycle,
  type EvaluationResult,
} from './domain/evaluation-result';
export {
  RuntimeWorkerState,
  acceptsTicks,
  acceptsEvaluation,
  createLifecycleSnapshot,
  type RuntimeLifecycleResult,
  type RuntimeLifecycleSnapshot,
} from './domain/runtime-lifecycle';
export {
  RuntimeLifecycleCoordinator,
  type RuntimeLifecycleCommand,
} from './runtime-lifecycle.coordinator';
export { RuntimeEvaluationService, type EvaluateTickCommand } from './runtime-evaluation.service';
export {
  SignalIntentService,
  type EmitSignalIntentCommand,
  type EmitSignalIntentResult,
} from './signal-intent.service';
export {
  StrategyCheckpointService,
  type SaveStrategyCheckpointCommand,
  type SaveStrategyCheckpointResult,
} from './strategy-checkpoint.service';
export {
  SIGNAL_INTENT_SCHEMA_VERSION,
  SignalIntentDirection,
  createSignalIntent,
  isSignalIntentDirection,
  stableStringify,
  type CreateSignalIntentInput,
  type SignalIntent,
  type SignalIntentMarketCheckpoint,
  type SignalIntentMetadata,
} from './domain/signal-intent';
export {
  STRATEGY_CHECKPOINT_SCHEMA_VERSION,
  STRATEGY_RUNTIME_VERSION,
  advanceStrategyCheckpoint,
  createStrategyCheckpoint,
  deterministicCheckpointId,
  sameProgress,
  type AdvanceStrategyCheckpointInput,
  type CreateStrategyCheckpointInput,
  type LastProcessedCandle,
  type StrategyCheckpoint,
} from './domain/strategy-checkpoint';
export {
  createRuntimeContext,
  createRuntimeDiagnostics,
  type CreateRuntimeContextInput,
  type RuntimeContext,
  type RuntimeDiagnostics,
} from './domain/runtime-context';
export {
  SIGNAL_INTENT_REPOSITORY,
  type SignalIntentRepository,
} from './persistence/signal-intent.repository';
export {
  STRATEGY_CHECKPOINT_REPOSITORY,
  type StrategyCheckpointRepository,
} from './persistence/strategy-checkpoint.repository';
