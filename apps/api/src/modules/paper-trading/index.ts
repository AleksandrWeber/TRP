export { PaperTradingModule } from './paper-trading.module';
export { PaperTradingController } from './paper-trading.controller';
export { PaperTradingEngine } from './paper-trading.engine';
export { PaperTradingService } from './paper-trading.service';
export { PositionManager } from './position-manager';
export { PositionRegistry } from './position-registry';
export { TradeHistory } from './trade-history';
export { PnLCalculator } from './pnl-calculator';
export type { OpenPositionPnL, PortfolioSummary } from './pnl-calculator';
export {
  createPaperPosition,
  PAPER_POSITION_SIDES,
  PAPER_POSITION_STATUSES,
} from './domain/paper-position';
export type {
  PaperPosition,
  PaperPositionSide,
  PaperPositionStatus,
} from './domain/paper-position';
export { createTradeResult, PAPER_TRADE_ACTIONS } from './domain/trade-result';
export type { PaperTradeAction, TradeResult } from './domain/trade-result';
