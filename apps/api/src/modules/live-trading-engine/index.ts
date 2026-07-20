export { LiveTradingEngineModule } from './live-trading.module';
export { LiveTradingController } from './live-trading.controller';
export {
  LiveTradingService,
  type LiveSessionView,
  type LiveStatusView,
  type LiveSynchronizationView,
} from './live-trading.service';
export {
  LiveSessionManager,
  type StartLiveSessionRequest,
  type LiveTradingClock,
} from './live-session-manager';
export {
  LiveExecutionCoordinator,
  type LiveOrderRequest,
  type LiveOrderResult,
} from './live-execution-coordinator';
export { ConnectionSupervisor, type ConnectionHealthSample } from './connection-supervisor';
export {
  SynchronizationManager,
  type SynchronizationResult,
  type SyncInconsistency,
} from './synchronization-manager';
export { RecoveryManager, type RecoveryResult } from './recovery-manager';
export {
  EmergencyManager,
  type KillSwitchOptions,
  type KillSwitchResult,
} from './emergency-manager';
export {
  HealthMonitor,
  type LiveHealthReport,
  type LiveWorkspaceHealth,
  type LiveAlert,
} from './health-monitor';
export { LiveEventPublisher } from './live-event-publisher';
export { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';
export { PrismaLiveTradingRepository } from './prisma-live-trading.repository';
export {
  LiveTradingError,
  LiveSessionNotFoundError,
  LiveSessionInvalidStateError,
  LiveSessionValidationError,
  LiveSessionAlreadyActiveError,
  LiveExecutionFailedError,
  LiveOrderRejectedError,
  LiveSynchronizationFailedError,
  LiveRecoveryFailedError,
  LiveConnectionFailedError,
} from './live-trading-errors';
export {
  LIVE_TRADING_EVENT_TYPES,
  type LiveTradingDomainEvent,
  type LiveTradingEventType,
} from './live-trading-events';
export {
  createLiveSession,
  beginConnecting,
  markConnected,
  startLiveSession,
  pauseLiveSession,
  resumeLiveSession,
  beginReconnecting,
  stopLiveSession,
  failLiveSession,
  archiveLiveSession,
  withHeartbeat,
  withSynchronizationState,
  freezeTrading,
  unfreezeTrading,
  rehydrateLiveSession,
  liveSessionPortfolioWorkspaceKey,
  type LiveSession,
  type CreateLiveSessionInput,
} from './domain/live-session';
export {
  LIVE_SESSION_STATUSES,
  ACTIVE_LIVE_SESSION_STATUSES,
  TERMINAL_LIVE_SESSION_STATUSES,
  assertLiveSessionStatus,
  isLiveSessionStatus,
  isActiveLiveSessionStatus,
  isTerminalLiveSessionStatus,
  type LiveSessionStatus,
} from './domain/session-status';
export {
  SYNCHRONIZATION_STATES,
  assertSynchronizationState,
  isSynchronizationState,
  type SynchronizationState,
} from './domain/synchronization-state';
export {
  createLiveEventRecord,
  type LiveEventRecord,
  type CreateLiveEventInput,
} from './domain/live-event';
export {
  createSynchronizationLog,
  rehydrateSynchronizationLog,
  type SynchronizationLog,
  type CreateSynchronizationLogInput,
} from './domain/synchronization-log';
