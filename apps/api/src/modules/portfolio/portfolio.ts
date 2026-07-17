import type { PortfolioId } from './portfolio-id';
import type { PortfolioStatus } from './portfolio-status';

/**
 * Portfolio aggregate for backtest simulation (US120).
 * State only — no order matching / broker / live trading.
 */
export type Portfolio = {
  id: PortfolioId;
  workspaceId: string;
  initialCapital: number;
  currentCapital: number;
  equity: number;
  cash: number;
  status: PortfolioStatus;
};
