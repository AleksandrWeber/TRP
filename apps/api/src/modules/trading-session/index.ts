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
