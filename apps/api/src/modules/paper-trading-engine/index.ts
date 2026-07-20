export { PaperTradingEngineModule } from './paper-trading.module';
export { PaperTradingController } from './paper-trading.controller';
export { PaperTradingService, type PaperSessionView } from './paper-trading.service';
export {
  PaperSessionManager,
  type CreateSessionRequest,
  type PaperTradingClock,
} from './paper-session-manager';
export {
  PaperExecutionCoordinator,
  type PaperTradeRequest,
  type PaperTradeResult,
} from './paper-execution-coordinator';
export { PaperEventPublisher } from './paper-event-publisher';
export { PAPER_TRADING_REPOSITORY, type PaperTradingRepository } from './paper-trading.repository';
export { PrismaPaperTradingRepository } from './prisma-paper-trading.repository';
export {
  generatePaperSessionStatistics,
  type PaperSessionStatistics,
} from './paper-session-statistics';
export {
  PaperTradingError,
  PaperSessionNotFoundError,
  PaperSessionInvalidStateError,
  PaperSessionValidationError,
  PaperExecutionFailedError,
  PaperOrderRejectedError,
} from './paper-trading-errors';
export {
  PAPER_TRADING_EVENT_TYPES,
  type PaperTradingDomainEvent,
  type PaperTradingEventType,
} from './paper-trading-events';
export {
  createPaperSession,
  startPaperSession,
  pausePaperSession,
  stopPaperSession,
  completePaperSession,
  archivePaperSession,
  withSessionBalance,
  rehydratePaperSession,
  paperSessionPortfolioWorkspaceKey,
  type PaperSession,
  type CreatePaperSessionInput,
} from './domain/paper-session';
export {
  PAPER_SESSION_STATUSES,
  assertPaperSessionStatus,
  isPaperSessionStatus,
  isTerminalPaperSessionStatus,
  type PaperSessionStatus,
} from './domain/session-status';
export {
  createPaperExecution,
  rehydratePaperExecution,
  type PaperExecution,
  type CreatePaperExecutionInput,
} from './domain/paper-execution';
export {
  createPaperEventRecord,
  type PaperEventRecord,
  type CreatePaperEventInput,
} from './domain/paper-event';
