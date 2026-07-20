export { PaperTradingExecutorModule } from './paper-trading-executor.module';
export { PaperTradingExecutorController } from './paper-trading-executor.controller';
export { PaperTradingExecutorService } from './paper-trading-executor.service';
export { PaperTradingExecutorErrorFilter } from './paper-trading-executor-error.filter';
export { ExecutorPortfolioStore } from './executor-portfolio-store';
export { executeVirtualSignal } from './virtual-signal-executor';
export type { VirtualSignalExecutionInput } from './virtual-signal-executor';
export {
  createExecutedTrade,
  EXECUTED_TRADE_SIDES,
  EXECUTED_TRADE_STATUSES,
} from './domain/executed-trade';
export type {
  ExecutedTrade,
  ExecutedTradeSide,
  ExecutedTradeStatus,
} from './domain/executed-trade';
export { freezeSignalStats, freezeStrategyPortfolio } from './domain/strategy-portfolio';
export type { SignalStats, StrategyPortfolio } from './domain/strategy-portfolio';
export { createSignalExecution, SIGNAL_EXECUTION_STATUSES } from './domain/signal-execution';
export type { SignalExecution, SignalExecutionStatus } from './domain/signal-execution';
export {
  PaperTradingExecutorError,
  ExecutorPortfolioNotFoundError,
  PAPER_TRADING_EXECUTOR_ERROR_CODES,
} from './domain/paper-trading-executor.error';
export type { PaperTradingExecutorErrorCode } from './domain/paper-trading-executor.error';
