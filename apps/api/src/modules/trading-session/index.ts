export { TradingSessionModule } from './trading-session.module';
export { TradingSessionService } from './trading-session.service';
export type {
  CreateTradingSessionCommand,
  SessionLifecycleCommand,
} from './trading-session.service';
export {
  TRADING_SESSION_SCHEMA_VERSION,
  attachLease,
  clearLease,
  createTradingSession,
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
