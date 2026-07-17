import type { MarketBar } from '../market-data/market-bar';
import type { PortfolioEngine } from '../portfolio/portfolio-engine';
import type { TradeEngine } from '../trade/trade-engine';

/**
 * Context supplied to Strategy hooks during a backtest (US121).
 * Strategies may call TradeEngine from onBar().
 */
export type StrategyContext = {
  trades: TradeEngine;
  portfolio: PortfolioEngine;
};

/**
 * Trading strategy contract for historical backtesting (US118 / US121).
 * Called sequentially: initialize → onBar(bar)* → finalize.
 * No paper / live trading.
 */
export interface Strategy {
  initialize(context: StrategyContext): void | Promise<void>;
  onBar(bar: MarketBar, context: StrategyContext): void | Promise<void>;
  finalize(context: StrategyContext): void | Promise<void>;
}
