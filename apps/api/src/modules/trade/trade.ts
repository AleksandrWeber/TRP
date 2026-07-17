import type { Instrument } from '../market-data/instrument';
import type { PortfolioId } from '../portfolio/portfolio-id';
import type { TradeId } from './trade-id';
import type { TradeSide } from './trade-side';
import type { TradeStatus } from './trade-status';

/**
 * Virtual trade for backtest simulation (US121).
 * No broker / slippage / commission / leverage / live trading.
 */
export type Trade = {
  id: TradeId;
  portfolioId: PortfolioId;
  instrument: Instrument;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTimestamp: string;
  exitTimestamp?: string;
  status: TradeStatus;
};
