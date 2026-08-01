export { TradingSessionModule } from './trading-session.module';
export { TradingSessionService } from './trading-session.service';
export { StartupRecoveryDiscoveryService } from './recovery/startup-recovery-discovery.service';
export {
  RecoveryLeaseAcquisitionService,
  resolveRecoveryRuntimeOwnerId,
} from './recovery/recovery-lease-acquisition.service';
export { RecoveryCheckpointValidationService } from './recovery/recovery-checkpoint-validation.service';
export { RecoveryRuntimeResumeService } from './recovery/recovery-runtime-resume.service';
export { RecoveryEventAdmissionService } from './recovery/recovery-event-admission.service';
export { RecoveryRuntimeArmingService } from './recovery/recovery-runtime-arming.service';
export {
  RecoveryStrategyEvaluationService,
  type RecoveryStrategyEvaluateCommand,
} from './recovery/recovery-strategy-evaluation.service';
export {
  RecoverySignalIntentGenerationService,
  type RecoverySignalIntentGenerateCommand,
  type RecoverySignalIntentGenerateResult,
} from './recovery/recovery-signal-intent-generation.service';
export {
  RecoveryCompletionService,
  type RecoveryCompleteCommand,
  type RecoveryCompleteResult,
} from './recovery/recovery-completion.service';
export { RecoveryStateReconciliationService } from './recovery/recovery-state-reconciliation.service';
export {
  RECOVERY_EVENT_ADMISSION_POLICY,
  InactiveRecoveryEventAdmissionPolicy,
  type RecoveryEventAdmissionPolicy,
} from './ports/recovery-event-admission-policy.port';
export {
  RECOVERY_RECONCILIATION_PORTS,
  StubRecoveryReconciliationPorts,
  type RecoveryAccountingSnapshot,
  type RecoveryExecutionSnapshot,
  type RecoveryOrderSnapshot,
  type RecoveryReconciliationPorts,
  type RecoveryRiskSnapshot,
  type RecoveryRuntimeIntentSnapshot,
} from './ports/recovery-reconciliation.ports';
export type {
  CreateTradingSessionCommand,
  SessionLifecycleCommand,
} from './trading-session.service';
export {
  RECOVERY_ELIGIBLE_SESSION_STATUSES,
  RECOVERY_INELIGIBLE_TERMINAL_STATUSES,
  isRecoveryEligibleStatus,
  recoveryEligibleStatusValues,
} from './domain/recovery-eligibility';
export {
  compareRecoveryCandidates,
  discoverStartupRecoveryCandidate,
  toRecoveryCandidate,
  type RecoveryCandidate,
  type StartupRecoveryDiscoveryOutcome,
  type StartupRecoveryDiscoveryResult,
} from './domain/startup-recovery-discovery';
export {
  decideForceConfirmRecovering,
  resolveDiscoveryResumeIntent,
  type DiscoveryResumeIntent,
  type ForceConfirmRecoveringAction,
  type RecoveringOpenResult,
} from './domain/force-confirm-recovering';
export {
  DEFAULT_RECOVERY_LEASE_TTL_MS,
  attachRecoveryLease,
  decideRecoveryLeaseAcquisition,
  toAcquisitionResult,
  type RecoveryLeaseAcquireCommand,
  type RecoveryLeaseAcquireDecision,
  type RecoveryLeaseAcquireOutcome,
  type RecoveryLeaseAcquireReason,
  type RecoveryLeaseAcquisitionResult,
  type RecoveryLeaseDenyReason,
} from './domain/recovery-lease-acquisition';
export {
  SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS,
  SUPPORTED_RECOVERY_RUNTIME_VERSIONS,
  toLeasedRecoverySession,
  validateRecoveryCheckpoint,
  type InvalidCheckpointReason,
  type LeasedRecoverySession,
  type RecoveryCheckpointValidationOutcome,
  type RecoveryCheckpointValidationResult,
  type ValidatedRecoveryCheckpoint,
} from './domain/recovery-checkpoint-validation';
export {
  reconcileRecoveryState,
  type ReconciliationFailedContext,
  type RecoveryReconciliationOutcome,
  type RecoveryRuntimeSnapshot,
  type RecoverySessionSnapshot,
  type RecoveryStateReconciliationInput,
  type RecoveryStateReconciliationResult,
} from './domain/recovery-state-reconciliation';
export {
  RecoveryEventAdmissionOperationalState,
  decideRecoveryEventAdmission,
  type EventAdmissionEnabledRuntimeState,
  type RecoveryEventAdmissionBlockedReason,
  type RecoveryEventAdmissionOutcome,
  type RecoveryEventAdmissionResult,
} from './domain/recovery-event-admission';
export {
  RecoveryRuntimeArmingOperationalState,
  decideRecoveryRuntimeArming,
  type ArmedRuntimeState,
  type RecoveryRuntimeArmingBlockedReason,
  type RecoveryRuntimeArmingOutcome,
  type RecoveryRuntimeArmingResult,
} from './domain/recovery-runtime-arming';
export {
  decideRecoveryStrategyEvaluation,
  type RecoveryStrategyEvaluationBlockedReason,
  type RecoveryStrategyEvaluationOutcome,
  type RecoveryStrategyEvaluationResult,
  type RestoredEvaluationContext,
} from './domain/recovery-strategy-evaluation';
export {
  decideRecoverySignalIntentGeneration,
  type RecoverySignalIntentGenerationBlockedReason,
  type RecoverySignalIntentGenerationOutcome,
  type RecoverySignalIntentGenerationResult,
  type SignalIntentGenerationPlan,
} from './domain/recovery-signal-intent-generation';
export {
  decideRecoveryCompletion,
  type RecoveryCompletionBlockedReason,
  type RecoveryCompletionOutcome,
  type RecoveryCompletionResult,
  type RecoveryCompletionTerminalCause,
  type RecoveryPipelineStageSnapshot,
  type RecoveryResumeIntent,
} from './domain/recovery-completion';
export {
  RecoveryRuntimeOperationalState,
  decideRecoveryRuntimeResume,
  type ReadyRuntimeState,
  type RecoveryRuntimeResumeBlockedReason,
  type RecoveryRuntimeResumeOutcome,
  type RecoveryRuntimeResumeResult,
} from './domain/recovery-runtime-resume';
export {
  TRADING_SESSION_SCHEMA_VERSION,
  TRADING_SESSION_ORIGINS,
  attachLease,
  clearLease,
  createTradingSession,
  isTradingSessionOrigin,
  transitionSession,
  type CreateTradingSessionInput,
  type TradingSession,
  type TradingSessionOrigin,
} from './domain/trading-session';
export {
  TradingSessionStatus,
  TERMINAL_SESSION_STATUSES,
  NON_EXECUTABLE_SESSION_STATUSES,
  isTradingSessionStatus,
} from './domain/trading-session-status';
export { canTransition, assertTransition } from './domain/session-transitions';
export {
  createSessionLease,
  heartbeatLease,
  isLeaseExpired,
  type SessionLease,
} from './domain/session-lease';
export {
  assertExecutionEligible,
  evaluateExecutionEligibility,
  type ExecutionEligibility,
  type ExecutionEligibilityDenied,
} from './domain/execution-eligibility';
export {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from './persistence/trading-session.repository';
export {
  DEFAULT_RUNTIME_LEASE_DURATION_MS,
  ExecutionMode,
  RecoveryStatus,
  SessionState,
  TradingSession as TradingSessionAggregate,
  isExecutionMode,
  isRecoveryStatus,
  isSessionState,
  type AcquireRuntimeLeaseOptions,
  type CreateTradingSessionProperties,
  type RecoveryStateProperties,
  type TradingSessionProperties,
} from './domain/trading-session-aggregate';
export {
  DuplicateRecoveryCompletionError,
  DuplicateRecoveryFailureError,
  DuplicateRuntimeLeaseError,
  DuplicateTradingSessionFailureError,
  ExpiredRuntimeLeaseError,
  InvalidRecoveryTimestampError,
  InvalidRuntimeHeartbeatTimestampError,
  InvalidLifecycleTimestampError,
  InvalidTradingSessionTransitionError,
  MissingRecoveryReasonError,
  MissingRuntimeLeaseError,
  MissingFailureReasonError,
  RecoveryAlreadyCompletedError,
  RecoveryInProgressError,
  RecoveryNotEligibleError,
  RecoveryNotInProgressError,
  RuntimeLeaseOwnerMismatchError,
  TradingSessionDomainError,
  type TradingSessionDomainErrorCode,
} from './domain/trading-session-errors';
export type {
  RuntimeHeartbeatExpired,
  RuntimeHeartbeatReceived,
  RuntimeLeaseAcquired,
  RuntimeLeaseExpired,
  RuntimeLeaseReleased,
  TradingSessionCreated,
  TradingSessionDomainEvent,
  TradingSessionFailed,
  TradingSessionPaused,
  TradingSessionRecoveryCompleted,
  TradingSessionRecoveryFailed,
  TradingSessionRecoverySkipped,
  TradingSessionRecoveryStarted,
  TradingSessionResumed,
  TradingSessionStarted,
  TradingSessionStopped,
} from './domain/trading-session-events';
export type { RecoveryStateRepository } from './domain/recovery-state.repository';
export { RECOVERY_STATE_REPOSITORY } from './domain/recovery-state.repository';
export type { RecoveryIncidentRepository } from './domain/recovery-incident.repository';
export { RECOVERY_INCIDENT_REPOSITORY } from './domain/recovery-incident.repository';
export {
  createRecoveryIncident,
  type RecoveryIncident,
  type RecoveryIncidentReasonClass,
} from './domain/recovery-incident';
export {
  RecoveryPhase,
  openDurableRecoveryState,
  advanceDurableRecoveryPhase,
  correlateIncidentOnFailedRecoveryState,
  finalizeDurableRecoveryState,
  isRecoveryPhase,
  type DurableRecoveryState,
} from './domain/durable-recovery-state';
export { RecoveryPhaseProgressService } from './recovery/recovery-phase-progress.service';
export {
  RecoveryIncidentFailClosedService,
  type RecoveryFailClosedResult,
} from './recovery/recovery-incident-fail-closed.service';
export type {
  TradingSessionAggregateRepository,
  TradingSessionRepository as TradingSessionDomainRepository,
} from './domain/trading-session-aggregate.repository';
export {
  DEFAULT_RUNTIME_HEARTBEAT_TIMEOUT_MS,
  RuntimeLease,
  type CreateRuntimeLeaseProperties,
  type RuntimeLeaseProperties,
} from './domain/runtime-lease';
export type { RuntimeLeaseRepository } from './domain/runtime-lease.repository';
